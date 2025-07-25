import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { hash, encrypt } from '../lib/utils';

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

      let selfiePath = registrationData.selfie || '';

      // 只加密姓名、生日、地址、电话、邮箱、签名、自拍、id_last4
      const AES_KEY = import.meta.env.VITE_AES_KEY;
      if (!AES_KEY) {
        console.warn('AES_KEY未设置，请在环境变量VITE_AES_KEY中配置加密密钥！');
      }
      // 使用 encrypt(val, AES_KEY) 和 hash(val) 进行加密/哈希
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
        health_declaration: JSON.stringify(
          Object.fromEntries(
            Object.entries(registrationData).filter(
              ([key, value]) =>
                /^[A-Z][a-zA-Z]+$/.test(key) &&
                ['yes', 'no', 'unsure'].includes((value || '').toString().toLowerCase())
            )
          )
        ),
        other_health_notes: registrationData.otherHealthNotes || '',
        is_guardian: !!registrationData.is_guardian,
        signature: encrypt(registrationData.signature || '', AES_KEY),
        selfie: encrypt(selfiePath, AES_KEY),
        clinic_id: registrationData.clinic_id, // 不加密
        user_id, // 不加密
        created_at: new Date().toISOString(), // 不加密
      };

      // 插入 users，返回 row_id
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

      // 查询是否已到访
      const { data: existingVisit, error: visitQueryError } = await supabase
        .from('visits')
        .select('id')
        .match({
          user_row_id: user_row_id,
          clinic_id: registrationData.clinic_id,
        })
        .maybeSingle();
      console.log('[SubmitPage] visit查询结果:', { existingVisit, visitQueryError });

      if (visitQueryError) {
        setErrorMessage('Failed to check existing visit. Please try again later.');
        setLoading(false);
        return;
      }

      if (existingVisit) {
        console.log('[SubmitPage][Error] 已有visit:', existingVisit);
        setErrorMessage('This patient already has a visit record.');
        setLoading(false);
        return;
      }

      // visits payload
      const visitPayload = {
        user_row_id, // 用 row_id 作为外键
        visit_time: new Date().toISOString(),
        book_time: new Date().toISOString(),
        status: 'checked-in',
        is_first: true,
        clinic_id: registrationData.clinic_id,
      };
      const { error: visitError } = await supabase.from('visits').insert([visitPayload]);
      console.log('[SubmitPage] visit插入结果:', visitError);
      if (visitError) {
        setErrorMessage(visitError.message || 'Failed to save visit information. Please try again later.');
        submittedRef.current = false;
        setLoading(false);
        return;
      }

      // 注册成功后保存user_id、user_row_id和clinic_id到localStorage，实现注册即登录体验
      if (user_id) localStorage.setItem('user_id', user_id);
      if (user_row_id) localStorage.setItem('user_row_id', user_row_id);
      if (registrationData.clinic_id) localStorage.setItem('clinic_id', registrationData.clinic_id);
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
            aria-label="Back Home"
            onClick={() => navigate('/')}
            className="w-full h-14 rounded-xl text-lg font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
          >
            Back Home
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
              aria-label="Back Home"
              onClick={() => navigate('/')}
              className="w-full h-14 rounded-xl text-lg font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 mt-4"
            >
              Back Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

console.log('Supabase instance:', supabase);
