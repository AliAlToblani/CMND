
import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Filter,
  Search, 
  FileSignature,
  FileCheck,
  FileWarning,
  Download,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddEditContract, ContractData } from "@/components/contracts/AddEditContract";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { contractQueryKeys, calculateContractValue, formatCurrency } from "@/utils/contractUtils";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ContractsByYearView from "@/components/contracts/ContractsByYearView";
import ContractPaymentsView from "@/components/contracts/ContractPaymentsView";

const getStatusBadge = (status: string) => {
  switch(status) {
    case "active":
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    case "pending":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Pending</Badge>;
    case "expired":
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
    case "draft":
      return <Badge variant="outline" className="bg-muted text-foreground border-border">Draft</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getContractIcon = (type: string) => {
  switch(type) {
    case "Service Agreement":
      return <FileSignature className="h-4 w-4 text-doo-purple-500" />;
    case "Implementation":
      return <FileCheck className="h-4 w-4 text-doo-purple-500" />;
    case "Support":
      return <FileWarning className="h-4 w-4 text-doo-purple-500" />;
    default:
      return <FileText className="h-4 w-4 text-doo-purple-500" />;
  }
};

const ContractsPage = () => {
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [revenueFilter, setRevenueFilter] = useState<"all" | "realized" | "unrealized">("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  
  const fetchContracts = async () => {
    try {
      setLoading(true);
      
      // Fetch contracts from the database
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          customers (name)
        `);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Map database contracts to our ContractData format
        const formattedContracts: ContractData[] = data.map(contract => ({
          id: contract.id,
          customer: contract.customers?.name || "Unknown Customer",
          customerId: contract.customer_id,
          contractNumber: contract.contract_number || "",
          status: (contract.status as "active" | "pending" | "expired" | "draft") || "draft",
          type: contract.name || "Service Agreement",
          startDate: contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : "-",
          endDate: contract.end_date ? new Date(contract.end_date).toISOString().split('T')[0] : "-",
          value: `$${contract.value.toLocaleString()}`,
          setupFee: contract.setup_fee ? `${contract.setup_fee}` : "0",
          annualRate: contract.annual_rate ? `${contract.annual_rate}` : "0",
          paymentFrequency: (contract.payment_frequency as "annual" | "quarterly" | "semi-annual" | "one-time") || "annual",
          documentUrl: undefined,
          documentName: undefined
        }));
        
        setContracts(formattedContracts);
      } else {
        // No contracts found, use empty array
        setContracts([]);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to fetch contracts");
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchContracts();
  }, []);

  // Real-time subscription for live updates across users
  useEffect(() => {
    const channel = supabase
      .channel('contracts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts'
        },
        (payload) => {
          console.log('🔄 Contract change detected:', payload.eventType);
          fetchContracts();
        }
      )
      .subscribe((status) => {
        console.log('📡 Contracts realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const handleAddContract = async (newContract: Partial<ContractData>) => {
    try {
      if (!newContract.customerId) {
        toast.error("Customer ID is required");
        return;
      }
      
      // Insert into database
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          customer_id: newContract.customerId,
          name: newContract.type || "Service Agreement",
          status: newContract.status || "draft",
          start_date: newContract.startDate && newContract.startDate !== "-" 
            ? new Date(newContract.startDate).toISOString() 
            : null,
          end_date: newContract.endDate && newContract.endDate !== "-" 
            ? new Date(newContract.endDate).toISOString() 
            : null,
          value: parseInt(newContract.value?.replace(/[^0-9.-]+/g, "") || "0"),
          setup_fee: parseInt(newContract.setupFee?.replace(/[^0-9.-]+/g, "") || "0"),
          annual_rate: parseInt(newContract.annualRate?.replace(/[^0-9.-]+/g, "") || "0"),
          payment_frequency: newContract.paymentFrequency || "annual",
          terms: null
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const newContractData: ContractData = {
          id: data[0].id,
          customer: newContract.customer || "Unknown Customer",
          customerId: newContract.customerId,
          status: newContract.status || "draft",
          type: newContract.type || "Service Agreement",
          startDate: newContract.startDate || "-",
          endDate: newContract.endDate || "-",
          value: newContract.value || "$0",
          setupFee: newContract.setupFee || "0",
          annualRate: newContract.annualRate || "0",
          paymentFrequency: newContract.paymentFrequency || "annual",
          documentUrl: newContract.documentUrl,
          documentName: newContract.documentName
        };
        
        setContracts(prevContracts => [...prevContracts, newContractData]);
        
        // Invalidate related queries to sync across pages
        queryClient.invalidateQueries({ queryKey: contractQueryKeys.all });
        queryClient.invalidateQueries({ queryKey: contractQueryKeys.subscription() });
        queryClient.invalidateQueries({ queryKey: ['all-customers-for-filters'] });
        
        toast.success("Contract created successfully");
      }
    } catch (error) {
      console.error("Error adding contract:", error);
      toast.error("Failed to add contract");
    }
  };
  
  const handleUpdateContract = async (contractId: string, updatedContract: Partial<ContractData>) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('contracts')
        .update({
          name: updatedContract.type,
          status: updatedContract.status,
          start_date: updatedContract.startDate && updatedContract.startDate !== "-" 
            ? new Date(updatedContract.startDate).toISOString() 
            : null,
          end_date: updatedContract.endDate && updatedContract.endDate !== "-" 
            ? new Date(updatedContract.endDate).toISOString() 
            : null,
          value: parseInt(updatedContract.value?.replace(/[^0-9.-]+/g, "") || "0"),
          setup_fee: parseInt(updatedContract.setupFee?.replace(/[^0-9.-]+/g, "") || "0"),
          annual_rate: parseInt(updatedContract.annualRate?.replace(/[^0-9.-]+/g, "") || "0"),
          payment_frequency: updatedContract.paymentFrequency || "annual"
        })
        .eq('id', contractId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedContracts = contracts.map(contract => {
        if (contract.id === contractId) {
          return { ...contract, ...updatedContract };
        }
        return contract;
      });
      
      setContracts(updatedContracts);
      
      // Invalidate related queries to sync across pages
      queryClient.invalidateQueries({ queryKey: contractQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: contractQueryKeys.subscription() });
      queryClient.invalidateQueries({ queryKey: ['all-customers-for-filters'] });
      
      toast.success("Contract updated successfully");
    } catch (error) {
      console.error("Error updating contract:", error);
      toast.error("Failed to update contract");
    }
  };
  
  const handleDownloadContract = (contract: ContractData) => {
    if (contract.documentUrl) {
      toast.success(`Downloading ${contract.documentName || 'contract'}`);
      
      const link = document.createElement('a');
      link.href = contract.documentUrl;
      link.download = contract.documentName || 'contract.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("No document available for this contract");
    }
  };
  
  const parseContractValue = (v: string) => {
    const n = Number(v.replace(/[^0-9.-]+/g, ""));
    return isNaN(n) ? 0 : n;
  };

  const getContractYear = (contract: ContractData): string | null => {
    if (!contract.startDate || contract.startDate === "-") return null;
    const y = contract.startDate.substring(0, 4);
    return /^\d{4}$/.test(y) ? y : null;
  };

  const availableYears = Array.from(
    new Set(contracts.map(getContractYear).filter(Boolean) as string[])
  ).sort((a, b) => b.localeCompare(a));

  const filteredContracts = contracts.filter(contract => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesCustomer = contract.customer.toLowerCase().includes(searchLower);
      const matchesContractNumber = contract.contractNumber?.toLowerCase().includes(searchLower);
      if (!matchesCustomer && !matchesContractNumber) return false;
    }
    if (revenueFilter === "realized" && contract.status !== "active") return false;
    if (revenueFilter === "unrealized" && contract.status !== "pending") return false;
    if (yearFilter !== "all" && getContractYear(contract) !== yearFilter) return false;
    return true;
  });

  const activeContracts = filteredContracts.filter(c => c.status === "active");
  const pendingContracts = filteredContracts.filter(c => c.status === "pending");
  const realizedRevenue = activeContracts.reduce((sum, c) => sum + parseContractValue(c.value), 0);
  const unrealizedRevenue = pendingContracts.reduce((sum, c) => sum + parseContractValue(c.value), 0);
  const filteredValue = filteredContracts.reduce((sum, c) => sum + parseContractValue(c.value), 0);

  const activeFilterCount =
    (revenueFilter !== "all" ? 1 : 0) + (yearFilter !== "all" ? 1 : 0);

  const refreshContracts = () => {
    fetchContracts();
    toast.success("Contracts refreshed");
  };

  return (
    <DashboardLayout>
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="by-year">By Year</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-2xl font-bold">Contracts</h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search contracts..." 
                    className="pl-8 glass-input w-[220px]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-1.5">
                      <Filter className="h-4 w-4" />
                      Filter
                      {activeFilterCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="h-4 w-4 p-0 flex items-center justify-center text-[10px] ml-0.5"
                        >
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-3 space-y-3" align="end">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Filters</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          setRevenueFilter("all");
                          setYearFilter("all");
                        }}
                      >
                        Clear
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Revenue Type</label>
                      <Select
                        value={revenueFilter}
                        onValueChange={(v) => setRevenueFilter(v as "all" | "realized" | "unrealized")}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Contracts</SelectItem>
                          <SelectItem value="realized">Realized Revenue (Active)</SelectItem>
                          <SelectItem value="unrealized">Unrealized Revenue (Pending)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Year</label>
                      <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          {availableYears.map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="sm" onClick={refreshContracts} title="Refresh">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card className="glass-card animate-fade-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Contract Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 mb-5 ${revenueFilter !== "all" ? "grid-cols-3" : "grid-cols-2"}`}>
                  <Card className="glass-card p-4 animate-bounce-in" style={{ animationDelay: "0.1s" }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Contracts</p>
                        <h3 className="text-2xl font-bold">{filteredContracts.length}</h3>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-doo-purple-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-doo-purple-600" />
                      </div>
                    </div>
                  </Card>
                  <Card className="glass-card p-4 animate-bounce-in" style={{ animationDelay: "0.2s" }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Value</p>
                        <h3 className="text-2xl font-bold">{formatCurrency(filteredValue)}</h3>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-doo-purple-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-doo-purple-600" />
                      </div>
                    </div>
                  </Card>
                  {revenueFilter === "realized" && (
                    <Card className="glass-card p-4 animate-bounce-in" style={{ animationDelay: "0.3s" }}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Realized Revenue</p>
                          <h3 className="text-2xl font-bold text-green-600">{formatCurrency(realizedRevenue)}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {activeContracts.length} active
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    </Card>
                  )}
                  {revenueFilter === "unrealized" && (
                    <Card className="glass-card p-4 animate-bounce-in" style={{ animationDelay: "0.3s" }}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Unrealized Revenue</p>
                          <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(unrealizedRevenue)}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {pendingContracts.length} pending
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Contract #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array(3).fill(0).map((_, index) => (
                          <TableRow key={`loading-${index}`}>
                            <TableCell colSpan={8}>
                              <div className="h-12 bg-muted animate-pulse rounded"></div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : filteredContracts.length > 0 ? (
                        filteredContracts.map((contract, index) => (
                          <TableRow key={contract.id} className="animate-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
                            <TableCell className="font-mono text-sm">
                              {contract.contractNumber || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="font-medium">{contract.customer}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {getContractIcon(contract.type)}
                                <span className="ml-2">{contract.type}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(contract.status)}</TableCell>
                            <TableCell>{contract.startDate}</TableCell>
                            <TableCell>{contract.endDate}</TableCell>
                            <TableCell>{contract.value}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <div className="flex items-center space-x-1">
                                  <AddEditContract 
                                    contract={contract}
                                    isEditing={true}
                                    onSave={(updatedContract) => handleUpdateContract(contract.id!, updatedContract)}
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDownloadContract(contract)}
                                    disabled={!contract.documentUrl}
                                    title="Download contract"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No contracts found. Try adjusting your filters or create a new contract.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="by-year">
          <ContractsByYearView />
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Payment Tracking</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Track and collect payments across active contracts
                </p>
              </div>
              <AddEditContract onSave={handleAddContract} />
            </div>
            <ContractPaymentsView />
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ContractsPage;
