import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import RegistrationHeader from '../components/RegistrationHeader';
import { EnhancedButton, ProgressBar } from '../components';

const healthItems = [
  'HeartDisease', 'Diabetes', 'Hypertension', 'Cancer', 'Asthma',
  'MentalIllness', 'Epilepsy', 'Stroke', 'KidneyDisease', 'LiverDisease'
];

export default function MedicalPage() {
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [form, setForm] = useState(() => {
    const initial = {};
    healthItems.forEach(item => {
      initial[item] = registrationData[item] || ''; // 初始不选
    });
    initial.otherHealthNotes = '';
    return initial;
  });

  const [error, setError] = useState('');
  const [optionErrors, setOptionErrors] = useState({});

  useEffect(() => {
    // 从registrationData恢复表单数据，而不是清空
    const restored = {};
    healthItems.forEach(item => { 
      restored[item] = registrationData[item] || ''; 
    });
    restored.otherHealthNotes = registrationData.otherHealthNotes || '';
    setForm(restored);
  }, [registrationData]);

  useEffect(() => {
    // Check if clinic_id exists
    if (!registrationData.clinic_id) {
      console.error('Missing clinic_id in MedicalPage');
    }
  }, [registrationData]);

  const handleSelect = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user makes a selection
    if (optionErrors[field]) {
      setOptionErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatSGTime = () => {
    const now = new Date();
    // 新加坡时间
    const sgTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const yyyy = sgTime.getFullYear();
    const MM = String(sgTime.getMonth() + 1).padStart(2, '0');
    const dd = String(sgTime.getDate()).padStart(2, '0');
    const hh = String(sgTime.getHours()).padStart(2, '0');
    const mm = String(sgTime.getMinutes()).padStart(2, '0');
    const ss = String(sgTime.getSeconds()).padStart(2, '0');
    return `${yyyy}/${MM}/${dd} ${hh}:${mm}:${ss}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    for (const item of healthItems) {
      if (!form[item]) {
        errs[item] = `Please select an option for ${item.replace(/([A-Z])/g, ' $1')}`;
      }
    }
    setOptionErrors(errs);
    if (Object.keys(errs).length > 0) {
      // 自动滚动到第一个错误
      const firstErrorKey = healthItems.find(item => errs[item]);
      const el = document.getElementById(`option-${firstErrorKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setError('');

    // 只在点击 Next 时处理备注内容
    const prefix = formatSGTime();
    let notes = form.otherHealthNotes && form.otherHealthNotes.trim() ? form.otherHealthNotes.trim() : '';
    if (!notes) {
      notes = 'None reported';
    } else {
      notes = `${prefix}: ${notes}`;
    }
    updateRegistrationData({ ...form, otherHealthNotes: notes });
    navigate('/register/selfie');
  };

  const labelStyle = {
    fontWeight: '600',
    marginTop: '12px',
    display: 'block',
    fontSize: '14px',
    color: '#333',
    marginBottom: '8px'
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      padding: '16px',
      fontFamily: 'Arial',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      minHeight: '100vh',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <form
       onSubmit={handleSubmit} 
       style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          padding: '16px',
          fontFamily: 'Arial',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          minHeight: '100vh',
          boxSizing: 'border-box'
       }}
      
      >
        <RegistrationHeader title="Health Declaration" />
        
        {/* Progress Bar */}
        <ProgressBar 
          currentStep={2} 
          totalSteps={4} 
          steps={['Profile', 'Medical', 'Selfie', 'Submit']}
          className="mb-6"
        />

        {healthItems.map(item => (
          <div key={item} id={`option-${item}`} style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>
              {item.replace(/([A-Z])/g, ' $1')} <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['YES', 'NO', 'UNSURE'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`medical-option-button ${form[item] === opt ? 'selected' : ''}`}
                  onClick={() => handleSelect(item, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {optionErrors[item] && (
              <div style={{
                color: '#dc2626',
                fontSize: '12px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {optionErrors[item]}
              </div>
            )}
          </div>
        ))}

        <div>
          <label style={labelStyle}>
            Other Health Notes (if any)
          </label>
          <textarea
            value={form.otherHealthNotes}
            onChange={(e) => setForm({ ...form, otherHealthNotes: e.target.value })}
            className="medical-textarea"
            placeholder="e.g. Allergies, previous surgeries, medications..."
          />
        </div>

        {error && (
          <div style={{
            color: '#dc2626',
            background: '#fff0f0',
            padding: '8px 12px',
            borderRadius: '6px',
            marginBottom: '12px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <EnhancedButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          className="mt-6"
        >
          Next
        </EnhancedButton>
      </form>
    </div>
  );
}

