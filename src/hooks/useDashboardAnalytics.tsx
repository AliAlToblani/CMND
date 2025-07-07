import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/customerUtils";

interface DashboardAnalytics {
  totalARR: number;
  formattedARR: string;
  liveCustomersCount: number;
  totalCustomersCount: number;
  dealsPipelineValue: number;
  formattedDealsPipeline: string;
  dealsPipelineCount: number;
  salesLifecycleDays: number;
  avgGoLiveDays: number;
  growthRate: number;
  churnRate: number;
  isLoading: boolean;
  error: string | null;
}

export const useDashboardAnalytics = (): DashboardAnalytics => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalARR: 0,
    formattedARR: "$0",
    liveCustomersCount: 0,
    totalCustomersCount: 0,
    dealsPipelineValue: 0,
    formattedDealsPipeline: "$0",
    dealsPipelineCount: 0,
    salesLifecycleDays: 0,
    avgGoLiveDays: 0,
    growthRate: 0,
    churnRate: 0,
    isLoading: true,
    error: null
  });

  const fetchAnalytics = async () => {
    try {
      setAnalytics(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch customers with contracts and lifecycle stages
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) throw customersError;

      // Fetch all lifecycle stages
      const { data: lifecycleStages, error: stagesError } = await supabase
        .from('lifecycle_stages')
        .select('*');

      if (stagesError) throw stagesError;

      // Fetch all contracts
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*');

      if (contractsError) throw contractsError;

      // Group lifecycle stages by customer
      const stagesByCustomer = lifecycleStages?.reduce((acc, stage) => {
        if (!acc[stage.customer_id]) acc[stage.customer_id] = [];
        acc[stage.customer_id].push(stage);
        return acc;
      }, {} as Record<string, any[]>) || {};

      // Group contracts by customer
      const contractsByCustomer = contracts?.reduce((acc, contract) => {
        if (!acc[contract.customer_id]) acc[contract.customer_id] = [];
        acc[contract.customer_id].push(contract);
        return acc;
      }, {} as Record<string, any[]>) || {};

      // Calculate Live Customers (those with completed "Go Live" stage)
      const liveCustomerIds = new Set(
        lifecycleStages?.filter(stage => 
          stage.name === "Go Live" && stage.status === "done"
        ).map(stage => stage.customer_id) || []
      );

      // Calculate Total ARR (from live customers + customers with active contracts)
      const activeContractCustomerIds = new Set(
        contracts?.filter(contract => 
          contract.status === "active" || contract.status === "pending"
        ).map(contract => contract.customer_id) || []
      );

      const arrCustomerIds = new Set([...liveCustomerIds, ...activeContractCustomerIds]);
      
      const totalARR = Array.from(arrCustomerIds).reduce((sum, customerId) => {
        const customer = customers?.find(c => c.id === customerId);
        return sum + (customer?.contract_size || 0);
      }, 0);

      // Calculate Deals Pipeline (customers not in ARR)
      const pipelineCustomers = customers?.filter(customer => 
        !arrCustomerIds.has(customer.id)
      ) || [];
      
      const dealsPipelineValue = pipelineCustomers.reduce((sum, customer) => 
        sum + (customer.contract_size || 0), 0
      );

      // Calculate Sales Lifecycle (avg time from first stage to Go Live)
      const salesLifecycleTimes: number[] = [];
      Array.from(liveCustomerIds).forEach(customerId => {
        const customerStages = stagesByCustomer[customerId] || [];
        const goLiveStage = customerStages.find(s => s.name === "Go Live" && s.status === "done");
        const firstStage = customerStages
          .filter(s => s.status === "done")
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
        
        if (goLiveStage && firstStage && goLiveStage.id !== firstStage.id) {
          const timeDiff = new Date(goLiveStage.updated_at).getTime() - new Date(firstStage.created_at).getTime();
          const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          if (days > 0) salesLifecycleTimes.push(days);
        }
      });

      // Calculate Avg Go Live Time (from Contract Sent to Go Live)
      const goLiveTimes: number[] = [];
      Array.from(liveCustomerIds).forEach(customerId => {
        const customerStages = stagesByCustomer[customerId] || [];
        const goLiveStage = customerStages.find(s => s.name === "Go Live" && s.status === "done");
        const contractStage = customerStages.find(s => s.name === "Contract Sent" && s.status === "done");
        
        if (goLiveStage && contractStage) {
          const timeDiff = new Date(goLiveStage.updated_at).getTime() - new Date(contractStage.updated_at).getTime();
          const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          if (days > 0) goLiveTimes.push(days);
        }
      });

      // Calculate Growth Rate (compare last 3 months vs previous 3 months)
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

      const recentARR = Array.from(liveCustomerIds).reduce((sum, customerId) => {
        const goLiveStage = lifecycleStages?.find(s => 
          s.customer_id === customerId && 
          s.name === "Go Live" && 
          s.status === "done" &&
          new Date(s.updated_at) >= threeMonthsAgo
        );
        if (goLiveStage) {
          const customer = customers?.find(c => c.id === customerId);
          return sum + (customer?.contract_size || 0);
        }
        return sum;
      }, 0);

      const previousARR = Array.from(liveCustomerIds).reduce((sum, customerId) => {
        const goLiveStage = lifecycleStages?.find(s => 
          s.customer_id === customerId && 
          s.name === "Go Live" && 
          s.status === "done" &&
          new Date(s.updated_at) >= sixMonthsAgo &&
          new Date(s.updated_at) < threeMonthsAgo
        );
        if (goLiveStage) {
          const customer = customers?.find(c => c.id === customerId);
          return sum + (customer?.contract_size || 0);
        }
        return sum;
      }, 0);

      const growthRate = previousARR > 0 ? ((recentARR - previousARR) / previousARR) * 100 : 0;

      // Calculate Churn Rate (customers who haven't renewed expired contracts)
      const expiredContracts = contracts?.filter(contract => {
        const endDate = new Date(contract.end_date);
        return endDate < now && contract.status !== "renewed";
      }) || [];

      const churnRate = customers && customers.length > 0 
        ? (expiredContracts.length / customers.length) * 100 
        : 0;

      setAnalytics({
        totalARR,
        formattedARR: formatCurrency(totalARR),
        liveCustomersCount: liveCustomerIds.size,
        totalCustomersCount: customers?.length || 0,
        dealsPipelineValue,
        formattedDealsPipeline: formatCurrency(dealsPipelineValue),
        dealsPipelineCount: pipelineCustomers.length,
        salesLifecycleDays: salesLifecycleTimes.length > 0 
          ? Math.round(salesLifecycleTimes.reduce((a, b) => a + b, 0) / salesLifecycleTimes.length)
          : 0,
        avgGoLiveDays: goLiveTimes.length > 0 
          ? Math.round(goLiveTimes.reduce((a, b) => a + b, 0) / goLiveTimes.length)
          : 0,
        growthRate: Math.round(growthRate * 10) / 10,
        churnRate: Math.round(churnRate * 10) / 10,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      setAnalytics(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to load analytics data"
      }));
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Set up real-time subscriptions for data changes
    const contractsChannel = supabase
      .channel('contracts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, fetchAnalytics)
      .subscribe();

    const lifecycleChannel = supabase
      .channel('lifecycle-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lifecycle_stages' }, fetchAnalytics)
      .subscribe();

    const customersChannel = supabase
      .channel('customers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchAnalytics)
      .subscribe();

    return () => {
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(lifecycleChannel);
      supabase.removeChannel(customersChannel);
    };
  }, []);

  return analytics;
};