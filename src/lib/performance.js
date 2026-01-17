import React from 'react';

// Performance optimization utilities
export class PerformanceOptimizer {
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static measurePerformance(name, fn) {
    return async (...args) => {
      const start = performance.now();
      try {
        const result = await fn(...args);
        const end = performance.now();
        return result;
      } catch (error) {
        const end = performance.now();
        console.error(`❌ ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
        throw error;
      }
    };
  }

  static createIntersectionObserver(callback, options = {}) {
    return new IntersectionObserver(callback, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
      ...options
    });
  }

  static batchDOMUpdates(updates) {
    // Use requestAnimationFrame to batch DOM updates
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }

  static optimizeImages() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = this.createIntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  static preloadCriticalResources() {
    // Preload critical resources
    const criticalResources = [
      '/logo.png',
      '/clinic-illustration.svg'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = resource.endsWith('.png') ? 'image' : 'image';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  static optimizeAnimations() {
    // Reduce motion for users who prefer it
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      document.documentElement.style.setProperty('--transition-duration', '0.01ms');
    }
  }

  static cleanupEventListeners() {
    // Clean up any lingering event listeners
    const cleanup = () => {
      // Remove any global event listeners that might be causing memory leaks
      window.removeEventListener('scroll', null);
      window.removeEventListener('resize', null);
      window.removeEventListener('touchstart', null);
    };

    // Clean up on page unload
    window.addEventListener('beforeunload', cleanup);
  }
}

// Export individual functions for backward compatibility
export const debounce = PerformanceOptimizer.debounce;
export const throttle = PerformanceOptimizer.throttle;
export const measurePerformance = PerformanceOptimizer.measurePerformance;

// React performance hooks
export const usePerformanceOptimizedCallback = (callback, deps) => {
  return React.useCallback(PerformanceOptimizer.measurePerformance(
    callback.name || 'Callback',
    callback
  ), deps);
};

export const usePerformanceOptimizedMemo = (factory, deps) => {
  return React.useMemo(() => {
    const start = performance.now();
    const result = factory();
    const end = performance.now();
    return result;
  }, deps);
};

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  // Optimize animations
  PerformanceOptimizer.optimizeAnimations();
  
  // Preload critical resources
  PerformanceOptimizer.preloadCriticalResources();
  
  // Clean up event listeners
  PerformanceOptimizer.cleanupEventListeners();
  
};

export default PerformanceOptimizer; 