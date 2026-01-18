import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Plus, Users, Kanban, BarChart3, TrendingUp, Activity, Clock, Briefcase, LifeBuoy, DollarSign, Target, Percent, FileText, RefreshCw, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CustomerData } from "@/types/customers";
import { syncCustomersToDatabase } from "@/utils/customerDataSync";
import { useRealtimeAnalytics } from "@/hooks/useRealtimeAnalytics";
import { formatCurrency } from "@/utils/customerUtils";
import { fetchDashboardMetrics, DashboardMetrics } from "@/utils/dashboardDataFetcher";
import { RevenueTrendChart } from "@/components/analytics/RevenueTrendChart";
import { UpdatesPanel } from "@/components/analytics/UpdatesPanel";
import { PendingContracts } from "@/components/analytics/PendingContracts";
import { DashboardFilters } from "@/components/analytics/DashboardFilters";
import { GoalTracker } from "@/components/dashboard/GoalTracker";
import { buildFilteredUrl } from "@/utils/filterUtils";
import { useProfile } from "@/hooks/useProfile";

const Index = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  // Get first name for greeting
  const firstName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'there';
  
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Filter state
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // OPTIMIZED: Single batch query instead of 13+ separate calls
  const refreshMetrics = async () => {
    setIsRefreshing(true);
    try {
      const filterParams = {
        countries: selectedCountries.length > 0 ? selectedCountries : undefined,
        segments: selectedSegments.length > 0 ? selectedSegments : undefined,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      };

      // Single optimized fetch replaces 13+ API calls
      const metrics = await fetchDashboardMetrics(filterParams);
      setDashboardData(metrics);
      setLastRefreshedAt(new Date());
    } catch (error) {
      console.error("Error refreshing metrics:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enable real-time analytics updates
  useRealtimeAnalytics(refreshMetrics);
  
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
  }, [selectedCountries, selectedSegments, dateRange]);

  const handleClearFilters = () => {
    setSelectedCountries([]);
    setSelectedSegments([]);
    setDateRange({ from: undefined, to: undefined });
  };

  // Calculate dashboard metrics from optimized data
  const d = dashboardData;
  const formattedARR = formatCurrency(d?.totalARR || 0, false);
  const formattedDealsPipeline = formatCurrency(d?.pipelineValue || 0, false);
  const formattedActiveContracts = formatCurrency(d?.totalRevenue || 0, false);
  const formattedAverageDeal = formatCurrency(d?.averageDealSize || 0, false);
  const formattedMRR = formatCurrency(d?.mrr || 0, false);
  
  const dashboardStats = [
    {
      title: "Total Customers",
      value: `${d?.totalCustomers || 0}`,
      description: "All customers",
      icon: <Users className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/total-customers', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Live Customers",
      value: `${d?.liveCustomers || 0}`,
      description: "Active contracts",
      icon: <LifeBuoy className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/live-customers', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Total Contracts",
      value: `${d?.totalContracts || 0}`,
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
      description: `${d?.pipelineCount || 0} active deals`,
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
      value: `${(d?.conversionRate || 0).toFixed(1)}%`,
      description: "Lead to customer",
      icon: <Target className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/conversion-rate', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Churn Rate",
      value: d?.churnRate || "0.0%",
      description: "Last 6 months",
      icon: <Percent className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/churn-rate', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Pitch to Pay",
      value: (d?.pitchToPayDays || 0) > 0 ? `${d?.pitchToPayDays} days` : "N/A",
      description: "Discovery to payment",
      icon: <Clock className="h-6 w-6" />,
      onClick: () => navigate(buildFilteredUrl('/analytics/pitch-to-pay', selectedCountries, dateRange.from, dateRange.to))
    },
    {
      title: "Pay to Live",
      value: (d?.payToLiveDays || 0) > 0 ? `${d?.payToLiveDays} days` : "N/A",
      description: "Payment to go-live",
      icon: <Activity className="h-6 w-6" />,
      onClick: () => navigate('/analytics/pay-to-live')
    }
  ];
  
  
  return (
    <DashboardLayout>
      <div className="space-y-12">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 p-6 mb-2 animate-welcome-slide">
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              </div>
              
              {/* Content */}
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 animate-float">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {getGreeting()}, {firstName}!
                    </span>
                  </h2>
                  <p className="text-muted-foreground mt-1 opacity-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    Welcome back to your command center. Let's make today count! 🚀
                  </p>
                </div>
              </div>
            </div>

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
