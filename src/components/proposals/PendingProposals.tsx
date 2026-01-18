import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { FileText, CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PendingProposalCustomer {
  id: string;
  name: string;
  logo?: string | null;
  proposal_sent_date?: string;
  proposal_approved_status?: 'not-started' | 'in-progress' | 'done' | null;
  stage?: string | null;
}

export function PendingProposals() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<PendingProposalCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingProposals();
  }, []);

  const fetchPendingProposals = async () => {
    try {
      setLoading(true);
      
      // Fetch all customers
      const { data: allCustomers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, logo, stage');

      if (customersError) throw customersError;

      // Fetch lifecycle stages for "Proposal Sent" and "Proposal Approved"
      const { data: lifecycleStages, error: stagesError } = await supabase
        .from('lifecycle_stages')
        .select('customer_id, name, status, status_changed_at')
        .in('name', ['Proposal Sent', 'Proposal Approved']);

      if (stagesError) throw stagesError;

      // Build a map of customer_id -> stages
      const customerStagesMap = new Map<string, Map<string, any>>();
      
      lifecycleStages?.forEach((stage: any) => {
        if (!customerStagesMap.has(stage.customer_id)) {
          customerStagesMap.set(stage.customer_id, new Map());
        }
        const stages = customerStagesMap.get(stage.customer_id)!;
        stages.set(stage.name, stage);
      });

      // Filter customers: Proposal Sent = done, Proposal Approved = not started or in progress
      const pending = (allCustomers || []).filter(customer => {
        const stages = customerStagesMap.get(customer.id);
        if (!stages) return false;

        const proposalSent = stages.get('Proposal Sent');
        const proposalApproved = stages.get('Proposal Approved');

        // Proposal Sent must be done
        if (!proposalSent || proposalSent.status !== 'done') return false;

        // Proposal Approved must be not started or in progress
        if (!proposalApproved) return true; // No Proposal Approved stage = not started
        if (proposalApproved.status === 'not-started' || proposalApproved.status === 'in-progress') {
          return true;
        }

        return false;
      }).map(customer => {
        const stages = customerStagesMap.get(customer.id)!;
        const proposalSent = stages.get('Proposal Sent');
        const proposalApproved = stages.get('Proposal Approved');

        return {
          id: customer.id,
          name: customer.name,
          logo: customer.logo,
          proposal_sent_date: proposalSent?.status_changed_at,
          proposal_approved_status: proposalApproved?.status || 'not-started',
          stage: customer.stage
        };
      });

      setCustomers(pending);
    } catch (error) {
      console.error('Error fetching pending proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status || status === 'not-started') {
      return <Badge variant="outline" className="bg-gray-100 text-gray-700"><Clock className="h-3 w-3 mr-1" />Not Started</Badge>;
    }
    if (status === 'in-progress') {
      return <Badge variant="default" className="bg-blue-100 text-blue-700"><Loader2 className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>;
    }
    return null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Pending Proposals ({customers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No pending proposals</p>
            <p className="text-xs mt-1">All proposals have been approved or no proposals have been sent yet.</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-4">
              {customers.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={customer.logo || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {getInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-base truncate">{customer.name}</h3>
                        {getStatusBadge(customer.proposal_approved_status)}
                      </div>
                      
                      {customer.proposal_sent_date && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Sent: {format(new Date(customer.proposal_sent_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      
                      {customer.stage && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {customer.stage}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
