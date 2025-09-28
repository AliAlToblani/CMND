-- Mark Dome Design's current payments as paid
UPDATE payments 
SET status = 'paid',
    payment_date = CURRENT_DATE,
    updated_at = now()
WHERE customer_id = (SELECT id FROM customers WHERE name = 'Dome Design ')
  AND status = 'pending'
  AND due_date <= CURRENT_DATE;

-- Create next annual payment for Dome Design (due 2026-09-28)
INSERT INTO payments (
  contract_id, 
  customer_id, 
  amount, 
  due_date, 
  payment_type, 
  status
)
SELECT 
  co.id,
  co.customer_id,
  co.annual_rate,
  (co.start_date + INTERVAL '1 year')::date,
  'recurring',
  'pending'
FROM contracts co
JOIN customers c ON c.id = co.customer_id
WHERE c.name = 'Dome Design '
  AND co.payment_frequency = 'annual'
  AND co.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.contract_id = co.id 
    AND p.status = 'pending'
    AND p.due_date > CURRENT_DATE
  );