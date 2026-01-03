
import React from "react";
import { ProcessedCustomer } from "../types";
import { CustomerTimeline } from "./CustomerTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TimelineViewProps {
  customers: ProcessedCustomer[];
  isLoading: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ customers, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-5/6"></div>
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
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground dark:text-gray-100 mb-2">
            No subscriptions found
          </h3>
          <p className="text-muted-foreground dark:text-muted-foreground">
            No live customers with subscription data found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {customers.map((customer) => (
        <CustomerTimeline key={customer.id} customer={customer} />
      ))}
    </div>
  );
};
