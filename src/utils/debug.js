// Debug utility that works in both development and production
// This bypasses console.log removal in production builds

const DEBUG_MODE = process.env.NODE_ENV !== 'production' || localStorage.getItem('debug_mode') === 'true';

// Create a debug element that shows in the UI
let debugElement = null;

const createDebugElement = () => {
  if (typeof document === 'undefined') return;
  
  debugElement = document.createElement('div');
  debugElement.id = 'debug-panel';
  debugElement.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    max-width: 300px;
    max-height: 200px;
    overflow: auto;
    display: none;
  `;
  document.body.appendChild(debugElement);
};

const addDebugMessage = (message) => {
  if (!DEBUG_MODE) return;
  
  if (!debugElement) {
    createDebugElement();
  }
  
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.style.marginBottom = '5px';
  logEntry.innerHTML = `<span style="color: #888;">[${timestamp}]</span> ${message}`;
  
  if (debugElement) {
    debugElement.appendChild(logEntry);
    debugElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (debugElement && debugElement.children.length === 0) {
        debugElement.style.display = 'none';
      }
    }, 5000);
  }
  
  // Also log to console if available
  if (typeof console !== 'undefined' && console.log) {
    console.log(`[DEBUG] ${message}`);
  }
};

export const debug = {
  log: (message, data = null) => {
    const fullMessage = data ? `${message}: ${JSON.stringify(data, null, 2)}` : message;
    addDebugMessage(fullMessage);
  },
  
  error: (message, error = null) => {
    const fullMessage = error ? `${message}: ${error.message || error}` : message;
    addDebugMessage(`❌ ${fullMessage}`);
  },
  
  success: (message) => {
    addDebugMessage(`✅ ${message}`);
  },
  
  warn: (message) => {
    addDebugMessage(`⚠️ ${message}`);
  },
  
  clear: () => {
    if (debugElement) {
      debugElement.innerHTML = '';
      debugElement.style.display = 'none';
    }
  },
  
  show: () => {
    if (debugElement) {
      debugElement.style.display = 'block';
    }
  },
  
  hide: () => {
    if (debugElement) {
      debugElement.style.display = 'none';
    }
  }
};

// Enable debug mode in production
if (typeof window !== 'undefined') {
  window.enableDebug = () => {
    localStorage.setItem('debug_mode', 'true');
    location.reload();
  };
  
  window.disableDebug = () => {
    localStorage.removeItem('debug_mode');
    location.reload();
  };
  
  window.debug = debug;
} 