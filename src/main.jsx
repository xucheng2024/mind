import React from 'react'
import ReactDOM from 'react-dom/client'
import RootApp from './App'
import './index.css'
import { registerPWA, setupInstallPrompt } from './pwa'

// Suppress passive event listener warnings in development
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('Added non-passive event listener')) {
      return; // Suppress passive event listener warnings
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('Added non-passive event listener')) {
      return; // Suppress passive event listener violations
    }
    originalError.apply(console, args);
  };
  
  // Override the browser's native violation reporting
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // Convert options to passive if it's a scroll-blocking event
    if (type === 'touchstart' || type === 'touchmove' || type === 'wheel' || type === 'mousewheel') {
      if (options === undefined) {
        options = { passive: true };
      } else if (typeof options === 'object') {
        options.passive = true;
      }
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
}

// Register PWA
registerPWA()
setupInstallPrompt()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
)