
-- Create invitation tokens table for secure invite system
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES public.profiles(id) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for invitations
CREATE POLICY "Admins can view all invitations"
  ON public.invitations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create invitations"
  ON public.invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND invited_by = auth.uid());

CREATE POLICY "Admins can update invitations"
  ON public.invitations
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to generate secure invitation tokens
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- Create function to validate invitation tokens
CREATE OR REPLACE FUNCTION public.get_valid_invitation(token_param TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role app_role,
  invited_by UUID
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT i.id, i.email, i.role, i.invited_by
  FROM public.invitations i
  WHERE i.token = token_param
    AND i.expires_at > now()
    AND i.accepted_at IS NULL
$$;

-- Insert first admin user (change email/password as needed)
-- This creates a temporary admin that can invite others
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@company.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create profile for the admin user
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  au.id,
  'admin@company.com',
  'System Admin',
  'admin'::app_role
FROM auth.users au 
WHERE au.email = 'admin@company.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin'::app_role;
