import React, { useRef, useState, useEffect } from 'react';
import { Camera } from 'react-html5-camera-photo';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import RegistrationHeader from '../components/RegistrationHeader';
import Compressor from 'compressorjs';

export default function SelfiePage() {
  const cameraRef = useRef(null);
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
  const [cameraReady, setCameraReady] = useState(false);

  // 检查相机权限 - PWA优化版本
  const checkCamera = async () => {
    console.log('🎥 Checking camera permission...');
    try {
      // 先检查是否支持getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      // PWA环境下使用更简单的相机配置
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        }
      };

      console.log('🎥 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Camera permission granted');
      setHasCamera(true);
      setError('');
      
      // 立即关闭流，避免占用相机
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('🎥 Camera stream stopped');
        });
      }
    } catch (err) {
      console.error('❌ Camera error:', err);
      setHasCamera(false);
      
      let errorMessage = 'Unable to access camera. Please check your browser permissions and try again.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera access denied. Please allow camera access in your browser settings and refresh the page.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please make sure your device has a camera.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser. Please try a different browser.';
      } else if (err.message === 'Camera API not supported') {
        errorMessage = 'Camera not supported in this browser. Please try a different browser.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is in use by another application. Please close other apps using the camera and try again.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setCameraLoading(false);
    }
  };

  useEffect(() => {
    // 检测是否在PWA环境中
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true;
    console.log('📱 PWA mode:', isPWA);
    
    // 在PWA环境下添加延迟，确保Service Worker完全加载
    if (isPWA) {
      console.log('📱 PWA detected, adding delay for camera initialization...');
      setTimeout(() => {
        checkCamera();
      }, 1000);
    } else {
      checkCamera();
    }
  }, []);

  const capture = () => {
    setCapturing(true);
    console.log('📸 Taking photo...');
    
    // Add a small delay to ensure camera is fully ready
    setTimeout(() => {
      if (cameraRef.current) {
        try {
          const image = cameraRef.current.takePhoto();
          console.log('📸 Photo taken:', image ? 'Success' : 'Failed');
          
          if (image) {
            setError('');
            console.log('📸 Starting image processing...');
            
            // Convert base64 to blob
            fetch(image)
              .then(res => {
                console.log('📸 Fetch response:', res);
                return res.blob();
              })
              .then(blob => {
                console.log('📸 Blob created:', blob.size, 'bytes');
                console.log('🖼️ Compressing image...');
                new Compressor(blob, {
                  quality: 0.6,
                  convertSize: 1000000,
                  success(result) {
                    console.log('✅ Image compressed successfully:', result.size, 'bytes');
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      console.log('✅ Image converted to data URL');
                      setImageSrc(reader.result);
                      setCompressedBlob(result);
                    };
                    reader.readAsDataURL(result);
                  },
                  error(err) {
                    console.error('❌ Compression failed:', err.message);
                    console.log('📸 Using original image without compression');
                    setImageSrc(image);
                    setCompressedBlob(blob);
                  }
                });
              })
              .catch(err => {
                console.error('❌ Image processing failed:', err);
                setError('Failed to process image. Please try again.');
              })
              .finally(() => {
                console.log('📸 Photo capture process completed');
                setCapturing(false);
              });
          } else {
            console.error('❌ Failed to take photo');
            setError('Failed to take photo. Please try again.');
            setCapturing(false);
          }
        } catch (error) {
          console.error('❌ Camera capture error:', error);
          setError('Camera error. Please try again.');
          setCapturing(false);
        }
      } else {
        console.error('❌ Camera ref not available');
        setError('Camera not ready. Please wait and try again.');
        setCapturing(false);
      }
    }, 500); // Add 500ms delay to ensure camera is ready
  };

  const handleRetake = () => {
    console.log('🔄 Retaking photo...');
    setImageSrc(null);
    setCompressedBlob(null);
    setError('');
    setCameraReady(false); // Reset camera ready state
  };

  const handleRetryCamera = () => {
    console.log('🔄 Retrying camera...');
    setError('');
    setCameraLoading(true);
    setCameraReady(false);
    
    // 检测是否在PWA环境中
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true;
    
    // 在PWA环境下添加延迟
    if (isPWA) {
      setTimeout(() => {
        checkCamera();
      }, 500);
    } else {
      checkCamera();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('📤 Submitting photo...');
    if (!imageSrc) {
      setError('Please take a selfie first.');
      return;
    }
    
    console.log('📸 Saving selfie to registration data...');
    updateRegistrationData({ selfie: imageSrc });
    
    console.log('🚀 Navigating to authorization page...');
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
            <div className="text-gray-600 mb-4 text-sm">{error}</div>
            <div className="text-gray-400 mb-4 text-xs">
              {window.matchMedia('(display-mode: standalone)').matches ? 
                'PWA Mode detected' : 'Browser Mode'}
            </div>
            <button
              onClick={handleRetryCamera}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Camera
            </button>
          </div>
        ) : !imageSrc ? (
          <div className="flex flex-col items-center mb-4">
            <div className="w-[220px] h-[220px] max-w-[80vw] max-h-[80vw] rounded-full overflow-hidden flex justify-center items-center bg-gray-100 mx-auto border-4 border-blue-100 shadow-inner">
              <Camera
                ref={cameraRef}
                aspectRatio={1}
                facingMode="user"
                idealResolution={{ width: 640, height: 480 }}
                errorMessages={{
                  noCameraAccessible: 'No camera accessible',
                  permissionDenied: 'Permission denied',
                  switchCamera: 'Switch camera',
                  canvas: 'Canvas is not supported'
                }}
                videoReadyCallback={() => {
                  console.log('✅ Camera video ready');
                  setCameraReady(true);
                }}
                videoErrorCallback={(error) => {
                  console.error('❌ Camera video error:', error);
                  setError('Camera error. Please check permissions.');
                  setCameraReady(false);
                }}
                onTakePhotoAnimationDone={() => {
                  console.log('📸 Photo animation completed');
                }}
              />
            </div>
            <button
              onClick={capture}
              disabled={capturing || !cameraReady}
              className={`w-full h-14 mt-8 rounded-xl text-lg font-semibold transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 ${(capturing || !cameraReady) ? 'bg-gray-300 cursor-not-allowed shadow-none transform-none' : ''}`}
            >
              {capturing ? 'Processing...' : !cameraReady ? 'Camera Loading...' : 'Take a Photo'}
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
