// src/components/RegistrationHeader.jsx
import React from 'react';

export default function RegistrationHeader({ title }) {
  return (
    <>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '700',
        color: '#1a253c',
        margin: '0 0 4px 0',
        letterSpacing: '0.5px'
      }}>
        San TCM
      </h2>

      <h3 style={{
        fontSize: '18px',
        fontWeight: '400',
        color: '#6c757d',
        margin: '0 0 16px 0',
        letterSpacing: '0.2px'
      }}>
        Customer Registration
      </h3>

      <h4 style={{
        fontSize: '16px',
        fontWeight: '500',
        color: '#1677ff',
        margin: '0 0 16px 0'
      }}>
        {title}
      </h4>
    </>
  );
}
