
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for handling HubSpot integrations
 */
export const hubspotService = {
  /**
   * Sync a customer from our system to HubSpot
   */
  syncCustomerToHubspot: async (customerId: string) => {
    try {
      // First, get the customer data
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;

      // Call the edge function to sync to HubSpot
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          operation: 'syncCustomer',
          data: customer
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sync with HubSpot');
      }

      return await response.json();
    } catch (error) {
      console.error("Error syncing customer to HubSpot:", error);
      throw error;
    }
  },

  /**
   * Create a deal in HubSpot based on a contract
   */
  createDealInHubspot: async (contractId: string) => {
    try {
      // First, get the contract data with customer information
      const { data: contract, error } = await supabase
        .from('contracts')
        .select(`
          *,
          customers(*)
        `)
        .eq('id', contractId)
        .single();

      if (error) throw error;

      // Call the edge function to create a deal in HubSpot
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          operation: 'createDeal',
          data: contract
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create deal in HubSpot');
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating deal in HubSpot:", error);
      throw error;
    }
  },

  /**
   * Update a deal in HubSpot based on contract changes
   */
  updateDealInHubspot: async (contractId: string) => {
    try {
      // Get the contract data
      const { data: contract, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error) throw error;

      // Call the edge function to update the deal in HubSpot
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          operation: 'updateDeal',
          data: contract
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update deal in HubSpot');
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating deal in HubSpot:", error);
      throw error;
    }
  }
};
