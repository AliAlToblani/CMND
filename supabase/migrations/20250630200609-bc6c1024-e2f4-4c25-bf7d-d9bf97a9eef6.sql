
-- Update customers with "GCC" and "UAE" abbreviations to proper country names
-- GCC (Gulf Cooperation Council) should be mapped to United Arab Emirates as the major business hub
-- UAE abbreviation should be expanded to the full country name for consistency

UPDATE customers 
SET country = CASE 
  WHEN country = 'GCC' THEN 'United Arab Emirates'
  WHEN country = 'UAE' THEN 'United Arab Emirates'
  ELSE country
END
WHERE country IN ('GCC', 'UAE');
