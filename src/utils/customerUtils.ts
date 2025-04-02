
import { supabase } from "@/integrations/supabase/client";
import { customers as realCustomers } from "@/data/realCustomers";

/**
 * Find a customer by ID, name, or partial match
 * This function will search in the database first, then fallback to local data
 */
export const findCustomerById = async (searchId: string) => {
  if (!searchId) return null;
  
  console.log("Searching for customer with ID or name:", searchId);
  
  // Normalize the ID if it's a UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchId);
  const dbId = isUuid ? searchId : `00000000-0000-0000-0000-${searchId.replace(/\D/g, '').padStart(12, '0')}`;
  
  try {
    // Try exact ID match in database
    const { data: dbCustomer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', dbId)
      .maybeSingle();
    
    if (dbCustomer) {
      console.log("Found customer in database by ID:", dbCustomer);
      return {
        id: dbCustomer.id,
        name: dbCustomer.name,
        logo: dbCustomer.logo || undefined,
        segment: dbCustomer.segment || "Unknown Segment",
        region: dbCustomer.region || "Unknown Region",
        stage: dbCustomer.stage || "New",
        status: dbCustomer.status || "not-started",
        contractSize: dbCustomer.contract_size || 0,
        owner: {
          id: dbCustomer.owner_id || "unknown",
          name: "Account Manager",
          role: "Sales"
        }
      };
    }
    
    // Try name search in database if ID search failed
    const { data: nameDbCustomers } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', `%${searchId}%`)
      .limit(1);
    
    if (nameDbCustomers && nameDbCustomers.length > 0) {
      const customer = nameDbCustomers[0];
      console.log("Found customer in database by name:", customer);
      return {
        id: customer.id,
        name: customer.name,
        logo: customer.logo || undefined,
        segment: customer.segment || "Unknown Segment",
        region: customer.region || "Unknown Region",
        stage: customer.stage || "New",
        status: customer.status || "not-started",
        contractSize: customer.contract_size || 0,
        owner: {
          id: customer.owner_id || "unknown",
          name: "Account Manager",
          role: "Sales"
        }
      };
    }
    
    // If not found in database, try to find in real customers data
    console.log("Customer not found in database, searching in local data");
    
    // Try exact ID match
    let foundCustomer = realCustomers.find(c => c.id === searchId);
    
    // Try name match
    if (!foundCustomer) {
      foundCustomer = realCustomers.find(c => 
        c.name && c.name.toLowerCase() === searchId.toLowerCase()
      );
    }
    
    // Try partial match
    if (!foundCustomer) {
      foundCustomer = realCustomers.find(c => 
        (c.id && c.id.includes(searchId)) || 
        (c.name && searchId && c.name.toLowerCase().includes(searchId.toLowerCase()))
      );
    }
    
    if (foundCustomer) {
      console.log("Found customer in local data:", foundCustomer);
      return {
        id: foundCustomer.id || crypto.randomUUID(),
        name: foundCustomer.name,
        logo: undefined,
        segment: foundCustomer.segment || "Unknown Segment",
        region: foundCustomer.region || "Unknown Region",
        stage: foundCustomer.stage || "New",
        status: "not-started",
        contractSize: foundCustomer.contractSize || 0,
        owner: foundCustomer.owner ? {
          id: "unknown",
          name: foundCustomer.owner.name || "Account Manager",
          role: foundCustomer.owner.role || "Sales"
        } : {
          id: "unknown",
          name: "Account Manager",
          role: "Sales"
        }
      };
    }
    
    console.log("No customer found with ID or name:", searchId);
    return null;
  } catch (error) {
    console.error("Error finding customer:", error);
    return null;
  }
};
