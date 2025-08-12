// src/lib/logger.js - Frontend logging utility for user actions

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://appclinic.vercel.app';

/**
 * Log user action to the server
 * @param {string} action - Action name (e.g., 'submit_book', 'cancel_appointment')
 * @param {string} clinic_id - Clinic ID
 * @param {Object} detail - Additional details about the action
 * @param {string} staff_id - Staff ID (optional)
 * @param {string} source - Source identifier (default: 'frontend')
 * @param {string} log_level - Log level (default: 'info')
 */
export const logUserAction = async ({
  action,
  clinic_id,
  detail = {},
  staff_id = null,
  source = 'frontend',
  log_level = 'info'
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/log-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        clinic_id,
        detail,
        staff_id,
        source,
        log_level
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Action logged successfully:', result);
    return result;

  } catch (error) {
    console.error('❌ Failed to log action:', error);
    // Don't interrupt main business flow due to logging failures
    return null;
  }
};

/**
 * Log user submit book action
 * @param {Object} params - Parameters for submit book logging
 */
export const logSubmitBook = async ({
  clinic_id,
  user_id,
  appointment_id,
  service_type,
  doctor_id,
  appointment_date,
  duration_minutes,
  booking_method = 'web_app',
  payment_status = 'pending',
  total_amount,
  staff_id = null
}) => {
  return await logUserAction({
    action: 'submit_book',
    clinic_id,
    staff_id,
    detail: {
      user_id,
      appointment_id,
      service_type,
      doctor_id,
      appointment_date,
      duration_minutes,
      booking_method,
      payment_status,
      total_amount,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Log user cancel appointment action
 * @param {Object} params - Parameters for cancel appointment logging
 */
export const logCancelAppointment = async ({
  clinic_id,
  user_id,
  appointment_id,
  original_date,
  cancellation_reason,
  cancellation_method = 'web_app',
  refund_amount,
  refund_status = 'pending',
  staff_id = null
}) => {
  return await logUserAction({
    action: 'cancel_appointment',
    clinic_id,
    staff_id,
    detail: {
      user_id,
      appointment_id,
      original_date,
      cancellation_reason,
      cancellation_method,
      refund_amount,
      refund_status,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Log user registration action
 * @param {Object} params - Parameters for user registration logging
 */
export const logUserRegistration = async ({
  clinic_id,
  user_id,
  email,
  phone,
  registration_method = 'web_form',
  user_type = 'patient',
  registration_source = 'web_app',
  staff_id = null
}) => {
  return await logUserAction({
    action: 'user_registered',
    clinic_id,
    staff_id,
    detail: {
      user_id,
      email,
      phone,
      registration_method,
      user_type,
      registration_source,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Log user profile submission
 * @param {Object} params - Parameters for profile submission logging
 */
export const logProfileSubmission = async ({
  clinic_id,
  user_id,
  profile_type,
  fields_updated,
  submission_method = 'web_form',
  completion_percentage,
  staff_id = null
}) => {
  return await logUserAction({
    action: 'profile_submitted',
    clinic_id,
    staff_id,
    detail: {
      user_id,
      profile_type,
      fields_updated,
      submission_method,
      completion_percentage,
      timestamp: new Date().toISOString()
    }
  });
};
