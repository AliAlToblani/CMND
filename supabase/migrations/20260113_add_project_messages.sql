-- Create project_messages table for team chat within projects
CREATE TABLE IF NOT EXISTS public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.project_manager(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_messages_project_id 
ON public.project_messages(project_id);

CREATE INDEX IF NOT EXISTS idx_project_messages_created_at 
ON public.project_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view all project messages" 
ON public.project_messages FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert their own messages" 
ON public.project_messages FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.project_messages FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Enable realtime for project_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;
