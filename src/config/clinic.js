// Clinic Configuration
export const CLINIC_CONFIG = {
  // Default clinic ID - can be overridden by environment variable
  DEFAULT_CLINIC_ID: import.meta.env.VITE_DEFAULT_CLINIC_ID || '5c366433-6dc9-4735-9181-a690201bd0b3',
  
  // Clinic information
  CLINIC_NAME: 'San TCM Clinic',
  CLINIC_DESCRIPTION: 'Traditional Chinese Medicine & Wellness',
  
  // Feature flags
  ENABLE_REGISTRATION: true,
  ENABLE_BOOKING: true,
  ENABLE_CHECK_IN: true,
  
  // URLs and endpoints
  ONEMAP_API_URL: 'https://www.onemap.gov.sg/api/common/elastic/search',
  
  // Timezone (Singapore)
  TIMEZONE: 'Asia/Singapore',
  
  // Default settings
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_CURRENCY: 'SGD',
};

// Helper function to get clinic ID from various sources
export const getClinicId = (urlParams = null, localStorage = null) => {
  // Priority: URL params > localStorage > environment > default
  if (urlParams?.get('clinic_id')) {
    return urlParams.get('clinic_id');
  }
  
  if (localStorage?.getItem('clinic_id')) {
    return localStorage.getItem('clinic_id');
  }
  
  return CLINIC_CONFIG.DEFAULT_CLINIC_ID;
};

// Helper function to validate clinic ID
export const isValidClinicId = (clinicId) => {
  if (!clinicId) return false;
  
  // Basic UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(clinicId);
}; 