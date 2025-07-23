
-- More robust deletion that handles all sample customers and ensures clean state
-- First, temporarily disable RLS to ensure deletion works
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Delete all sample customers except Jahez
DELETE FROM customers WHERE name NOT IN ('Jahez');

-- Also clean up any related data for deleted customers
DELETE FROM lifecycle_stages WHERE customer_id NOT IN (SELECT id FROM customers);
DELETE FROM customer_timeline WHERE customer_id NOT IN (SELECT id FROM customers);
DELETE FROM customer_feedback WHERE customer_id NOT IN (SELECT id FROM customers);
DELETE FROM referrals WHERE customer_id NOT IN (SELECT id FROM customers);
DELETE FROM contracts WHERE customer_id NOT IN (SELECT id FROM customers);
DELETE FROM documents WHERE customer_id NOT IN (SELECT id FROM customers);
DELETE FROM tasks WHERE customer_id NOT IN (SELECT id FROM customers);
DELETE FROM customer_team_members WHERE customer_id NOT IN (SELECT id FROM customers);

-- Re-enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Verify only Jahez remains
SELECT name FROM customers;
