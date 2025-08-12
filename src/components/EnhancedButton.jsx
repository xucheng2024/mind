import React from 'react';
import { motion } from 'framer-motion';

const EnhancedButton = React.memo(({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) => {
  // Memoize animation config to prevent recreation on every render
  const animationConfig = React.useMemo(() => ({
    whileHover: !disabled && !loading ? { scale: 1.02 } : {},
    whileTap: !disabled && !loading ? { scale: 0.98 } : {}
  }), [disabled, loading]);

  // Memoize button classes to prevent recalculation
  const buttonClasses = React.useMemo(() => {
    const baseClasses = `
      relative inline-flex items-center justify-center font-semibold
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-4 focus:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-70
      ${fullWidth ? 'w-full' : ''}
    `;

    const variants = {
      primary: `
        bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800
        focus:ring-blue-500 shadow-lg hover:shadow-xl
        transform hover:-translate-y-0.5 active:translate-y-0
      `,
      secondary: `
        bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400
        focus:ring-gray-500 shadow-md hover:shadow-lg
        transform hover:-translate-y-0.5 active:translate-y-0
      `,
      outline: `
        bg-transparent border-2 border-blue-600 text-blue-600
        hover:bg-blue-600 hover:text-white active:bg-blue-700
        focus:ring-blue-500
      `,
      danger: `
        bg-red-600 text-white hover:bg-red-700 active:bg-red-800
        focus:ring-red-500 shadow-lg hover:shadow-xl
        transform hover:-translate-y-0.5 active:translate-y-0
      `,
      success: `
        bg-green-600 text-white hover:bg-green-700 active:bg-green-800
        focus:ring-green-500 shadow-lg hover:shadow-xl
        transform hover:-translate-y-0.5 active:translate-y-0
      `
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-lg',
      md: 'px-6 py-3 text-base rounded-xl',
      lg: 'px-8 py-4 text-lg rounded-xl',
      xl: 'px-10 py-5 text-xl rounded-2xl'
    };

    return `
      ${baseClasses}
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `;
  }, [variant, size, fullWidth, className]);

  // Memoize click handler
  const handleClick = React.useCallback((e) => {
    if (onClick && !disabled && !loading) {
      onClick(e);
    }
  }, [onClick, disabled, loading]);

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={buttonClasses}
      {...animationConfig}
      {...props}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        </motion.div>
      )}
      
      <motion.span
        className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
});

EnhancedButton.displayName = 'EnhancedButton';

export default EnhancedButton; 