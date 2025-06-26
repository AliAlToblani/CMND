
export const defaultLifecycleStages = [
  // Pre-Sales Stages
  {
    name: "Prospect",
    category: "pre-sales",
    status: "not-started",
    order: 1
  },
  {
    name: "Qualified Lead",
    category: "pre-sales", 
    status: "not-started",
    order: 2
  },
  {
    name: "Meeting Set",
    category: "pre-sales",
    status: "not-started", 
    order: 3
  },
  
  // Sales Stages
  {
    name: "Discovery Call",
    category: "sales",
    status: "not-started",
    order: 4
  },
  {
    name: "Proposal Sent",
    category: "sales",
    status: "not-started",
    order: 5
  },
  {
    name: "Proposal Approved", 
    category: "sales",
    status: "not-started",
    order: 6
  },
  {
    name: "Contract Sent",
    category: "sales",
    status: "not-started",
    order: 7
  },
  {
    name: "Contract Signed",
    category: "sales", 
    status: "not-started",
    order: 8
  },
  
  // Implementation Stages
  {
    name: "Onboarding",
    category: "implementation",
    status: "not-started",
    order: 9
  },
  {
    name: "Technical Setup",
    category: "implementation",
    status: "not-started",
    order: 10
  },
  {
    name: "Training",
    category: "implementation",
    status: "not-started",
    order: 11
  },
  {
    name: "Go Live",
    category: "implementation",
    status: "not-started",
    order: 12
  },
  
  // Finance Stages
  {
    name: "Payment Processed",
    category: "finance",
    status: "not-started",
    order: 13
  }
];

export const industryOptions = [
  "Technology",
  "Healthcare", 
  "Financial Services",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Professional Services",
  "Media & Entertainment",
  "Transportation",
  "Energy",
  "Government",
  "Non-Profit",
  "Other"
];
