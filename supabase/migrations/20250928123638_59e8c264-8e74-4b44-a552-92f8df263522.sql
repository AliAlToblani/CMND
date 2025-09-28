-- Trigger payment generation for contracts that have been updated
-- This will recreate payments based on the correct contract start dates

-- First, let's manually trigger the payment generation for the updated contracts
-- We'll update the contracts to trigger the payment generation function
UPDATE contracts 
SET updated_at = now()
WHERE customer_id IN (
  SELECT id FROM customers 
  WHERE name IN ('ARKS Diyar', 'Dome Design', 'Dar AlHekma University')
)
AND start_date IS NOT NULL;