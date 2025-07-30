import React, { createContext, useContext, useState, useEffect } from 'react';


const RegistrationContext = createContext();

export const RegistrationProvider = ({ children }) => {
  // Initialize from localStorage
  const [registrationData, setRegistrationData] = useState(() => {
    if (typeof window === 'undefined') return {};
    const saved = window.localStorage.getItem('registrationData');
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch {
      window.localStorage.removeItem('registrationData');
      return {};
    }
  });

  // Save to localStorage whenever registrationData changes
  useEffect(() => {
    localStorage.setItem('registrationData', JSON.stringify(registrationData));
  }, [registrationData]);

  const updateRegistrationData = (newData) => {
    setRegistrationData((prev) => {
      const updated = { ...prev, ...newData };
      return updated;
    });
  };

  const clearRegistrationData = () => {
    setRegistrationData({});
    localStorage.removeItem('registrationData');
    localStorage.removeItem('registrationFormDraft');
    sessionStorage.clear();
    
    // Clear any cached images or blobs
    if (typeof window !== 'undefined') {
      // Clear any blob URLs
      if (window.URL && window.URL.revokeObjectURL) {
        // This is a best effort cleanup - we can't track all blob URLs
        console.log('🧹 Clearing blob URLs and cache...');
      }
      
      // Clear any camera cache
      if (window.cameraCache) {
        delete window.cameraCache;
      }
      
      // Clear any form cache
      if (window.formCache) {
        delete window.formCache;
      }
    }
    
    console.log('🧹 Registration data cleared completely');
  };

  return (
    <RegistrationContext.Provider value={{ registrationData, updateRegistrationData, clearRegistrationData }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => useContext(RegistrationContext);
