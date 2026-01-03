import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Plus, Users, HandHeart, Kanban, BarChart3, TrendingUp, Activity, Clock, Briefcase, LifeBuoy, Calendar, DollarSign, Target, AlertTriangle, Percent, FileText, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CustomerData } from "@/types/customers";
import { syncCustomersToDatabase } from "@/utils/customerDataSync";
import { useRealtimeAnalytics } from "@/hooks/useRealtimeAnalytics";
import { toast } from "sonner";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { 
  getLiveCustomers, 
  getCustomerARRData, 
  getDealsPipeline, 
  getTotalPipelineValue,
  getActiveContractsValue,
  getConversionRate,
  getAverageDealSize,
  getMRR,
  calculatePitchToPayTime,
  calculatePayToLiveTime,
  calculateAverageGoLiveTime,
  calculateChurnRate,
  calculateSalesLifecycle,
  formatCurrency,
  getCustomersAtRisk
} from "@/utils/customerUtils";
import { RevenueTrendChart } from "@/components/analytics/RevenueTrendChart";
import { UpdatesPanel } from "@/components/analytics/UpdatesPanel";
import { PendingContracts } from "@/components/analytics/PendingContracts";
import { DashboardFilters } from "@/components/analytics/DashboardFilters";
import { GoalTracker } from "@/components/dashboard/GoalTracker";
import { buildFilteredUrl } from "@/utils/filterUtils";

const Index = () => {
  // Enable performance monitoring
  usePerformanceMonitoring();
  
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    dealsPipeline: { value: 0, count: 0 },
    totalPipelineValue: 0,
    activeContractsValue: 0,
    conversionRate: 0,
    averageDealSize: 0,
    mrr: 0,
    pitchToPayDays: 0,
    payToLiveDays: 0
  });
  const [arrData, setArrData] = useState({ totalARR: 0, liveCustomers: [], growthRate: 0 });
  const [churnRate, setChurnRate] = useState("0.0%");
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalContracts, setTotalContracts] = useState(0);
  const [customersAtRisk, setCustomersAtRisk] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  
  // Filter state
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    try {
      // Build filter params
      const filterParams = {
        countries: selectedCountries.length > 0 ? selectedCountries : undefined,
        segments: selectedSegments.length > 0 ? selectedSegments : undefined,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      };

      const [
        dealsPipeline,
        totalPipelineValue,
        activeContractsValue,
        conversionRate,
        averageDealSize,
        mrr,
        pitchToPayDays,
        payToLiveDays,
        arrDataResult,
        churnRateResult,
        customersCountResult,
        contractsCountResult,
        customersAtRiskResult
      ] = await Promise.all([
        getDealsPipeline(filterParams),
        getTotalPipelineValue(filterParams),
        getActiveContractsValue(filterParams),
        getConversionRate(filterParams),
        getAverageDealSize(filterParams),
        getMRR(filterParams),
        calculatePitchToPayTime(filterParams),
        calculatePayToLiveTime(filterParams),
        getCustomerARRData(customers, filterParams),
        calculateChurnRate(180, filterParams),
        getFilteredCustomersCount(filterParams),
        getFilteredContractsCount(filterParams),
        getCustomersAtRisk(filterParams)
      ]);

      setMetrics({
        dealsPipeline,
        totalPipelineValue,
        activeContractsValue,
        conversionRate,
        averageDealSize,
        mrr,
        pitchToPayDays,
        payToLiveDays
      });
      
      setArrData(arrDataResult);
      setChurnRate(churnRateResult);
      setTotalCustomers(customersCountResult.count || 0);
      setTotalContracts(contractsCountResult.count || 0);
      setCustomersAtRisk(customersAtRiskResult);
      setLastRefreshedAt(new Date());
    } catch (error) {
      console.error("Error refreshing metrics:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enable real-time analytics updates
  useRealtimeAnalytics(refreshMetrics);
  
  // Removed duplicate sync - now only syncs once in fetchCustomers
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        
        // Optimized: Only select columns needed for dashboard
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, logo, segment, country, stage, status, contract_size, owner_id')
          .order('contract_size', { ascending: false });

        if (error) {
          throw error;
        }

        const formatCustomerData = (customerData: any[]): CustomerData[] => 
          customerData.map(customer => ({
            id: customer.id,
            name: customer.name,
            logo: customer.logo || undefined,
            segment: customer.segment || "Unknown Segment",
            country: customer.country || "Unknown Country",
            stage: customer.stage || "Lead",
            status: (customer.status as "not-started" | "in-progress" | "done" | "blocked") || "not-started",
            contractSize: customer.contract_size || 0,
            owner: {
              id: customer.owner_id || "unknown",
              name: "Account Manager",
              role: "Sales"
            }
          }));

        if (data && data.length > 0) {
          setCustomers(formatCustomerData(data));
        } else {
          // If no customers in DB, try to sync them
          await syncCustomersToDatabase();
          const { data: retryData } = await supabase
            .from('customers')
            .select('id, name, logo, segment, country, stage, status, contract_size, owner_id')
            .order('contract_size', { ascending: false });
            
          setCustomers(retryData ? formatCustomerData(retryData) : []);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    refreshMetrics();
  }, [customers, selectedCountries, selectedSegments, dateRange]);

  const getFilteredCustomersCount = async (filterParams: any) => {
    let query = supabase.from('customers').select('*', { count: 'exact', head: true });
    
    if (filterParams.countries) {
      query = query.in('country', filterParams.countries);
    }
    if (filterParams.segments) {
      query = query.in('segment', filterParams.segments);
    }
    if (filterParams.dateFrom) {
      query = query.gte('created_at', filterParams.dateFrom.toISOString());
    }
    if (filterParams.dateTo) {
      query = query.lte('created_at', filterParams.dateTo.toISOString());
    }
    
    const { count } = await query;
    return { count };
  };

  const getFilteredContractsCount = async (filterParams: any) => {
    let query = supabase
      .from('contracts')
      .select('*, customers!inner(*)', { count: 'exact', head: true })
      .or('status.eq.active,status.eq.pending');
    
    if (filterParams.countries) {
      query = query.in('customers.country', filterParams.countries);
    }
    if (filterParams.segments) {
      query = query.in('customers.segment', filterParams.segments);
    }
    if (filterParams.dateFrom) {
      query = query.gte('created_at', filterParams.dateFrom.toISOString());
    }
    if (filterParams.dateTo) {
      query = query.lte('created_at', filterParams.dateTo.toISOString());
    }
    
    const { count } = await query;
    return { count };
  };

  const handleClearFilters = () => {
    setSelectedCountries([]);
    setSelectedSegments([]);
    setDateRange({ from: undefined, to: undefined });
  };

  // Calculate dashboard metrics  
  const formattedARR = formatCurrency(arrData.totalARR, false);
  const formattedDealsPipeline = formatCurrency(metrics.dealsPipeline.value, false);
  const formattedActiveContracts = formatCurrency(metrics.activeContractsValue, false);
  const formattedAverageDeal = formatCurrency(metrics.averageDealSize, false);
  const formattedMRR = formatCurrency(metrics.mrr, false);
  
  const getTotalCustomersCount = () => {
    return customers.length;
  };
  
  const dashboardStats = [
    {
      title: "Total Customers",
      value: `${totalCustomers}`,
      description: "All customers",
      icon: <Users className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/total-customers', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Live Customers",
      value: `${arrData.liveCustomers.length}`,
      description: "Active contracts",
      icon: <LifeBuoy className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/live-customers', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Total Contracts",
      value: `${totalContracts}`,
      description: "Active & pending",
      icon: <FileText className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/total-contracts', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Total Revenue",
      value: formattedActiveContracts,
      description: "All active contracts",
      icon: <DollarSign className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/total-revenue', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Total ARR",
      value: formattedARR,
      description: "Annual recurring",
      icon: <BarChart3 className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/total-arr', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "MRR",
      value: formattedMRR,
      description: "Monthly recurring",
      icon: <TrendingUp className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/mrr', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Pipeline Value",
      value: formattedDealsPipeline,
      description: `${metrics.dealsPipeline.count} active deals`,
      icon: <Kanban className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/deals-pipeline', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Avg Deal Size",
      value: formattedAverageDeal,
      description: "Per customer",
      icon: <Briefcase className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/average-deal-size', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Conversion Rate",
      value: `${metrics.conversionRate.toFixed(1)}%`,
      description: "Lead to customer",
      icon: <Target className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/conversion-rate', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Churn Rate",
      value: churnRate,
      description: "Last 6 months",
      icon: <Percent className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/churn-rate', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Pitch to Pay",
      value: metrics.pitchToPayDays > 0 ? `${metrics.pitchToPayDays} days` : "N/A",
      description: "Discovery to payment",
      icon: <Clock className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/pitch-to-pay', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Pay to Live",
      value: metrics.payToLiveDays > 0 ? `${metrics.payToLiveDays} days` : "N/A",
      description: "Payment to go-live",
      icon: <Activity className="h-6 w-6" />,
      onClick: () => navigate('/analytics/pay-to-live')
    }
  ];
  
  
  return (
    <DashboardLayout>
      <div className="space-y-12">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">Real-time business analytics and insights</p>
              </div>
              <div className="flex items-center gap-3">
                <DashboardFilters
                  selectedCountries={selectedCountries}
                  selectedSegments={selectedSegments}
                  dateRange={dateRange}
                  onCountryChange={setSelectedCountries}
                  onSegmentChange={setSelectedSegments}
                  onDateRangeChange={setDateRange}
                  onClearFilters={handleClearFilters}
                />
                <Button 
                  onClick={refreshMetrics} 
                  disabled={isRefreshing}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  onClick={() => navigate("/customers/new")}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            </div>
            {lastRefreshedAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Last refreshed at {lastRefreshedAt.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Team Goals */}
          <section className="mb-8">
            <GoalTracker revenueGoal={1000000} clientGoal={50} />
          </section>

          {/* KPI Cards Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Key Performance Indicators</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dashboardStats.map((stat, index) => (
                <div 
                  key={index}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <StatCard {...stat} isLoading={loading} />
                </div>
              ))}
            </div>
          </section>

          {/* Analytics Overview Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-[420px]">
                <UpdatesPanel 
                  countries={selectedCountries.length > 0 ? selectedCountries : undefined}
                  dateFrom={dateRange.from}
                  dateTo={dateRange.to}
                />
              </div>
              <div className="h-[420px]">
                <RevenueTrendChart 
                  isRefreshing={isRefreshing}
                  countries={selectedCountries.length > 0 ? selectedCountries : undefined}
                  dateFrom={dateRange.from}
                  dateTo={dateRange.to}
                />
              </div>
              <div className="h-[420px]">
                <PendingContracts 
                  isRefreshing={isRefreshing}
                  countries={selectedCountries.length > 0 ? selectedCountries : undefined}
                  dateFrom={dateRange.from}
                  dateTo={dateRange.to}
                />
              </div>
            </div>
          </section>
        </div>
    </DashboardLayout>
  );
};

export default Index;
