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

// Timeout protection - Vercel has 300s limit
const TIMEOUT_MS = 25000; // 25 seconds for logging operations

function withTimeout(promise, timeoutMs = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Logging operation timed out')), timeoutMs)
    )
  ]);
}

// POST /api/log-action - Log user actions (submit book, cancel, etc.)
export default async function handler(req, res) {
  const startTime = Date.now();
  
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
    // Wrap the entire operation with timeout protection
    await withTimeout(
      (async () => {
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
          console.error(`❌ [${new Date().toISOString()}] Logging error:`, error);
          return res.status(500).json({ error: 'Failed to log action' });
        }
        // Return success response
        return res.status(200).json({ 
          success: true, 
          data: data,
          message: 'Action logged successfully'
        });
      })(),
      TIMEOUT_MS
    );
    
    const executionTime = Date.now() - startTime;
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ [${new Date().toISOString()}] Log action API error after ${executionTime}ms:`, error);
    
    if (error.message === 'Logging operation timed out') {
      return res.status(408).json({ 
        error: 'Logging operation timed out',
        executionTime: `${executionTime}ms`
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
