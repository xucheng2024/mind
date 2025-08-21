import React from 'react';

export default function TimeSlotGrid({ 
  slots, 
  onTimeSelect, 
  loading, 
  formatTime 
}) {
  // Show skeleton loading when loading is true
  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="px-3 py-2 rounded-full bg-gray-200 animate-pulse"
          >
            <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map(slot => {
        const handleSlotClick = () => {
          onTimeSelect(slot.hour, slot.minute);
        };
        
        return (
          <button
            key={`${slot.hour}:${slot.minute}`}
            onClick={handleSlotClick}
            disabled={loading}
            className="px-3 py-2 rounded-full transition-all duration-200 text-center font-medium text-sm bg-white text-gray-700 hover:bg-blue-500 hover:text-white border border-gray-300 hover:border-blue-500"
          >
            {formatTime(slot.hour, slot.minute)}
          </button>
        );
      })}
    </div>
  );
}
