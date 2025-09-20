import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { syncCustomerPipelineStages } from "@/utils/pipelineSync";
import { toast } from "sonner";

interface SyncResult {
  success: boolean;
  duration?: number;
  error?: string;
}

export const PipelineSyncUtility = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);

  const handleRunSync = async () => {
    setIsRunning(true);
    const startTime = Date.now();
    
    try {
      console.log("🚀 Manual pipeline sync triggered by admin");
      const success = await syncCustomerPipelineStages();
      const duration = Date.now() - startTime;
      
      const result: SyncResult = { success, duration };
      setLastResult(result);
      setLastRunTime(new Date());
      
      if (success) {
        toast.success(`Pipeline sync completed successfully in ${duration}ms`);
      } else {
        toast.error("Pipeline sync failed - check console for details");
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: SyncResult = { 
        success: false, 
        duration,
        error: error instanceof Error ? error.message : "Unknown error" 
      };
      setLastResult(result);
      setLastRunTime(new Date());
      toast.error("Pipeline sync failed with error");
      console.error("Manual sync error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const getResultIcon = () => {
    if (!lastResult) return <Clock className="h-4 w-4 text-muted-foreground" />;
    if (lastResult.success) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getResultText = () => {
    if (!lastResult) return "No sync run yet";
    if (lastResult.success) return `Success (${lastResult.duration}ms)`;
    return `Failed${lastResult.duration ? ` (${lastResult.duration}ms)` : ''}${lastResult.error ? `: ${lastResult.error}` : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Pipeline Sync Utility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Manually synchronize customer pipeline stages and operational status based on lifecycle stage completion.
        </div>
        
        <div className="flex items-center justify-between">
          <Button 
            onClick={handleRunSync}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Sync...' : 'Run Pipeline Sync'}
          </Button>
          
          <div className="flex items-center gap-2 text-sm">
            {getResultIcon()}
            <span>{getResultText()}</span>
          </div>
        </div>
        
        {lastRunTime && (
          <div className="text-xs text-muted-foreground">
            Last run: {lastRunTime.toLocaleString()}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground space-y-1">
          <div><strong>What this does:</strong></div>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Updates customer.stage based on furthest completed lifecycle stage</li>
            <li>Updates customer.status to "done" when Go Live is completed</li>
            <li>Excludes churned customers from sync</li>
            <li>Provides detailed logging in browser console</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};