import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import { supabase } from '../lib/supabaseClient';
import RegistrationHeader from '../components/RegistrationHeader';
import InputMask from 'react-input-mask';
import { hash, encrypt } from '../lib/utils';
import { getAESKey } from '../lib/config';
import toast from 'react-hot-toast';
import { debounce } from '../lib/performance';
import { getClinicId } from '../config/clinic';


export default function RegistrationForm() {
  console.log('📝 RegistrationForm: Page loaded');
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [searchParams] = useSearchParams();
  const clinicId = getClinicId(searchParams, localStorage);

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

  // 只在首次挂载时同步 registrationData 到 form
  useEffect(() => {
    let timeoutId;
    if (!clinicId) {
      setFatalError("Missing clinic_id in URL. Please use a valid registration link.");
      timeoutId = setTimeout(() => navigate('/'), 2000);
    } else {
      updateRegistrationData({ clinic_id: clinicId });
    }
    // 只在首次挂载时同步 registrationData
    const restoredForm = {
      fullName: registrationData.fullName || '',
      idLast4: registrationData.idLast4 || '',
      dobDay: registrationData.dobDay || '',
      dobMonth: registrationData.dobMonth || '',
      dobYear: registrationData.dobYear || '',
      phone: registrationData.phone || '',
      email: registrationData.email || '',
      postalCode: registrationData.postalCode || '',
      blockNo: registrationData.blockNo || '',
      street: registrationData.street || '',
      building: registrationData.building || '',
      floor: registrationData.floor || '',
      unit: registrationData.unit || ''
    };
    setForm(restoredForm);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    
    // 基本范围检查
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return false;
    
    // 年份范围检查 (诊所适用: 1900-当前年份+1)
    const currentYear = new Date().getFullYear();
    if (yyyy < 1900 || yyyy > currentYear + 1) return false;
    
    // 具体日期验证
    const date = new Date(yyyy, mm - 1, dd);
    if (
      date.getFullYear() !== yyyy ||
      date.getMonth() !== mm - 1 ||
      date.getDate() !== dd
    ) return false;
    
    // 未来日期检查 (诊所登记通常不允许未来日期)
    if (date > new Date()) return false;
    
    // 年龄合理性检查 (诊所适用: 0-120岁)
    const age = currentYear - yyyy;
    if (age > 120) return false;
    
    return true;
  };

  const validate = () => {
    console.log('🔍 Starting form validation...');
    const errs = {};
    if (!form.fullName) errs.fullName = 'Full name is required';
    if (!/^[A-Za-z0-9]{4}$/.test(form.idLast4)) errs.idLast4 = 'Must be exactly 4 letters or digits';
    if (!validateDOB()) errs.dob = 'Please enter a valid date of birth (DD/MM/YYYY)';
    if (!/^\d+$/.test(form.phone)) errs.phone = 'Phone number must be numeric';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email';
    if (!/^\d{6}$/.test(form.postalCode)) errs.postalCode = 'Postal code must be exactly 6 digits';
    if (!form.blockNo) errs.blockNo = 'Block Number is required';
    if (!form.street) errs.street = 'Street Name is required';
    if (!form.floor) errs.floor = 'Floor Number is required';
    if (!form.unit) errs.unit = 'Unit Number is required';
    
    console.log('📋 Validation results:', {
      fullName: form.fullName ? 'OK' : 'MISSING',
      idLast4: /^[A-Za-z0-9]{4}$/.test(form.idLast4) ? 'OK' : 'INVALID',
      dob: validateDOB() ? 'OK' : 'INVALID',
      phone: /^\d+$/.test(form.phone) ? 'OK' : 'INVALID',
      email: /^\S+@\S+\.\S+$/.test(form.email) ? 'OK' : 'INVALID',
      postalCode: /^\d{6}$/.test(form.postalCode) ? 'OK' : 'INVALID',
      blockNo: form.blockNo ? 'OK' : 'MISSING',
      street: form.street ? 'OK' : 'MISSING',
      floor: form.floor ? 'OK' : 'MISSING',
      unit: form.unit ? 'OK' : 'MISSING'
    });
    
    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;
    console.log('✅ Form validation result:', isValid ? 'PASSED' : 'FAILED');
    if (!isValid) {
      console.log('❌ Validation errors:', errs);
    }
    return isValid;
  };

  // 使用防抖的提交函数，但不在这里处理 preventDefault
  const handleSubmit = debounce(async (e) => {
    console.log('🔥 FORM SUBMIT TRIGGERED!'); // 测试日志
    console.log('🚀 RegistrationForm submit started');
    console.log('📋 Form data:', form);
    console.log('🏥 Clinic ID:', clinicId);
    console.log('🌐 Network info:', {
      online: navigator.onLine,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : 'Not supported',
      isPWA: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
      userAgent: navigator.userAgent
    });
    
    if (!validate()) {
      console.log('❌ Form validation failed');
      console.log('🔍 Errors:', errors);
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
    
    console.log('✅ Form validation passed');
    setLoading(true);
    const loadingToast = toast.loading('Processing registration...');

    const phoneHash = hash(form.phone);
    const emailHash = hash(form.email);
    console.log('🔐 Hashed values:', { phoneHash, emailHash });
    
    console.log('🔍 Checking for duplicate users...');
    try {
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

      console.log('📊 Supabase query results:', {
        phoneUsers,
        phoneError,
        emailUsers,
        emailError
      });

      if (phoneError || emailError) {
        console.error('❌ Supabase query failed:', { phoneError, emailError });
        toast.dismiss(loadingToast);
        toast.error('Server error, please try again later.');
        setErrors((prev) => ({ ...prev, phone: 'Server error, please try again later.' }));
        setLoading(false);
        return;
      }

      if (phoneUsers?.length > 0) {
        console.log('❌ Phone number already registered');
        toast.dismiss(loadingToast);
        toast.error('This phone number has already been registered.');
        setErrors((prev) => ({ ...prev, phone: 'This phone number has already been registered.' }));
        setLoading(false);
        return;
      }
      if (emailUsers?.length > 0) {
        console.log('❌ Email already registered');
        toast.dismiss(loadingToast);
        toast.error('This email has already been registered.');
        setErrors((prev) => ({ ...prev, email: 'This email has already been registered.' }));
        setLoading(false);
        return;
      }

      console.log('✅ No duplicate users found, updating registration data');
      updateRegistrationData({
        ...form,
        dob: `${form.dobDay.padStart(2, '0')}/${form.dobMonth.padStart(2, '0')}/${form.dobYear}`,
        dobDay: form.dobDay,
        dobMonth: form.dobMonth,
        dobYear: form.dobYear
      });

      // 清除草稿数据，因为已经成功提交
      localStorage.removeItem('registrationFormDraft');

      console.log('✅ Registration successful, navigating to medical page');
      toast.dismiss(loadingToast);
      setLoading(false);
      navigate('/register/medical');
    } catch (error) {
      console.error('❌ Unexpected error during registration:', error);
      toast.dismiss(loadingToast);
      toast.error('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }, 300);

  const handleDOBChange = (value) => {
    let [dd, mm, yyyy] = value.split('/');
    dd = dd || '';
    mm = mm || '';
    yyyy = yyyy || '';
    
    // 实时格式验证
    let isValid = true;
    let errorMsg = '';
    
    if (dd && mm && yyyy) {
      const day = parseInt(dd, 10);
      const month = parseInt(mm, 10);
      const year = parseInt(yyyy, 10);
      
      // 基本范围检查
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        isValid = false;
        errorMsg = 'Invalid date format';
      }
      // 年份范围检查 (诊所适用: 1900-当前年份+1)
      else if (year < 1900 || year > new Date().getFullYear() + 1) {
        isValid = false;
        errorMsg = `Year must be between 1900-${new Date().getFullYear() + 1}`;
      }
      // 具体日期验证
      else {
        const date = new Date(year, month - 1, day);
        if (
          date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day
        ) {
          isValid = false;
          errorMsg = 'Invalid date (e.g., 30/02/2023)';
        }
        // 未来日期检查 (诊所登记通常不允许未来日期)
        else if (date > new Date()) {
          isValid = false;
          errorMsg = 'Date cannot be in the future';
        }
        // 年龄合理性检查 (诊所适用: 0-120岁)
        else {
          const age = new Date().getFullYear() - year;
          if (age > 120) {
            isValid = false;
            errorMsg = 'Age seems unrealistic';
          }
        }
      }
    }
    
    setForm({ ...form, dobDay: dd, dobMonth: mm, dobYear: yyyy });
    updateRegistrationData({ dobDay: dd, dobMonth: mm, dobYear: yyyy });
    
    // 实时错误更新
    if (dd && mm && yyyy) {
      setErrors(prev => ({ ...prev, dob: isValid ? '' : errorMsg }));
    } else {
      setErrors(prev => ({ ...prev, dob: '' }));
    }
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
    const AES_KEY = getAESKey();
    return email ? CryptoJS.AES.encrypt(email.trim().toLowerCase(), AES_KEY).toString() : '';
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <form
        onSubmit={async (e) => {
          e.preventDefault(); // 确保阻止默认行为
          console.log('🔥 FORM ONSUBMIT EVENT FIRED!');
          try {
            await handleSubmit(e);
          } catch (error) {
            console.error('❌ Form submit error:', error);
          }
        }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in"
      >
      <RegistrationHeader title={`Welcome name`} />

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
              <span className="text-xs text-gray-500 ml-2">(DD/MM/YYYY)</span>
            </label>
            <InputMask
              mask="00/00/0000"
              placeholder="DD/MM/YYYY"
              value={`${form.dobDay}/${form.dobMonth}/${form.dobYear}`}
              onChange={(e) => {
                const value = e.target.value;
                const parts = value.split('/');
                if (parts.length === 3) {
                  setForm(prev => ({
                    ...prev,
                    dobDay: parts[0] || '',
                    dobMonth: parts[1] || '',
                    dobYear: parts[2] || ''
                  }));
                }
              }}
              onBlur={() => {
                // onBlur 时进行最终验证
                if (form.dobDay && form.dobMonth && form.dobYear) {
                  const isValid = validateDOB();
                  if (!isValid) {
                    setErrors(prev => ({ ...prev, dob: 'Please enter a valid date of birth' }));
                  }
                }
              }}
              inputMode="numeric"
              type="tel"
              ref={dobInputRef}
              className={`w-full border ${errors.dob ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400`}
              style={{
                fontFamily: 'monospace',
                letterSpacing: '0.5px'
              }}
            />
            {errors.dob && (
              <div className="text-red-500 text-xs mt-1 flex items-start gap-1">
                <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.dob}
              </div>
            )}
            {!errors.dob && form.dobDay && form.dobMonth && form.dobYear && (
              <div className="text-green-600 text-xs mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Valid date format
              </div>
            )}
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
          onClick={() => console.log('🔥 SUBMIT BUTTON CLICKED!')}
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
