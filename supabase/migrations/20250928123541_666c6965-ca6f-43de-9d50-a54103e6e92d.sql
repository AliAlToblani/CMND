-- Clean up duplicate payments and fix contract start dates

-- First, delete duplicate payments keeping only the most recent one for each customer/due_date/amount combination
WITH duplicate_payments AS (
  SELECT 
    p.id,
    ROW_NUMBER() OVER (PARTITION BY p.customer_id, p.due_date, p.amount ORDER BY p.created_at DESC) as row_num
  FROM payments p
  JOIN customers c ON c.id = p.customer_id
  WHERE c.name IN ('ARKS Diyar', 'Dome Design', 'Dar AlHekma University')
    AND p.status = 'pending'
)
DELETE FROM payments 
WHERE id IN (
  SELECT id FROM duplicate_payments WHERE row_num > 1
);

-- Update contract start dates to match actual go-live dates where they exist
UPDATE contracts 
SET start_date = c.go_live_date::timestamp with time zone,
    end_date = c.subscription_end_date::timestamp with time zone
FROM customers c
WHERE contracts.customer_id = c.id
  AND c.name IN ('ARKS Diyar', 'Dome Design', 'Dar AlHekma University')
  AND c.go_live_date IS NOT NULL
  AND c.subscription_end_date IS NOT NULL;

-- Delete existing payments for these customers as they'll need to be regenerated with correct dates
DELETE FROM payments 
WHERE customer_id IN (
  SELECT id FROM customers 
  WHERE name IN ('ARKS Diyar', 'Dome Design', 'Dar AlHekma University')
    AND go_live_date IS NOT NULL
);