import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  Loader2, 
  TrendingUp, 
  Users, 
  FileText, 
  AlertCircle, 
  HandHeart,
  ChevronDown,
  ChevronUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  X,
  CheckCircle2,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateWeeklyReport, generateMonthlyReport } from "@/utils/reportGeneration";
import { toast } from "sonner";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ActivityItem {
  id: string;
  type: 'lifecycle' | 'customer' | 'contract' | 'churn' | 'partnership';
  customerName: string;
  details: string;
  date: string;
  fullDate: Date;
  userName?: string;
}

interface DetailedData {
  lifecycleChanges: ActivityItem[];
  newCustomers: ActivityItem[];
  newContracts: ActivityItem[];
  churns: ActivityItem[];
  newPartnerships: ActivityItem[];
}

interface UpdatesPanelProps {
  countries?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export const UpdatesPanel = ({ countries, dateFrom, dateTo }: UpdatesPanelProps) => {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [weeklyData, setWeeklyData] = useState<DetailedData | null>(null);
  const [monthlyData, setMonthlyData] = useState<DetailedData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showFullView, setShowFullView] = useState(false);

  const fetchDetailedData = async (days: number): Promise<DetailedData> => {
    // Use custom date range if provided, otherwise calculate from days parameter
    const endDate = dateTo ? new Date(dateTo) : new Date();
    endDate.setHours(23, 59, 59, 999); // End of day
    
    const startDate = dateFrom ? new Date(dateFrom) : (() => {
      const calculated = new Date(endDate);
      calculated.setDate(calculated.getDate() - days);
      calculated.setHours(0, 0, 0, 0); // Start of day
      return calculated;
    })();

    // Calculate date boundaries - normalize to just date (no time) for comparison
    // start_date is a DATE field, so we compare just YYYY-MM-DD
    const normalizeDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDateStr = normalizeDate(startDate);
    const endDateStr = normalizeDate(endDate);
    
    // Fetch lifecycle changes with customer names and deal_owner
    const { data: lifecycleData, error: lifecycleError } = await supabase
      .from('lifecycle_stages')
      .select(`
        customer_id, 
        name, 
        status_changed_at,
        customers(name, country, deal_owner)
      `)
      .gte('status_changed_at', startDate.toISOString())
      .lte('status_changed_at', endDate.toISOString())
      .order('status_changed_at', { ascending: false });

    if (lifecycleError) console.error('[UpdatesPanel] Lifecycle query error:', lifecycleError);

    const customerStagesMap = new Map();
    lifecycleData?.forEach((stage: any) => {
      // Apply country filter manually if needed
      if (countries && countries.length > 0 && stage.customers?.country) {
        if (!countries.includes(stage.customers.country)) return;
      }
      const existing = customerStagesMap.get(stage.customer_id);
      if (!existing || new Date(stage.status_changed_at) > new Date(existing.status_changed_at)) {
        customerStagesMap.set(stage.customer_id, stage);
      }
    });

    const lifecycleChanges: ActivityItem[] = Array.from(customerStagesMap.values()).map((stage: any) => ({
      id: stage.customer_id,
      type: 'lifecycle' as const,
      customerName: stage.customers?.name || 'Unknown',
      details: stage.name,
      date: format(new Date(stage.status_changed_at), 'MMM dd'),
      fullDate: new Date(stage.status_changed_at),
      userName: stage.customers?.deal_owner || null
    }));

    // Fetch customers created in date range using database query for accuracy
    const { data: allCustomersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('[UpdatesPanel] Customers query error:', customersError);
    }

    // Apply country filter
    const filteredCustomers = (countries && countries.length > 0 && allCustomersData)
      ? allCustomersData.filter((c: any) => countries.includes(c.country))
      : (allCustomersData || []);


    const newCustomers: ActivityItem[] = filteredCustomers.map((customer: any) => ({
      id: customer.id,
      type: 'customer' as const,
      customerName: customer.name,
      details: customer.stage || 'New',
      date: format(new Date(customer.created_at), 'MMM dd'),
      fullDate: new Date(customer.created_at),
      userName: customer.deal_owner || null
    }));

    // Fetch ALL contracts first (no date filter) to see what we're working with
    const { data: allContractsRaw, error: contractsError } = await supabase
      .from('contracts')
      .select('id, name, start_date, created_at, value, customer_id, owner_id')
      .order('created_at', { ascending: false });

    if (contractsError) {
      console.error('[UpdatesPanel] Contracts query error:', contractsError);
    }

    // Filter contracts by date range in memory - use start_date or created_at
    const contractsInRange = (allContractsRaw || []).filter(contract => {
      const dateToUse = contract.start_date || contract.created_at;
      if (!dateToUse) return false;
      
      const contractDate = new Date(dateToUse);
      if (isNaN(contractDate.getTime())) return false;
      
      const contractDateStr = normalizeDate(contractDate);
      return contractDateStr >= startDateStr && contractDateStr <= endDateStr;
    });

    // Fetch customer data separately
    const contractsData: any[] = [];
    if (contractsInRange.length > 0) {
      const customerIds = [...new Set(contractsInRange.map(c => c.customer_id).filter(Boolean))];
      let customerMap: Record<string, any> = {};
      
      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, name, country, deal_owner')
          .in('id', customerIds);
        
        if (customersData) {
          customersData.forEach(c => {
            customerMap[c.id] = c;
          });
        }
      }
      
      // Combine contracts with customer data
      contractsData.push(...contractsInRange.map(contract => ({
        ...contract,
        customers: customerMap[contract.customer_id] || null
      })));
    }

    // Apply country filter
    const filteredContracts = (countries && countries.length > 0 && contractsData)
      ? contractsData.filter((c: any) => c.customers && countries.includes(c.customers.country))
      : contractsData;

    const newContracts: ActivityItem[] = filteredContracts.map((contract: any) => {
      // Use start_date first, then fall back to created_at
      const dateToUse = contract.start_date || contract.created_at;
      const contractDate = dateToUse ? new Date(dateToUse) : new Date();
      
      return {
        id: contract.id,
        type: 'contract' as const,
        customerName: contract.customers?.name || 'Unknown',
        details: contract.name || `Contract #${contract.id.slice(0, 8)}`,
        date: format(contractDate, 'MMM dd'),
        fullDate: contractDate,
        userName: contract.customers?.deal_owner || null
      };
    });

    // Fetch churns - customers with churn_date in range
    const { data: churnsData, error: churnsError } = await supabase
      .from('customers')
      .select('id, name, churn_date, country, status')
      .not('churn_date', 'is', null)
      .gte('churn_date', startDate.toISOString())
      .lte('churn_date', endDate.toISOString())
      .order('churn_date', { ascending: false });

    if (churnsError) console.error('[UpdatesPanel] Churns query error:', churnsError);

    const filteredChurns = countries && countries.length > 0 
      ? churnsData?.filter((c: any) => countries.includes(c.country)) || []
      : churnsData || [];


    const churns: ActivityItem[] = filteredChurns.map((customer: any) => ({
      id: customer.id,
      type: 'churn' as const,
      customerName: customer.name,
      details: 'Churned',
      date: format(new Date(customer.churn_date), 'MMM dd'),
      fullDate: new Date(customer.churn_date)
    }));

    // Fetch ALL partnerships first (no date filter) to see what we're working with
    const { data: allPartnershipsRaw, error: partnershipsError } = await supabase
      .from('partnerships')
      .select('id, name, start_date, created_at, status, partnership_type, country, owner_id')
      .order('created_at', { ascending: false });

    if (partnershipsError) {
      console.error('[UpdatesPanel] Partnerships query error:', partnershipsError);
    }

    // Filter partnerships by date range in memory - use start_date or created_at
    const partnershipsData = (allPartnershipsRaw || []).filter(partnership => {
      const dateToUse = partnership.start_date || partnership.created_at;
      if (!dateToUse) return false;
      
      const partnershipDate = new Date(dateToUse);
      if (isNaN(partnershipDate.getTime())) return false;
      
      const partnershipDateStr = normalizeDate(partnershipDate);
      return partnershipDateStr >= startDateStr && partnershipDateStr <= endDateStr;
    });

    // Apply country filter
    const filteredPartnerships = (countries && countries.length > 0 && partnershipsData)
      ? partnershipsData.filter((p: any) => countries.includes(p.country))
      : partnershipsData;

    const newPartnerships: ActivityItem[] = filteredPartnerships.map((partnership: any) => {
      // Use start_date first, then fall back to created_at
      const dateToUse = partnership.start_date || partnership.created_at;
      const partnershipDate = dateToUse ? new Date(dateToUse) : new Date();
      
      return {
        id: partnership.id,
        type: 'partnership' as const,
        customerName: partnership.name,
        details: partnership.partnership_type?.replace('_', ' ') || 'Partner',
        date: format(partnershipDate, 'MMM dd'),
        fullDate: partnershipDate,
        userName: null // owner_id is a UUID, not a name
      };
    });

    return { lifecycleChanges, newCustomers, newContracts, churns, newPartnerships };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const weekly = await fetchDetailedData(7);
        setWeeklyData(weekly);
        
        const monthly = await fetchDetailedData(30);
        setMonthlyData(monthly);
      } catch (error) {
        console.error("[UpdatesPanel] Error fetching activity data:", error);
        // Set empty data so UI still renders
        const emptyData: DetailedData = {
          lifecycleChanges: [],
          newCustomers: [],
          newContracts: [],
          churns: [],
          newPartnerships: []
        };
        setWeeklyData(emptyData);
        setMonthlyData(emptyData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [countries, dateFrom, dateTo]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      if (period === 'weekly') {
        await generateWeeklyReport();
        toast.success("Weekly report downloaded successfully!");
      } else {
        await generateMonthlyReport();
        toast.success("Monthly report downloaded successfully!");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const currentData = period === 'weekly' ? weeklyData : monthlyData;

  // Calculate summary stats
  const getStats = (data: DetailedData | null) => {
    if (!data) return { lifecycle: 0, customers: 0, contracts: 0, partnerships: 0, churns: 0, total: 0 };
    return {
      lifecycle: data.lifecycleChanges.length,
      customers: data.newCustomers.length,
      contracts: data.newContracts.length,
      partnerships: data.newPartnerships.length,
      churns: data.churns.length,
      total: data.lifecycleChanges.length + data.newCustomers.length + data.newContracts.length + data.newPartnerships.length
    };
  };

  const stats = getStats(currentData);
  const prevStats = getStats(period === 'weekly' ? monthlyData : weeklyData);

  const StatCard = ({ 
    label, 
    value, 
    icon: Icon, 
    color,
    trend
  }: { 
    label: string; 
    value: number; 
    icon: any; 
    color: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className={cn(
      "relative overflow-hidden rounded-xl p-3 transition-all hover:scale-105",
      "bg-gradient-to-br shadow-lg",
      color
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-white/80 font-medium">{label}</p>
        </div>
        <div className="rounded-full bg-white/20 p-2">
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      {trend && trend !== 'neutral' && (
        <div className="absolute top-2 right-2">
          {trend === 'up' ? (
            <ArrowUpRight className="h-3 w-3 text-white/70" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-white/70" />
          )}
        </div>
      )}
    </div>
  );

  const ActivitySection = ({ 
    id,
    title, 
    items, 
    icon: Icon, 
    color,
    isExpanded,
    onToggle,
    showAll = false
  }: { 
    id: string;
    title: string; 
    items: ActivityItem[]; 
    icon: any;
    color: string;
    isExpanded: boolean;
    onToggle: () => void;
    showAll?: boolean;
  }) => {
    const displayItems = showAll ? items : items.slice(0, 8);
    
    return (
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full">
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg transition-all hover:bg-accent/50",
            isExpanded && "bg-accent/30"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg p-2", color)}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{items.length} activities</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-bold">
                {items.length}
              </Badge>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pl-12 pr-3 pb-3 space-y-2">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-2">No activity in this period</p>
            ) : (
              <>
                {displayItems.map((item, index) => (
                  <div 
                    key={`${item.id}-${index}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.customerName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.details}
                          {item.userName && (
                            <span className="ml-2 text-primary">• {item.userName}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{item.date}</span>
                    </div>
                  </div>
                ))}
                {!showAll && items.length > 8 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullView(true);
                    }}
                    className="text-xs text-primary hover:underline py-2 font-medium"
                  >
                    View all {items.length} items →
                  </button>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const FullViewContent = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard 
          label="Stage Changes" 
          value={stats.lifecycle} 
          icon={TrendingUp} 
          color="from-violet-500 to-purple-600"
        />
        <StatCard 
          label="New Customers" 
          value={stats.customers} 
          icon={Users} 
          color="from-emerald-500 to-green-600"
        />
        <StatCard 
          label="New Contracts" 
          value={stats.contracts} 
          icon={FileText} 
          color="from-blue-500 to-cyan-600"
        />
        <StatCard 
          label="Partnerships" 
          value={stats.partnerships} 
          icon={HandHeart} 
          color="from-amber-500 to-orange-600"
        />
        <StatCard 
          label="Churns" 
          value={stats.churns} 
          icon={AlertCircle} 
          color="from-red-500 to-rose-600"
        />
      </div>

      {/* All Sections Expanded */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-4 pr-4">
          <ActivitySection 
            id="lifecycle"
            title="Lifecycle Stage Changes" 
            items={currentData?.lifecycleChanges || []} 
            icon={TrendingUp}
            color="bg-violet-500"
            isExpanded={true}
            onToggle={() => {}}
            showAll={true}
          />
          <ActivitySection 
            id="customers"
            title="New Customers Added" 
            items={currentData?.newCustomers || []} 
            icon={Users}
            color="bg-emerald-500"
            isExpanded={true}
            onToggle={() => {}}
            showAll={true}
          />
          <ActivitySection 
            id="contracts"
            title="New Contracts Signed"
            items={currentData?.newContracts || []} 
            icon={FileText}
            color="bg-blue-500"
            isExpanded={true}
            onToggle={() => {}}
            showAll={true}
          />
          <ActivitySection 
            id="partnerships"
            title="New Partnerships"
            items={currentData?.newPartnerships || []} 
            icon={HandHeart}
            color="bg-amber-500"
            isExpanded={true}
            onToggle={() => {}}
            showAll={true}
          />
          <ActivitySection 
            id="churns"
            title="Customer Churns" 
            items={currentData?.churns || []} 
            icon={AlertCircle}
            color="bg-red-500"
            isExpanded={true}
            onToggle={() => {}}
            showAll={true}
          />
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/90 h-full flex flex-col">
        <CardHeader className="border-b border-border/50 pb-4 flex-shrink-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Activity Updates</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {period === 'weekly' ? 'Last 7 days' : 'Last 30 days'} • {stats.total} total activities
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowFullView(true)}
              className="hover:bg-primary/10"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
        </div>
      </CardHeader>

        <CardContent className="p-4 flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'weekly' | 'monthly')} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0 bg-muted/50">
              <TabsTrigger value="weekly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Monthly
              </TabsTrigger>
          </TabsList>

            <TabsContent value={period} className="mt-4 flex-1 min-h-0 overflow-hidden">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading activity data...</p>
              </div>
            ) : currentData ? (
                <div className="flex flex-col h-full gap-4 min-h-0">
                  {/* Mini Stats Row */}
                  <div className="grid grid-cols-5 gap-2">
                    <div className="text-center p-2 rounded-lg bg-violet-500/10">
                      <p className="text-lg font-bold text-violet-600">{stats.lifecycle}</p>
                      <p className="text-[10px] text-muted-foreground">Stages</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                      <p className="text-lg font-bold text-emerald-600">{stats.customers}</p>
                      <p className="text-[10px] text-muted-foreground">Customers</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-blue-500/10">
                      <p className="text-lg font-bold text-blue-600">{stats.contracts}</p>
                      <p className="text-[10px] text-muted-foreground">Contracts</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-500/10">
                      <p className="text-lg font-bold text-amber-600">{stats.partnerships}</p>
                      <p className="text-[10px] text-muted-foreground">Partners</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-500/10">
                      <p className="text-lg font-bold text-red-600">{stats.churns}</p>
                      <p className="text-[10px] text-muted-foreground">Churns</p>
                    </div>
                  </div>

                  {/* Activity Sections */}
                  <ScrollArea className="flex-1">
                    <div className="space-y-2 pr-2">
                  <ActivitySection
                        id="lifecycle"
                        title="Stage Changes" 
                    items={currentData.lifecycleChanges}
                        icon={TrendingUp}
                        color="bg-violet-500"
                        isExpanded={expandedSections.has('lifecycle')}
                        onToggle={() => toggleSection('lifecycle')}
                  />
                  <ActivitySection
                        id="customers"
                        title="New Customers" 
                    items={currentData.newCustomers}
                        icon={Users}
                        color="bg-emerald-500"
                        isExpanded={expandedSections.has('customers')}
                        onToggle={() => toggleSection('customers')}
                  />
                  <ActivitySection
                        id="contracts"
                    title="New Contracts"
                    items={currentData.newContracts}
                        icon={FileText}
                        color="bg-blue-500"
                        isExpanded={expandedSections.has('contracts')}
                        onToggle={() => toggleSection('contracts')}
                  />
                  <ActivitySection
                        id="partnerships"
                        title="Partnerships" 
                    items={currentData.newPartnerships}
                        icon={HandHeart}
                        color="bg-amber-500"
                        isExpanded={expandedSections.has('partnerships')}
                        onToggle={() => toggleSection('partnerships')}
                  />
                  <ActivitySection
                        id="churns"
                    title="Churns"
                    items={currentData.churns}
                        icon={AlertCircle}
                        color="bg-red-500"
                        isExpanded={expandedSections.has('churns')}
                        onToggle={() => toggleSection('churns')}
                  />
                </div>
              </ScrollArea>
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No data available
              </div>
            )}
          </TabsContent>
        </Tabs>

          {/* Download Button */}
        <Button 
          onClick={handleGenerateReport} 
            disabled={generating || loading}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
          size="sm"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
                Download {period === 'weekly' ? 'Weekly' : 'Monthly'} Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>

      {/* Full View Dialog */}
      <Dialog open={showFullView} onOpenChange={setShowFullView}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    {period === 'weekly' ? 'Weekly' : 'Monthly'} Activity Report
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {period === 'weekly' 
                      ? `${format(subDays(new Date(), 7), 'MMM dd')} - ${format(new Date(), 'MMM dd, yyyy')}`
                      : `${format(subDays(new Date(), 30), 'MMM dd')} - ${format(new Date(), 'MMM dd, yyyy')}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={generating}
                  size="sm"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1.5" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <FullViewContent />
        </DialogContent>
      </Dialog>
    </>
  );
};
