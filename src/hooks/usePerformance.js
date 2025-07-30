import { useEffect, useRef, useCallback } from 'react';

export const usePerformance = () => {
  const metrics = useRef({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
  });

  const measurePerformance = useCallback(() => {
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries[entries.length - 1];
        metrics.current.fcp = fcp.startTime;
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1];
        metrics.current.lcp = lcp.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fid = entries[entries.length - 1];
        metrics.current.fid = fid.processingStart - fid.startTime;
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        metrics.current.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // Time to First Byte
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      metrics.current.ttfb = navigation.responseStart - navigation.requestStart;
    }
  }, []);

  const getMetrics = useCallback(() => {
    return { ...metrics.current };
  }, []);

  const logMetrics = useCallback(() => {
    const currentMetrics = getMetrics();
    console.log('Performance Metrics:', {
      FCP: `${currentMetrics.fcp.toFixed(2)}ms`,
      LCP: `${currentMetrics.lcp.toFixed(2)}ms`,
      FID: `${currentMetrics.fid.toFixed(2)}ms`,
      CLS: currentMetrics.cls.toFixed(3),
      TTFB: `${currentMetrics.ttfb.toFixed(2)}ms`,
    });
  }, [getMetrics]);

  useEffect(() => {
    measurePerformance();
  }, [measurePerformance]);

  return {
    getMetrics,
    logMetrics,
    metrics: metrics.current,
  };
}; 