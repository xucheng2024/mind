import React from 'react';

class HapticFeedback {
  static userHasInteracted = false;

  static initUserInteraction() {
    if (!this.userHasInteracted) {
      const handleFirstInteraction = () => {
        this.userHasInteracted = true;
        document.removeEventListener('touchstart', handleFirstInteraction, true);
        document.removeEventListener('click', handleFirstInteraction, true);
        document.removeEventListener('keydown', handleFirstInteraction, true);
      };

      document.addEventListener('touchstart', handleFirstInteraction, true);
      document.addEventListener('click', handleFirstInteraction, true);
      document.addEventListener('keydown', handleFirstInteraction, true);
    }
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
}

// React Hook for haptic feedback
export const useHapticFeedback = () => {
  React.useEffect(() => {
    // Initialize user interaction tracking
    HapticFeedback.initUserInteraction();
  }, []);

  const trigger = (type = 'light') => {
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
  };

  return { 
    trigger, 
    isSupported: HapticFeedback.isSupported(),
    canVibrate: HapticFeedback.canVibrate()
  };
};

export default HapticFeedback; 