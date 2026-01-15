-- Query to check customers in Implementation or Live stages and their contracts
-- This query should be run through the Supabase dashboard SQL editor or using authenticated access

-- 1. Get customers in Implementation or Live stages
SELECT
    c.id,
    c.name,
    c.stage,
    c.status,
    c.contact_name,
    c.contact_email,
    c.go_live_date,
    c.annual_rate,
    -- Count contracts
    (SELECT COUNT(*) FROM contracts WHERE customer_id = c.id) as total_contracts,
    (SELECT COUNT(*) FROM contracts WHERE customer_id = c.id AND (status = 'active' OR status = 'pending')) as active_pending_contracts,
    -- List contract statuses
    (SELECT string_agg(DISTINCT status, ', ') FROM contracts WHERE customer_id = c.id) as contract_statuses
FROM customers c
WHERE c.stage IN ('Implementation', 'Live')
ORDER BY c.name;

-- 2. Detailed view with contract information
SELECT
    c.id as customer_id,
    c.name as customer_name,
    c.stage,
    c.status as customer_status,
    c.contact_name,
    c.contact_email,
    COALESCE(ct.id, NULL) as contract_id,
    COALESCE(ct.name, 'NO CONTRACT') as contract_name,
    COALESCE(ct.status, 'N/A') as contract_status,
    COALESCE(ct.value, 0) as contract_value,
    ct.start_date,
    ct.end_date,
    ct.renewal_date,
    CASE
        WHEN ct.id IS NULL THEN 'NO CONTRACT'
        WHEN ct.status IN ('active', 'pending') THEN 'HAS ACTIVE/PENDING CONTRACT'
        ELSE 'HAS CONTRACT (NOT ACTIVE/PENDING)'
    END as contract_assessment
FROM customers c
LEFT JOIN contracts ct ON ct.customer_id = c.id
WHERE c.stage IN ('Implementation', 'Live')
ORDER BY
    c.name,
    CASE
        WHEN ct.status = 'active' THEN 1
        WHEN ct.status = 'pending' THEN 2
        ELSE 3
    END,
    ct.name;

-- 3. Summary statistics
SELECT
    'Total customers in Implementation/Live' as metric,
    COUNT(*) as count
FROM customers
WHERE stage IN ('Implementation', 'Live')

UNION ALL

SELECT
    'Customers with active/pending contracts' as metric,
    COUNT(DISTINCT c.id) as count
FROM customers c
INNER JOIN contracts ct ON ct.customer_id = c.id
WHERE c.stage IN ('Implementation', 'Live')
    AND ct.status IN ('active', 'pending')

UNION ALL

SELECT
    'Customers without any contracts' as metric,
    COUNT(*) as count
FROM customers c
WHERE c.stage IN ('Implementation', 'Live')
    AND NOT EXISTS (SELECT 1 FROM contracts WHERE customer_id = c.id)

UNION ALL

SELECT
    'Customers with contracts but none active/pending' as metric,
    COUNT(DISTINCT c.id) as count
FROM customers c
WHERE c.stage IN ('Implementation', 'Live')
    AND EXISTS (SELECT 1 FROM contracts WHERE customer_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM contracts WHERE customer_id = c.id AND status IN ('active', 'pending'));

-- 4. List all unique stages in the database (for reference)
SELECT DISTINCT stage, COUNT(*) as count
FROM customers
WHERE stage IS NOT NULL
GROUP BY stage
ORDER BY stage;

-- 5. List all unique contract statuses (for reference)
SELECT DISTINCT status, COUNT(*) as count
FROM contracts
WHERE status IS NOT NULL
GROUP BY status
ORDER BY status;
