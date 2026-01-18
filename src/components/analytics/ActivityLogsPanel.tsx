import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Activity, 
  User, 
  FileText, 
  Users, 
  Building2, 
  CheckCircle2,
  Edit,
  Trash2,
  Plus,
  Clock,
  Filter
} from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  details: any;
  created_at: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

const getActionIcon = (action: string) => {
  if (action.includes('created') || action.includes('added')) return <Plus className="h-3.5 w-3.5 text-green-500" />;
  if (action.includes('updated') || action.includes('changed')) return <Edit className="h-3.5 w-3.5 text-blue-500" />;
  if (action.includes('deleted') || action.includes('removed')) return <Trash2 className="h-3.5 w-3.5 text-red-500" />;
  if (action.includes('completed')) return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  return <Activity className="h-3.5 w-3.5 text-gray-500" />;
};

const getEntityIcon = (entityType: string) => {
  switch (entityType?.toLowerCase()) {
    case 'customer':
      return <Users className="h-4 w-4" />;
    case 'contract':
      return <FileText className="h-4 w-4" />;
    case 'partnership':
      return <Building2 className="h-4 w-4" />;
    case 'user':
      return <User className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  if (action.includes('created') || action.includes('added')) return 'bg-green-500/10 text-green-600 border-green-500/20';
  if (action.includes('updated') || action.includes('changed')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  if (action.includes('deleted') || action.includes('removed')) return 'bg-red-500/10 text-red-600 border-red-500/20';
  if (action.includes('completed')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
};

interface ActivityLogsPanelProps {
  isRefreshing?: boolean;
}

export function ActivityLogsPanel({ isRefreshing }: ActivityLogsPanelProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  useEffect(() => {
    if (isRefreshing) {
      fetchLogs();
    }
  }, [isRefreshing]);

  useEffect(() => {
    fetchLogs();
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;

      const userOptions: UserOption[] = (data || []).map(u => ({
        id: u.id,
        name: u.full_name || u.email,
        email: u.email
      }));

      setUsers(userOptions);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const groupLogsByDate = (logs: ActivityLog[]) => {
    const groups: Record<string, ActivityLog[]> = {};
    
    logs.forEach(log => {
      const date = format(new Date(log.created_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });

    return groups;
  };

  const groupedLogs = groupLogsByDate(logs);
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/90 h-full flex flex-col">
      <CardHeader className="border-b border-border/50 pb-4 flex-shrink-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Activity Logs</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {logs.length} activities • {selectedUser === 'all' ? 'All users' : users.find(u => u.id === selectedUser)?.name}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
        {/* User Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>All Users</span>
                </div>
              </SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{user.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Activity List */}
        {loading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">No activity logs found</p>
            {selectedUser !== 'all' && (
              <p className="text-xs mt-1">Try selecting a different user or "All Users"</p>
            )}
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-6 pr-4">
              {sortedDates.map(date => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 mb-3 z-10">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs font-medium text-muted-foreground px-2">
                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </div>

                  {/* Logs for this date */}
                  <div className="space-y-2">
                    {groupedLogs[date].map(log => (
                      <div 
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors"
                      >
                        {/* Action Icon */}
                        <div className="mt-0.5">
                          {getActionIcon(log.action)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] font-medium ${getActionColor(log.action)}`}
                            >
                              {formatAction(log.action)}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {getEntityIcon(log.entity_type)}
                              <span className="capitalize">{log.entity_type}</span>
                            </div>
                          </div>
                          
                          {log.entity_name && (
                            <p className="text-sm font-medium mt-1 truncate">
                              {log.entity_name}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{log.user_name || log.user_email || 'Unknown user'}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(log.created_at), 'h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
