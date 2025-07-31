import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { hash, encrypt } from '../lib/utils';
import { getAESKey } from '../lib/config';
import cacheManager from '../lib/cache';
import { 
  EnhancedButton, 
  LoadingSpinner, 
  useHapticFeedback,
  Confetti,
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
      // Query
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('user_id')
        .match({
          user_id,
          clinic_id: registrationData.clinic_id,
        })
        .maybeSingle();
      console.log('[SubmitPage] User query result:', { existingUser, error });

      if (error) {
        setErrorMessage('Failed to check existing user. Please try again later.');
        setLoading(false);
        return;
      }

      // Check if already registered
      if (existingUser) {
        console.log('[SubmitPage][Error] Already registered:', existingUser);
        setErrorMessage('This patient is already registered.');
        setLoading(false);
        return;
      }

      let selfiePath = registrationData.selfieUrl || registrationData.selfie || '';

      // Only encrypt name, birthday, address, phone, email, signature, selfie, id_last4
      const AES_KEY = getAESKey();
      
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
        combinedHealthNotes = `${datetimePrefix}: None reported - self declare`;
      }
      
      // Use encrypt(val, AES_KEY) and hash(val) for encryption/hashing
      const userPayload = {
        full_name: encrypt(registrationData.fullName || '', AES_KEY),
        id_last4: encrypt(registrationData.idLast4 || '', AES_KEY),
        dob: encrypt(registrationData.dob || `${registrationData.dobDay}/${registrationData.dobMonth}/${registrationData.dobYear}`, AES_KEY),
        phone: encrypt(registrationData.phone || '', AES_KEY),
        phone_hash: hash(registrationData.phone || ''),
        email: encrypt(registrationData.email || '', AES_KEY),
        email_hash: hash(registrationData.email || ''),
        postal_code: encrypt(registrationData.postalCode || '', AES_KEY),
        block_no: encrypt(registrationData.blockNo || '', AES_KEY),
        street: encrypt(registrationData.street || '', AES_KEY),
        building: encrypt(registrationData.building || '', AES_KEY),
        floor: encrypt(registrationData.floor || '', AES_KEY),
        unit: encrypt(registrationData.unit || '', AES_KEY),
        other_health_notes: encrypt(combinedHealthNotes, AES_KEY),
        is_guardian: !!registrationData.is_guardian,
        signature: encrypt(registrationData.signatureUrl || registrationData.signature || '', AES_KEY),
        selfie: encrypt(selfiePath, AES_KEY),
        clinic_id: registrationData.clinic_id, // Not encrypted
        user_id, // Not encrypted
        created_at: new Date().toISOString(), // Not encrypted
      };

      // Insert users, return row_id
      const { data: insertedUser, error: userError } = await supabase
        .from('users')
        .insert([userPayload])
        .select('row_id')
        .single();

      if (userError) {
        setErrorMessage(userError.message || 'Failed to save user information. Please try again later.');
        submittedRef.current = false;
        setLoading(false);
        return;
      }
      const user_row_id = insertedUser.row_id;

      // Query if already visited
      const { data: existingVisit, error: visitQueryError } = await supabase
        .from('visits')
        .select('id')
        .match({
          user_row_id: user_row_id,
          clinic_id: registrationData.clinic_id,
        })
        .maybeSingle();
      console.log('[SubmitPage] visit query result:', { existingVisit, visitQueryError });

      if (visitQueryError) {
        setErrorMessage('Failed to check existing visit. Please try again later.');
        setLoading(false);
        return;
      }

      if (existingVisit) {
        console.log('[SubmitPage][Error] Already visited:', existingVisit);
        setErrorMessage('This patient already has a visit record.');
        setLoading(false);
        return;
      }

      // visits payload
      const visitPayload = {
        user_row_id, // Use row_id as foreign key
        visit_time: new Date().toISOString(),
        book_time: new Date().toISOString(),
        status: 'checked-in',
        is_first: true,
        clinic_id: registrationData.clinic_id,
      };
      const { error: visitError } = await supabase.from('visits').insert([visitPayload]);
      console.log('[SubmitPage] visit insertion result:', visitError);
      if (visitError) {
        setErrorMessage(visitError.message || 'Failed to save visit information. Please try again later.');
        submittedRef.current = false;
        setLoading(false);
        return;
      }

      // After successful registration, save login info for auto-login
      if (user_id && user_row_id && registrationData.clinic_id) {
        cacheManager.saveLoginInfo(user_id, user_row_id, registrationData.clinic_id);
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

console.log('Supabase instance:', supabase);
