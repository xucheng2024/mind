import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import { supabase } from '../lib/supabaseClient';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { debounce } from '../lib/performance';
import LazyImage from '../components/LazyImage';
import { getClinicId, CLINIC_CONFIG } from '../config/clinic';
import { decrypt } from '../lib/utils';
import { getAESKey } from '../lib/config';
import cacheManager from '../lib/cache';
import { 
  EnhancedButton, 
  LoadingSpinner, 
  useHapticFeedback,
  Confetti,
  SkeletonLoader 
} from '../components';


export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState(null);
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const { trigger: hapticTrigger } = useHapticFeedback();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Get clinic_id using the helper function
  const clinicId = getClinicId(searchParams, localStorage);

  // 这样获取 context 数据和方法
  const { registrationData, updateRegistrationData } = useRegistration();

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = () => {
      console.log('🔍 HomePage - Checking login status...');
      // 使用缓存管理器检查登录状态
      if (cacheManager.isLoggedIn()) {
        const loginInfo = cacheManager.getLoginInfo();
        console.log('✅ HomePage - User logged in:', loginInfo);
        setIsLoggedIn(true);
        // 获取用户信息
        fetchUserInfo(loginInfo.userRowId, loginInfo.clinicId);
      } else {
        console.log('❌ HomePage - User not logged in');
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
      console.log('🔍 Fetching user info:', { userRowId, clinicId });
      const { data, error } = await supabase
        .from('users')
        .select('user_id, clinic_id, row_id')
        .eq('clinic_id', clinicId)
        .eq('row_id', userRowId)
        .single();
      
      console.log('📋 User query result:', { data, error });
      
      if (!error && data) {
        setUserInfo({
          ...data,
          full_name: 'User' // 简化显示，不显示具体姓名
        });
        console.log('✅ User info set successfully');
      } else {
        console.log('❌ User not found in database, clearing login state');
        // 用户不存在，清除登录状态
        cacheManager.clearLoginInfo();
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // 出错时也清除登录状态
      cacheManager.clearLoginInfo();
      setIsLoggedIn(false);
      setUserInfo(null);
    }
  };





  // 防抖的注册按钮点击
  const handleRegisterClick = debounce(() => {
    console.log('🏠 HomePage: Clicking Register button');
    
    // 清除所有表单数据，但保留clinic_id
    console.log('🧹 Clearing registration form data...');
    
    // 保存当前的clinic_id
    const currentClinicId = registrationData.clinic_id || clinicId || CLINIC_CONFIG.DEFAULT_CLINIC_ID;
    
    // 立即清除所有表单数据
    updateRegistrationData({
      clinic_id: currentClinicId,
      fullName: '',
      idLast4: '',
      dobDay: '',
      dobMonth: '',
      dobYear: '',
      phone: '',
      email: '',
      postalCode: '',
      blockNo: '',
      street: '',
      building: '',
      floor: '',
      unit: '',
      selfie: '',
      signature: '',
      // 清除健康声明
      HeartDisease: '',
      Diabetes: '',
      Hypertension: '',
      Cancer: '',
      Asthma: '',
      MentalIllness: '',
      Epilepsy: '',
      Stroke: '',
      KidneyDisease: '',
      LiverDisease: '',
      otherHealthNotes: '',
      // 清除同意书
      consentAgreed: false,
      releaseAgreed: false,
      indemnityAgreed: false
    });
    
    console.log('✅ Registration form data cleared, navigating to register with clinic_id:', currentClinicId);
    navigate('/register?clinic_id=' + currentClinicId);
  }, 200);

  // 防抖的预约按钮点击
  const handleBookingClick = debounce(() => {
    console.log('🎯 HomePage - Book appointment clicked');
    const storedUserRowId = localStorage.getItem('user_row_id');
    const storedClinicId = localStorage.getItem('clinic_id') || clinicId;
    console.log('📋 HomePage - Stored data:', { storedUserRowId, storedClinicId, clinicId });
    
    if (storedUserRowId && storedClinicId) {
      const url = `/booking/slots?clinic_id=${storedClinicId}&user_row_id=${storedUserRowId}`;
      console.log('🚀 HomePage - Navigating to:', url);
      navigate(url);
    } else {
      const url = '/booking?clinic_id=' + clinicId;
      console.log('⚠️ HomePage - Missing data, navigating to:', url);
      navigate(url);
    }
  }, 200);

  // 防抖的登出按钮点击
  const handleLogoutClick = debounce(() => {
    console.log('🚪 Logging out...');
    hapticTrigger('medium');
    setLogoutLoading(true);
    // 使用缓存管理器清除登录信息，但保留clinic_id
    cacheManager.clearLoginInfo();
    // Update state immediately instead of reloading
    setIsLoggedIn(false);
    setUserInfo(null);
    setLogoutLoading(false);
  }, 100);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-white to-blue-50">
      <Confetti isActive={showConfetti} />
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
      


      {/* Debug info */}
      <div className="text-sm text-gray-500 mb-4">
        Debug: isLoggedIn={isLoggedIn ? 'true' : 'false'}, userInfo={userInfo ? 'exists' : 'null'}
      </div>
      
      {/* 已登录用户显示 */}
      {isLoggedIn && userInfo && (
        <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center">
          <div className="w-full mb-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg font-bold text-gray-800">Welcome</span>
                <span className="text-lg font-bold text-blue-600">{userInfo.full_name}</span>
              </div>
            </div>
            <div className="space-y-4">
              <EnhancedButton
                variant="primary"
                onClick={() => {
                  hapticTrigger('light');
                  handleBookingClick();
                }}
                fullWidth
                size="lg"
              >
                Book Appointment
              </EnhancedButton>
              <EnhancedButton
                variant="outline"
                onClick={handleLogoutClick}
                loading={logoutLoading}
                disabled={logoutLoading}
                fullWidth
                size="lg"
              >
                Logout
              </EnhancedButton>
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
            <EnhancedButton
              variant="primary"
              onClick={() => {
                hapticTrigger('light');
                handleRegisterClick();
              }}
              fullWidth
              size="lg"
            >
              Register
            </EnhancedButton>
          </div>
          <div className="w-full">
            <div className="text-lg font-bold text-gray-800 mb-1">Returning Visitor</div>
            <div className="text-xs text-gray-400 mb-4">For patients who already have an account.</div>
            <div className="space-y-4">
              <EnhancedButton
                variant="primary"
                onClick={() => {
                  hapticTrigger('light');
                  handleBookingClick();
                }}
                fullWidth
                size="lg"
              >
                Book Appointment
              </EnhancedButton>

            </div>
          </div>
        </div>
      )}


    </div>
  );
}