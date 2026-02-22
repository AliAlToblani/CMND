-- Add documents JSONB column to project_manager for file attachments
ALTER TABLE project_manager ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb;
