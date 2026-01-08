import React, { useRef, useState, useEffect } from 'react';
import { Camera } from 'react-camera-pro';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';
import RegistrationHeader from '../components/RegistrationHeader';
import { apiClient } from '../lib/api';
import { prepareImageForUpload, fileToBase64 } from '../lib/imageUtils';
import { 
  EnhancedButton, 
  useHapticFeedback,
  Confetti,
  ProgressBar
} from '../components';


export default function SelfiePage() {
  const cameraRef = useRef(null);
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trigger: hapticTrigger } = useHapticFeedback();
  const submittedRef = useRef(false); // Add debounce ref
  const cameraKeyRef = useRef(0); // Key for Camera component remount
  const objectUrlRef = useRef(null); // Track object URLs for cleanup

  // Check camera permissions - simplified version
  const checkCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not supported');
        throw new Error('Camera API not supported');
      }

      // Standard camera configuration
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setHasCamera(true);
      setCameraReady(true); // Set camera to ready state directly
      setError('');
      
      // Close stream immediately to avoid occupying camera
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
    // Check camera directly, no delay needed
    checkCamera();
    
    // Cleanup function
    return () => {
      // Cleanup object URLs
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Take photo logic using react-camera-pro
  const capture = async () => {
    hapticTrigger('medium');
    setCapturing(true);
    setError('');
    
    if (!cameraRef.current) {
      console.error('Camera ref not available');
      setError('Camera not ready. Please wait and try again.');
      setCapturing(false);
      return;
    }
    
    try {
      const image = cameraRef.current.takePhoto();
      if (!image) {
        console.error('takePhoto returned null');
        setError('Failed to take photo. Please try again.');
        setCapturing(false);
        return;
      }

      setError('');
      
      // Convert base64 to blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      // Cleanup previous object URL if exists
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      
      // Compress image using utility function
      const filename = `selfie_${Date.now()}.jpg`;
      const { compressedFile } = await prepareImageForUpload(
        blob,
        filename,
        {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          quality: 0.7,
          fileType: 'image/jpeg',
          useWebWorker: true
        }
      );
      
      // Create preview URL from compressed file
      const previewUrl = URL.createObjectURL(compressedFile);
      objectUrlRef.current = previewUrl;
      
      setImageSrc(previewUrl);
      setCompressedBlob(compressedFile);
      setCapturing(false);
      
    } catch (error) {
      console.error('Capture error:', error);
      setError('Failed to process image. Please try again.');
      setCapturing(false);
    }
  };



  const handleRetake = () => {
    hapticTrigger('light');
    
    // Cleanup object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    
    setImageSrc(null);
    setCompressedBlob(null);
    setError('');
    setCapturing(false); // Reset capturing state
    
    // Force Camera remount by changing key
    // If camera is already available, keep cameraReady true to avoid showing loading
    // Camera will reinitialize and onCameraStart will be called to confirm it's ready
    if (hasCamera) {
      // Keep cameraReady true - Camera will quickly reinitialize via key change
      // onCameraStart will be called again to confirm
      cameraKeyRef.current += 1;
    } else {
      // Camera not available, reset state
      setCameraReady(false);
      cameraKeyRef.current += 1;
    }
  };

  const handleRetryCamera = () => {
    setError('');
    setCameraLoading(true);
    setCameraReady(false);
    
    // Check camera directly, no delay needed
    checkCamera();
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Debounce check - prevent multiple submissions
    if (submittedRef.current || isSubmitting) {
      return;
    }
    
    submittedRef.current = true; // Set debounce flag
    
    if (!imageSrc) {
      setError('Please take a selfie first.');
      submittedRef.current = false; // Reset debounce flag on validation failure
      return;
    }
    
    try {
      setIsSubmitting(true);
      setUploading(true);
      setError('');
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `selfie_${timestamp}.enc`;
      
      // Use compressed blob if available
      if (!compressedBlob) {
        throw new Error('No image data available for upload');
      }
      
      // Convert compressed blob to base64 using utility function
      const base64 = await fileToBase64(compressedBlob);
      
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
      
      hapticTrigger('success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      updateRegistrationData({ 
        selfie: imageSrc, // Local preview
        selfieUrl: signedUrl, // Signed URL, unified encryption for submission
        selfieFilename: filename, // File name
        selfieSignedUrl: true,
        selfieExpiresAt: signedUrlResult.data.expiresAt // Expiration time
      });
      
      navigate('/register/authorize');
      
    } catch (err) {
      console.error('Error uploading selfie:', err);
      setError(`Failed to upload selfie: ${err.message}`);
      hapticTrigger('error');
      submittedRef.current = false; // Reset debounce flag on error
    } finally {
      setUploading(false);
      setIsSubmitting(false);
      // Note: Don't reset submittedRef.current here as we want to prevent resubmission
      // It will be reset when the component unmounts or when navigating away
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
                key={`camera-${cameraKeyRef.current}`}
                ref={cameraRef}
                facingMode="user"
                aspectRatio={1}
                onCameraStart={() => {
                  console.log('Camera started');
                  setCameraReady(true);
                  setCameraLoading(false);
                  setError('');
                  setCapturing(false); // Ensure capturing is reset when camera starts
                }}
                onCameraError={err => {
                  console.error('Camera error:', err);
                  setError('Camera error. Please check permissions and try again.');
                  setCameraReady(false);
                  setCameraLoading(false);
                  setCapturing(false); // Reset capturing on error
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