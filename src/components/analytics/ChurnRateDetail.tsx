import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown, ExternalLink, Info } from "lucide-react";
import { format } from "date-fns";

interface ChurnedCustomer {
  id: string;
  name: string;
  churn_date: string | null;
  updated_at?: string;
  inPeriod: boolean;
}

interface ChurnRateDetailProps {
  countries?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export const ChurnRateDetail = ({ countries, dateFrom, dateTo }: ChurnRateDetailProps) => {
  const [allChurnedCustomers, setAllChurnedCustomers] = useState<ChurnedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [churnRate, setChurnRate] = useState(0);
  const [churnedInPeriod, setChurnedInPeriod] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [baseForChurn, setBaseForChurn] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChurnData = async () => {
      try {
        // Churn rate - last 6 months, only among customers who have (or had) contracts
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

        const { data: contractsData, error: contractsError } = await supabase
          .from('contracts')
          .select('customer_id');
        if (contractsError) throw contractsError;

        const customerIdsWithContracts = new Set(
          (contractsData || []).map((c: any) => c.customer_id).filter(Boolean)
        );
        if (customerIdsWithContracts.size === 0) {
          setAllChurnedCustomers([]);
          setChurnedInPeriod(0);
          setTotalCustomers(0);
          setBaseForChurn(0);
          setChurnRate(0);
          setLoading(false);
          return;
        }

        let allCustomersQuery = supabase
          .from('customers')
          .select('id, name, status, stage, churn_date, updated_at, country, created_at')
          .in('id', Array.from(customerIdsWithContracts));

        if (countries && countries.length > 0) {
          allCustomersQuery = allCustomersQuery.in('country', countries);
        }
        if (dateFrom) {
          allCustomersQuery = allCustomersQuery.gte('created_at', dateFrom.toISOString());
        }
        if (dateTo) {
          allCustomersQuery = allCustomersQuery.lte('created_at', dateTo.toISOString());
        }

        const { data: allCustomers, error } = await allCustomersQuery;
        if (error) throw error;

        const isLostStage = (stage?: string | null) => stage?.toLowerCase() === 'lost';

        const customersWithContracts = allCustomers || [];

        const activeCustomers = customersWithContracts.filter(c =>
          c.status !== 'churned' && !isLostStage(c.stage)
        );
        const totalActive = activeCustomers.length;

        const churned = customersWithContracts.filter(c => c.status === 'churned');
        const churnedInLast6Months = churned.filter(c =>
          c.churn_date && new Date(c.churn_date) >= sixMonthsAgo
        );
        const churnedAllInPeriod = churnedInLast6Months.length;

        const base = totalActive + churnedAllInPeriod;
        const rate = base > 0 ? (churnedAllInPeriod / base) * 100 : 0;

        const churnedWithFlag = churned.map(c => ({
          id: c.id,
          name: c.name,
          churn_date: c.churn_date,
          updated_at: c.updated_at,
          inPeriod: !!(c.churn_date && new Date(c.churn_date) >= sixMonthsAgo),
        }));

        churnedWithFlag.sort((a, b) => {
          if (a.inPeriod !== b.inPeriod) return a.inPeriod ? -1 : 1;
          const dateA = a.churn_date ? new Date(a.churn_date).getTime() : 0;
          const dateB = b.churn_date ? new Date(b.churn_date).getTime() : 0;
          return dateB - dateA;
        });

        setAllChurnedCustomers(churnedWithFlag);
        setChurnedInPeriod(churnedAllInPeriod);
        setTotalCustomers(totalActive);
        setBaseForChurn(base);
        setChurnRate(rate);
      } catch (error) {
        console.error("Error fetching churn data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChurnData();
  }, [countries, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const formatChurnDate = (customer: ChurnedCustomer) => {
    if (customer.churn_date) {
      return format(new Date(customer.churn_date), 'MMM dd, yyyy');
    }
    if (customer.updated_at) {
      return `~${format(new Date(customer.updated_at), 'MMM dd, yyyy')}`;
    }
    return 'Unknown date';
  };

  if (allChurnedCustomers.length === 0) {
    return (
      <div className="space-y-6">
        {/* Calculation Explanation */}
        <div className="flex items-start gap-3 bg-muted/50 border border-border rounded-lg p-4">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">How it's calculated:</span>{" "}
            Churn rate (last 6 months) among clients with contracts. Churned in period ÷ (active + churned in period).
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Churn Rate (6 months, clients with contracts): 0.0%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No customers churned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg text-muted-foreground">Excellent retention! No churned customers.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calculation Explanation */}
      <div className="flex items-start gap-3 bg-muted/50 border border-border rounded-lg p-4">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">How it's calculated:</span>{" "}
          Last 6 months, clients with contracts. Churned in period ({churnedInPeriod}) ÷ (active ({totalCustomers}) + churned in period ({churnedInPeriod})) = {churnedInPeriod} / {baseForChurn} = {churnRate.toFixed(1)}%
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Churn Rate (6 months, clients with contracts): {churnRate.toFixed(1)}%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-red-600">{churnedInPeriod}</p>
              <p className="text-sm text-muted-foreground">Churned (6 months)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{totalCustomers}</p>
              <p className="text-sm text-muted-foreground">Active (with contracts)</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{baseForChurn}</p>
              <p className="text-sm text-muted-foreground">Total (Active + Churned)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Churned in last 6 months (counted in rate) */}
      {churnedInPeriod > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Churned in Last 6 Months ({churnedInPeriod})</h3>
          {allChurnedCustomers.filter(c => c.inPeriod).map(customer => (
            <Card 
              key={customer.id}
              className="cursor-pointer hover:bg-accent transition-colors border-red-200"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium flex-1">{customer.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-red-600 font-medium">
                      {formatChurnDate(customer)}
                    </p>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Older churned (not in 6-month rate) */}
      {allChurnedCustomers.filter(c => !c.inPeriod).length > 0 && (
        <div className="space-y-2 opacity-75">
          <h3 className="text-sm font-medium text-muted-foreground">
            Churned Before 6 Months ({allChurnedCustomers.filter(c => !c.inPeriod).length}) — not in rate
          </h3>
          {allChurnedCustomers.filter(c => !c.inPeriod).map(customer => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium flex-1">{customer.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{formatChurnDate(customer)}</p>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
