import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '../lib/api';
import cacheManager from '../lib/cache';
import { useRegistration } from '../../context/RegistrationContext';
import { useHapticFeedback } from '../components';
import Confetti from '../components/Confetti';
import { logUserRegistration, logSubmitBook } from '../lib/logger';

import { 
  EnhancedButton, 
  LoadingSpinner, 
  ProgressBar 
} from '../components';

export default function SubmitPage() {
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [restartError, setRestartError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const submittedRef = useRef(false);
  const { trigger: hapticTrigger } = useHapticFeedback();


  useEffect(() => {
    const saveToSupabase = async () => {
      if (submittedRef.current || submitted) return;
      submittedRef.current = true;
      setLoading(true);
      setProgress(0);
      setCurrentStep('Initializing...');

      if (!registrationData || !registrationData.fullName) {
        setErrorMessage('Registration data missing. Please fill in the form again.');
        setLoading(false);
        setProgress(0);
        return;
      }

      setProgress(10);
      setCurrentStep('Validating data...');

      // Auto-generate user_id
      const user_id = registrationData.user_id || uuidv4();

      // Check if clinic_id is valid
      if (!registrationData.clinic_id) {
        setErrorMessage('Clinic ID missing.');
        setLoading(false);
        setProgress(0);
        return;
      }

      setProgress(20);
      setCurrentStep('Processing registration...');

      let selfiePath = registrationData.selfieUrl || registrationData.selfie || '';
      let signaturePath = registrationData.signatureUrl || registrationData.signature || '';
      
      // URL不需要前端AES加密，统一由服务端处理
      
      // Format current time as prefix
      const now = new Date();
      const datetimePrefix = `[${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}]`;
      
      // Combine health declaration and notes
      const healthItems = ['HeartDisease', 'Diabetes', 'Hypertension', 'Cancer', 'Asthma', 'MentalIllness', 'Epilepsy', 'Stroke', 'KidneyDisease', 'LiverDisease'];
      let combinedHealthNotes = '';
      
      // Add health declarations (only Yes and Unsure)
      const healthDeclarations = [];
      healthItems.forEach(item => {
        const value = registrationData[item];
        if (value && ['Yes', 'Unsure'].includes(value)) {
          const displayName = item.replace(/([A-Z])/g, ' $1').trim();
          healthDeclarations.push(`${displayName}(${value})`);
        }
      });
      
      if (healthDeclarations.length > 0) {
        combinedHealthNotes = healthDeclarations.join(', ');
      }
      
      // Add other health notes
      if (registrationData.otherHealthNotes && registrationData.otherHealthNotes.trim()) {
        const otherNotes = registrationData.otherHealthNotes.trim();
        if (combinedHealthNotes) {
          combinedHealthNotes += ` | ${otherNotes}`;
        } else {
          combinedHealthNotes = otherNotes;
        }
      }
      
      // Add time prefix and suffix
      if (combinedHealthNotes) {
        combinedHealthNotes = `${datetimePrefix}: ${combinedHealthNotes} - self declare`;
      } else {
        combinedHealthNotes = `${datetimePrefix}: No other medical history - self declare`;
      }
      
      // Send plain data to API - server will handle encryption
      const userPayload = {
        full_name: registrationData.fullName || '',
        id_last4: registrationData.idLast4 || '',
        dob: registrationData.dob || `${registrationData.dobDay}/${registrationData.dobMonth}/${registrationData.dobYear}`,
        phone: registrationData.phone || '',
        email: registrationData.email || '',
        postal_code: registrationData.postalCode || '',
        block_no: registrationData.blockNo || '',
        street: registrationData.street || '',
        building: registrationData.building || '',
        floor: registrationData.floor || '',
        unit: registrationData.unit || '',
        other_health_notes: combinedHealthNotes,
        is_guardian: !!registrationData.is_guardian,
        signature: signaturePath, // 签名URL，服务端统一加密
        selfie: selfiePath, // 自拍URL，服务端统一加密
        clinic_id: registrationData.clinic_id,
        user_id,
        created_at: new Date().toISOString(),
      };

      setProgress(40);
      setCurrentStep('Creating user account...');
      
      // Insert users using API to bypass RLS
      let insertedUser;
      try {
        const result = await apiClient.createUser(userPayload);
        insertedUser = result.data;
        
        setProgress(60);
        setCurrentStep('Logging registration...');
        
        // Log user registration
        await logUserRegistration({
          clinic_id: registrationData.clinic_id,
          user_id: user_id
        });
        
      } catch (error) {
        console.error('[SubmitPage] User creation failed:', error);
        setErrorMessage(error.message || 'Failed to save user information. Please try again later.');
        submittedRef.current = false;
        setLoading(false);
        return;
      }
      const user_row_id = insertedUser.row_id;

      setProgress(75);
      setCurrentStep('Checking visit status...');
      
      // Check if user already has a visit
      try {
        const result = await apiClient.checkUserVisit(registrationData.clinic_id, user_row_id);
        if (result.data.hasVisit) {
          setErrorMessage('This patient already has a visit record.');
          setLoading(false);
          setProgress(0);
          return;
        }
      } catch (error) {
        console.error('[SubmitPage] Visit check failed:', error);
        setErrorMessage('Failed to verify visit status. Please try again later.');
        submittedRef.current = false;
        setLoading(false);
        setProgress(0);
        return;
      }

      // visits payload
      const visitPayload = {
        user_row_id, // Use row_id as foreign key
        visit_time: new Date().toISOString(),
        book_time: new Date().toISOString(),
        status: 'booked',
        is_first: true,
        clinic_id: registrationData.clinic_id,
      };
      
      setProgress(80);
      setCurrentStep('Creating visit record...');
      
      // Insert visit using API to bypass RLS
      try {
        const result = await apiClient.createVisit(visitPayload);
        
        setProgress(85);
        setCurrentStep('Logging visit booking...');
        
        // Log first visit booking
        await logSubmitBook({
          clinic_id: registrationData.clinic_id,
          user_id: user_id,
          appointment_id: result.data?.id || result.id,
          appointment_date: visitPayload.book_time
        });
        
      } catch (error) {
        console.error('[SubmitPage] Visit creation failed:', error);
        setErrorMessage(error.message || 'Failed to save visit information. Please try again later.');
        submittedRef.current = false;
        setLoading(false);
        return;
      }

      // After successful registration, save login info for auto-login
      if (user_id && user_row_id && registrationData.clinic_id) {
        cacheManager.saveLoginInfo(user_id, user_row_id, registrationData.clinic_id, registrationData.fullName || '');
      }
      
      setProgress(90);
      setCurrentStep('Cleaning up data...');
      
      
      // Clear all registration cache using cache manager
      await cacheManager.clearRegistrationCache();
      
      // Clear registration context data
      updateRegistrationData({});
            
      setProgress(100);
      setCurrentStep('Registration completed!');
      
      // Only show successful registration if all are successful
      setSubmitted(true);
      setLoading(false);
      hapticTrigger('success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    };

    saveToSupabase();
  }, []);

  const handleRestart = () => {
    const id = registrationData.clinic_id;
    if (id) {
      navigate(`/register?clinic_id=${id}`);
    } else {
      setRestartError('Clinic ID missing. Please scan a valid registration link.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Confetti isActive={showConfetti} />
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in flex flex-col items-center text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill="white"
            className="bg-green-500 rounded-full p-4 shadow mb-6"
          >
            <path d="M20.285 6.708l-11.285 11.285-5.285-5.285 1.414-1.414 3.871 3.871 9.871-9.871z" />
          </svg>
          <h2 className="text-green-600 text-2xl font-bold mb-2">Registration Completed</h2>
          <p className="mb-8 text-base text-gray-700">Thank you! You’re successfully registered.</p>
          <EnhancedButton
            onClick={() => {
              hapticTrigger('light');
              navigate('/');
            }}
            fullWidth
            size="lg"
            variant="primary"
          >
            Back Home
          </EnhancedButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in flex flex-col items-center text-center">
        {loading && !errorMessage ? (
          <>
            <div className="w-20 h-20 mb-6 relative">
              <div className="w-full h-full border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Submitting your information...</h2>
            
            <div className="w-full mb-6">
              <ProgressBar 
                progress={progress} 
                className="h-3 rounded-full bg-gray-200"
                progressClassName="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
              />
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{currentStep}</p>
            <p className="text-xs text-gray-500">{progress}% complete</p>
            
            <div className="mt-6 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${progress >= 10 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Validating data</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${progress >= 30 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Checking database</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${progress >= 60 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Creating account</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${progress >= 80 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Setting up visit</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Finalizing</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-2">Submitting your information...</h2>
            <p className="mb-4">Please wait a moment.</p>
            {errorMessage && (
              <div className="w-full flex flex-col justify-center items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100"
                  height="100"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="bg-red-500 rounded-full p-4 shadow mb-4"
                >
                  <line x1="7" y1="7" x2="17" y2="17" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/>
                  <line x1="17" y1="7" x2="7" y2="17" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/>
                </svg>
                <h2 className="text-red-600 text-xl font-bold mb-2">{errorMessage}</h2>
                <EnhancedButton
                  onClick={() => {
                    hapticTrigger('light');
                    navigate('/');
                  }}
                  fullWidth
                  size="lg"
                  variant="primary"
                  className="mt-4"
                >
                  Back Home
                </EnhancedButton>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Debug line removed - using server API instead
