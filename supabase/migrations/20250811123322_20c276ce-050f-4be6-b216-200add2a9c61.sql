-- Clean up duplicate payments for Ahlia University
-- Delete payments from the old contract (different contract_id than the current one)
DELETE FROM public.payments 
WHERE customer_id = '8b20b65e-7f28-4cff-89b7-cdc970f660bb'
AND contract_id != '235555b3-fa14-49d2-a6b5-99e9081dba57';