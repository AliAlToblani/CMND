
-- First, let's ensure the admin user has a proper profile
-- Update the existing admin user to have a profile if missing
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'full_name', 'System Admin'),
  'admin'::app_role
FROM auth.users au 
WHERE au.email = 'admin@company.com'
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin'::app_role,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name, 'System Admin');

-- Update the customer deletion policy to be more permissive
-- Allow all authenticated users to delete customers (not just admins)
DROP POLICY IF EXISTS "Only admins can delete customers" ON public.customers;
CREATE POLICY "Authenticated users can delete customers"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (true);

-- Also update contract deletion policy for consistency
DROP POLICY IF EXISTS "Only admins can delete contracts" ON public.contracts;
CREATE POLICY "Authenticated users can delete contracts"
  ON public.contracts
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure the handle_new_user function creates profiles with proper defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'user'::app_role
  );
  RETURN NEW;
END;
$$;
