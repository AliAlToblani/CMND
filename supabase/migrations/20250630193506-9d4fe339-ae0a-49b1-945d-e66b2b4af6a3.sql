
-- Add setup_fee and annual_rate columns to contracts table
ALTER TABLE public.contracts 
ADD COLUMN setup_fee integer DEFAULT 0,
ADD COLUMN annual_rate integer DEFAULT 0;

-- Update existing contracts to migrate value to annual_rate for backward compatibility
UPDATE public.contracts 
SET annual_rate = value, setup_fee = 0 
WHERE setup_fee IS NULL AND annual_rate IS NULL AND value > 0;
