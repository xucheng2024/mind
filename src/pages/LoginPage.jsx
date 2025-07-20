import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useRegistration } from '../../context/RegistrationContext';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function LoginPage() {
  const { registrationData, updateRegistrationData } = useRegistration();
  const contextEmail = registrationData.email || '';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (contextEmail) setEmail(contextEmail);
  }, [contextEmail]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        redirectTo: `${window.location.origin}/profile`, // 登录成功后跳转的页面
      },
    });

    if (otpError) {
      console.error('Supabase error:', otpError);
      setError('Failed to send login email. Please try again later.');
      return;
    }

    // 更新 RegistrationContext 的 email
    updateRegistrationData({ email });

    setSuccessMessage('Login link has been sent to your email.');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = e.target.code.value.trim();
    if (!code) {
      setError('Please enter the verification code.');
      return;
    }
    if (attempts >= 5) {
      setError('Too many failed attempts. Please try again later.');
      return;
    }
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (verifyError) {
      setAttempts(a => a + 1);
      setError('Invalid code. Please check your email and try again.');
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
        <h2 className="text-xl font-bold mb-6">Email Login</h2>
        <form onSubmit={handleLogin}>
          <input
            className="w-full border border-gray-300 rounded-md p-3 text-base mb-2 focus:outline-none focus:border-blue-500"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Send Login Link
          </button>
          {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
          {successMessage && <div className="text-green-500 text-xs mt-2">{successMessage}</div>}
        </form>
      </div>
    </div>
  );
}