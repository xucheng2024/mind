import React from 'react';
import { IoShareSocialOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';

const ShareButton = () => {
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