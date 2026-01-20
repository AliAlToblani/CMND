-- Create calculator_drafts table for storing calculator estimates
CREATE TABLE IF NOT EXISTS public.calculator_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  draft_name TEXT, -- Optional name for the draft
  currency TEXT DEFAULT 'USD',
  fx_rate DECIMAL DEFAULT 1,
  setup_base DECIMAL DEFAULT 0,
  setup_lines JSONB DEFAULT '[]'::jsonb,
  text_config JSONB DEFAULT '{}'::jsonb,
  voice_config JSONB DEFAULT '{}'::jsonb,
  avatar_config JSONB DEFAULT '{}'::jsonb,
  discount_permission TEXT DEFAULT 'allowed',
  discount_percent DECIMAL DEFAULT 0,
  discount_reason TEXT,
  discount_applies_to TEXT DEFAULT 'all',
  vat_enabled BOOLEAN DEFAULT false,
  vat_rate DECIMAL DEFAULT 0,
  vat_applies_to TEXT DEFAULT 'all',
  force_minimums BOOLEAN DEFAULT true,
  grand_total_usd DECIMAL DEFAULT 0,
  grand_total_converted DECIMAL DEFAULT 0,
  monthly_equivalent DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.calculator_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view calculator drafts"
  ON public.calculator_drafts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create calculator drafts"
  ON public.calculator_drafts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update calculator drafts"
  ON public.calculator_drafts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete calculator drafts"
  ON public.calculator_drafts FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_calculator_drafts_created_at ON public.calculator_drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculator_drafts_customer_name ON public.calculator_drafts(customer_name);

-- Add updated_at trigger
CREATE TRIGGER update_calculator_drafts_updated_at
  BEFORE UPDATE ON public.calculator_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.calculator_drafts;
