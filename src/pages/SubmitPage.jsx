import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

export default function SubmitPage() {
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [restartError, setRestartError] = useState('');
  const submittedRef = useRef(false);

  console.log('[SubmitPage] 页面加载，registrationData:', registrationData);

  useEffect(() => {
    console.log('[SubmitPage] useEffect 执行');
    const saveToSupabase = async () => {
      console.log('[SubmitPage] saveToSupabase 执行');
      if (submittedRef.current || submitted) return;
      submittedRef.current = true;
      setLoading(true);

      if (!registrationData || !registrationData.fullName) {
        console.log('[SubmitPage][Error] registrationData 缺失:', registrationData);
        setErrorMessage('Registration data missing. Please fill in the form again.');
        setLoading(false);
        return;
      }

      // 自动生成 user_id
      const user_id = registrationData.user_id || uuidv4();

      // 检查 clinic_id 是否有效
      if (!registrationData.clinic_id) {
        console.log('[SubmitPage][Error] clinic_id 缺失:', registrationData);
        setErrorMessage('Clinic ID missing.');
        setLoading(false);
        return;
      }

      console.log('[SubmitPage] 查询用户:', { user_id, clinic_id: registrationData.clinic_id });
      // 查询
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('user_id')
        .match({
          user_id,
          clinic_id: registrationData.clinic_id,
        })
        .maybeSingle();
      console.log('[SubmitPage] 用户查询结果:', { existingUser, error });

      if (error) {
        setErrorMessage('Failed to check existing user. Please try again later.');
        setLoading(false);
        return;
      }

      // 查询是否已注册
      if (existingUser) {
        console.log('[SubmitPage][Error] 已注册:', existingUser);
        setErrorMessage('This patient is already registered.');
        setLoading(false);
        return;
      }

      console.log('[SubmitPage] 查询visit:', { user_id, clinic_id: registrationData.clinic_id });
      const { data: existingVisit, error: visitQueryError } = await supabase
        .from('visits')
        .select('id')
        .match({
          user_id: user_id,
          clinic_id: registrationData.clinic_id,
        })
        .maybeSingle();
      console.log('[SubmitPage] visit查询结果:', { existingVisit, visitQueryError });

      if (visitQueryError) {
        setErrorMessage('Failed to check existing visit. Please try again later.');
        setLoading(false);
        return;
      }

      // 查询是否已到访
      if (existingVisit) {
        console.log('[SubmitPage][Error] 已有visit:', existingVisit);
        setErrorMessage('This patient already has a visit record.');
        setLoading(false);
        return;
      }

      let selfiePath = registrationData.selfie || '';

      // 只加密姓名、生日、地址、电话、邮箱、签名、自拍、id_last4
      const AES_KEY = import.meta.env.VITE_AES_KEY;
      if (!AES_KEY) {
        console.warn('AES_KEY未设置，请在环境变量VITE_AES_KEY中配置加密密钥！');
      }
      function encrypt(val) {
        return val ? CryptoJS.AES.encrypt(val.toString(), AES_KEY).toString() : '';
      }
      function hash(val) {
        return val ? CryptoJS.SHA256(val.trim().toLowerCase()).toString() : '';
      }
      const userPayload = {
        full_name: encrypt(registrationData.fullName || ''),
        id_last4: encrypt(registrationData.idLast4 || ''),
        dob: encrypt(registrationData.dob || `${registrationData.dobDay}/${registrationData.dobMonth}/${registrationData.dobYear}`),
        phone: encrypt(registrationData.phone || ''),
        phone_hash: hash(registrationData.phone || ''),
        email: encrypt(registrationData.email || ''),
        email_hash: hash(registrationData.email || ''),
        postal_code: encrypt(registrationData.postalCode || ''),
        block_no: encrypt(registrationData.blockNo || ''),
        street: encrypt(registrationData.street || ''),
        building: encrypt(registrationData.building || ''),
        floor: encrypt(registrationData.floor || ''),
        unit: encrypt(registrationData.unit || ''),
        health_declaration: JSON.stringify(
          Object.fromEntries(
            Object.entries(registrationData).filter(
              ([key, value]) => /^[A-Z][a-zA-Z]+$/.test(key) && ['YES', 'NO', 'UNSURE'].includes(value)
            )
          )
        ),
        other_health_notes: registrationData.otherHealthNotes || '',
        is_guardian: registrationData.is_guardian ? 'true' : 'false',
        signature: encrypt(registrationData.signature || ''),
        selfie: encrypt(selfiePath),
        clinic_id: registrationData.clinic_id, // 不加密
        user_id, // 不加密
        created_at: new Date().toISOString(), // 不加密
      };

      const visitPayload = {
        user_id,
        visit_time: new Date().toISOString(),
        book_time: new Date().toISOString(),
        status: 'checked-in',
        is_first: true,
        is_paid: false,
        clinic_id: registrationData.clinic_id,
      };

      console.log('[SubmitPage] 即将插入用户:', userPayload);
      console.log('[SubmitPage] 即将插入visit:', visitPayload);
      // 插入
      const { error: userError } = await supabase.from('users').insert([userPayload]);
      console.log('[SubmitPage] 用户插入结果:', userError);
      if (userError) {
        setErrorMessage(userError.message || 'Failed to save user information. Please try again later.');
        submittedRef.current = false;
        setLoading(false);
        return;
      }

      const { error: visitError } = await supabase.from('visits').insert([visitPayload]);
      console.log('[SubmitPage] visit插入结果:', visitError);
      if (visitError) {
        setErrorMessage(visitError.message || 'Failed to save visit information. Please try again later.');
        submittedRef.current = false;
        setLoading(false);
        return;
      }

      // 只有全部成功才显示注册成功
      setSubmitted(true);
      setLoading(false);
      console.log('[SubmitPage] 注册成功');
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
          <button
            aria-label="Back to Home"
            onClick={() => navigate('/')}
            className="w-full h-14 rounded-xl text-lg font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
          >
            Back to Home
          </button>
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
            <button
              aria-label="Back to Home"
              onClick={() => navigate('/')}
              className="w-full h-14 rounded-xl text-lg font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 mt-4"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

console.log('Supabase instance:', supabase);
