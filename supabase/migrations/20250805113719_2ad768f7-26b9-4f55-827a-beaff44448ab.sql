-- Update the documents storage bucket to have a 50MB file size limit
UPDATE storage.buckets 
SET file_size_limit = 52428800 -- 50MB in bytes
WHERE id = 'documents';