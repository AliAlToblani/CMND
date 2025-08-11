-- Touch the contract to trigger real-time update and force subscription tracker refresh
UPDATE contracts 
SET updated_at = NOW()
WHERE customer_id = 'c7a77825-8348-4def-a681-8cde3ac16fb8';