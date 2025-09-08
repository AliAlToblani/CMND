import * as XLSX from 'xlsx';
import { CustomerData } from '@/types/customers';
import { defaultLifecycleStages } from '@/data/defaultLifecycleStages';

export interface ExportCustomerData {
  name: string;
  country: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contractSize: number;
  status: string;
  segment: string;
  createdAt: string;
  goLiveDate: string;
  [key: string]: string | number; // For dynamic lifecycle stage columns
}

export function exportCustomersToExcel(customers: CustomerData[]): void {
  try {
    // Create export data structure
    const exportData: ExportCustomerData[] = customers.map(customer => {
      const baseData: ExportCustomerData = {
        name: customer.name,
        country: customer.country || '',
        industry: customer.industry || '',
        contactName: customer.contact_name || '',
        contactEmail: customer.contact_email || '',
        contactPhone: customer.contact_phone || '',
        contractSize: customer.contractSize || 0,
        status: customer.status || '',
        segment: customer.segment || '',
        createdAt: '', // CustomerData doesn't have created_at, will be empty for now
        goLiveDate: customer.go_live_date ? new Date(customer.go_live_date).toLocaleDateString() : '',
      };

      // Add lifecycle stage columns
      defaultLifecycleStages.forEach(stage => {
        const stageKey = stage.name.replace(/\s+/g, '_');
        baseData[stageKey] = customer.completedStages?.includes(stage.name) ? 'Completed' : 'Not Started';
      });

      return baseData;
    });

    // Create worksheet headers
    const headers = [
      'Name',
      'Country', 
      'Industry',
      'Contact Name',
      'Contact Email',
      'Contact Phone',
      'Contract Size',
      'Status',
      'Segment',
      'Created Date',
      'Go Live Date',
      ...defaultLifecycleStages.map(stage => stage.name)
    ];

    // Create worksheet data
    const worksheetData = [
      headers,
      ...exportData.map(customer => [
        customer.name,
        customer.country,
        customer.industry,
        customer.contactName,
        customer.contactEmail,
        customer.contactPhone,
        customer.contractSize,
        customer.status,
        customer.segment,
        customer.createdAt,
        customer.goLiveDate,
        ...defaultLifecycleStages.map(stage => {
          const stageKey = stage.name.replace(/\s+/g, '_');
          return customer[stageKey];
        })
      ])
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-size columns
    const colWidths = headers.map(header => ({
      wch: Math.max(header.length, 15)
    }));
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers & Lifecycle');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `customers-lifecycle-export-${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export customers to Excel');
  }
}