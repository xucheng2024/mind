import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { useRegistration } from '../../context/RegistrationContext';
import RegistrationHeader from '../components/RegistrationHeader';

export default function AuthorizationPage() {
  const navigate = useNavigate();
  const { updateRegistrationData } = useRegistration();

  const [isGuardian, setIsGuardian] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const sigCanvasRef = useRef();

  const validate = () => {
    const errs = {};
    if (isGuardian === null) errs.guardian = 'Please select an option';
    if (sigCanvasRef.current?.isEmpty?.()) errs.signature = 'Signature is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleClear = () => {
    sigCanvasRef.current?.clear();
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

    const signatureDataUrl = sigCanvasRef.current.getCanvas().toDataURL('image/png');

    updateRegistrationData({
      is_guardian: isGuardian,
      signature: signatureDataUrl
    });

    navigate('/register/selfie');
  };

  const labelStyle = {
    fontWeight: '600',
    marginTop: '16px',
    display: 'block',
    fontSize: '14px',
    color: '#333'
  };

  const buttonStyle = (active) => ({
    padding: '6px 14px',
    borderRadius: '20px',
    border: `1px solid ${active ? '#1677ff' : '#ccc'}`,
    backgroundColor: active ? '#e6f0ff' : '#fff',
    color: active ? '#1677ff' : '#333',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  });

  return (
    <form
      onSubmit={handleSubmit}
      className="form-container"
      style={{
        height: '100dvh',
        minHeight: '100dvh',
        overflowY: 'auto'
      }}
    >
      <RegistrationHeader title="Guardian Authorization" />

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
            style={buttonStyle(isGuardian === val)}
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
          borderRadius: '6px',
          marginBottom: '8px',
          height: window.innerWidth < 600 ? '300px' : '220px',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <SignatureCanvas
          ref={sigCanvasRef}
          penColor="black"
          backgroundColor="#fff"
          canvasProps={{
            style: {
              width: '100%',
              height: '100%',
              display: 'block'
            }
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a
          href="/consent"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '13px', color: '#1677ff', textDecoration: 'underline' }}
        >
          Consent, Release & Indemnity Agreement
        </a>
        <button
          type="button"
          aria-label="Clear signature"
          onClick={handleClear}
          style={{ fontSize: '13px', color: '#888', border: 'none', background: 'none', cursor: 'pointer' }}
        >
          Clear
        </button>
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: loading ? '#ccc' : '#1677ff',
            color: '#fff',
            padding: '14px 32px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            width: '100%',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Submitting...' : 'Next'}
        </button>
      </div>
    </form>
  );
}
