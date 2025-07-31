import React from 'react';

class HapticFeedback {
  static isSupported() {
    return 'vibrate' in navigator;
  }

  static light() {
    if (this.isSupported()) {
      navigator.vibrate(50);
    }
  }

  static medium() {
    if (this.isSupported()) {
      navigator.vibrate(100);
    }
  }

  static heavy() {
    if (this.isSupported()) {
      navigator.vibrate(200);
    }
  }

  static success() {
    if (this.isSupported()) {
      navigator.vibrate([50, 50, 100]);
    }
  }

  static error() {
    if (this.isSupported()) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  static warning() {
    if (this.isSupported()) {
      navigator.vibrate([50, 100, 50]);
    }
  }
}

// React Hook for haptic feedback
export const useHapticFeedback = () => {
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

  return { trigger, isSupported: HapticFeedback.isSupported() };
};

export default HapticFeedback; 