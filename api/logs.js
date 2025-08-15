// api/logs.js - Vercel serverless function for logging user actions
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

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

// AES encryption key from environment variables
const AES_SECRET_KEY = process.env.AES_KEY;

if (!AES_SECRET_KEY) {
  console.error('❌ Error: AES_KEY environment variable not set');
  throw new Error('AES_KEY environment variable is required');
}

if (AES_SECRET_KEY.length < 32) {
  console.error('❌ Error: AES_KEY must be at least 32 characters long');
  throw new Error('AES_KEY must be at least 32 characters long');
}

function encrypt(text) {
  if (!text) return '';
  try {
    const encrypted = CryptoJS.AES.encrypt(text, AES_SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('AES encryption error:', error);
    return '';
  }
}

// POST /api/logs - Log user actions
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Log action endpoint
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

      return res.status(200).json({ 
        success: true, 
        log_id: data.id,
        message: 'Action logged successfully' 
      });

    } else if (req.method === 'GET') {
      // Get logs with filtering and pagination
      const { 
        clinic_id, 
        staff_id, 
        action, 
        source, 
        start_date, 
        end_date,
        page = 1, 
        limit = 50,
        log_level 
      } = req.query;

      // Build query
      let query = supabase
        .from('logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (clinic_id) query = query.eq('clinic_id', clinic_id);
      if (staff_id) query = query.eq('staff_id', staff_id);
      if (action) query = query.eq('action', action);
      if (source) query = query.eq('source', source);
      if (log_level) query = query.eq('log_level', log_level);

      // Date range filter
      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      if (end_date) {
        query = query.lte('created_at', end_date);
      }

      // Pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query = query.range(offset, offset + parseInt(limit) - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Logs query error:', error);
        return res.status(500).json({ error: 'Failed to fetch logs' });
      }

      return res.json({
        success: true,
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil((count || 0) / parseInt(limit))
        }
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Logs API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
