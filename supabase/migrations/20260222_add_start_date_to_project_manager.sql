-- Add start_date column to project_manager table
ALTER TABLE project_manager ADD COLUMN IF NOT EXISTS start_date date NULL;
