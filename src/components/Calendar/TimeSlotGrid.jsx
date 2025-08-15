import React from 'react';

export default function TimeSlotGrid({ 
  slots, 
  onTimeSelect, 
  loading, 
  formatTime 
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map(slot => {
        const isClickable = slot.isAvailable;
        
        const handleSlotClick = () => {
          if (!isClickable) return;
          onTimeSelect(slot.hour, slot.minute);
        };
        
        return (
          <button
            key={`${slot.hour}:${slot.minute}`}
            onClick={handleSlotClick}
            disabled={!isClickable || loading}
            className={`px-3 py-2 rounded-full transition-all duration-200 text-center font-medium text-sm ${
              !isClickable
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-dashed border-gray-300'
                : 'bg-white text-gray-700 hover:bg-blue-500 hover:text-white border border-gray-300 hover:border-blue-500'
            }`}
          >
            {formatTime(slot.hour, slot.minute)}
          </button>
        );
      })}
    </div>
  );
}
