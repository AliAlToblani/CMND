-- Create a function to automatically cleanup expired invitations and run it
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.invitations 
  WHERE expires_at < now() AND accepted_at IS NULL;
  
  -- Log the cleanup for debugging
  RAISE NOTICE 'Cleaned up expired invitations';
END;
$$;

-- Run the cleanup function immediately
SELECT cleanup_expired_invitations();

-- Create an automatic trigger to clean up expired invitations daily
-- This will be called when we check for pending invitations
CREATE OR REPLACE FUNCTION auto_cleanup_before_invitation_check()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clean up expired invitations before any new invitation operations
  DELETE FROM public.invitations 
  WHERE expires_at < now() AND accepted_at IS NULL;
  
  RETURN NEW;
END;
$$;

-- Create trigger that runs cleanup before inserts
DROP TRIGGER IF EXISTS cleanup_expired_invitations_trigger ON public.invitations;
CREATE TRIGGER cleanup_expired_invitations_trigger
  BEFORE INSERT ON public.invitations
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_cleanup_before_invitation_check();