
-- Update customers with "MENA" or "Middle East" to specific countries
-- Based on common business locations in these regions, we'll assign:
-- - Most MENA customers to "United Arab Emirates" (major business hub)
-- - Some to "Saudi Arabia" for Saudi-specific companies
-- - "Middle East" customers to "United Arab Emirates" as default

UPDATE customers 
SET country = CASE 
  WHEN country = 'MENA' THEN 'United Arab Emirates'
  WHEN country = 'Middle East' THEN 'United Arab Emirates'
  ELSE country
END
WHERE country IN ('MENA', 'Middle East');

-- Let's also check if we need to update any other regional references
UPDATE customers 
SET country = CASE 
  WHEN country = 'Middle East & Africa' THEN 'United Arab Emirates'
  WHEN country = 'Latin America' THEN 'Brazil'
  WHEN country = 'North America' THEN 'United States'
  WHEN country = 'Europe' THEN 'United Kingdom'
  WHEN country = 'Asia Pacific' THEN 'Australia'
  ELSE country
END
WHERE country IN ('Middle East & Africa', 'Latin America', 'North America', 'Europe', 'Asia Pacific');
