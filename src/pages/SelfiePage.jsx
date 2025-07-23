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
  const [agreed, setAgreed] = useState(false);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!imageSrc) {
      setError('Please take a selfie first.');
      return;
    }
    updateRegistrationData({ selfie: imageSrc });
    navigate('/register/authorize');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in">
        <RegistrationHeader title="Face Capture" />

        {!imageSrc ? (
          <div className="flex flex-col items-center mb-4">
            <div className="w-[220px] h-[220px] max-w-[80vw] max-h-[80vw] rounded-full overflow-hidden flex justify-center items-center bg-gray-100 mx-auto border-4 border-blue-100 shadow-inner">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user' }}
                className="w-full h-full object-cover rounded-full"
                onUserMediaError={() => setError('Unable to access camera. Please check your browser permissions.')}
              />
            </div>
            <button
              onClick={capture}
              disabled={capturing}
              className={`w-full h-14 mt-8 rounded-xl text-lg font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 ${capturing ? 'bg-gray-300 cursor-not-allowed shadow-none transform-none' : ''}`}
            >
              {capturing ? 'Processing...' : 'Take a Photo'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-4">
            <img
              src={imageSrc}
              alt="Your selfie preview"
              className="w-[220px] h-[220px] rounded-full object-cover mb-6 border-4 border-blue-100 shadow-inner"
            />
            <div className="flex flex-col space-y-3 w-full">
              <button
                onClick={handleRetake}
                type="button"
                className="w-full h-12 rounded-xl text-lg font-semibold bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
              >
                Retake Photo
              </button>
              <form onSubmit={handleSubmit} className="w-full">
                <button
                  type="submit"
                  className="w-full h-12 rounded-xl text-lg font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                  disabled={uploading}
                >
                  Next
                </button>
              </form>
            </div>
          </div>
        )}
        {error && <div style={{ color: 'red', marginBottom: 8, fontSize: '0.97em' }}>{error}</div>}
      </div>
    </div>
  );
}
