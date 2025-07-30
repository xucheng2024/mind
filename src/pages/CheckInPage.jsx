import React, { useState, useEffect } from 'react';
import RegistrationHeader from '../components/RegistrationHeader';
import { supabase } from '../lib/supabaseClient';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { hash, encrypt, isPhone, isEmail } from '../lib/utils';
import { getAESKey } from '../lib/config';
import toast from 'react-hot-toast';
import { debounce } from '../lib/performance';

export default function CheckInPage() {
  // Prevent concurrent auto check-in and manual check-in
  const [autoChecking, setAutoChecking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkedInTime, setCheckedInTime] = useState(null);
  const [input, setInput] = useState('');
  const [businessHours, setBusinessHours] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Use URL params first, then localStorage
  let clinicId = searchParams.get('clinic_id');
  let userRowId = searchParams.get('user_row_id');
  if (!clinicId) clinicId = localStorage.getItem('clinic_id') || '';
  if (!userRowId) userRowId = localStorage.getItem('user_row_id') || '';
  
  // Default business hours format when no database data
  const defaultBusinessHours = {
    "friday": {"open": "09:00", "close": "18:00", "closed": false},
    "monday": {"open": "09:00", "close": "18:00", "closed": true},
    "sunday": {"open": "09:00", "close": "18:00", "closed": true},
    "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
    "saturday": {"open": "09:00", "close": "18:00", "closed": false},
    "thursday": {"open": "09:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "18:00", "closed": false}
  };
  
  // Fetch clinic business hours
  useEffect(() => {
    console.log('[CheckInPage] Fetching business hours for clinicId:', clinicId);
    if (!clinicId) {
      console.log('[CheckInPage] No clinicId, skipping business hours fetch');
      return;
    }
    supabase
      .from('clinics')
      .select('business_hours')
      .eq('id', clinicId)
      .single()
      .then(({ data, error }) => {
        console.log('[CheckInPage] Business hours query result:', { data, error });
        if (!error && data && data.business_hours) {
          console.log('[CheckInPage] Setting business hours:', data.business_hours);
          setBusinessHours(data.business_hours);
        } else {
          console.log('[CheckInPage] No business hours data found or error:', error);
          setBusinessHours(defaultBusinessHours);
        }
      });
  }, [clinicId]);

  // Check if current time is within business hours
  function isWithinBusinessHours() {
    console.log('[isWithinBusinessHours] businessHours:', businessHours);
    
    if (!businessHours) {
      console.log('[isWithinBusinessHours] No business hours data, using default');
      return false;
    }
    
    const now = new Date();
    const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const weekday = weekdays[now.getDay()];
    const dayConfig = businessHours[weekday];
    
    console.log('[isWithinBusinessHours] Current day:', weekday, 'Day config:', dayConfig);
    
    if (!dayConfig || dayConfig.closed) {
      console.log('[isWithinBusinessHours] Day is closed or no config');
      return false;
    }
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;
    
    const [startH, startM = 0] = dayConfig.open.split(':').map(Number);
    const [endH, endM = 0] = dayConfig.close.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    console.log('[isWithinBusinessHours] Current time:', `${currentHour}:${currentMinute}`, `(${currentMinutes} minutes)`);
    console.log('[isWithinBusinessHours] Business hours:', `${dayConfig.open}-${dayConfig.close}`, `(${startMinutes}-${endMinutes} minutes)`);
    
    const isWithin = currentMinutes >= startMinutes && currentMinutes < endMinutes;
    console.log('[isWithinBusinessHours] Is within business hours:', isWithin);
    
    return isWithin;
  }

  // Early validation - check business hours immediately
  useEffect(() => {
    // Check business hours every minute to ensure real-time validation
    const checkBusinessHours = () => {
      if (!isWithinBusinessHours()) {
        setError('Clinic is currently closed. Please check-in during business hours.');
        setSuccess(false);
        setCheckedInTime(null);
      } else {
        // Clear error if business hours are now valid
        if (error && error.includes('currently closed')) {
          setError('');
        }
      }
    };
    
    // Check immediately
    checkBusinessHours();
    
    // Check every minute
    const interval = setInterval(checkBusinessHours, 60000);
    
    return () => clearInterval(interval);
  }, [businessHours, error]);

  // Auto redirect to booking page
  // Auto check-in logic
  async function checkInCore(user) {
    const now = new Date();
    const nowISO = now.toISOString();
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const currentHourStart = new Date(now); currentHourStart.setMinutes(0,0,0);
    const currentHourEnd = new Date(currentHourStart); currentHourEnd.setHours(currentHourEnd.getHours() + 1);
    console.log('[checkInCore] user:', user);
    console.log('[checkInCore] Current time:', now.toLocaleString());
    

    
    // Check if within business hours
    console.log('[checkInCore] Checking business hours...');
    const withinBusinessHours = isWithinBusinessHours();
    console.log('[checkInCore] Within business hours:', withinBusinessHours);
    
    if (!withinBusinessHours) {
      console.log('[checkInCore] Check-in denied - outside business hours');
      throw new Error('Clinic is currently closed. Please check-in during business hours.');
    }
    
    console.log('[checkInCore] Business hours validation passed, proceeding with check-in');
    
    // Query all appointments for this user at this clinic today
    const { data: todayVisits, error: todayError } = await supabase
      .from('visits')
      .select('*')
      .eq('clinic_id', user.clinic_id)
      .eq('user_row_id', user.row_id)
      .gte('book_time', today.toISOString())
      .lt('book_time', tomorrow.toISOString());
    console.log('[checkInCore] todayVisits:', todayVisits, todayError);
    if (todayError) throw todayError;
    // 1. Can only check-in once per day (regardless of appointment or walk-in)
    const alreadyCheckedInToday = (todayVisits || []).find(v => v.status === 'checked-in');
    if (alreadyCheckedInToday) {
      throw new Error('Already checked in today.');
    }
    // 2. Check if user has status=booked record today (no longer restrict time window)
    const bookedVisit = (todayVisits || []).find(v => v.status === 'booked');
    if (bookedVisit) {
      await supabase.from('visits').update({ status: 'checked-in', visit_time: nowISO }).eq('id', bookedVisit.id);
      return;
    }
    // 3. Other cases, insert walk-in (only once per day, already checked above)
    await supabase.from('visits').insert([{
      user_row_id: user.row_id,
      clinic_id: user.clinic_id,
      visit_time: nowISO,
      book_time: nowISO,
      status: 'checked-in',
      is_first: false,
    }]);
  }

  function setFriendlyError(setError, message) {
    setError(message);
  }

  useEffect(() => {
    async function autoCheckIn() {
      if (userRowId && clinicId) {
        setAutoChecking(true); setLoading(true);
        console.log('[autoCheckIn] start', { userRowId, clinicId });
        // Query user
        const { data, error: dbError } = await supabase
          .from('users')
          .select('user_id, clinic_id, full_name, row_id')
          .eq('clinic_id', clinicId)
          .eq('row_id', userRowId) // Use row_id here
          .limit(1);
        console.log('[autoCheckIn] userQuery result:', { data, dbError });
        if (dbError || !data || data.length === 0) {
          setLoading(false); setAutoChecking(false); return;
        }
        const user = data[0];
        try {
          await checkInCore(user);
          if (user.user_id) localStorage.setItem('user_id', user.user_id);
          if (user.row_id) localStorage.setItem('user_row_id', user.row_id);
          if (user.clinic_id) localStorage.setItem('clinic_id', user.clinic_id);
          setCheckedInTime(new Date().toLocaleString());
          setSuccess(true);
          userRowId = ''; clinicId = '';
          // Auto redirect to home page to prevent duplicate submission
          setTimeout(() => {
            navigate('/');
          }, 1200);
          return; // Key: return directly after auto check-in
        } catch (err) {
          console.log('[autoCheckIn] error:', err);
          if (err.message.includes('network')) {
            setFriendlyError(setError, 'Network error.');
          } else if (err.message.includes('already checked in today')) {
            setFriendlyError(setError, 'Checked in today.');
          } else if (err.message.includes('finished your consultation')) {
            setFriendlyError(setError, 'Consultation finished.');
          } else if (err.message.includes('currently closed')) {
            setFriendlyError(setError, 'Clinic is currently closed. Please check-in during business hours.');
          } else {
            setFriendlyError(setError, 'Unexpected error.');
          }
        }
        setLoading(false); setAutoChecking(false);
      }
    }
    // Only auto check-in if both userId and clinicId are available
    if (userRowId && clinicId) {
      autoCheckIn();
    }
  }, [userRowId, clinicId]);

  const AES_KEY = getAESKey();

  // 使用防抖的提交函数
  const handleSubmit = debounce(async (e) => {
    // If auto check-in is in progress, prevent manual submission
    if (autoChecking) {
      return;
    }
    e.preventDefault();
    setError('');
    setSuccess(false);
    setCheckedInTime(null);
    console.log('[handleSubmit] input:', input, 'clinicId:', clinicId);
    
    if (!input.trim()) {
      toast.error('Please enter your email or phone number.');
      setFriendlyError(setError, 'Please enter your email or phone number.');
      console.log('[CheckIn][Error] Empty input');
      return;
    }
    if (!clinicId) {
      toast.error('Clinic ID is missing.');
      setFriendlyError(setError, 'Clinic ID is missing.');
      console.log('[CheckIn][Error] Missing clinicId');
      return;
    }
    
    setLoading(true);
    const loadingToast = toast.loading('Processing check-in...');
    
    let userQuery;
    if (isEmail(input)) {
      const emailHash = hash(input.trim().toLowerCase());
      console.log('[handleSubmit] Detected email hash:', emailHash);
      userQuery = supabase
        .from('users')
        .select('user_id, clinic_id, full_name, row_id')
        .eq('clinic_id', clinicId)
        .eq('email_hash', emailHash)
        .limit(1);
    } else if (isPhone(input)) {
      const phoneHash = hash(input);
      console.log('[handleSubmit] Detected phone hash:', phoneHash);
      userQuery = supabase
        .from('users')
        .select('user_id, clinic_id, full_name, row_id')
        .eq('clinic_id', clinicId)
        .eq('phone_hash', phoneHash)
        .limit(1);
    } else {
      toast.dismiss(loadingToast);
      toast.error('Please enter a valid email or phone number.');
      setFriendlyError(setError, 'Please enter a valid email (must contain @) or a phone number (digits only).');
      setLoading(false);
      console.log('[CheckIn][Error] Invalid input format:', input);
      return;
    }
    
    const { data, error: dbError } = await userQuery;
    console.log('[handleSubmit] userQuery result:', { data, dbError });

    if (dbError || !data || data.length === 0) {
      toast.dismiss(loadingToast);
      toast.error('No user found. Please check your input.');
      setFriendlyError(setError, 'No user found. Please check your input. If this is your first visit, please register first.');
      setLoading(false);
      return;
    }

    const user = data[0];
    try {
      await checkInCore(user);
      if (user.user_id) localStorage.setItem('user_id', user.user_id);
      if (user.row_id) localStorage.setItem('user_row_id', user.row_id);
      if (user.clinic_id) localStorage.setItem('clinic_id', user.clinic_id);
      setCheckedInTime(new Date().toLocaleString());
      setSuccess(true);
      toast.dismiss(loadingToast);
    } catch (err) {
      console.log('[handleSubmit] error:', err);
      toast.dismiss(loadingToast);
      let errorMsg = 'Unexpected error.';
      if (err.message.includes('network')) {
        errorMsg = 'Network error.';
      } else if (err.message.includes('already checked in today')) {
        errorMsg = 'You have already checked in today.';
      } else if (err.message.includes('finished your consultation')) {
        errorMsg = 'Consultation finished.';
      } else if (err.message.includes('currently closed')) {
        errorMsg = 'Clinic is currently closed. Please check-in during business hours.';
      }
      toast.error(errorMsg);
      setFriendlyError(setError, errorMsg);
    }
    setLoading(false);
  }, 300);

  // 如果已存在 userId 和 clinicId，且未出错或未手动退出，则不显示表单，直接走自动 check-in 流程（UI 只显示 loading 或结果）
  const shouldShowForm = !(userRowId && clinicId);
  // 新增：自动 check-in 时如果有 error，显示 error 信息和返回首页按钮
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in">
        <RegistrationHeader title="Check-in an Appointment" />
        {success ? (
          <div className="text-center py-8">
            <div className="text-blue-600 text-2xl font-bold mb-2">Check-in Successful!</div>
            <div className="text-gray-700 mb-4">Welcome, you have checked in at<br /><span className="font-mono text-lg">{checkedInTime}</span></div>
          </div>
        ) : shouldShowForm ? (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email or Phone Number</label>
              <input
                className="w-full border border-blue-300 rounded-xl p-4 text-base focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Enter your email or phone number"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-14 rounded-xl text-lg font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-600 active:border-blue-600 ${
                loading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none transform-none'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border border-blue-600'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking in...
                </>
              ) : (
                'Check-in'
              )}
            </button>
            {error && (
              <div className="flex justify-center w-full">
                <div className="text-red-500 text-xs mt-1 text-center max-w-xs w-full animate-fade-in">
                  {error}
                </div>
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
        ) : error ? (
          // 自动 check-in 时如果有 error，显示错误信息和返回首页按钮
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-red-600 text-lg font-semibold mb-4">{error}</div>
            <button
              className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 transition"
              onClick={() => {
                localStorage.removeItem('user_id');
                localStorage.removeItem('user_row_id');
                localStorage.removeItem('clinic_id');
                window.location.reload();
              }}
            >
              Return to Home
            </button>
          </div>
        ) : (
          // 自动 check-in 时显示 loading
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="text-blue-500 text-lg font-semibold">Auto check-in...</div>
          </div>
        )}
      </div>
    </div>
  );
} 