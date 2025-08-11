import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/customerUtils";
import { TrendingUp, Calendar, DollarSign, ExternalLink } from "lucide-react";

interface MRRCustomer {
  id: string;
  name: string;
  logo: string | null;
  segment: string | null;
  monthly_revenue: number;
  contracts: Array<{
    id: string;
    name: string;
    annual_rate: number;
    payment_frequency: string;
    status: string;
  }>;
}

export const MRRDetail = () => {
  const [customers, setCustomers] = useState<MRRCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMRR, setTotalMRR] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMRRData = async () => {
      try {
        // Get customers with active contracts
        const { data, error } = await supabase
          .from('customers')
          .select(`
            id,
            name,
            logo,
            segment,
            contracts!inner(
              id,
              name,
              annual_rate,
              payment_frequency,
              status,
              end_date
            )
          `)
          .neq('status', 'churned');

        if (error) throw error;

        const mrrCustomers: MRRCustomer[] = [];
        let total = 0;

        (data || []).forEach(customer => {
          const activeContracts = (customer.contracts as any[]).filter(contract => 
            ['active', 'pending'].includes(contract.status) && 
            new Date(contract.end_date) > new Date()
          );

          if (activeContracts.length === 0) return;

          let customerMRR = 0;

          activeContracts.forEach(contract => {
            const annualRate = contract.annual_rate || 0;
            if (annualRate > 0) {
              customerMRR += annualRate / 12; // Convert annual to monthly
            }
          });

          if (customerMRR > 0) {
            mrrCustomers.push({
              id: customer.id,
              name: customer.name,
              logo: customer.logo,
              segment: customer.segment,
              monthly_revenue: customerMRR,
              contracts: activeContracts
            });
            total += customerMRR;
          }
        });

        // Sort by MRR descending
        mrrCustomers.sort((a, b) => b.monthly_revenue - a.monthly_revenue);

        setCustomers(mrrCustomers);
        setTotalMRR(total);
      } catch (error) {
        console.error("Error fetching MRR data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMRRData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        {Array(8).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const averageMRR = customers.length > 0 ? totalMRR / customers.length : 0;
  const projectedARR = totalMRR * 12;
  const topCustomers = customers.slice(0, 5);
  const topCustomersMRR = topCustomers.reduce((sum, c) => sum + c.monthly_revenue, 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalMRR)}</p>
            <p className="text-sm text-muted-foreground">Total MRR</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{formatCurrency(projectedARR)}</p>
            <p className="text-sm text-muted-foreground">Projected ARR</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{customers.length}</p>
            <p className="text-sm text-muted-foreground">Contributing Customers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{formatCurrency(averageMRR)}</p>
            <p className="text-sm text-muted-foreground">Average MRR</p>
          </CardContent>
        </Card>
      </div>

      {/* Top MRR Contributors */}
      <Card>
        <CardHeader>
          <CardTitle>Top MRR Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="font-medium">{customer.name}</span>
                  <Badge variant="secondary">{customer.segment || "Unknown"}</Badge>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(customer.monthly_revenue)}</p>
                  <p className="text-sm text-muted-foreground">
                    {((customer.monthly_revenue / totalMRR) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            ))}
            <div className="text-center pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Top 5 customers contribute {formatCurrency(topCustomersMRR)} ({((topCustomersMRR / totalMRR) * 100).toFixed(1)}% of total MRR)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MRR by Segment */}
      <Card>
        <CardHeader>
          <CardTitle>MRR by Segment</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const segmentGroups = customers.reduce((acc, customer) => {
              const segment = customer.segment || 'Unknown';
              if (!acc[segment]) {
                acc[segment] = { mrr: 0, count: 0, percentage: 0 };
              }
              acc[segment].mrr += customer.monthly_revenue;
              acc[segment].count++;
              return acc;
            }, {} as Record<string, { mrr: number; count: number; percentage: number }>);

            // Calculate percentages
            Object.keys(segmentGroups).forEach(segment => {
              segmentGroups[segment].percentage = (segmentGroups[segment].mrr / totalMRR) * 100;
            });

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(segmentGroups)
                  .sort(([,a], [,b]) => b.mrr - a.mrr)
                  .map(([segment, data]) => (
                    <div key={segment} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{segment}</h3>
                        <Badge variant="outline">{data.count} customers</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-bold text-primary">{formatCurrency(data.mrr)}</p>
                        <p className="text-sm text-muted-foreground">{data.percentage.toFixed(1)}% of total MRR</p>
                      </div>
                    </div>
                  ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* All MRR Contributors */}
      <Card>
        <CardHeader>
          <CardTitle>All MRR Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{customer.name}</h3>
                    <Badge variant="outline">{customer.segment || "Unknown"}</Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {customer.contracts.length} active contract{customer.contracts.length !== 1 ? 's' : ''}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {customer.contracts.map(contract => (
                      <Badge key={contract.id} variant="secondary" className="text-xs">
                        {contract.name}: {formatCurrency(contract.annual_rate / 12)}/mo
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(customer.monthly_revenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {((customer.monthly_revenue / totalMRR) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {customers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No MRR data found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};