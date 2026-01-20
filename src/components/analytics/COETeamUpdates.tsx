import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  ClipboardCheck, 
  Users, 
  CheckCircle2,
  Calendar,
  Clock,
  TrendingUp,
  Rocket,
  FileCheck,
  AlertCircle,
  ArrowDownRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Globe } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'project-added' | 'demo-added' | 'demo-completed' | 'project-completed';
  customerName: string;
  details: string;
  date: string;
  fullDate: Date;
  projectManager?: string;
  secondaryManager?: string;
}

interface DetailedData {
  projectsAdded: ActivityItem[];
  demosAdded: ActivityItem[];
  demosCompleted: ActivityItem[];
  projectsCompleted: ActivityItem[];
}

interface COETeamUpdatesProps {
  isRefreshing?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export function COETeamUpdates({ isRefreshing, dateFrom, dateTo }: COETeamUpdatesProps) {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [weeklyData, setWeeklyData] = useState<DetailedData | null>(null);
  const [monthlyData, setMonthlyData] = useState<DetailedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedManager, setSelectedManager] = useState<string>('all');
  const [availableManagers, setAvailableManagers] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  const fetchDetailedData = async (days: number): Promise<DetailedData> => {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const startDate = dateFrom || daysAgo;
    const endDate = dateTo || new Date();

    // Fetch all project_manager records with customer data for country
    const { data: allProjects, error: projectsError } = await supabase
      .from('project_manager')
      .select('*, customers:customer_id(country)')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('[COETeamUpdates] Projects query error:', projectsError);
    }

    // Filter by date range
    const projectsInPeriod = (allProjects || []).filter((project: any) => {
      const createdAt = new Date(project.created_at);
      const updatedAt = new Date(project.updated_at);
      return (createdAt >= startDate && createdAt <= endDate) || 
             (updatedAt >= startDate && updatedAt <= endDate);
    });

    // Apply manager filter
    let filteredProjects = projectsInPeriod;
    if (selectedManager !== 'all') {
      filteredProjects = filteredProjects.filter((p: any) => 
        p.project_manager === selectedManager || 
        p.secondary_project_manager === selectedManager
      );
    }
    
    // Apply country filter
    if (selectedCountry !== 'all') {
      filteredProjects = filteredProjects.filter((p: any) => 
        p.customers?.country === selectedCountry
      );
    }

    // Projects Added (status='ongoing', created in period)
    const projectsAdded: ActivityItem[] = filteredProjects
      .filter((p: any) => {
        const createdAt = new Date(p.created_at);
        return p.status === 'ongoing' && createdAt >= startDate && createdAt <= endDate;
      })
      .map((p: any) => ({
        id: p.id,
        type: 'project-added' as const,
        customerName: p.customer_name,
        details: `Project added - ${p.service_type || 'Service'}`,
        date: format(new Date(p.created_at), 'MMM dd'),
        fullDate: new Date(p.created_at),
        projectManager: p.project_manager,
        secondaryManager: p.secondary_project_manager
      }));

    // Demos Added (status='demo', created in period)
    const demosAdded: ActivityItem[] = filteredProjects
      .filter((p: any) => {
        const createdAt = new Date(p.created_at);
        return p.status === 'demo' && createdAt >= startDate && createdAt <= endDate;
      })
      .map((p: any) => ({
        id: p.id,
        type: 'demo-added' as const,
        customerName: p.customer_name,
        details: `Demo added - ${p.service_type || 'Service'}`,
        date: format(new Date(p.created_at), 'MMM dd'),
        fullDate: new Date(p.created_at),
        projectManager: p.project_manager,
        secondaryManager: p.secondary_project_manager
      }));

    // Demos Completed (status changed to 'ongoing' or 'completed', or demo_delivered=true, updated in period)
    // For this, we need to check projects that were 'demo' but are now 'ongoing' or 'completed'
    // OR have demo_delivered=true and were updated in period
    const demosCompleted: ActivityItem[] = filteredProjects
      .filter((p: any) => {
        const updatedAt = new Date(p.updated_at);
        const wasUpdated = updatedAt >= startDate && updatedAt <= endDate;
        // Check if it was a demo that got completed
        return wasUpdated && (
          (p.status === 'ongoing' && p.demo_date) || // Demo moved to ongoing
          (p.status === 'completed' && p.demo_date) || // Demo completed
          p.demo_delivered === true // Demo delivered flag
        );
      })
      .map((p: any) => ({
        id: p.id,
        type: 'demo-completed' as const,
        customerName: p.customer_name,
        details: `Demo completed - ${p.service_type || 'Service'}`,
        date: format(new Date(p.updated_at), 'MMM dd'),
        fullDate: new Date(p.updated_at),
        projectManager: p.project_manager,
        secondaryManager: p.secondary_project_manager
      }));

    // Projects Completed (status='completed', created/updated in period)
    const projectsCompleted: ActivityItem[] = filteredProjects
      .filter((p: any) => {
        const createdAt = new Date(p.created_at);
        const updatedAt = new Date(p.updated_at);
        return p.status === 'completed' && 
               ((createdAt >= startDate && createdAt <= endDate) ||
                (updatedAt >= startDate && updatedAt <= endDate));
      })
      .map((p: any) => ({
        id: p.id,
        type: 'project-completed' as const,
        customerName: p.customer_name,
        details: `Project completed - ${p.service_type || 'Service'}`,
        date: format(new Date(p.updated_at || p.created_at), 'MMM dd'),
        fullDate: new Date(p.updated_at || p.created_at),
        projectManager: p.project_manager,
        secondaryManager: p.secondary_project_manager
      }));

    return { projectsAdded, demosAdded, demosCompleted, projectsCompleted };
  };

  // Fetch available managers and countries
  useEffect(() => {
    const fetchFilterOptions = async () => {
      // Fetch managers
      const { data: projectData } = await supabase
        .from('project_manager')
        .select('project_manager, secondary_project_manager, customer_id');

      const managersSet = new Set<string>();
      const customerIds = new Set<string>();
      
      (projectData || []).forEach((p: any) => {
        if (p.project_manager) managersSet.add(p.project_manager);
        if (p.secondary_project_manager) managersSet.add(p.secondary_project_manager);
        if (p.customer_id) customerIds.add(p.customer_id);
      });

      setAvailableManagers(Array.from(managersSet).sort());

      // Fetch countries from customers linked to projects
      if (customerIds.size > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('country')
          .in('id', Array.from(customerIds));

        const countriesSet = new Set<string>();
        (customersData || []).forEach((c: any) => {
          if (c.country) countriesSet.add(c.country);
        });
        setAvailableCountries(Array.from(countriesSet).sort());
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const weekly = await fetchDetailedData(7);
        setWeeklyData(weekly);
        
        const monthly = await fetchDetailedData(30);
        setMonthlyData(monthly);
      } catch (error) {
        console.error("[COETeamUpdates] Error fetching activity data:", error);
        const emptyData: DetailedData = {
          projectsAdded: [],
          demosAdded: [],
          demosCompleted: [],
          projectsCompleted: []
        };
        setWeeklyData(emptyData);
        setMonthlyData(emptyData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isRefreshing, selectedManager, selectedCountry, dateFrom, dateTo]);

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

  const getStats = (data: DetailedData | null) => {
    if (!data) return { projectsAdded: 0, demosAdded: 0, demosCompleted: 0, projectsCompleted: 0, total: 0 };
    return {
      projectsAdded: data.projectsAdded.length,
      demosAdded: data.demosAdded.length,
      demosCompleted: data.demosCompleted.length,
      projectsCompleted: data.projectsCompleted.length,
      total: data.projectsAdded.length + data.demosAdded.length + data.demosCompleted.length + data.projectsCompleted.length
    };
  };

  const stats = getStats(currentData);

  const ActivitySection = ({ 
    id,
    title, 
    items, 
    icon: Icon, 
    color,
    isExpanded,
    onToggle
  }: { 
    id: string;
    title: string; 
    items: ActivityItem[]; 
    icon: any;
    color: string;
    isExpanded: boolean;
    onToggle: () => void;
  }) => {
    const displayItems = items.slice(0, 8);
    
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
              displayItems.map((activityItem, index) => (
                <div 
                  key={`${activityItem.id}-${index}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{activityItem.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activityItem.details}
                        {activityItem.projectManager && (
                          <span className="ml-2 text-primary">
                            • {activityItem.projectManager}
                            {activityItem.secondaryManager && ` + ${activityItem.secondaryManager}`}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activityItem.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/90 h-full flex flex-col">
      <CardHeader className="border-b border-border/50 pb-4 flex-shrink-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">COE Team Updates</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {period === 'weekly' ? 'Last 7 days' : 'Last 30 days'} • {stats.total} total activities
                </p>
              </div>
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-background">
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {availableCountries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                <Users className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="All Managers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Managers</SelectItem>
                {availableManagers.map(manager => (
                  <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 rounded-lg bg-blue-500/10">
                    <p className="text-lg font-bold text-blue-600">{stats.projectsAdded}</p>
                    <p className="text-[10px] text-muted-foreground">Projects Added</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-purple-500/10">
                    <p className="text-lg font-bold text-purple-600">{stats.demosAdded}</p>
                    <p className="text-[10px] text-muted-foreground">Demos Added</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-amber-500/10">
                    <p className="text-lg font-bold text-amber-600">{stats.demosCompleted}</p>
                    <p className="text-[10px] text-muted-foreground">Demos Completed</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                    <p className="text-lg font-bold text-emerald-600">{stats.projectsCompleted}</p>
                    <p className="text-[10px] text-muted-foreground">Projects Completed</p>
                  </div>
                </div>

                {/* Activity Sections */}
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-2">
                    <ActivitySection
                      id="projects-added"
                      title="Projects Added" 
                      items={currentData.projectsAdded}
                      icon={ClipboardCheck}
                      color="bg-blue-500"
                      isExpanded={expandedSections.has('projects-added')}
                      onToggle={() => toggleSection('projects-added')}
                    />
                    <ActivitySection
                      id="demos-added"
                      title="Demos Added" 
                      items={currentData.demosAdded}
                      icon={Rocket}
                      color="bg-purple-500"
                      isExpanded={expandedSections.has('demos-added')}
                      onToggle={() => toggleSection('demos-added')}
                    />
                    <ActivitySection
                      id="demos-completed"
                      title="Demos Completed"
                      items={currentData.demosCompleted}
                      icon={FileCheck}
                      color="bg-amber-500"
                      isExpanded={expandedSections.has('demos-completed')}
                      onToggle={() => toggleSection('demos-completed')}
                    />
                    <ActivitySection
                      id="projects-completed"
                      title="Projects Completed" 
                      items={currentData.projectsCompleted}
                      icon={CheckCircle2}
                      color="bg-emerald-500"
                      isExpanded={expandedSections.has('projects-completed')}
                      onToggle={() => toggleSection('projects-completed')}
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
      </CardContent>
    </Card>
  );
}
