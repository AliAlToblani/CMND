-- Generate next annual payments for customers with paid current payments
-- For ARKS Diyar (annual payment, next due 2026-09-28)
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
WHERE c.name = 'ARKS Diyar'
  AND co.payment_frequency = 'annual'
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.contract_id = co.id 
    AND p.status = 'pending'
    AND p.due_date > CURRENT_DATE
  );

-- For Dar AlHekma University (annual payment, next due 2026-06-27)  
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
WHERE c.name = 'Dar AlHekma University'
  AND co.payment_frequency = 'annual'
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.contract_id = co.id 
    AND p.status = 'pending'
    AND p.due_date > CURRENT_DATE
  );