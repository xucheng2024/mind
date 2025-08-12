import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import cacheManager from '../lib/cache';
import { Calendar, Clock, Check, X, RotateCcw, AlertCircle } from 'lucide-react';
import { useHapticFeedback } from '../components/HapticFeedback';
import toast from 'react-hot-toast';
import { logSubmitBook, logCancelAppointment } from '../lib/logger';

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
  
  // Modal states
  const [modal, setModal] = useState({ type: null, data: null });

  // Mobile debugging
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('📱 Mobile device detected:', {
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        touchSupport: 'ontouchstart' in window,
        maxTouchPoints: navigator.maxTouchPoints
      });
      
      // Show mobile info toast
      toast.success(`📱 Mobile mode: ${window.innerWidth}x${window.innerHeight}`);
      
      // Add global touch event listener
      const handleGlobalTouch = (e) => {
        if (e.target.closest('.fc-daygrid-day')) {
          console.log('📱 Global touch on calendar day:', e.target);
        }
      };
      
      document.addEventListener('touchstart', handleGlobalTouch, { passive: true });
      
      return () => {
        document.removeEventListener('touchstart', handleGlobalTouch);
      };
    }
  }, []);

  // Redirect if missing params
  useEffect(() => {
    if (!clinicId || !userRowId) {
      navigate(`/booking${clinicId ? ('?clinic_id=' + clinicId) : ''}`);
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
    ('getAvailableSlots called with date:', date);
    
    if (!businessHours) {
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
    
    if (date > maxDate) return [];
    
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
      console.warn('Slot availability query failed:', error);
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
  const handleDateSelect = useCallback(async (selectInfo) => {
    console.log('🔍 handleDateSelect called with:', selectInfo);
    
    // Show visible debug info on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      toast.success(`📱 Mobile click detected! Date: ${selectInfo.start.toDateString()}`);
    }
    
    trigger('light');
    const date = selectInfo.start;
    const now = new Date();
    
    // Validate date constraints
    if (date < now.setHours(0, 0, 0, 0)) {
      toast.error('Cannot book appointments in the past');
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
    
    // If user already has appointment on this date, show cancel/reschedule options
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
    
    // Show loading state
    toast.loading('Loading available time slots...');
    
    const slots = await getAvailableSlots(date);
    
    // Dismiss loading toast
    toast.dismiss();
    
    if (slots === 'closed') {
      toast.error('Clinic is closed on this day');
      return;
    }
    
    if (!Array.isArray(slots)) {
      toast.error('Unable to load available time slots');
      return;
    }
    
    // Include all slots but mark availability
    const availableSlots = slots.filter(s => s.isAvailable);
    if (availableSlots.length === 0) {
      toast.error('No available time slots');
      return;
    }
    
    // Show success message with slot count
    toast.success(`Found ${availableSlots.length} available time slots!`);
    
    setModal({ 
      type: 'book', 
      data: { date, slots, userHasOtherBooking: false } 
    });
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

  // Book appointment
  const bookAppointment = async (hour, minute) => {
          try {
        trigger('success');
        const date = new Date(modal.data.date);
        date.setHours(hour, minute, 0, 0);
        
                // Log the booking action
        await logSubmitBook({
          clinic_id: clinicId,
          user_id: userRowId,
          appointment_id: null, // Will be set after creation
          service_type: 'consultation',
          doctor_id: null,
          appointment_date: date.toISOString(),
          duration_minutes: 30,
          booking_method: 'web_app',
          payment_status: 'pending',
          total_amount: null
        });
      
      // Validate user and check existing bookings
      const [validateResult, { data: existingBookings }] = await Promise.all([
        apiClient.validateUser(clinicId, userRowId),
        apiClient.getUserVisits(clinicId, userRowId)
      ]);
      
      // Update cached user name if available
      if (validateResult.data?.full_name) {
        const currentLoginInfo = cacheManager.getLoginInfo();
        if (currentLoginInfo.userId && currentLoginInfo.userRowId) {
          cacheManager.saveLoginInfo(
            currentLoginInfo.userId, 
            currentLoginInfo.userRowId, 
            currentLoginInfo.clinicId,
            validateResult.data.full_name
          );
        }
      }
      
      const today = new Date(modal.data.date);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      const todayBookings = (existingBookings || []).filter(booking => {
        const bookingDate = new Date(booking.book_time);
        return booking.status === 'booked' && bookingDate >= today && bookingDate < tomorrow;
      });
      
      if (todayBookings.length > 0) {
        toast.error('You already have an appointment today');
        return;
      }
      
      // Create appointment
      const createResponse = await apiClient.createVisit({
        user_row_id: userRowId,
        clinic_id: clinicId,
        book_time: date.toISOString(),
        visit_time: date.toISOString(),
        status: 'booked',
        is_first: false,
      });
      
      const appointmentId = createResponse.data?.id || createResponse.id;
      
      // Log the successful booking with actual appointment ID
      await logSubmitBook({
        clinic_id: clinicId,
        user_id: userRowId,
        appointment_id: appointmentId,
        service_type: 'consultation',
        doctor_id: null,
        appointment_date: date.toISOString(),
        duration_minutes: 30,
        booking_method: 'web_app',
        payment_status: 'pending',
        total_amount: null
      });
      
      // Update UI with the actual ID from server
      const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      const newEvent = {
        id: appointmentId,
        title: timeString,
        start: date,
        end: new Date(date.getTime() + 30 * 60 * 1000),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        textColor: 'white',
        userRowId
      };
      
      setEvents(prev => [...prev, newEvent]);
      setModal({ type: null, data: null });
      toast.success(`Appointment booked: ${formatTime(hour, minute)}`);
      
    } catch (error) {
      trigger('error');
      console.error('Booking failed:', error);
      toast.error('Booking failed. Please try again.');
    }
  };

  // Cancel appointment
  const cancelAppointment = async () => {
    try {
      trigger('warning');
      
      // Get event details for logging
      const event = events.find(e => e.id === modal.data.eventId);
      if (event) {
        // Log the cancellation action with original book_time
        await logCancelAppointment({
          clinic_id: clinicId,
          user_id: userRowId,
          appointment_id: modal.data.eventId,
          original_date: event.start.toISOString()
        });
      }
      
      await apiClient.updateVisit(modal.data.eventId, { status: 'canceled' });
      setEvents(prev => prev.filter(e => e.id !== modal.data.eventId));
      setModal({ type: null, data: null });
      toast.success('Appointment cancelled');
    } catch (error) {
      trigger('error');
      console.error('Cancel failed:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const formatTime = (hour, minute = 0) => 
    `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  // Render modal content
  const renderModal = () => {
    if (!modal.type) return null;

    const commonModalProps = {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4",
      onClick: (e) => {
        if (e.target === e.currentTarget) {
          setModal({ type: null, data: null });
        }
      }
    };

    if (modal.type === 'book') {
      const { date, slots, userHasOtherBooking } = modal.data;
      const amSlots = slots.filter(s => s.hour < 12);
      const pmSlots = slots.filter(s => s.hour >= 12);
      
      return (
        <div {...commonModalProps}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Select Time
                  </h3>
                  <p className="text-sm text-gray-600">
                    {date.toLocaleDateString('en-US', { 
                      month: 'long', day: 'numeric', weekday: 'long'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setModal({ type: null, data: null })}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {[
                { label: 'Morning', slots: amSlots },
                { label: 'Afternoon', slots: pmSlots }
              ].map(({ label, slots }) => 
                slots.length > 0 && (
                  <div key={label} className="mb-5 last:mb-0">
                    <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">{label}</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map(slot => {
                        const isClickable = slot.isAvailable;
                        
                        return (
                          <button
                            key={`${slot.hour}:${slot.minute}`}
                            onClick={() => {
                              if (!isClickable) return;
                              bookAppointment(slot.hour, slot.minute);
                            }}
                            disabled={!isClickable}
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
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      );
    }



    if (modal.type === 'cancel') {
      return (
        <div {...commonModalProps}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Already Booked
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                To reschedule, please cancel first
              </p>
              <div className="space-y-3">
                <button
                  onClick={cancelAppointment}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel Appointment
                </button>
                <button
                  onClick={() => setModal({ type: null, data: null })}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                >
                  Keep
                </button>
              </div>
            </div>
          </div>
        </div>
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
        `}
      </style>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Appointment Calendar</h1>
              <p className="text-sm text-gray-600">{clinicInfo?.name || 'Select your appointment time'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Calendar */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading calendar...</span>
              </div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                  left: 'prev',
                  center: 'title',
                  right: 'next'
                }}
                initialView="dayGridMonth"
                selectable={true}
                events={events}
                select={handleDateSelect}
                eventClick={handleEventClick}
                height="auto"
                displayEventTime={false}
                eventDisplay="block"
                selectConstraint={{
                  start: new Date(),
                  end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                }}
                // Mobile-specific configuration
                selectMirror={true}
                unselectAuto={true}
                selectMinDistance={0}
                // Touch event handling
                eventStartEditable={false}
                eventDurationEditable={false}
                eventResizableFromStart={false}
                // Mobile viewport optimization
                aspectRatio={1.35}
                expandRows={false}
                // Add mobile-specific event handlers
                selectAllow={(selectInfo) => {
                  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                  if (isMobile) {
                    console.log('📱 Mobile select allow check:', selectInfo);
                    toast.info(`Selecting date: ${selectInfo.start.toDateString()}`);
                  }
                  return true;
                }}
                dayCellDidMount={(arg) => {
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const maxDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
                  const cellDate = new Date(arg.date.getFullYear(), arg.date.getMonth(), arg.date.getDate());
                  
                  // Only allow today and next 14 days
                  if (cellDate < today || cellDate > maxDate) {
                    arg.el.style.opacity = '0.3';
                    arg.el.style.pointerEvents = 'none';
                    arg.el.style.cursor = 'not-allowed';
                  } else {
                    // Check if within business hours (basic check)
                    if (businessHours) {
                      const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
                      const dayConfig = businessHours[weekdays[cellDate.getDay()]];
                      
                      if (!dayConfig || dayConfig.closed) {
                        arg.el.style.opacity = '0.5';
                        arg.el.style.backgroundColor = '#f3f4f6';
                        arg.el.style.pointerEvents = 'none';
                        arg.el.title = 'Clinic closed';
                      } else {
                        // Always allow clicking for valid business days
                        arg.el.style.cursor = 'pointer';
                        arg.el.style.pointerEvents = 'auto';
                        arg.el.title = 'Click to book or manage appointment';
                        
                        // Add touch event debugging for mobile
                        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                        if (isMobile) {
                          // Add touch event listeners for debugging
                          arg.el.addEventListener('touchstart', (e) => {
                            console.log('📱 Touch start on date:', cellDate.toDateString());
                            toast.info(`Touch detected on ${cellDate.toDateString()}`);
                          }, { passive: true });
                          
                          arg.el.addEventListener('click', (e) => {
                            console.log('📱 Click event on date:', cellDate.toDateString());
                            toast.info(`Click detected on ${cellDate.toDateString()}`);
                          });
                        }
                      }
                    } else {
                      arg.el.style.cursor = 'pointer';
                      arg.el.style.pointerEvents = 'auto';
                      arg.el.title = 'Click to book or manage appointment';
                    }
                  }
                }}
                datesSet={() => {
                  // Force re-render when dates change to ensure click handlers work
                  setTimeout(() => {
                    const cells = document.querySelectorAll('.fc-daygrid-day');
                    cells.forEach(cell => {
                      const dateStr = cell.getAttribute('data-date');
                      if (dateStr) {
                        const cellDate = new Date(dateStr);
                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const maxDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
                        
                        if (cellDate >= today && cellDate <= maxDate) {
                          if (businessHours) {
                            const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
                            const dayConfig = businessHours[weekdays[cellDate.getDay()]];
                            
                            if (dayConfig && !dayConfig.closed) {
                              cell.style.cursor = 'pointer';
                              cell.style.pointerEvents = 'auto';
                            }
                          } else {
                            cell.style.cursor = 'pointer';
                            cell.style.pointerEvents = 'auto';
                          }
                        }
                      }
                    });
                  }, 100);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  );
}
