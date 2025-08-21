import React from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHapticFeedback } from '../HapticFeedback';

export default function CalendarHeader({ 
  currentMonth, 
  onPrevMonth, 
  onNextMonth, 
  clinicInfo 
}) {
  const navigate = useNavigate();
  const { trigger } = useHapticFeedback();

  const handleBackHome = () => {
    trigger('light');
    navigate('/');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Back button */}
        <button
          onClick={handleBackHome}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Center - Month navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onPrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">
            {currentMonth.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h1>
          
          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Right side - Empty for balance */}
        <div className="w-24"></div>
      </div>
    </div>
  );
}
