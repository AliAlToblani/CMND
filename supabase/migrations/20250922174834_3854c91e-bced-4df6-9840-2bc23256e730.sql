-- Fix RLS policy for documents table to allow authenticated users to insert documents
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;

CREATE POLICY "Authenticated users can insert documents" 
ON documents 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Also add missing UPDATE policy for documents
CREATE POLICY "Authenticated users can update documents" 
ON documents 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Add missing DELETE policy for documents  
CREATE POLICY "Authenticated users can delete documents" 
ON documents 
FOR DELETE 
USING (auth.uid() IS NOT NULL);