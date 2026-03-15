import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/customerUtils";
import { TrendingUp, ExternalLink, Info, FileText } from "lucide-react";

interface ARRCustomer {
  id: string;
  name: string;
  annual_revenue: number;
  contract_count: number;
}

interface ARRContract {
  id: string;
  customerId: string;
  customerName: string;
  contractNumber: string | null;
  amount: number;
  status: string;
  startDate: string | null;
}

interface TotalARRDetailProps {
  countries?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    case 'pending':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pending</Badge>;
    case 'expired':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Expired</Badge>;
    default:
      return <Badge variant="outline">{status || '—'}</Badge>;
  }
}

export const TotalARRDetail = ({ countries, dateFrom, dateTo }: TotalARRDetailProps) => {
  const [customers, setCustomers] = useState<ARRCustomer[]>([]);
  const [contracts, setContracts] = useState<ARRContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalARR, setTotalARR] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchARRDetails = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let query = supabase
          .from('contracts')
          .select(`
            id,
            contract_number,
            annual_rate,
            setup_fee,
            value,
            status,
            start_date,
            customer_id,
            customers!inner(id, name, status, country)
          `)
          .or('status.eq.active,status.eq.pending,status.eq.expired,status.is.null');
        
        if (countries && countries.length > 0) {
          query = query.in('customers.country', countries);
        }
        
        const { data: contractsData, error: contractsError } = await query;

        if (contractsError) throw contractsError;

        const customerARRMap = new Map<string, ARRCustomer>();
        const contractList: ARRContract[] = [];

        (contractsData || []).forEach(contract => {
          const customer = contract.customers as any;
          const customerId = customer.id;
          
          if (customer.status === 'churned') return;

          const start = (contract as any).start_date ? new Date((contract as any).start_date) : null;
          const hasStarted = !start || start <= today;
          if (!hasStarted) return;

          const c = contract as any;
          const rate = (c.annual_rate || 0) > 0 ? c.annual_rate : (c.value || 0) > 0 ? c.value : 0;
          if (rate <= 0) return;
          
          contractList.push({
            id: c.id,
            customerId,
            customerName: customer.name,
            contractNumber: c.contract_number || null,
            amount: rate,
            status: (c.status || 'unknown').toLowerCase(),
            startDate: c.start_date || null,
          });
          
          if (!customerARRMap.has(customerId)) {
            customerARRMap.set(customerId, {
              id: customer.id,
              name: customer.name,
              annual_revenue: 0,
              contract_count: 0
            });
          }
          
          const existingCustomer = customerARRMap.get(customerId)!;
          existingCustomer.annual_revenue += rate;
          existingCustomer.contract_count += 1;
        });

        const arrCustomers = Array.from(customerARRMap.values()).filter(customer => customer.annual_revenue > 0);
        const total = arrCustomers.reduce((sum, customer) => sum + customer.annual_revenue, 0);

        arrCustomers.sort((a, b) => b.annual_revenue - a.annual_revenue);
        contractList.sort((a, b) => b.amount - a.amount);

        setCustomers(arrCustomers);
        setContracts(contractList);
        setTotalARR(total);
      } catch (error) {
        console.error("Error fetching ARR details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchARRDetails();
  }, [countries, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        {Array(8).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calculation Explanation */}
      <div className="flex items-start gap-3 bg-muted/50 border border-border rounded-lg p-4">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">How it's calculated:</span>{" "}
          Sum of annual_rate from contracts that have started (setup fees excluded). Uses value when annual_rate not set. Excludes future contracts only.
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Total ARR: {formatCurrency(totalARR)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {customers.length} customers • {contracts.length} contracts
            {" • "}
            <span className="text-green-600 font-medium">{contracts.filter(c => c.status === 'active').length} active</span>
            {" • "}
            <span className="text-blue-600 font-medium">{contracts.filter(c => c.status === 'pending').length} pending</span>
            {contracts.filter(c => c.status === 'expired').length > 0 && (
              <> • <span className="text-amber-600 font-medium">{contracts.filter(c => c.status === 'expired').length} expired</span></>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Contract breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            All Contracts Included ({contracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Customer</TableHead>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead className="text-right">ARR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate(`/customers/${c.customerId}`)}
                  >
                    <TableCell className="font-medium">{c.customerName}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {c.contractNumber || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.startDate ? new Date(c.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(c.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {customers.map(customer => (
          <Card 
            key={customer.id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate(`/customers/${customer.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.contract_count} contract{customer.contract_count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">{formatCurrency(customer.annual_revenue)}/year</p>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
