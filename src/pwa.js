// PWA Service Worker Registration
export function registerPWA() {
  console.log('🔧 PWA Registration:', {
    isPWA: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
    hasServiceWorker: 'serviceWorker' in navigator,
    env: import.meta.env.MODE,
    location: window.location.href
  });

  // Skip Service Worker registration in development
  if (import.meta.env.DEV) {
    console.log('🚫 Skipping Service Worker registration in development');
    return;
  }

  if ('serviceWorker' in navigator) {
    // Register immediately when possible
    const registerSW = () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ SW registered: ', registration);
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                console.log('🔄 New service worker installed, notifying app...');
                window.dispatchEvent(new CustomEvent('pwa-update-available', {
                  detail: { newWorker }
                }));
              }
            });
          });

          // Check for waiting worker on registration
          if (registration.waiting) {
            console.log('🔄 Found waiting service worker on registration');
            window.dispatchEvent(new CustomEvent('pwa-update-available', {
              detail: { newWorker: registration.waiting }
            }));
          }
        })
        .catch((registrationError) => {
          console.log('❌ SW registration failed: ', registrationError);
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
    
    // Don't show prompt automatically - wait for user gesture
    console.log('PWA install prompt ready - waiting for user gesture');
  });
}

export function showInstallPrompt() {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
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