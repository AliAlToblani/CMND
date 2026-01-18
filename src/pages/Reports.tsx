import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, BarChart3, Users, Building2, Activity } from "lucide-react";
import { UpdatesPanel } from "@/components/analytics/UpdatesPanel";
import { COETeamUpdates } from "@/components/analytics/COETeamUpdates";
import { ActivityLogsPanel } from "@/components/analytics/ActivityLogsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ReportsPage = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTeam, setActiveTeam] = useState<'bd' | 'coe' | 'activity'>('bd');

  const handleRefresh = () => {
    setIsRefreshing(true);
    // The child components will refetch based on filter changes
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Reports
            </h1>
            <p className="text-muted-foreground mt-1">Team activity and performance reports</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Team Toggle Tabs */}
        <Tabs value={activeTeam} onValueChange={(v) => setActiveTeam(v as 'bd' | 'coe' | 'activity')} className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3 bg-muted/50 p-1 h-auto">
            <TabsTrigger 
              value="bd" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3"
            >
              <Users className="h-4 w-4" />
              <span className="font-medium">BD Team</span>
            </TabsTrigger>
            <TabsTrigger 
              value="coe" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3"
            >
              <Building2 className="h-4 w-4" />
              <span className="font-medium">COE Team</span>
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3"
            >
              <Activity className="h-4 w-4" />
              <span className="font-medium">Activity Logs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bd" className="mt-0">
            <div className="h-[600px]">
              <UpdatesPanel />
            </div>
          </TabsContent>

          <TabsContent value="coe" className="mt-0">
            <div className="h-[600px]">
              <COETeamUpdates isRefreshing={isRefreshing} />
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <div className="h-[600px]">
              <ActivityLogsPanel isRefreshing={isRefreshing} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
