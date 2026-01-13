-- Add priority column to project_manager table
ALTER TABLE public.project_manager 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'moderate' 
CHECK (priority IN ('high', 'moderate', 'low'));

-- Add secondary_project_manager column
ALTER TABLE public.project_manager 
ADD COLUMN IF NOT EXISTS secondary_project_manager TEXT;

-- Add deadline column for project deadlines
ALTER TABLE public.project_manager 
ADD COLUMN IF NOT EXISTS deadline DATE;

-- Add index for priority for faster filtering
CREATE INDEX IF NOT EXISTS idx_project_manager_priority 
ON public.project_manager(priority);

-- Add index for deadline for sorting/filtering by due date
CREATE INDEX IF NOT EXISTS idx_project_manager_deadline 
ON public.project_manager(deadline);

-- Update existing records to have moderate priority if null
UPDATE public.project_manager 
SET priority = 'moderate' 
WHERE priority IS NULL;
