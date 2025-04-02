
import { supabase } from "@/integrations/supabase/client";
import { customers as realCustomers } from "@/data/realCustomers";

/**
 * Syncs all customers from the local data to the database if they don't exist
 * This function is called automatically on application startup
 */
export const syncCustomersToDatabase = async (): Promise<boolean> => {
  try {
    console.log("Starting customer data sync check to database...");
    
    const { data: existingCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('name');
      
    if (fetchError) {
      console.error("Error checking existing customers:", fetchError);
      return false;
    }
    
    const existingNames = new Set(existingCustomers?.map(c => c.name.toLowerCase()) || []);
    
    // Find customers that don't exist in the database yet
    const customersToInsert = realCustomers.filter(
      c => !existingNames.has(c.name.toLowerCase())
    ).map(customer => {
      // Generate a valid UUID for each customer
      return {
        id: crypto.randomUUID(),
        name: customer.name,
        segment: customer.segment || null,
        region: customer.region || null,
        stage: customer.stage || null,
        status: "not-started",
        contract_size: customer.contractSize || 0,
        owner_id: "00000000-0000-0000-0000-000000000001" // Default owner
      };
    });
    
    if (customersToInsert.length === 0) {
      console.log("No new customers to sync to database");
      return true;
    }
    
    console.log(`Found ${customersToInsert.length} new customers to sync to database`);
    
    // Insert new customers in batches to avoid too large requests
    for (let i = 0; i < customersToInsert.length; i += 50) {
      const batch = customersToInsert.slice(i, i + 50);
      const { error: insertError } = await supabase
        .from('customers')
        .insert(batch);
      
      if (insertError) {
        console.error(`Error inserting batch ${i}-${i+batch.length}:`, insertError);
      }
    }
    
    console.log(`Successfully synced new customers to the database`);
    return true;
  } catch (error) {
    console.error("Error in syncCustomersToDatabase:", error);
    return false;
  }
};

/**
 * Helper function to ensure a customer exists in the database
 * If not, it will be created from the real customer data
 */
export const ensureCustomerExists = async (customerId: string): Promise<boolean> => {
  try {
    // For existing UUIDs in the database, we'll use them directly
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId)) {
      // Check if customer exists
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customerId);
      
      if (error) {
        console.error("Error checking customer:", error);
        return false;
      }
      
      // If customer exists, return true
      if (data && data.length > 0) {
        return true;
      }
    }
    
    // For non-UUID identifiers, we need to look up by name in the real data
    const customer = realCustomers.find(c => 
      c.id === customerId || 
      c.name.toLowerCase().includes(customerId.toLowerCase())
    );
    
    if (!customer) {
      console.error("Customer not found in real data:", customerId);
      return false;
    }
    
    // Create a new valid UUID for this customer
    const dbCustomerId = crypto.randomUUID();
    
    // Insert the customer
    const { error: insertError } = await supabase
      .from('customers')
      .insert({
        id: dbCustomerId,
        name: customer.name,
        segment: customer.segment || null,
        region: customer.region || null,
        stage: customer.stage || null,
        status: "not-started",
        contract_size: customer.contractSize || 0,
        owner_id: "00000000-0000-0000-0000-000000000001" // Default owner
      });
    
    if (insertError) {
      console.error("Error inserting customer:", insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in ensureCustomerExists:", error);
    return false;
  }
};
