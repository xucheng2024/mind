import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import RegistrationHeader from '../components/RegistrationHeader';
import Compressor from 'compressorjs';

export default function SelfiePage() {
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [capturing, setCapturing] = useState(false);

  const capture = () => {
    setCapturing(true);
    const imageDataUrl = webcamRef.current?.getScreenshot?.();
    if (imageDataUrl) {
      setError('');
      fetch(imageDataUrl)
        .then(res => res.blob())
        .then(blob => {
          new Compressor(blob, {
            quality: 0.6,
            convertSize: 1000000,
            success(result) {
              const reader = new FileReader();
              reader.onloadend = () => {
                setImageSrc(reader.result);
                setCompressedBlob(result);
              };
              reader.readAsDataURL(result);
            },
            error(err) {
              console.error('Compression failed:', err.message);
              setImageSrc(imageDataUrl);
              setCompressedBlob(blob);
            }
          });
        })
        .finally(() => setCapturing(false)); // 保证状态复原
    } else {
      setCapturing(false);
    }
  };

  const handleRetake = () => {
    setImageSrc(null);
    setCompressedBlob(null);
    setError('');
  };

  const handleFinish = async () => {
    if (!imageSrc) {
      setError('Please take a photo');
      return;
    }

    try {
      setUploading(true);
      // 直接存 base64 字符串
      updateRegistrationData({ selfie: imageSrc });
      navigate('/register/submit');
    } catch (err) {
      setError('Failed to save image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="form-container"
      style={{
        height: '100dvh',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        boxSizing: 'border-box'
      }}
    >
      <RegistrationHeader title="Selfie Photo" />

      <p style={{ color: '#1f2d3d', marginBottom: '24px' }}>
        Please take a selfie to help us recognize you in the future.
      </p>

      {!imageSrc ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '220px',
              height: '220px',
              maxWidth: '80vw',
              maxHeight: '80vw',
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#eee',
              margin: '0 auto' // 新增，让圆形摄像头居中
            }}
          >
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'user' }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onUserMediaError={() => setError('Unable to access camera. Please check your browser permissions.')}
            />
          </div>
          <div style={{ marginTop: '24px', width: '100%' }}>
            <button
              onClick={capture}
              disabled={capturing}
              style={{
                backgroundColor: '#1677ff',
                color: '#fff',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              {capturing ? 'Processing...' : 'Take a Photo'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
          <img
            src={imageSrc}
            alt="Your selfie preview"
            style={{
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              objectFit: 'cover',
              marginBottom: '16px'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <button
              onClick={handleRetake}
              style={{
                backgroundColor: '#eee',
                color: '#333',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Retake Photo
            </button>
            <button
              onClick={handleFinish}
              disabled={uploading}
              style={{
                backgroundColor: uploading ? '#ccc' : '#1677ff',
                color: '#fff',
                padding: '14px 0',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                width: '100%',
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? 'Uploading...' : 'Finish'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: 'red', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  );
}
