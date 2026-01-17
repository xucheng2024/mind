// Environment Configuration
export const config = {
  // App
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Mind Training',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.3.0',
};

// Validation - no required environment variables
export const validateConfig = () => {
  return true;
}; 