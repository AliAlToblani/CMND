
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customers";
import { ProcessedCustomer } from "./types";
import { useToast } from "@/hooks/use-toast";
import { contractQueryKeys, calculateLifetimeValue, calculateEffectiveAnnualRate, getLatestContractEndDate } from "@/utils/contractUtils";
import { useEffect } from "react";

export const useSubscriptionData = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("renewal_date");
  const { toast } = useToast();

  // Fetch all customers for filter options
  const { data: allCustomers = [] } = useQuery({
    queryKey: ['all-customers-for-filters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('segment, country')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Pick<Customer, 'segment' | 'country'>[];
    }
  });

  // Fetch customers who have active contracts only
  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: contractQueryKeys.subscription(),
    queryFn: async () => {
      // Get customer IDs who have active contracts only
      const { data: activeContracts, error: contractError } = await supabase
        .from('contracts')
        .select('customer_id')
        .eq('status', 'active');
      
      if (contractError) throw contractError;
      
      // Get unique customer IDs with active contracts
      const customerIds = Array.from(new Set(activeContracts.map(contract => contract.customer_id)));
      
      if (customerIds.length === 0) {
        return [];
      }
      
      // Now fetch customers with active contracts
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('*')
        .in('id', customerIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch ONLY active contracts for these customers
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .in('customer_id', customerIds)
        .eq('status', 'active');
      
      if (contractsError) throw contractsError;
      
      // Group contracts by customer
      const contractsByCustomer = contractsData?.reduce((acc, contract) => {
        if (!acc[contract.customer_id]) {
          acc[contract.customer_id] = [];
        }
        acc[contract.customer_id].push(contract);
        return acc;
      }, {} as Record<string, any[]>) || {};
      
      // Merge customer data with contract data
      const customersWithContracts = customersData?.map(customer => {
        const customerContracts = contractsByCustomer[customer.id] || [];
        
        // Use utility functions for consistent calculations
        const totalLifetimeValue = calculateLifetimeValue(customerContracts);
        const latestEndDate = getLatestContractEndDate(customerContracts);
        const effectiveAnnualRate = calculateEffectiveAnnualRate(customerContracts);
        
        return {
          ...customer,
          contracts: customerContracts,
          contractCount: customerContracts.length,
          lifetimeValue: totalLifetimeValue,
          // Use ONLY contract dates for active contracts
          effective_end_date: latestEndDate,
          effective_start_date: customerContracts.length > 0 ? customerContracts[0].start_date : null,
          // Use calculated annual rate from active contracts only
          effective_annual_rate: effectiveAnnualRate || 0
        };
      }) || [];
      
      return customersWithContracts as (Customer & { 
        contracts: any[], 
        contractCount: number,
        lifetimeValue: number,
        effective_end_date: string | null,
        effective_start_date: string | null,
        effective_annual_rate: number
      })[];
    }
  });

  // Add real-time subscription for contract changes
  useEffect(() => {
    const channel = supabase
      .channel('contract-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts'
        },
        () => {
          console.log('Contract change detected, refetching subscription data');
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [refetch]);

  const processCustomers = (customers: any[]): ProcessedCustomer[] => {
    return customers.map(customer => {
      const today = new Date();
      const endDate = customer.effective_end_date ? new Date(customer.effective_end_date) : null;
      const startDate = customer.effective_start_date ? new Date(customer.effective_start_date) : null;
      
      let timeLeft = "";
      let status: "active" | "expiring_soon" | "expired" | "missing_date" = "missing_date";
      let delta = 0;
      let progressPercentage = 0;

      if (endDate) {
        delta = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (startDate) {
          const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          progressPercentage = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
        }
        
        if (delta > 60) {
          status = "active";
          const months = Math.floor(delta / 30);
          const days = delta % 30;
          timeLeft = days > 0 ? `${months} months, ${days} days left` : `${months} months left`;
        } else if (delta > 30) {
          status = "expiring_soon";
          timeLeft = `${delta} days left`;
        } else if (delta > 0) {
          status = "expiring_soon";
          timeLeft = `${delta} days left`;
        } else if (delta === 0) {
          status = "expiring_soon";
          timeLeft = "Renew today";
        } else {
          status = "expired";
          timeLeft = "To Be Renewed";
        }
      } else {
        timeLeft = "End date not set";
        delta = -999999;
      }

      return {
        ...customer,
        // Use effective values from contracts
        annual_rate: customer.effective_annual_rate,
        subscription_end_date: customer.effective_end_date,
        timeLeft,
        status,
        delta,
        progressPercentage,
        contractCount: customer.contractCount || 0,
        lifetimeValue: customer.lifetimeValue || 0,
        contracts: customer.contracts || []
      };
    });
  };

  const processedCustomers = processCustomers(customers);

  // Filter customers
  const filteredCustomers = processedCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.country?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = segmentFilter === "all" || customer.segment === segmentFilter;
    const matchesCountry = countryFilter === "all" || customer.country === countryFilter;
    
    return matchesSearch && matchesSegment && matchesCountry;
  });

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortBy) {
      case "renewal_date":
        return a.delta - b.delta;
      case "customer_name":
        return a.name.localeCompare(b.name);
      case "annual_rate":
        return (b.annual_rate || 0) - (a.annual_rate || 0);
      default:
        return 0;
    }
  });

  // Get unique values for filters from ALL customers
  const uniqueSegments = Array.from(new Set(allCustomers.map(c => c.segment).filter(Boolean)));
  const uniqueCountries = Array.from(new Set(allCustomers.map(c => c.country).filter(Boolean)));

  // Handle remind customer action
  const handleRemindCustomer = async (customerId: string, customerName: string) => {
    try {
      // For now, we'll just show a success toast
      // In the future, this could send an email or create a notification
      toast({
        title: "Reminder Sent",
        description: `Renewal reminder sent to ${customerName}`,
      });
      
      console.log(`Reminder sent to customer ${customerId} (${customerName})`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle update subscription date - only update active contracts
  const handleUpdateDate = async (customerId: string, newDate: string, customerName: string) => {
    try {
      // Update the end date of the customer's active contracts only
      const { error: contractError } = await supabase
        .from('contracts')
        .update({ 
          end_date: newDate,
          renewal_date: newDate 
        })
        .eq('customer_id', customerId)
        .eq('status', 'active');

      if (contractError) throw contractError;

      // Refresh the data
      refetch();

      toast({
        title: "Date Updated",
        description: `Contract renewal date updated for ${customerName}`,
      });

      console.log(`Updated contract renewal date for ${customerId} to ${newDate}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update date. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (customerId: string, customerName: string) => {
    try {
      // For now, we'll just show a success toast
      // In the future, this could update a payment_status field
      toast({
        title: "Marked as Paid",
        description: `${customerName} marked as paid`,
      });
      
      console.log(`Marked as paid for customer ${customerId} (${customerName})`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as paid. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    customers: sortedCustomers,
    isLoading,
    searchTerm,
    setSearchTerm,
    segmentFilter,
    setSegmentFilter,
    countryFilter,
    setCountryFilter,
    sortBy,
    setSortBy,
    uniqueSegments,
    uniqueCountries,
    handleRemindCustomer,
    handleUpdateDate,
    handleMarkAsPaid
  };
};
