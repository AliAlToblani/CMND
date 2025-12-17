import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  User, 
  FileText, 
  Users, 
  HandHeart, 
  Edit, 
  Trash2, 
  Plus,
  RefreshCw,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, any>;
  created_at: string;
}

const getActionIcon = (action: string) => {
  if (action.includes('created') || action.includes('added')) return <Plus className="h-3.5 w-3.5" />;
  if (action.includes('updated') || action.includes('edited')) return <Edit className="h-3.5 w-3.5" />;
  if (action.includes('deleted') || action.includes('removed')) return <Trash2 className="h-3.5 w-3.5" />;
  return <Activity className="h-3.5 w-3.5" />;
};

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case 'user':
      return <User className="h-4 w-4" />;
    case 'customer':
      return <Users className="h-4 w-4" />;
    case 'contract':
      return <FileText className="h-4 w-4" />;
    case 'partnership':
      return <HandHeart className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getEntityColor = (entityType: string) => {
  switch (entityType) {
    case 'user':
      return 'bg-violet-500';
    case 'customer':
      return 'bg-emerald-500';
    case 'contract':
      return 'bg-blue-500';
    case 'partnership':
      return 'bg-amber-500';
    default:
      return 'bg-gray-500';
  }
};

const formatAction = (action: string) => {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const ActivityLog = () => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching activity logs:', error);
        return;
      }

      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          setActivities(prev => [payload.new as ActivityLogEntry, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/90 h-full flex flex-col">
      <CardHeader className="border-b border-border/50 pb-4 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Activity Log</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Recent changes by team members</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchActivities}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-hidden">
        {loading && activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/30" />
            <div>
              <p className="font-medium text-muted-foreground">No activity yet</p>
              <p className="text-sm text-muted-foreground/70">Actions will appear here as your team works</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors"
                >
                  <div className={cn(
                    "rounded-lg p-2 flex-shrink-0",
                    getEntityColor(activity.entity_type)
                  )}>
                    {getEntityIcon(activity.entity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {activity.user_name || activity.user_email || 'System'}
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {formatAction(activity.action)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {activity.entity_name || activity.entity_type}
                      {activity.details?.email && ` (${activity.details.email})`}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getActionIcon(activity.action)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

