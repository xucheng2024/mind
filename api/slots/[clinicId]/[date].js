// Vercel API route for getting slot availability
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { clinicId, date } = req.query;
    
    console.log('🔍 API called with clinicId:', clinicId, 'date:', date);
    console.log('🔍 Environment variables check:', {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
    
    if (!clinicId || !date) {
      console.error('🔍 Missing required parameters:', { clinicId, date });
      return res.status(400).json({ error: 'Missing clinicId or date parameter' });
    }
    
    // Use the database function to get slot availability
    console.log('🔍 Calling database function get_slot_availability_admin');
    const { data, error } = await supabase
      .rpc('get_slot_availability_admin', {
        p_clinic_id: clinicId,
        p_days: 14
      });
    
    if (error) {
      console.error('🔍 Slot availability query error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return res.status(400).json({ error: error.message });
    }
    
    console.log('🔍 Database function returned data:', data);
    
    // Filter data for the specific date requested
    const requestedDate = new Date(date).toISOString().split('T')[0];
    const filteredData = data.filter(slot => {
      const slotDate = new Date(slot.visit_date).toISOString().split('T')[0];
      return slotDate === requestedDate;
    });
    
    console.log('🔍 Filtered data for requested date:', filteredData);
    
    // Transform the data to match the expected format
    const transformedData = filteredData.map(slot => ({
      visit_time: slot.visit_time,
      booking_count: slot.booked_count,
      is_available: slot.is_available
    }));
    
    console.log('🔍 Transformed data:', transformedData);
    
    res.json({ success: true, data: transformedData });
  } catch (error) {
    console.error('🔍 API error:', error);
    console.error('🔍 Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
}
