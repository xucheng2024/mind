// Supabase client for frontend - STORAGE ONLY, NO DATABASE OPERATIONS
// All database operations should go through the server API (src/lib/api.js)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables missing!');
  throw new Error('Supabase configuration is incomplete. Please check your environment variables.');
}

// Supabase client configured for storage operations only
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'appclinic-web-storage-only'
    }
  }
});

