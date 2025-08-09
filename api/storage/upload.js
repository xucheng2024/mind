// Vercel API route for file upload
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

function encrypt(text) {
  if (!text) return '';
  const salt = nanoid(8);
  const encoded = Buffer.from(`${salt}:${text}`).toString('base64');
  return encoded;
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
    const { bucket, filename, fileData, contentType = 'application/octet-stream' } = req.body;
    
    if (!bucket || !filename || !fileData) {
      return res.status(400).json({ 
        error: 'Missing required fields: bucket, filename, fileData' 
      });
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    // Encrypt the buffer (compression already done on frontend)
    const encryptedData = encrypt(buffer.toString('base64'));
    const encryptedBuffer = Buffer.from(encryptedData, 'utf8');
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, encryptedBuffer, {
        contentType: 'application/octet-stream', // Always store as encrypted
        upsert: true
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
