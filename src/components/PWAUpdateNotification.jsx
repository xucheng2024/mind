import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDownload, FaTimes, FaSync } from 'react-icons/fa';

export default function PWAUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [newWorker, setNewWorker] = useState(null);

  useEffect(() => {
    const handleUpdateAvailable = (event) => {
      setNewWorker(event.detail.newWorker);
      setShowUpdate(true);
    };

    // Listen for PWA update events
    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    // Also check for updates after a short delay
    const checkForUpdates = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration && registration.waiting) {
            setNewWorker(registration.waiting);
            setShowUpdate(true);
          }
        });
      }
    };

    // Check immediately and after very short delay
    checkForUpdates();
    const timeoutId = setTimeout(checkForUpdates, 200);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleUpdate = () => {
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 right-4 z-50"
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FaDownload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Update Available
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  A new version is ready to install
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
              onClick={handleUpdate}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <FaSync className="w-3 h-3 mr-1" />
              Update
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