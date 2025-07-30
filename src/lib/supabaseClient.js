import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Config:', {
  url: supabaseUrl ? 'SET' : 'MISSING',
  key: supabaseKey ? 'SET' : 'MISSING',
  env: import.meta.env.MODE,
  userAgent: navigator.userAgent,
  isPWA: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
  location: window.location.href,
  origin: window.location.origin
});

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables missing!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'MISSING');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

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

