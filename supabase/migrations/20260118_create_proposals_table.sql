-- Create proposals table for storing proposal notes
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  company_name TEXT,
  contact_info TEXT,
  ai_model TEXT CHECK (ai_model IN ('Text', 'Voice', 'Hybrid')),
  channels TEXT, -- Open-ended text field for channels
  integrations TEXT, -- Open-ended text field for integrations
  volume TEXT, -- Expected monthly usage
  additional_notes TEXT, -- Goals, timeline, constraints
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view proposals"
  ON public.proposals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create proposals"
  ON public.proposals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update proposals"
  ON public.proposals FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete proposals"
  ON public.proposals FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();
