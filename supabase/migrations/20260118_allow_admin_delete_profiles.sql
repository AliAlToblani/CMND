-- Allow admins to delete other users' profiles

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create policy to allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (
  -- Current user must be an admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
  -- And they cannot delete their own profile
  AND id != auth.uid()
);

-- Also ensure admins can view all profiles (needed to list team members)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
USING (true);
