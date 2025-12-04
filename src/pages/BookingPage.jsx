import React, { useState, useEffect, useCallback, useMemo } from 'react';
import RegistrationHeader from '../components/RegistrationHeader';
import { apiClient } from '../lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isPhone } from '../lib/utils';
import CryptoJS from 'crypto-js';
import cacheManager from '../lib/cache';

// Hash function that matches backend quickHash - 改为不可逆
function quickHash(text) {
  if (!text) return '';
  return CryptoJS.SHA256(text.replace(/\s+/g, '').toLowerCase()).toString();
}

import { 
  EnhancedButton, 
  useHapticFeedback 
} from '../components';

const BookingPage = React.memo(() => {
  const [searchParams] = useSearchParams();
  const clinicId = searchParams.get('clinic_id') || '';
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { trigger: hapticTrigger } = useHapticFeedback();

  // Memoize computed values
  const isFormValid = useMemo(() => {
    return input.trim() && clinicId;
  }, [input, clinicId]);

  const currentClinicId = useMemo(() => {
    const savedClinicId = localStorage.getItem('clinic_id');
    return clinicId || savedClinicId;
  }, [clinicId]);

  // Memoize event handlers
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  }, [error]);

  const handleBackHome = useCallback(() => {
    hapticTrigger('light');
    navigate('/');
  }, [hapticTrigger, navigate]);

  // Check for saved login info
  useEffect(() => {
    const savedUserRowId = localStorage.getItem('user_row_id');
    
    if (currentClinicId && savedUserRowId) {
      // Validate if user is still valid
      const validateAndRedirect = async () => {
        try {
          const result = await apiClient.validateUser(currentClinicId, savedUserRowId);
          
          if (result.success && result.data.valid) {
            // User valid, redirect to calendar
            navigate(`/booking/slots?clinic_id=${currentClinicId}&user_row_id=${savedUserRowId}`);
          } else {
            // User invalid, clear saved info
            cacheManager.clearLoginInfo();
          }
        } catch (err) {
          console.error('User validation failed:', err);
          // Validation failed, clear saved info
          cacheManager.clearLoginInfo();
        }
      };
      
      validateAndRedirect();
    }
  }, [currentClinicId, navigate]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }
    
    setError('');
    if (!isFormValid) {
      setError('Please enter your phone number.');
      return;
    }
    
    if (!isPhone(input)) {
      setError('Please enter a valid phone number (digits only).');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setLoading(true);
      
      const startTime = performance.now();
      
      let hashValue;
      let data;
      try {
        hashValue = quickHash(input);
        const apiStart = performance.now();
        const result = await apiClient.queryUser(clinicId, hashValue);
        const apiEnd = performance.now();
        data = result.data;
      } catch (error) {
        console.error('User query failed:', error);
        setError('No user found with this phone number in this clinic.');
        return;
      }
      
      if (!data) {
        setError('No user found with this phone number in this clinic.');
        return;
      }
      
      const totalTime = performance.now() - startTime;
      
      // Save login info using cacheManager (includes user name and gender)
      cacheManager.saveLoginInfo(data.user_id, data.row_id, clinicId, data.full_name || '', data.gender || '');
      
      navigate(`/booking/slots?clinic_id=${clinicId}&user_id=${data.user_id}&user_row_id=${data.row_id}`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  }, [isSubmitting, isFormValid, input, clinicId, navigate]);

  // UI: show error if clinic_id is missing
  if (!clinicId) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in text-center">
          <RegistrationHeader title="Book a New Appointment" />
          <div className="mt-8 text-red-600 text-lg font-semibold flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Clinic ID is missing. Please use the correct booking link.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in">
        <RegistrationHeader title="Book a New Appointment" />
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              value={input}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              autoFocus
              aria-label="Phone Number"
              inputMode="tel"
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          <EnhancedButton
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
            variant="primary"
            onClick={() => hapticTrigger('light')}
          >
            {loading ? 'Checking...' : 'Next'}
          </EnhancedButton>
          {error && (
            <div className="text-red-600 text-sm p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 animate-shake">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          <div className="flex justify-center mt-4">
            <button
              className="text-gray-400 text-xs underline hover:text-blue-600 transition"
              type="button"
              onClick={handleBackHome}
            >
              Back Home
            </button>
          </div>
        </form> 
      </div>
    </div>
  );
});

BookingPage.displayName = 'BookingPage';

export default BookingPage; 