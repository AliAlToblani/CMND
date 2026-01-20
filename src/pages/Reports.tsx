import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Users, Building2, Activity, FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { UpdatesPanel } from "@/components/analytics/UpdatesPanel";
import { COETeamUpdates } from "@/components/analytics/COETeamUpdates";
import { ActivityLogsPanel } from "@/components/analytics/ActivityLogsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  generateWeeklyReport,
  generateMonthlyReport,
  generateBDWeeklyCSV,
  generateBDMonthlyCSV,
  generateCOEWeeklyReport,
  generateCOEMonthlyReport,
  generateCOEWeeklyCSV,
  generateCOEMonthlyCSV,
  generateActivityLogsWeeklyReport,
  generateActivityLogsMonthlyReport,
  generateActivityLogsWeeklyCSV,
  generateActivityLogsMonthlyCSV,
} from "@/utils/reportGeneration";
import { toast } from "sonner";

const ReportsPage = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTeam, setActiveTeam] = useState<'bd' | 'coe' | 'activity'>('bd');

  const handleRefresh = () => {
    setIsRefreshing(true);
    // The child components will refetch based on filter changes
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleExport = async (exportFn: () => Promise<void>, label: string) => {
    setIsExporting(true);
    try {
      await exportFn();
      toast.success(`${label} downloaded successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  {isExporting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {activeTeam === 'bd' && (
                  <>
                    <DropdownMenuLabel>BD Team Report</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport(generateWeeklyReport, 'Weekly report')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Weekly Report (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(generateMonthlyReport, 'Monthly report')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Monthly Report (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport(generateBDWeeklyCSV, 'Weekly CSV')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Weekly Report (.csv)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(generateBDMonthlyCSV, 'Monthly CSV')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Monthly Report (.csv)
                    </DropdownMenuItem>
                  </>
                )}
                {activeTeam === 'coe' && (
                  <>
                    <DropdownMenuLabel>COE Team Report</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport(generateCOEWeeklyReport, 'Weekly report')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Weekly Report (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(generateCOEMonthlyReport, 'Monthly report')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Monthly Report (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport(generateCOEWeeklyCSV, 'Weekly CSV')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Weekly Report (.csv)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(generateCOEMonthlyCSV, 'Monthly CSV')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Monthly Report (.csv)
                    </DropdownMenuItem>
                  </>
                )}
                {activeTeam === 'activity' && (
                  <>
                    <DropdownMenuLabel>Activity Logs Report</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport(generateActivityLogsWeeklyReport, 'Weekly report')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Weekly Report (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(generateActivityLogsMonthlyReport, 'Monthly report')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Monthly Report (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport(generateActivityLogsWeeklyCSV, 'Weekly CSV')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Weekly Report (.csv)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(generateActivityLogsMonthlyCSV, 'Monthly CSV')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Monthly Report (.csv)
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
