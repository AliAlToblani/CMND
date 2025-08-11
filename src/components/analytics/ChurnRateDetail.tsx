import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/customerUtils";
import { TrendingDown, Calendar, Users, ExternalLink, AlertTriangle } from "lucide-react";

interface ChurnedCustomer {
  id: string;
  name: string;
  logo: string | null;
  segment: string | null;
  country: string | null;
  churn_date: string;
  churn_method: string;
  contract_size: number;
  days_since_churn: number;
  months_as_customer: number;
}

interface ChurnData {
  monthly: { rate: number; count: number; period: string };
  quarterly: { rate: number; count: number; period: string };
  yearly: { rate: number; count: number; period: string };
  churned_customers: ChurnedCustomer[];
  churn_by_segment: Record<string, { count: number; percentage: number }>;
  churn_by_method: Record<string, { count: number; percentage: number }>;
  total_lost_revenue: number;
}

export const ChurnRateDetail = () => {
  const [data, setData] = useState<ChurnData>({
    monthly: { rate: 0, count: 0, period: '' },
    quarterly: { rate: 0, count: 0, period: '' },
    yearly: { rate: 0, count: 0, period: '' },
    churned_customers: [],
    churn_by_segment: {},
    churn_by_method: {},
    total_lost_revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChurnData = async () => {
      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        // Get all customers
        const { data: allCustomers, error: allError } = await supabase
          .from('customers')
          .select('*');

        if (allError) throw allError;

        // Get churned customers
        const { data: churnedCustomers, error: churnError } = await supabase
          .from('customers')
          .select('*')
          .eq('status', 'churned')
          .not('churn_date', 'is', null)
          .order('churn_date', { ascending: false });

        if (churnError) throw churnError;

        const total = allCustomers?.length || 0;
        const totalChurned = churnedCustomers?.length || 0;

        // Calculate churn rates for different periods
        const monthlyChurned = churnedCustomers?.filter(c => 
          new Date(c.churn_date) >= thirtyDaysAgo
        ).length || 0;
        
        const quarterlyChurned = churnedCustomers?.filter(c => 
          new Date(c.churn_date) >= ninetyDaysAgo
        ).length || 0;
        
        const yearlyChurned = churnedCustomers?.filter(c => 
          new Date(c.churn_date) >= oneYearAgo
        ).length || 0;

        const monthlyRate = total > 0 ? (monthlyChurned / total) * 100 : 0;
        const quarterlyRate = total > 0 ? (quarterlyChurned / total) * 100 : 0;
        const yearlyRate = total > 0 ? (yearlyChurned / total) * 100 : 0;

        // Process churned customers
        const processedChurned = (churnedCustomers || []).map(customer => {
          const churnDate = new Date(customer.churn_date);
          const createdDate = new Date(customer.created_at);
          const daysSinceChurn = Math.floor((now.getTime() - churnDate.getTime()) / (1000 * 60 * 60 * 24));
          const monthsAsCustomer = Math.floor((churnDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

          return {
            id: customer.id,
            name: customer.name,
            logo: customer.logo,
            segment: customer.segment,
            country: customer.country,
            churn_date: customer.churn_date,
            churn_method: customer.churn_method || 'Unknown',
            contract_size: customer.contract_size || 0,
            days_since_churn: daysSinceChurn,
            months_as_customer: Math.max(monthsAsCustomer, 0)
          };
        });

        // Group by segment
        const segmentGroups = processedChurned.reduce((acc, customer) => {
          const segment = customer.segment || 'Unknown';
          if (!acc[segment]) acc[segment] = { count: 0, percentage: 0 };
          acc[segment].count++;
          return acc;
        }, {} as Record<string, { count: number; percentage: number }>);

        Object.keys(segmentGroups).forEach(segment => {
          segmentGroups[segment].percentage = (segmentGroups[segment].count / totalChurned) * 100;
        });

        // Group by churn method
        const methodGroups = processedChurned.reduce((acc, customer) => {
          const method = customer.churn_method;
          if (!acc[method]) acc[method] = { count: 0, percentage: 0 };
          acc[method].count++;
          return acc;
        }, {} as Record<string, { count: number; percentage: number }>);

        Object.keys(methodGroups).forEach(method => {
          methodGroups[method].percentage = (methodGroups[method].count / totalChurned) * 100;
        });

        const totalLostRevenue = processedChurned.reduce((sum, customer) => sum + customer.contract_size, 0);

        setData({
          monthly: { 
            rate: monthlyRate, 
            count: monthlyChurned, 
            period: `Last 30 days`
          },
          quarterly: { 
            rate: quarterlyRate, 
            count: quarterlyChurned, 
            period: `Last 90 days`
          },
          yearly: { 
            rate: yearlyRate, 
            count: yearlyChurned, 
            period: `Last 12 months`
          },
          churned_customers: processedChurned,
          churn_by_segment: segmentGroups,
          churn_by_method: methodGroups,
          total_lost_revenue: totalLostRevenue
        });
      } catch (error) {
        console.error("Error fetching churn data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChurnData();
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

  return (
    <div className="space-y-6">
      {/* Churn Rate Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingDown className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold text-red-500">{data.monthly.rate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Monthly Churn Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingDown className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold text-orange-500">{data.quarterly.rate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Quarterly Churn Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{data.churned_customers.length}</p>
            <p className="text-sm text-muted-foreground">Total Churned</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <p className="text-lg font-bold text-red-600">{formatCurrency(data.total_lost_revenue)}</p>
            <p className="text-sm text-muted-foreground">Lost Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Churn Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Churn Rate Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Monthly</h3>
              <p className="text-2xl font-bold text-red-500">{data.monthly.rate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">{data.monthly.count} customers in {data.monthly.period}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Quarterly</h3>
              <p className="text-2xl font-bold text-orange-500">{data.quarterly.rate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">{data.quarterly.count} customers in {data.quarterly.period}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Yearly</h3>
              <p className="text-2xl font-bold text-blue-500">{data.yearly.rate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">{data.yearly.count} customers in {data.yearly.period}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Churn by Segment */}
      <Card>
        <CardHeader>
          <CardTitle>Churn by Segment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.churn_by_segment)
              .sort(([,a], [,b]) => b.count - a.count)
              .map(([segment, stats]) => (
                <div key={segment} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{segment}</span>
                    <Badge variant="outline">{stats.count} customers</Badge>
                  </div>
                  <span className="font-bold text-red-500">{stats.percentage.toFixed(1)}%</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Churn by Method */}
      <Card>
        <CardHeader>
          <CardTitle>Churn by Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.churn_by_method)
              .sort(([,a], [,b]) => b.count - a.count)
              .map(([method, stats]) => (
                <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{method}</span>
                    <Badge variant="outline">{stats.count} customers</Badge>
                  </div>
                  <span className="font-bold text-red-500">{stats.percentage.toFixed(1)}%</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Churned Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Churned Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.churned_customers.slice(0, 10).map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{customer.name}</h3>
                    <Badge variant="destructive">Churned</Badge>
                    {customer.segment && <Badge variant="outline">{customer.segment}</Badge>}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Churned {new Date(customer.churn_date).toLocaleDateString()}</span>
                    </div>
                    <span>🌍 {customer.country || "Unknown"}</span>
                    <span>Method: {customer.churn_method}</span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Customer for {customer.months_as_customer} months • {customer.days_since_churn} days since churn
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-500">
                      -{formatCurrency(customer.contract_size)}
                    </p>
                    <p className="text-sm text-muted-foreground">Lost Revenue</p>
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
          
          {data.churned_customers.length > 10 && (
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing 10 of {data.churned_customers.length} churned customers
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {data.churned_customers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="space-y-2">
              <p className="text-lg font-medium text-green-600">🎉 Excellent retention!</p>
              <p className="text-muted-foreground">No customers have churned yet</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};