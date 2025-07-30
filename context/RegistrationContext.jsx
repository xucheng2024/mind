import React, { createContext, useContext, useState, useEffect } from 'react';
import { debug } from '../src/utils/debug';

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
    debug.log('Updating registration data', newData);
    setRegistrationData((prev) => {
      const updated = { ...prev, ...newData };
      debug.log('Updated registration data', updated);
      return updated;
    });
  };

  const clearRegistrationData = () => {
    setRegistrationData({});
    localStorage.removeItem('registrationData');
  };

  return (
    <RegistrationContext.Provider value={{ registrationData, updateRegistrationData, clearRegistrationData }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => useContext(RegistrationContext);
