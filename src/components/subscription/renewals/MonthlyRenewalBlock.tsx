
import React, { useState } from "react";
import { ProcessedCustomer } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronRight, Calendar, DollarSign } from "lucide-react";
import { EditRenewalDialog } from "./EditRenewalDialog";
import { ViewContractsDialog } from "./ViewContractsDialog";

interface MonthlyRenewalBlockProps {
  monthYear: string;
  customers: ProcessedCustomer[];
  onUpdateDate: (customerId: string, newDate: string, customerName: string) => void;
}

export const MonthlyRenewalBlock: React.FC<MonthlyRenewalBlockProps> = ({
  monthYear,
  customers,
  onUpdateDate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalValue = customers.reduce((sum, customer) => {
    return sum + (customer.annual_rate || 0);
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-0 h-auto"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-lg">{monthYear}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {customers.length} Contract Renewal{customers.length !== 1 ? 's' : ''}
              </div>
              <div className="font-semibold text-green-600 flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {formatCurrency(totalValue)}
              </div>
            </div>
            <div className="flex -space-x-2">
              {customers.slice(0, 5).map((customer) => (
                <Avatar key={customer.id} className="h-8 w-8 border-2 border-white">
                  <AvatarImage src={customer.logo || ""} alt={customer.name} />
                  <AvatarFallback className="bg-doo-purple-100 text-doo-purple-700 text-xs">
                    {customer.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {customers.length > 5 && (
                <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                  +{customers.length - 5}
                </div>
              )}
            </div>
          </div>
        </Button>

        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-4">
            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={customer.logo || ""} alt={customer.name} />
                    <AvatarFallback className="bg-doo-purple-100 text-doo-purple-700">
                      {customer.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-500">
                      Owner: {customer.owner_id || 'Unassigned'} • 
                      Renewal: {customer.subscription_end_date ? 
                        new Date(customer.subscription_end_date).toLocaleDateString() : 
                        'Not set'
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <EditRenewalDialog
                    customerId={customer.id}
                    customerName={customer.name}
                    currentDate={customer.subscription_end_date}
                    onUpdateDate={onUpdateDate}
                  />
                  <ViewContractsDialog
                    customerId={customer.id}
                    customerName={customer.name}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
