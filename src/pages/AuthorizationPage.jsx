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

  return (
    <form
      onSubmit={handleSubmit}
      className="form-container min-h-screen flex flex-col"
    >
      <RegistrationHeader title="Guardian Authorization" />

      <p className="text-sm leading-relaxed mb-4">
        If the patient is under 18 or physically/mentally incapacitated, the following must be signed by
        the patient's legal guardian or authorized representative.
      </p>

      <label className="font-semibold block text-sm text-gray-800 mb-0">
        Are you a Guardian or a Representative? <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2 mb-3">
        {[true, false].map((val) => (
          <button
            type="button"
            key={val ? 'YES' : 'NO'}
            className={`px-3 py-1 rounded-full border text-sm font-medium transition
              ${isGuardian === val
                ? 'border-blue-600 bg-blue-50 text-blue-600'
                : 'border-gray-300 bg-white text-gray-800'}`}
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
        <div className="text-red-500 text-xs mt-1">{errors.guardian}</div>
      )}

      <label className="font-semibold mt-4 block text-sm text-gray-800 mb-2">
        Signature of Patient/Guardian or Representative <span className="text-red-500">*</span>
      </label>
      <div
        className={`relative rounded-md mb-2 w-full max-w-md mx-auto overflow-hidden border
          ${errors.signature ? 'border-red-500' : 'border-gray-300'}`}
        style={{
          height: '120px',         // 固定高度
          background: '#fff',
          position: 'relative'
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
              display: 'block',
              margin: 0,         // ✅ 去掉外边距
              padding: 0,        // ✅ 可加
              border: 'none',    // ✅ 保险
            }
          }}
        />
        <button
          type="button"
          aria-label="Clear signature"
          onClick={handleClear}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'transparent',
            border: 'none',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            cursor: 'pointer',
            zIndex: 20,
          }}
        >
          <span style={{ fontWeight: 700, color: '#888', lineHeight: 1 }}>×</span>
        </button>
      </div>
      {submitted && errors.signature && (
        <div className="text-red-500 text-xs bg-red-50 px-2 py-1 rounded mt-1">
          {errors.signature}
        </div>
      )}

      <div className="flex justify-end mt-8">
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg text-lg font-semibold
            ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {loading ? 'Submitting...' : 'Next'}
        </button>
      </div>
    </form>
  );
}
