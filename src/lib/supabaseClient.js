import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Config:', {
  url: supabaseUrl ? 'SET' : 'MISSING',
  key: supabaseKey ? 'SET' : 'MISSING',
  env: import.meta.env.MODE
});

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables missing!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'MISSING');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

