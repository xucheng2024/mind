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

  const handleNext = (e) => {
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
      signature: signatureDataUrl,
    });

    navigate('/register/submit');
  };

  return (
    <form
      onSubmit={handleNext}
      className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in">
        <RegistrationHeader title="Guardian Authorization" />

        <p className="text-base text-gray-600 leading-relaxed mb-6">
          If the patient is under 18 or physically/mentally incapacitated, the following must be signed by the patient's legal guardian or authorized representative.
        </p>

        <label className="block text-base font-medium text-gray-700 mb-2">
          Are you a Guardian or a Representative? <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3 mb-4">
          {[true, false].map((val) => (
            <button
              type="button"
              key={val ? 'Yes' : 'No'}
              className={`px-7 py-2 rounded-full border text-base font-semibold transition-all
                ${isGuardian === val
                  ? 'border-blue-600 bg-blue-50 text-blue-600 shadow'
                  : 'border-gray-300 bg-white text-gray-800 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600'}
                focus:outline-none`}
              onClick={() => {
                setIsGuardian(val);
                setErrors(prev => ({ ...prev, guardian: '' }));
              }}
            >
              {val ? 'YES' : 'NO'}
            </button>
          ))}
        </div>
        {submitted && errors.guardian && (
          <div className="text-red-600 text-xs mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1 animate-shake">
            {errors.guardian}
          </div>
        )}

        <label className="block text-base font-medium text-gray-700 mt-6 mb-2">
          Signature of Patient/Guardian or Representative <span className="text-red-500">*</span>
        </label>
        <div
          className={`relative rounded-2xl mb-2 w-full overflow-hidden border ${errors.signature ? 'border-red-500' : 'border-gray-300'} bg-gray-50`}
          style={{ height: '160px', background: '#f9fafb', position: 'relative' }}
        >
          <SignatureCanvas
            ref={sigCanvasRef}
            penColor="#2563eb"
            backgroundColor="#f9fafb"
            canvasProps={{
              style: {
                width: '100%',
                height: '100%',
                display: 'block',
                margin: 0,
                padding: 0,
                border: 'none',
                borderRadius: '1rem',
                background: '#f9fafb',
              }
            }}
          />
          <button
            type="button"
            aria-label="Clear signature"
            onClick={handleClear}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 700,
              color: '#2563eb',
              cursor: 'pointer',
              zIndex: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              margin: 0,
              padding: 0,
              transition: 'background 0.2s'
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseOut={e => (e.currentTarget.style.background = '#fff')}
          >
            ×
          </button>
        </div>
        {submitted && errors.signature && (
          <div className="text-red-600 text-xs mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1 animate-shake">
            {errors.signature}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full h-14 rounded-xl text-lg font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 mt-6 ${loading ? 'bg-gray-300 cursor-not-allowed shadow-none transform-none' : ''}`}
        >
          {loading ? 'Submitting...' : 'Complete'}
        </button>
        <div style={{ fontSize: '0.92em', color: '#555', margin: '16px 0 8px 0', textAlign: 'center' }}>
          By clicking <strong>Complete</strong>, you confirm that you have read and agree to the
          <a
            href="/consent-release-indemnity.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2563eb', textDecoration: 'underline', marginLeft: 4 }}
          >
            Consent & Indemnity Agreement
          </a>.
        </div>
      </div>
    </form>
  );
}
