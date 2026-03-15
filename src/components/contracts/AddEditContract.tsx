import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Edit, Plus, Upload } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface ContractData {
  id?: string;
  customer: string;
  customerId: string;
  contractNumber?: string;
  status: "active" | "pending" | "expired" | "draft";
  type: string;
  startDate: string;
  endDate: string;
  value: string;
  setupFee?: string;
  annualRate?: string;
  paymentFrequency?: "annual" | "quarterly" | "semi-annual" | "one-time";
  documentUrl?: string;
  documentName?: string;
  partnerLabel?: string | null;
}

interface AddEditContractProps {
  contract?: ContractData;
  isEditing?: boolean;
  onSave: (contract: Partial<ContractData>) => void;
}

interface CustomerOption {
  id: string;
  name: string;
}

export function AddEditContract({ contract, isEditing = false, onSave }: AddEditContractProps) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const location = useLocation();
  const isBatelco = location.pathname.startsWith("/batelco");
  const needsCustomerPicker = !isEditing && !contract?.customerId;
  
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString || dateString === "-") return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  };
  
  const getInitialFormData = (): Partial<ContractData> => ({
    customer: contract?.customer || "",
    contractNumber: contract?.contractNumber || "",
    customerId: contract?.customerId || "",
    status: contract?.status || "draft",
    type: contract?.type || "Service Agreement",
    startDate: formatDateForInput(contract?.startDate),
    endDate: formatDateForInput(contract?.endDate),
    value: contract?.value || "",
    setupFee: contract?.setupFee || "",
    annualRate: contract?.annualRate || "",
    paymentFrequency: contract?.paymentFrequency || "annual",
  });
  
  const [formData, setFormData] = useState<Partial<ContractData>>(getInitialFormData());

  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
      if (needsCustomerPicker) {
        fetchCustomers();
      }
    }
  }, [open, contract]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;

      let filtered = (data || []) as any[];
      if (isBatelco) {
        filtered = filtered.filter(
          (c) =>
            (c.partner_label && String(c.partner_label).toLowerCase() === "batelco") ||
            (c.country && String(c.country).trim().toLowerCase() === "bahrain")
        );
      }

      setCustomers(filtered.map((c) => ({ id: c.id, name: c.name })));
    } catch (err) {
      console.error("Error fetching customers for contract:", err);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setOpen(false);
  };

  const handleDateSelect = (field: string, date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [field]: date.toISOString().split('T')[0]
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload this file and get a URL
      setFormData(prev => ({
        ...prev,
        documentName: file.name,
        documentUrl: URL.createObjectURL(file)
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit contract">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Contract
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contract" : "Add New Contract"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Make changes to the existing contract." : "Create a new contract for this customer."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="customer">Customer*</Label>
            {needsCustomerPicker ? (
              <>
                <Select
                  value={formData.customerId || ""}
                  onValueChange={(value) => {
                    const selected = customers.find((c) => c.id === value);
                    setFormData((prev) => ({
                      ...prev,
                      customerId: value,
                      customer: selected?.name || "",
                    }));
                  }}
                  required
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select a customer"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 && !loadingCustomers ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No customers found</div>
                    ) : (
                      customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!formData.customerId && !loadingCustomers && customers.length > 0 && (
                  <p className="text-xs text-muted-foreground">Select a customer to attach this contract to</p>
                )}
              </>
            ) : (
              <Input
                id="customer"
                value={formData.customer}
                onChange={(e) => setFormData((prev) => ({ ...prev, customer: e.target.value }))}
                placeholder="Enter customer name"
                required
                disabled={isEditing}
              />
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contractNumber">Contract Number</Label>
            <Input
              id="contractNumber"
              value={formData.contractNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
              placeholder="e.g. CNT-2024-001"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Contract Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Service Agreement">Service Agreement</SelectItem>
                <SelectItem value="Implementation">Implementation</SelectItem>
                <SelectItem value="Support">Support</SelectItem>
                <SelectItem value="License">License</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as "active" | "pending" | "expired" | "draft" }))}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(new Date(formData.startDate), "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate ? new Date(formData.startDate) : undefined}
                    onSelect={(date) => handleDateSelect("startDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(new Date(formData.endDate), "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate ? new Date(formData.endDate) : undefined}
                    onSelect={(date) => handleDateSelect("endDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="paymentFrequency">Payment Frequency</Label>
            <Select value={formData.paymentFrequency} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentFrequency: value as "annual" | "quarterly" | "semi-annual" | "one-time" }))}>
              <SelectTrigger id="paymentFrequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                <SelectItem value="one-time">One-Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="setupFee">Setup Fee ($)</Label>
              <Input
                id="setupFee"
                value={formData.setupFee}
                onChange={(e) => setFormData(prev => ({ ...prev, setupFee: e.target.value }))}
                placeholder="Enter setup fee"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="annualRate">
                {formData.paymentFrequency === "one-time" ? "One-Time Amount ($)" : "Annual Rate ($)"}
              </Label>
              <Input
                id="annualRate"
                value={formData.annualRate}
                onChange={(e) => setFormData(prev => ({ ...prev, annualRate: e.target.value }))}
                placeholder={formData.paymentFrequency === "one-time" ? "Enter one-time amount" : "Enter annual rate"}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="value">Total Contract Value ($)</Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              placeholder="Enter total contract value"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="document">Upload Contract Document</Label>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="document-upload"
                className="cursor-pointer flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-md text-sm"
              >
                <Upload className="h-4 w-4" />
                {formData.documentName ? "Change Document" : "Upload Document"}
              </label>
              <input
                id="document-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
              {formData.documentName && (
                <div className="text-sm flex items-center justify-between bg-primary/5 p-2 rounded">
                  <span className="truncate">{formData.documentName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, documentName: undefined, documentUrl: undefined }))}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Update Contract" : "Add Contract"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
