-- Add demo_delivered column to project_manager table
-- Tracks whether a demo has been delivered (stays in demos tab until moved to ongoing)

ALTER TABLE public.project_manager 
ADD COLUMN IF NOT EXISTS demo_delivered BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.project_manager.demo_delivered IS 'Indicates if the demo has been delivered to the customer';

