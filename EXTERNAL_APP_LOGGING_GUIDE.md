# External App Logging Integration Guide

This guide explains how external applications can integrate with the MyClinic logging system to record user activities such as registration, appointments, and cancellations.

## Overview

The MyClinic system provides a centralized logging API that external applications can use to record user activities. This ensures all user interactions are logged in one place for comprehensive audit tracking and monitoring.

## Integration Methods

### Method 1: Direct API Call (Recommended)

External applications can directly call the MyClinic logging API to record events.

#### Base Logging Function

```javascript
const logToMyClinic = async (action, detail) => {
  try {
    const response = await fetch('https://your-myclinic-domain.com/api/log-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        staff_id: 'external_app_user_id', // External app user ID
        clinic_id: 'external_app_clinic_id', // External app clinic ID
        detail: {
          ...detail,
          source: 'external_app_name', // Your application name
          external_user_id: 'external_app_user_id',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to log to MyClinic:', error);
    // Don't interrupt main business flow due to logging failures
  }
};
```

## Usage Examples

### 1. User Registration

```javascript
await logToMyClinic('user_registered', {
  user_id: 'user_123',
  email: 'user@example.com',
  phone: '+1234567890',
  registration_method: 'email',
  user_type: 'patient',
  registration_source: 'mobile_app'
});
```

### 2. User Profile Submission

```javascript
await logToMyClinic('user_profile_submitted', {
  user_id: 'user_123',
  profile_type: 'medical_history',
  fields_updated: ['allergies', 'medications', 'medical_conditions'],
  submission_method: 'web_form',
  completion_percentage: 85
});
```

### 3. Appointment Booking

```javascript
await logToMyClinic('appointment_booked', {
  appointment_id: 'apt_456',
  user_id: 'user_123',
  service_type: 'consultation',
  doctor_id: 'dr_789',
  appointment_date: '2025-01-15T10:00:00Z',
  duration_minutes: 30,
  booking_method: 'mobile_app',
  payment_status: 'paid',
  total_amount: 150.00
});
```

### 4. Appointment Cancellation

```javascript
await logToMyClinic('appointment_cancelled', {
  appointment_id: 'apt_456',
  user_id: 'user_123',
  original_date: '2025-01-15T10:00:00Z',
  cancellation_reason: 'schedule_conflict',
  cancellation_method: 'mobile_app',
  cancellation_time: '2025-01-14T15:30:00Z',
  refund_amount: 150.00,
  refund_status: 'processed'
});
```

## Log Structure

### Required Fields

- `action`: The action being logged (e.g., 'user_registered', 'appointment_booked')
- `staff_id`: External application user ID
- `clinic_id`: External application clinic ID

### Optional Fields

- `detail`: Additional information about the action
- `source`: Application identifier
- `external_user_id`: External application user ID
- `timestamp`: When the action occurred

## Database Schema

Logs are stored in the `logs` table with the following structure:

```sql
CREATE TABLE logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  clinic_id TEXT NOT NULL,
  detail JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  log_level TEXT DEFAULT 'info',
  source TEXT DEFAULT 'frontend',
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT
);
```

## Querying External App Logs

### Basic Queries

```sql
-- View all external app logs
SELECT * FROM logs WHERE source = 'external_app';

-- View logs from a specific application
SELECT * FROM logs WHERE detail->>'source' = 'external_app_name';

-- View user registration logs
SELECT * FROM logs WHERE action = 'user_registered';

-- View appointment-related logs
SELECT * FROM logs WHERE action IN ('appointment_booked', 'appointment_cancelled');
```

### Advanced Queries

```sql
-- View logs for a specific user
SELECT * FROM logs
WHERE detail->>'external_user_id' = 'user_123';

-- View logs within a date range
SELECT * FROM logs
WHERE timestamp BETWEEN '2025-01-01' AND '2025-01-31'
AND source = 'external_app';

-- View logs by action type and source
SELECT action, COUNT(*) as count
FROM logs
WHERE source = 'external_app'
GROUP BY action
ORDER BY count DESC;
```

## Best Practices

### 1. Error Handling
- Log failures should not interrupt main business processes
- Implement retry mechanisms for failed log attempts
- Monitor logging success rates

### 2. Performance
- Use asynchronous logging to avoid blocking user operations
- Batch log requests when possible
- Implement rate limiting if needed

### 3. Data Validation
- Validate required fields before sending
- Sanitize sensitive information
- Ensure consistent data formats

### 4. Security
- Consider implementing API key authentication
- Use HTTPS for all API calls
- Implement IP whitelisting if needed

## Troubleshooting

### Common Issues

1. **HTTP 400 Error**: Missing required fields
2. **HTTP 500 Error**: Server-side logging failure
3. **Network Timeout**: Check network connectivity

### Debug Steps

1. Verify all required fields are present
2. Check network connectivity to MyClinic domain
3. Review server logs for detailed error information
4. Test with minimal data to isolate issues

## Support

For technical support or questions about the logging integration:

- Check the MyClinic API documentation
- Review server logs for error details
- Contact the MyClinic development team

## Version History

- **v1.0**: Initial integration guide
- **v1.1**: Added troubleshooting section
- **v1.2**: Enhanced query examples and best practices
