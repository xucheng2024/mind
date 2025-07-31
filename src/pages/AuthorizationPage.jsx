import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Signature from '@uiw/react-signature';
import { useRegistration } from '../../context/RegistrationContext';
import RegistrationHeader from '../components/RegistrationHeader';
import { EnhancedButton, ProgressBar } from '../components';

export default function AuthorizationPage() {
  const navigate = useNavigate();
  const { updateRegistrationData } = useRegistration();

  const [isGuardian, setIsGuardian] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const signatureRef = useRef();

  const validate = () => {
    const errs = {};
    if (isGuardian === null) errs.guardian = 'Please select an option';
    if (signatureRef.current?.isEmpty?.()) errs.signature = 'Signature is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleClear = () => {
    signatureRef.current?.clear();
    setIsGuardian(null);
    setErrors({});
    updateRegistrationData({ signature: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setSubmitted(true);
    if (!validate()) {
      setLoading(false);
      return;
    }

    const signatureDataUrl = signatureRef.current?.toDataURL?.() || '';

    updateRegistrationData({
      is_guardian: isGuardian,
      signature: signatureDataUrl
    });

    navigate('/register/submit');
  };

  const labelStyle = {
    fontWeight: '600',
    marginTop: '16px',
    display: 'block',
    fontSize: '14px',
    color: '#333'
  };



  return (
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
      <RegistrationHeader title="Guardian Authorization" />
      
      {/* Progress Bar */}
      <ProgressBar 
        currentStep={4} 
        totalSteps={4} 
        steps={['Profile', 'Medical', 'Photo', 'Submit']}
        className="mb-6"
      />

      <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
        If the patient is under 18 or physically/mentally incapacitated, the following must be signed by
        the patient's legal guardian or authorized representative.
      </p>

      <label style={labelStyle}>Are you a Guardian or a Representative? <span style={{ color: 'red' }}>*</span></label>
      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
        {[true, false].map((val) => (
          <button
            type="button"
            key={val ? 'YES' : 'NO'}
            className={`medical-option-button ${isGuardian === val ? 'selected' : ''}`}
            onClick={() => {
              setIsGuardian(val);
              setErrors(prev => ({ ...prev, guardian: '' }));
            }}
          >
            {val ? 'YES' : 'NO'}
          </button>
        ))}
      </div>
      {submitted && errors.guardian && <div style={{ color: 'red', fontSize: '12px' }}>{errors.guardian}</div>}

      <label style={labelStyle}>Signature of Patient/Guardian or Representative <span style={{ color: 'red' }}>*</span></label>
      <div
        style={{
          border: errors.signature ? '1px solid red' : '1px solid #ccc',
          borderRadius: '16px',
          marginBottom: '8px',
          height: '160px',
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: 'white'
        }}
      >
        <Signature
          ref={signatureRef}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '16px',
            background: 'white',
            margin: 0,
            padding: 0
          }}
        />
        <button
          type="button"
          aria-label="Clear signature"
          onClick={handleClear}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            fontWeight: 'bold',
            fontSize: '18px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          ×
        </button>
      </div>
      <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
        By signing, you agree to the{' '}
        <a
          href="/consent-release-indemnity.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#2563eb', textDecoration: 'underline' }}
        >
          Consent & Indemnity Agreement
        </a>.
      </div>
      {submitted && errors.signature && (
        <div style={{
          color: 'red',
          fontSize: '12px',
          background: '#fff0f0',
          padding: '4px 8px',
          borderRadius: '4px',
          marginTop: '4px'
        }}>
          {errors.signature}
        </div>
      )}

      <EnhancedButton
        type="submit"
        loading={loading}
        variant="primary"
        size="lg"
        fullWidth
        className="mt-6"
      >
        {loading ? 'Submitting...' : 'Complete'}
      </EnhancedButton>
    </form>
  );
}
