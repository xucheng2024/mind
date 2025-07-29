import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fcp: 0, lcp: 0, fid: 0, cls: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcp = entries[entries.length - 1];
      setMetrics(prev => ({ ...prev, fcp: fcp.startTime }));
    }).observe({ entryTypes: ['paint'] });

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lcp = entries[entries.length - 1];
      setMetrics(prev => ({ ...prev, lcp: lcp.startTime }));
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fid = entries[entries.length - 1];
      setMetrics(prev => ({ ...prev, fid: fid.processingStart - fid.startTime }));
    }).observe({ entryTypes: ['first-input'] });

    new PerformanceObserver((entryList) => {
      let cls = 0;
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      }
      setMetrics(prev => ({ ...prev, cls }));
    }).observe({ entryTypes: ['layout-shift'] });
  }, [isVisible]);

  const getScore = (value, threshold) => {
    if (value <= threshold) return 'good';
    if (value <= threshold * 1.5) return 'needs-improvement';
    return 'poor';
  };

  const scores = {
    fcp: getScore(metrics.fcp, 1800),
    lcp: getScore(metrics.lcp, 2500),
    fid: getScore(metrics.fid, 100),
    cls: getScore(metrics.cls, 0.1)
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 max-w-xs border border-gray-200"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">Performance</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">FCP</span>
          <span className={`px-2 py-1 rounded ${
            scores.fcp === 'good' ? 'bg-green-100 text-green-800' :
            scores.fcp === 'needs-improvement' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {Math.round(metrics.fcp)}ms
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">LCP</span>
          <span className={`px-2 py-1 rounded ${
            scores.lcp === 'good' ? 'bg-green-100 text-green-800' :
            scores.lcp === 'needs-improvement' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {Math.round(metrics.lcp)}ms
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">FID</span>
          <span className={`px-2 py-1 rounded ${
            scores.fid === 'good' ? 'bg-green-100 text-green-800' :
            scores.fid === 'needs-improvement' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {Math.round(metrics.fid)}ms
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">CLS</span>
          <span className={`px-2 py-1 rounded ${
            scores.cls === 'good' ? 'bg-green-100 text-green-800' :
            scores.cls === 'needs-improvement' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {metrics.cls.toFixed(3)}
          </span>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        Press Ctrl+Shift+P to toggle
      </div>
    </motion.div>
  );
};

export default PerformanceMonitor; 