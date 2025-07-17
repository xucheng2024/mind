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
    setRegistrationData((prev) => ({ ...prev, ...newData }));
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
