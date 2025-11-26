
-- Force trigger execution by updating lifecycle stages for Dashn and Macqueen
UPDATE lifecycle_stages 
SET updated_at = NOW() 
WHERE customer_id IN (
  SELECT id FROM customers WHERE name IN ('Dashn', 'Macqueen')
);
