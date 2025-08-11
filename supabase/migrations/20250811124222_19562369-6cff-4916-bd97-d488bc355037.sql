-- Create documents bucket for file uploads (customer-avatars already exists)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Create RLS policies for documents (authenticated access only)
CREATE POLICY "Users can view documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');