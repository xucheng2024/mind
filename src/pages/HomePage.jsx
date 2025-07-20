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
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
        <h1 className="text-2xl font-bold mb-8">Welcome to San TCM</h1>
        <button
          className="w-full border rounded-lg py-4 mb-6 text-lg font-semibold bg-white hover:bg-blue-50 transition"
          onClick={() => navigate(`/register?clinic_id=${clinicId}`)}
        >
          New Visitor Registration
        </button>
        <button
          className="w-full border rounded-lg py-4 mb-6 text-lg font-semibold bg-white hover:bg-blue-50 transition"
          onClick={() => navigate(`/booking?clinic_id=${clinicId}`)}
        >
          Returning Visitor Bookingg
        </button>
        <button
          className="w-full border rounded-lg py-4 text-lg font-semibold bg-white hover:bg-blue-50 transition"
          onClick={() => navigate('/profile')}
        >
          My Records
        </button>
      </div>
    </div>
  );
}