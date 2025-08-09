// Vercel API route for getting user by clinic and row ID
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
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('row_id', userRowId)
      .single();
    
    if (error) {
      console.error('User query error:', error);
      return res.status(404).json({ error: 'User not found' });
    }
    
    const decryptedData = {
      ...data,
      full_name: decrypt(data.full_name || ''),
      id_last4: decrypt(data.id_last4 || ''),
      dob: decrypt(data.dob || ''),
      phone: decrypt(data.phone || ''),
      email: decrypt(data.email || ''),
      postal_code: decrypt(data.postal_code || ''),
      block_no: decrypt(data.block_no || ''),
      street: decrypt(data.street || ''),
      building: decrypt(data.building || ''),
      floor: decrypt(data.floor || ''),
      unit: decrypt(data.unit || ''),
      other_health_notes: decrypt(data.other_health_notes || ''),
      is_guardian: decrypt(data.is_guardian || '') === 'true',
      signature: decrypt(data.signature || ''),
      selfie: decrypt(data.selfie || ''),
    };
    
    res.json({ success: true, data: decryptedData });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
