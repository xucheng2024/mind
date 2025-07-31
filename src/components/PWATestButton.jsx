import React from 'react';
import { FaDownload } from 'react-icons/fa';

export default function PWATestButton() {
  const handleTestInstall = () => {
    console.log('🔍 PWATestButton: Test install clicked');
    alert('Test install button clicked! This is for debugging purposes.');
  };

  return (
    <div 
      className="fixed top-4 left-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
      style={{ zIndex: 10000 }}
    >
      <FaDownload className="w-4 h-4" />
      <span className="text-sm">Test PWA Button</span>
      <button
        onClick={handleTestInstall}
        className="ml-2 bg-white text-red-500 px-2 py-1 rounded text-xs"
      >
        Test
      </button>
    </div>
  );
} 