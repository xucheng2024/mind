import React from 'react';

class HapticFeedback {
  static userHasInteracted = false;
  static listenersAdded = false; // Prevent duplicate listeners
  static eventHandlers = new Map(); // Store handlers for cleanup

  static initUserInteraction() {
    if (this.listenersAdded) return; // Already initialized
    
    const handleFirstInteraction = () => {
      this.userHasInteracted = true;
      this.removeListeners();
    };

    // Store handler reference for cleanup
    this.eventHandlers.set('firstInteraction', handleFirstInteraction);
    
    // Add listeners with passive option for better performance
    document.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    document.addEventListener('click', handleFirstInteraction, { passive: true });
    document.addEventListener('keydown', handleFirstInteraction, { passive: true });
    
    this.listenersAdded = true;
  }

  static removeListeners() {
    if (!this.listenersAdded) return;
    
    const handler = this.eventHandlers.get('firstInteraction');
    if (handler) {
      document.removeEventListener('touchstart', handler, { passive: true });
      document.removeEventListener('click', handler, { passive: true });
      document.removeEventListener('keydown', handler, { passive: true });
      this.eventHandlers.delete('firstInteraction');
    }
    
    this.listenersAdded = false;
  }

  static isSupported() {
    return 'vibrate' in navigator;
  }

  static canVibrate() {
    return this.isSupported() && this.userHasInteracted;
  }

  static safeVibrate(pattern) {
    if (this.canVibrate()) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Vibration failed:', error);
      }
    }
  }

  static light() {
    this.safeVibrate(50);
  }

  static medium() {
    this.safeVibrate(100);
  }

  static heavy() {
    this.safeVibrate(200);
  }

  static success() {
    this.safeVibrate([50, 50, 100]);
  }

  static error() {
    this.safeVibrate([100, 50, 100]);
  }

  static warning() {
    this.safeVibrate([50, 100, 50]);
  }

  // Cleanup method for component unmounting
  static cleanup() {
    this.removeListeners();
    this.userHasInteracted = false;
  }
}

// React Hook for haptic feedback
export const useHapticFeedback = () => {
  React.useEffect(() => {
    // Initialize user interaction tracking
    HapticFeedback.initUserInteraction();
    
    // Cleanup on unmount
    return () => {
      HapticFeedback.cleanup();
    };
  }, []);

  const trigger = React.useCallback((type = 'light') => {
    switch (type) {
      case 'light':
        HapticFeedback.light();
        break;
      case 'medium':
        HapticFeedback.medium();
        break;
      case 'heavy':
        HapticFeedback.heavy();
        break;
      case 'success':
        HapticFeedback.success();
        break;
      case 'error':
        HapticFeedback.error();
        break;
      case 'warning':
        HapticFeedback.warning();
        break;
      default:
        HapticFeedback.light();
    }
  }, []);

  return { 
    trigger, 
    isSupported: HapticFeedback.isSupported(),
    canVibrate: HapticFeedback.canVibrate()
  };
};

export default HapticFeedback; 