-- Create function to calculate and update customer contract_size
CREATE OR REPLACE FUNCTION public.update_customer_contract_size()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total contract value for the customer
  -- Use setup_fee + annual_rate if available, otherwise fallback to value field
  UPDATE customers 
  SET contract_size = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN c.setup_fee > 0 OR c.annual_rate > 0 THEN 
          COALESCE(c.setup_fee, 0) + COALESCE(c.annual_rate, 0)
        ELSE 
          COALESCE(c.value, 0)
      END
    ), 0)
    FROM contracts c 
    WHERE c.customer_id = COALESCE(NEW.customer_id, OLD.customer_id)
  )
  WHERE id = COALESCE(NEW.customer_id, OLD.customer_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update customer contract_size when contracts change
DROP TRIGGER IF EXISTS trigger_update_customer_contract_size ON contracts;
CREATE TRIGGER trigger_update_customer_contract_size
  AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_contract_size();

-- Update existing customer contract_size values
UPDATE customers 
SET contract_size = (
  SELECT COALESCE(SUM(
    CASE 
      WHEN c.setup_fee > 0 OR c.annual_rate > 0 THEN 
        COALESCE(c.setup_fee, 0) + COALESCE(c.annual_rate, 0)
      ELSE 
        COALESCE(c.value, 0)
    END
  ), 0)
  FROM contracts c 
  WHERE c.customer_id = customers.id
);

-- Enable realtime for contracts table to support real-time updates
ALTER TABLE contracts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE contracts;