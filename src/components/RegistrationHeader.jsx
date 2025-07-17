// src/components/RegistrationHeader.jsx
import React from 'react';

export default function RegistrationHeader({ title }) {
  return (
    <div className="text-left mb-4">
      <div className="text-xl font-bold text-[#1a253c] tracking-wide">
        San TCM Registration
      </div>
      <div className="text-lg font-normal text-blue-600 mt-2">
        {title}
      </div>
    </div>
  );
}
