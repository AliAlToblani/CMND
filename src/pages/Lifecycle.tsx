
import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LifecycleTracker } from "@/components/lifecycle/LifecycleTracker";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { customers } from "@/data/mockData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customers";
import { LifecycleStageProps } from "@/components/lifecycle/LifecycleStage";
import { MessageSquare, Instagram, Globe, Mail, Smartphone } from "lucide-react";

const Lifecycle = () => {
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [customerStages, setCustomerStages] = useState<LifecycleStageProps[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert customerId to UUID format for database operations
  const getDbCustomerId = (customerId: string) => {
    // If it's already a UUID, return it
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId)) {
      return customerId;
    }
    
    // For our mock customers with format like "cust-001", we'll create a deterministic UUID
    // This approach ensures the same mock ID always maps to the same UUID
    return `00000000-0000-0000-0000-${customerId.replace(/\D/g, '').padStart(12, '0')}`;
  };

  // Fetch customers from Supabase
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('customers')
          .select('*');

        if (error) {
          throw error;
        }

        console.log("Fetched customers:", data);

        if (data && data.length > 0) {
          setCustomerList(data);
          setSelectedCustomer(data[0].id);
        } else {
          console.log("No customers found, creating from mock data");
          // If no customers exist in the database, use mock data
          // and create them in the database
          await createMockCustomers();
          
          // After inserting, fetch again
          const { data: updatedData, error: refetchError } = await supabase
            .from('customers')
            .select('*');
            
          if (refetchError) {
            throw refetchError;
          }
            
          if (updatedData && updatedData.length > 0) {
            console.log("Created and fetched customers:", updatedData);
            setCustomerList(updatedData);
            setSelectedCustomer(updatedData[0]?.id || "");
          } else {
            console.log("Still no customers, using mock data directly");
            // Fall back to mock data directly
            setCustomerList(customers);
            setSelectedCustomer(customers[0]?.id || "");
          }
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to load customers");
        // Fall back to mock data
        setCustomerList(customers);
        setSelectedCustomer(customers[0]?.id || "");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const createMockCustomers = async () => {
    try {
      for (const customer of customers) {
        const dbCustomerId = getDbCustomerId(customer.id);
        // Check if customer exists
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('id', dbCustomerId)
          .maybeSingle();
          
        if (!existingCustomer) {
          console.log("Creating customer:", customer.name, "with ID:", dbCustomerId);
          // Create the customer
          const { error: insertError } = await supabase
            .from('customers')
            .insert({
              id: dbCustomerId,
              name: customer.name,
              segment: customer.segment,
              region: customer.region,
              stage: customer.stage,
              status: customer.status,
              contract_size: customer.contractSize,
              owner_id: customer.owner?.id
            });
            
          if (insertError) {
            console.error("Error creating customer:", insertError);
          }
        }
      }
    } catch (error) {
      console.error("Error creating mock customers:", error);
    }
  };

  // Default integration stages to add for new customers
  const defaultIntegrationStages = [
    {
      name: "WhatsApp Integration",
      status: "not-started",
      owner: {
        id: "user-004",
        name: "Mohammed Rahman",
        role: "Integration Engineer"
      },
      notes: "Set up WhatsApp Business API for document uploads and verification",
      icon: <MessageSquare className="h-5 w-5 text-green-600" />
    },
    {
      name: "Instagram Account",
      status: "not-started",
      owner: {
        id: "user-004",
        name: "Mohammed Rahman",
        role: "Integration Engineer"
      },
      notes: "Set up Instagram business account and API connections",
      icon: <Instagram className="h-5 w-5 text-pink-600" />
    },
    {
      name: "Website Widget",
      status: "not-started",
      owner: {
        id: "user-004",
        name: "Mohammed Rahman",
        role: "Integration Engineer"
      },
      notes: "Embed the chat widget on customer website for interactions",
      icon: <Globe className="h-5 w-5 text-blue-600" />
    },
    {
      name: "Email Integration",
      status: "not-started",
      owner: {
        id: "user-004",
        name: "Mohammed Rahman",
        role: "Integration Engineer"
      },
      notes: "Connect email service for notifications and communications",
      icon: <Mail className="h-5 w-5 text-yellow-600" />
    },
    {
      name: "Mobile SDK Setup",
      status: "not-started",
      owner: {
        id: "user-004",
        name: "Mohammed Rahman",
        role: "Integration Engineer"
      },
      notes: "Implement native SDK for iOS and Android applications",
      icon: <Smartphone className="h-5 w-5 text-purple-600" />
    }
  ];

  const handleCustomerChange = async (value: string) => {
    console.log("Selected customer changed to:", value);
    setSelectedCustomer(value);
    await fetchCustomerStages(value);
  };

  const fetchCustomerStages = async (customerId: string) => {
    if (!customerId) {
      console.log("No customer ID provided, can't fetch stages");
      return;
    }
    
    try {
      setLoading(true);
      const dbCustomerId = getDbCustomerId(customerId);
      console.log("Fetching stages for customer ID:", customerId, "DB ID:", dbCustomerId);
      
      const { data, error } = await supabase
        .from('lifecycle_stages')
        .select(`
          *,
          staff(id, name, role)
        `)
        .eq('customer_id', dbCustomerId);

      if (error) {
        console.error("Error details:", error);
        throw error;
      }

      console.log("Fetched stages:", data);
      
      if (data) {
        // Convert Supabase data to LifecycleStageProps format
        const formattedStages: LifecycleStageProps[] = data.map((stage: any) => ({
          id: stage.id,
          name: stage.name,
          status: stage.status as "not-started" | "in-progress" | "done" | "blocked",
          owner: stage.staff ? {
            id: stage.staff.id,
            name: stage.staff.name,
            role: stage.staff.role
          } : {
            id: "user-001",
            name: "Ahmed Abdullah",
            role: "Account Executive"
          },
          deadline: stage.deadline,
          notes: stage.notes,
        }));

        setCustomerStages(formattedStages);
        
        // If no stages are found, automatically add default stages
        if (formattedStages.length === 0) {
          console.log("No stages found, adding default stages");
          await handleAddDefaultIntegrations(customerId);
        }
      }
    } catch (error) {
      console.error("Error fetching lifecycle stages:", error);
      toast.error("Failed to load lifecycle stages");
      setCustomerStages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDefaultIntegrations = async (customerId = selectedCustomer) => {
    if (!customerId) {
      console.log("No customer ID provided, can't add default integrations");
      return;
    }
    
    try {
      setLoading(true);
      const dbCustomerId = getDbCustomerId(customerId);
      console.log("Adding default stages for customer ID:", customerId, "DB ID:", dbCustomerId);
      
      // Check if integrations already exist for this customer
      const { data: existingStages } = await supabase
        .from('lifecycle_stages')
        .select('name')
        .eq('customer_id', dbCustomerId);
      
      const existingStageNames = existingStages?.map(stage => stage.name) || [];
      
      // Filter out integration stages that already exist
      const stagesToAdd = defaultIntegrationStages.filter(
        stage => !existingStageNames.includes(stage.name)
      );
      
      if (stagesToAdd.length === 0) {
        toast.info("Integration stages already exist for this customer");
        return;
      }
      
      // Prepare stages for insertion
      const stagesToInsert = stagesToAdd.map(stage => ({
        customer_id: dbCustomerId,
        name: stage.name,
        status: stage.status,
        owner_id: stage.owner.id,
        notes: stage.notes
      }));
      
      console.log("Inserting stages:", stagesToInsert);
      
      // Insert stages
      const { error } = await supabase
        .from('lifecycle_stages')
        .insert(stagesToInsert);
      
      if (error) {
        console.error("Error details:", error);
        throw error;
      }
      
      toast.success("Integration stages added successfully");
      
      // Refresh stages
      await fetchCustomerStages(customerId);
      
    } catch (error) {
      console.error("Error adding integration stages:", error);
      toast.error("Failed to add integration stages");
    } finally {
      setLoading(false);
    }
  };

  const handleStagesUpdate = (updatedStages: LifecycleStageProps[]) => {
    setCustomerStages(updatedStages);
    console.log("Updated stages:", updatedStages);
    toast.success("Lifecycle stages updated successfully");
  };

  const selectedCustomerData = customerList.find(
    (customer) => customer.id === selectedCustomer
  ) || customers.find((customer) => customer.id === selectedCustomer);

  useEffect(() => {
    if (selectedCustomer) {
      console.log("Selected customer useEffect:", selectedCustomer);
      fetchCustomerStages(selectedCustomer);
    }
  }, [selectedCustomer]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Customer Lifecycle</h1>
          <div className="flex items-center space-x-4">
            <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                ) : (
                  (customerList.length > 0 ? customerList : customers).map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => handleAddDefaultIntegrations()}
              disabled={loading || !selectedCustomer}
            >
              Add Integration Stages
            </Button>
          </div>
        </div>

        {selectedCustomerData && (
          <LifecycleTracker
            customerId={selectedCustomerData.id}
            customerName={selectedCustomerData.name}
            stages={customerStages}
            onStagesUpdate={handleStagesUpdate}
          />
        )}
        
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-center">
              <p className="text-muted-foreground">Loading lifecycle data...</p>
            </div>
          </div>
        )}
        
        {!loading && !selectedCustomerData && (
          <div className="flex justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground">No customer selected or available. Please select a customer.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Lifecycle;
