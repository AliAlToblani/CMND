-- Create invitations table
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view invitations" 
ON public.invitations 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create invitations" 
ON public.invitations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update invitations" 
ON public.invitations 
FOR UPDATE 
USING (true);

-- Create function to generate invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT encode(gen_random_bytes(32), 'base64url');
$$;

-- Create function to get valid invitation
CREATE OR REPLACE FUNCTION public.get_valid_invitation(token_param TEXT)
RETURNS TABLE(id UUID, email TEXT, role app_role, invited_by UUID, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT i.id, i.email, i.role, i.invited_by, i.expires_at
  FROM public.invitations i
  WHERE i.token = token_param 
    AND i.expires_at > now() 
    AND i.accepted_at IS NULL;
$$;