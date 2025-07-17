import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import RegistrationHeader from '../components/RegistrationHeader';

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
      initial[item] = registrationData[item] || 'NO'; // 默认NO
    });
    initial.otherHealthNotes = registrationData.otherHealthNotes || '';
    return initial;
  });

  const [error, setError] = useState('');
  const [optionErrors, setOptionErrors] = useState({});

  useEffect(() => {
    console.log('✅ MedicalPage mounted');
  }, []);

  const handleSelect = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
    updateRegistrationData(form);
    navigate('/register/authorize');
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
    <div className="form-container" style={{
      height: '100dvh',
      minHeight: '100dvh',
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

        {healthItems.map(item => (
          <div key={item} id={`option-${item}`}>
            <label style={labelStyle}>
              {item.replace(/([A-Z])/g, ' $1')}
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
                marginTop: '4px'
              }}>
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
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <button type="submit" style={{
          backgroundColor: '#1677ff',
          color: '#fff',
          padding: '14px 0',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          width: '100%',
          marginTop: '24px'
        }}>
          Next
        </button>
      </form>
    </div>
  );
}

