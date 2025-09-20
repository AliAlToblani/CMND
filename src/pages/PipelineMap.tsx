
import React, { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PipelineVisualization } from "@/components/pipeline/PipelineVisualization";
import { syncCustomerPipelineStages } from "@/utils/pipelineSync";

const PipelineMap = () => {
  // Run pipeline sync when page loads to ensure accurate data
  useEffect(() => {
    const initializePipelineMap = async () => {
      console.log("🔄 PipelineMap: Running pipeline sync on page load");
      await syncCustomerPipelineStages();
    };
    
    initializePipelineMap();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Pipeline Map</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visual overview of customer lifecycle stages and contract values
            </p>
          </div>
        </div>
        
        <PipelineVisualization />
      </div>
    </DashboardLayout>
  );
};

export default PipelineMap;
