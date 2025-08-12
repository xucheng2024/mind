import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '../lib/api';
import { cacheManager } from '../lib/cache';
import { useRegistration } from '../context/RegistrationContext';
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
  const submittedRef = useRef(false);
  const { trigger: hapticTrigger } = useHapticFeedback();

  console.log('[SubmitPage] Page loaded, registrationData:', registrationData);

  useEffect(() => {
    console.log('[SubmitPage] useEffect executed');
    const saveToSupabase = async () => {
      console.log('[SubmitPage] saveToSupabase executed');
      if (submittedRef.current || submitted) return;
      submittedRef.current = true;
      setLoading(true);

      if (!registrationData || !registrationData.fullName) {
        console.log('[SubmitPage][Error] registrationData missing:', registrationData);
        setErrorMessage('Registration data missing. Please fill in the form again.');
        setLoading(false);
        return;
      }

      // Auto-generate user_id
      const user_id = registrationData.user_id || uuidv4();

      // Check if clinic_id is valid
      if (!registrationData.clinic_id) {
        console.log('[SubmitPage][Error] clinic_id missing:', registrationData);
        setErrorMessage('Clinic ID missing.');
        setLoading(false);
        return;
      }

      console.log('[SubmitPage] Query user:', { user_id, clinic_id: registrationData.clinic_id });
      // Query using API to bypass RLS
      let existingUser = null;
      try {
        const result = await apiClient.getUser(registrationData.clinic_id, user_id);
        existingUser = result.data;
        console.log('[SubmitPage] User query result:', { existingUser });
      } catch (error) {
        // User not found is expected for new registrations
        console.log('[SubmitPage] User not found (expected for new registration):', error.message);
      }

      // Check if already registered
      if (existingUser) {
        console.log('[SubmitPage][Error] Already registered:', existingUser);
        setErrorMessage('This patient is already registered.');
        setLoading(false);
        return;
      }

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

      // Insert users using API to bypass RLS
      let insertedUser;
      try {
        const result = await apiClient.createUser(userPayload);
        insertedUser = result.data;
        console.log('[SubmitPage] User created successfully:', insertedUser);
        
        // Log user registration
        await logUserRegistration({
          clinic_id: registrationData.clinic_id,
          user_id: user_id,
          email: registrationData.email || '',
          phone: registrationData.phone || '',
          registration_method: 'web_form',
          user_type: 'patient',
          registration_source: 'web_app'
        });
        
      } catch (error) {
        console.error('[SubmitPage] User creation failed:', error);
        setErrorMessage(error.message || 'Failed to save user information. Please try again later.');
        submittedRef.current = false;
        setLoading(false);
        return;
      }
      const user_row_id = insertedUser.row_id;

      // Check if user already has a visit
      try {
        const result = await apiClient.checkUserVisit(registrationData.clinic_id, user_row_id);
        if (result.data.hasVisit) {
          console.log('[SubmitPage][Error] Already visited:', result.data);
          setErrorMessage('This patient already has a visit record.');
          setLoading(false);
          return;
        }
        console.log('[SubmitPage] Visit check result:', result.data);
      } catch (error) {
        console.error('[SubmitPage] Visit check failed:', error);
        setErrorMessage('Failed to verify visit status. Please try again later.');
        submittedRef.current = false;
        setLoading(false);
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
      
      // Insert visit using API to bypass RLS
      try {
        const result = await apiClient.createVisit(visitPayload);
        console.log('[SubmitPage] Visit created successfully:', result.data);
        
        // Log first visit booking
        await logSubmitBook({
          clinic_id: registrationData.clinic_id,
          user_id: user_id,
          appointment_id: result.data?.id || result.id,
          service_type: 'first_consultation',
          doctor_id: null,
          appointment_date: new Date().toISOString(),
          duration_minutes: 30,
          booking_method: 'web_form',
          payment_status: 'pending',
          total_amount: null
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
      
      // Clean up all registration-related cache and data
      console.log('[SubmitPage] Cleaning up registration data...');
      
      // Clear all registration cache using cache manager
      await cacheManager.clearRegistrationCache();
      
      // Clear registration context data
      updateRegistrationData({});
      
      console.log('[SubmitPage] Cache cleanup completed');
      
      // Only show successful registration if all are successful
      setSubmitted(true);
      setLoading(false);
      hapticTrigger('success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      console.log('[SubmitPage] Registration successful');
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
      </div>
    </div>
  );
}

// Debug line removed - using server API instead
