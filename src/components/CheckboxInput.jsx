import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

const CheckboxInput = forwardRef(({
  label,
  checked = false,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}, ref) => {
  const handleChange = (e) => {
    onChange?.(e.target.checked);
  };

  return (
    <div className={`mb-4 ${className}`}>
      <motion.label
        className={`
          flex items-start gap-3 cursor-pointer
          ${disabled ? 'cursor-not-allowed opacity-70' : ''}
        `}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        <div className="relative flex-shrink-0">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            className="sr-only"
            {...props}
          />
          <motion.div
            className={`
              w-5 h-5 border-2 rounded-md flex items-center justify-center
              transition-all duration-200
              ${checked 
                ? 'bg-blue-600 border-blue-600' 
                : 'bg-white border-gray-300'
              }
              ${error ? 'border-red-500' : ''}
              ${disabled ? 'bg-gray-100 border-gray-300' : ''}
            `}
            animate={{
              scale: checked ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {checked && (
              <motion.svg
                className="w-3 h-3 text-white"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </motion.svg>
            )}
          </motion.div>
        </div>
        
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </div>
      </motion.label>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 mt-2 text-red-600 text-sm"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </motion.div>
      )}
    </div>
  );
});

CheckboxInput.displayName = 'CheckboxInput';

export default CheckboxInput; 