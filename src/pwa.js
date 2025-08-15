// PWA Service Worker Registration
export function registerPWA() {
  // Skip Service Worker registration in development
  if (import.meta.env.DEV) {
    return;
  }

  if ('serviceWorker' in navigator) {
    // Register immediately when possible
    const registerSW = () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                window.dispatchEvent(new CustomEvent('pwa-update-available', {
                  detail: { newWorker }
                }));
              }
            });
          });

          // Check for waiting worker on registration
          if (registration.waiting) {
            window.dispatchEvent(new CustomEvent('pwa-update-available', {
              detail: { newWorker: registration.waiting }
            }));
          }
        })
        .catch((registrationError) => {
          console.error('❌ SW registration failed: ', registrationError);
        });
    };

    // Register immediately if page is already loaded
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      // Wait for DOM content loaded instead of full page load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerSW);
      } else {
        registerSW();
      }
    }
  }
}

// PWA Installation Prompt
let deferredPrompt;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('pwa-install-ready'));
  });
}

export function showInstallPrompt() {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      deferredPrompt = null;
    });
  }
}

export function hasInstallPrompt() {
  return !!deferredPrompt;
}

// Check for PWA installation
export function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

// Check if running in PWA mode and log relevant info
export function logPWAMode() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = window.navigator.standalone === true;
  const isPWA = isStandalone || isIOSStandalone;
  
  return isPWA;
} 