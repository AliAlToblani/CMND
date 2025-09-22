-- Fix the foreign key constraint issue by making uploaded_by nullable and removing the foreign key constraint
-- This prevents future upload failures while preserving the field for future use
ALTER TABLE documents ALTER COLUMN uploaded_by DROP NOT NULL;

-- Check if the foreign key constraint exists and drop it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'documents_uploaded_by_fkey' 
               AND table_name = 'documents') THEN
        ALTER TABLE documents DROP CONSTRAINT documents_uploaded_by_fkey;
    END IF;
END $$;