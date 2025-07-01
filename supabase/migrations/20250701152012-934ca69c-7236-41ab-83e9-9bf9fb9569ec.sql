
-- Add contract_number column to contracts table
ALTER TABLE public.contracts 
ADD COLUMN contract_number text UNIQUE;

-- Add an index on contract_number for better search performance
CREATE INDEX idx_contracts_contract_number ON public.contracts(contract_number);

-- Add a comment to document the purpose of this field
COMMENT ON COLUMN public.contracts.contract_number IS 'User-defined contract number for easy identification (e.g., CNT-2024-001)';
