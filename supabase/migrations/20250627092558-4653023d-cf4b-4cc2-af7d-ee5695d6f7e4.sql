
-- Add contact information fields to customers table
ALTER TABLE customers 
ADD COLUMN contact_name TEXT,
ADD COLUMN contact_email TEXT,
ADD COLUMN contact_phone TEXT;

-- Rename region column to country
ALTER TABLE customers 
RENAME COLUMN region TO country;

-- Update existing customers to have some default country values where region was populated
-- This is optional but helps with data migration
UPDATE customers 
SET country = CASE 
  WHEN country = 'North America' THEN 'United States'
  WHEN country = 'Europe' THEN 'United Kingdom'
  WHEN country = 'Asia Pacific' THEN 'Australia'
  WHEN country = 'Latin America' THEN 'Brazil'
  WHEN country = 'Middle East & Africa' THEN 'United Arab Emirates'
  ELSE country
END
WHERE country IS NOT NULL;
