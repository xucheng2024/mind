import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';

export default function HomePage() {
  const navigate = useNavigate();
  // Fixed clinicId
  const clinicId = '5c366433-6dc9-4735-9181-a690201bd0b3';

  // 这样获取 context 数据和方法
  const { registrationData, updateRegistrationData } = useRegistration();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">San TCM Clinic</h1>
              <p className="text-gray-600 mt-1">Traditional Chinese Medicine & Wellness</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Welcome Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h2>
            <p className="text-gray-600 leading-relaxed">
              Your health journey starts here. Choose from the options below to get started.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* New Registration */}
            <button
              className="w-full bg-blue-600 text-white rounded-xl py-4 px-6 text-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
              onClick={() => navigate(`/register?clinic_id=${clinicId}`)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              New Visitor Registration
            </button>

            {/* Returning Visitor */}
            <button
              className="w-full bg-white border-2 border-blue-200 text-blue-700 rounded-xl py-4 px-6 text-lg font-semibold hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
              onClick={() => navigate(`/booking?clinic_id=${clinicId}`)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Returning Visitor Booking
            </button>

            {/* My Records */}
            <button
              className="w-full bg-white border-2 border-gray-200 text-gray-700 rounded-xl py-4 px-6 text-lg font-semibold hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
              onClick={() => navigate('/profile')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Records
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact us at{' '}
              <a href="tel:+6565551234" className="text-blue-600 hover:text-blue-700 font-medium">
                +65 6555 1234
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}