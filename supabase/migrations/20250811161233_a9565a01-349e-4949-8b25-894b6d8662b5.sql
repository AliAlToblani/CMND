-- Check if payment generation trigger exists and create/update it
DROP TRIGGER IF EXISTS generate_payment_schedule_on_insert ON contracts;
DROP TRIGGER IF EXISTS generate_payment_schedule_on_update ON contracts;

-- Create triggers to regenerate payment schedule when contracts are modified
CREATE TRIGGER generate_payment_schedule_on_insert
  AFTER INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_payment_schedule();

CREATE TRIGGER generate_payment_schedule_on_update
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_payment_schedule();

-- Also ensure we have a trigger to update the updated_at timestamp
DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();