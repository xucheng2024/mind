import React, { useState, useEffect } from 'react';
import RegistrationHeader from '../components/RegistrationHeader';
import { supabase } from '../lib/supabaseClient';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';

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
  let userId = searchParams.get('user_id');
  if (!clinicId) clinicId = localStorage.getItem('clinic_id') || '';
  if (!userId) userId = localStorage.getItem('user_id') || '';
  // 自动跳转回booking页
  // 自动check-in逻辑
  useEffect(() => {
    async function autoCheckIn() {
      if (userId && clinicId) {
        setAutoChecking(true);
        setLoading(true);
        // 查询用户
        const { data, error: dbError } = await supabase
          .from('users')
          .select('user_id, clinic_id, full_name')
          .eq('clinic_id', clinicId)
          .eq('user_id', userId)
          .limit(1);
        if (dbError || !data || data.length === 0) {
          setLoading(false);
          setAutoChecking(false);
          return;
        }
        const user = data[0];
        const now = new Date();
        const nowISO = now.toISOString();
        // 只查找今天状态为booked的预约
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        // 检查当前小时段是否已checked-in
        const currentHourStart = new Date(now);
        currentHourStart.setMinutes(0,0,0);
        const currentHourEnd = new Date(currentHourStart);
        currentHourEnd.setHours(currentHourEnd.getHours() + 1);
        const { data: checkedInList, error: checkedInError } = await supabase
          .from('visits')
          .select('*')
          .eq('user_id', user.user_id)
          .eq('clinic_id', user.clinic_id)
          .eq('status', 'checked-in')
          .gte('visit_time', currentHourStart.toISOString())
          .lt('visit_time', currentHourEnd.toISOString());
        if (checkedInList && checkedInList.length > 0) {
          setError('You have already checked in for this time slot.');
          setLoading(false);
          setAutoChecking(false);
          return;
        }
        const { data: visit, error: visitError } = await supabase
          .from('visits')
          .select('*')
          .eq('user_id', user.user_id)
          .eq('clinic_id', user.clinic_id)
          .eq('status', 'booked')
          .gte('book_time', today.toISOString())
          .lt('book_time', tomorrow.toISOString())
          .order('book_time', { ascending: false })
          .limit(1)
          .maybeSingle();
        let result;
        if (visit) {
          try {
            // 再次插入前查一遍当前时段 checked-in
            const { data: checkedAgain } = await supabase
              .from('visits')
              .select('*')
              .eq('user_id', user.user_id)
              .eq('clinic_id', user.clinic_id)
              .eq('status', 'checked-in')
              .gte('visit_time', currentHourStart.toISOString())
              .lt('visit_time', currentHourEnd.toISOString());
            if (checkedAgain && checkedAgain.length > 0) {
              setError('You have already checked in for this time slot.');
              setLoading(false);
              setAutoChecking(false);
              return;
            }
            result = await supabase
              .from('visits')
              .update({ visit_time: nowISO, status: 'checked-in' })
              .eq('id', visit.id);
          } catch (e) {
            setError('You have already checked in for this time slot.');
            setLoading(false);
            setAutoChecking(false);
            return;
          }
        } else {
          try {
            // 再次插入前查一遍当前时段 checked-in
            const { data: checkedAgain } = await supabase
              .from('visits')
              .select('*')
              .eq('user_id', user.user_id)
              .eq('clinic_id', user.clinic_id)
              .eq('status', 'checked-in')
              .gte('visit_time', currentHourStart.toISOString())
              .lt('visit_time', currentHourEnd.toISOString());
            if (checkedAgain && checkedAgain.length > 0) {
              setError('You have already checked in for this time slot.');
              setLoading(false);
              setAutoChecking(false);
              return;
            }
            result = await supabase
              .from('visits')
              .insert([
                {
                  user_id: user.user_id,
                  clinic_id: user.clinic_id,
                  visit_time: nowISO,
                  book_time: nowISO,
                  status: 'checked-in',
                  is_first: false,
                  is_paid: false,
                },
              ]);
            if (result.error && result.error.code === '23505') {
              setError('You have already checked in for this time slot.');
              setLoading(false);
              setAutoChecking(false);
              return;
            }
          } catch (e) {
            setError('You have already checked in for this time slot.');
            setLoading(false);
            setAutoChecking(false);
            return;
          }
        }
        if (!result.error) {
          if (user.user_id) localStorage.setItem('user_id', user.user_id);
          if (user.clinic_id) localStorage.setItem('clinic_id', user.clinic_id);
          setCheckedInTime(now.toLocaleString());
          setSuccess(true);
          setAutoChecking(false);
          // 自动 check-in 完成后，清空 userId/clinicId，防止页面未跳转时手动再提交
          userId = '';
          clinicId = '';
          // 自动跳转到首页，防止重复提交
          setTimeout(() => {
            navigate('/');
          }, 1200);
          return; // 关键：自动check-in后直接return
        }
        setLoading(false);
        setAutoChecking(false);
      }
    }
    // 只有userId和clinicId都有才自动check-in
    if (userId && clinicId) {
      autoCheckIn();
    }
  }, [userId, clinicId]);
// ...existing code...

  const isEmail = (val) => val.includes('@');
  const isPhone = (val) => /^\d+$/.test(val);

  function hash(val) {
    return val ? CryptoJS.SHA256(val.trim().toLowerCase()).toString() : '';
  }

  const AES_KEY = import.meta.env.VITE_AES_KEY;
  if (!AES_KEY) {
    console.warn('AES_KEY未设置，请在环境变量VITE_AES_KEY中配置加密密钥！');
  }
  function encrypt(val) {
    return val ? CryptoJS.AES.encrypt(val.toString(), AES_KEY).toString() : '';
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
    console.log('[CheckIn] input:', input, 'clinicId:', clinicId);
    if (!input.trim()) {
      setError('Please enter your email or phone number.');
      console.log('[CheckIn][Error] Empty input');
      return;
    }
    if (!clinicId) {
      setError('Clinic ID is missing.');
      console.log('[CheckIn][Error] Missing clinicId');
      return;
    }
    setLoading(true);
    let userQuery;
    if (isEmail(input)) {
      const emailHash = hash(input.trim().toLowerCase());
      console.log('[CheckIn] Detected email hash:', emailHash);
      userQuery = supabase
        .from('users')
        .select('user_id, clinic_id, full_name')
        .eq('clinic_id', clinicId)
        .eq('email_hash', emailHash)
        .limit(1);
    } else if (isPhone(input)) {
      const phoneHash = hash(input);
      console.log('[CheckIn] Detected phone hash:', phoneHash);
      userQuery = supabase
        .from('users')
        .select('user_id, clinic_id, full_name')
        .eq('clinic_id', clinicId)
        .eq('phone_hash', phoneHash)
        .limit(1);
    } else {
      setError('Please enter a valid email (must contain @) or a phone number (digits only).');
      setLoading(false);
      console.log('[CheckIn][Error] Invalid input format:', input);
      return;
    }
    const { data, error: dbError } = await userQuery;
    console.log('[CheckIn] 查询结果:', { data, dbError });

    if (dbError || !data || data.length === 0) {
      setError('No user found. Please check your input. If this is your first visit, please register first.');
      setLoading(false);
      return;
    }

    const user = data[0];
    const now = new Date();
    const nowISO = now.toISOString();
    // 检查当前小时段是否已checked-in
    const currentHourStart = new Date(now);
    currentHourStart.setMinutes(0,0,0);
    const currentHourEnd = new Date(currentHourStart);
    currentHourEnd.setHours(currentHourEnd.getHours() + 1);
    const { data: checkedInList, error: checkedInError } = await supabase
      .from('visits')
      .select('*')
      .eq('user_id', user.user_id)
      .eq('clinic_id', user.clinic_id)
      .eq('status', 'checked-in')
      .gte('visit_time', currentHourStart.toISOString())
      .lt('visit_time', currentHourEnd.toISOString());
    if (checkedInList && checkedInList.length > 0) {
      setError('You have already checked in for this time slot.');
      setLoading(false);
      return;
    }
    // 不再需要当天已 done 的判断，只查未完成的预约/到访记录
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .select('*')
      .eq('user_id', user.user_id)
      .eq('clinic_id', user.clinic_id)
      .neq('status', 'checked-in')
      .order('book_time', { ascending: false })
      .limit(1)
      .maybeSingle();
    console.log('[CheckIn] visitQuery result:', { visit, visitError });
    if (visitError) {
      setError('Failed to check visit record. Please try again.');
      setLoading(false);
      console.log('[CheckIn][Error] visitError:', visitError);
      return;
    }
    let result;
    if (visit) {
      // 已有预约/到访，更新visittime和status
      console.log('[CheckIn] Updating visit:', visit.id);
      result = await supabase
        .from('visits')
        .update({ visit_time: nowISO, status: 'checked-in' })
        .eq('id', visit.id);
      console.log('[CheckIn] Update visit result:', result);
    } else {
      // 没有预约，插入新记录
      console.log('[CheckIn] Inserting new visit record');
      result = await supabase
        .from('visits')
        .insert([
          {
            user_id: user.user_id,
            clinic_id: user.clinic_id,
            visit_time: nowISO,
            book_time: nowISO,
            status: 'checked-in',
            is_first: false,
            is_paid: false,
          },
        ]);
      console.log('[CheckIn] Insert visit result:', result);
    }
    if (result.error) {
      setError('Check-in failed. Please try again.');
      setLoading(false);
      console.log('[CheckIn][Error] visit update/insert error:', result.error);
      return;
    }
    // 保存user_id和clinic_id到localStorage，实现免登录体验
    if (user.user_id) localStorage.setItem('user_id', user.user_id);
    if (user.clinic_id) localStorage.setItem('clinic_id', user.clinic_id);
    setCheckedInTime(now.toLocaleString());
    setSuccess(true);
    setLoading(false);
    console.log('[CheckIn] Check-in success at:', now.toLocaleString());
  };

  // 如果已存在 userId 和 clinicId，且未出错或未手动退出，则不显示表单，直接走自动 check-in 流程（UI 只显示 loading 或结果）
  const shouldShowForm = !(userId && clinicId);
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
              <div className="text-red-600 text-sm p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 animate-shake">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
          </form>
        ) : error ? (
          // 自动 check-in 时如果有 error，显示错误信息和返回首页按钮
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-red-600 text-lg font-semibold mb-4">{error}</div>
            <button
              className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 transition"
              onClick={() => navigate('/')}
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