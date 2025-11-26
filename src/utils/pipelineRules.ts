
// Centralized pipeline rules: stage order and lifecycle-to-pipeline mapping
// Always use canonical stage names as keys in the mapping

export const PIPELINE_STAGE_ORDER = [
  "Lead",
  "Qualified",
  "Demo",
  "Proposal",
  "Contract",
  "Implementation",
  "Live",
];

// Map canonical lifecycle stage names to pipeline stages
export const LIFECYCLE_TO_PIPELINE_MAPPING: Record<string, string> = {
  // Lead stage
  "Prospect": "Lead",
  "Meeting Set": "Lead",

  // Qualified stage
  "Qualified Lead": "Qualified",
  "Discovery Call": "Qualified",

  // Demo stage
  "Demo": "Demo",

  // Proposal stage
  "Proposal Sent": "Proposal",
  "Proposal Approved": "Proposal",

  // Contract stage
  "Contract Sent": "Contract",
  "Contract Signed": "Contract",

  // Implementation stage
  "Onboarding": "Implementation",
  "Technical Setup": "Implementation",
  "Training": "Implementation",

  // Live stage
  "Go Live": "Live",
  "Payment Processed": "Live",
};

// Resolve furthest pipeline stage from a list of canonical or raw lifecycle stage names
export const getFurthestPipelineStageFromNames = (stageNames: string[]): string => {
  const pipelineStages = stageNames
    .map((name) => LIFECYCLE_TO_PIPELINE_MAPPING[name] || LIFECYCLE_TO_PIPELINE_MAPPING[titleCase(name)])
    .filter(Boolean) as string[];

  if (pipelineStages.length === 0) return "Lead";

  let furthestIndex = -1;
  for (const s of pipelineStages) {
    const idx = PIPELINE_STAGE_ORDER.indexOf(s);
    if (idx > furthestIndex) furthestIndex = idx;
  }
  return furthestIndex >= 0 ? PIPELINE_STAGE_ORDER[furthestIndex] : "Lead";
};

// Helper to resolve pipeline stage directly from lifecycle stage objects (array form)
export const resolvePipelineStageFromLifecycleStages = (
  stages: Array<{ name?: string; status?: string }>,
  opts: { includeInProgress?: boolean } = { includeInProgress: true }
): string => {
  const { includeInProgress = true } = opts;
  const names: string[] = [];
  stages?.forEach((s) => {
    if (!s?.name) return;
    const status = (s.status || "").toString();
    if (
      status &&
      (status.toLowerCase() === "done" ||
        status.toLowerCase() === "completed" ||
        status.toLowerCase() === "complete" ||
        status.toLowerCase() === "finished" ||
        (includeInProgress && (status.toLowerCase() === "in-progress" || status.toLowerCase() === "in progress" || status.toLowerCase() === "ongoing")))
    ) {
      // Accept this stage as reached
      names.push(titleCase(s.name));
    }
  });
  
  const basePipelineStage = getFurthestPipelineStageFromNames(names);
  
  // GATING LOGIC: Prevent showing as "Live" unless ALL implementation stages + Go Live are complete
  if (basePipelineStage === "Live") {
    // Check if ALL implementation stages are completed
    const hasOnboardingCompleted = stages.some(
      s => titleCase(s.name) === "Onboarding" && 
      (s.status?.toLowerCase() === "done" || s.status?.toLowerCase() === "completed" || 
       s.status?.toLowerCase() === "complete" || s.status?.toLowerCase() === "finished")
    );
    const hasTechnicalSetupCompleted = stages.some(
      s => titleCase(s.name) === "Technical Setup" && 
      (s.status?.toLowerCase() === "done" || s.status?.toLowerCase() === "completed" || 
       s.status?.toLowerCase() === "complete" || s.status?.toLowerCase() === "finished")
    );
    const hasTrainingCompleted = stages.some(
      s => titleCase(s.name) === "Training" && 
      (s.status?.toLowerCase() === "done" || s.status?.toLowerCase() === "completed" || 
       s.status?.toLowerCase() === "complete" || s.status?.toLowerCase() === "finished")
    );
    const hasGoLiveCompleted = stages.some(
      s => titleCase(s.name) === "Go Live" && 
      (s.status?.toLowerCase() === "done" || s.status?.toLowerCase() === "completed" || 
       s.status?.toLowerCase() === "complete" || s.status?.toLowerCase() === "finished")
    );
    
    const allImplementationCompleted = hasOnboardingCompleted && hasTechnicalSetupCompleted && hasTrainingCompleted;
    
    // If not all implementation complete OR Go Live not complete, stay in Implementation
    if (!allImplementationCompleted || !hasGoLiveCompleted) {
      // Check if any implementation stage is started
      const hasImplementationStarted = stages.some(s => {
        const canonical = titleCase(s.name);
        return (canonical === "Onboarding" || canonical === "Technical Setup" || canonical === "Training") &&
          (s.status?.toLowerCase() === "done" || s.status?.toLowerCase() === "completed" || 
           s.status?.toLowerCase() === "complete" || s.status?.toLowerCase() === "finished" ||
           s.status?.toLowerCase() === "in-progress" || s.status?.toLowerCase() === "in progress" || 
           s.status?.toLowerCase() === "ongoing");
      });
      
      return hasImplementationStarted ? "Implementation" : "Contract";
    }
  }
  
  return basePipelineStage;
};

function titleCase(s?: string): string {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
