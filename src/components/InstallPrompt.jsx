import React, { useState, useEffect } from 'react';
import { FiDownload, FiX, FiSmartphone, FiCalendar, FiHeart } from 'react-icons/fi';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the install prompt for this session or recently
    const hasDismissed = sessionStorage.getItem('pwa_install_prompt_dismissed');
    const dismissedTime = localStorage.getItem('pwa_install_prompt_dismissed_time');
    const now = Date.now();
    
    // If dismissed within last 24 hours, don't show
    if (hasDismissed && dismissedTime && (now - parseInt(dismissedTime)) < 24 * 60 * 60 * 1000) {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowPrompt(false);
        // Remember successful install
        sessionStorage.setItem('pwa_install_prompt_dismissed', 'true');
        localStorage.setItem('pwa_install_prompt_dismissed_time', Date.now().toString());
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for this session and store timestamp
    sessionStorage.setItem('pwa_install_prompt_dismissed', 'true');
    localStorage.setItem('pwa_install_prompt_dismissed_time', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <FiSmartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">Install App</h2>
              <p className="text-sm text-gray-500">Quick access from home screen</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiCalendar className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-700">Easy appointment booking</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <FiHeart className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Track daily health</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiSmartphone className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm text-gray-700">Daily yoga & meditation</span>
          </div>
        </div>

        {/* Install Button */}
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-semibold text-base transition-colors flex items-center justify-center gap-2"
        >
          <FiDownload className="w-5 h-5" />
          {isInstalling ? 'Installing...' : 'Install Now'}
        </button>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="w-full mt-3 text-gray-500 hover:text-gray-700 py-2 px-4 text-sm transition-colors"
        >
          Maybe Later
        </button>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Free • No app store required
        </p>
      </div>
    </div>
  );
};

export default InstallPrompt; 