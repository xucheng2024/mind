import { z } from 'zod';

// Registration form validation
export const registrationSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  emergency_contact: z.string().min(10, 'Emergency contact must be at least 10 digits'),
  emergency_relationship: z.string().min(2, 'Relationship is required'),
});

// Medical form validation
export const medicalSchema = z.object({
  medical_conditions: z.string().optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),
  surgeries: z.string().optional(),
  family_history: z.string().optional(),
  lifestyle: z.string().optional(),
});

// Authorization form validation
export const authorizationSchema = z.object({
  consent: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  signature: z.string().min(1, 'Signature is required'),
});

// Check-in form validation
export const checkInSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  clinic_id: z.string().min(1, 'Clinic ID is required'),
});

// Booking form validation
export const bookingSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  service: z.string().min(1, 'Service is required'),
});

// Utility function to format validation errors
export const formatValidationErrors = (errors) => {
  return Object.keys(errors).reduce((acc, key) => {
    acc[key] = errors[key]?.message || 'Invalid input';
    return acc;
  }, {});
}; 