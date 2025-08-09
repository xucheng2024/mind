// Vercel API route for validating user
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

function decrypt(encodedText) {
  if (!encodedText) return '';
  try {
    const decoded = Buffer.from(encodedText, 'base64').toString('utf8');
    const [salt, text] = decoded.split(':');
    return text || '';
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

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
    const { clinicId, userRowId } = req.query;
    const { data, error } = await supabase
      .from('users')
      .select('row_id, full_name')
      .eq('clinic_id', clinicId)
      .eq('row_id', userRowId)
      .single();
    
    if (error || !data) {
      console.error('User validation failed:', error);
      return res.status(404).json({ error: 'User not found' });
    }
    
    const fullName = decrypt(data.full_name || '');
    
    res.json({ 
      success: true, 
      data: { 
        valid: true,
        full_name: fullName
      } 
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
