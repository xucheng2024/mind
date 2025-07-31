import React, { forwardRef, useState } from 'react';

const PhoneInput = forwardRef(({
  value = '',
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}, ref) => {
  const [hasValue, setHasValue] = useState(!!value);

  const formatPhoneNumber = (input) => {
    // Remove all non-digits
    const cleaned = input.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length <= 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handleChange = (e) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    const hasValue = formatted.length > 0;
    
    setHasValue(hasValue);
    onChange?.(e, formatted);
  };

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
  };

  const isValid = !value || validatePhone(value);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Phone Number {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          ref={ref}
          type="tel"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          inputMode="tel"
          autoComplete="tel"
          placeholder="e.g. 91234567"
          maxLength={14}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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
          {error || 'Please enter a valid phone number'}
        </div>
      )}
    </div>
  );
});

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput; 