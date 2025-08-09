// Vercel API route for user operations
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
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

function quickHash(text) {
  return Buffer.from(text.toLowerCase().trim()).toString('base64');
}

function encrypt(text) {
  if (!text) return '';
  const salt = nanoid(8);
  const encoded = Buffer.from(`${salt}:${text}`).toString('base64');
  return encoded;
}

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
  
  if (req.method === 'POST') {
    // Create user
    try {
      const { full_name, phone, email, clinic_id } = req.body;
      
      if (!full_name || !phone || !email || !clinic_id) {
        return res.status(400).json({ 
          error: 'Missing required fields: full_name, phone, email, clinic_id' 
        });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      
      const phoneRegex = /^\d+$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'Phone must contain only digits' });
      }
      
      const phoneHash = quickHash(phone);
      const emailHash = quickHash(email);
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('row_id')
        .eq('clinic_id', clinic_id)
        .or(`phone_hash.eq.${phoneHash},email_hash.eq.${emailHash}`)
        .maybeSingle();
      
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists with this phone or email' });
      }
      
      const userData = {
        ...req.body,
        full_name: encrypt(req.body.full_name || ''),
        id_last4: encrypt(req.body.id_last4 || ''),
        dob: encrypt(req.body.dob || ''),
        phone: encrypt(req.body.phone || ''),
        phone_hash: phoneHash,
        email: encrypt(req.body.email || ''),
        email_hash: emailHash,
        postal_code: encrypt(req.body.postal_code || ''),
        block_no: encrypt(req.body.block_no || ''),
        street: encrypt(req.body.street || ''),
        building: encrypt(req.body.building || ''),
        floor: encrypt(req.body.floor || ''),
        unit: encrypt(req.body.unit || ''),
        other_health_notes: encrypt(req.body.other_health_notes || ''),
        is_guardian: encrypt(req.body.is_guardian?.toString() || 'false'),
        signature: encrypt(req.body.signature || ''),
        selfie: encrypt(req.body.selfie || ''),
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) {
        console.error('User insert error:', error);
        return res.status(400).json({ error: error.message });
      }
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
