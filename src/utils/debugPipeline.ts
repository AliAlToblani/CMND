import { canonicalizeStageName } from "@/utils/stageNames";
import { isCompletedLike, isInProgressLike } from "@/utils/stageStatus";
import { getFurthestPipelineStageFromNames } from "@/utils/pipelineRules";

// Debug function to test pipeline computation for Nawara Kamal
export const debugNawaraPipeline = () => {
  console.log('=== DEBUG: Nawara Kamal Pipeline Computation ===');
  
  // Nawara's actual lifecycle stages
  const nawaraStages = [
    { name: "Prospect", status: "done" },
    { name: "Contract Signed", status: "not-applicable" },
    { name: "Qualified Lead", status: "done" },
    { name: "Onboarding", status: "done" },
    { name: "Meeting Set", status: "done" },
    { name: "Technical Setup", status: "done" },
    { name: "Discovery Call", status: "done" },
    { name: "Training", status: "done" },
    { name: "Demo", status: "done" },
    { name: "Go Live", status: "done" },
    { name: "Proposal Sent", status: "done" },
    { name: "Payment Processed", status: "done" },
    { name: "Proposal Approved", status: "done" },
    { name: "Contract Sent", status: "not-applicable" }
  ];

  console.log('1. Raw stages:', nawaraStages);

  // Test status checking
  console.log('2. Status checking:');
  console.log('   isCompletedLike("done"):', isCompletedLike("done"));
  console.log('   isInProgressLike("done"):', isInProgressLike("done"));

  // Filter completed stages
  const completedStages = nawaraStages.filter(s => 
    isCompletedLike(s.status) || isInProgressLike(s.status)
  );
  console.log('3. Completed/In-progress stages:', completedStages);

  // Canonicalize stage names
  const canonicalNames = completedStages.map(s => {
    const canonical = canonicalizeStageName(s.name);
    console.log(`   "${s.name}" -> "${canonical}"`);
    return canonical;
  });
  console.log('4. Canonical names:', canonicalNames);

  // Get furthest pipeline stage
  const pipelineStage = getFurthestPipelineStageFromNames(canonicalNames);
  console.log('5. Final pipeline stage:', pipelineStage);

  console.log('=== DEBUG: End ===');
  return pipelineStage;
};

// Debug function for Macqueen
export const debugMacqueenPipeline = async () => {
  console.log('=== DEBUG: Macqueen Pipeline Computation ===');
  
  try {
    // Import supabase dynamically to avoid circular deps
    const { supabase } = await import("@/integrations/supabase/client");
    
    // Find Macqueen customer
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', '%macqueen%');
    
    if (custError) {
      console.error('Error fetching Macqueen:', custError);
      return;
    }
    
    if (!customers || customers.length === 0) {
      console.log('Macqueen customer not found!');
      return;
    }
    
    const macqueen = customers[0];
    console.log('1. Macqueen customer record:', {
      id: macqueen.id,
      name: macqueen.name,
      stage: macqueen.stage,
      status: macqueen.status,
      manual_stage: macqueen.manual_stage
    });
    
    // Fetch lifecycle stages
    const { data: stages, error: stagesError } = await supabase
      .from('lifecycle_stages')
      .select('name, status, category')
      .eq('customer_id', macqueen.id);
    
    if (stagesError) {
      console.error('Error fetching stages:', stagesError);
      return;
    }
    
    console.log('2. All lifecycle stages:', stages);
    
    // Filter completed and in-progress
    const completed = stages?.filter(s => 
      ['done', 'completed', 'complete', 'finished'].includes((s.status || '').toLowerCase())
    ) || [];
    const inProgress = stages?.filter(s => 
      ['in-progress', 'in progress', 'ongoing'].includes((s.status || '').toLowerCase())
    ) || [];
    
    console.log('3. Completed stages:', completed.map(s => s.name));
    console.log('4. In-progress stages:', inProgress.map(s => s.name));
    
    // Check canonicalization
    console.log('5. Canonicalization check:');
    stages?.forEach(s => {
      const canonical = canonicalizeStageName(s.name);
      console.log(`   "${s.name}" (${s.status}) -> canonical: "${canonical}"`);
    });
    
    // Compute what pipeline stage should be
    const reachedStages = [...completed, ...inProgress].map(s => canonicalizeStageName(s.name));
    const computedStage = getFurthestPipelineStageFromNames(reachedStages);
    console.log('6. Computed pipeline stage:', computedStage);
    console.log('   Current DB stage:', macqueen.stage);
    console.log('   Match:', computedStage === macqueen.stage ? '✅' : '❌ MISMATCH!');
    
    // Check if any implementation stages exist
    const implStageNames = ['Onboarding', 'Technical Setup', 'Training', 'Kick Off Meeting', 
      'Requirements Gathering', 'Account Setup', 'Data Migration', 'Implementation'];
    const hasImplStage = stages?.some(s => 
      implStageNames.some(impl => s.name?.toLowerCase().includes(impl.toLowerCase()))
    );
    console.log('7. Has implementation-related stage:', hasImplStage);
    
    console.log('=== DEBUG: End ===');
    return { macqueen, stages, computedStage };
  } catch (err) {
    console.error('Debug error:', err);
  }
};

// Debug functions are available for manual use:
// - debugNawaraPipeline()
// - debugMacqueenPipeline()
// - compareCustomersAndPipeline()
// Call these manually from the browser console when needed.

// Compare customers between Customers page and Pipeline
export const compareCustomersAndPipeline = async () => {
  console.log('=== COMPARING CUSTOMERS VS PIPELINE ===');
  
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { resolvePipelineStageFromLifecycleStages } = await import("@/utils/pipelineRules");
    
    // Fetch all customers (excluding churned)
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('*')
      .or('status.neq.churned,status.is.null');
    
    if (custError) {
      console.error('Error fetching customers:', custError);
      return;
    }
    
    // Fetch all lifecycle stages
    const { data: lifecycleStages, error: stagesError } = await supabase
      .from('lifecycle_stages')
      .select('customer_id, name, status');
    
    if (stagesError) {
      console.error('Error fetching stages:', stagesError);
      return;
    }
    
    console.log(`📊 Total customers (non-churned): ${customers?.length || 0}`);
    console.log(`📋 Total lifecycle stages: ${lifecycleStages?.length || 0}`);
    
    // Group stages by customer
    const stagesByCustomer: Record<string, any[]> = {};
    lifecycleStages?.forEach(stage => {
      if (!stagesByCustomer[stage.customer_id]) {
        stagesByCustomer[stage.customer_id] = [];
      }
      stagesByCustomer[stage.customer_id].push(stage);
    });
    
    // Compute stage for each customer
    const stageDistribution: Record<string, string[]> = {
      'Lead': [],
      'Qualified': [],
      'Demo': [],
      'Proposal': [],
      'Contract': [],
      'Implementation': [],
      'Live': [],
      'Unknown': []
    };
    
    const issues: string[] = [];
    
    customers?.forEach(customer => {
      const customerStages = stagesByCustomer[customer.id] || [];
      const computedStage = resolvePipelineStageFromLifecycleStages(customerStages, { includeInProgress: true });
      const dbStage = customer.stage;
      
      // Add to distribution
      if (stageDistribution[computedStage]) {
        stageDistribution[computedStage].push(customer.name);
      } else {
        stageDistribution['Unknown'].push(`${customer.name} (${computedStage})`);
      }
      
      // Check for mismatches
      if (dbStage && dbStage !== computedStage) {
        issues.push(`❌ ${customer.name}: DB="${dbStage}" vs Computed="${computedStage}"`);
      }
      
      // Check for implementation stages
      const hasImplStage = customerStages.some(s => 
        ['onboarding', 'technical setup', 'training', 'kick off meeting'].some(impl => 
          s.name?.toLowerCase().includes(impl)
        ) && ['done', 'completed', 'in-progress', 'in progress'].includes(s.status?.toLowerCase())
      );
      
      if (hasImplStage && computedStage === 'Contract') {
        issues.push(`⚠️ ${customer.name}: Has implementation stages but computed as Contract!`);
        console.log(`   Stages:`, customerStages.map(s => ({ name: s.name, status: s.status })));
      }
    });
    
    console.log('\n📈 STAGE DISTRIBUTION:');
    Object.entries(stageDistribution).forEach(([stage, names]) => {
      if (names.length > 0) {
        console.log(`   ${stage}: ${names.length} customers`);
        console.log(`      ${names.slice(0, 5).join(', ')}${names.length > 5 ? ` ... +${names.length - 5} more` : ''}`);
      }
    });
    
    if (issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('\n✅ No issues found - all customers are correctly staged!');
    }
    
    console.log('=== COMPARISON COMPLETE ===');
    return { customers: customers?.length, issues };
  } catch (err) {
    console.error('Comparison error:', err);
  }
};

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugNawaraPipeline = debugNawaraPipeline;
  (window as any).debugMacqueenPipeline = debugMacqueenPipeline;
  (window as any).compareCustomersAndPipeline = compareCustomersAndPipeline;
}