// api/log-action.js - Dedicated endpoint for logging user actions
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
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

// POST /api/log-action - Log user actions (submit book, cancel, etc.)
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, staff_id, clinic_id, detail, log_level = 'info', source = 'frontend' } = req.body;
    
    // Validate required fields
    if (!action || !clinic_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: action, clinic_id' 
      });
    }

    // Validate action length
    if (action.length > 64) {
      return res.status(400).json({ 
        error: 'Action field too long (max 64 characters)' 
      });
    }

    // Prepare log data
    const logData = {
      action,
      clinic_id,
      detail: {
        ...detail,
        source,
        timestamp: new Date().toISOString(),
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent'],
        session_id: req.headers['x-session-id'] || null
      },
      log_level,
      source,
      timestamp: new Date().toISOString()
    };

    // Add staff_id if provided
    if (staff_id) {
      logData.staff_id = staff_id;
    }


    // Insert log into database
    const { data, error } = await supabase
      .from('logs')
      .insert([logData])
      .select()
      .single();

    if (error) {
      console.error('Logging error:', error);
      return res.status(500).json({ error: 'Failed to log action' });
    }


  } catch (error) {
    console.error('Log action API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
