import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../../context/RegistrationContext';

export default function HomePage() {
  // 防止多次点击 check-in
  const [checkNavLoading, setCheckNavLoading] = React.useState(false);
  const navigate = useNavigate();
  // Fixed clinicId
  const clinicId = '5c366433-6dc9-4735-9181-a690201bd0b3';

  // 这样获取 context 数据和方法
  const { registrationData, updateRegistrationData } = useRegistration();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-white to-blue-50">
      {/* 品牌区块 */}
      <div className="w-full flex flex-col items-center mb-10 mt-12">
        <div className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">San TCM Clinic</div>
        <div className="text-base text-gray-400 font-medium">Traditional Chinese Medicine & Wellness</div>
      </div>
      {/* 按钮区块 */}
      <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center">
        <div className="w-full mb-8">
          <div className="text-lg font-bold text-gray-800 mb-1">First-time Visitor</div>
          <div className="text-xs text-gray-400 mb-4">First visit to clinic now</div>
          <button
            className="w-full bg-white border border-blue-300 text-blue-700 rounded-xl py-4 px-6 text-lg font-bold shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
            onClick={() => navigate('/register?clinic_id=' + clinicId)}
          >
            Register & Check-in
          </button>
        </div>
        <div className="w-full">
          <div className="text-lg font-bold text-gray-800 mb-1">Returning Visitor</div>
          <div className="text-xs text-gray-400 mb-4">For patients who already have an account.</div>
          <div className="space-y-4">
            <button
              className="w-full bg-white border border-blue-300 text-blue-700 rounded-xl py-4 px-6 text-lg font-bold shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
              onClick={() => {
                const storedUserId = localStorage.getItem('user_id');
                const storedClinicId = localStorage.getItem('clinic_id') || clinicId;
                if (storedUserId && storedClinicId) {
                  navigate(`/booking/slots?clinic_id=${storedClinicId}&user_id=${storedUserId}`);
                } else {
                  navigate('/booking?clinic_id=' + clinicId);
                }
              }}
            >
              Book Appointment
            </button>
            <button
              className={`w-full bg-white border border-blue-300 text-blue-700 rounded-xl py-4 px-6 text-lg font-bold shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition ${checkNavLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={checkNavLoading}
              onClick={() => {
                if (checkNavLoading) return;
                setCheckNavLoading(true);
                const storedUserId = localStorage.getItem('user_id');
                const storedClinicId = localStorage.getItem('clinic_id') || clinicId;
                if (storedUserId && storedClinicId) {
                  navigate(`/check-in?clinic_id=${storedClinicId}&user_id=${storedUserId}`);
                } else {
                  navigate('/check-in?clinic_id=' + clinicId);
                }
                setTimeout(() => setCheckNavLoading(false), 1500);
              }}
            >
              On-site Check-in
            </button>
          </div>
        </div>
      </div>
      {/* 更低调的 logout/switch 按钮，缩小并上移 */}
      <div className="w-full flex justify-center mt-4 mb-2">
        <button
          className="px-4 py-2 bg-gray-100 text-gray-500 font-medium rounded-lg shadow-sm hover:bg-gray-200 hover:text-gray-700 transition text-sm border border-gray-200 focus:outline-none"
          style={{ minWidth: 0 }}
          onClick={() => {
            localStorage.removeItem('user_id');
            localStorage.removeItem('clinic_id');
            window.location.reload();
          }}
        >
          Logout / Switch User
        </button>
      </div>
    </div>
  );
}