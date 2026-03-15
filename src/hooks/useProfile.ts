import { useAuth } from '@/contexts/AuthContext';

export type { Profile } from '@/contexts/AuthContext';

/**
 * Thin wrapper around AuthContext for profile data.
 * Profile is now fetched once in AuthContext when user exists.
 */
export const useProfile = () => {
  const { profile, profileLoading, profileUpdating, updateProfile } = useAuth();
  return {
    profile,
    loading: profileLoading,
    updating: profileUpdating,
    updateProfile,
    refetch: () => {}, // No-op; AuthContext refetches when user changes
  };
};

// Re-export for components that need clearProfileCache (e.g. on sign-out)
export const clearProfileCache = () => {}; // No-op; AuthContext handles this
