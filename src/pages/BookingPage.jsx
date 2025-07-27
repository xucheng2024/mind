import React, { useState, useEffect } from 'react';
import RegistrationHeader from '../components/RegistrationHeader';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sha256Hex, isPhone, isEmail } from '../lib/utils';

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const clinicId = searchParams.get('clinic_id') || '';
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check for saved login info
  useEffect(() => {
    const savedClinicId = localStorage.getItem('clinic_id');
    const savedUserRowId = localStorage.getItem('user_row_id');
    
    // Use URL clinic_id if available, otherwise use saved
    const currentClinicId = clinicId || savedClinicId;
    
    if (currentClinicId && savedUserRowId) {
      // Validate if user is still valid
      const validateAndRedirect = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('row_id')
            .eq('clinic_id', currentClinicId)
            .eq('row_id', savedUserRowId)
            .single();
          
          if (!error && data) {
            // User valid, redirect to calendar
            navigate(`/booking/slots?clinic_id=${currentClinicId}&user_row_id=${savedUserRowId}`);
          } else {
            // User invalid, clear saved info
            localStorage.removeItem('clinic_id');
            localStorage.removeItem('user_row_id');
            localStorage.removeItem('user_id');
          }
        } catch (err) {
          // Validation failed, clear saved info
          localStorage.removeItem('clinic_id');
          localStorage.removeItem('user_row_id');
          localStorage.removeItem('user_id');
        }
      };
      
      validateAndRedirect();
    }
  }, [clinicId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!input.trim()) {
      setError('Please enter your email or phone number.');
      return;
    }
    if (!clinicId) {
      setError('Clinic ID is missing.');
      return;
    }
    setLoading(true);
    let query;
    let hashValue;
    try {
      if (isPhone(input)) {
        hashValue = await sha256Hex(input);
        query = supabase
          .from('users')
          .select('user_id, row_id')
          .eq('clinic_id', clinicId)
          .eq('phone_hash', hashValue)
          .single();
      } else if (isEmail(input)) {
        hashValue = await sha256Hex(input);
        query = supabase
          .from('users')
          .select('user_id, row_id')
          .eq('clinic_id', clinicId)
          .eq('email_hash', hashValue)
          .single();
      } else {
        setError('Please enter a valid phone number (digits only) or a valid email address (must contain @).');
        setLoading(false);
        return;
      }
      const { data, error: dbError } = await query;
      setLoading(false);
      if (dbError || !data) {
        setError('No user found with this email or phone number in this clinic.');
        return;
      }
      // Save user_id and clinic_id to localStorage for free login
      if (data.user_id) localStorage.setItem('user_id', data.user_id);
      if (data.row_id) localStorage.setItem('user_row_id', data.row_id);
      if (clinicId) localStorage.setItem('clinic_id', clinicId);
      navigate(`/booking/slots?clinic_id=${clinicId}&user_id=${data.user_id}&user_row_id=${data.row_id}`);
    } catch (err) {
      setLoading(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };

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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email or Phone Number</label>
            <input
              className="w-full border border-gray-300 rounded-xl p-4 text-base focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter your email or phone number"
              autoFocus
              type="text"
              aria-label="Email or Phone Number"
              maxLength={100}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full h-14 rounded-xl text-lg font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 ${loading ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none transform-none' : ''}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Checking...
              </span>
            ) : 'Next'}
          </button>
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
              onClick={() => navigate('/')}
            >
              Back Home
            </button>
          </div>
        </form> 
      </div>
    </div>
  );
} 