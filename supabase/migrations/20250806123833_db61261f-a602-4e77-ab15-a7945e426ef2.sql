-- Add churn_method column to customers table to distinguish manual vs automatic churn
ALTER TABLE public.customers 
ADD COLUMN churn_method TEXT CHECK (churn_method IN ('manual', 'automatic'));

-- Update the existing update_customer_churn_status function to set churn_method as automatic
CREATE OR REPLACE FUNCTION public.update_customer_churn_status()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update customers to churned status if all their contracts have expired
  UPDATE customers 
  SET status = 'churned',
      churn_date = CURRENT_DATE,
      churn_method = 'automatic'
  WHERE status = 'done' -- Only update live customers
    AND id IN (
      SELECT DISTINCT c.customer_id 
      FROM contracts c 
      WHERE c.customer_id = customers.id
      GROUP BY c.customer_id
      HAVING MAX(c.end_date) < CURRENT_DATE -- All contracts have expired
    )
    AND churn_date IS NULL; -- Don't update if already churned
END;
$function$