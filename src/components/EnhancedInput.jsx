import React, { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';

const EnhancedInput = forwardRef(({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  autoComplete,
  inputMode,
  maxLength,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setHasValue(!!newValue);
    onChange?.(e);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <div className="relative mb-4">
      <motion.div
        className={`relative ${className}`}
        initial={false}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-4 text-base bg-white border rounded-xl
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-4 focus:ring-blue-100
            placeholder:text-gray-400
            disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
              : isFocused 
                ? 'border-blue-500' 
                : 'border-gray-300'
            }
            ${hasValue ? 'border-blue-400' : ''}
          `}
          {...props}
        />
        
        {label && (
          <motion.label
            className={`
              absolute left-4 pointer-events-none text-sm font-medium
              transition-all duration-200 ease-out
              ${isFocused || hasValue 
                ? 'text-blue-600 top-2' 
                : 'text-gray-500 top-4'
              }
            `}
            initial={false}
            animate={{
              y: isFocused || hasValue ? 0 : 0,
              scale: isFocused || hasValue ? 0.9 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </motion.label>
        )}
      </motion.div>

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

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput; 