import React, { useState, useEffect } from 'react';
import { FiDownload, FiCheck, FiInfo } from 'react-icons/fi';

const PWAStatus = () => {
  const [isPWA, setIsPWA] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Check if in PWA environment
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true;
      setIsPWA(isStandalone);
      setIsInstalled(isStandalone);
    };

    checkPWA();
    window.addEventListener('load', checkPWA);
    return () => window.removeEventListener('load', checkPWA);
  }, []);

  if (!isPWA && !showGuide) return null;
  
  // If already installed, don't show anything
  if (isInstalled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isInstalled ? (
        <button
          onClick={() => setShowGuide(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <FiDownload className="w-4 h-4" />
          <span className="text-sm">Install App</span>
        </button>
      ) : (
        <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <FiCheck className="w-4 h-4" />
          <span className="text-sm">PWA Installed</span>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiInfo className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Install App</h3>
            </div>
            <div className="text-sm text-gray-600 mb-6 space-y-3">
              <p><strong>iPhone/iPad:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Tap the Share button</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to install</li>
              </ol>
              <p className="mt-3"><strong>Android:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Tap the menu button (⋮)</li>
                <li>Tap "Add to Home screen"</li>
                <li>Tap "Add" to install</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowGuide(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWAStatus; 