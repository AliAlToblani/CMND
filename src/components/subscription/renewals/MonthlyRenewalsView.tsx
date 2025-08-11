
import React from "react";
import { ProcessedCustomer } from "../types";
import { MonthlyRenewalBlock } from "./MonthlyRenewalBlock";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";

interface MonthlyRenewalsViewProps {
  customers: ProcessedCustomer[];
  isLoading: boolean;
  onUpdateDate: (customerId: string, newDate: string, customerName: string) => void;
}

export const MonthlyRenewalsView: React.FC<MonthlyRenewalsViewProps> = ({
  customers,
  isLoading,
  onUpdateDate
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-8 w-8 bg-gray-200 rounded-full border-2 border-white"></div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No subscription renewals found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No customers have completed their "Go Live" stage or match your current filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group customers by month/year of renewal date
  const groupedCustomers = customers.reduce((groups, customer) => {
    if (!customer.subscription_end_date) return groups;
    
    const date = new Date(customer.subscription_end_date);
    const monthYear = date.toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(customer);
    
    return groups;
  }, {} as Record<string, ProcessedCustomer[]>);

  // Sort month/year groups chronologically
  const sortedGroups = Object.entries(groupedCustomers).sort(([a], [b]) => {
    const dateA = new Date(a + ' 1');
    const dateB = new Date(b + ' 1');
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="space-y-4">
      {sortedGroups.map(([monthYear, groupCustomers]) => (
        <MonthlyRenewalBlock
          key={monthYear}
          monthYear={monthYear}
          customers={groupCustomers}
          onUpdateDate={onUpdateDate}
        />
      ))}
    </div>
  );
};
