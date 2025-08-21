import React from 'react';
import { Calendar, Clock, Check, X, RotateCcw, AlertCircle } from 'lucide-react';
import TimeSlotGrid from './TimeSlotGrid';

export default function BookingModal({ 
  modal, 
  setModal, 
  onTimeSelect, 
  loading, 
  formatTime,
  businessHours 
}) {
  if (modal.type !== 'book') return null;

  const commonModalProps = {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50",
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        setModal({ type: null, data: null });
      }
    }
  };

  const isWithinBusinessHours = (date) => {
    if (!businessHours) return true;
    
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayConfig = businessHours[weekdays[date.getDay()]];
    
    if (!dayConfig || dayConfig.closed) {
      return false;
    }
    
    return true;
  };

  if (!modal.data || !modal.data.date) {
    console.warn('Modal data or date is missing in BookingModal:', modal);
    return null;
  }
  
  const date = new Date(modal.data.date);
  const isBusinessDay = isWithinBusinessHours(date);

  if (!isBusinessDay) {
    return (
      <div {...commonModalProps}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in border border-gray-100">
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Closed
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This day is not available for bookings
            </p>
            <button
              onClick={() => setModal({ type: null, data: null })}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use the actual slots data from modal instead of hardcoded slots
  const slots = modal.data.slots || [];

  // Group slots by time period (Morning/Afternoon)
  const groupedSlots = slots.reduce((acc, slot) => {
    let label = 'Morning';
    if (slot.hour >= 12) {
      label = 'Afternoon';
    }
    
    if (!acc[label]) {
      acc[label] = [];
    }
    
    acc[label].push({
      hour: slot.hour,
      minute: slot.minute,
      isAvailable: true, // All slots are available now
      timeStr: slot.timeStr
    });
    
    return acc;
  }, {});

  return (
    <div {...commonModalProps}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-scale-in border border-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Time
                </h3>
                <p className="text-sm text-gray-600">
                  {date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setModal({ type: null, data: null })}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="space-y-6">
            {modal.data.isLoading ? (
              // Show skeleton loading when slots are being fetched
              <div>
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mb-3"></div>
                <TimeSlotGrid
                  slots={[]}
                  onTimeSelect={onTimeSelect}
                  loading={true}
                  formatTime={formatTime}
                />
              </div>
            ) : (
              // Show actual time slots when loaded
              Object.entries(groupedSlots).map(([label, slots]) => (
                <div key={label}>
                  <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
                    {label}
                  </h4>
                  <TimeSlotGrid
                    slots={slots}
                    onTimeSelect={onTimeSelect}
                    loading={loading}
                    formatTime={formatTime}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
