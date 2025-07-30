import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import { supabase } from '../lib/supabaseClient';
import RegistrationHeader from '../components/RegistrationHeader';
import InputMask from 'react-input-mask';
import { hash, encrypt } from '../lib/utils';
import toast from 'react-hot-toast';
import { debounce } from '../lib/performance';


export default function RegistrationForm() {
  const navigate = useNavigate();
  const { updateRegistrationData } = useRegistration();
  const [searchParams] = useSearchParams();
  const clinicId = searchParams.get('clinic_id');

  const [form, setForm] = useState({
    fullName: '', idLast4: '', dobDay: '', dobMonth: '', dobYear: '',
    phone: '', email: '', postalCode: '', blockNo: '', street: '',
    building: '', floor: '', unit: ''
  });

  const [errors, setErrors] = useState({});
  const [addressError, setAddressError] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fatalError, setFatalError] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);

  // refs for all fields
  const fullNameRef = useRef();
  const idLast4Ref = useRef();
  const dobInputRef = useRef();
  const phoneRef = useRef();
  const emailRef = useRef();
  const postalCodeRef = useRef();
  const blockNoRef = useRef();
  const streetRef = useRef();
  const floorRef = useRef();
  const unitRef = useRef();
  const buildingRef = useRef();

  useEffect(() => {
    let timeoutId;
    console.log('📝 RegistrationForm mounted with clinicId:', clinicId);
    console.log('🔍 RegistrationForm searchParams:', Object.fromEntries(searchParams.entries()));
    
    if (!clinicId) {
      console.error('❌ Missing clinic_id in URL');
      console.error('🔍 Available search params:', Object.fromEntries(searchParams.entries()));
      setFatalError("Missing clinic_id in URL. Please use a valid registration link.");
      timeoutId = setTimeout(() => navigate('/'), 2000);
    } else {
      console.log(`✅ Clinic ID found: ${clinicId}`);
      // 只在有 clinicId 时才更新
      updateRegistrationData({ clinic_id: clinicId });
    }
    // 统一清空所有保存的数据，保留clinic_id
    setForm({
      fullName: '', idLast4: '', dobDay: '', dobMonth: '', dobYear: '',
      phone: '', email: '', postalCode: '', blockNo: '', street: '',
      building: '', floor: '', unit: ''
    });
    // 只在有 clinicId 时才更新 registrationData
    if (clinicId) {
      console.log('💾 Updating registration data with clinic_id:', clinicId);
      updateRegistrationData({
        clinic_id: clinicId,
        fullName: '', idLast4: '', dobDay: '', dobMonth: '', dobYear: '',
        phone: '', email: '', postalCode: '', blockNo: '', street: '',
        building: '', floor: '', unit: ''
      });
    }
    localStorage.removeItem('registrationFormDraft');
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [clinicId, navigate]);

  // 防抖地址查询
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    
    if (typeof window !== 'undefined' && form.postalCode.length === 6) {
      const timer = setTimeout(() => {
        setAddressLoading(true);
        const currentPostal = form.postalCode;
        fetch(`https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${currentPostal}&returnGeom=Y&getAddrDetails=Y&pageNum=1`)
          .then(res => res.json())
          .then(data => {
            if (form.postalCode !== currentPostal) return;
            if (data.found > 0 && data.results.length > 0) {
              const result = data.results[0];
              const address = {
                blockNo: result.BLK_NO || '',
                street: result.ROAD_NAME || '',
                building: result.BUILDING || ''
              };
              setForm(prev => ({ ...prev, ...address }));
              updateRegistrationData(address);
              setAddressError('');
              // 清除 blockNo 和 street 的错误
              setErrors(prev => ({
                ...prev,
                blockNo: '',
                street: '',
                building: ''
              }));
            } else {
              setAddressError('Address not found for this postal code');
            }
          })
          .catch(() => setAddressError('Address lookup failed, please check your network connection'))
          .finally(() => setAddressLoading(false));
      }, 500); // 500ms 防抖延迟
      
      setDebounceTimer(timer);
    }
    
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [form.postalCode]);

  // 自动保存表单数据到 localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('registrationFormDraft', JSON.stringify(form));
    }, 1000); // 1秒后保存
    
    return () => clearTimeout(timeoutId);
  }, [form]);

  // 页面加载时恢复表单数据
  useEffect(() => {
    const savedForm = localStorage.getItem('registrationFormDraft');
    if (savedForm) {
      try {
        const parsedForm = JSON.parse(savedForm);
        setForm(prev => ({ ...prev, ...parsedForm }));
      } catch (error) {
        console.error('Failed to parse saved form data:', error);
      }
    }
  }, []);

  const validateDOB = () => {
    const dd = parseInt(form.dobDay, 10);
    const mm = parseInt(form.dobMonth, 10);
    const yyyy = parseInt(form.dobYear, 10);
    if (!dd || !mm || !yyyy) return false;
    if (!(dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yyyy >= 1900 && yyyy <= 2050)) return false;

    const date = new Date(yyyy, mm - 1, dd);  // 更安全的日期构造
    return (
      date.getFullYear() === yyyy &&
      date.getMonth() === mm - 1 &&
      date.getDate() === dd
    );
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName) errs.fullName = 'Full name is required';
    if (!/^[A-Za-z0-9]{4}$/.test(form.idLast4)) errs.idLast4 = 'Must be exactly 4 letters or digits';
    if (!validateDOB()) errs.dob = 'Date must be valid (DD/MM/YYYY between 1900-2050)';
    if (!/^\d+$/.test(form.phone)) errs.phone = 'Phone number must be numeric';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email';
    if (!/^\d{6}$/.test(form.postalCode)) errs.postalCode = 'Postal code must be exactly 6 digits';
    if (!form.blockNo) errs.blockNo = 'Block Number is required';
    if (!form.street) errs.street = 'Street Name is required';
    if (!form.floor) errs.floor = 'Floor Number is required';
    if (!form.unit) errs.unit = 'Unit Number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 使用防抖的提交函数
  const handleSubmit = debounce(async (e) => {
    e.preventDefault();
    console.log('[Register][Submit] 当前表单内容:', form, 'clinicId:', clinicId);
    if (!validate()) {
      // 跳到第一个有错的输入框
      const errorOrder = [
        'fullName', 'idLast4', 'dob', 'phone', 'email', 'postalCode',
        'blockNo', 'street', 'floor', 'unit'
      ];
      for (const key of errorOrder) {
        if (errors[key] && fieldRefs[key]?.current) {
          fieldRefs[key].current.focus();
          break;
        }
      }
      toast.error('Please fix the errors above.');
      return;
    }
    setLoading(true);
    const loadingToast = toast.loading('Processing registration...');

    console.log('[Register] 检查是否已注册:', { clinicId, phone: form.phone, email: form.email });
    const phoneHash = hash(form.phone);
    const emailHash = hash(form.email);
    // 只查 hash 字段，不查明文
    const { data: phoneUsers, error: phoneError } = await supabase
      .from('users').select('user_id')
      .eq('clinic_id', clinicId)
      .eq('phone_hash', phoneHash)
      .limit(1);
    const { data: emailUsers, error: emailError } = await supabase
      .from('users').select('user_id')
      .eq('clinic_id', clinicId)
      .eq('email_hash', emailHash)
      .limit(1);
    console.log('[Register] 查到的手机号用户:', phoneUsers, phoneError);
    console.log('[Register] 查到的邮箱用户:', emailUsers, emailError);

    if (phoneError || emailError) {
      console.error('❌ 查询失败:', phoneError || emailError);
      toast.dismiss(loadingToast);
      toast.error('Server error, please try again later.');
      setErrors((prev) => ({ ...prev, phone: 'Server error, please try again later.' }));
      setLoading(false);
      return;
    }

    if (phoneUsers?.length > 0) {
      toast.dismiss(loadingToast);
      toast.error('This phone number has already been registered.');
      setErrors((prev) => ({ ...prev, phone: 'This phone number has already been registered.' }));
      setLoading(false);
      return;
    }
    if (emailUsers?.length > 0) {
      toast.dismiss(loadingToast);
      toast.error('This email has already been registered.');
      setErrors((prev) => ({ ...prev, email: 'This email has already been registered.' }));
      setLoading(false);
      return;
    }

    console.log('Submitting registrationData:', form);

    updateRegistrationData({
      ...form,
      dob: `${form.dobDay.padStart(2, '0')}/${form.dobMonth.padStart(2, '0')}/${form.dobYear}`,
      dobDay: form.dobDay,
      dobMonth: form.dobMonth,
      dobYear: form.dobYear
    });

    // 清除草稿数据，因为已经成功提交
    localStorage.removeItem('registrationFormDraft');
    
    toast.dismiss(loadingToast);
    toast.success('Registration successful!');
    setLoading(false);
    navigate('/register/medical');
  }, 300);

  const handleDOBChange = (e) => {
    let [dd, mm, yyyy] = e.target.value.split('/');
    dd = dd || '';
    mm = mm || '';
    yyyy = yyyy || '';
    setForm({ ...form, dobDay: dd, dobMonth: mm, dobYear: yyyy });

    // 不做任何实时校验
    updateRegistrationData({ dobDay: dd, dobMonth: mm, dobYear: yyyy });
  };

  const fieldRefs = {
    fullName: fullNameRef,
    idLast4: idLast4Ref,
    dob: dobInputRef,
    phone: phoneRef,
    email: emailRef,
    postalCode: postalCodeRef,
    blockNo: blockNoRef,
    street: streetRef,
    floor: floorRef,
    unit: unitRef,
  };

  function encryptEmail(email) {
    const AES_KEY = import.meta.env.VITE_AES_KEY;
    return email ? CryptoJS.AES.encrypt(email.trim().toLowerCase(), AES_KEY).toString() : '';
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in"
      >
      <RegistrationHeader title="Personal Information" />

      {fatalError && (
        <div className="text-red-600 bg-red-50 p-4 rounded-xl mb-4 text-center border border-red-200 flex items-center gap-2 animate-shake">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {fatalError}
        </div>
      )}

      {/* 基本信息区块 */}
      <div className="mb-8">
        <div className="text-base font-semibold text-gray-500 mb-3 pl-1">Basic Information</div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name (In NRIC or Passport) <span className="text-red-500">*</span>
            </label>
            <input
              ref={fullNameRef}
              type="text"
              value={form.fullName}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setForm({ ...form, fullName: val });
                updateRegistrationData({ fullName: val });
                if (val) setErrors(prev => ({ ...prev, fullName: '' }));
              }}
              className={`w-full border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400`}
              disabled={loading}
              placeholder="e.g. TAN AH KOW"
            />
            {errors.fullName && <div className="text-red-500 text-xs mt-1">{errors.fullName}</div>}
          </div>

          {/* Last 4 digits of NRIC or Passport Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last 4 digits of NRIC or Passport Number <span className="text-red-500">*</span>
            </label>
            <input
              ref={idLast4Ref}
              type="text"
              inputMode="text"
              maxLength={4}
              placeholder="e.g. 123A"
              value={form.idLast4}
              onChange={e => {
                const val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4);
                setForm({ ...form, idLast4: val });
                updateRegistrationData({ idLast4: val });
                if (/^[A-Za-z0-9]{4}$/.test(val)) setErrors(prev => ({ ...prev, idLast4: '' }));
              }}
              onBlur={() => {
                let err = '';
                if (!/^[A-Za-z0-9]{4}$/.test(form.idLast4)) err = 'Must be exactly 4 letters or digits';
                setErrors(prev => ({ ...prev, idLast4: err }));
              }}
              className={`w-full border ${errors.idLast4 ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400`}
              disabled={loading}
            />
            {errors.idLast4 && <div className="text-red-500 text-xs mt-1">{errors.idLast4}</div>}
          </div>

          {/* Date of Birth */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <InputMask
              mask="99/99/9999"
              maskChar=""
              placeholder="DD/MM/YYYY"
              value={`${form.dobDay}/${form.dobMonth}/${form.dobYear}`}
              onChange={handleDOBChange}
              onBlur={() => {
                let err = '';
                const dd = parseInt(form.dobDay, 10);
                const mm = parseInt(form.dobMonth, 10);
                const yyyy = parseInt(form.dobYear, 10);
                if (!(dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yyyy >= 1900 && yyyy <= 2050)) {
                  err = 'Date must be valid (DD/MM/YYYY between 1900-2050)';
                } else {
                  const date = new Date(yyyy, mm - 1, dd);
                  if (
                    date.getFullYear() !== yyyy ||
                    date.getMonth() !== mm - 1 ||
                    date.getDate() !== dd
                  ) {
                    err = 'Date must be valid (DD/MM/YYYY between 1900-2050)';
                  }
                }
                setErrors(prev => ({ ...prev, dob: err }));
              }}
              inputMode="numeric"
              type="tel"
              className={`w-full border ${errors.dob ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400`}
            >
              {(inputProps) => (
                <input
                  {...inputProps}
                  ref={dobInputRef}
                  type="tel"
                  inputMode="numeric"
                  className={`w-full border ${errors.dob ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400`}
                />
              )}
            </InputMask>
            {errors.dob && <div className="text-red-500 text-xs mt-1">{errors.dob}</div>}
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              ref={phoneRef}
              type="text"
              inputMode="numeric"
              value={form.phone}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, phone: val });
                if (/^\d+$/.test(val)) setErrors(prev => ({ ...prev, phone: '' }));
              }}
              onBlur={async () => {
                console.log('phone blur triggered');
                let err = '';
                if (!/^\d+$/.test(form.phone)) {
                  err = 'Phone number must be numeric';
                } else {
                  // 查重
                  const phoneHash = hash(form.phone);
                  const { data, error } = await supabase
                    .from('users')
                    .select('user_id')
                    .eq('phone_hash', phoneHash)
                    .limit(1);
                  if (error) {
                    err = 'Server error, please try again later.';
                  } else if (data && data.length > 0) {
                    err = 'This phone number has already been registered.';
                  }
                }
                setErrors(prev => ({ ...prev, phone: err }));
              }}
              className={`w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400`}
              disabled={loading}
              placeholder="e.g. 91234567"
            />
            {errors.phone && <div className="text-red-500 text-xs mt-1">{errors.phone}</div>}
          </div>

          {/* Email */}
          <div className="mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              ref={emailRef}
              type="email"
              inputMode="email"
              value={form.email.toLowerCase()}
              onChange={e => {
                const val = e.target.value.toLowerCase();
                setForm({ ...form, email: val });
                updateRegistrationData({ email: val });
                if (val) setErrors(prev => ({ ...prev, email: '' }));
              }}
              onBlur={async () => {
                let err = '';
                if (!/^\S+@\S+\.\S+$/.test(form.email)) err = 'Invalid email';
                else {
                  // 查重
                  const emailHash = hash(form.email);
                  const { data, error } = await supabase
                    .from('users')
                    .select('user_id')
                    .eq('email_hash', emailHash)
                    .limit(1);
                  if (error) {
                    err = 'Server error, please try again later.';
                  } else if (data && data.length > 0) {
                    err = 'This email has already been registered.';
                  }
                }
                setErrors(prev => ({ ...prev, email: err }));
              }}
              className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400`}
              disabled={loading}
              placeholder="e.g. example@email.com"
            />
            {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
          </div>
        </div>
      </div>

      {/* 住址信息区块 */}
      <div className="mb-8">
        <div className="text-base font-semibold text-gray-500 mb-3 pl-1">Address Information</div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          {/* Postal Code */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={postalCodeRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="e.g. 679038"
                value={form.postalCode}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                  setForm({ ...form, postalCode: val });
                  updateRegistrationData({ postalCode: val });
                  if (/^\d{6}$/.test(val)) setErrors(prev => ({ ...prev, postalCode: '' }));
                }}
                onBlur={() => {
                  let err = '';
                  if (!/^\d{6}$/.test(form.postalCode)) err = 'Postal code must be exactly 6 digits';
                  setErrors(prev => ({ ...prev, postalCode: err }));
                }}
                className={`w-full border ${errors.postalCode ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400 ${addressLoading ? 'pr-10 cursor-not-allowed bg-gray-50' : ''}`}
                disabled={loading || addressLoading}
              />
              {addressLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            {errors.postalCode && (
              <div className="text-red-500 text-xs mt-1">{errors.postalCode}</div>
            )}
            {!errors.postalCode && addressError === 'Address not found for this postal code' && (
              <div className="text-yellow-700 bg-yellow-50 text-xs p-2 rounded-md mt-1">
                Postal code seems not right. Please check and continue.
              </div>
            )}
            {addressLoading && (
              <div className="text-xs text-blue-600 flex items-center gap-1 mt-1 mb-2">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Looking up address...
              </div>
            )}
          </div>

          {/* Block Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Block Number <span className="text-red-500">*</span>
            </label>
            <input
              ref={fieldRefs.blockNo}
              type="text"
              inputMode="numeric"
              value={form.blockNo}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, blockNo: val });
                updateRegistrationData({ blockNo: val });
                if (val) setErrors(prev => ({ ...prev, blockNo: '' }));
              }}
              className={`w-full border ${errors.blockNo ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400 ${addressLoading ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}`}
              disabled={loading || addressLoading}
              placeholder="e.g. 123"
            />
            {errors.blockNo && <div className="text-red-500 text-xs mt-1">{errors.blockNo}</div>}
          </div>

          {/* Street Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={streetRef}
              type="text"
              value={form.street}
              onChange={e => {
                const val = e.target.value;
                setForm({ ...form, street: val });
                updateRegistrationData({ street: val });
                if (val) setErrors(prev => ({ ...prev, street: '' }));
              }}
              className={`w-full border ${errors.street ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400 ${addressLoading ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}`}
              disabled={loading || addressLoading}
              placeholder="e.g. JURONG WEST ST 65"
            />
            {errors.street && <div className="text-red-500 text-xs mt-1">{errors.street}</div>}
          </div>

          {/* Building Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building Name <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              ref={buildingRef}
              type="text"
              value={form.building}
              onChange={e => {
                const val = e.target.value;
                setForm({ ...form, building: val });
                updateRegistrationData({ building: val });
              }}
              className={`w-full border border-gray-300 rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400 ${addressLoading ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}`}
              placeholder="Optional"
              disabled={loading || addressLoading}
            />
          </div>

          {/* Floor Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Floor Number <span className="text-red-500">*</span>
            </label>
            <input
              ref={fieldRefs.floor}
              type="text"
              inputMode="text"
              value={form.floor}
              onChange={e => {
                const val = e.target.value.replace(/[^A-Za-z0-9]/g, '');
                setForm({ ...form, floor: val });
                updateRegistrationData({ floor: val });
                if (val) setErrors(prev => ({ ...prev, floor: '' }));
              }}
              className={`w-full border ${errors.floor ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400`}
              disabled={loading}
              placeholder="e.g. 12"
            />
            {errors.floor && <div className="text-red-500 text-xs mt-1">{errors.floor}</div>}
          </div>

          {/* Unit Number */}
          <div className="mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Number <span className="text-red-500">*</span>
            </label>
            <input
              ref={fieldRefs.unit}
              type="text"
              inputMode="text"
              value={form.unit}
              onChange={e => {
                const val = e.target.value.replace(/[^A-Za-z0-9]/g, '');
                setForm({ ...form, unit: val });
                updateRegistrationData({ unit: val });
                if (val) setErrors(prev => ({ ...prev, unit: '' }));
              }}
              className={`w-full border ${errors.unit ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400`}
              disabled={loading}
              placeholder="e.g. 123A"
            />
            {errors.unit && <div className="text-red-500 text-xs mt-1">{errors.unit}</div>}
          </div>
        </div>
      </div>

      <div className="text-center mt-8 mb-6">
        <button
          type="submit"
          disabled={loading}
          className={`w-full h-14 rounded-xl text-lg font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 ${loading ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none transform-none' : ''}`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            'Next'
          )}
        </button>
        <div className="text-xs text-gray-400 mt-2">
          💾 Your progress is automatically saved
        </div>
      </div>
      </form>
    </div>
  );
}
