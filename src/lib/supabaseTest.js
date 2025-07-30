import { supabase } from './supabaseClient.js';

export async function testSupabaseConnection() {
  try {
    console.log('🧪 Testing Supabase browser compatibility...');
    console.log('🌐 Environment:', import.meta.env.MODE);
    console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('🔑 Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    
    // Test basic connection without querying specific table
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase browser connection successful');
    console.log('📊 Session data:', data);
    return true;
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Auto-run test in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    testSupabaseConnection();
  }, 2000); // Longer delay to ensure app is fully loaded
} 