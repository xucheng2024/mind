// src/components/RegistrationHeader.jsx
import React from 'react';

export default function RegistrationHeader({ title }) {
  return (
    <div className="text-center mb-4">
      <h2 className="text-2xl font-bold text-[#1a253c] tracking-wide mb-1">
        San TCM
      </h2>
      <h3 className="text-lg font-normal text-gray-500 tracking-tight mb-4">
        Customer Registration
      </h3>
      <h4 className="text-base font-medium text-blue-600 mb-4">
        {title}
      </h4>
    </div>
  );
}
