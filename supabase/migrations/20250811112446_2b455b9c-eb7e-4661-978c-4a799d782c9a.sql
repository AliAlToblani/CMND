-- First, manually clean up the duplicate payments for Motiv8
DELETE FROM payments WHERE customer_id = 'c7a77825-8348-4def-a681-8cde3ac16fb8';

-- Add 'one_time' to the payments table payment_type constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check 
CHECK (payment_type IN ('setup', 'recurring', 'one_time'));

-- Now update the contract to be one_time (this will trigger proper payment generation)
UPDATE contracts 
SET payment_frequency = 'one_time'
WHERE customer_id = 'c7a77825-8348-4def-a681-8cde3ac16fb8';