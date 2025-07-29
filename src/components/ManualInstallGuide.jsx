import React, { useState } from 'react';
import { FiShare, FiPlus, FiHome } from 'react-icons/fi';

const ManualInstallGuide = () => {
  const [showGuide, setShowGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  React.useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
  }, []);

  if (!isIOS) return null;

  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        className="fixed bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-40"
      >
        <FiShare className="w-4 h-4" />
        <span className="text-sm">Install App</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">Install on iPhone</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="text-sm text-gray-700">Tap the <strong>Share</strong> button</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <FiShare className="w-3 h-3" />
                    <span>Bottom of Safari</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <div>
                  <p className="text-sm text-gray-700">Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <div>
                  <p className="text-sm text-gray-700">Tap <strong>"Add"</strong> to install</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <FiHome className="w-3 h-3" />
                    <span>App will appear on home screen</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold text-base transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ManualInstallGuide; 