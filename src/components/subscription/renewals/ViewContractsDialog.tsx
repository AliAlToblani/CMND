
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ViewContractsDialogProps {
  customerId: string;
  customerName: string;
}

export const ViewContractsDialog: React.FC<ViewContractsDialogProps> = ({
  customerId,
  customerName
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['customer-contracts', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          View Contracts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contracts for {customerName}</DialogTitle>
          <DialogDescription>
            View all contracts and their details for this customer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Contracts Found</h3>
              <p className="text-gray-500">No contracts have been created for this customer yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract, index) => (
                <Card key={contract.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">
                          Contract {index + 1}: {contract.name}
                        </h4>
                        <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                          {contract.status || 'Active'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600 flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(contract.value)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-gray-600">Start Date</div>
                          <div className="font-medium">{formatDate(contract.start_date)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-gray-600">End Date</div>
                          <div className="font-medium">{formatDate(contract.end_date)}</div>
                        </div>
                      </div>
                    </div>
                    
                    {contract.renewal_date && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm">
                          <div className="text-gray-600">Next Renewal</div>
                          <div className="font-medium">{formatDate(contract.renewal_date)}</div>
                        </div>
                      </div>
                    )}
                    
                    {contract.terms && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm">
                          <div className="text-gray-600 mb-1">Terms</div>
                          <div className="text-gray-800">{contract.terms}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
