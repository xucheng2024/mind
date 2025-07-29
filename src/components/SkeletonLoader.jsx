import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ 
  type = 'text', 
  lines = 3, 
  className = '',
  height = 'h-4',
  width = 'w-full'
}) => {
  const shimmer = {
    initial: { opacity: 0.3 },
    animate: { 
      opacity: [0.3, 0.7, 0.3],
      transition: { 
        duration: 1.5, 
        repeat: Infinity, 
        ease: 'ease-in-out' 
      }
    }
  };

  if (type === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`bg-gray-200 rounded ${height} ${width}`}
            style={{ 
              width: index === lines - 1 ? '60%' : '100%' 
            }}
            variants={shimmer}
            initial="initial"
            animate="animate"
          />
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <motion.div 
        className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 ${className}`}
        variants={shimmer}
        initial="initial"
        animate="animate"
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </motion.div>
    );
  }

  if (type === 'button') {
    return (
      <motion.div
        className={`bg-gray-200 rounded-lg ${height} ${width} ${className}`}
        variants={shimmer}
        initial="initial"
        animate="animate"
      />
    );
  }

  return null;
};

export default SkeletonLoader; 