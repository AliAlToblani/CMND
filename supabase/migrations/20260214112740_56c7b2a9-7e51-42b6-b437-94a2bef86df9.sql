-- Make the project-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'project-files';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view project files" ON storage.objects;

-- Create authenticated-only SELECT policy
CREATE POLICY "Authenticated users can view project files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-files');
