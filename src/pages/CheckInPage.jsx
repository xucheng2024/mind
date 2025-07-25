import React, { useState, useEffect } from 'react';
import RegistrationHeader from '../components/RegistrationHeader';
import { supabase } from '../lib/supabaseClient';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { hash, encrypt, isPhone, isEmail } from '../lib/utils';

export default function CheckInPage() {
  // 防止自动 check-in 和手动 check-in 并发插入两条
  const [autoChecking, setAutoChecking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkedInTime, setCheckedInTime] = useState(null);
  const [input, setInput] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // 优先用URL参数，否则用localStorage
  let clinicId = searchParams.get('clinic_id');
  let userRowId = searchParams.get('user_row_id');
  if (!clinicId) clinicId = localStorage.getItem('clinic_id') || '';
  if (!userRowId) userRowId = localStorage.getItem('user_row_id') || '';
  // 自动跳转回booking页
  // 自动check-in逻辑
  async function checkInCore(user) {
    const now = new Date();
    const nowISO = now.toISOString();
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const currentHourStart = new Date(now); currentHourStart.setMinutes(0,0,0);
    const currentHourEnd = new Date(currentHourStart); currentHourEnd.setHours(currentHourEnd.getHours() + 1);
    console.log('[checkInCore] user:', user);
    // 查当天该用户在该 clinic 下所有预约
    const { data: todayVisits, error: todayError } = await supabase
      .from('visits')
      .select('*')
      .eq('clinic_id', user.clinic_id)
      .eq('user_row_id', user.row_id)
      .gte('book_time', today.toISOString())
      .lt('book_time', tomorrow.toISOString());
    console.log('[checkInCore] todayVisits:', todayVisits, todayError);
    if (todayError) throw todayError;
    // 1. 一天只能 checked-in 一次（无论预约还是 walk-in）
    const alreadyCheckedInToday = (todayVisits || []).find(v => v.status === 'checked-in');
    if (alreadyCheckedInToday) {
      throw new Error('Already checked in today.');
    }
    // 2. 查当天该用户有无 status=booked 的记录（不再限制时间窗口）
    const bookedVisit = (todayVisits || []).find(v => v.status === 'booked');
    if (bookedVisit) {
      await supabase.from('visits').update({ status: 'checked-in', visit_time: nowISO }).eq('id', bookedVisit.id);
      return;
    }
    // 3. 其它情况，插入 walk-in（一天只能一次，已在前面判断）
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
        // 查询用户
        const { data, error: dbError } = await supabase
          .from('users')
          .select('user_id, clinic_id, full_name, row_id')
          .eq('clinic_id', clinicId)
          .eq('row_id', userRowId) // 这里用 row_id
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
          // 自动跳转到首页，防止重复提交
          setTimeout(() => {
            navigate('/');
          }, 1200);
          return; // 关键：自动check-in后直接return
        } catch (err) {
          console.log('[autoCheckIn] error:', err);
          if (err.message.includes('network')) {
            setFriendlyError(setError, 'Network error.');
          } else if (err.message.includes('already checked in today')) {
            setFriendlyError(setError, 'Checked in today.');
          } else if (err.message.includes('finished your consultation')) {
            setFriendlyError(setError, 'Consultation finished.');
          } else {
            setFriendlyError(setError, 'Unexpected error.');
          }
        }
        setLoading(false); setAutoChecking(false);
      }
    }
    // 只有userId和clinicId都有才自动check-in
    if (userRowId && clinicId) {
      autoCheckIn();
    }
  }, [userRowId, clinicId]);

  const AES_KEY = import.meta.env.VITE_AES_KEY;
  if (!AES_KEY) {
    console.warn('AES_KEY未设置，请在环境变量VITE_AES_KEY中配置加密密钥！');
  }

  const handleSubmit = async (e) => {
    // 如果正在自动 check-in，禁止手动提交
    if (autoChecking) {
      return;
    }
    e.preventDefault();
    setError('');
    setSuccess(false);
    setCheckedInTime(null);
    console.log('[handleSubmit] input:', input, 'clinicId:', clinicId);
    if (!input.trim()) {
      setFriendlyError(setError, 'Please enter your email or phone number.');
      console.log('[CheckIn][Error] Empty input');
      return;
    }
    if (!clinicId) {
      setFriendlyError(setError, 'Clinic ID is missing.');
      console.log('[CheckIn][Error] Missing clinicId');
      return;
    }
    setLoading(true);
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
      setFriendlyError(setError, 'Please enter a valid email (must contain @) or a phone number (digits only).');
      setLoading(false);
      console.log('[CheckIn][Error] Invalid input format:', input);
      return;
    }
    const { data, error: dbError } = await userQuery;
    console.log('[handleSubmit] userQuery result:', { data, dbError });

    if (dbError || !data || data.length === 0) {
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
    } catch (err) {
      console.log('[handleSubmit] error:', err);
      if (err.message.includes('network')) {
        setFriendlyError(setError, 'Network error.');
      } else if (err.message.includes('already checked in today')) {
        setFriendlyError(setError, 'Checked in today.');
      } else if (err.message.includes('finished your consultation')) {
        setFriendlyError(setError, 'Consultation finished.');
      } else {
        setFriendlyError(setError, 'Unexpected error.');
      }
    }
    setLoading(false);
  };

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
                Back to Home
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