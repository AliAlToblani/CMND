
import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PipelineVisualization } from "@/components/pipeline/PipelineVisualization";
import { PipelineFilters } from "@/components/pipeline/PipelineFilters";
import { PipelineValueTrend } from "@/components/pipeline/PipelineValueTrend";
import { StalledCustomersSection } from "@/components/pipeline/StalledCustomersSection";
import { syncCustomerPipelineStages } from "@/utils/pipelineSync";
import { usePipelineData } from "@/hooks/usePipelineData";
import { usePipelineAnalytics } from "@/hooks/usePipelineAnalytics";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PipelineMap = () => {
  const { pipelineData, isLoading, refetch } = usePipelineData();
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  // Get all customers from pipeline data
  const allCustomers = pipelineData.flatMap((stage) => stage.customers);
  
  // Get analytics data
  const { insights, trendData } = usePipelineAnalytics(allCustomers);

  // Extract unique countries
  const uniqueCountries = Array.from(
    new Set(allCustomers.map((c) => c.country).filter(Boolean))
  ).sort();

  // Run pipeline sync when page loads
  useEffect(() => {
    const initializePipelineMap = async () => {
      console.log("🔄 PipelineMap: Running pipeline sync on page load");
      await syncCustomerPipelineStages();
    };
    
    initializePipelineMap();
  }, []);

  // Handle manual sync
  const handleManualSync = async () => {
    console.log("🔄 Manual pipeline sync triggered from Pipeline Map");
    toast.loading("Syncing pipeline data...");
    try {
      await syncCustomerPipelineStages();
      await refetch();
      toast.success("Pipeline synced successfully!");
      console.log("✅ Manual sync completed");
    } catch (error) {
      console.error("❌ Manual sync failed:", error);
      toast.error("Failed to sync pipeline");
    }
  };

  // Manual fix for specific customer issues
  const handleFixGulfAir = async () => {
    console.log("🔧 Manual fix for Gulf Air triggered");
    toast.loading("Fixing Gulf Air stage...");
    try {
      // Fetch Gulf Air's lifecycle stages
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name')
        .ilike('name', '%gulf air%')
        .single();
      
      if (!customer) {
        toast.error("Gulf Air not found");
        return;
      }

      const { data: stages } = await supabase
        .from('lifecycle_stages')
        .select('name, status')
        .eq('customer_id', customer.id);

      console.log("Gulf Air stages:", stages);

      // Based on lifecycle stages, Gulf Air should be in Proposal stage
      const { error } = await supabase
        .from('customers')
        .update({
          stage: 'Proposal',
          status: 'in-progress'
        })
        .eq('id', customer.id);

      if (error) throw error;

      await refetch();
      toast.success("Gulf Air stage updated to Proposal!");
    } catch (error) {
      console.error("❌ Manual fix failed:", error);
      toast.error("Failed to fix Gulf Air");
    }
  };


  // Handle country filter change
  const handleCountryChange = (countries: string[]) => {
    setSelectedCountries(countries);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCountries([]);
    toast.info("Filters cleared");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Pipeline Map
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time overview of customer lifecycle stages and pipeline performance
            </p>
          </div>
          <Button
            onClick={handleManualSync}
            disabled={isLoading}
            className="hover-scale"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Sync Pipeline
          </Button>
          <Button
            onClick={handleFixGulfAir}
            variant="outline"
            className="hover-scale"
          >
            Fix Gulf Air
          </Button>
        </div>

        {/* Pipeline Value Trend */}
        <PipelineValueTrend trendData={trendData} />

        {/* Pipeline Filters */}
        <PipelineFilters
          countries={uniqueCountries}
          selectedCountries={selectedCountries}
          onCountryChange={handleCountryChange}
          onClearFilters={handleClearFilters}
        />

        {/* Pipeline Visualization */}
        <PipelineVisualization
          selectedCountries={selectedCountries}
          filteredCustomerIds={[]}
        />

        {/* Stalled Customers */}
        <StalledCustomersSection customers={allCustomers} />
      </div>
    </DashboardLayout>
  );
};

export default PipelineMap;
