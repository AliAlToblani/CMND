-- Insert the existing ARKS Diyar documents that are in storage but missing from database
-- Setting uploaded_by to NULL since the original uploader ID doesn't exist in staff table
INSERT INTO documents (customer_id, name, file_path, document_type, file_size, uploaded_by) VALUES
('f9ceb6e2-55c2-40f2-892a-8f55fc7ddbf2', 'DOO - ARKS - Service Agreement.docx', 'customers/customer-f9ceb6e2-55c2-40f2-892a-8f55fc7ddbf2-1758562926880-DOO - ARKS - Service Agreement.docx', 'contract', 303258, NULL),
('f9ceb6e2-55c2-40f2-892a-8f55fc7ddbf2', 'ARKS Invoice.pdf', 'customers/customer-f9ceb6e2-55c2-40f2-892a-8f55fc7ddbf2-1758562930540-ARKS Invoice.pdf', 'invoice', 128343, NULL);