import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDownload, FaTimes } from 'react-icons/fa';
import { showInstallPrompt, hasInstallPrompt } from '../pwa';

export default function PWAInstallButton() {
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log('🔍 PWAInstallButton: Starting initialization');
    
    // Check if user has dismissed the install prompt for this session
    const hasDismissed = sessionStorage.getItem('pwa_install_dismissed');
    console.log('🔍 PWAInstallButton: Has dismissed:', hasDismissed);
    
    if (hasDismissed) {
      console.log('🔍 PWAInstallButton: User dismissed, not showing');
      return;
    }

    // Check if already installed
    const checkInstallation = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    window.navigator.standalone === true;
      console.log('🔍 PWAInstallButton: Is PWA installed:', isPWA);
      setIsInstalled(isPWA);
      
      if (!isPWA) {
        // Check for install prompt availability
        const checkPrompt = () => {
          const hasPrompt = hasInstallPrompt();
          console.log('🔍 PWAInstallButton: Has install prompt:', hasPrompt);
          if (hasPrompt) {
            console.log('PWA install prompt available - showing button');
            setShowButton(true);
          } else {
            console.log('PWA install prompt not available');
            setShowButton(false);
          }
        };
        
        // Check immediately
        checkPrompt();
        
        // Check periodically (but less frequently)
        const interval = setInterval(checkPrompt, 2000);
        return () => clearInterval(interval);
      }
    };

    checkInstallation();
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = () => {
      console.log('beforeinstallprompt event fired');
      setShowButton(true);
    };
    
    // Listen for custom pwa-install-ready event
    const handlePWAInstallReady = () => {
      console.log('PWA install ready event received');
      setShowButton(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-ready', handlePWAInstallReady);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-ready', handlePWAInstallReady);
    };
  }, []);

  const handleInstall = () => {
    showInstallPrompt();
    setShowButton(false);
  };

  const handleDismiss = () => {
    setShowButton(false);
    // Remember dismissal for this session only
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  console.log('🔍 PWAInstallButton: Render state - isInstalled:', isInstalled, 'showButton:', showButton);

  if (isInstalled || !showButton) {
    console.log('🔍 PWAInstallButton: Not rendering - isInstalled:', isInstalled, 'showButton:', showButton);
    return null;
  }

  console.log('🔍 PWAInstallButton: Rendering button');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 right-4 z-50"
        style={{ zIndex: 9999 }}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FaDownload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Install App
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Add to home screen for quick access
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Install
            </button>
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