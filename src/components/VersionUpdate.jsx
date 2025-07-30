import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDownload, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { 
  getCurrentVersion, 
  getStoredVersion, 
  setStoredVersion, 
  getVersionInfo 
} from '../utils/versionManager';

export default function VersionUpdate() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [previousVersion, setPreviousVersion] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    // Immediate check for version updates
    const checkVersion = () => {
      const storedVersion = getStoredVersion();
      const currentVersion = getCurrentVersion();
      
      if (!storedVersion) {
        // First time user
        setStoredVersion(currentVersion);
        return;
      }

      if (storedVersion !== currentVersion) {
        // Version has changed
        setPreviousVersion(storedVersion);
        setUpdateInfo(getVersionInfo(currentVersion));
        setShowUpdate(true);
        
        // Update stored version immediately to prevent re-showing
        setStoredVersion(currentVersion);
      }
    };

    // Check immediately
    checkVersion();

    // Also check after a short delay to catch any late updates
    const timeoutId = setTimeout(checkVersion, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleClose = () => {
    setShowUpdate(false);
    // Update stored version when user dismisses
    setStoredVersion(getCurrentVersion());
  };

  const handleReload = () => {
    setShowUpdate(false);
    setStoredVersion(getCurrentVersion());
    window.location.reload();
  };

  if (!showUpdate || !updateInfo) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaDownload className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">App Updated!</h2>
                  <p className="text-blue-100 text-sm">
                    Version {getCurrentVersion()} • {updateInfo.date}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {updateInfo.title}
              </h3>
              {previousVersion && (
                <p className="text-sm text-gray-600 mb-4">
                  Updated from version {previousVersion}
                </p>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FaInfoCircle className="w-4 h-4 mr-2" />
                What's New:
              </h4>
              <ul className="space-y-2">
                {updateInfo.changes.map((change, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-sm text-gray-700">{change}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleReload}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Reload App
              </button>
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 