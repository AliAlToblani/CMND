
// Stage ordering utility to ensure consistent lifecycle stage display order

export const STAGE_ORDER_MAP: Record<string, number> = {
  // Pre-Sales stages (0-99)
  "Prospect": 0,
  "Qualified Lead": 1,
  "Meeting Set": 2,
  
  // Sales stages (100-199)
  "Discovery Call": 100,
  "Demo": 101,
  "Proposal Sent": 102,
  "Proposal Approved": 103,
  "Contract Sent": 104,
  "Contract Signed": 105,
  
  // Implementation stages (200-299)
  "Onboarding": 200,
  "Technical Setup": 201,
  "Training": 202,
  "Go Live": 203,
  
  // Finance stages (300-399)
  "Payment Processed": 300
};

export const getStageOrder = (stageName: string): number => {
  return STAGE_ORDER_MAP[stageName] ?? 999; // Unknown stages go to the end
};

export const sortStagesByOrder = <T extends { name: string }>(stages: T[]): T[] => {
  return [...stages].sort((a, b) => {
    const orderA = getStageOrder(a.name);
    const orderB = getStageOrder(b.name);
    return orderA - orderB;
  });
};
