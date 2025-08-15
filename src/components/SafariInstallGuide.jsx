import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShare, FiX, FiSmartphone, FiHome } from 'react-icons/fi';

export default function SafariInstallGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    const checkInstallation = () => {
      const isStandalone = window.navigator.standalone === true;
      const dismissed = sessionStorage.getItem('safari_install_dismissed');
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      setIsPWA(isStandalone);
      setHasDismissed(!!dismissed);
      
      // Only show if Safari, not installed, and not dismissed
      const shouldShow = isSafari && !isStandalone && !dismissed;
      setShowGuide(shouldShow);
    };

    checkInstallation();
  }, []);

  const handleDismiss = () => {
    setShowGuide(false);
    sessionStorage.setItem('safari_install_dismissed', 'true');
  };

  if (!showGuide || isPWA || hasDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm"
        style={{ zIndex: 9999 }}
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl border-0 p-6 text-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FiSmartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  📱 Install to Home Screen
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Quick access like a native app
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white text-opacity-70 hover:text-opacity-100 p-1"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FiHome className="w-4 h-4" />
              </div>
              <span className="text-sm">Easy appointment booking</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FiSmartphone className="w-4 h-4" />
              </div>
              <span className="text-sm">Track daily health</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-xs">⚡</span>
              </div>
              <span className="text-sm">Works offline</span>
            </div>
          </div>

          {/* Installation Steps */}
          <div className="bg-white bg-opacity-10 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center space-x-2 text-sm mb-2">
              <FiShare className="w-4 h-4" />
              <span>Tap Share button</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <span>Choose "Add to Home Screen"</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleDismiss}
              className="flex-1 bg-white bg-opacity-20 text-white text-sm font-medium py-3 px-4 rounded-xl hover:bg-opacity-30 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-white text-blue-600 text-sm font-medium py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}