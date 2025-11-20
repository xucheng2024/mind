import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import { apiClient } from '../lib/api';
import RegistrationHeader from '../components/RegistrationHeader';
import { IMaskInput } from 'react-imask';
// Remove unused imports - server handles hashing and encryption
import toast from 'react-hot-toast';
import { debounce } from '../lib/performance';
import { getClinicId } from '../config/clinic';
import { 
  PhoneInput, 
  DateInput, 
  EnhancedButton, 
  ProgressBar,
  useHapticFeedback 
} from '../components';


export default function RegistrationForm() {
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [searchParams] = useSearchParams();
  const clinicId = getClinicId(searchParams, localStorage);
  const { trigger: hapticTrigger } = useHapticFeedback();

  const [form, setForm] = useState({
    fullName: '', idLast4: '', dobDay: '', dobMonth: '', dobYear: '',
    gender: '', phone: '', email: '', postalCode: '', blockNo: '', street: '',
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
  const genderRef = useRef();
  const phoneRef = useRef();
  const emailRef = useRef();
  const postalCodeRef = useRef();
  const blockNoRef = useRef();
  const streetRef = useRef();
  const floorRef = useRef();
  const unitRef = useRef();
  const buildingRef = useRef();

  // Only sync registrationData to form on first mount
  useEffect(() => {
    let timeoutId;
    if (!clinicId) {
      setFatalError("Missing clinic_id in URL. Please use a valid registration link.");
      timeoutId = setTimeout(() => navigate('/'), 2000);
    } else {
      updateRegistrationData({ clinic_id: clinicId });
    }
    // Only sync registrationData on first mount
    const restoredForm = {
      fullName: registrationData.fullName || '',
      idLast4: registrationData.idLast4 || '',
      dobDay: registrationData.dobDay || '',
      dobMonth: registrationData.dobMonth || '',
      dobYear: registrationData.dobYear || '',
      gender: registrationData.gender || '',
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

  // Debounced address lookup
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
              // Clear blockNo and street errors
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
      }, 500); // 500ms debounce delay

      setDebounceTimer(timer);
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [form.postalCode]);

  // Auto-save form data to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('registrationFormDraft', JSON.stringify(form));
    }, 1000); // Save after 1 second

    return () => clearTimeout(timeoutId);
  }, [form]);

  // Restore form data on page load
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
    if (!form.dobDay || !form.dobMonth || !form.dobYear) return false;
    
    const dd = parseInt(form.dobDay, 10);
    const mm = parseInt(form.dobMonth, 10);
    const yyyy = parseInt(form.dobYear, 10);
    
    if (isNaN(dd) || isNaN(mm) || isNaN(yyyy)) return false;
    
    // Basic range check
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return false;
    
    // Year range check (clinic applicable: 1900-current year+1)
    const currentYear = new Date().getFullYear();
    if (yyyy < 1900 || yyyy > currentYear + 1) return false;
    
    // Specific date validation
    const date = new Date(yyyy, mm - 1, dd);
    if (
      date.getFullYear() !== yyyy ||
      date.getMonth() !== mm - 1 ||
      date.getDate() !== dd
    ) return false;
    
    // Future date check (clinic registration usually doesn't allow future dates)
    if (date > new Date()) return false;
    
    // Age reasonableness check (clinic applicable: 0-120 years)
    const age = currentYear - yyyy;
    if (age > 120) return false;
    
    return true;
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName) errs.fullName = 'Full name is required';
    if (!/^[A-Za-z0-9]{4}$/.test(form.idLast4)) errs.idLast4 = 'Must be exactly 4 letters or digits';
    if (!validateDOB()) errs.dob = 'Please enter a valid date of birth (DD/MM/YYYY)';
    if (!form.gender) errs.gender = 'Gender is required';
    if (!/^\d+$/.test(form.phone)) errs.phone = 'Phone number must be numeric';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email';
    if (!/^\d{6}$/.test(form.postalCode)) errs.postalCode = 'Postal code must be exactly 6 digits';
    if (!form.blockNo) errs.blockNo = 'Block Number is required';
    if (!form.street) errs.street = 'Street Name is required';
    if (!form.floor) errs.floor = 'Floor Number is required';
    if (!form.unit) errs.unit = 'Unit Number is required';
    
    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;
    return isValid;
  };

  // Use debounced submit function, but don't handle preventDefault here
  const handleSubmit = debounce(async (e) => {
    if (!validate()) {
      // Jump to first input field with error
      const errorOrder = [
        'fullName', 'idLast4', 'dob', 'gender', 'phone', 'email', 'postalCode',
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

    try {
      // Check for duplicates using server API
      const duplicateResult = await apiClient.checkDuplicate(clinicId, form.phone, form.email);
      
      if (!duplicateResult.success) {
        toast.dismiss(loadingToast);
        toast.error('Server error, please try again later.');
        setErrors((prev) => ({ ...prev, phone: 'Server error, please try again later.' }));
        setLoading(false);
        return;
      }
      
      const { phoneExists, emailExists } = duplicateResult.data;

      if (phoneExists) {
        toast.dismiss(loadingToast);
        toast.error('This phone number has already been registered.');
        setErrors((prev) => ({ ...prev, phone: 'This phone number has already been registered.' }));
        setLoading(false);
        return;
      }
      if (emailExists) {
        toast.dismiss(loadingToast);
        toast.error('This email has already been registered.');
        setErrors((prev) => ({ ...prev, email: 'This email has already been registered.' }));
        setLoading(false);
        return;
      }
      updateRegistrationData({
        ...form,
        dob: `${(form.dobDay || '').padStart(2, '0')}/${(form.dobMonth || '').padStart(2, '0')}/${form.dobYear || ''}`,
        dobDay: form.dobDay || '',
        dobMonth: form.dobMonth || '',
        dobYear: form.dobYear || '',
        gender: form.gender
      });

      // Clear draft data since submission was successful
      localStorage.removeItem('registrationFormDraft');

      toast.dismiss(loadingToast);
      setLoading(false);
      navigate('/register/medical');
    } catch (error) {
      console.error('Unexpected error during registration:', error);
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
    
    // Real-time format validation
    let isValid = true;
    let errorMsg = '';
    
    if (dd && mm && yyyy) {
      const day = parseInt(dd, 10);
      const month = parseInt(mm, 10);
      const year = parseInt(yyyy, 10);
      
      // Basic range check
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        isValid = false;
        errorMsg = 'Invalid date format';
      }
      // Year range check (clinic applicable: 1900-current year+1)
      else if (year < 1900 || year > new Date().getFullYear() + 1) {
        isValid = false;
        errorMsg = `Year must be between 1900-${new Date().getFullYear() + 1}`;
      }
      // Specific date validation
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
        // Future date check (clinic registration usually doesn't allow future dates)
        else if (date > new Date()) {
          isValid = false;
          errorMsg = 'Date cannot be in the future';
        }
        // Age reasonableness check (clinic applicable: 0-120 years)
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
    
    // Real-time error update
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
    gender: genderRef,
    phone: phoneRef,
    email: emailRef,
    postalCode: postalCodeRef,
    blockNo: blockNoRef,
    street: streetRef,
    floor: floorRef,
    unit: unitRef,
  };

  // Encryption removed - handled by server API

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <form
        onSubmit={async (e) => {
          e.preventDefault(); // 确保阻止默认行为
          try {
            await handleSubmit(e);
          } catch (error) {
            console.error('Form submit error:', error);
          }
        }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in"
      >
      <RegistrationHeader title={`Welcome name`} />
      
      {/* Progress Bar */}
      <ProgressBar 
        currentStep={1} 
        totalSteps={4} 
        steps={['Profile', 'Medical', 'Selfie', 'Submit']}
        className="mb-6"
      />

      {fatalError && (
        <div className="text-red-600 bg-red-50 p-4 rounded-xl mb-4 text-center border border-red-200 flex items-center gap-2 animate-shake">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {fatalError}
        </div>
      )}

      {/* Basic Information Section */}
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
              autoComplete="name"
            />
            {errors.fullName && (
              <div className="text-red-500 text-xs mt-1">{errors.fullName}</div>
            )}
          </div>

          {/* Last 4 digits of NRIC or Passport Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last 4 digits of NRIC or Passport Number <span className="text-red-500">*</span>
            </label>
            <input
              ref={idLast4Ref}
              type="text"
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
              placeholder="e.g. 123A"
              maxLength={4}
              autoComplete="off"
            />
            {errors.idLast4 && (
              <div className="text-red-500 text-xs mt-1">{errors.idLast4}</div>
            )}
          </div>

          {/* Date of Birth */}
          <DateInput
            value={form.dobDay && form.dobMonth && form.dobYear 
              ? `${form.dobDay}/${form.dobMonth}/${form.dobYear}`
              : form.dobDay || form.dobMonth || form.dobYear
              ? `${form.dobDay || ''}${form.dobMonth ? '/' + form.dobMonth : ''}${form.dobYear ? '/' + form.dobYear : ''}`
              : ''}
            onChange={(e, formatted) => {
              const parts = formatted.split('/');
              const day = (parts[0] || '').trim();
              const month = (parts[1] || '').trim();
              const year = (parts[2] || '').trim();
              
              // Only update if values are valid (not NaN)
              if (day || month || year) {
                setForm(prev => ({ ...prev, dobDay: day, dobMonth: month, dobYear: year }));
                updateRegistrationData({ dobDay: day, dobMonth: month, dobYear: year });
                
                if (day && month && year) {
                  setErrors(prev => ({ ...prev, dob: '' }));
                }
              }
            }}
            onBlur={() => {
              if (form.dobDay && form.dobMonth && form.dobYear) {
                const isValid = validateDOB();
                if (!isValid) {
                  setErrors(prev => ({ ...prev, dob: 'Please enter a valid date of birth' }));
                }
              }
            }}
            error={errors.dob}
            disabled={loading}
            required
            maxDate={new Date().toISOString().split('T')[0]}
          />

          {/* Gender Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3" ref={genderRef}>
              {['Male', 'Female'].map(option => (
                <button
                  key={option}
                  type="button"
                  className={`medical-option-button flex-1 ${
                    form.gender === option ? 'selected' : ''
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!loading) {
                      setForm(prev => ({ ...prev, gender: option }));
                      updateRegistrationData({ gender: option });
                      if (errors.gender) {
                        setErrors(prev => ({ ...prev, gender: '' }));
                      }
                    }
                  }}
                  disabled={loading}
                >
                  {option}
                </button>
              ))}
            </div>
            {errors.gender && (
              <div className="text-red-500 text-xs mt-1">{errors.gender}</div>
            )}
          </div>

          {/* Phone Number */}
          <PhoneInput
            ref={phoneRef}
            value={form.phone}
            onChange={(e, formatted) => {
              const val = formatted.replace(/[^0-9]/g, '');
              setForm({ ...form, phone: val });
              if (/^\d+$/.test(val)) setErrors(prev => ({ ...prev, phone: '' }));
            }}
            onBlur={async () => {
              let err = '';
              if (!/^\d+$/.test(form.phone)) {
                err = 'Phone number must be numeric';
              } else {
                // Check for duplicate using server API
                try {
                  const result = await apiClient.checkDuplicate(clinicId, form.phone, null);
                  if (result.success && result.data.phoneExists) {
                    err = 'This phone number has already been registered.';
                  }
                } catch (error) {
                  err = 'Server error, please try again later.';
                }
              }
              setErrors(prev => ({ ...prev, phone: err }));
            }}
            error={errors.phone}
            disabled={loading}
            required
            placeholder="e.g. 91234567"
          />

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              ref={emailRef}
              type="email"
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
                  // Check for duplicate using server API
                  try {
                    const result = await apiClient.checkDuplicate(clinicId, null, form.email);
                    if (result.success && result.data.emailExists) {
                      err = 'This email has already been registered.';
                    }
                  } catch (error) {
                    err = 'Server error, please try again later.';
                  }
                }
                setErrors(prev => ({ ...prev, email: err }));
              }}
              className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl p-4 text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-400`}
              disabled={loading}
              placeholder="e.g. example@email.com"
              autoComplete="email"
            />
            {errors.email && (
              <div className="text-red-500 text-xs mt-1">{errors.email}</div>
            )}
          </div>
        </div>
      </div>

      {/* Address Information Section */}
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
        <EnhancedButton
          type="submit"
          loading={loading}
                        onClick={() => {
                hapticTrigger('medium');
              }}
          fullWidth
          size="lg"
          variant="primary"
        >
          {loading ? 'Submitting...' : 'Next'}
        </EnhancedButton>
        <div className="text-xs text-gray-400 mt-2">
          💾 Your progress is automatically saved
        </div>
      </div>
      </form>
    </div>
  );
}
