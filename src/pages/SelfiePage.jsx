import React, { useRef, useState, useEffect } from 'react';
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
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);

  // 检查相机权限
  useEffect(() => {
    console.log('🎥 Checking camera permission...');
    async function checkCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('✅ Camera permission granted');
        setHasCamera(true);
        setError('');
        // 记得关闭流
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('❌ Camera error:', err);
        setHasCamera(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera access denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera found. Please make sure your device has a camera.');
        } else {
          setError('Unable to access camera. Please check your browser permissions.');
        }
      } finally {
        setCameraLoading(false);
      }
    }
    checkCamera();
  }, []);

  const capture = () => {
    setCapturing(true);
    console.log('📸 Taking photo...');
    const imageDataUrl = webcamRef.current?.getScreenshot?.();
    if (imageDataUrl) {
      setError('');
      fetch(imageDataUrl)
        .then(res => res.blob())
        .then(blob => {
          console.log('🖼️ Compressing image...');
          new Compressor(blob, {
            quality: 0.6,
            convertSize: 1000000,
            success(result) {
              console.log('✅ Image compressed successfully');
              const reader = new FileReader();
              reader.onloadend = () => {
                setImageSrc(reader.result);
                setCompressedBlob(result);
              };
              reader.readAsDataURL(result);
            },
            error(err) {
              console.error('❌ Compression failed:', err.message);
              setImageSrc(imageDataUrl);
              setCompressedBlob(blob);
            }
          });
        })
        .finally(() => setCapturing(false));
    } else {
      console.error('❌ Failed to take photo');
      setError('Failed to take photo. Please try again.');
      setCapturing(false);
    }
  };

  const handleRetake = () => {
    console.log('🔄 Retaking photo...');
    setImageSrc(null);
    setCompressedBlob(null);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('📤 Submitting photo...');
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

        {cameraLoading ? (
          <div className="flex flex-col items-center justify-center h-[220px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <div className="mt-4 text-gray-600">Checking camera access...</div>
          </div>
        ) : !hasCamera ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-center">
            <div className="text-red-500 mb-4">⚠️ Camera not available</div>
            <div className="text-gray-600">{error}</div>
          </div>
        ) : !imageSrc ? (
          <div className="flex flex-col items-center mb-4">
            <div className="w-[220px] h-[220px] max-w-[80vw] max-h-[80vw] rounded-full overflow-hidden flex justify-center items-center bg-gray-100 mx-auto border-4 border-blue-100 shadow-inner">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user' }}
                className="w-full h-full object-cover rounded-full"
                onUserMediaError={(err) => {
                  console.error('❌ Camera error:', err);
                  setError('Unable to access camera. Please check your browser permissions.');
                  setHasCamera(false);
                }}
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
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mt-4 text-center border border-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
