import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Signature from '@uiw/react-signature';
import { useRegistration } from '../../context/RegistrationContext';
import RegistrationHeader from '../components/RegistrationHeader';
import { EnhancedButton, ProgressBar, Confetti, useHapticFeedback } from '../components';
import { apiClient } from '../lib/api';
import { prepareImageForUpload } from '../lib/imageUtils';

export default function AuthorizationPage() {
  const navigate = useNavigate();
  const { updateRegistrationData } = useRegistration();
  const { trigger: hapticTrigger } = useHapticFeedback();

  const [isGuardian, setIsGuardian] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || uploading) return;
    
    setLoading(true);
    setSubmitted(true);
    if (!validate()) {
      setLoading(false);
      return;
    }

    // 尝试获取签名数据
    let signatureDataUrl = '';
    try {
      const svgData = signatureRef.current?.svg;
      if (svgData) {
        const svgString = new XMLSerializer().serializeToString(svgData);
        signatureDataUrl = 'data:image/svg+xml;base64,' + btoa(svgString);
      }
    } catch (error) {
      console.error('❌ Error getting signature data:', error);
    }
    
    // 检查签名是否为空
    const hasSignature = signatureDataUrl && signatureDataUrl.length > 22;
    
    if (!hasSignature) {
      setErrors(prev => ({ ...prev, signature: 'Signature is required. Please sign in the box above.' }));
      setLoading(false);
      return;
    }

    setUploading(true);
    setLoading(false);
    
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `signature_${timestamp}.enc`;
      

      
      // Convert signature to blob
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();

      // Compress and prepare signature for upload using frontend compression
      const { base64, compressionRatio, originalSize, compressedSize } = await prepareImageForUpload(
        blob, 
        filename,
        {
          maxSizeMB: 0.2, // Aggressive compression for signatures
          maxWidthOrHeight: 500, // Smaller size for signatures
          quality: 0.5, // Lower quality for better compression
          fileType: 'image/jpeg',
          useWebWorker: true
        }
      );
      
      console.log(`🖊️ Signature compression completed: ${compressionRatio} reduction (${(originalSize/1024).toFixed(2)}KB → ${(compressedSize/1024).toFixed(2)}KB)`);

      // Upload compressed signature through server API (server handles encryption)
      const uploadResult = await apiClient.uploadFile('signatures', filename, base64, 'image/jpeg');
      
      if (!uploadResult.success) {
        throw new Error('Upload failed');
      }
      
      // Verify file exists by listing files
      const listResult = await apiClient.listFiles('signatures', 100, filename);
      if (!listResult.success || !listResult.data?.find(file => file.name === filename)) {
        throw new Error('Upload verification failed');
      }
      
      // Get decrypted file URL from server (server handles decryption)
      const decryptedUrl = apiClient.getDecryptedFileUrl('signatures', filename);

      hapticTrigger('success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      

      updateRegistrationData({
        is_guardian: isGuardian,
        signature: signatureDataUrl, // 本地预览用
        signatureUrl: decryptedUrl, // Server-side decrypted URL
        signatureFilename: filename, // 文件名
        signatureSignedUrl: true
      });
      
      navigate('/register/submit');
      
    } catch (err) {
      console.error('Error uploading signature:', err);
      setErrors(prev => ({ ...prev, signature: `Failed to upload signature: ${err.message}` }));
      hapticTrigger('error');
    } finally {
      setUploading(false);
    }
  };

  const labelStyle = {
    fontWeight: '600',
    marginTop: '16px',
    display: 'block',
    fontSize: '14px',
    color: '#333'
  };



  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Confetti isActive={showConfetti} />
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in"
      >
      <RegistrationHeader title="Guardian Authorization" />
      
      {/* Progress Bar */}
      <ProgressBar 
        currentStep={4} 
        totalSteps={4} 
        steps={['Profile', 'Medical', 'Selfie', 'Submit']}
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

      <div className="flex gap-3 mt-6">
        <EnhancedButton
          type="submit"
          loading={loading || uploading}
          variant="primary"
          size="lg"
          fullWidth
        >
          {uploading ? 'Uploading...' : loading ? 'Submitting...' : 'Complete'}
        </EnhancedButton>
      </div>
    </form>
    </div>
  );
}
