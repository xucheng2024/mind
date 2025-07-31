import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SelectInput = forwardRef(({
  label,
  options = [],
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  placeholder = 'Select an option',
  searchable = false,
  className = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable 
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange?.(option.value);
    setHasValue(true);
    setIsOpen(false);
    setSearchTerm('');
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
        <div className="relative">
          <div
            ref={dropdownRef}
            className={`
              w-full px-4 py-4 text-base bg-white border rounded-xl
              transition-all duration-200 ease-out cursor-pointer
              focus:outline-none focus:ring-4 focus:ring-blue-100
              disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70
              ${error 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                : isFocused 
                  ? 'border-blue-500' 
                  : 'border-gray-300'
              }
              ${hasValue ? 'border-blue-400' : ''}
            `}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={0}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <div className="flex items-center justify-between">
              <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <motion.svg
                className="w-5 h-5 text-gray-400"
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </div>
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden"
              >
                {searchable && (
                  <div className="p-2 border-b border-gray-100">
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search options..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      autoFocus
                    />
                  </div>
                )}

                <div className="max-h-48 overflow-y-auto">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <motion.div
                        key={option.value}
                        whileHover={{ backgroundColor: '#f3f4f6' }}
                        className={`
                          px-4 py-3 cursor-pointer transition-colors
                          ${option.value === value ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                        `}
                        onClick={() => handleSelect(option)}
                      >
                        {option.label}
                      </motion.div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      No options found
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {label && (
          <motion.label
            className={`
              absolute left-4 pointer-events-none text-sm font-medium
              transition-all duration-200 ease-out
              ${isFocused || hasValue 
                ? 'text-blue-600 -translate-y-6 scale-90' 
                : 'text-gray-500 translate-y-4'
              }
            `}
            initial={false}
            animate={{
              y: isFocused || hasValue ? -24 : 16,
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

SelectInput.displayName = 'SelectInput';

export default SelectInput; 