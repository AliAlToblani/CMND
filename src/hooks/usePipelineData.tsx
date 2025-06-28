
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
  "Interest Captured",
  "Demo Booked", 
  "Demo Stage",
  "Proposal Sent",
  "Contract Sent",
  "Contract Signed",
  "Integration",
  "Pilot Stage",
  "Went Live"
];

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

      const { data: customers, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .not('stage', 'is', null);

      if (fetchError) {
        throw fetchError;
      }

      // Transform customers to CustomerData format
      const transformedCustomers: CustomerData[] = (customers || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        logo: customer.logo || undefined,
        segment: customer.segment || "Unknown Segment",
        country: customer.country || "Unknown Country",
        stage: customer.stage || "Unknown",
        status: (customer.status as "not-started" | "in-progress" | "done" | "blocked") || "not-started",
        contractSize: customer.contract_size || 0,
        owner: {
          id: customer.owner_id || "unknown",
          name: "Unassigned",
          role: "Unassigned"
        }
      }));

      // Group customers by stage
      const stageGroups: Record<string, CustomerData[]> = {};
      
      // Initialize all pipeline stages
      PIPELINE_STAGES.forEach(stage => {
        stageGroups[stage] = [];
      });

      // Group customers by their stage
      transformedCustomers.forEach(customer => {
        const stage = customer.stage || "Unknown";
        if (!stageGroups[stage]) {
          stageGroups[stage] = [];
        }
        stageGroups[stage].push(customer);
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

      // Add any additional stages not in our predefined list
      Object.keys(stageGroups).forEach(stageName => {
        if (!PIPELINE_STAGES.includes(stageName) && stageGroups[stageName].length > 0) {
          const customers = stageGroups[stageName];
          const totalValue = customers.reduce((sum, customer) => sum + customer.contractSize, 0);
          
          pipelineStages.push({
            stageName,
            totalValue,
            customerCount: customers.length,
            customers
          });
        }
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
