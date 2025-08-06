import { supabase } from "@/integrations/supabase/client";

// Get churned customers count
export const getChurnedCustomersCount = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id', { count: 'exact' })
      .eq('status', 'churned');

    if (error) {
      console.error("Error fetching churned customers count:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error("Error in getChurnedCustomersCount:", error);
    return 0;
  }
};

// Get churned ARR (value lost to churn)
export const getChurnedARR = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('contract_size')
      .eq('status', 'churned');

    if (error) {
      console.error("Error fetching churned ARR:", error);
      return 0;
    }

    return (data || []).reduce((sum, customer) => sum + (customer.contract_size || 0), 0);
  } catch (error) {
    console.error("Error in getChurnedARR:", error);
    return 0;
  }
};

// Get customers who churned in a specific time period
export const getRecentlyChurnedCustomers = async (days: number = 30) => {
  try {
    const periodStartDate = new Date();
    periodStartDate.setDate(periodStartDate.getDate() - days);

    const { data, error } = await supabase
      .from('customers')
      .select('id, name, churn_date, contract_size, segment')
      .eq('status', 'churned')
      .gte('churn_date', periodStartDate.toISOString())
      .order('churn_date', { ascending: false });

    if (error) {
      console.error("Error fetching recently churned customers:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getRecentlyChurnedCustomers:", error);
    return [];
  }
};