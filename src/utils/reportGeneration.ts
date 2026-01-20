import { supabase } from "@/integrations/supabase/client";
import { PARTNERSHIP_TYPE_LABELS } from "@/types/partnerships";
import { format } from "date-fns";

interface ReportData {
  lifecycleChanges: any[];
  newCustomers: any[];
  newContracts: any[];
  newPartnerships: any[];
  churns: any[];
  periodStart: Date;
  periodEnd: Date;
}

interface COEReportData {
  projectsAdded: any[];
  demosAdded: any[];
  demosCompleted: any[];
  projectsCompleted: any[];
  periodStart: Date;
  periodEnd: Date;
}

interface ActivityLogData {
  logs: any[];
  periodStart: Date;
  periodEnd: Date;
}

const getLatestLifecycleStages = (stages: any[]) => {
  const customerStages = new Map();
  stages.forEach(stage => {
    const existing = customerStages.get(stage.customer_id);
    if (!existing || new Date(stage.status_changed_at) > new Date(existing.status_changed_at)) {
      customerStages.set(stage.customer_id, stage);
    }
  });
  return Array.from(customerStages.values());
};

const fetchWeeklyData = async (): Promise<ReportData> => {
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 7);

  const [lifecycleData, customersData, contractsData, partnershipsData, churnsData] = await Promise.all([
    supabase
      .from('lifecycle_stages')
      .select('customer_id, name, status_changed_at, customers!inner(name)')
      .gte('status_changed_at', periodStart.toISOString()),
    supabase
      .from('customers')
      .select('id, name, created_at, stage')
      .gte('created_at', periodStart.toISOString()),
    supabase
      .from('contracts')
      .select('id, name, customer_id, value, setup_fee, annual_rate, status, start_date, created_at, customers!inner(name)')
      .gte('created_at', periodStart.toISOString()),
    supabase
      .from('partnerships')
      .select('id, name, partnership_type, status, expected_value, country, created_at')
      .gte('created_at', periodStart.toISOString()),
    supabase
      .from('customers')
      .select('id, name, churn_date')
      .eq('status', 'churned')
      .gte('churn_date', periodStart.toISOString()),
  ]);

  return {
    lifecycleChanges: getLatestLifecycleStages(lifecycleData.data || []),
    newCustomers: customersData.data || [],
    newContracts: contractsData.data || [],
    newPartnerships: partnershipsData.data || [],
    churns: churnsData.data || [],
    periodStart,
    periodEnd,
  };
};

const fetchMonthlyData = async (): Promise<ReportData> => {
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 30);

  const [lifecycleData, customersData, contractsData, partnershipsData, churnsData] = await Promise.all([
    supabase
      .from('lifecycle_stages')
      .select('customer_id, name, status_changed_at, customers!inner(name)')
      .gte('status_changed_at', periodStart.toISOString()),
    supabase
      .from('customers')
      .select('id, name, created_at, stage')
      .gte('created_at', periodStart.toISOString()),
    supabase
      .from('contracts')
      .select('id, name, customer_id, value, setup_fee, annual_rate, status, start_date, created_at, customers!inner(name)')
      .gte('created_at', periodStart.toISOString()),
    supabase
      .from('partnerships')
      .select('id, name, partnership_type, status, expected_value, country, created_at')
      .gte('created_at', periodStart.toISOString()),
    supabase
      .from('customers')
      .select('id, name, churn_date')
      .eq('status', 'churned')
      .gte('churn_date', periodStart.toISOString()),
  ]);

  return {
    lifecycleChanges: getLatestLifecycleStages(lifecycleData.data || []),
    newCustomers: customersData.data || [],
    newContracts: contractsData.data || [],
    newPartnerships: partnershipsData.data || [],
    churns: churnsData.data || [],
    periodStart,
    periodEnd,
  };
};

const formatDate = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), 'MMM dd, yyyy');
  } catch {
    return 'N/A';
  }
};

const formatCurrency = (value: number | null | undefined): string => {
  if (!value) return '$0';
  return `$${value.toLocaleString()}`;
};

const escapeCSV = (value: string | null | undefined): string => {
  if (!value) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const generateTextReport = (data: ReportData, type: 'weekly' | 'monthly'): string => {
  const { lifecycleChanges, newCustomers, newContracts, newPartnerships, churns, periodStart, periodEnd } = data;

  let report = `╔══════════════════════════════════════════════════════════════╗\n`;
  report += `║           BD TEAM ${type.toUpperCase()} REPORT                          ║\n`;
  report += `╚══════════════════════════════════════════════════════════════╝\n\n`;
  
  report += `📅 Period: ${formatDate(periodStart)} - ${formatDate(periodEnd)}\n`;
  report += `🕐 Generated: ${format(new Date(), 'MMM dd, yyyy h:mm a')}\n\n`;
  
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `                         SUMMARY                               \n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  report += `  📊 Lifecycle Changes:    ${String(lifecycleChanges.length).padStart(3)}\n`;
  report += `  👥 New Customers:        ${String(newCustomers.length).padStart(3)}\n`;
  report += `  📄 New Contracts:        ${String(newContracts.length).padStart(3)}\n`;
  report += `  🤝 New Partnerships:     ${String(newPartnerships.length).padStart(3)}\n`;
  report += `  ⚠️  Churns:               ${String(churns.length).padStart(3)}\n`;
  report += `  ─────────────────────────────\n`;
  report += `  📈 Total Activities:     ${String(lifecycleChanges.length + newCustomers.length + newContracts.length + newPartnerships.length + churns.length).padStart(3)}\n\n`;

  if (lifecycleChanges.length > 0) {
    report += `┌──────────────────────────────────────────────────────────────┐\n`;
    report += `│  📊 LIFECYCLE STAGE CHANGES                                  │\n`;
    report += `└──────────────────────────────────────────────────────────────┘\n\n`;
    report += `  ${'Customer'.padEnd(30)} ${'New Stage'.padEnd(20)} ${'Date'.padEnd(12)}\n`;
    report += `  ${'─'.repeat(30)} ${'─'.repeat(20)} ${'─'.repeat(12)}\n`;
    lifecycleChanges.forEach(change => {
      const name = (change.customers?.name || 'Unknown').substring(0, 28);
      const stage = (change.name || 'Unknown').substring(0, 18);
      const date = formatDate(change.status_changed_at);
      report += `  ${name.padEnd(30)} ${stage.padEnd(20)} ${date}\n`;
    });
    report += `\n`;
  }

  if (newCustomers.length > 0) {
    report += `┌──────────────────────────────────────────────────────────────┐\n`;
    report += `│  👥 NEW CUSTOMERS ADDED                                      │\n`;
    report += `└──────────────────────────────────────────────────────────────┘\n\n`;
    report += `  ${'Customer Name'.padEnd(35)} ${'Stage'.padEnd(15)} ${'Added'.padEnd(12)}\n`;
    report += `  ${'─'.repeat(35)} ${'─'.repeat(15)} ${'─'.repeat(12)}\n`;
    newCustomers.forEach((customer: any) => {
      const name = (customer.name || 'Unknown').substring(0, 33);
      const stage = (customer.stage || 'New').substring(0, 13);
      const date = formatDate(customer.created_at);
      report += `  ${name.padEnd(35)} ${stage.padEnd(15)} ${date}\n`;
    });
    report += `\n`;
  }

  if (newContracts.length > 0) {
    report += `┌──────────────────────────────────────────────────────────────┐\n`;
    report += `│  📄 NEW CONTRACTS                                            │\n`;
    report += `└──────────────────────────────────────────────────────────────┘\n\n`;
    report += `  ${'Customer'.padEnd(25)} ${'Contract'.padEnd(20)} ${'Value'.padEnd(12)} ${'Status'.padEnd(10)}\n`;
    report += `  ${'─'.repeat(25)} ${'─'.repeat(20)} ${'─'.repeat(12)} ${'─'.repeat(10)}\n`;
    newContracts.forEach((contract: any) => {
      const totalValue = (contract.setup_fee || 0) + (contract.annual_rate || 0);
      const customerName = (contract.customers?.name || 'Unknown').substring(0, 23);
      const contractName = (contract.name || 'Contract').substring(0, 18);
      const status = (contract.status || 'N/A').substring(0, 8);
      report += `  ${customerName.padEnd(25)} ${contractName.padEnd(20)} ${formatCurrency(totalValue).padEnd(12)} ${status}\n`;
    });
    report += `\n`;
  }

  if (newPartnerships.length > 0) {
    report += `┌──────────────────────────────────────────────────────────────┐\n`;
    report += `│  🤝 NEW PARTNERSHIPS                                         │\n`;
    report += `└──────────────────────────────────────────────────────────────┘\n\n`;
    report += `  ${'Partner Name'.padEnd(25)} ${'Type'.padEnd(15)} ${'Expected Value'.padEnd(15)} ${'Country'}\n`;
    report += `  ${'─'.repeat(25)} ${'─'.repeat(15)} ${'─'.repeat(15)} ${'─'.repeat(12)}\n`;
    newPartnerships.forEach((partnership: any) => {
      const name = (partnership.name || 'Unknown').substring(0, 23);
      const partnerType = (PARTNERSHIP_TYPE_LABELS[partnership.partnership_type as keyof typeof PARTNERSHIP_TYPE_LABELS] || partnership.partnership_type || 'N/A').substring(0, 13);
      const expectedValue = formatCurrency(partnership.expected_value);
      const country = (partnership.country || 'N/A').substring(0, 12);
      report += `  ${name.padEnd(25)} ${partnerType.padEnd(15)} ${expectedValue.padEnd(15)} ${country}\n`;
    });
    report += `\n`;
  }

  if (churns.length > 0) {
    report += `┌──────────────────────────────────────────────────────────────┐\n`;
    report += `│  ⚠️  CHURNED CUSTOMERS                                        │\n`;
    report += `└──────────────────────────────────────────────────────────────┘\n\n`;
    report += `  ${'Customer Name'.padEnd(40)} ${'Churn Date'}\n`;
    report += `  ${'─'.repeat(40)} ${'─'.repeat(12)}\n`;
    churns.forEach(churn => {
      const name = (churn.name || 'Unknown').substring(0, 38);
      const date = formatDate(churn.churn_date);
      report += `  ${name.padEnd(40)} ${date}\n`;
    });
    report += `\n`;
  }

  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `                      END OF REPORT                            \n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  return report;
};

const downloadReport = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// CSV Generation for BD Team
const generateBDCSVReport = (data: ReportData): string => {
  const { lifecycleChanges, newCustomers, newContracts, newPartnerships, churns, periodStart, periodEnd } = data;
  
  let csv = `BD Team Report - ${formatDate(periodStart)} to ${formatDate(periodEnd)}\n\n`;
  
  // Lifecycle Changes
  csv += `LIFECYCLE CHANGES\n`;
  csv += `Customer,New Stage,Date\n`;
  lifecycleChanges.forEach(change => {
    csv += `${escapeCSV(change.customers?.name)},${escapeCSV(change.name)},${formatDate(change.status_changed_at)}\n`;
  });
  
  csv += `\nNEW CUSTOMERS\n`;
  csv += `Customer Name,Stage,Added Date\n`;
  newCustomers.forEach((customer: any) => {
    csv += `${escapeCSV(customer.name)},${escapeCSV(customer.stage)},${formatDate(customer.created_at)}\n`;
  });
  
  csv += `\nNEW CONTRACTS\n`;
  csv += `Customer,Contract Name,Value,Status,Start Date\n`;
  newContracts.forEach((contract: any) => {
    const totalValue = (contract.setup_fee || 0) + (contract.annual_rate || 0);
    csv += `${escapeCSV(contract.customers?.name)},${escapeCSV(contract.name)},${totalValue},${escapeCSV(contract.status)},${formatDate(contract.start_date)}\n`;
  });
  
  csv += `\nNEW PARTNERSHIPS\n`;
  csv += `Partner Name,Type,Expected Value,Status,Country\n`;
  newPartnerships.forEach((partnership: any) => {
    const partnerType = PARTNERSHIP_TYPE_LABELS[partnership.partnership_type as keyof typeof PARTNERSHIP_TYPE_LABELS] || partnership.partnership_type;
    csv += `${escapeCSV(partnership.name)},${escapeCSV(partnerType)},${partnership.expected_value || 0},${escapeCSV(partnership.status)},${escapeCSV(partnership.country)}\n`;
  });
  
  csv += `\nCHURNED CUSTOMERS\n`;
  csv += `Customer Name,Churn Date\n`;
  churns.forEach(churn => {
    csv += `${escapeCSV(churn.name)},${formatDate(churn.churn_date)}\n`;
  });
  
  return csv;
};

// COE Team Report Functions
const fetchCOEData = async (days: number): Promise<COEReportData> => {
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days);

  const { data: allProjects, error } = await supabase
    .from('project_manager')
    .select('*, customers:customer_id(name, country)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[COE Report] Projects query error:', error);
  }

  const projectsInPeriod = (allProjects || []).filter((project: any) => {
    const createdAt = new Date(project.created_at);
    const updatedAt = new Date(project.updated_at);
    return (createdAt >= periodStart && createdAt <= periodEnd) || 
           (updatedAt >= periodStart && updatedAt <= periodEnd);
  });

  const projectsAdded = projectsInPeriod.filter((p: any) => {
    const createdAt = new Date(p.created_at);
    return p.status === 'ongoing' && createdAt >= periodStart && createdAt <= periodEnd;
  });

  const demosAdded = projectsInPeriod.filter((p: any) => {
    const createdAt = new Date(p.created_at);
    return p.status === 'demo' && createdAt >= periodStart && createdAt <= periodEnd;
  });

  const demosCompleted = projectsInPeriod.filter((p: any) => {
    const updatedAt = new Date(p.updated_at);
    const wasUpdated = updatedAt >= periodStart && updatedAt <= periodEnd;
    return wasUpdated && (
      (p.status === 'ongoing' && p.demo_date) ||
      (p.status === 'completed' && p.demo_date) ||
      p.demo_delivered === true
    );
  });

  const projectsCompleted = projectsInPeriod.filter((p: any) => {
    const updatedAt = new Date(p.updated_at);
    return p.status === 'completed' && updatedAt >= periodStart && updatedAt <= periodEnd;
  });

  return { projectsAdded, demosAdded, demosCompleted, projectsCompleted, periodStart, periodEnd };
};

const generateCOETextReport = (data: COEReportData, type: 'weekly' | 'monthly'): string => {
  const { projectsAdded, demosAdded, demosCompleted, projectsCompleted, periodStart, periodEnd } = data;

  let report = `╔══════════════════════════════════════════════════════════════╗\n`;
  report += `║           COE TEAM ${type.toUpperCase()} REPORT                         ║\n`;
  report += `╚══════════════════════════════════════════════════════════════╝\n\n`;
  
  report += `📅 Period: ${formatDate(periodStart)} - ${formatDate(periodEnd)}\n`;
  report += `🕐 Generated: ${format(new Date(), 'MMM dd, yyyy h:mm a')}\n\n`;
  
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `                         SUMMARY                               \n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  report += `  📋 Projects Added:       ${String(projectsAdded.length).padStart(3)}\n`;
  report += `  🚀 Demos Added:          ${String(demosAdded.length).padStart(3)}\n`;
  report += `  ✅ Demos Completed:      ${String(demosCompleted.length).padStart(3)}\n`;
  report += `  🎉 Projects Completed:   ${String(projectsCompleted.length).padStart(3)}\n`;
  report += `  ─────────────────────────────\n`;
  report += `  📈 Total Activities:     ${String(projectsAdded.length + demosAdded.length + demosCompleted.length + projectsCompleted.length).padStart(3)}\n\n`;

  if (projectsAdded.length > 0) {
    report += `┌──────────────────────────────────────────────────────────────┐\n`;
    report += `│  📋 PROJECTS ADDED                                           │\n`;
    report += `└──────────────────────────────────────────────────────────────┘\n\n`;
    report += `  ${'Customer'.padEnd(25)} ${'Service'.padEnd(15)} ${'Manager'.padEnd(15)} ${'Date'}\n`;
    report += `  ${'─'.repeat(25)} ${'─'.repeat(15)} ${'─'.repeat(15)} ${'─'.repeat(12)}\n`;
    projectsAdded.forEach((p: any) => {
      const name = (p.customer_name || 'Unknown').substring(0, 23);
      const service = (p.service_type || 'N/A').substring(0, 13);
      const manager = (p.project_manager || 'N/A').substring(0, 13);
      const date = formatDate(p.created_at);
      report += `  ${name.padEnd(25)} ${service.padEnd(15)} ${manager.padEnd(15)} ${date}\n`;
    });
    report += `\n`;
  }

  if (demosAdded.length > 0) {
    report += `┌──────────────────────────────────────────────────────────────┐\n`;
    report += `│  🚀 DEMOS ADDED                                              │\n`;
    report += `└──────────────────────────────────────────────────────────────┘\n\n`;
    report += `  ${'Customer'.padEnd(25)} ${'Service'.padEnd(15)} ${'Manager'.padEnd(15)} ${'Date'}\n`;
    report += `  ${'─'.repeat(25)} ${'─'.repeat(15)} ${'─'.repeat(15)} ${'─'.repeat(12)}\n`;
    demosAdded.forEach((p: any) => {
      const name = (p.customer_name || 'Unknown').substring(0, 23);
      const service = (p.service_type || 'N/A').substring(0, 13);
      const manager = (p.project_manager || 'N/A').substring(0, 13);
      const date = formatDate(p.created_at);
      report += `  ${name.padEnd(25)} ${service.padEnd(15)} ${manager.padEnd(15)} ${date}\n`;
    });
    report += `\n`;
  }

  if (demosCompleted.length > 0) {
    report += `┌──────────────────────────────────────────────────────────────┐\n`;
    report += `│  ✅ DEMOS COMPLETED                                          │\n`;
    report += `└──────────────────────────────────────────────────────────────┘\n\n`;
    report += `  ${'Customer'.padEnd(25)} ${'Service'.padEnd(15)} ${'Manager'.padEnd(15)} ${'Date'}\n`;
    report += `  ${'─'.repeat(25)} ${'─'.repeat(15)} ${'─'.repeat(15)} ${'─'.repeat(12)}\n`;
    demosCompleted.forEach((p: any) => {
      const name = (p.customer_name || 'Unknown').substring(0, 23);
      const service = (p.service_type || 'N/A').substring(0, 13);
      const manager = (p.project_manager || 'N/A').substring(0, 13);
      const date = formatDate(p.updated_at);
      report += `  ${name.padEnd(25)} ${service.padEnd(15)} ${manager.padEnd(15)} ${date}\n`;
    });
    report += `\n`;
  }

  if (projectsCompleted.length > 0) {
    report += `┌──────────────────────────────────────────────────────────────┐\n`;
    report += `│  🎉 PROJECTS COMPLETED                                       │\n`;
    report += `└──────────────────────────────────────────────────────────────┘\n\n`;
    report += `  ${'Customer'.padEnd(25)} ${'Service'.padEnd(15)} ${'Manager'.padEnd(15)} ${'Date'}\n`;
    report += `  ${'─'.repeat(25)} ${'─'.repeat(15)} ${'─'.repeat(15)} ${'─'.repeat(12)}\n`;
    projectsCompleted.forEach((p: any) => {
      const name = (p.customer_name || 'Unknown').substring(0, 23);
      const service = (p.service_type || 'N/A').substring(0, 13);
      const manager = (p.project_manager || 'N/A').substring(0, 13);
      const date = formatDate(p.updated_at);
      report += `  ${name.padEnd(25)} ${service.padEnd(15)} ${manager.padEnd(15)} ${date}\n`;
    });
    report += `\n`;
  }

  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `                      END OF REPORT                            \n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  return report;
};

const generateCOECSVReport = (data: COEReportData): string => {
  const { projectsAdded, demosAdded, demosCompleted, projectsCompleted, periodStart, periodEnd } = data;
  
  let csv = `COE Team Report - ${formatDate(periodStart)} to ${formatDate(periodEnd)}\n\n`;
  
  csv += `PROJECTS ADDED\n`;
  csv += `Customer,Service Type,Project Manager,Secondary Manager,Country,Date\n`;
  projectsAdded.forEach((p: any) => {
    csv += `${escapeCSV(p.customer_name)},${escapeCSV(p.service_type)},${escapeCSV(p.project_manager)},${escapeCSV(p.secondary_project_manager)},${escapeCSV(p.customers?.country)},${formatDate(p.created_at)}\n`;
  });
  
  csv += `\nDEMOS ADDED\n`;
  csv += `Customer,Service Type,Project Manager,Secondary Manager,Country,Date\n`;
  demosAdded.forEach((p: any) => {
    csv += `${escapeCSV(p.customer_name)},${escapeCSV(p.service_type)},${escapeCSV(p.project_manager)},${escapeCSV(p.secondary_project_manager)},${escapeCSV(p.customers?.country)},${formatDate(p.created_at)}\n`;
  });
  
  csv += `\nDEMOS COMPLETED\n`;
  csv += `Customer,Service Type,Project Manager,Secondary Manager,Country,Date\n`;
  demosCompleted.forEach((p: any) => {
    csv += `${escapeCSV(p.customer_name)},${escapeCSV(p.service_type)},${escapeCSV(p.project_manager)},${escapeCSV(p.secondary_project_manager)},${escapeCSV(p.customers?.country)},${formatDate(p.updated_at)}\n`;
  });
  
  csv += `\nPROJECTS COMPLETED\n`;
  csv += `Customer,Service Type,Project Manager,Secondary Manager,Country,Date\n`;
  projectsCompleted.forEach((p: any) => {
    csv += `${escapeCSV(p.customer_name)},${escapeCSV(p.service_type)},${escapeCSV(p.project_manager)},${escapeCSV(p.secondary_project_manager)},${escapeCSV(p.customers?.country)},${formatDate(p.updated_at)}\n`;
  });
  
  return csv;
};

// Activity Logs Export
const fetchActivityLogs = async (days: number): Promise<ActivityLogData> => {
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days);

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('*')
    .gte('created_at', periodStart.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Activity Logs] Query error:', error);
  }

  return { logs: logs || [], periodStart, periodEnd };
};

const generateActivityLogsTextReport = (data: ActivityLogData, type: 'weekly' | 'monthly'): string => {
  const { logs, periodStart, periodEnd } = data;

  let report = `╔══════════════════════════════════════════════════════════════╗\n`;
  report += `║           ACTIVITY LOGS ${type.toUpperCase()} REPORT                    ║\n`;
  report += `╚══════════════════════════════════════════════════════════════╝\n\n`;
  
  report += `📅 Period: ${formatDate(periodStart)} - ${formatDate(periodEnd)}\n`;
  report += `🕐 Generated: ${format(new Date(), 'MMM dd, yyyy h:mm a')}\n`;
  report += `📊 Total Activities: ${logs.length}\n\n`;
  
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `                       ACTIVITY LOG                            \n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  report += `  ${'Date & Time'.padEnd(20)} ${'User'.padEnd(20)} ${'Action'.padEnd(20)} ${'Entity'}\n`;
  report += `  ${'─'.repeat(20)} ${'─'.repeat(20)} ${'─'.repeat(20)} ${'─'.repeat(15)}\n`;
  
  logs.forEach((log: any) => {
    const dateTime = format(new Date(log.created_at), 'MMM dd, h:mm a');
    const user = (log.user_name || log.user_email || 'Unknown').substring(0, 18);
    const action = (log.action || 'N/A').replace(/_/g, ' ').substring(0, 18);
    const entity = (log.entity_name || log.entity_type || 'N/A').substring(0, 15);
    report += `  ${dateTime.padEnd(20)} ${user.padEnd(20)} ${action.padEnd(20)} ${entity}\n`;
  });

  report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `                      END OF REPORT                            \n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  return report;
};

const generateActivityLogsCSVReport = (data: ActivityLogData): string => {
  const { logs, periodStart, periodEnd } = data;
  
  let csv = `Activity Logs Report - ${formatDate(periodStart)} to ${formatDate(periodEnd)}\n\n`;
  csv += `Date,Time,User,Email,Action,Entity Type,Entity Name\n`;
  
  logs.forEach((log: any) => {
    const date = format(new Date(log.created_at), 'yyyy-MM-dd');
    const time = format(new Date(log.created_at), 'HH:mm:ss');
    csv += `${date},${time},${escapeCSV(log.user_name)},${escapeCSV(log.user_email)},${escapeCSV(log.action)},${escapeCSV(log.entity_type)},${escapeCSV(log.entity_name)}\n`;
  });
  
  return csv;
};

// Export Functions
export const generateWeeklyReport = async () => {
  const data = await fetchWeeklyData();
  const report = generateTextReport(data, 'weekly');
  const filename = `bd-team-weekly-${format(data.periodStart, 'yyyy-MM-dd')}.txt`;
  downloadReport(report, filename);
};

export const generateMonthlyReport = async () => {
  const data = await fetchMonthlyData();
  const report = generateTextReport(data, 'monthly');
  const filename = `bd-team-monthly-${format(data.periodStart, 'yyyy-MM-dd')}.txt`;
  downloadReport(report, filename);
};

export const generateBDWeeklyCSV = async () => {
  const data = await fetchWeeklyData();
  const csv = generateBDCSVReport(data);
  const filename = `bd-team-weekly-${format(data.periodStart, 'yyyy-MM-dd')}.csv`;
  downloadReport(csv, filename);
};

export const generateBDMonthlyCSV = async () => {
  const data = await fetchMonthlyData();
  const csv = generateBDCSVReport(data);
  const filename = `bd-team-monthly-${format(data.periodStart, 'yyyy-MM-dd')}.csv`;
  downloadReport(csv, filename);
};

export const generateCOEWeeklyReport = async () => {
  const data = await fetchCOEData(7);
  const report = generateCOETextReport(data, 'weekly');
  const filename = `coe-team-weekly-${format(data.periodStart, 'yyyy-MM-dd')}.txt`;
  downloadReport(report, filename);
};

export const generateCOEMonthlyReport = async () => {
  const data = await fetchCOEData(30);
  const report = generateCOETextReport(data, 'monthly');
  const filename = `coe-team-monthly-${format(data.periodStart, 'yyyy-MM-dd')}.txt`;
  downloadReport(report, filename);
};

export const generateCOEWeeklyCSV = async () => {
  const data = await fetchCOEData(7);
  const csv = generateCOECSVReport(data);
  const filename = `coe-team-weekly-${format(data.periodStart, 'yyyy-MM-dd')}.csv`;
  downloadReport(csv, filename);
};

export const generateCOEMonthlyCSV = async () => {
  const data = await fetchCOEData(30);
  const csv = generateCOECSVReport(data);
  const filename = `coe-team-monthly-${format(data.periodStart, 'yyyy-MM-dd')}.csv`;
  downloadReport(csv, filename);
};

export const generateActivityLogsWeeklyReport = async () => {
  const data = await fetchActivityLogs(7);
  const report = generateActivityLogsTextReport(data, 'weekly');
  const filename = `activity-logs-weekly-${format(data.periodStart, 'yyyy-MM-dd')}.txt`;
  downloadReport(report, filename);
};

export const generateActivityLogsMonthlyReport = async () => {
  const data = await fetchActivityLogs(30);
  const report = generateActivityLogsTextReport(data, 'monthly');
  const filename = `activity-logs-monthly-${format(data.periodStart, 'yyyy-MM-dd')}.txt`;
  downloadReport(report, filename);
};

export const generateActivityLogsWeeklyCSV = async () => {
  const data = await fetchActivityLogs(7);
  const csv = generateActivityLogsCSVReport(data);
  const filename = `activity-logs-weekly-${format(data.periodStart, 'yyyy-MM-dd')}.csv`;
  downloadReport(csv, filename);
};

export const generateActivityLogsMonthlyCSV = async () => {
  const data = await fetchActivityLogs(30);
  const csv = generateActivityLogsCSVReport(data);
  const filename = `activity-logs-monthly-${format(data.periodStart, 'yyyy-MM-dd')}.csv`;
  downloadReport(csv, filename);
};
