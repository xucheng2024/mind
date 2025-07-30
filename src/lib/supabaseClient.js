import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables missing!');
  throw new Error('Supabase configuration is incomplete. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'appclinic-web'
    }
  }
});

// Test Supabase connection
supabase.from('users').select('count').limit(1).then(result => {
  console.log('🔍 Supabase connection test:', {
    success: !result.error,
    error: result.error,
    data: result.data
  });
}).catch(error => {
  console.error('❌ Supabase connection failed:', error);
});

