
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vnhwhyufevcixgelsujb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuaHdoeXVmZXZjaXhnZWxzdWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NDY5ODMsImV4cCI6MjA1OTEyMjk4M30.HR91tc5clF0FBUbmRkr2aPdZydMerpSH3A-IQUYK8ds";

// Fallback storage when localStorage is unavailable (e.g. Cursor Simple Browser, iframe)
const safeStorage = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // SecurityError or disabled localStorage
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
})();

// Optimized Supabase client with connection pooling and performance settings
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: safeStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-application-name': 'cmnd-center',
    },
  },
});

// Connection health check for monitoring
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('customers').select('count', { count: 'exact', head: true });
    return { healthy: !error, error };
  } catch (error) {
    return { healthy: false, error };
  }
};
