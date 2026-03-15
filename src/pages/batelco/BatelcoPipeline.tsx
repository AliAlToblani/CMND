import React, { useEffect, useState } from "react";
import { BatelcoLayout } from "@/components/batelco/BatelcoLayout";
import { PipelineVisualization } from "@/components/pipeline/PipelineVisualization";
import { syncCustomerPipelineStages } from "@/utils/pipelineSync";
import { usePipelineData } from "@/hooks/usePipelineData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

const BatelcoPipeline = () => {
  const { isLoading, refetch } = usePipelineData();
  const [bahrainCustomerIds, setBahrainCustomerIds] = useState<string[]>([]);
  const [idsLoading, setIdsLoading] = useState(true);

  const fetchBahrainIds = async () => {
    try {
      const { data: allCustomers } = await supabase
        .from("customers")
        .select("id, country, partner_label");

      const ids = (allCustomers || [])
        .filter(
          (c: any) =>
            (c.country && c.country.trim().toLowerCase() === "bahrain") ||
            (c.partner_label && String(c.partner_label).toLowerCase() === "batelco")
        )
        .map((c: any) => c.id);

      setBahrainCustomerIds(ids);
    } catch {
      setBahrainCustomerIds([]);
    } finally {
      setIdsLoading(false);
    }
  };

  useEffect(() => {
    syncCustomerPipelineStages();
    fetchBahrainIds();
  }, []);

  const handleManualSync = async () => {
    toast.loading("Syncing pipeline data...");
    try {
      await syncCustomerPipelineStages();
      await refetch();
      await fetchBahrainIds();
      toast.success("Pipeline synced successfully!");
    } catch {
      toast.error("Failed to sync pipeline");
    }
  };

  const ready = !idsLoading && !isLoading;

  return (
    <BatelcoLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent">
              Pipeline Map
            </h1>
            <p className="text-muted-foreground mt-1">
              Bahrain customer pipeline overview
            </p>
          </div>
          <Button
            onClick={handleManualSync}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Sync Pipeline
          </Button>
        </div>

        {ready && bahrainCustomerIds.length > 0 ? (
          <PipelineVisualization filteredCustomerIds={bahrainCustomerIds} />
        ) : ready ? (
          <p className="text-muted-foreground text-sm">No Bahrain customers in pipeline yet.</p>
        ) : null}
      </div>
    </BatelcoLayout>
  );
};

export default BatelcoPipeline;
