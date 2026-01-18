-- Create a function to delete users from auth.users
-- This function runs with elevated privileges (SECURITY DEFINER)

CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_user_id UUID;
  calling_user_role TEXT;
BEGIN
  -- Get the calling user's ID
  calling_user_id := auth.uid();
  
  -- Check if caller is authenticated
  IF calling_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Check if caller is an admin
  SELECT role INTO calling_user_role
  FROM public.profiles
  WHERE id = calling_user_id;
  
  IF calling_user_role IS NULL OR calling_user_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;
  
  -- Prevent self-deletion
  IF target_user_id = calling_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot delete your own account');
  END IF;
  
  -- Delete from profiles first (if exists)
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- Check if user was actually deleted
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'User deleted successfully');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_completely(UUID) TO authenticated;
