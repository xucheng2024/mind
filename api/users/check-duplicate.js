// Vercel API route for checking duplicate users
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

function quickHash(text) {
  return Buffer.from(text.toLowerCase().trim()).toString('base64');
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
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { clinicId, phone, email } = req.body;
    
    if (!clinicId || (!phone && !email)) {
      return res.status(400).json({ 
        error: 'Missing required fields: clinicId and either phone or email' 
      });
    }
    
    let phoneExists = false;
    let emailExists = false;
    
    if (phone) {
      const phoneHash = quickHash(phone);
      const { data: phoneData, error: phoneError } = await supabase
        .from('users')
        .select('user_id')
        .eq('clinic_id', clinicId)
        .eq('phone_hash', phoneHash)
        .limit(1);
      
      if (phoneError) {
        console.error('Phone check error:', phoneError);
        return res.status(500).json({ error: 'Failed to check phone duplicate' });
      }
      
      phoneExists = phoneData && phoneData.length > 0;
    }
    
    if (email) {
      const emailHash = quickHash(email);
      const { data: emailData, error: emailError } = await supabase
        .from('users')
        .select('user_id')
        .eq('clinic_id', clinicId)
        .eq('email_hash', emailHash)
        .limit(1);
      
      if (emailError) {
        console.error('Email check error:', emailError);
        return res.status(500).json({ error: 'Failed to check email duplicate' });
      }
      
      emailExists = emailData && emailData.length > 0;
    }
    
    res.json({ 
      success: true, 
      data: { 
        phoneExists, 
        emailExists,
        isDuplicate: phoneExists || emailExists
      } 
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
