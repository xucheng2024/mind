import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import { supabase } from '../lib/supabaseClient';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { debounce } from '../lib/performance';
import LazyImage from '../components/LazyImage';
import { getClinicId, CLINIC_CONFIG } from '../config/clinic';
import Button from '../components/Button';
import { decrypt } from '../lib/utils';
import { getAESKey } from '../lib/config';
import cacheManager from '../lib/cache';


export default function HomePage() {
  // 防止多次点击 check-in
  const [checkNavLoading, setCheckNavLoading] = React.useState(false);
  const [checkinError, setCheckinError] = React.useState('');
  const [checkinSuccess, setCheckinSuccess] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState(null);
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Get clinic_id using the helper function
  const clinicId = getClinicId(searchParams, localStorage);

  // 这样获取 context 数据和方法
  const { registrationData, updateRegistrationData } = useRegistration();

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = () => {
      // 使用缓存管理器检查登录状态
      if (cacheManager.isLoggedIn()) {
        const loginInfo = cacheManager.getLoginInfo();
        setIsLoggedIn(true);
        // 获取用户信息
        fetchUserInfo(loginInfo.userRowId, loginInfo.clinicId);
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
        // 尝试解密姓名
        const AES_KEY = getAESKey();
        let decryptedName = data.full_name;
        
        if (AES_KEY && data.full_name && data.full_name.length > 20) {
          try {
            decryptedName = decrypt(data.full_name, AES_KEY);
            console.log('✅ Name decrypted successfully');
          } catch (error) {
            console.log('⚠️ Name decryption failed, using original');
          }
        }
        
        setUserInfo({
          ...data,
          full_name: decryptedName
        });
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
    console.log('🏠 HomePage: Clicking Register button');
    navigate('/register?clinic_id=' + clinicId);
  }, 200);

  // 防抖的预约按钮点击
  const handleBookingClick = debounce(() => {
    const storedUserId = localStorage.getItem('user_id');
    const storedClinicId = localStorage.getItem('clinic_id') || clinicId;
    if (storedUserId && storedClinicId) {
      navigate(`/booking/slots?clinic_id=${storedClinicId}&user_id=${storedUserId}`);
    } else {
      navigate('/booking?clinic_id=' + clinicId);
    }
  }, 200);

  // 防抖的登出按钮点击
  const handleLogoutClick = debounce(() => {
    console.log('🚪 Logging out...');
    setLogoutLoading(true);
    // 使用缓存管理器清除登录信息
    cacheManager.clearLoginInfo();
    // Update state immediately instead of reloading
    setIsLoggedIn(false);
    setUserInfo(null);
    setLogoutLoading(false);
  }, 100);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-white to-blue-50">
      {/* 品牌区块 */}
      <div className="w-full flex flex-col items-center mb-10 mt-12">
        <div className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">San TCM Clinic</div>
        <div className="text-base text-gray-400 font-medium">Traditional Chinese Medicine & Wellness</div>
        <div className="mt-4 w-full max-w-md px-4">
          <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-50 to-white">
            <LazyImage 
              src="/clinic-illustration.svg" 
              alt="Clinic" 
              className="w-full h-full object-contain object-center"
              placeholder="/logo.png"
            />
          </div>
        </div>
      </div>

      {/* 已登录用户显示 */}
      {isLoggedIn && userInfo && (
        <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center">
          <div className="w-full mb-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg font-bold text-gray-800">Welcome back,</span>
                <span className="text-lg font-bold text-blue-600">{userInfo.full_name}</span>
              </div>
            </div>
            <div className="space-y-4">
              <Button
                variant="primary"
                onClick={handleBookingClick}
              >
                Book Appointment
              </Button>
              <Button
                variant="secondary"
                onClick={handleHomeCheckIn}
                loading={checkNavLoading}
                disabled={checkNavLoading}
              >
                On-site Check-in
              </Button>
              <Button
                variant="secondary"
                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 text-sm font-normal"
                onClick={handleLogoutClick}
                loading={logoutLoading}
                disabled={logoutLoading}
              >
                Logout
              </Button>
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
            <Button
              variant="primary"
              onClick={handleRegisterClick}
            >
              Register & Check-in
            </Button>
          </div>
          <div className="w-full">
            <div className="text-lg font-bold text-gray-800 mb-1">Returning Visitor</div>
            <div className="text-xs text-gray-400 mb-4">For patients who already have an account.</div>
            <div className="space-y-4">
              <Button
                variant="primary"
                onClick={handleBookingClick}
              >
                Book Appointment
              </Button>
              <Button
                variant="secondary"
                onClick={handleHomeCheckIn}
                loading={checkNavLoading}
                disabled={checkNavLoading}
              >
                On-site Check-in
              </Button>
              <Button
                variant="secondary"
                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 text-sm font-normal"
                onClick={handleLogoutClick}
              >
                Logout
              </Button>
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
    </div>
  );
}