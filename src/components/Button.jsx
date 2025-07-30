import React from 'react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'ghost'
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  let base =
    'w-full flex items-center justify-center rounded-xl font-bold transition px-6 py-4 text-lg shadow-sm focus:outline-none';
  let variants = {
    primary:
      'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 hover:border-blue-700',
    secondary:
      'bg-white text-blue-700 border border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600',
    ghost:
      'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 hover:text-gray-700',
  };
  let disabledStyle =
    'opacity-60 cursor-not-allowed';
  return (
    <button
      type={type}
      className={[
        base,
        variants[variant],
        (disabled || loading) ? disabledStyle : '',
        className,
      ].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin w-5 h-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
} 