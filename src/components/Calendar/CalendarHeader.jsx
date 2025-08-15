import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarHeader({ 
  currentMonth, 
  onPrevMonth, 
  onNextMonth, 
  clinicInfo 
}) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
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
        
        {clinicInfo && (
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-900">
              {clinicInfo.name}
            </h2>
            <p className="text-sm text-gray-600">
              {clinicInfo.address}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
