import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FiCamera, FiRotateCw, FiX, FiCheck } from 'react-icons/fi';

const IOSCamera = ({ onCapture, onError, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  // iOS优化的相机配置
  const getConstraints = useCallback(() => {
    if (isIOS) {
      return {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          // iOS Safari特定配置
          frameRate: { ideal: 30, max: 60 },
          aspectRatio: { ideal: 16/9 }
        }
      };
    }
    
    return {
      video: {
        facingMode: facingMode,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 }
      }
    };
  }, [facingMode, isIOS]);

  // 启动相机
  const startCamera = useCallback(async () => {
    try {
      setError('');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      // 停止现有流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = getConstraints();
      console.log('🎥 Starting camera with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsStreaming(true);
          console.log('✅ Camera started successfully');
        };
      }
    } catch (err) {
      console.error('❌ Camera error:', err);
      let errorMessage = 'Unable to access camera.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = isIOS && isPWA 
          ? 'Camera access denied. Please go to Settings > Safari > Camera > Allow, then refresh the app.'
          : 'Camera access denied. Please allow camera access and refresh the page.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application. Please close other camera apps and try again.';
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [getConstraints, isIOS, isPWA, onError]);

  // 停止相机
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🎥 Camera track stopped:', track.kind);
      });
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // 拍照
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    
    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // 设置canvas尺寸
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // 绘制视频帧到canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 转换为blob
      canvas.toBlob((blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          onCapture?.(blob, imageUrl);
        }
        setIsCapturing(false);
      }, 'image/jpeg', 0.9);
      
    } catch (err) {
      console.error('❌ Capture error:', err);
      setError('Failed to capture photo. Please try again.');
      setIsCapturing(false);
    }
  }, [isCapturing, onCapture]);

  // 切换前后摄像头
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // 组件挂载时启动相机
  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // 当facingMode改变时重启相机
  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [facingMode, startCamera, isStreaming]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 text-white">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition"
        >
          <FiX className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold">Take Photo</h2>
          {isIOS && isPWA && (
            <p className="text-xs text-gray-300 mt-1">iOS PWA Mode</p>
          )}
        </div>
        
        <button
          onClick={toggleCamera}
          className="p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition"
        >
          <FiRotateCw className="w-6 h-6" />
        </button>
      </div>

      {/* 相机预览 */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        
        {/* 拍照按钮 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={capturePhoto}
            disabled={!isStreaming || isCapturing}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${isStreaming && !isCapturing 
                ? 'bg-white hover:bg-gray-100' 
                : 'bg-gray-400 cursor-not-allowed'
              }
              transition-all duration-200 shadow-lg
            `}
          >
            {isCapturing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            ) : (
              <FiCamera className="w-8 h-8 text-gray-800" />
            )}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm text-center">
              <p className="text-sm">{error}</p>
              <button
                onClick={startCamera}
                className="mt-3 px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 隐藏的canvas用于拍照 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default IOSCamera; 