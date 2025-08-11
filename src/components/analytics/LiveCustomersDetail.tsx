import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/customerUtils";
import { Building2, DollarSign, Calendar, ExternalLink } from "lucide-react";

interface LiveCustomer {
  id: string;
  name: string;
  logo: string | null;
  segment: string | null;
  country: string | null;
  go_live_date: string | null;
  contract_count: number;
  total_value: number;
  annual_rate: number;
  setup_fee: number;
}

export const LiveCustomersDetail = () => {
  const [customers, setCustomers] = useState<LiveCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLiveCustomers = async () => {
      try {
        // Get customers with active contracts
        const { data, error } = await supabase
          .from('customers')
          .select(`
            id,
            name,
            logo,
            segment,
            country,
            go_live_date,
            contracts!inner(
              id,
              value,
              setup_fee,
              annual_rate,
              status,
              end_date
            )
          `)
          .neq('status', 'churned');

        if (error) throw error;

        // Process customers with active contracts
        const liveCustomers = (data || []).map(customer => {
          const activeContracts = (customer.contracts as any[]).filter(contract => 
            ['active', 'pending'].includes(contract.status) && 
            new Date(contract.end_date) > new Date()
          );

          if (activeContracts.length === 0) return null;

          const totalValue = activeContracts.reduce((sum, contract) => {
            return sum + (contract.setup_fee + contract.annual_rate || contract.value || 0);
          }, 0);

          const totalAnnual = activeContracts.reduce((sum, contract) => {
            return sum + (contract.annual_rate || 0);
          }, 0);

          const totalSetup = activeContracts.reduce((sum, contract) => {
            return sum + (contract.setup_fee || 0);
          }, 0);

          return {
            id: customer.id,
            name: customer.name,
            logo: customer.logo,
            segment: customer.segment,
            country: customer.country,
            go_live_date: customer.go_live_date,
            contract_count: activeContracts.length,
            total_value: totalValue,
            annual_rate: totalAnnual,
            setup_fee: totalSetup
          };
        }).filter(Boolean) as LiveCustomer[];

        // Sort by total value descending
        liveCustomers.sort((a, b) => b.total_value - a.total_value);
        
        setCustomers(liveCustomers);
      } catch (error) {
        console.error("Error fetching live customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveCustomers();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        {Array(8).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const totalRevenue = customers.reduce((sum, customer) => sum + customer.total_value, 0);
  const averageRevenue = totalRevenue / customers.length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Live Customers Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{customers.length}</p>
              <p className="text-sm text-muted-foreground">Live Customers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(averageRevenue)}</p>
              <p className="text-sm text-muted-foreground">Average Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {customers.reduce((sum, customer) => sum + customer.contract_count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Active Contracts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Grid */}
      <div className="grid gap-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={customer.logo || undefined} alt={customer.name} />
                    <AvatarFallback>
                      {customer.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <Badge variant="outline">{customer.segment || "Unknown"}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>🌍 {customer.country || "Unknown"}</span>
                      <span>{customer.contract_count} contract{customer.contract_count !== 1 ? 's' : ''}</span>
                    </div>
                    
                    {customer.go_live_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Live since {new Date(customer.go_live_date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {customer.setup_fee > 0 && customer.annual_rate > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Setup: </span>
                        <span className="font-medium">{formatCurrency(customer.setup_fee)}</span>
                        <span className="text-muted-foreground ml-4">Annual: </span>
                        <span className="font-medium">{formatCurrency(customer.annual_rate)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(customer.total_value)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {customers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No live customers found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};