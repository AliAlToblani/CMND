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

// Auto-run when imported
debugNawaraPipeline();