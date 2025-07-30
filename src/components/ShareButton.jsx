import React, { useState, useEffect } from 'react';
import { IoShareSocialOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';

const ShareButton = () => {
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true;
      setIsPWA(isStandalone);
    };
    
    checkPWA();
    window.addEventListener('load', checkPWA);
    return () => window.removeEventListener('load', checkPWA);
  }, []);
  
  // 如果是PWA模式，不显示分享按钮
  if (isPWA) return null;
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'AppClinic',
          text: 'Check out this clinic registration app!',
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast.error('Failed to share');
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="fixed bottom-4 left-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg transition-colors duration-200 flex items-center gap-2 z-50"
      aria-label="Share app"
    >
      <IoShareSocialOutline className="w-5 h-5" />
      <span className="text-sm font-medium">Share</span>
    </button>
  );
};

export default ShareButton; 