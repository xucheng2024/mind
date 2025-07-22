import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useRegistration } from '../../context/RegistrationContext';

export default function LoginPage() {
  const { registrationData, updateRegistrationData } = useRegistration();
  const contextEmail = registrationData.email || '';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeExpiry, setCodeExpiry] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (contextEmail) setEmail(contextEmail);
  }, [contextEmail]);

  // 生成5位数字验证码
  const generateVerificationCode = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  // 发送验证码邮件
  const sendVerificationEmail = async (email, code) => {
    try {
      const response = await fetch('http://localhost:3001/api/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (isSending) return; // 防止重复点击
    
    setError('');
    setSuccessMessage('');
    setIsSending(true);

    if (!email.trim()) {
      setError('Please enter your email.');
      setIsSending(false);
      return;
    }

    // 生成验证码和过期时间（5分钟后）
    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

    setVerificationCode(code);
    setCodeExpiry(expiry);

    // 发送验证码邮件
    const result = await sendVerificationEmail(email, code);
    
    if (result.success) {
      setSent(true);
      setSuccessMessage('Verification code has been sent to your email.');
      // 更新 RegistrationContext 的 email
      updateRegistrationData({ email });
    } else {
      setError('Failed to send verification email. Please try again later.');
    }
    
    setIsSending(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (isVerifying) return; // 防止重复点击
    
    setError('');
    setIsVerifying(true);
    
    if (!inputCode.trim()) {
      setError('Please enter the verification code.');
      setIsVerifying(false);
      return;
    }

    if (attempts >= 5) {
      setError('Too many failed attempts. Please try again later.');
      setIsVerifying(false);
      return;
    }

    // 检查验证码是否过期
    if (!codeExpiry || new Date() > codeExpiry) {
      setError('Verification code has expired. Please request a new one.');
      setSent(false);
      setVerificationCode('');
      setCodeExpiry(null);
      setIsVerifying(false);
      return;
    }

    // 验证码校验
    console.log('Comparing codes:', { input: inputCode.trim(), stored: verificationCode });
    if (inputCode.trim() !== verificationCode) {
      setAttempts(a => a + 1);
      setError('Invalid verification code. Please try again.');
      setInputCode('');
      setIsVerifying(false);
      return;
    }

    console.log('Verification code is correct!');

    // 验证成功，直接跳转
    try {
      console.log('Starting navigation process...');
      
      // 存储会话信息到 localStorage
      localStorage.setItem('userSession', JSON.stringify({
        email,
        loginTime: new Date().toISOString(),
        verified: true
      }));
      console.log('Session stored to localStorage');

      // 直接跳转到 profile 页面
      console.log('Calling navigate...');
      navigate('/profile', { replace: true });
      console.log('Navigate to profile called');
      
    } catch (error) {
      console.error('Error during navigation:', error);
      // 使用 window.location 作为备用
      console.log('Using window.location as fallback');
      window.location.href = '/profile';
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (isSending) return; // 防止重复点击
    
    setIsSending(true);
    setSent(false);
    setVerificationCode('');
    setCodeExpiry(null);
    setInputCode('');
    setAttempts(0);
    setError('');
    setSuccessMessage('');
    
    // 延迟一下显示重新发送状态
    setTimeout(() => {
      setIsSending(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">San TCM Clinic</h1>
              <p className="text-gray-600 mt-1">Secure Login Portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Login Icon */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              {!sent ? 'Welcome Back' : 'Verify Your Email'}
            </h2>
            <p className="text-center text-gray-600 mb-8">
              {!sent ? 'Enter your email to receive a verification code' : 'Enter the code we sent to your email'}
            </p>
        
        {!sent ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                className="w-full border border-gray-300 rounded-xl p-4 text-base focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={isSending}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSending}
              className={`w-full h-14 rounded-xl text-lg font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                isSending 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none transform-none' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Code...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Verification Code
                </>
              )}
            </button>
            {error && (
              <div className="text-red-600 text-sm p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            {successMessage && (
              <div className="text-green-700 text-sm p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {successMessage}
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-blue-800">Code Sent</span>
              </div>
              <p className="text-sm text-blue-700">
                We've sent a 5-digit verification code to{' '}
                <span className="font-semibold">{email}</span>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                className="w-full border border-gray-300 rounded-xl p-4 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400"
                type="text"
                value={inputCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setInputCode(value);
                }}
                placeholder="00000"
                maxLength={5}
                disabled={isVerifying}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isVerifying}
              className={`w-full h-14 rounded-xl text-lg font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                isVerifying 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none transform-none' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify Code
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isSending}
              className={`w-full h-12 rounded-xl text-base font-medium transition-all duration-200 flex items-center justify-center ${
                isSending
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
            >
              {isSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Resend Code
                </>
              )}
            </button>
            
            {error && (
              <div className="text-red-600 text-sm p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            
            {codeExpiry && (
              <div className="text-center p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center justify-center text-amber-700 text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Code expires in:{' '}
                  <span className="font-semibold ml-1">
                    {Math.max(0, Math.floor((codeExpiry - new Date()) / 1000 / 60))} minutes
                  </span>
                </div>
              </div>
            )}
          </form>
        )}
        </div>
        
        {/* Back to Home */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}