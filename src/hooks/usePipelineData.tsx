
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CustomerData } from "@/types/customers";

export interface PipelineStageData {
  stageName: string;
  totalValue: number;
  customerCount: number;
  customers: CustomerData[];
}

const PIPELINE_STAGES = [
  "Lead",
  "Qualified", 
  "Demo",
  "Proposal",
  "Contract",
  "Implementation",
  "Live"
];

// Map completed lifecycle stages to pipeline stages (normalized keys)
const LIFECYCLE_TO_PIPELINE_MAPPING: Record<string, string> = {
  // Lead stage
  "prospect": "Lead",
  "meeting set": "Lead",
  // Qualified stage
  "qualified lead": "Qualified",
  "discovery call": "Qualified",
  // Demo stage
  "demo": "Demo",
  // Proposal stage
  "proposal sent": "Proposal",
  "proposal approved": "Proposal",
  // Contract stage
  "contract sent": "Contract",
  "contract signed": "Contract",
  // Implementation stage
  "onboarding": "Implementation",
  "technical setup": "Implementation",
  "training": "Implementation",
  // Live stage
  "go live": "Live",
  "payment processed": "Live"
};

// Define pipeline stage order for determining furthest stage
const PIPELINE_STAGE_ORDER = ["Lead", "Qualified", "Demo", "Proposal", "Contract", "Implementation", "Live"];

const normalize = (s?: string) => (s || "").trim().toLowerCase();

// Function to determine the furthest pipeline stage based on completed lifecycle stages
const getFurthestPipelineStage = (completedStages: string[]): string => {
  const pipelineStages = completedStages
    .map(stage => LIFECYCLE_TO_PIPELINE_MAPPING[normalize(stage)])
    .filter(Boolean) as string[];
  
  if (pipelineStages.length === 0) return "Lead";
  
  // Find the furthest stage in the pipeline
  let furthestStageIndex = -1;
  for (const stage of pipelineStages) {
    const index = PIPELINE_STAGE_ORDER.indexOf(stage);
    if (index > furthestStageIndex) {
      furthestStageIndex = index;
    }
  }
  
  return furthestStageIndex >= 0 ? PIPELINE_STAGE_ORDER[furthestStageIndex] : "Lead";
};

export const usePipelineData = () => {
  const [pipelineData, setPipelineData] = useState<PipelineStageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const fetchPipelineData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all customers with estimated deal values, excluding churned customers (include NULL status)
      const { data: customers, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .or('status.neq.churned,status.is.null');

      if (fetchError) {
        throw fetchError;
      }

      // Fetch all lifecycle stages (not just completed ones)
      const { data: lifecycleStages, error: stagesError } = await supabase
        .from('lifecycle_stages')
        .select('customer_id, name, status');

      if (stagesError) {
        throw stagesError;
      }

      console.log('Lifecycle stages fetched:', lifecycleStages);

      // Group lifecycle stages by customer ID (only count completed stages for pipeline positioning)
      const stagesByCustomer: Record<string, string[]> = {};
      lifecycleStages?.forEach(stage => {
        if ((stage.status || '').toLowerCase() === 'done') { // Only use completed stages for pipeline positioning
          if (!stagesByCustomer[stage.customer_id]) {
            stagesByCustomer[stage.customer_id] = [];
          }
          stagesByCustomer[stage.customer_id].push(stage.name);
        }
      });

      // Transform customers to CustomerData format with pipeline stage determination
      const transformedCustomers: CustomerData[] = (customers || []).map(customer => {
        const completedStages = stagesByCustomer[customer.id] || [];
        const pipelineStage = getFurthestPipelineStage(completedStages);
        const finalStage = (pipelineStage === 'Lead' && customer.go_live_date) ? 'Live' : pipelineStage;
        
        return {
          id: customer.id,
          name: customer.name,
          logo: customer.logo || undefined,
          segment: customer.segment || "Unknown Segment",
          country: customer.country || "Unknown Country",
          stage: finalStage,
          status: (customer.status as "not-started" | "in-progress" | "done" | "blocked") || "not-started",
          contractSize: customer.estimated_deal_value || 0,
          owner: {
            id: customer.owner_id || "unknown",
            name: "Unassigned",
            role: "Unassigned"
          }
        };
      });

      // Group customers by pipeline stage
      const stageGroups: Record<string, CustomerData[]> = {};
      
      // Initialize all pipeline stages
      PIPELINE_STAGES.forEach(stage => {
        stageGroups[stage] = [];
      });

      // Group customers by their pipeline stage
      transformedCustomers.forEach(customer => {
        const pipelineStage = customer.stage;
        if (stageGroups[pipelineStage]) {
          stageGroups[pipelineStage].push(customer);
        }
      });

      // Create pipeline data in order
      const pipelineStages: PipelineStageData[] = PIPELINE_STAGES.map(stageName => {
        const customers = stageGroups[stageName] || [];
        const totalValue = customers.reduce((sum, customer) => sum + customer.contractSize, 0);
        
        return {
          stageName,
          totalValue,
          customerCount: customers.length,
          customers
        };
      });

      console.log('Pipeline data with all customers:', {
        totalCustomers: transformedCustomers.length,
        stageDistribution: pipelineStages.map(s => `${s.stageName}: ${s.customerCount}`).join(', ')
      });

      setPipelineData(pipelineStages);
    } catch (err) {
      console.error("Error fetching pipeline data:", err);
      setError("Failed to load pipeline data");
    } finally {
      setIsLoading(false);
    }
  };

  return { pipelineData, isLoading, error, refetch: fetchPipelineData };
};
