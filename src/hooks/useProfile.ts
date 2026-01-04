
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface UpdateProfileData {
  full_name?: string;
  avatar_url?: string;
}

// Cache profile globally to avoid refetching on every component mount
let cachedProfile: Profile | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile);
  const [updating, setUpdating] = useState(false);
  const fetchedRef = useRef(false);

  const fetchProfile = async (force = false) => {
    // Use cache if available and not expired
    const now = Date.now();
    if (!force && cachedProfile && (now - cacheTimestamp) < CACHE_DURATION) {
      setProfile(cachedProfile);
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Don't show toast on every page load
      } else {
        cachedProfile = data;
        cacheTimestamp = now;
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: UpdateProfileData) => {
    if (!profile) return { error: 'No profile found' };

    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
        return { error };
      }

      cachedProfile = data; // Update cache
      cacheTimestamp = Date.now();
      setProfile(data);
      toast.success('Profile updated successfully');
      return { data };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return { error };
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    // Prevent duplicate fetches in React StrictMode
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    updating,
    updateProfile,
    refetch: () => fetchProfile(true) // Force refetch
  };
};
