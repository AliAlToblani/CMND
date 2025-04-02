
-- Create table for customer team member assignments
CREATE TABLE IF NOT EXISTS public.customer_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, staff_id)
);

-- Add updated_at trigger
CREATE TRIGGER update_customer_team_members_modtime
BEFORE UPDATE ON public.customer_team_members
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
