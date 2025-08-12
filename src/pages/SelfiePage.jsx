import React, { useRef, useState, useEffect } from 'react';
import { Camera } from 'react-camera-pro';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import RegistrationHeader from '../components/RegistrationHeader';
import { apiClient } from '../lib/api';
import { prepareImageForUpload } from '../lib/imageUtils';
import { 
  EnhancedButton, 
  CheckboxInput, 
  useHapticFeedback,
  LoadingSpinner,
  Confetti,
  ProgressBar
} from '../components';

// Native image compression function
const compressImage = async (file) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (60% of original size)
      const maxWidth = img.width * 0.6;
      const maxHeight = img.height * 0.6;
      
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
      canvas.toBlob(resolve, 'image/jpeg', 0.6);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

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
  const [fileInputRef] = useState(() => React.createRef());
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trigger: hapticTrigger } = useHapticFeedback();

  // 检查相机权限 - 简化版本
  const checkCamera = async () => {
    try {
      // 检查是否支持getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not supported');
        throw new Error('Camera API not supported');
      }

      // 标准相机配置
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setHasCamera(true);
      setCameraReady(true); // 直接设置相机为ready状态
      setError('');
      
      // 立即关闭流，避免占用相机
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
    } catch (err) {
      console.error('Camera error:', err);
      setHasCamera(false);
      
      let errorMessage = 'Unable to access camera. Please check your browser permissions and try again.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera access denied. Please allow camera access in your browser settings and refresh the page.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please make sure your device has a camera.';
      } else if (err.name === 'NotSupportedError') {
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
    // 直接检查相机，不需要延迟
    checkCamera();
  }, []);

  // 拍照逻辑改为用 react-camera-pro
  const capture = () => {
    hapticTrigger('medium');
    setCapturing(true);
    if (!cameraRef.current) {
      console.error('Camera ref not available');
      setError('Camera not ready. Please wait and try again.');
      setCapturing(false);
      return;
    }
    try {
      const image = cameraRef.current.takePhoto();
      if (image) {
        setError('');
        // base64 to blob
        fetch(image)
          .then(res => res.blob())
          .then(async blob => {
            try {
              const compressedBlob = await compressImage(blob);
              const reader = new FileReader();
              reader.onloadend = () => {
                setImageSrc(reader.result);
                setCompressedBlob(compressedBlob);
              };
              reader.readAsDataURL(compressedBlob);
            } catch (err) {
              // Fallback to original image if compression fails
              setImageSrc(image);
              setCompressedBlob(blob);
            }
          })
          .catch(err => {
            setError('Failed to process image. Please try again.');
          })
          .finally(() => setCapturing(false));
      } else {
        setError('Failed to take photo. Please try again.');
        setCapturing(false);
      }
    } catch (error) {
      setError('Camera error. Please try again.');
      setCapturing(false);
    }
  };



  const handleRetake = () => {
    hapticTrigger('light');
    setImageSrc(null);
    setCompressedBlob(null);
    setError('');
    setCameraReady(false); // Reset camera ready state
  };

  const handleRetryCamera = () => {
    setError('');
    setCameraLoading(true);
    setCameraReady(false);
    
    // 直接检查相机，不需要延迟
    checkCamera();
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log('Form submission already in progress, ignoring duplicate request');
      return;
    }
    
    if (!imageSrc) {
      setError('Please take a selfie first.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setUploading(true);
      setError('');
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `selfie_${timestamp}.enc`;
      
      // Use compressed blob if available, otherwise convert base64 to blob
      let uploadBlob = compressedBlob;
      if (!uploadBlob && imageSrc) {
        // Convert base64 to blob
        const response = await fetch(imageSrc);
        uploadBlob = await response.blob();
      }
      
      if (!uploadBlob) {
        throw new Error('No image data available for upload');
      }
      
      // Convert already compressed blob to base64 (compression already done by native compressImage)
      const reader = new FileReader();
      const base64 = await new Promise((resolve) => {
        reader.onloadend = () => {
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(uploadBlob);
      });
      
      console.log(`🖼️ Using native compression: ${(uploadBlob.size/1024).toFixed(2)}KB`);

      // Upload compressed image through server API (server handles encryption)
      const uploadResult = await apiClient.uploadFile('selfies', filename, base64, 'image/jpeg');
      
      if (!uploadResult.success) {
        throw new Error('Upload failed');
      }
      
      // Verify file exists by listing files
      const listResult = await apiClient.listFiles('selfies', 100, filename);
      if (!listResult.success || !listResult.data?.find(file => file.name === filename)) {
        throw new Error('Upload verification failed');
      }
      
      // Get signed URL from server (有时效性的安全URL)
      const signedUrlResult = await apiClient.getSignedUrl('selfies', filename, 94608000); // 3年过期 (3*365*24*3600)
      const signedUrl = signedUrlResult.data.signedUrl;
      
      console.log('✅ 获取到selfie的signed URL:', {
        expires: signedUrlResult.data.expiresAt,
        filename: filename
      });

      hapticTrigger('success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      updateRegistrationData({ 
        selfie: imageSrc, // 本地预览用
        selfieUrl: signedUrl, // Signed URL，submit时统一加密
        selfieFilename: filename, // 文件名
        selfieSignedUrl: true,
        selfieExpiresAt: signedUrlResult.data.expiresAt // 过期时间
      });
      
      navigate('/register/authorize');
      
    } catch (err) {
      console.error('Error uploading selfie:', err);
      setError(`Failed to upload selfie: ${err.message}`);
      hapticTrigger('error');
    } finally {
      setUploading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Confetti isActive={showConfetti} />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in">
        <RegistrationHeader title="Face Capture" />
        
        {/* Progress Bar */}
        <ProgressBar 
          currentStep={3} 
          totalSteps={4} 
          steps={['Profile', 'Medical', 'Selfie', 'Submit']}
          className="mb-6"
        />

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
              User Agent: {navigator.userAgent.substring(0, 50)}...
            </div>
            <EnhancedButton
              onClick={handleRetryCamera}
              variant="primary"
              size="md"
            >
              Retry Camera
            </EnhancedButton>
          </div>
        ) : !imageSrc ? (
          <div className="flex flex-col items-center mb-4">
            <div className="w-[220px] h-[220px] max-w-[80vw] max-h-[80vw] rounded-full overflow-hidden flex justify-center items-center bg-gray-100 mx-auto border-4 border-blue-100 shadow-inner">
              <Camera
                ref={cameraRef}
                facingMode="user"
                aspectRatio={1}
                onCameraStart={() => {
                  setCameraReady(true);
                  setCameraLoading(false);
                  setError('');
                }}
                onCameraError={err => {
                  setError('Camera error. Please check permissions and try again.');
                  setCameraReady(false);
                  setCameraLoading(false);
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full flex flex-col items-center">
              <EnhancedButton
                onClick={capture}
                disabled={capturing || !cameraReady}
                loading={capturing}
                fullWidth
                size="lg"
                variant="primary"
                className="mt-8"
              >
                {!cameraReady ? 'Camera Loading...' : 'Take a Photo'}
              </EnhancedButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-4">
            <img
              src={imageSrc}
              alt="Your selfie preview"
              className="w-[220px] h-[220px] rounded-full object-cover mb-6 border-4 border-blue-100 shadow-inner"
            />
            <div className="flex flex-col space-y-3 w-full">
              <EnhancedButton
                onClick={handleRetake}
                variant="secondary"
                fullWidth
                size="lg"
              >
                Retake Photo
              </EnhancedButton>
              <form onSubmit={handleSubmit} className="w-full">
                <EnhancedButton
                  type="submit"
                  loading={uploading}
                  fullWidth
                  size="lg"
                  variant="primary"
                >
                  {uploading ? 'Uploading...' : 'Next'}
                </EnhancedButton>
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