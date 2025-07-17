// src/components/RegistrationHeader.jsx
import React from 'react';

export default function RegistrationHeader({ title }) {
  return (
    <div className="text-left mb-4">
      <div className="text-xl font-bold text-[#1a253c] tracking-wide flex items-center gap-2">
        <span>San TCM</span>
        <span className="mx-1 text-gray-300">|</span>
        <span>Registration</span>
      </div>
      <div className="text-base font-semibold text-blue-600 mt-2">
        {title}
      </div>
    </div>
  );
}
