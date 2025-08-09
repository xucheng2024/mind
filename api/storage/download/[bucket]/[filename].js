// Vercel API route for downloading and decrypting files
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
    const { bucket, filename } = req.query;
    
    // Download encrypted file from storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filename);
    
    if (error) {
      console.error('Storage download error:', error);
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Convert blob to text
    const encryptedText = await data.text();
    
    // Decrypt the file content
    const decryptedBase64 = decrypt(encryptedText);
    
    // Convert back to buffer
    const fileBuffer = Buffer.from(decryptedBase64, 'base64');
    
    // Determine content type based on bucket
    let contentType = 'application/octet-stream';
    if (bucket === 'selfies' || bucket === 'signatures') {
      contentType = 'image/jpeg';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    
    res.send(fileBuffer);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
