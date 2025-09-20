
import { supabase } from "@/integrations/supabase/client";
import { canonicalizeStageName } from "@/utils/stageNames";
import { isCompletedLike, isInProgressLike, getOperationalStatusFromArray } from "@/utils/stageStatus";
import { getFurthestPipelineStageFromNames } from "@/utils/pipelineRules";


const computePipelineStage = (stages: any[]): string => {
  const reached = stages
    .filter((s: any) => isCompletedLike(s.status) || isInProgressLike(s.status))
    .map((s: any) => canonicalizeStageName(s.name));
  return getFurthestPipelineStageFromNames(reached);
};

const computeOperationalStatus = (stages: any[]): "not-started" | "in-progress" | "done" | "blocked" => {
  return getOperationalStatusFromArray(stages);
};

export const syncCustomerPipelineStages = async (): Promise<boolean> => {
  try {
    console.log("=== PIPELINE SYNC STARTED ===");
    const startTime = Date.now();
    
    // Fetch all customers, excluding churned customers from pipeline sync
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, stage, status')
      .neq('status', 'churned');

    if (customersError) {
      console.error("❌ Error fetching customers:", customersError);
      return false;
    }

    console.log(`📊 Found ${customers?.length || 0} non-churned customers to sync`);

    // Fetch all lifecycle stages
    const { data: allLifecycleStages, error: stagesError } = await supabase
      .from('lifecycle_stages')
      .select('customer_id, name, status');

    if (stagesError) {
      console.error("❌ Error fetching lifecycle stages:", stagesError);
      return false;
    }

    console.log(`📋 Found ${allLifecycleStages?.length || 0} lifecycle stages`);

    // Group stages by customer
    const stagesByCustomer: Record<string, any[]> = {};
    allLifecycleStages?.forEach(stage => {
      if (!stagesByCustomer[stage.customer_id]) {
        stagesByCustomer[stage.customer_id] = [];
      }
      stagesByCustomer[stage.customer_id].push(stage);
    });

    console.log(`🔄 Processing ${Object.keys(stagesByCustomer).length} customers with stages`);

    let updatedCount = 0;
    const syncResults: Array<{
      customer: string;
      oldStage: string;
      newStage: string;
      oldStatus: string;
      newStatus: string;
      stages: string[];
    }> = [];

    // Update each customer's pipeline stage and status
    for (const customer of customers || []) {
      const customerStages = stagesByCustomer[customer.id] || [];
      const newPipelineStage = computePipelineStage(customerStages);
      const newOperationalStatus = computeOperationalStatus(customerStages);
      
      // Log stage computation details
      const completedStages = customerStages
        .filter(s => isCompletedLike(s.status))
        .map(s => s.name);
      const inProgressStages = customerStages
        .filter(s => isInProgressLike(s.status))
        .map(s => s.name);
      
      console.log(`🔍 ${customer.name}:`);
      console.log(`   - Completed stages: [${completedStages.join(', ')}]`);
      console.log(`   - In progress stages: [${inProgressStages.join(', ')}]`);
      console.log(`   - Computed pipeline stage: ${newPipelineStage}`);
      console.log(`   - Computed status: ${newOperationalStatus}`);
      
      // Only update if stage or status has changed
      if (customer.stage !== newPipelineStage || customer.status !== newOperationalStatus) {
        console.log(`🔄 UPDATING ${customer.name}: Stage ${customer.stage} -> ${newPipelineStage}, Status ${customer.status} -> ${newOperationalStatus}`);
        
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            stage: newPipelineStage,
            status: newOperationalStatus
          })
          .eq('id', customer.id);

        if (updateError) {
          console.error(`❌ Error updating customer ${customer.name}:`, updateError);
        } else {
          updatedCount++;
          syncResults.push({
            customer: customer.name,
            oldStage: customer.stage || 'null',
            newStage: newPipelineStage,
            oldStatus: customer.status || 'null',
            newStatus: newOperationalStatus,
            stages: [...completedStages, ...inProgressStages]
          });
        }
      } else {
        console.log(`✅ No changes needed for ${customer.name}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log("=== PIPELINE SYNC COMPLETED ===");
    console.log(`✅ Updated ${updatedCount} customers in ${duration}ms`);
    
    if (syncResults.length > 0) {
      console.log("📊 SYNC SUMMARY:");
      syncResults.forEach(result => {
        console.log(`   • ${result.customer}: ${result.oldStage} -> ${result.newStage} (${result.oldStatus} -> ${result.newStatus})`);
      });
    }
    
    return true;
  } catch (error) {
    console.error("❌ CRITICAL ERROR in syncCustomerPipelineStages:", error);
    return false;
  }
};
