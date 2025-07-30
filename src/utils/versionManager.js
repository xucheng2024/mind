// Version Management Utility
// This file helps manage app versions and update notifications

export const VERSION_CONFIG = {
  // Current app version - update this when releasing new versions
  CURRENT_VERSION: '1.2.0',
  
  // Version history - add new versions here
  VERSION_HISTORY: {
    '1.0.0': {
      date: '2024-01-01',
      title: 'Initial Release',
      changes: [
        'Basic clinic registration system',
        'PWA support with offline capabilities',
        'Mobile-responsive design'
      ]
    },
    '1.1.0': {
      date: '2024-01-15',
      title: 'Performance Improvements',
      changes: [
        'Optimized build process (80% faster)',
        'Added clinic configuration management',
        'Improved clinic_id handling across pages',
        'Enhanced PWA installation experience'
      ]
    },
    '1.2.0': {
      date: '2024-01-20',
      title: 'Enhanced Features',
      changes: [
        'Dynamic clinic_id resolution from URL/localStorage',
        'Fast build configuration for development',
        'Debug logging for registration flow',
        'Improved error handling and user feedback',
        'Version update notification system'
      ]
    }
  }
};

// Helper functions
export const getCurrentVersion = () => VERSION_CONFIG.CURRENT_VERSION;

export const getVersionInfo = (version) => {
  return VERSION_CONFIG.VERSION_HISTORY[version] || null;
};

export const getStoredVersion = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('app_version');
};

export const setStoredVersion = (version) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('app_version', version);
};

export const hasVersionChanged = () => {
  const stored = getStoredVersion();
  const current = getCurrentVersion();
  return stored && stored !== current;
};

export const updateStoredVersion = () => {
  setStoredVersion(getCurrentVersion());
};

// Version comparison utilities
export const compareVersions = (version1, version2) => {
  const v1 = version1.split('.').map(Number);
  const v2 = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
};

export const isNewerVersion = (version1, version2) => {
  return compareVersions(version1, version2) > 0;
};

// Development helpers
export const resetVersion = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('app_version');
};

export const setVersion = (version) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('app_version', version);
};

// Console helpers for development
if (typeof window !== 'undefined') {
  window.versionUtils = {
    getCurrentVersion,
    getStoredVersion,
    hasVersionChanged,
    resetVersion,
    setVersion,
    compareVersions,
    isNewerVersion
  };
} 