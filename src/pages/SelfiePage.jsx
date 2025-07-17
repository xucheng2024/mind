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
    <div className="form-container min-h-screen flex flex-col">
      <RegistrationHeader title="Face Capture" />

      <p className="text-sm text-gray-600 text-center mb-6 font-normal">
        Take a selfie for future identification.
      </p>

      {!imageSrc ? (
        <div className="flex flex-col items-center mb-4">
          <div className="w-[220px] h-[220px] max-w-[80vw] max-h-[80vw] rounded-full overflow-hidden flex justify-center items-center bg-gray-200 mx-auto">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'user' }}
              className="w-full h-full object-cover rounded-full"
              onUserMediaError={() => setError('Unable to access camera. Please check your browser permissions.')}
            />
          </div>
          <div className="mt-6 w-full">
            <button
              onClick={capture}
              disabled={capturing}
              className={`w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold ${capturing ? 'bg-gray-300 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              {capturing ? 'Processing...' : 'Take a Photo'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center mb-4">
          <img
            src={imageSrc}
            alt="Your selfie preview"
            className="w-[220px] h-[220px] rounded-full object-cover mb-4"
          />
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={handleRetake}
              type="button"
              className="w-full py-3 rounded-lg text-lg font-semibold bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
            >
              Retake Photo
            </button>
            <button
              onClick={handleFinish}
              disabled={uploading}
              type="button"
              className={`w-full py-3 rounded-lg text-lg font-semibold ${uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {uploading ? 'Uploading...' : 'Finish'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm mt-3 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
