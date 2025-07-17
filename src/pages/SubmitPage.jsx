import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export default function SubmitPage() {
  const navigate = useNavigate();
  const { registrationData } = useRegistration();
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [restartError, setRestartError] = useState('');
  const submittedRef = useRef(false);

  useEffect(() => {
    const saveToSupabase = async () => {
      if (submittedRef.current || submitted) return;
      submittedRef.current = true;
      setLoading(true);

      if (!registrationData || !registrationData.fullName) {
        setErrorMessage('Registration data missing. Please fill in the form again.');
        setLoading(false);
        return;
      }

      // 自动生成 user_id
      const user_id = registrationData.user_id || uuidv4();

      // 检查 clinic_id 是否有效
      if (!registrationData.clinic_id) {
        setErrorMessage('Clinic ID missing.');
        setLoading(false);
        return;
      }

      // 查询
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('user_id')
        .match({
          user_id,
          clinic_id: registrationData.clinic_id,
        })
        .maybeSingle();

      if (error) {
        setErrorMessage('Failed to check existing user. Please try again later.');
        setLoading(false);
        return;
      }

      // 查询是否已注册
      if (existingUser) {
        setErrorMessage('This patient is already registered.');
        setLoading(false);
        return;
      }

      const { data: existingVisit, error: visitQueryError } = await supabase
        .from('visits')
        .select('id')
        .match({
          user_id: user_id,
          clinic_id: registrationData.clinic_id,
        })
        .maybeSingle();

      if (visitQueryError) {
        setErrorMessage('Failed to check existing visit. Please try again later.');
        setLoading(false);
        return;
      }

      // 查询是否已到访
      if (existingVisit) {
        setErrorMessage('This patient already has a visit record.');
        setLoading(false);
        return;
      }

      let selfiePath = registrationData.selfie || '';

      const healthDeclaration = JSON.stringify(
        Object.fromEntries(
          Object.entries(registrationData).filter(
            ([key, value]) => /^[A-Z][a-zA-Z]+$/.test(key) && ['YES', 'NO', 'UNSURE'].includes(value)
          )
        )
      );

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
        health_declaration: healthDeclaration,
        other_health_notes: registrationData.otherHealthNotes || '',
        is_guardian: registrationData.is_guardian || false,
        signature: registrationData.signature || '',
        selfie: selfiePath,
        clinic_id: registrationData.clinic_id,
        user_id,
        created_at: new Date().toISOString(),
      };

      const visitPayload = {
        user_id,
        visit_time: new Date().toISOString(),
        is_first: true,
        is_paid: false,
        clinic_id: registrationData.clinic_id,
      };

      console.log('userPayload:', userPayload);
      console.log('visitPayload:', visitPayload);

      // 插入
      const { error: userError } = await supabase.from('users').insert([userPayload]);
      if (userError) {
        setErrorMessage(userError.message || 'Failed to save user information. Please try again later.');
        submittedRef.current = false;
        setLoading(false);
        return;
      }

      const { error: visitError } = await supabase.from('visits').insert([visitPayload]);
      if (visitError) {
        setErrorMessage(visitError.message || 'Failed to save visit information. Please try again later.');
        submittedRef.current = false;
        setLoading(false);
        return;
      }

      // 只有全部成功才显示注册成功
      setSubmitted(true);
      setLoading(false);
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
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-center items-center bg-gray-50 rounded-lg p-8 text-center">
        <div className="mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="white"
            className="bg-green-500 rounded-full p-3 shadow"
          >
            <path d="M20.285 6.708l-11.285 11.285-5.285-5.285 1.414-1.414 3.871 3.871 9.871-9.871z" />
          </svg>
        </div>
        <h2 className="text-blue-600 text-2xl font-bold">Registration Completed</h2>
        <p className="mt-2 text-base text-gray-700">
          Thanks! You’re successfully registered.
        </p>
        <button
          aria-label="Register another patient"
          onClick={handleRestart}
          disabled={loading}
          className={`mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold transition ${
            loading ? 'bg-gray-300 cursor-not-allowed opacity-70' : 'hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : 'Register Another Patient'}
        </button>
        {restartError && <div className="text-red-500 mt-3 text-sm">{restartError}</div>}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-center items-center bg-gray-50 rounded-lg p-8 text-center">
      <h2 className="text-lg font-semibold mb-2">Submitting your information...</h2>
      <p className="mb-4">Please wait a moment.</p>
      {errorMessage && (
        <div className="w-full flex flex-col justify-center items-center bg-gray-50 rounded-lg min-h-[320px]">
          <div className="mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="none"
              className="bg-red-500 rounded-full p-3 shadow"
            >
              <line x1="7" y1="7" x2="17" y2="17" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/>
              <line x1="17" y1="7" x2="7" y2="17" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-red-500 text-2xl font-bold">{errorMessage}</h2>
        </div>
      )}
    </div>
  );
}

console.log('Supabase instance:', supabase);
