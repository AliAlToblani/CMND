import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { FileText, CheckCircle2, Clock, Loader2, AlertCircle, ArrowUpDown, CalendarDays, SortAsc, SortDesc } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PendingProposalCustomer {
  id: string;
  name: string;
  logo?: string | null;
  proposal_sent_date?: string;
  proposal_approved_status?: 'not-started' | 'in-progress' | 'done' | null;
  stage?: string | null;
  days_pending?: number;
}

type SortOption = 'days-desc' | 'days-asc' | 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc';

export function PendingProposals() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<PendingProposalCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('days-desc');

  useEffect(() => {
    fetchPendingProposals();
  }, []);

  // Sort customers based on selected option
  const sortedCustomers = useMemo(() => {
    const sorted = [...customers];
    
    switch (sortBy) {
      case 'days-desc':
        return sorted.sort((a, b) => (b.days_pending || 0) - (a.days_pending || 0));
      case 'days-asc':
        return sorted.sort((a, b) => (a.days_pending || 0) - (b.days_pending || 0));
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'date-desc':
        return sorted.sort((a, b) => {
          if (!a.proposal_sent_date) return 1;
          if (!b.proposal_sent_date) return -1;
          return new Date(b.proposal_sent_date).getTime() - new Date(a.proposal_sent_date).getTime();
        });
      case 'date-asc':
        return sorted.sort((a, b) => {
          if (!a.proposal_sent_date) return 1;
          if (!b.proposal_sent_date) return -1;
          return new Date(a.proposal_sent_date).getTime() - new Date(b.proposal_sent_date).getTime();
        });
      default:
        return sorted;
    }
  }, [customers, sortBy]);

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

        // Calculate days since proposal was sent
        let daysPending = 0;
        if (proposalSent?.status_changed_at) {
          daysPending = differenceInDays(new Date(), new Date(proposalSent.status_changed_at));
        }

        return {
          id: customer.id,
          name: customer.name,
          logo: customer.logo,
          proposal_sent_date: proposalSent?.status_changed_at,
          proposal_approved_status: proposalApproved?.status || 'not-started',
          stage: customer.stage,
          days_pending: daysPending
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

  const getDaysUrgencyClass = (days: number) => {
    if (days >= 30) return 'bg-red-100 text-red-700 border-red-200';
    if (days >= 14) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (days >= 7) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getDaysLabel = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
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
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Proposals ({customers.length})
          </CardTitle>
          
          {customers.length > 0 && (
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[180px] h-9">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days-desc">
                  <span className="flex items-center gap-2">
                    <SortDesc className="h-3 w-3" />
                    Days Pending (High)
                  </span>
                </SelectItem>
                <SelectItem value="days-asc">
                  <span className="flex items-center gap-2">
                    <SortAsc className="h-3 w-3" />
                    Days Pending (Low)
                  </span>
                </SelectItem>
                <SelectItem value="date-desc">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-3 w-3" />
                    Date Sent (Newest)
                  </span>
                </SelectItem>
                <SelectItem value="date-asc">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-3 w-3" />
                    Date Sent (Oldest)
                  </span>
                </SelectItem>
                <SelectItem value="name-asc">
                  <span className="flex items-center gap-2">
                    <SortAsc className="h-3 w-3" />
                    Name (A-Z)
                  </span>
                </SelectItem>
                <SelectItem value="name-desc">
                  <span className="flex items-center gap-2">
                    <SortDesc className="h-3 w-3" />
                    Name (Z-A)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
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
              {sortedCustomers.map(customer => (
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
                        <div className="flex items-center gap-2">
                          {/* Days Pending Badge */}
                          {customer.days_pending !== undefined && (
                            <Badge 
                              variant="outline" 
                              className={`font-semibold ${getDaysUrgencyClass(customer.days_pending)}`}
                            >
                              <CalendarDays className="h-3 w-3 mr-1" />
                              {getDaysLabel(customer.days_pending)}
                            </Badge>
                          )}
                          {getStatusBadge(customer.proposal_approved_status)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {customer.proposal_sent_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Sent: {format(new Date(customer.proposal_sent_date), 'MMM d, yyyy')}
                          </span>
                        )}
                        {customer.stage && (
                          <Badge variant="outline" className="text-xs">
                            {customer.stage}
                          </Badge>
                        )}
                      </div>
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
