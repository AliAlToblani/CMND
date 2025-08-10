-- Clean up Provin's payments and regenerate them properly
DO $$
DECLARE
    provin_customer_id UUID := 'cca37f9c-d1d1-43c0-9f00-f5d972398af6';
    contract_record RECORD;
BEGIN
    -- Delete all existing payments for Provin
    DELETE FROM payments WHERE customer_id = provin_customer_id;
    
    -- Regenerate payments for each of Provin's contracts
    FOR contract_record IN 
        SELECT * FROM contracts 
        WHERE customer_id = provin_customer_id
    LOOP
        -- Create setup fee payment if exists
        IF COALESCE(contract_record.setup_fee, 0) > 0 THEN
            INSERT INTO payments (
                contract_id, customer_id, amount, due_date, payment_type, status
            ) VALUES (
                contract_record.id, 
                provin_customer_id, 
                contract_record.setup_fee, 
                contract_record.start_date::DATE, 
                'setup', 
                'pending'
            );
        END IF;
        
        -- Create recurring payment for annual contracts
        IF contract_record.payment_frequency = 'annual' AND COALESCE(contract_record.annual_rate, 0) > 0 THEN
            INSERT INTO payments (
                contract_id, customer_id, amount, due_date, payment_type, status
            ) VALUES (
                contract_record.id, 
                provin_customer_id, 
                contract_record.annual_rate, 
                contract_record.start_date::DATE, 
                'recurring', 
                'pending'
            );
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Cleaned up and regenerated payments for Provin';
END $$;