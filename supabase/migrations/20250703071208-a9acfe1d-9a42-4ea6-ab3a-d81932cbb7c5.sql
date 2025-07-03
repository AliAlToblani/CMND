
-- First, let's add the Demo stage to all existing customers who don't already have it
-- We'll insert it for each customer with the first available staff member as owner

WITH first_staff AS (
  SELECT id FROM staff ORDER BY created_at LIMIT 1
),
customers_without_demo AS (
  SELECT c.id as customer_id
  FROM customers c
  WHERE NOT EXISTS (
    SELECT 1 FROM lifecycle_stages ls 
    WHERE ls.customer_id = c.id 
    AND ls.name = 'Demo'
  )
)
INSERT INTO lifecycle_stages (customer_id, name, status, category, owner_id)
SELECT 
  cwd.customer_id,
  'Demo',
  'not-started',
  'Sales',
  fs.id
FROM customers_without_demo cwd
CROSS JOIN first_staff fs;
