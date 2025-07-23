// src/components/RegistrationHeader.jsx
import React from 'react';

export default function RegistrationHeader({ title }) {
  return (
    <div className="text-left mb-6">
      <div className="text-base font-semibold text-gray-400 tracking-wide uppercase mb-1">
        San TCM Registration
      </div>
      <div className="text-2xl font-bold text-gray-900 leading-tight">
        {title}
      </div>
    </div>
  );
}
