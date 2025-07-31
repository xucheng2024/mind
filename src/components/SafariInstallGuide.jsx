import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShare, FiX, FiArrowDown } from 'react-icons/fi';

export default function SafariInstallGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    console.log('🔍 SafariInstallGuide: Starting initialization');
    
    // 检查是否已经安装或已经关闭过
    const checkInstallation = () => {
      const isStandalone = window.navigator.standalone === true;
      const dismissed = sessionStorage.getItem('safari_install_dismissed');
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      console.log('🔍 SafariInstallGuide: Is standalone:', isStandalone);
      console.log('🔍 SafariInstallGuide: Has dismissed:', dismissed);
      console.log('🔍 SafariInstallGuide: Is Safari:', isSafari);
      console.log('🔍 SafariInstallGuide: User agent:', navigator.userAgent);
      
      setIsPWA(isStandalone);
      setHasDismissed(!!dismissed);
      
      // 只在 Safari 且未安装且未关闭过的情况下显示
      const shouldShow = isSafari && !isStandalone && !dismissed;
      console.log('🔍 SafariInstallGuide: Should show guide:', shouldShow);
      setShowGuide(shouldShow);
    };

    checkInstallation();
  }, []);

  const handleDismiss = () => {
    setShowGuide(false);
    sessionStorage.setItem('safari_install_dismissed', 'true');
  };

  console.log('🔍 SafariInstallGuide: Render state - showGuide:', showGuide, 'isPWA:', isPWA, 'hasDismissed:', hasDismissed);

  if (!showGuide || isPWA || hasDismissed) {
    console.log('🔍 SafariInstallGuide: Not rendering - showGuide:', showGuide, 'isPWA:', isPWA, 'hasDismissed:', hasDismissed);
    return null;
  }

  console.log('🔍 SafariInstallGuide: Rendering guide');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm"
        style={{ zIndex: 9999 }}
      >
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FiShare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Install App
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Add to Home Screen for the best experience
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <FiShare className="w-4 h-4" />
            <span>Tap</span>
            <FiArrowDown className="w-4 h-4" />
            <span>"Add to Home Screen"</span>
          </div>

          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}