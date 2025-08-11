import { supabase } from "@/integrations/supabase/client";

/**
 * Check for customers who might be missing contracts
 */
export const findCustomersWithMissingContracts = async () => {
  try {
    // Find customers with estimated_deal_value but no contracts
    const { data: customersWithoutContracts, error } = await supabase
      .from('customers')
      .select(`
        *,
        contracts(id)
      `)
      .gt('estimated_deal_value', 0)
      .is('contracts.id', null);

    if (error) throw error;

    return customersWithoutContracts || [];
  } catch (error) {
    console.error('Error finding customers with missing contracts:', error);
    return [];
  }
};

/**
 * Sync contract data from customer's estimated deal value (for cases where contract wasn't saved)
 */
export const syncCustomerToContracts = async (customerId: string) => {
  try {
    // Get customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;
    if (!customer) throw new Error('Customer not found');

    // Check if customer already has contracts
    const { data: existingContracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id')
      .eq('customer_id', customerId);

    if (contractsError) throw contractsError;

    if (existingContracts && existingContracts.length > 0) {
      console.log('Customer already has contracts, skipping sync');
      return { skipped: true, reason: 'Customer already has contracts' };
    }

    // Create a contract based on estimated deal value if it exists
    if (customer.estimated_deal_value && customer.estimated_deal_value > 0) {
      const contractData = {
        customer_id: customerId,
        name: 'Service Agreement',
        value: customer.estimated_deal_value,
        setup_fee: customer.setup_fee || 0,
        annual_rate: customer.annual_rate || customer.estimated_deal_value,
        payment_frequency: 'one_time', // Default assumption for deal value
        start_date: customer.go_live_date || new Date().toISOString(),
        end_date: customer.subscription_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      };

      const { data: newContract, error: insertError } = await supabase
        .from('contracts')
        .insert([contractData])
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, contract: newContract };
    }

    return { skipped: true, reason: 'No estimated deal value to sync' };
  } catch (error) {
    console.error('Error syncing customer to contracts:', error);
    throw error;
  }
};