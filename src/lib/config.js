// Environment Configuration
export const config = {
  // Supabase (for storage only - database operations via server API)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // App
  APP_NAME: import.meta.env.VITE_APP_NAME || 'AppClinic',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.3.0',
  
  // API Base URL
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
};

// Validation - AES_KEY removed since encryption is server-side only
export const validateConfig = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }
  
  return true;
};

// Note: AES encryption is now handled server-side only
// Frontend no longer needs access to encryption keys 