
-- Add industry column to customers table
ALTER TABLE public.customers 
ADD COLUMN industry text;

-- Update the existing lifecycle stages data to rename "Payment Processing" to "Payment Processed"
UPDATE public.lifecycle_stages 
SET name = 'Payment Processed' 
WHERE name = 'Payment Processing';
