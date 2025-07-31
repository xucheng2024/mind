import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaInfoCircle } from 'react-icons/fa';

export default function PWATestButton() {
  const [pwaInfo, setPwaInfo] = useState({
    isPWA: false,
    hasServiceWorker: false,
    hasInstallPrompt: false,
    hasManifest: false,
    hasHTTPS: false
  });

  useEffect(() => {
    const checkPWAStatus = () => {
      const info = {
        isPWA: window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasInstallPrompt: false, // Will be updated by pwa.js
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        hasHTTPS: window.location.protocol === 'https:' || 
                  window.location.hostname === 'localhost'
      };
      
      setPwaInfo(info);
      console.log('PWA Status:', info);
    };

    checkPWAStatus();
    
    // Check periodically
    const interval = setInterval(checkPWAStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTestInstall = () => {
    console.log('Testing PWA install...');
    // This will trigger the install prompt if available
    window.dispatchEvent(new CustomEvent('test-pwa-install'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 z-50"
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-center space-x-3 mb-3">
          <FaInfoCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-900">
            PWA Status
          </h3>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>PWA Mode:</span>
            <span className={pwaInfo.isPWA ? 'text-green-600' : 'text-gray-500'}>
              {pwaInfo.isPWA ? '✅ Active' : '❌ Not Active'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Service Worker:</span>
            <span className={pwaInfo.hasServiceWorker ? 'text-green-600' : 'text-red-500'}>
              {pwaInfo.hasServiceWorker ? '✅ Available' : '❌ Not Available'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Manifest:</span>
            <span className={pwaInfo.hasManifest ? 'text-green-600' : 'text-red-500'}>
              {pwaInfo.hasManifest ? '✅ Found' : '❌ Not Found'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>HTTPS/Localhost:</span>
            <span className={pwaInfo.hasHTTPS ? 'text-green-600' : 'text-red-500'}>
              {pwaInfo.hasHTTPS ? '✅ Secure' : '❌ Not Secure'}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleTestInstall}
          className="mt-3 w-full bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <FaDownload className="w-4 h-4" />
          <span>Test Install</span>
        </button>
      </div>
    </motion.div>
  );
} 