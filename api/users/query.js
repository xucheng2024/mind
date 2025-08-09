// Vercel API route for querying users by hash
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
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { clinicId, phoneHash, emailHash } = req.body;
    
    let query = supabase.from('users').select('user_id, row_id');
    
    if (phoneHash) {
      query = query.eq('phone_hash', phoneHash);
    } else if (emailHash) {
      query = query.eq('email_hash', emailHash);
    } else {
      return res.status(400).json({ error: 'Either phoneHash or emailHash is required' });
    }
    
    const { data, error } = await query.eq('clinic_id', clinicId).single();
    
    if (error) {
      console.error('User query error:', error);
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
