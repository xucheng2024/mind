import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';
import cacheManager from '../lib/cache';
import { logSubmitBook, logCancelAppointment } from '../lib/logger';
import toast from 'react-hot-toast';

export function useAppointment(clinicId, userRowId, trigger, setEvents, setModal, modal) {
  const [actionLoading, setActionLoading] = useState(false);

  const bookAppointment = useCallback(async (hour, minute, date) => {
    if (actionLoading) return;
    
    // Immediate visual feedback
    setActionLoading(true);
    trigger('success');
    
    // Optimistic UI update - show the slot as booked immediately
    const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    const optimisticEvent = {
      id: `temp-${Date.now()}`,
      title: timeString,
      start: date,
      end: new Date(date.getTime() + 30 * 60 * 1000),
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
      textColor: 'white',
      userRowId,
      isOptimistic: true // Mark as temporary
    };
    
    setEvents(prev => [...prev, optimisticEvent]);
    
    try {
      // Log the booking action
      await logSubmitBook({
        clinic_id: clinicId,
        user_id: userRowId,
        appointment_id: null,
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
      
      const today = new Date(date);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      const todayBookings = (existingBookings || []).filter(booking => {
        const bookingDate = new Date(booking.book_time);
        return booking.status === 'booked' && bookingDate >= today && bookingDate < tomorrow;
      });
      
      if (todayBookings.length > 0) {
        // Remove optimistic event if booking fails
        setEvents(prev => prev.filter(event => !event.isOptimistic));
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
      
      // Replace optimistic event with real event
      setEvents(prev => prev.map(event => 
        event.isOptimistic ? {
          ...event,
          id: appointmentId,
          isOptimistic: false
        } : event
      ));
      
      setModal({ type: null, data: null });
      toast.success(`Appointment booked: ${timeString}`);
      
    } catch (error) {
      // Remove optimistic event if booking fails
      setEvents(prev => prev.filter(event => !event.isOptimistic));
      trigger('error');
      console.error('Booking failed:', error);
      toast.error('Booking failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, [clinicId, userRowId, trigger, setEvents, setModal, actionLoading]);

  const cancelAppointment = useCallback(async () => {
    if (actionLoading) return;
    
    try {
      setActionLoading(true);
      trigger('warning');
      
      // Get the appointment to cancel
      const appointment = modal?.data?.appointment;
      if (!appointment) {
        toast.error('No appointment to cancel');
        return;
      }
      
      // Log the cancellation
      await logCancelAppointment({
        clinic_id: clinicId,
        user_id: userRowId,
        appointment_id: appointment.id,
        appointment_date: appointment.start,
        cancellation_reason: 'user_requested'
      });
      
      // Remove the event from UI
      setEvents(prev => prev.filter(event => event.id !== appointment.id));
      setModal({ type: null, data: null });
      toast.success('Appointment cancelled successfully');
      
    } catch (error) {
      trigger('error');
      console.error('Cancellation failed:', error);
      toast.error('Failed to cancel appointment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, [clinicId, userRowId, trigger, setEvents, setModal, actionLoading]);

  return {
    actionLoading,
    bookAppointment,
    cancelAppointment
  };
}
