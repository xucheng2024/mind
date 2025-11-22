import React, { forwardRef, useState } from 'react';

const DateInput = forwardRef(({
  value = '',
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  minDate,
  maxDate,
  className = '',
  ...props
}, ref) => {
  const [hasValue, setHasValue] = useState(!!value);

  const formatDate = (input) => {
    // If input is empty, return empty string
    if (!input || input.trim() === '') {
      return '';
    }
    
    // Remove all non-digits
    const cleaned = input.replace(/\D/g, '');
    
    // If cleaned is empty after removing non-digits, return empty string
    if (!cleaned) {
      return '';
    }
    
    // Format as DD/MM/YYYY
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    } else {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
  };

  const handleChange = (e) => {
    const input = e.target.value;
    const formatted = formatDate(input);
    const hasValue = formatted.length > 0;
    
    setHasValue(hasValue);
    onChange?.(e, formatted);
  };

  const validateDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 10) return false;
    
    const [day, month, year] = dateStr.split('/').map(Number);
    
    if (!day || !month || !year) return false;
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > new Date().getFullYear() + 1) return false;
    
    const date = new Date(year, month - 1, day);
    if (date.getMonth() !== month - 1 || date.getDate() !== day) return false;
    
    if (minDate && date < new Date(minDate)) return false;
    if (maxDate && date > new Date(maxDate)) return false;
    
    return true;
  };

  const isValid = !value || validateDate(value);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Date of Birth {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          inputMode="numeric"
          autoComplete="off"
          placeholder="DD/MM/YYYY"
          maxLength={10}
          className={`
            w-full pl-12 pr-4 py-4 text-base bg-white border rounded-xl
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-4 focus:ring-blue-100
            placeholder:text-gray-400
            disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70
            ${error || (!isValid && hasValue)
              ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
              : 'border-gray-300'
            }
            ${hasValue && isValid ? 'border-green-400' : ''}
          `}
          {...props}
        />
        
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        {hasValue && isValid && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {(error || (!isValid && hasValue)) && (
        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error || 'Please enter a valid date (DD/MM/YYYY)'}
        </div>
      )}
    </div>
  );
});

DateInput.displayName = 'DateInput';

export default DateInput; 