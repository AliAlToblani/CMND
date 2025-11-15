import React from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { CustomerData } from "@/types/customers";

interface StalledCustomersSectionProps {
  customers: CustomerData[];
}

export const StalledCustomersSection: React.FC<StalledCustomersSectionProps> = ({ customers }) => {
  // Show customers that haven't moved stages in 30+ days
  const stalledCustomers = React.useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return customers
      .filter((c) => {
        if (!c.updated_at) return false;
        
        const lastUpdate = new Date(c.updated_at);
        const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Include only customers in early/mid stages who haven't moved in 30+ days
        const activeStages = ["Lead", "Qualified", "Demo", "Proposal", "Contract"];
        return (
          activeStages.includes(c.stage || "") && 
          daysSinceUpdate >= 30 &&
          c.stage !== "Lost" && 
          c.stage !== "Churned"
        );
      })
      .sort((a, b) => b.contractSize - a.contractSize) // Sort by value (highest first)
      .slice(0, 10);
  }, [customers]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const getDaysSinceUpdate = (updatedAt?: string) => {
    if (!updatedAt) return 0;
    const now = new Date();
    const lastUpdate = new Date(updatedAt);
    return Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (stalledCustomers.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold">Stalled Deals ({stalledCustomers.length})</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Deals that haven't moved stages in 30+ days
      </p>
      <div className="space-y-2">
        {stalledCustomers.map((customer, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-sm text-muted-foreground">{customer.stage || "Unknown"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">
                  {formatCurrency(customer.contractSize)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getDaysSinceUpdate(customer.updated_at)} days stalled
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
