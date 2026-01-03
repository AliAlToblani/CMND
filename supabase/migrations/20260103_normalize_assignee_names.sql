-- Normalize project_manager names in project_manager table
-- This matches inconsistent names to actual user full_names from profiles

-- First, let's see what names exist (for reference)
-- SELECT DISTINCT project_manager FROM project_manager WHERE project_manager IS NOT NULL;

-- Update variations of "Ahmed Haffadh" to the correct name
UPDATE project_manager 
SET project_manager = (SELECT full_name FROM profiles WHERE LOWER(full_name) LIKE '%haffadh%' LIMIT 1)
WHERE LOWER(project_manager) LIKE '%haffadh%' 
   OR LOWER(project_manager) = 'ahmed h';

-- Update variations of "Ahmed Alsabbagh" to the correct name  
UPDATE project_manager 
SET project_manager = (SELECT full_name FROM profiles WHERE LOWER(full_name) LIKE '%alsabbagh%' OR LOWER(full_name) LIKE '%sabbagh%' LIMIT 1)
WHERE LOWER(project_manager) LIKE '%alsabbagh%' 
   OR LOWER(project_manager) LIKE '%sabbagh%'
   OR LOWER(project_manager) = 'ahmed s';

-- Update "Qabas" to match the user's full name
UPDATE project_manager 
SET project_manager = (SELECT full_name FROM profiles WHERE LOWER(full_name) LIKE '%qabas%' LIMIT 1)
WHERE LOWER(project_manager) LIKE '%qabas%';

-- Also normalize deal_owner and project_owner in customers table
UPDATE customers 
SET deal_owner = (SELECT full_name FROM profiles WHERE LOWER(full_name) LIKE '%haffadh%' LIMIT 1)
WHERE LOWER(deal_owner) LIKE '%haffadh%' 
   OR LOWER(deal_owner) = 'ahmed h';

UPDATE customers 
SET deal_owner = (SELECT full_name FROM profiles WHERE LOWER(full_name) LIKE '%alsabbagh%' OR LOWER(full_name) LIKE '%sabbagh%' LIMIT 1)
WHERE LOWER(deal_owner) LIKE '%alsabbagh%' 
   OR LOWER(deal_owner) LIKE '%sabbagh%'
   OR LOWER(deal_owner) = 'ahmed s';

UPDATE customers 
SET deal_owner = (SELECT full_name FROM profiles WHERE LOWER(full_name) LIKE '%qabas%' LIMIT 1)
WHERE LOWER(deal_owner) LIKE '%qabas%';

UPDATE customers 
SET project_owner = (SELECT full_name FROM profiles WHERE LOWER(full_name) LIKE '%haffadh%' LIMIT 1)
WHERE LOWER(project_owner) LIKE '%haffadh%' 
   OR LOWER(project_owner) = 'ahmed h';

UPDATE customers 
SET project_owner = (SELECT full_name FROM profiles WHERE LOWER(full_name) LIKE '%alsabbagh%' OR LOWER(full_name) LIKE '%sabbagh%' LIMIT 1)
WHERE LOWER(project_owner) LIKE '%alsabbagh%' 
   OR LOWER(project_owner) LIKE '%sabbagh%'
   OR LOWER(project_owner) = 'ahmed s';

UPDATE customers 
SET project_owner = (SELECT full_name FROM profiles WHERE LOWER(full_name) LIKE '%qabas%' LIMIT 1)
WHERE LOWER(project_owner) LIKE '%qabas%';

-- Verify the changes
-- SELECT DISTINCT project_manager FROM project_manager WHERE project_manager IS NOT NULL ORDER BY project_manager;
-- SELECT DISTINCT deal_owner FROM customers WHERE deal_owner IS NOT NULL ORDER BY deal_owner;
-- SELECT DISTINCT project_owner FROM customers WHERE project_owner IS NOT NULL ORDER BY project_owner;

