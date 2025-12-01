import { defaultLifecycleStages } from '@/data/defaultLifecycleStages';

// Normalize stage names: lowercase, trim, collapse spaces/hyphens/underscores
export const normalizeStageName = (name?: string): string => {
  if (!name) return '';
  return name.toString().trim().toLowerCase().replace(/[_\s\-]+/g, ' ');
};

// Common stage name aliases and synonyms mapped to canonical names
const STAGE_ALIASES: Record<string, string> = {
  // Go Live variations
  'go live': 'Go Live',
  'go-live': 'Go Live',
  'golive': 'Go Live',
  'go_live': 'Go Live',
  'launch': 'Go Live',
  'deployment': 'Go Live',
  
  // Payment variations
  'payment processed': 'Payment Processed',
  'payment processing': 'Payment Processed', 
  'payment received': 'Payment Processed',
  'payment complete': 'Payment Processed',
  'payment done': 'Payment Processed',
  'payment_processed': 'Payment Processed',
  'payment-processed': 'Payment Processed',
  
  // Discovery variations
  'discovery': 'Discovery Call',
  'discovery call': 'Discovery Call',
  'discovery_call': 'Discovery Call',
  'discovery-call': 'Discovery Call',
  'initial call': 'Discovery Call',
  'first call': 'Discovery Call',
  
  // Contract variations
  'signed contract': 'Contract Signed',
  'contract signed': 'Contract Signed',
  'contract_signed': 'Contract Signed',
  'contract-signed': 'Contract Signed',
  'signed': 'Contract Signed',
  
  // Proposal variations
  'proposal accepted': 'Proposal Approved',
  'proposal approved': 'Proposal Approved',
  'proposal_approved': 'Proposal Approved',
  'proposal-approved': 'Proposal Approved',
  'approved proposal': 'Proposal Approved',
  
  // Meeting variations
  'meeting scheduled': 'Meeting Set',
  'meeting set': 'Meeting Set',
  'meeting_set': 'Meeting Set',
  'meeting-set': 'Meeting Set',
  'scheduled meeting': 'Meeting Set',
  
  // Lead variations
  'qualified': 'Qualified Lead',
  'qualified lead': 'Qualified Lead',
  'qualified_lead': 'Qualified Lead',
  'qualified-lead': 'Qualified Lead',
  'lead': 'Qualified Lead',
  
  // Technical Setup variations
  'tech setup': 'Technical Setup',
  'technical setup': 'Technical Setup',
  'technical_setup': 'Technical Setup',
  'technical-setup': 'Technical Setup',
  'setup': 'Technical Setup',
  'implementation': 'Technical Setup',
  
  // Contract Sent variations
  'contract sent': 'Contract Sent',
  'contract_sent': 'Contract Sent',
  'contract-sent': 'Contract Sent',
  'sent contract': 'Contract Sent',
  
  // Proposal Sent variations
  'proposal sent': 'Proposal Sent',
  'proposal_sent': 'Proposal Sent',
  'proposal-sent': 'Proposal Sent',
  'sent proposal': 'Proposal Sent',
  
  // Demo variations
  'demo': 'Demo',
  'demonstration': 'Demo',
  'product demo': 'Demo',
  
  // Training variations
  'training': 'Training',
  'user training': 'Training',
  'customer training': 'Training',
  
  // Onboarding variations
  'onboarding': 'Onboarding',
  'customer onboarding': 'Onboarding',
  'client onboarding': 'Onboarding',
  
  // Prospect variations
  'prospect': 'Prospect',
  'prospecting': 'Prospect',
  'lead generation': 'Prospect',
  
  // Kick-off Meeting variations
  'kick off meeting': 'Kick Off Meeting',
  'kick-off meeting': 'Kick Off Meeting',
  'kickoff meeting': 'Kick Off Meeting',
  'kickoff': 'Kick Off Meeting',
  'kick off': 'Kick Off Meeting',
  
  // Requirements Gathering variations
  'requirements gathering': 'Requirements Gathering',
  'requirements': 'Requirements Gathering',
  'gathering requirements': 'Requirements Gathering',
  
  // Account Setup variations
  'account setup': 'Account Setup',
  'account configuration': 'Account Setup',
  'setup account': 'Account Setup',
  
  // Data Migration variations
  'data migration': 'Data Migration',
  'migration': 'Data Migration',
  'data import': 'Data Migration',
  
  // Invoice Generation variations
  'invoice generation': 'Invoice Generation',
  'generate invoice': 'Invoice Generation',
  'invoicing': 'Invoice Generation'
};

// Get canonical stage name from any variation
export const canonicalizeStageName = (name?: string): string => {
  if (!name) return '';
  
  const normalized = normalizeStageName(name);
  const canonical = STAGE_ALIASES[normalized];
  
  if (canonical) {
    return canonical;
  }
  
  // If no alias found, try to find exact match in defaultLifecycleStages
  const exactMatch = defaultLifecycleStages.find(stage => 
    normalizeStageName(stage.name) === normalized
  );
  
  if (exactMatch) {
    return exactMatch.name;
  }
  
  // Return original name if no canonicalization found
  return name;
};

// Get all canonical stage names
export const getCanonicalStageNames = (): string[] => {
  return defaultLifecycleStages.map(stage => stage.name);
};

// Check if a stage name (any variation) exists in our canonical list
export const isValidStageName = (name?: string): boolean => {
  if (!name) return false;
  const canonical = canonicalizeStageName(name);
  return getCanonicalStageNames().includes(canonical);
};

// Create a map of normalized stage names to canonical names for fast lookup
export const createStageNameMap = (stages: any[]): Map<string, any> => {
  const stageMap = new Map();
  
  stages.forEach(stage => {
    if (stage.name) {
      const canonical = canonicalizeStageName(stage.name);
      stageMap.set(canonical, stage);
    }
  });
  
  return stageMap;
};

// Debug helper to log unmapped stage names
export const logUnmappedStageNames = (stages: any[]): void => {
  const unmappedStages = stages.filter(stage => {
    if (!stage.name) return false;
    const canonical = canonicalizeStageName(stage.name);
    return !getCanonicalStageNames().includes(canonical);
  });
  
  if (unmappedStages.length > 0) {
    console.warn('Found unmapped stage names in database:', 
      unmappedStages.map(s => s.name).filter((name, index, arr) => arr.indexOf(name) === index)
    );
  }
};