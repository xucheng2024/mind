import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../lib/api';
import { useHapticFeedback } from '../components/HapticFeedback';
import { useAppointment } from '../hooks/useAppointment';
import CalendarHeader from '../components/Calendar/CalendarHeader';
import BookingModal from '../components/Calendar/BookingModal';
import CancelModal from '../components/Calendar/CancelModal';

export default function CalendarPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trigger } = useHapticFeedback();
  
  // URL params & localStorage
  let clinicId = searchParams.get('clinic_id') || localStorage.getItem('clinic_id');
  let userRowId = searchParams.get('user_row_id') || localStorage.getItem('user_row_id');

  // Core states
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [businessHours, setBusinessHours] = useState(null);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  
  // Month navigation functions
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  // Check if a date is within business hours
  const isWithinBusinessHours = useCallback((date) => {
    if (!businessHours) return true;
    
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayConfig = businessHours[weekdays[date.getDay()]];
    
    // If the day is marked as closed or no config exists
    if (!dayConfig || dayConfig.closed) {
      return false;
    }
    
    return true;
  }, [businessHours]);

  // Modal states
  const [modal, setModal] = useState({ type: null, data: null });
  
  // Date picker states
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);


  // Redirect if missing params (skip in development)
  useEffect(() => {
    if (!clinicId || !userRowId) {
      // In development, use default values for testing
      if (import.meta.env.DEV) {
        clinicId = 'test-clinic';
        userRowId = 'test-user';
      } else {
        navigate(`/booking${clinicId ? ('?clinic_id=' + clinicId) : ''}`);
      }
    }
  }, [clinicId, userRowId, navigate]);

  // Fetch data
  useEffect(() => {
    if (!clinicId || !userRowId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clinicRes, visitsRes] = await Promise.all([
          apiClient.getClinicInfo(clinicId),
          apiClient.getUserVisits(clinicId, userRowId)
        ]);
        
        setClinicInfo(clinicRes.data);        
        // If business_hours is null or undefined, set default hours
        const businessHoursData = clinicRes.data.business_hours || {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '12:00', closed: false },
          sunday: { open: '09:00', close: '12:00', closed: true }
        };
        
        setBusinessHours(businessHoursData);
        
        const appointments = (visitsRes.data || [])
          .filter(v => v.status === 'booked')
          .map(v => {
            const startTime = new Date(v.book_time || v.visit_time);
            const timeString = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
            return {
              id: v.id,
              title: timeString,
              start: startTime,
              end: new Date(startTime.getTime() + 30 * 60 * 1000),
              backgroundColor: '#3B82F6',
              borderColor: '#3B82F6',
              textColor: 'white',
              userRowId: v.user_row_id
            };
          })
          .filter(e => e.start);
        
        setEvents(appointments);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clinicId, userRowId]);

  // Get available slots for date
  const getAvailableSlots = async (date) => {
    
    if (!businessHours) {
      console.warn('⚠️ No business hours available');
      console.warn('⚠️ businessHours value:', businessHours);
      return [];
    }
    
    const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const dayConfig = businessHours[weekdays[date.getDay()]];
        
    if (!dayConfig || dayConfig.closed) {
      return 'closed';
    }
    
    const [startH, startM = 0] = dayConfig.open.split(':').map(Number);
    const [endH, endM = 0] = dayConfig.close.split(':').map(Number);
    const now = new Date();
    const maxDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    if (date > maxDate) {
      return [];
    }
    
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      const result = await apiClient.getSlotAvailability(clinicId, dateStr);
      
      const slotAvailability = result.data || [];
      
      const slots = [];
      
      // Generate slots for business hours (every 30 minutes)
      for (let minutes = startH * 60 + startM; minutes < endH * 60 + endM; minutes += 30) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Skip past times - if today, must be at least next full hour after current time
        if (date.toDateString() === now.toDateString()) {
          const nextHour = new Date(now);
          nextHour.setHours(now.getHours() + 1, 0, 0, 0);
          if (slotTime < nextHour) continue;
        }
        
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        
        // Check how many bookings exist for this slot
        let bookingCount = 0;
        const slotData = slotAvailability.find(slot => slot.visit_time === timeStr);
        
        if (slotData) {
          // Count existing bookings for this time slot
          bookingCount = slotData.booking_count || 0;
        }
        // If no slotData found, bookingCount remains 0 (available)
        
        // Slot is available if less than 2 people booked
        const isAvailable = bookingCount < 2;
        const isFull = bookingCount >= 2;
        
        slots.push({ 
          hour, 
          minute, 
          isAvailable, 
          isFull,
          bookingCount,
          timeStr 
        });
      }
      
      return slots;
    } catch (error) {
      console.error('❌ Slot availability query failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        clinicId,
        date: date.toISOString()
      });
      
      // If API fails, generate default slots based on business hours only
      const slots = [];
      for (let minutes = startH * 60 + startM; minutes < endH * 60 + endM; minutes += 30) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        if (date.toDateString() === now.toDateString()) {
          const nextHour = new Date(now);
          nextHour.setHours(now.getHours() + 1, 0, 0, 0);
          if (slotTime < nextHour) continue;
        }
        
        slots.push({ 
          hour, 
          minute, 
          isAvailable: true, 
          isFull: false,
          bookingCount: 0,
          timeStr: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
        });
      }
      return slots;
    }
  };

  // Handle date selection
  const handleDateSelect = useCallback(async (date) => {
    
    trigger('light');
    setSelectedDate(date);
    
    // Validate date constraints
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (selectedDay < today) {
      toast.error('Cannot book appointments for past dates');
      return;
    }
    
    const maxDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (date > maxDate) {
      toast.error('Can only book up to 14 days in advance');
      return;
    }
    
    // Check if user has appointment on this date
    const dateEvents = events.filter(e => 
      e.start.toDateString() === date.toDateString() && e.userRowId === userRowId
    );
        
    // If user already has appointment on this date, show cancel dialog
    if (dateEvents.length > 0) {
      const existingEvent = dateEvents[0];
      const appointmentTime = formatTime(existingEvent.start.getHours(), existingEvent.start.getMinutes());
      const appointmentDate = date.toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric'
      });
      
      setModal({ 
        type: 'cancel', 
        data: { 
          eventId: existingEvent.id, 
          date,
          appointmentTime,
          appointmentDate
        } 
      });
      return;
    }
    
    // Immediately show modal with loading state
    setModal({ 
      type: 'book', 
      data: { 
        date, 
        slots: [], 
        userHasOtherBooking: false,
        isLoading: true 
      } 
    });
    
    try {
      // Fetch slots in background
      const slots = await getAvailableSlots(date);
      
      if (slots === 'closed') {
        setModal({ type: null, data: null });
        toast.error('Clinic is closed on this day');
        return;
      }
      
      if (!Array.isArray(slots)) {
        console.error('❌ Invalid slots format:', slots);
        setModal({ type: null, data: null });
        toast.error('Unable to load available time slots');
        return;
      }
      
      // Check if we have any slots at all
      if (slots.length === 0) {
        setModal({ type: null, data: null });
        toast.error('No time slots available for this date');
        return;
      }
      
      // Include all slots but mark availability
      const availableSlots = slots.filter(s => s.isAvailable);
      
      if (availableSlots.length === 0) {
        setModal({ type: null, data: null });
        toast.error('All time slots are full for this date');
        return;
      }
      
      // Update modal with actual data
      setModal({ 
        type: 'book', 
        data: { 
          date, 
          slots, 
          userHasOtherBooking: false,
          isLoading: false 
        } 
      });
    } catch (error) {
      console.error('❌ Error in handleDateSelect:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        date: date.toISOString()
      });
      
      setModal({ type: null, data: null });
      toast.error('Something went wrong while loading time slots. Please try again.');
    }
  }, [events, userRowId, trigger]);

  // Handle event click - show cancel dialog for user's own appointments
  const handleEventClick = useCallback((clickInfo) => {
    trigger('light');
    const event = clickInfo.event;
    
    // Only show dialog for user's own appointments
    if (event.extendedProps.userRowId === userRowId) {
      const appointmentTime = formatTime(event.start.getHours(), event.start.getMinutes());
      const appointmentDate = event.start.toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric'
      });
      
      setModal({ 
        type: 'cancel', 
        data: { 
          eventId: event.id, 
          date: new Date(event.start),
          appointmentTime,
          appointmentDate
        } 
      });
    }
  }, [trigger, userRowId]);

  // Use custom hook for appointment management
  const { actionLoading, bookAppointment, cancelAppointment } = useAppointment(
    clinicId, 
    userRowId, 
    trigger, 
    setEvents, 
    setModal,
    modal
  );

  const handleTimeSelect = useCallback((hour, minute) => {
    if (!modal.data || !modal.data.date) {
      console.warn('Modal data or date is missing:', modal);
      return;
    }
    const date = new Date(modal.data.date);
    date.setHours(hour, minute, 0, 0);
    bookAppointment(hour, minute, date);
  }, [modal.data, bookAppointment]);



  const formatTime = (hour, minute = 0) => 
    `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  // Render modals using components
  const renderModal = () => {
    if (!modal || !modal.type) return null;

    if (modal.type === 'confirmCancel') {
      if (!modal.data || !modal.data.event) {
        console.warn('Modal data or event is missing for confirmCancel:', modal);
        return null;
      }
      const { event } = modal.data;
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Cancel Appointment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your appointment on{' '}
              {event.start.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })} at {event.start.toLocaleTimeString('en-US', { 
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setModal({ type: null, data: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                Keep
              </button>
              <button
                onClick={() => {
                  if (actionLoading) return;
                  // Pass the event data directly to avoid modal state issues
                  const eventData = modal.data.event;
                  cancelAppointment(eventData);
                }}
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors ${
                  actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (modal.type === 'book') {
      return (
        <BookingModal
          modal={modal}
          setModal={setModal}
          onTimeSelect={handleTimeSelect}
          loading={actionLoading}
          formatTime={formatTime}
          businessHours={businessHours}
        />
      );
    }

    if (modal.type === 'cancel') {
      return (
        <CancelModal
          modal={modal}
          setModal={setModal}
          onCancel={() => {
            // Pass the event data directly for cancel modal type
            const eventId = modal.data.eventId;
            cancelAppointment({ id: eventId });
          }}
          loading={actionLoading}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>
        {`
          .fc-day-today { background: #f8fafc !important; }
          .fc-day-past { opacity: 0.4; }
          .fc-day-future:hover { background: #f1f5f9; }
          .fc-event { 
            border-radius: 6px !important; 
            font-weight: 500; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            cursor: pointer !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 20px !important;
          }
          .fc-event-main {
            padding: 2px 4px !important;
            height: 100% !important;
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .fc-event-title {
            font-size: 11px !important;
            font-weight: 600 !important;
            text-align: center !important;
            width: 100% !important;
          }
          .fc-event-time {
            display: none !important;
          }
          .fc-event-title-container {
            padding: 0 !important;
          }
          .fc-daygrid-event .fc-event-main {
            padding: 1px 2px !important;
          }
          .fc-daygrid-event {
            margin: 1px !important;
            border-radius: 4px !important;
          }
          .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 600 !important; color: #111827; }
          .fc-button { border-radius: 6px !important; font-size: 0.875rem !important; }
          .fc-button-primary { background: #4f46e5 !important; border: none !important; }
          .fc-button-primary:hover { background: #4338ca !important; }
          .fc-toolbar { margin-bottom: 1rem !important; }
          .fc-daygrid-day { 
            border: 1px solid #f3f4f6 !important; 
            aspect-ratio: 1 !important;
            height: 0 !important;
            padding-bottom: 14.28% !important;
            position: relative !important;
          }
          .fc-daygrid-day-frame {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            height: 100% !important;
          }
          .fc-daygrid-day-top {
            position: absolute !important;
            top: 2px !important;
            left: 2px !important;
            right: 2px !important;
            z-index: 2 !important;
          }
          .fc-daygrid-day-events {
            position: absolute !important;
            top: 20px !important;
            left: 2px !important;
            right: 2px !important;
            bottom: 2px !important;
          }
          .fc-daygrid-day-number {
            font-size: 12px !important;
            font-weight: 500 !important;
          }
          
          /* Mobile specific adjustments */
          @media (max-width: 768px) {
            .fc-daygrid-day {
              min-height: 60px !important;
              height: 60px !important;
              padding-bottom: 0 !important;
            }
            .fc-daygrid-day-number {
              font-size: 11px !important;
            }
            .fc-event {
              font-size: 9px !important;
              min-height: 16px !important;
            }
            .fc-event-title {
              font-size: 9px !important;
            }
          }
          
          @keyframes scale-in {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-scale-in { animation: scale-in 0.15s ease-out; }

          /* Mobile-optimized date picker styles */
          .react-datepicker {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            border: none;
            border-radius: 0;
            box-shadow: none;
            background: transparent;
            width: 100% !important;
            max-width: none !important;
          }
          
          .react-datepicker__navigation {
            display: none !important;
          }
          
          .react-datepicker__current-month {
            display: none !important;
          }
          
          .react-datepicker__header {
            background: transparent;
            border: none;
            padding: 0;
          }
          
          .react-datepicker__month-container {
            width: 100% !important;
            background: transparent;
          }
          
          .react-datepicker__month {
            margin: 0;
            padding: 0;
          }
          
          .react-datepicker__day-names {
            margin: 0;
            padding: 0;
            background: transparent;
          }
          
          .react-datepicker__day-name {
            color: #6b7280;
            font-weight: 600;
            font-size: 16px;
            padding: 16px 8px;
            margin: 0;
            width: 14.28%;
            text-align: center;
          }
          
          .react-datepicker__days {
            margin: 0;
            padding: 0;
            background: transparent;
          }
          
          .react-datepicker__day {
            border-radius: 8px;
            margin: 4px;
            width: 40px;
            height: 40px;
            line-height: 40px;
            font-size: 16px;
            font-weight: 500;
            background: transparent;
            border: none;
            color: #111827;
            text-align: center;
          }
          
          .react-datepicker__day:hover {
            background-color: #3b82f6;
            color: white;
            transform: scale(1.05);
          }
          
          .react-datepicker__day--selected {
            background-color: #3b82f6;
            color: white;
            font-weight: 600;
          }
          
          .react-datepicker__day--keyboard-selected {
            background-color: #3b82f6;
            color: white;
          }

          /* Booked date styles */
          .react-datepicker__day--highlighted {
            position: relative;
          }

          .react-datepicker__day--highlighted::after {
            content: '';
            position: absolute;
            top: 8px;
            right: 8px;
            width: 6px;
            height: 6px;
            background-color: #3b82f6;
            border-radius: 50%;
          }
          
          .react-datepicker__day--outside-month {
            color: #d1d5db;
          }
          
          .react-datepicker__day--disabled {
            color: #d1d5db !important;
            cursor: not-allowed !important;
            background-color: #f3f4f6 !important;
            opacity: 0.5;
          }

          .react-datepicker__day--disabled:hover {
            background-color: #f3f4f6 !important;
            color: #d1d5db !important;
            transform: none !important;
          }

          /* Mobile touch optimization */
          @media (max-width: 768px) {
            .react-datepicker__day {
              width: 45px;
              height: 45px;
              line-height: 45px;
              font-size: 18px;
              margin: 4px;
            }
            
                      .react-datepicker__day-name {
            font-size: 18px;
            padding: 20px 8px;
          }
          

          }
        `}
      </style>

      {/* Calendar */}
      
      {/* Calendar */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <CalendarHeader
              currentMonth={currentMonth}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
            />

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <span className="text-gray-600 font-medium">Loading your calendar...</span>
                <span className="text-sm text-gray-500">This may take a moment</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Date Picker - Full Screen Calendar */}
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <DatePicker
                      selected={selectedDate}
                      onChange={handleDateSelect}
                      inline
                      minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                      maxDate={new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000)}
                      className="w-full"
                      showTimeSelect={false}
                      showMonthDropdown={false}
                      showYearDropdown={false}
                      dropdownMode="select"
                      dateFormat="MMM dd, yyyy"
                      openToDate={currentMonth}
                      onMonthChange={setCurrentMonth}
                      disabledKeyboardNavigation
                      calendarStartDay={1}
                      renderCustomHeader={() => null}
                      filterDate={isWithinBusinessHours}
                      highlightDates={events.map(event => event.start)}
                    />
                  </div>
                </div>
                
                {/* Appointments Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Appointments</h3>
                  {events.length > 0 ? (
                    <div className="space-y-3">
                      {events.map(event => (
                        <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {event.start.toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  day: 'numeric',
                                  weekday: 'long'
                                })}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {event.start.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setModal({
                                type: 'confirmCancel',
                                data: { eventId: event.id, event: event }
                              });
                            }}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">Your appointment times will be displayed here</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  );
}
