import React, { useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useRegistration } from '../../context/RegistrationContext';

export default function BookPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clinicId = searchParams.get('clinic_id') || '';
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState('');
  const { registrationData, updateRegistrationData } = useRegistration();

  const isEmail = (val) => /^\S+@\S+\.\S+$/.test(val);
  const isPhone = (val) => /^\d+$/.test(val);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!input.trim()) {
      setError('Please enter your phone number or email.');
      return;
    }
    let query;
    if (isEmail(input)) {
      query = supabase
        .from('users')
        .select('user_id')
        .eq('clinic_id', clinicId)
        .eq('email', input)
        .single();
    } else if (isPhone(input)) {
      query = supabase
        .from('users')
        .select('user_id')
        .eq('clinic_id', clinicId)
        .eq('phone', input)
        .single();
    } else {
      setError('Please enter a valid phone number or email.');
      return;
    }

    const { data, error: dbError } = await query;

    if (dbError || !data) {
      setError('Invalid phone number or email. Please check and try again.');
    } else {
      // Login success, insert visit record
      const visitPayload = {
        user_id: data.user_id,
        clinic_id: clinicId,
        is_first: false,
        is_paid: false,
        visit_time: new Date().toISOString(),
        book_time: new Date().toISOString(),
      };
      const { error: visitError } = await supabase.from('visits').insert([visitPayload]);
      if (visitError) {
        setError('Failed to book visit. Please try again later.');
      } else {
        setUserId(data.user_id);
        setSuccess(true);
      }
    }
  };

  const handleProfileClick = () => {
    if (isEmail(input)) {
      updateRegistrationData({ email: input }); // 存到 context
    }
    navigate('/profile');
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8 flex flex-col items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="90"
            height="90"
            viewBox="0 0 24 24"
            fill="white"
            className="bg-green-500 rounded-full p-4 shadow mb-6"
          >
            <path d="M20.285 6.708l-11.285 11.285-5.285-5.285 1.414-1.414 3.871 3.871 9.871-9.871z" />
          </svg>
          <h2 className="text-blue-600 text-2xl font-bold mb-8 text-center">Booking Successful!</h2>
          <div className="flex flex-col gap-3 w-full mt-2">
            <button
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow"
              onClick={handleProfileClick}
            >
              View My Profile Details
            </button>
            <button
              className="w-full bg-white text-blue-700 py-3 rounded-lg text-lg font-semibold border border-blue-600 hover:bg-blue-50 transition shadow"
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
        <h2 className="text-xl font-bold mb-6">San TCM Booking</h2>
        <form onSubmit={handleLogin}>
          <label className="block text-left font-semibold mb-2">
            Phone number or Email <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-md p-3 text-base mb-2 focus:outline-none focus:border-blue-500"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Please enter your phone number or email"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Submit
          </button>
          {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
        </form>
      </div>
    </div>
  );
}