// Environment Configuration
export const config = {
  // Encryption
  AES_KEY: import.meta.env.VITE_AES_KEY,
  
  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // App
  APP_NAME: import.meta.env.VITE_APP_NAME || 'AppClinic',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.3.0',
  
  // Resend API
  RESEND_API_KEY: import.meta.env.RESEND_API_KEY,
};

// Validation
export const validateConfig = () => {
  const required = ['AES_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }
  
  return true;
};

// Get AES key with validation
export const getAESKey = () => {
  if (!config.AES_KEY) {
    console.warn('AES_KEY not set, please configure encryption key in VITE_AES_KEY environment variable!');
    return null;
  }
  return config.AES_KEY;
}; 