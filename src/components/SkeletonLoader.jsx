import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ 
  type = 'text', 
  lines = 1, 
  className = '',
  width = 'w-full',
  height = 'h-4'
}) => {
  const variants = {
    animate: {
      x: ['-100%', '100%'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  if (type === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${width} ${height} bg-gray-200 rounded animate-pulse relative overflow-hidden`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              variants={variants}
              animate="animate"
            />
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <motion.div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
        </div>
      </motion.div>
    );
  }

  if (type === 'button') {
    return (
      <motion.div
        className={`h-12 bg-gray-200 rounded-xl animate-pulse ${className}`}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
    );
  }

  if (type === 'avatar') {
    return (
      <motion.div
        className={`w-16 h-16 bg-gray-200 rounded-full animate-pulse ${className}`}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
    );
  }

  return (
    <motion.div
      className={`${width} ${height} bg-gray-200 rounded animate-pulse ${className}`}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    />
  );
};

export default SkeletonLoader; 