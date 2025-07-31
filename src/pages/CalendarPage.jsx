import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FaCalendarAlt, FaClock, FaUser, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import { EnhancedButton, Modal, LoadingSpinner } from '../components';

// Set dayjs locale
dayjs.locale('en');

export default function CalendarPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Use URL params first, then localStorage
  let clinicId = searchParams.get('clinic_id');
  let userRowId = searchParams.get('user_row_id');
  if (!clinicId) clinicId = localStorage.getItem('clinic_id');
  if (!userRowId) userRowId = localStorage.getItem('user_row_id');

  // Redirect to booking if missing
  React.useEffect(() => {
    console.log('🔍 CalendarPage - Checking params:', { clinicId, userRowId });
    if (!clinicId || !userRowId) {
      console.log('⚠️ CalendarPage - Missing params, redirecting to booking');
      navigate(`/booking${clinicId ? ('?clinic_id=' + clinicId) : ''}`);
    } else {
      console.log('✅ CalendarPage - Params valid, proceeding');
    }
  }, [clinicId, userRowId, navigate]);

  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalEvents, setModalEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [businessHours, setBusinessHours] = useState(null);
  const [availableHours, setAvailableHours] = useState([]);
  const [isClosedDay, setIsClosedDay] = useState(false);
  const [userHasOtherBooking, setUserHasOtherBooking] = useState(false);
  const [changeAppointment, setChangeAppointment] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [clickedHour, setClickedHour] = useState(null);
  const [activeTab, setActiveTab] = useState('am');
  const [notification, setNotification] = useState(null);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [refresh, setRefresh] = useState(0);

  // Auto-close notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch clinic and user info
  useEffect(() => {
    if (!clinicId || !userRowId) return;
    
    // Fetch clinic info
    supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          console.log('🏥 Clinic info loaded:', {
            clinicId,
            businessHours: data.business_hours,
            clinicName: data.name
          });
          setClinicInfo(data);
          setBusinessHours(data.business_hours);
        } else {
          console.error('❌ Failed to load clinic info:', error);
        }
      });

    // Fetch user info
    supabase
      .from('users')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('row_id', userRowId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setUserInfo(data);
        }
      });
  }, [clinicId, userRowId]);

  // Fetch appointment data
  useEffect(() => {
    if (!clinicId || !userRowId) return;
    
    console.log('📊 CalendarPage - Fetching appointments for:', { clinicId, userRowId });
    setLoading(true);
    supabase
      .from('visits')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('user_row_id', userRowId)
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          console.error('❌ CalendarPage - Failed to fetch appointments:', error);
          return;
        }
        const evts = (data || [])
          .filter(v => v.status === 'booked')
          .map(v => {
            const startDate = v.book_time || v.visit_time ? new Date(v.book_time || v.visit_time) : null;
            if (!startDate) return null;
            return {
              id: v.id,
              title: 'Appointment',
              start: startDate,
              end: new Date(startDate.getTime() + 30 * 60 * 1000),
              status: v.status,
              userRowId: v.user_row_id,
              backgroundColor: 'transparent',
              borderColor: '#3B82F6',
              textColor: '#3B82F6',
              extendedProps: {
                type: 'appointment'
              }
            };
          })
          .filter(e => e && e.start);
        setEvents(evts);
      });
  }, [clinicId, userRowId, refresh]);

  // Format time helper
  function formatTime(hour, minute = 0) {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  // Get available hours for selected date
  async function getAvailableHoursForDate(date) {
    if (!businessHours || !date) return [];
    
    const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const weekday = weekdays[date.getDay()];
    const dayConfig = businessHours[weekday];
    if (!dayConfig || dayConfig.closed) return 'closed';
    
    const [startH, startM = 0] = dayConfig.open.split(':').map(Number);
    const [endH, endM = 0] = dayConfig.close.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setDate(now.getDate() + 13);
    maxDate.setHours(23,59,59,999);
    
    if (date > maxDate) return [];
    
    // Query slot_availability table (only if table exists)
    const dateStr = date.toISOString().split('T')[0];
    let slotAvailability = null;
    let error = null;
    
    // Query slot_availability table
    if (clinicId) {
      console.log('🔍 Querying slot_availability with:', { clinicId, dateStr });
      try {
        const result = await supabase
          .from('slot_availability')
          .select('visit_time, is_available')
          .eq('clinic_id', clinicId)
          .eq('visit_date', dateStr);
        
        slotAvailability = result.data;
        error = result.error;
        
        if (error) {
          console.log('⚠️ Slot availability query failed:', error.message);
          // Continue with empty slotAvailability (all slots will be available by default)
        } else {
          console.log('✅ Slot availability query successful:', slotAvailability);
        }
      } catch (err) {
        console.log('⚠️ Slot availability query exception:', err);
        // Continue with empty slotAvailability (all slots will be available by default)
      }
    } else {
      console.log('⚠️ No clinicId available for slot query');
    }
    
    console.log('📊 Slot availability debug:', {
      date: dateStr,
      clinicId,
      slotAvailability,
      error,
      dayConfig,
      weekday
    });
    
    // If no slot_availability data found, create default slots
    if (!slotAvailability || slotAvailability.length === 0) {
      console.log('⚠️ No slot_availability data found, using default slots');
    }
    
    let slots = [];
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const slotEnd = new Date(date);
      slotEnd.setHours(hour, minute + 30, 0, 0);
      if (date.toDateString() === now.toDateString()) {
        if (slotEnd <= now) continue;
      }
      
      // Check if slot is available from slot_availability table
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      const slotData = slotAvailability?.find(slot => slot.visit_time === timeStr);
      
      // Check if slot is available from slot_availability table
      // If no slot_availability data found, slot is available (no booking)
      const isAvailable = slotData ? slotData.is_available : true;
      
      slots.push({ 
        hour, 
        minute, 
        isAvailable,
        timeStr 
      });
    }
    return slots;
  }

  // Handle date selection
  const handleDateSelect = useCallback(async (selectInfo) => {
    const selectedDate = selectInfo.start;
    setSelectedDate(selectedDate);
    
    // Check if day is closed
    const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const weekday = weekdays[selectedDate.getDay()];
    const dayConfig = businessHours?.[weekday];
    const isClosed = !dayConfig || dayConfig.closed;
    
    // Debug logging
    console.log('📅 Date selection debug:', {
      selectedDate: selectedDate.toDateString(),
      weekday,
      dayConfig,
      isClosed,
      businessHours,
      // Add device and timezone info
      deviceInfo: {
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        currentTime: new Date().toISOString(),
        localTime: new Date().toString(),
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      }
    });
    
    setIsClosedDay(isClosed);
    
    if (!isClosed) {
      const availableSlots = await getAvailableHoursForDate(selectedDate);
      console.log('📅 Available slots result:', availableSlots);
      
      // Handle different return types from getAvailableHoursForDate
      if (availableSlots === 'closed') {
        setAvailableHours([]);
        setIsClosedDay(true);
      } else if (Array.isArray(availableSlots)) {
        setAvailableHours(availableSlots);
        setIsClosedDay(false);
      } else {
        console.error('❌ Unexpected result from getAvailableHoursForDate:', availableSlots);
        setAvailableHours([]);
      }
      
      // Get events for the selected date for modal
      const selectedDateStart = new Date(selectedDate);
      selectedDateStart.setHours(0, 0, 0, 0);
      const selectedDateEnd = new Date(selectedDate);
      selectedDateEnd.setHours(23, 59, 59, 999);
      
      const modalEvents = events.filter(e => 
        e.start >= selectedDateStart && e.start <= selectedDateEnd
      );
      setModalEvents(modalEvents);
      
      // Check if user has other booking today
      const today = new Date(selectedDate);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const todayEvents = events.filter(e => 
        e.start >= today && e.start < tomorrow && e.userRowId === userRowId
      );
      setUserHasOtherBooking(todayEvents.length > 0);
      
      // If user has appointment today, show cancel confirmation directly
      if (todayEvents.length > 0) {
        setConfirmCancel({ eventId: todayEvents[0].id });
        return;
      }
    }
    
    setShowModal(true);
  }, [businessHours, events, userRowId]);

  // Handle event click
  const handleEventClick = useCallback((clickInfo) => {
    const event = clickInfo.event;
    if (event.extendedProps.userRowId === userRowId) {
      setConfirmCancel({
        eventId: event.id,
      });
    }
  }, [userRowId]);

  // Validate user existence
  async function validateUser() {
    if (!clinicId || !userRowId) return false;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('row_id')
        .eq('clinic_id', clinicId)
        .eq('row_id', userRowId)
        .single();
      
      if (error || !data) {
        console.error('User validation failed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('User validation failed:', error);
      return false;
    }
  }

  // Handle booking
  async function handleBook(hour, minute = 0) {
    const date = new Date(selectedDate);
    date.setHours(hour, minute, 0, 0);
    setClickedHour(`${hour}:${minute.toString().padStart(2, '0')}`);
    
    try {
      const userExists = await validateUser();
      if (!userExists) {
        setNotification({ type: 'error', message: 'User validation failed. Please try logging in again.' });
        setTimeout(() => navigate(`/booking${clinicId ? ('?clinic_id=' + clinicId) : ''}`), 2000);
        return;
      }
      
      const today = new Date(selectedDate);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const { data: existingBookings } = await supabase
        .from('visits')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('user_row_id', userRowId)
        .eq('status', 'booked')
        .gte('book_time', today.toISOString())
        .lt('book_time', tomorrow.toISOString());
      
      if (existingBookings && existingBookings.length > 0) {
        setNotification({ type: 'warning', message: 'You already have an appointment today. Please cancel your existing appointment first.' });
        setClickedHour(null);
        return;
      }
      
      const { error } = await supabase
        .from('visits')
        .insert([{
          user_row_id: userRowId,
          clinic_id: clinicId,
          book_time: date.toISOString(),
          visit_time: date.toISOString(),
          status: 'booked',
          is_first: false,
        }]);
      
      if (error) throw error;
      
      const newEvent = {
        id: Date.now(),
                      title: `${formatTime(hour, minute)}`,
        start: new Date(date),
        end: new Date(date.getTime() + 30 * 60 * 1000),
        status: 'booked',
        userRowId: userRowId,
        backgroundColor: 'transparent',
        borderColor: '#3B82F6',
        textColor: '#3B82F6',
        extendedProps: {
          type: 'appointment'
        }
      };
      
      setEvents(prev => [...prev, newEvent]);
      setNotification({ type: 'success', message: `Appointment booked successfully for ${formatTime(hour, minute)}!` });
      
      setTimeout(() => {
        setShowModal(false);
        setSelectedDate(null);
        setClickedHour(null);
      }, 800);
    } catch (error) {
      console.error('Booking failed:', error);
      if (error.code === '23503') {
        setNotification({ type: 'error', message: 'User not found. Please try logging in again.' });
        setTimeout(() => navigate(`/booking${clinicId ? ('?clinic_id=' + clinicId) : ''}`), 2000);
      } else {
        setNotification({ type: 'error', message: 'Booking failed. Please try again.' });
      }
      setClickedHour(null);
    }
  }

  // Confirm cancel appointment
  async function confirmCancelBooking() {
    if (!confirmCancel) return;
    
    await supabase
      .from('visits')
      .update({ status: 'canceled' })
      .eq('id', confirmCancel.eventId);
    
    setEvents(prev => prev.filter(e => e.id !== confirmCancel.eventId));
    setConfirmCancel(null);
    setShowModal(false);
    setSelectedDate(null);
    setClickedHour(null);
    setUserHasOtherBooking(false);
    setActiveTab('am');
    setRefresh(r => r + 1);
    setNotification({ type: 'success', message: 'Appointment cancelled.' });
  }

  // Handle appointment change
  async function handleChangeAppointment() {
    if (!changeAppointment) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const { data: todayVisits } = await supabase
        .from('visits')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('user_row_id', userRowId)
        .eq('status', 'booked')
        .gte('book_time', today.toISOString())
        .lt('book_time', tomorrow.toISOString());
      
      if (todayVisits && todayVisits.length > 0) {
        for (const visit of todayVisits) {
          await supabase
            .from('visits')
            .update({ status: 'canceled' })
            .eq('id', visit.id);
        }
      }
      
      const newDate = new Date(selectedDate);
      newDate.setHours(changeAppointment.hour, changeAppointment.minute, 0, 0);
      
      const { error } = await supabase
        .from('visits')
        .insert([{
          user_row_id: userRowId,
          clinic_id: clinicId,
          book_time: newDate.toISOString(),
          visit_time: newDate.toISOString(),
          status: 'booked',
          is_first: false,
        }]);
      
      if (error) throw error;
      
      const newEvent = {
        id: Date.now(),
                      title: `${formatTime(changeAppointment.hour, changeAppointment.minute)}`,
        start: new Date(newDate),
        end: new Date(newDate.getTime() + 30 * 60 * 1000),
        status: 'booked',
        userRowId: userRowId,
        backgroundColor: 'transparent',
        borderColor: '#3B82F6',
        textColor: '#3B82F6',
        extendedProps: {
          type: 'appointment'
        }
      };
      
      setEvents(prev => [
        ...prev.filter(e => e.userRowId !== userRowId || e.status === 'canceled'),
        newEvent
      ]);
      
      setChangeAppointment(null);
      setShowModal(false);
      setSelectedDate(null);
      setClickedHour(null);
      setUserHasOtherBooking(false);
      setActiveTab('am');
      setRefresh(r => r + 1);
      setNotification({ type: 'success', message: `Appointment changed successfully to ${formatTime(changeAppointment.hour, changeAppointment.minute)}!` });
      
    } catch (error) {
      console.error('Failed to change appointment:', error);
      setNotification({ type: 'error', message: 'Failed to change appointment. Please try again.' });
    }
  }

  // Separate AM and PM slots
  function separateAmPmSlots(slots) {
    const amSlots = slots.filter(slot => slot.hour < 12);
    const pmSlots = slots.filter(slot => slot.hour >= 12);
    return { amSlots, pmSlots };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <style>
        {`
          .square-calendar .fc-daygrid-day {
            aspect-ratio: 1;
            min-height: 80px;
          }
          
          .square-calendar .fc-daygrid-day-frame {
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          
          .square-calendar .fc-daygrid-day-events {
            flex: 1;
            min-height: 0;
          }
          
          .square-calendar .fc-daygrid-day-number {
            padding: 8px;
            font-weight: 500;
          }
          
          .square-calendar .fc-daygrid-day.fc-day-today {
            background-color: #eff6ff !important;
          }
          
          .square-calendar .fc-daygrid-day.fc-day-past {
            opacity: 0.7;
          }
          
          .square-calendar .fc-daygrid-day.fc-day-future {
            cursor: pointer;
          }
          
          .square-calendar .fc-daygrid-day.fc-day-future:hover {
            background-color: #f3f4f6;
          }
        `}
      </style>

      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Calendar */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    headerToolbar={{
                      left: 'prev',
                      center: 'title',
                      right: 'next'
                    }}
                    initialView="dayGridMonth"
                    editable={false}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    events={events}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    height="auto"
                    selectConstraint={{
                      start: new Date(),
                      end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                    }}
                    selectMinDistance={0}
                    selectLongPressDelay={0}
                    eventTimeFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }}
                    dayHeaderFormat={{
                      weekday: 'short'
                    }}
                    titleFormat={{
                      month: 'long',
                      year: 'numeric'
                    }}
                    buttonText={{
                      today: 'Today',
                      month: 'Month',
                      week: 'Week',
                      list: 'List'
                    }}
                    className="square-calendar"

                    dayCellDidMount={(arg) => {
                      // Add click and touch handlers to day cells for better mobile support
                      const handleDateClick = () => {
                        const date = arg.date;
                        handleDateSelect({ start: date });
                      };
                      
                      // Add click event
                      arg.el.addEventListener('click', handleDateClick);
                      
                      // Add touch events for mobile
                      arg.el.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        console.log('📱 Touch start on date:', arg.date.toDateString());
                        arg.el.style.backgroundColor = '#f3f4f6';
                      });
                      
                      arg.el.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        console.log('📱 Touch end on date:', arg.date.toDateString());
                        arg.el.style.backgroundColor = '';
                        handleDateClick();
                      });
                      
                      // Gray out disabled dates
                      const now = new Date();
                      const maxDate = new Date(now);
                      maxDate.setDate(now.getDate() + 13);
                      maxDate.setHours(23,59,59,999);
                      
                      if (arg.date < now || arg.date > maxDate) {
                        arg.el.style.opacity = '0.3';
                        arg.el.style.pointerEvents = 'none';
                      }
                      

                    }}
                  />
                )}
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* Time Selection Modal */}
      {showModal && !confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="relative">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6 text-white">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedDate(null);
                    setClickedHour(null);
                    setUserHasOtherBooking(false);
                    setChangeAppointment(null);
                    setActiveTab('am');
                  }}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200"
                >
                  ×
                </button>
                <h3 className="text-xl font-bold mb-2">Select Appointment Time</h3>
                <p className="text-blue-100">
                  {selectedDate?.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Content */}
              <div className="p-8">
                {isClosedDay ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <FaClock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Closed Today</h4>
                    <p className="text-gray-500">The clinic is closed on this day. Please select another date.</p>
                  </div>
                ) : userHasOtherBooking ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <FaClock className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Already Booked</h4>
                    <p className="text-gray-500 mb-4">Cancel to change.</p>
                    <EnhancedButton
                      variant="danger"
                      onClick={() => {
                        // Find today's appointment and trigger cancel modal
                        const today = new Date(selectedDate);
                        today.setHours(0, 0, 0, 0);
                        const tomorrow = new Date(today);
                        tomorrow.setDate(today.getDate() + 1);
                        const todayEvents = modalEvents.filter(e =>
                          e.start >= today && e.start < tomorrow && e.userRowId === userRowId && e.status === 'booked'
                        );
                        if (todayEvents.length > 0) {
                          setConfirmCancel({ eventId: todayEvents[0].id });
                        }
                      }}
                    >
                      Cancel Appointment
                    </EnhancedButton>
                  </div>
                ) : availableHours.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <FaClock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Available Slots</h4>
                    <p className="text-gray-500">All time slots for today have been booked or are in the past.</p>
                  </div>
                ) : (
                  <div>
                    {/* AM/PM Tabs */}
                    <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                      {(() => {
                        const { amSlots, pmSlots } = separateAmPmSlots(availableHours);
                        const hasAmSlots = amSlots.filter(s => s.isAvailable).length > 0;
                        const hasPmSlots = pmSlots.filter(s => s.isAvailable).length > 0;
                        
                        return (
                          <>
                            <button
                              onClick={() => setActiveTab('am')}
                              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                                activeTab === 'am'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-800'
                              } ${!hasAmSlots ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={!hasAmSlots}
                            >
                              Morning
                              {hasAmSlots && <span className="ml-1 text-xs">({amSlots.filter(s => s.isAvailable).length})</span>}
                            </button>
                            <button
                              onClick={() => setActiveTab('pm')}
                              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                                activeTab === 'pm'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-800'
                              } ${!hasPmSlots ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={!hasPmSlots}
                            >
                              Afternoon
                              {hasPmSlots && <span className="ml-1 text-xs">({pmSlots.filter(s => s.isAvailable).length})</span>}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                    
                    {/* Time Slots */}
                    <div className="grid grid-cols-3 gap-3">
                      {(() => {
                        const { amSlots, pmSlots } = separateAmPmSlots(availableHours);
                        const currentSlots = activeTab === 'am' ? amSlots : pmSlots;
                        
                        if (currentSlots.filter(s => s.isAvailable).length === 0) {
                          return (
                            <div className="col-span-3 text-center py-8 text-gray-500">
                              No {activeTab === 'am' ? 'morning' : 'afternoon'} slots available
                            </div>
                          );
                        }
                        
                        return currentSlots.map(slot => {
                          const myEvent = modalEvents.find(e => {
                            const eventHour = e.start.getHours();
                            const eventMinute = e.start.getMinutes();
                            return e.userRowId === userRowId &&
                                   eventHour === slot.hour &&
                                   eventMinute === slot.minute &&
                                   e.status === 'booked';
                          });
                          const isClicked = clickedHour === `${slot.hour}:${slot.minute.toString().padStart(2, '0')}`;
                          const isBooked = !!myEvent;
                          const userHasOtherBooking = modalEvents.some(e => 
                            e.userRowId === userRowId && 
                            e.status === 'booked' && 
                            !(e.start.getHours() === slot.hour && e.start.getMinutes() === slot.minute)
                          );
                          
                          const slotDate = new Date(selectedDate);
                          slotDate.setHours(slot.hour, slot.minute, 0, 0);
                          const slotEnd = new Date(slotDate);
                          slotEnd.setMinutes(slotEnd.getMinutes() + 30);
                          const now = new Date();
                          let isDisabled = false;
                          
                          const maxDate = new Date(now);
                          maxDate.setDate(now.getDate() + 13);
                          maxDate.setHours(23,59,59,999);
                          if (slotDate > maxDate) isDisabled = true;
                          if (slotEnd <= now) isDisabled = true;
                          
                          // Show all slots, but disable unavailable ones
                          if (!slot.isAvailable) {
                            return (
                              <div key={`${slot.hour}:${slot.minute}`} className="flex flex-col items-center">
                                <button
                                  className="px-4 py-3 rounded-xl border font-medium text-sm bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed w-full"
                                  disabled={true}
                                >
                                  {formatTime(slot.hour, slot.minute)}
                                </button>
                                <span className="text-xs text-red-500 mt-1">Not within business hours</span>
                              </div>
                            );
                          }
                          
                          if (userHasOtherBooking && !isBooked && !isDisabled) {
                            return (
                              <button
                                key={`${slot.hour}:${slot.minute}`}
                                onClick={() => {
                                  setChangeAppointment({ hour: slot.hour, minute: slot.minute });
                                }}
                                className="px-4 py-3 rounded-xl border font-medium text-sm bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200 hover:text-yellow-800 hover:border-yellow-400 transition-all duration-200 flex items-center justify-center"
                                disabled={isDisabled}
                              >
                                Change
                              </button>
                            );
                          }
                          
                          return (
                            <button
                              key={`${slot.hour}:${slot.minute}`}
                              onClick={() => {
                                if (isBooked) {
                                  setConfirmCancel({ eventId: myEvent.id });
                                } else {
                                  handleBook(slot.hour, slot.minute);
                                }
                              }}
                              className={
                                `px-4 py-3 rounded-xl border font-medium text-sm transition-all duration-200 flex items-center justify-center
                                ${isClicked 
                                  ? 'bg-blue-500 text-white border-blue-500 shadow-lg' 
                                  : isBooked
                                    ? 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200 hover:text-red-700 hover:border-red-400'
                                    : isDisabled
                                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                      : 'bg-transparent text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-400 hover:shadow-md'
                                }`
                              }
                              disabled={isDisabled}
                            >
                              {isClicked ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : isBooked ? (
                                'Cancel'
                              ) : (
                                formatTime(slot.hour, slot.minute)
                              )}
                            </button>
                          );
                        }).filter(Boolean);
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cancel Appointment</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel your appointment?
              </p>
              <div className="flex gap-3">
                <EnhancedButton
                  onClick={confirmCancelBooking}
                  variant="danger"
                  fullWidth
                >
                  Yes, Cancel
                </EnhancedButton>
                <EnhancedButton
                  onClick={() => {
                    setConfirmCancel(null);
                    setShowModal(false);
                    setSelectedDate(null);
                    setClickedHour(null);
                    setUserHasOtherBooking(false);
                    setActiveTab('am');
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Keep Appointment
                </EnhancedButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Appointment Modal */}
      {changeAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Change Appointment</h3>
              <p className="text-gray-600 mb-6">
                Do you want to change your appointment to <span className="font-semibold text-blue-600">{formatTime(changeAppointment.hour, changeAppointment.minute)}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleChangeAppointment}
                  className="flex-1 bg-yellow-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-yellow-600 transition-colors duration-200"
                >
                  Yes, Change
                </button>
                <button
                  onClick={() => setChangeAppointment(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
                >
                  Keep Current
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`max-w-sm w-full bg-white rounded-xl shadow-2xl border-l-4 p-4 transform transition-all duration-300 ${
            notification.type === 'success' ? 'border-green-500' :
            notification.type === 'error' ? 'border-red-500' :
            'border-yellow-500'
          }`}>
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                notification.type === 'success' ? 'bg-green-100' :
                notification.type === 'error' ? 'bg-red-100' :
                'bg-yellow-100'
              }`}>
                {notification.type === 'success' ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : notification.type === 'error' ? (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' :
                  notification.type === 'error' ? 'text-red-800' :
                  'text-yellow-800'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setNotification(null)}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notification.type === 'success' ? 'text-green-400 hover:text-green-500 focus:ring-green-500' :
                    notification.type === 'error' ? 'text-red-400 hover:text-red-500 focus:ring-red-500' :
                    'text-yellow-400 hover:text-yellow-500 focus:ring-yellow-500'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}