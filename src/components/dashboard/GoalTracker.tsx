import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Sparkles,
  Trophy,
  Rocket,
  Star,
  CheckCircle,
  PartyPopper
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ContributionEntry {
  id: string;
  user_name: string | null;
  action: 'contract_added' | 'client_completed';
  entity_name: string | null;
  value?: number;
  created_at: string;
}

interface GoalTrackerProps {
  revenueGoal?: number;
  clientGoal?: number;
}

export function GoalTracker({ 
  revenueGoal = 1000000, 
  clientGoal = 50 
}: GoalTrackerProps) {
  const [currentRevenue, setCurrentRevenue] = useState(0);
  const [completedClients, setCompletedClients] = useState(0);
  const [contributions, setContributions] = useState<ContributionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Animated progress percentages (start at 0 for animation)
  const [animatedRevenuePercent, setAnimatedRevenuePercent] = useState(0);
  const [animatedClientPercent, setAnimatedClientPercent] = useState(0);

  useEffect(() => {
    fetchGoalData();
    fetchContributions();

    // Real-time subscriptions
    const contractsChannel = supabase
      .channel('goal-contracts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        fetchGoalData();
        fetchContributions();
      })
      .subscribe();

    const projectsChannel = supabase
      .channel('goal-projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_manager' }, () => {
        fetchGoalData();
        fetchContributions();
      })
      .subscribe();

    const activityChannel = supabase
      .channel('goal-activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
        fetchContributions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(activityChannel);
    };
  }, []);

  const fetchGoalData = async () => {
    try {
      // Fetch total revenue - same logic as dashboard KPI (active/pending/null status)
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('value, setup_fee, annual_rate, status')
        .or('status.eq.active,status.eq.pending,status.is.null');

      if (error) {
        console.error('Error fetching contracts for goal:', error);
      }

      // Calculate total using same logic as dashboard: setup_fee + annual_rate, fallback to value
      const totalRevenue = (contracts || []).reduce((sum, c) => {
        const contractValue = (c.setup_fee > 0 || c.annual_rate > 0) 
          ? (c.setup_fee || 0) + (c.annual_rate || 0)
          : (c.value || 0);
        return sum + contractValue;
      }, 0);
      
      setCurrentRevenue(totalRevenue);

      // Fetch completed clients from project_manager
      const { count } = await supabase
        .from('project_manager')
        .select('id', { count: 'exact' })
        .eq('status', 'completed');

      setCompletedClients(count || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching goal data:', error);
      setLoading(false);
    }
  };

  const fetchContributions = async () => {
    try {
      const allContributions: ContributionEntry[] = [];

      // First try activity_logs
      const { data: activityLogs } = await supabase
        .from('activity_logs')
        .select('id, user_name, action, entity_type, entity_name, details, created_at')
        .or('entity_type.eq.contract,entity_type.eq.project')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityLogs && activityLogs.length > 0) {
        activityLogs.forEach(log => {
          const actionLower = log.action?.toLowerCase() || '';
          let action: 'contract_added' | 'client_completed' = 'contract_added';
          if (actionLower.includes('complete')) {
            action = 'client_completed';
          }

          let value: number | undefined;
          if (log.details && typeof log.details === 'object') {
            const details = log.details as Record<string, any>;
            value = details.value || details.contract_value;
          }

          allContributions.push({
            id: log.id,
            user_name: log.user_name,
            action,
            entity_name: log.entity_name,
            value,
            created_at: log.created_at
          });
        });
      }

      // Fallback: Also fetch recent completed projects directly
      const { data: completedProjects } = await supabase
        .from('project_manager')
        .select('id, customer_name, project_manager, updated_at')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(5);

      // Add completed projects that aren't already in activity logs
      (completedProjects || []).forEach(project => {
        const alreadyExists = allContributions.some(c => 
          c.entity_name === project.customer_name && c.action === 'client_completed'
        );
        
        if (!alreadyExists) {
          allContributions.push({
            id: `project-${project.id}`,
            user_name: project.project_manager || null,
            action: 'client_completed',
            entity_name: project.customer_name,
            created_at: project.updated_at
          });
        }
      });

      // Fallback: Also fetch recent contracts directly
      const { data: recentContracts } = await supabase
        .from('contracts')
        .select('id, name, value, setup_fee, annual_rate, created_at, customers(name)')
        .or('status.eq.active,status.eq.pending,status.is.null')
        .order('created_at', { ascending: false })
        .limit(5);

      // Add contracts that aren't already in activity logs
      (recentContracts || []).forEach(contract => {
        const alreadyExists = allContributions.some(c => 
          c.entity_name === (contract.customers?.name || contract.name) && c.action === 'contract_added'
        );
        
        if (!alreadyExists) {
          const contractValue = (contract.setup_fee > 0 || contract.annual_rate > 0) 
            ? (contract.setup_fee || 0) + (contract.annual_rate || 0)
            : (contract.value || 0);

          allContributions.push({
            id: `contract-${contract.id}`,
            user_name: null, // Will show as "Team Member" for older contracts
            action: 'contract_added',
            entity_name: contract.customers?.name || contract.name,
            value: contractValue,
            created_at: contract.created_at
          });
        }
      });

      // Sort by date and take top 5
      allContributions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setContributions(allContributions.slice(0, 5));
    } catch (error) {
      console.error('Error fetching contributions:', error);
    }
  };

  const revenuePercentage = Math.min((currentRevenue / revenueGoal) * 100, 100);
  const clientPercentage = Math.min((completedClients / clientGoal) * 100, 100);

  // Animate progress bars after data loads
  useEffect(() => {
    if (!loading && currentRevenue > 0) {
      // Small delay to ensure DOM is ready, then animate
      const timer = setTimeout(() => {
        setAnimatedRevenuePercent(revenuePercentage);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, currentRevenue, revenuePercentage]);

  useEffect(() => {
    if (!loading && completedClients > 0) {
      const timer = setTimeout(() => {
        setAnimatedClientPercent(clientPercentage);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, completedClients, clientPercentage]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Card className="glass-card animate-pulse">
        <CardContent className="p-6">
          <div className="h-48 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const isRevenueGoalMet = revenuePercentage >= 100;
  const isClientGoalMet = clientPercentage >= 100;

  return (
    <Card className="glass-card overflow-hidden relative">
      {/* Celebration effect when goals are met */}
      {(isRevenueGoalMet || isClientGoalMet) && (
        <div className="absolute top-4 right-4 pointer-events-none">
          <PartyPopper className="h-6 w-6 text-yellow-500 animate-bounce" />
        </div>
      )}

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Revenue Goal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isRevenueGoalMet ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                  <DollarSign className={`h-5 w-5 ${isRevenueGoalMet ? 'text-green-500' : 'text-green-600'}`} />
                </div>
                <div>
                  <p className="font-semibold">Revenue Goal</p>
                  <p className="text-xs text-muted-foreground">Target: {formatCurrency(revenueGoal)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-500">{formatCurrency(currentRevenue)}</p>
                <p className="text-xs text-muted-foreground">{revenuePercentage.toFixed(1)}% achieved</p>
              </div>
            </div>
          
          <div className="relative">
            <Progress 
              value={animatedRevenuePercent} 
              className="h-5 bg-muted rounded-full"
            />
            <div 
              className={`absolute top-0 left-0 h-5 rounded-full transition-all duration-1000 ease-out ${
                isRevenueGoalMet 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-400 animate-pulse shadow-lg shadow-green-500/30' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-md shadow-green-500/20'
              }`}
              style={{ width: `${animatedRevenuePercent}%` }}
            />
            {isRevenueGoalMet && (
              <div className="absolute -right-1 -top-1">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            )}
          </div>
          
          {/* Revenue milestones */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span className={revenuePercentage >= 25 ? 'text-green-500 font-medium' : ''}>$250K</span>
            <span className={revenuePercentage >= 50 ? 'text-green-500 font-medium' : ''}>$500K</span>
            <span className={revenuePercentage >= 75 ? 'text-green-500 font-medium' : ''}>$750K</span>
            <span className={revenuePercentage >= 100 ? 'text-green-500 font-medium' : ''}>$1M</span>
          </div>
        </div>

          {/* Client Goal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isClientGoalMet ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                  <Users className={`h-5 w-5 ${isClientGoalMet ? 'text-blue-500' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className="font-semibold">Clients Served</p>
                  <p className="text-xs text-muted-foreground">Target: {clientGoal} clients</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-500">{completedClients}/{clientGoal}</p>
                <p className="text-xs text-muted-foreground">{clientPercentage.toFixed(1)}% achieved</p>
              </div>
            </div>
          
          <div className="relative">
            <Progress 
              value={animatedClientPercent} 
              className="h-5 bg-muted rounded-full"
            />
            <div 
              className={`absolute top-0 left-0 h-5 rounded-full transition-all duration-1000 ease-out ${
                isClientGoalMet 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-400 animate-pulse shadow-lg shadow-blue-500/30' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-md shadow-blue-500/20'
              }`}
              style={{ width: `${animatedClientPercent}%` }}
            />
            {isClientGoalMet && (
              <div className="absolute -right-1 -top-1">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            )}
          </div>
          
          {/* Client milestones */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span className={clientPercentage >= 20 ? 'text-blue-500 font-medium' : ''}>10</span>
            <span className={clientPercentage >= 40 ? 'text-blue-500 font-medium' : ''}>20</span>
            <span className={clientPercentage >= 60 ? 'text-blue-500 font-medium' : ''}>30</span>
            <span className={clientPercentage >= 80 ? 'text-blue-500 font-medium' : ''}>40</span>
            <span className={clientPercentage >= 100 ? 'text-blue-500 font-medium' : ''}>50</span>
          </div>
          </div>
        </div>

        {/* Latest Contributions */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <p className="font-semibold text-sm text-foreground">Latest Contributions</p>
          </div>
          
          <div className="space-y-2 max-h-[180px] overflow-y-auto">
            {contributions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No contributions yet. Add contracts or complete clients to get started!
              </p>
            ) : (
              contributions.map((contribution) => (
                <div 
                  key={contribution.id} 
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                    <AvatarFallback className={`text-white text-xs ${
                      contribution.action === 'contract_added' 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-br from-blue-500 to-purple-500'
                    }`}>
                      {getInitials(contribution.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">
                        {contribution.user_name || 'Team Member'}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          contribution.action === 'contract_added'
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        }`}
                      >
                        {contribution.action === 'contract_added' ? (
                          <>
                            <DollarSign className="h-3 w-3 mr-1" />
                            Added Contract
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed Client
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {contribution.entity_name}
                      {contribution.value && contribution.value > 0 && (
                        <span className="text-green-600 font-medium ml-1">
                          (+{formatCurrency(contribution.value)})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(contribution.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Motivational message */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm">
            {revenuePercentage < 50 && clientPercentage < 50 ? (
              <>
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Every contribution counts. Let's build momentum!</span>
              </>
            ) : revenuePercentage < 100 || clientPercentage < 100 ? (
              <>
                <Rocket className="h-4 w-4 text-purple-500" />
                <span className="text-muted-foreground">We're on fire! Keep pushing toward the goal!</span>
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-yellow-600">Goals achieved! Time to celebrate!</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
