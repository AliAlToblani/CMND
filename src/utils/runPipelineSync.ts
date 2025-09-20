import { syncCustomerPipelineStages } from './pipelineSync';

// Utility to manually run pipeline sync
export const runPipelineSync = async () => {
  console.log('=== Manual Pipeline Sync Started ===');
  const success = await syncCustomerPipelineStages();
  console.log('=== Manual Pipeline Sync Completed ===', { success });
  return success;
};

// Auto-run when this file is imported
runPipelineSync();