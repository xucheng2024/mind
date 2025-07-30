import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import { supabase } from '../lib/supabaseClient';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { debounce } from '../lib/performance';
import LazyImage from '../components/LazyImage';

export default function HomePage() {
  // 防止多次点击 check-in
  const [checkNavLoading, setCheckNavLoading] = React.useState(false);
  const [checkinError, setCheckinError] = React.useState('');
  const [checkinSuccess, setCheckinSuccess] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState(null);
  const navigate = useNavigate();
  // Fixed clinicId
  const clinicId = '5c366433-6dc9-4735-9181-a690201bd0b3';

  // 这样获取 context 数据和方法
  const { registrationData, updateRegistrationData } = useRegistration();

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = () => {
      const storedUserId = localStorage.getItem('user_id');
      const storedUserRowId = localStorage.getItem('user_row_id');
      const storedClinicId = localStorage.getItem('clinic_id') || clinicId;
      
      if (storedUserId && storedUserRowId && storedClinicId) {
        setIsLoggedIn(true);
        // 获取用户信息
        fetchUserInfo(storedUserRowId, storedClinicId);
      } else {
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    };

    checkLoginStatus();
    // 监听 localStorage 变化
    window.addEventListener('storage', checkLoginStatus);
    return () => window.removeEventListener('storage', checkLoginStatus);
  }, [clinicId]);

  // 获取用户信息
  const fetchUserInfo = async (userRowId, clinicId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, clinic_id, full_name, row_id')
        .eq('clinic_id', clinicId)
        .eq('row_id', userRowId)
        .single();
      
      if (!error && data) {
        setUserInfo(data);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // 复用 CheckInPage 的 checkInCore 逻辑
  async function checkInCore(user) {
    const now = new Date();
    const nowISO = now.toISOString();
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    // 查当天该用户在该 clinic 下所有预约
    const { data: todayVisits, error: todayError } = await supabase
      .from('visits')
      .select('*')
      .eq('clinic_id', user.clinic_id)
      .eq('user_row_id', user.row_id)
      .gte('book_time', today.toISOString())
      .lt('book_time', tomorrow.toISOString());
    if (todayError) throw todayError;
    // 一天只能 checked-in 一次
    const alreadyCheckedInToday = (todayVisits || []).find(v => v.status === 'checked-in');
    if (alreadyCheckedInToday) {
      throw new Error('Checked in today.');
    }
    // 有预约直接 checked-in
    const bookedVisit = (todayVisits || []).find(v => v.status === 'booked');
    if (bookedVisit) {
      await supabase.from('visits').update({ status: 'checked-in', visit_time: nowISO }).eq('id', bookedVisit.id);
      return;
    }
    // 其它情况插入 walk-in
    await supabase.from('visits').insert([{
      user_row_id: user.row_id,
      clinic_id: user.clinic_id,
      visit_time: nowISO,
      book_time: nowISO,
      status: 'checked-in',
      is_first: false,
    }]);
  }

  // 自动 check-in 逻辑
  useEffect(() => {
    // 如果登录后有 checkinPending 标记，自动触发 check-in
    // 移除 checkinPending 相关逻辑
    // 1. handleHomeCheckIn 里
    // 2. useEffect 里移除 checkinPending 检查
    // 3. logout 逻辑移除 checkinPending 清理
  }, []);

  React.useEffect(() => {
    if (checkinSuccess) {
      const timer = setTimeout(() => setCheckinSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [checkinSuccess]);

  // 使用防抖的check-in函数
  const handleHomeCheckIn = debounce(async () => {
    setCheckNavLoading(true);
    setCheckinError('');
    const loadingToast = toast.loading('Processing check-in...');
    
    const storedUserRowId = localStorage.getItem('user_row_id');
    const storedClinicId = localStorage.getItem('clinic_id') || clinicId;
    if (!storedUserRowId || !storedClinicId) {
      // 未登录，跳转到 check-in 页面
      toast.dismiss(loadingToast);
      toast.error('Please login first');
      navigate('/check-in?clinic_id=' + clinicId);
      setCheckNavLoading(false);
      return;
    }
    // 查询用户
    const { data, error } = await supabase
      .from('users')
      .select('user_id, clinic_id, full_name, row_id')
      .eq('clinic_id', storedClinicId)
      .eq('row_id', storedUserRowId)
      .single();
    if (error || !data) {
      toast.dismiss(loadingToast);
      toast.error('User not found');
      setCheckinError('User not found');
      setCheckNavLoading(false);
      return;
    }
    try {
      await checkInCore(data);
      toast.dismiss(loadingToast);
      toast.success('Check-in successful!');
      setCheckinSuccess(true);
      setCheckinError('');
    } catch (err) {
      toast.dismiss(loadingToast);
      let errorMsg = 'Unexpected error.';
      if (err.message === 'Checked in today.') {
        errorMsg = 'Already checked in today.';
      } else if (err.message.includes('duplicate key')) {
        errorMsg = 'Already checked in today.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMsg = 'Network error. Please try again.';
      }
      toast.error(errorMsg);
      setCheckinError(errorMsg);
    }
    setCheckNavLoading(false);
  }, 300);

  // 防抖的注册按钮点击
  const handleRegisterClick = debounce(() => {
    toast.success('Redirecting to registration...');
    navigate('/register?clinic_id=' + clinicId);
  }, 200);

  // 防抖的预约按钮点击
  const handleBookingClick = debounce(() => {
    const storedUserId = localStorage.getItem('user_id');
    const storedClinicId = localStorage.getItem('clinic_id') || clinicId;
    if (storedUserId && storedClinicId) {
      toast.success('Redirecting to booking...');
      navigate(`/booking/slots?clinic_id=${storedClinicId}&user_id=${storedUserId}`);
    } else {
      toast('Please login first');
      navigate('/booking?clinic_id=' + clinicId);
    }
  }, 200);

  // 防抖的登出按钮点击
  const handleLogoutClick = debounce(() => {
    toast.success('Logging out...');
    // Clear all localStorage data
    localStorage.clear();
    // Also clear any sessionStorage if used
    sessionStorage.clear();
    window.location.reload();
  }, 200);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-white to-blue-50">
      {/* 品牌区块 */}
      <div className="w-full flex flex-col items-center mb-10 mt-12">
        <div className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">San TCM Clinic</div>
        <div className="text-base text-gray-400 font-medium">Traditional Chinese Medicine & Wellness</div>
        {/* 懒加载诊所图片 */}
        <div className="mt-4 w-24 h-24 rounded-full overflow-hidden shadow-lg">
          <LazyImage 
            src="/clinic-illustration.svg" 
            alt="Clinic" 
            className="w-full h-full object-cover"
            placeholder="/logo.png"
          />
        </div>
      </div>

      {/* 已登录用户显示 */}
      {isLoggedIn && userInfo && (
        <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center">
          <div className="w-full mb-6">
            <div className="text-center mb-4">
              <div className="text-lg font-bold text-gray-800 mb-1">Welcome back!</div>
              <div className="text-sm text-gray-600">{userInfo.full_name}</div>
            </div>
            <div className="space-y-4">
              <button
                className="w-full bg-white border border-blue-300 text-blue-700 rounded-xl py-4 px-6 text-lg font-bold shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
                onClick={handleBookingClick}
              >
                Book Appointment
              </button>
              <button
                className={`w-full bg-white border border-blue-300 text-blue-700 rounded-xl py-4 px-6 text-lg font-bold shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition ${checkNavLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={checkNavLoading}
                onClick={handleHomeCheckIn}
              >
                On-site Check-in
              </button>
              {checkinError && (
                <div className="flex justify-center w-full">
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2 mt-3 text-center text-sm font-medium max-w-xs w-full animate-fade-in">
                    {checkinError}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 未登录用户显示 */}
      {!isLoggedIn && (
        <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center">
          <div className="w-full mb-8">
            <div className="text-lg font-bold text-gray-800 mb-1">First-time Visitor</div>
            <div className="text-xs text-gray-400 mb-4">First visit to clinic now</div>
            <button
              className="w-full bg-white border border-blue-300 text-blue-700 rounded-xl py-4 px-6 text-lg font-bold shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
              onClick={handleRegisterClick}
            >
              Register & Check-in
            </button>
          </div>
          <div className="w-full">
            <div className="text-lg font-bold text-gray-800 mb-1">Returning Visitor</div>
            <div className="text-xs text-gray-400 mb-4">For patients who already have an account.</div>
            <div className="space-y-4">
              <button
                className="w-full bg-white border border-blue-300 text-blue-700 rounded-xl py-4 px-6 text-lg font-bold shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
                onClick={handleBookingClick}
              >
                Book Appointment
              </button>
              <button
                className={`w-full bg-white border border-blue-300 text-blue-700 rounded-xl py-4 px-6 text-lg font-bold shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition ${checkNavLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={checkNavLoading}
                onClick={handleHomeCheckIn}
              >
                On-site Check-in
              </button>
              {checkinError && (
                <div className="flex justify-center w-full">
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2 mt-3 text-center text-sm font-medium max-w-xs w-full animate-fade-in">
                    {checkinError}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Check-in Success Message */}
      {checkinSuccess && (
        <div className="flex justify-center w-full">
          <div className="flex items-center justify-center gap-2 text-green-600 mt-3 text-sm font-medium max-w-xs w-full animate-fade-in">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span>Check-in successful!</span>
          </div>
        </div>
      )}

      {/* 仅在已登录时显示 logout/switch 按钮 */}
      {isLoggedIn && (
        <div className="w-full flex justify-center mt-4 mb-2">
          <button
            className="px-4 py-2 bg-gray-100 text-gray-500 font-medium rounded-lg shadow-sm hover:bg-gray-200 hover:text-gray-700 transition text-sm border border-gray-200 focus:outline-none"
            style={{ minWidth: 0 }}
            onClick={handleLogoutClick}
          >
            Logout / Switch User
          </button>
        </div>
      )}
    </div>
  );
}