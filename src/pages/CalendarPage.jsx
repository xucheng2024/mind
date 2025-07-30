import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'react-calendar/dist/Calendar.css';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Set dayjs locale
dayjs.locale('en');

// CSS animations
const styles = `
  @keyframes fadeInScale {
    0% {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes successPulse {
    0% {
      transform: scale(1);
      background: #10b981;
    }
    50% {
      transform: scale(1.1);
      background: #059669;
    }
    100% {
      transform: scale(1);
      background: #10b981;
    }
  }
`;

// Insert styles into page
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

// Simple calendar implementation without react-big-calendar

import { useNavigate } from 'react-router-dom';

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
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [clickedHour, setClickedHour] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [businessHours, setBusinessHours] = useState(null);
  const [availableHours, setAvailableHours] = useState([]);
  const [isClosedDay, setIsClosedDay] = useState(false);
  const [userHasOtherBooking, setUserHasOtherBooking] = useState(false);
  const [changeAppointment, setChangeAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState('am'); // 'am' or 'pm'
  const [notification, setNotification] = useState(null); // { type: 'success'|'error'|'warning', message: string }

  // Available time range (9am to 8pm)
  const hours = Array.from({ length: 12 }, (_, i) => i + 9);

  // Get hour display format
  function getDisplayHourPeriod(hour) {
    const period = hour < 12 ? 'am' : 'pm';
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;
    return { displayHour, period };
  }

  // Format time to "9:00" format
  function formatTime(hour, minute = 0) {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  // Custom calendar toolbar
  function CustomToolbar({ label, onNavigate }) {
    return (
      <div className="flex items-center justify-center mb-6">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-3 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Previous Month"
        >
          <FaChevronLeft className="text-gray-600" />
        </button>
        <span className="font-bold text-xl mx-8 min-w-[200px] text-center">
          {label}
        </span>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-3 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Next Month"
        >
          <FaChevronRight className="text-gray-600" />
        </button>
      </div>
    );
  }

  // Auto-close notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch appointment data
  useEffect(() => {
    if (!clinicId || !userRowId) {
      console.log('⚠️ CalendarPage - Missing clinicId or userRowId for data fetch');
      return;
    }
    
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
          .filter(v => v.status === 'booked') // Only show booked appointments
          .map(v => {
            const startDate = v.book_time || v.visit_time ? new Date(v.book_time || v.visit_time) : null;
            if (!startDate) return null;
            const timeStr = formatTime(startDate.getHours(), startDate.getMinutes());
            return {
              id: v.id,
              title: timeStr,
              start: startDate,
              end: new Date(startDate.getTime() + 30 * 60 * 1000), // 30-minute appointment
              status: v.status,
              userRowId: v.user_row_id,
            };
          })
          .filter(e => e && e.start);
        setEvents(evts);
      });
  }, [clinicId, refresh, userRowId]);

  // Fetch clinic business hours
  useEffect(() => {
    if (!clinicId) {
      console.log('⚠️ CalendarPage - Missing clinicId for business hours fetch');
      return;
    }
    
    console.log('🏢 CalendarPage - Fetching business hours for clinic:', clinicId);
    supabase
      .from('clinics')
      .select('business_hours')
      .eq('id', clinicId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ CalendarPage - Failed to fetch business hours:', error);
          return;
        }
        if (data && data.business_hours) {
          console.log('✅ CalendarPage - Business hours loaded:', data.business_hours);
          setBusinessHours(data.business_hours);
        } else {
          console.log('⚠️ CalendarPage - No business hours found for clinic');
        }
      });
  }, [clinicId]);

  // Check if a time slot is full - supports half-hour slots
  const isSlotFull = useCallback((date) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const count = events.filter(e => {
      const eventHour = e.start.getHours();
      const eventMinute = e.start.getMinutes();
      return e.status === 'booked' &&
             e.start.getFullYear() === year &&
             e.start.getMonth() === month &&
             e.start.getDate() === day &&
             eventHour === hour &&
             eventMinute === minute;
    }).length;
    return count >= 2;
  }, [events]);

  // Optimized getAvailableHoursForDate - supports half-hour slots
  // New businessHours format supports { open, close, closed }
  function getAvailableHoursForDate(date) {
    if (!businessHours || !date) return [];
    const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const weekday = weekdays[date.getDay()];
    const dayConfig = businessHours[weekday];
    if (!dayConfig || dayConfig.closed) return 'closed';
    
    // Parse open and close times (supports "09:00" and "09:30" format)
    const [startH, startM = 0] = dayConfig.open.split(':').map(Number);
    const [endH, endM = 0] = dayConfig.close.split(':').map(Number);
    
    // Convert to minutes for easier calculation
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    // 只允许预约结束时间 > 当前时间的 slot，且不超过最大预约日期
    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setDate(now.getDate() + 13);
    maxDate.setHours(23,59,59,999);
    // 如果选中的日期超过最大预约日期，直接返回空数组
    if (date > maxDate) return [];
    let slots = [];
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      // slot 结束时间
      const slotEnd = new Date(date);
      slotEnd.setHours(hour, minute + 30, 0, 0);
      if (date.toDateString() === now.toDateString()) {
        if (slotEnd <= now) continue; // 结束时间早于当前时间，不可预约
      }
      slots.push({ hour, minute });
    }
    return slots;
  }

  // Calendar slot style - supports half-hour slots
  function slotPropGetter(date) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = date.getHours() * 60 + date.getMinutes();
    
    // 禁用结束时间 <= 当前时间的 slot
    const slotEnd = new Date(date);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);
    if (slotEnd <= now) {
      return {
        style: {
          backgroundColor: '#f3f4f6',
          color: '#d1d5db',
          pointerEvents: 'none',
          cursor: 'not-allowed',
        },
      };
    }
    
    const hour = date.getHours();
    const minute = date.getMinutes();
    const dayOfWeek = date.getDay();
    
    // Use businessHours data to determine if open
    if (businessHours) {
      const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const weekday = weekdays[dayOfWeek];
      const dayConfig = businessHours[weekday];
      
      if (!dayConfig || dayConfig.closed) {
        return {
          style: {
            backgroundColor: '#f9fafb',
            color: '#d1d5db',
            cursor: 'not-allowed',
          },
        };
      }
      
      // Check if within business hours (supports half-hour)
      const [startH, startM = 0] = dayConfig.open.split(':').map(Number);
      const [endH, endM = 0] = dayConfig.close.split(':').map(Number);
      
      const currentMinutes = hour * 60 + minute;
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
        return {
          style: {
            backgroundColor: '#f9fafb',
            color: '#d1d5db',
            cursor: 'not-allowed',
          },
        };
      }
    } else {
      // If no businessHours data, use default logic
      if (dayOfWeek === 0 || dayOfWeek === 1 || hour < 9 || hour > 20) {
        return {
          style: {
            backgroundColor: '#f9fafb',
            color: '#d1d5db',
            cursor: 'not-allowed',
          },
        };
      }
    }
    
    return {};
  }

  // Event style
  function eventPropGetter(event) {
    if (event.userRowId === userRowId) {
      return {
        style: {
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '8px',
          border: 'none',
          fontSize: '13px',
          fontWeight: '600',
        },
      };
    }
    if (event.status === 'canceled') {
      return {
        style: {
          backgroundColor: '#e5e7eb',
          color: '#9ca3af',
          textDecoration: 'line-through',
          borderRadius: '8px',
          border: 'none',
          fontSize: '13px',
          fontWeight: '600',
        },
      };
    }
    return {};
  }

  // Day style
  function dayPropGetter(date) {
    const now = new Date();
    now.setHours(0,0,0,0);
    const isPast = date < now;
    // 限制只能预约今天起14天内
    const maxDate = new Date(now);
    maxDate.setDate(now.getDate() + 13); // 今天+13=共14天
    maxDate.setHours(23,59,59,999);
    const isTooFar = date > maxDate;
    if (isPast || isTooFar) {
      return {
        style: {
          backgroundColor: '#f3f4f6',
          color: '#d1d5db',
          pointerEvents: 'none',
          cursor: 'not-allowed',
        },
      };
    }
    // 仅根据 business_hours 判断休息日
    if (businessHours) {
      const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const weekday = weekdays[date.getDay()];
      const dayConfig = businessHours[weekday];
      if (!dayConfig || dayConfig.closed) {
        return {
          style: {
            backgroundColor: '#f9fafb',
            color: '#d1d5db',
            pointerEvents: 'none',
            cursor: 'not-allowed',
          },
        };
      }
    }
    return {};
  }

  // Dynamically generate available hours when selecting a date
  function handleSelectSlot(slotInfo) {
    const date = slotInfo.start;
    const now = new Date();
    now.setHours(0,0,0,0);
    if (date < now) return; // Disable clicking on dates before today's popup
    
    // Extra check: if today, check if clicked on past time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      const currentMinutes = today.getHours() * 60 + today.getMinutes();
      const slotMinutes = date.getHours() * 60 + date.getMinutes();
      if (slotMinutes <= currentMinutes) {
        return; // Disable clicking on current half-hour slot and before
      }
    }
    
    if (!businessHours) return;
    
    // Use businessHours data to determine if open
    const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const weekday = weekdays[date.getDay()];
    const dayConfig = businessHours[weekday];
    
    if (!dayConfig || dayConfig.closed) {
      return; // If not open today, don't show popup
    }
    
    // Get all appointments for the day
    const dayEvents = events.filter(e =>
      e.start.toDateString() === date.toDateString()
    );
    
    // Check if user already has an appointment today
    const myEvent = dayEvents.find(e => e.userRowId === userRowId && e.status === 'booked');
    
    if (myEvent) {
      // If user already has an appointment today, show cancel confirmation
      const timeStr = formatTime(myEvent.start.getHours(), myEvent.start.getMinutes());
      setConfirmCancel({ eventId: myEvent.id, timeStr });
    } else {
      setSelectedDate(date);
      setModalEvents(dayEvents);
      setClickedHour(null);
      
      // Check if user already has other appointments today
      const userHasOtherBookingToday = dayEvents.some(e => 
        e.userRowId === userRowId && 
        e.status === 'booked'
      );
      setUserHasOtherBooking(userHasOtherBookingToday);
      
      // Dynamically generate available hours
      const result = getAvailableHoursForDate(date);
      if (result === 'closed') {
        setIsClosedDay(true);
        setAvailableHours([]);
      } else {
        setIsClosedDay(false);
        setAvailableHours(result);
        
        // Automatically switch to the tab with available slots
        const { amSlots, pmSlots } = separateAmPmSlots(result);
        if (amSlots.length > 0) {
          setActiveTab('am');
        } else if (pmSlots.length > 0) {
          setActiveTab('pm');
        }
      }
      setShowModal(true);
    }
  }

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

  // Optimized handleBook, supports half-hour slots
  async function handleBook(hour, minute = 0) {
    const date = new Date(selectedDate);
    date.setHours(hour, minute, 0, 0);
    setClickedHour(`${hour}:${minute.toString().padStart(2, '0')}`);
    
    try {
      // Validate user existence
      const userExists = await validateUser();
      if (!userExists) {
        setNotification({ type: 'error', message: 'User validation failed. Please try logging in again.' });
        setTimeout(() => navigate(`/booking${clinicId ? ('?clinic_id=' + clinicId) : ''}`), 2000);
        return;
      }
      
      // Check if user already has an appointment today
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
      setEvents(prev => [
        ...prev,
        {
          id: Date.now(),
          title: formatTime(hour, minute),
          start: new Date(date),
          end: new Date(date.getTime() + 30 * 60 * 1000), // 30-minute appointment
          status: 'booked',
          userRowId: userRowId,
        },
      ]);
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

  // Click on appointment event
  function handleEventClick(event) {
    if (event.userRowId === userRowId) {
      setConfirmCancel({ eventId: event.id, timeStr: event.title });
    }
  }

  // Confirm cancel appointment
  async function confirmCancelBooking() {
    if (!confirmCancel) return;
    
    await supabase
      .from('visits')
      .update({ status: 'canceled' })
      .eq('id', confirmCancel.eventId);
    
    setConfirmCancel(null);
    setRefresh(r => r + 1);
  }

  // Handle appointment change
  async function handleChangeAppointment() {
    if (!changeAppointment) return;
    
    try {
      // 1. Find today's appointment and cancel it
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
        // Cancel all today's appointments
        for (const visit of todayVisits) {
          await supabase
            .from('visits')
            .update({ status: 'canceled' })
            .eq('id', visit.id);
        }
      }
      
      // 2. Create new appointment
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
      
      // 3. Update local state
      setEvents(prev => [
        ...prev.filter(e => e.userRowId !== userRowId || e.status === 'canceled'),
        {
          id: Date.now(),
          title: formatTime(changeAppointment.hour, changeAppointment.minute),
          start: new Date(newDate),
          end: new Date(newDate.getTime() + 30 * 60 * 1000),
          status: 'booked',
          userRowId: userRowId,
        },
      ]);
      
      // 4. Close modal and reset state
      setChangeAppointment(null);
      setShowModal(false);
      setSelectedDate(null);
      setClickedHour(null);
      setUserHasOtherBooking(false);
      setActiveTab('am'); // Reset to AM tab
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

  // Get dynamic time range - supports different business hours for different days
  function getTimeRange() {
    if (!businessHours) {
      // Default time range
      const minTime = new Date();
      minTime.setHours(9, 0, 0, 0);
      const maxTime = new Date();
      maxTime.setHours(20, 0, 0, 0);
      return { minTime, maxTime };
    }
    
    // Find the earliest and latest business hours from businessHours
    let earliestMinutes = 24 * 60; // Convert 24 hours to minutes
    let latestMinutes = 0;
    
    Object.values(businessHours).forEach(dayConfig => {
      if (dayConfig && !dayConfig.closed) {
        const [startH, startM = 0] = dayConfig.open.split(':').map(Number);
        const [endH, endM = 0] = dayConfig.close.split(':').map(Number);
        
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        
        earliestMinutes = Math.min(earliestMinutes, startMinutes);
        latestMinutes = Math.max(latestMinutes, endMinutes);
      }
    });
    
    // If no valid business hours found, use default values
    if (earliestMinutes === 24 * 60 || latestMinutes === 0) {
      earliestMinutes = 9 * 60; // 9:00 AM
      latestMinutes = 20 * 60;   // 8:00 PM
    }
    
    const minTime = new Date();
    minTime.setHours(Math.floor(earliestMinutes / 60), earliestMinutes % 60, 0, 0);
    const maxTime = new Date();
    maxTime.setHours(Math.floor(latestMinutes / 60), latestMinutes % 60, 0, 0);
    
    return { minTime, maxTime };
  }

  // Time range settings
  const { minTime, maxTime } = getTimeRange();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Calendar main container */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
        <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-800">
          My Appointment
        </h2>
        {loading ? (
          <div className="text-center py-20">
            <div className="text-blue-600 font-medium animate-pulse">Loading...</div>
          </div>
        ) : (
          <div className="relative">
            <Calendar
              localizer={localizer}
              events={events.filter(e => e && e.status === 'booked')}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              selectable="ignoreEvents"
              longPressThreshold={1}
              views={{ month: true }}
              view="month"
              onView={() => {}}
              components={{ toolbar: CustomToolbar }}
              onSelectSlot={slotInfo => {
                console.log('onSelectSlot', slotInfo);
                handleSelectSlot(slotInfo);
              }}
              eventPropGetter={eventPropGetter}
              slotPropGetter={slotPropGetter}
              dayPropGetter={dayPropGetter}
              min={minTime}
              max={maxTime}
              popup
              onSelectEvent={handleEventClick}
            />
          </div>
        )}
        {/* Cancel appointment confirmation modal */}
        {confirmCancel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-md p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-200 transform transition-all duration-300">
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Cancel Appointment</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Are you sure you want to cancel your appointment at <span className="font-semibold text-red-600">{confirmCancel.timeStr}</span>?
                  </p>
                  <p className="text-sm text-gray-500 mt-3">
                    You can book a new appointment after cancellation.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={confirmCancelBooking}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Yes, Cancel
                  </button>
                  <button
                    onClick={() => setConfirmCancel(null)}
                    className="flex-1 bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 border border-gray-200"
                  >
                    Keep Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Change appointment confirmation modal */}
      {changeAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-md p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-200 transform transition-all duration-300">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Change Appointment</h3>
                <p className="text-gray-600 leading-relaxed">
                  Do you want to change your appointment to <span className="font-semibold text-blue-600">{formatTime(changeAppointment.hour, changeAppointment.minute)}</span>?
                </p>
                <p className="text-sm text-gray-500 mt-3">
                  Your current appointment will be cancelled and replaced with this new time.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleChangeAppointment}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Yes, Change
                </button>
                <button
                  onClick={() => setChangeAppointment(null)}
                  className="flex-1 bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 border border-gray-200"
                >
                  Keep Current
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Time selection modal, always on top of calendar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div 
            className="bg-white/90 rounded-2xl w-full max-w-lg shadow-xl relative border border-gray-100 mx-4"
            style={{
              animation: 'fadeInScale 0.3s ease-out',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 0
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedDate(null);
                setClickedHour(null);
                setUserHasOtherBooking(false);
                setChangeAppointment(null);
                setActiveTab('am'); // Reset to AM tab
              }}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 text-gray-500 hover:text-gray-700 z-10"
              style={{ fontSize: '20px', lineHeight: '1' }}
            >
              ×
            </button>
            <div className="px-10 py-12">
              {/* Title area */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Select Appointment Time
                </h3>
                <div className="w-12 h-1 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-blue-600 mb-4" />
                <p className="text-gray-500 text-sm">
                  {selectedDate?.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {/* Time selection fluid button area */}
              <div className="max-w-xl mx-auto mb-6">
                {isClosedDay ? (
                  <div className="w-full text-center text-gray-400 py-8 text-lg font-semibold">
                    Closed today
                    <div className="text-sm text-gray-400 mt-3 font-normal">Closed on holidays. For appointments, please call the clinic first.</div>
                  </div>
                ) : userHasOtherBooking ? (
                  <div className="w-full text-center text-blue-600 py-8 text-lg font-semibold">
                    You already have an appointment today
                    <div className="text-sm text-blue-500 mt-3 font-normal">Click "Change" on any available slot to reschedule your appointment.</div>
                  </div>
                ) : availableHours.length === 0 ? (
                  <div className="w-full text-center text-gray-400 py-8 text-lg font-semibold">
                    No available slots
                    <div className="text-sm text-gray-400 mt-3 font-normal">All time slots for today have been booked or are in the past.</div>
                  </div>
                ) : (
                  <div>
                    {/* AM/PM tabs */}
                    <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                      {(() => {
                        const { amSlots, pmSlots } = separateAmPmSlots(availableHours);
                        const hasAmSlots = amSlots.length > 0;
                        const hasPmSlots = pmSlots.length > 0;
                        
                        return (
                          <>
                            <button
                              onClick={() => setActiveTab('am')}
                              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                                activeTab === 'am'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-800'
                              } ${!hasAmSlots ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={!hasAmSlots}
                            >
                              Morning
                              {hasAmSlots && <span className="ml-1 text-xs">({amSlots.length})</span>}
                            </button>
                            <button
                              onClick={() => setActiveTab('pm')}
                              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                                activeTab === 'pm'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-800'
                              } ${!hasPmSlots ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={!hasPmSlots}
                            >
                              Afternoon
                              {hasPmSlots && <span className="ml-1 text-xs">({pmSlots.length})</span>}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                    
                    {/* Time slots display */}
                    <div className="grid grid-cols-3 gap-4 justify-items-center">
                      {(() => {
                        const { amSlots, pmSlots } = separateAmPmSlots(availableHours);
                        const currentSlots = activeTab === 'am' ? amSlots : pmSlots;
                        
                        if (currentSlots.length === 0) {
                          return (
                            <div className="col-span-3 text-center text-gray-400 py-8 text-lg font-semibold">
                              No {activeTab === 'am' ? 'morning' : 'afternoon'} slots available
                            </div>
                          );
                        }
                        
                        return currentSlots.map(slot => {
                          // ...existing code...
                          const slotEvents = modalEvents.filter(e => {
                            const eventHour = e.start.getHours();
                            const eventMinute = e.start.getMinutes();
                            return eventHour === slot.hour && 
                                   eventMinute === slot.minute &&
                                   e.status === 'booked';
                          });
                          const isFull = slotEvents.length >= 2;
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
                          // ...existing code...
                          const userHasOtherBooking = modalEvents.some(e => 
                            e.userRowId === userRowId && 
                            e.status === 'booked' && 
                            !(e.start.getHours() === slot.hour && e.start.getMinutes() === slot.minute)
                          );
                          // 判断是否为禁用 slot（灰色且不可点）
                          // 逻辑与 slotPropGetter 保持一致
                          const slotDate = new Date(selectedDate);
                          slotDate.setHours(slot.hour, slot.minute, 0, 0);
                          const slotEnd = new Date(slotDate);
                          slotEnd.setMinutes(slotEnd.getMinutes() + 30);
                          const now = new Date();
                          let isDisabled = false;
                          // 超过最大预约日期（今天+13天）禁用
                          const maxDate = new Date(now);
                          maxDate.setDate(now.getDate() + 13);
                          maxDate.setHours(23,59,59,999);
                          if (slotDate > maxDate) isDisabled = true;
                          if (slotEnd <= now) isDisabled = true;
                          if (isFull) isDisabled = true;
                          if (!businessHours) isDisabled = false;
                          else {
                            const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
                            const weekday = weekdays[slotDate.getDay()];
                            const dayConfig = businessHours[weekday];
                            if (!dayConfig || dayConfig.closed) isDisabled = true;
                            const [startH, startM = 0] = dayConfig.open.split(':').map(Number);
                            const [endH, endM = 0] = dayConfig.close.split(':').map(Number);
                            const currentMinutes = slot.hour * 60 + slot.minute;
                            const startMinutes = startH * 60 + startM;
                            const endMinutes = endH * 60 + endM;
                            if (currentMinutes < startMinutes || currentMinutes >= endMinutes) isDisabled = true;
                          }
                          // 禁用 slot 用 disabled 属性
                          if (isFull) {
                            return (
                              <div
                                key={`${slot.hour}:${slot.minute}`}
                                className="px-6 py-2 rounded-full border font-semibold text-base bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed flex items-center justify-center"
                                style={{ minWidth: 80 }}
                              >
                                <span className="font-medium">Full</span>
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
                                className="px-6 py-2 rounded-full border font-semibold text-base bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200 hover:text-yellow-800 hover:border-yellow-400 transition-all duration-200 flex items-center justify-center"
                                style={{ minWidth: 80 }}
                                disabled={isDisabled}
                              >
                                <span className="font-medium">Change</span>
                              </button>
                            );
                          }
                          return (
                            <button
                              key={`${slot.hour}:${slot.minute}`}
                              onClick={() => {
                                if (isBooked) {
                                  setConfirmCancel({ eventId: myEvent.id, timeStr: formatTime(slot.hour, slot.minute) });
                                } else {
                                  handleBook(slot.hour, slot.minute);
                                }
                              }}
                              className={
                                `px-6 py-2 rounded-full border font-semibold text-base shadow-sm transition-all duration-200
                                ${isClicked 
                                  ? 'bg-blue-500 text-white border-blue-500 shadow-lg' 
                                  : isBooked
                                    ? 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200 hover:text-red-700 hover:border-red-400'
                                    : isDisabled
                                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                      : 'bg-transparent text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-400 hover:shadow-md'
                                }
                                flex items-center justify-center relative overflow-hidden`
                              }
                              style={{
                                minWidth: 80,
                                marginBottom: 0,
                                animation: isClicked ? 'successPulse 0.6s ease-in-out' : 'none',
                                pointerEvents: isDisabled ? 'none' : undefined
                              }}
                              disabled={isDisabled}
                            >
                              {isClicked ? (
                                <div className="flex items-center justify-center">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : isBooked ? (
                                <span className="font-medium">Cancel</span>
                              ) : (
                                <span className="font-medium">
                                  {formatTime(slot.hour, slot.minute)}
                                </span>
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
              {/* Bottom hint */}
              <div className="text-center mt-8">
                <p className="text-xs text-gray-400">
                  Click to select your appointment time
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Notification component */}
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
      {/* Back home button */}
      <div className="w-full flex justify-center mt-8 mb-4">
        <button
          onClick={() => window.location.href = '/'}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
        >
          Back Home
        </button>
      </div>
    </div>
  );
}
