import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBug, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

// Global debug messages
let debugMessages = [];
let debugListeners = [];

const addDebugMessage = (message, type = 'log') => {
  const timestamp = new Date().toLocaleTimeString();
  const newMessage = {
    id: Date.now() + Math.random(),
    message,
    type,
    timestamp
  };
  
  debugMessages.push(newMessage);
  
  // Keep only last 50 messages
  if (debugMessages.length > 50) {
    debugMessages = debugMessages.slice(-50);
  }
  
  // Notify listeners
  debugListeners.forEach(listener => listener(debugMessages));
};

// Global debug object
window.debug = {
  log: (message, data = null) => {
    const fullMessage = data ? `${message}: ${JSON.stringify(data, null, 2)}` : message;
    addDebugMessage(fullMessage, 'log');
  },
  
  error: (message, error = null) => {
    const fullMessage = error ? `${message}: ${error.message || error}` : message;
    addDebugMessage(`❌ ${fullMessage}`, 'error');
  },
  
  success: (message) => {
    addDebugMessage(`✅ ${message}`, 'success');
  },
  
  warn: (message) => {
    addDebugMessage(`⚠️ ${message}`, 'warning');
  },
  
  clear: () => {
    debugMessages = [];
    debugListeners.forEach(listener => listener(debugMessages));
  }
};

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const updateMessages = (newMessages) => {
      setMessages([...newMessages]);
    };
    
    debugListeners.push(updateMessages);
    
    return () => {
      const index = debugListeners.indexOf(updateMessages);
      if (index > -1) {
        debugListeners.splice(index, 1);
      }
    };
  }, []);

  const getMessageColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-gray-300';
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <>
      {/* Debug Toggle Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        onClick={() => setIsVisible(!isVisible)}
        title="Toggle Debug Panel"
      >
        {isVisible ? <FaEyeSlash className="w-5 h-5" /> : <FaBug className="w-5 h-5" />}
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-4 right-4 z-50 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 max-w-md w-full max-h-96 overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold flex items-center">
                <FaBug className="w-4 h-4 mr-2" />
                Debug Panel
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.debug.clear()}
                  className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-3 max-h-80 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-sm">No debug messages yet...</p>
              ) : (
                <div className="space-y-1">
                  {messages.map((msg) => (
                    <div key={msg.id} className="text-xs">
                      <span className="text-gray-500">[{msg.timestamp}]</span>
                      <span className={`ml-2 ${getMessageColor(msg.type)}`}>
                        {msg.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 