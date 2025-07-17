import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import { supabase } from '../lib/supabaseClient';
import RegistrationHeader from '../components/RegistrationHeader';
import InputMask from 'react-input-mask';

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

  const postalRefs = Array.from({ length: 6 }, () => useRef());
  const [errors, setErrors] = useState({});
  const [addressError, setAddressError] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fatalError, setFatalError] = useState('');

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

  useEffect(() => {
    if (!clinicId) {
      setFatalError("Missing clinic_id in URL. Please use a valid registration link.");
      setTimeout(() => navigate('/'), 2000);
    } else {
      updateRegistrationData({ clinic_id: clinicId });
    }
  }, [clinicId, navigate]);

  useEffect(() => {
    if (typeof window !== 'undefined' && form.postalCode.length === 6) {
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
              street: ''
            }));
          } else {
            setAddressError('Address not found for this postal code');
          }
        })
        .catch(() => setAddressError('Address lookup failed, please check your network connection'))
        .finally(() => setAddressLoading(false));
    }
  }, [form.postalCode]);

  const requiredStar = <span style={{ color: 'red' }}>*</span>;

  const labelStyle = {
    fontWeight: '600', marginTop: '16px', display: 'block', fontSize: '14px', color: '#333'
  };

  const inputStyle = (field) => ({
    border: errors[field] ? '1px solid red' : '1px solid #ccc',
    padding: '12px', borderRadius: '6px', fontSize: '16px', width: '100%',
    marginBottom: '6px', color: '#000', backgroundColor: '#fff', boxSizing: 'border-box'
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      return;
    }
    setLoading(true);

    const { data: existingUsers, error } = await supabase
      .from('users').select('user_id').eq('phone', form.phone).limit(1);

    if (error) {
      console.error('❌ 查询失败:', error.message);
      setErrors((prev) => ({ ...prev, phone: 'Server error, please try again later.' }));
      setLoading(false);
      return;
    }

    if (existingUsers?.length > 0) {
      setErrors((prev) => ({ ...prev, phone: 'This phone number has already been registered.' }));
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

    setLoading(false);
    navigate('/register/medical');
  };

  const handleSegmentedInput = (e, field, index, total, isAlphaNumeric = false) => {
    const char = e.target.value.slice(-1);
    const pattern = isAlphaNumeric ? /^[A-Za-z0-9]$/ : /^[0-9]$/;
    if (!pattern.test(char)) return;

    const current = form[field].split('');
    current[index] = char;
    setForm({ ...form, [field]: current.join('').slice(0, total) });

    const refs = field === 'idLast4' ? idRefs : postalRefs;
    if (index < total - 1) refs[index + 1].current?.focus();
  };

  const handleKeyDown = (e, field, index) => {
    const refs = field === 'idLast4' ? idRefs : postalRefs;
    const current = form[field].split('');

    if (e.key === 'Backspace') {
      e.preventDefault();
      current[index] = '';
      setForm({ ...form, [field]: current.join('') });
      if (index > 0) refs[index - 1].current?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < refs.length - 1) {
      refs[index + 1].current?.focus();
    }
  };

  const renderSegmentedInput = (field, total, isAlphaNumeric = false) => {
    const refs = field === 'idLast4' ? idRefs : postalRefs;
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        {Array.from({ length: total }).map((_, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="text"
            maxLength={1}
            inputMode={isAlphaNumeric ? 'text' : 'numeric'}
            value={form[field][i] || ''}
            onChange={(e) => handleSegmentedInput(e, field, i, total, isAlphaNumeric)}
            onKeyDown={(e) => handleKeyDown(e, field, i)}
            style={{
              width: '38px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: '500',
              fontFamily: 'Arial, sans-serif',
              color: '#000',
              border: errors[field] ? '1px solid red' : '1px solid #ccc',
              borderRadius: '6px',
              backgroundColor: '#fff',
              padding: 0,
              boxSizing: 'border-box',
              lineHeight: 'normal',
            }}

          />
        ))}
      </div>
    );
  };

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

  return (
    <form
      onSubmit={handleSubmit}
      className="form-container min-h-screen flex flex-col overflow-y-auto"
    >
      <RegistrationHeader title="Personal Information" />

      {fatalError && (
        <div className="text-red-600 bg-red-50 p-3 rounded mb-4 text-center">
          {fatalError}
        </div>
      )}

      <label className="font-semibold mt-4 block text-sm text-gray-800">
        Full Name (In NRIC or Passport) <span className="text-red-500">*</span>
      </label>
      {/* Full Name */}
      <input
        ref={fullNameRef}
        type="text"
        value={form.fullName}
        onChange={(e) => {
          const val = e.target.value.toUpperCase();
          setForm({ ...form, fullName: val });
          updateRegistrationData({ fullName: val });
          // 清除错误
          if (val) setErrors(prev => ({ ...prev, fullName: '' }));
        }}
        className={`w-full border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 text-base bg-white mb-2`}
        disabled={loading}
      />
      {errors.fullName && <div className="text-red-500 text-xs">{errors.fullName}</div>}

      <label className="font-semibold mt-4 block text-sm text-gray-800">
        Last 4 digits of NRIC or Passport Number <span className="text-red-500">*</span>
      </label>
      <input
        ref={idLast4Ref}
        type="text"
        maxLength={4}
        placeholder="eg. 123A"
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
        className={`w-full border ${errors.idLast4 ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 text-base bg-white mb-2`}
        disabled={loading}
      />
      {errors.idLast4 && <div className="text-red-500 text-xs">{errors.idLast4}</div>}

      <label className="font-semibold mt-4 block text-sm text-gray-800">
        Date of Birth <span className="text-red-500">*</span>
      </label>
      <InputMask
        ref={dobInputRef}
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
            const date = new Date(yyyy, mm - 1, dd); // 更稳妥
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
        className={`w-full border ${errors.dob ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 text-base bg-white mb-2`}
      >
        {(inputProps) => (
          <input
            {...inputProps}
            type="tel"
            inputMode="numeric"
            className={`w-full border ${errors.dob ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 text-base bg-white mb-2`}
          />
        )}
      </InputMask>
      {errors.dob && <div className="text-red-500 text-xs">{errors.dob}</div>}

      <label className="font-semibold mt-4 block text-sm text-gray-800">
        Phone Number <span className="text-red-500">*</span>
      </label>
      {/* Phone Number */}
      <input
        ref={phoneRef}
        type="text"
        inputMode="numeric"
        value={form.phone}
        onChange={e => {
          const val = e.target.value.replace(/[^0-9]/g, '');
          setForm({ ...form, phone: val });
          // 清除错误
          if (/^\d+$/.test(val)) setErrors(prev => ({ ...prev, phone: '' }));
        }}
        onBlur={async () => {
          let err = '';
          if (!/^\d+$/.test(form.phone)) {
            err = 'Phone number must be numeric';
          } else {
            const { data, error } = await supabase
              .from('users')
              .select('user_id')
              .eq('phone', form.phone)
              .eq('clinic_id', clinicId)
              .limit(1);
            if (error) {
              err = 'Server error, please try again later.';
            } else if (data && data.length > 0) {
              err = 'This phone number has already been registered.';
            }
          }
          setErrors(prev => ({ ...prev, phone: err }));
        }}
        className={`w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 text-base bg-white mb-2`}
        disabled={loading}
      />
      {errors.phone && <div className="text-red-500 text-xs">{errors.phone}</div>}

      <label className="font-semibold mt-4 block text-sm text-gray-800">
        Email <span className="text-red-500">*</span>
      </label>
      {/* Email */}
      <input
        ref={emailRef}
        type="email"
        inputMode="email"
        value={form.email.toLowerCase()}
        onChange={e => {
          const val = e.target.value.toLowerCase();
          setForm({ ...form, email: val });
          updateRegistrationData({ email: val });
          if (/^\S+@\S+\.\S+$/.test(val)) setErrors(prev => ({ ...prev, email: '' }));
        }}
        onBlur={() => {
          let err = '';
          if (!/^\S+@\S+\.\S+$/.test(form.email)) err = 'Invalid email';
          setErrors(prev => ({ ...prev, email: err }));
        }}
        className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 text-base bg-white mb-2`}
        disabled={loading}
      />
      {errors.email && <div className="text-red-500 text-xs">{errors.email}</div>}

      {/* 邮编输入框和提示 */}
      <label className="font-semibold mt-4 block text-sm text-gray-800">
        Postal Code <span className="text-red-500">*</span>
      </label>
      <input
        ref={postalCodeRef}
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="eg. 679038"
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
        className={`w-full border ${errors.postalCode ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 text-base bg-white mb-2`}
        disabled={loading}
      />
      {/* 红色错误：输入不是6位 */}
      {errors.postalCode && (
        <div style={{ color: 'red', fontSize: '12px' }}>{errors.postalCode}</div>
      )}
      {/* 黄色提示：API没找到地址且输入已是6位 */}
      {!errors.postalCode && addressError === 'Address not found for this postal code' && (
        <div style={{
          color: '#b8860b',
          background: '#fffbe6',
          fontSize: '12px',
          padding: '8px',
          borderRadius: '6px',
          marginTop: '4px'
        }}>
          Postal code seems not right. Please check and continue.
        </div>
      )}
      {/* 查询中提示 */}
      {addressLoading && (
        <div style={{ fontSize: '12px', color: '#888' }}>Looking up address...</div>
      )}

      {[{ label: 'Block Number', name: 'blockNo' }, { label: 'Street Name', name: 'street' }, { label: 'Building Name (Optional)', name: 'building' }, { label: 'Floor Number', name: 'floor' }, { label: 'Unit Number', name: 'unit' }].map(({ label, name }) => (
        <div key={name}>
          <label style={labelStyle}>{label} {(name !== 'building') && requiredStar}</label>
          <input
            ref={fieldRefs[name]}
            type="text"
            value={form[name]}
            onChange={(e) => {
              setForm({ ...form, [name]: e.target.value });
              updateRegistrationData({ [name]: e.target.value });
              if (e.target.value) setErrors(prev => ({ ...prev, [name]: '' }));
            }}
            style={inputStyle(name)}
            disabled={loading}
          />
          {errors[name] && <div style={{ color: 'red', fontSize: '12px' }}>{errors[name]}</div>}
        </div>
      ))}

      <div className="text-center mt-8">
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold ${loading ? 'bg-gray-300 cursor-not-allowed' : 'hover:bg-blue-700'}`}
        >
          {loading ? 'Submitting...' : 'Next'}
        </button>
      </div>
    </form>
  );
}
