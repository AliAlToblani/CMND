import { supabase } from "@/integrations/supabase/client";
import { resolvePipelineStageFromLifecycleStages } from "@/utils/pipelineRules";

export const diagnoseCustomerStages = async (customerNames: string[] = []) => {
  console.log("=== CUSTOMER STAGE DIAGNOSIS ===");
  
  // Fetch all customers
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, stage, status');
  
  if (customersError) {
    console.error("Error fetching customers:", customersError);
    return;
  }
  
  // Fetch all lifecycle stages
  const { data: allStages, error: stagesError } = await supabase
    .from('lifecycle_stages')
    .select('customer_id, name, status');
  
  if (stagesError) {
    console.error("Error fetching stages:", stagesError);
    return;
  }
  
  // Group stages by customer
  const stagesByCustomer: Record<string, any[]> = {};
  allStages?.forEach(stage => {
    if (!stagesByCustomer[stage.customer_id]) {
      stagesByCustomer[stage.customer_id] = [];
    }
    stagesByCustomer[stage.customer_id].push(stage);
  });
  
  // Filter to specific customers if provided
  let targetCustomers = customers || [];
  if (customerNames.length > 0) {
    targetCustomers = targetCustomers.filter(c => 
      customerNames.some(name => c.name?.toLowerCase().includes(name.toLowerCase()))
    );
  }
  
  console.log(`\nAnalyzing ${targetCustomers.length} customers:\n`);
  
  const issues: any[] = [];
  
  for (const customer of targetCustomers) {
    const stages = stagesByCustomer[customer.id] || [];
    const completedStages = stages.filter(s => 
      ['done', 'completed', 'complete', 'finished'].includes((s.status || '').toLowerCase())
    );
    const inProgressStages = stages.filter(s => 
      ['in-progress', 'in progress', 'ongoing'].includes((s.status || '').toLowerCase())
    );
    
    const computedStage = resolvePipelineStageFromLifecycleStages(stages, { includeInProgress: true });
    
    const isCorrect = customer.stage === computedStage;
    
    console.log(`📌 ${customer.name}`);
    console.log(`   DB Stage: "${customer.stage}" | Computed: "${computedStage}" | ${isCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
    console.log(`   Total stages: ${stages.length}`);
    console.log(`   Completed: ${completedStages.map(s => s.name).join(', ') || 'none'}`);
    console.log(`   In Progress: ${inProgressStages.map(s => s.name).join(', ') || 'none'}`);
    console.log('');
    
    if (!isCorrect) {
      issues.push({
        name: customer.name,
        id: customer.id,
        currentStage: customer.stage,
        correctStage: computedStage,
        stageCount: stages.length,
        completed: completedStages.map(s => s.name),
        inProgress: inProgressStages.map(s => s.name)
      });
    }
  }
  
  if (issues.length > 0) {
    console.log(`\n=== SUMMARY: ${issues.length} CUSTOMERS WITH WRONG STAGES ===\n`);
    issues.forEach(issue => {
      console.log(`${issue.name}: "${issue.currentStage}" should be "${issue.correctStage}" (${issue.stageCount} stages)`);
    });
  }
  
  return issues;
};

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).diagnoseCustomerStages = diagnoseCustomerStages;
}
