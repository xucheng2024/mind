// Vercel API route for all storage operations
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';
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

// AES encryption key - must be obtained from environment variables
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

function decrypt(encryptedText) {
  if (!encryptedText) return '';
  try {
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedText, AES_SECRET_KEY);
    const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    return decryptedText;
  } catch (error) {
    console.error('AES decryption error:', error);
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
  
  const { action } = req.query;
  
  try {
    switch (action) {
      case 'upload':
        await handleUpload(req, res);
        break;
      case 'list':
        await handleList(req, res);
        break;
      case 'download':
        await handleDownload(req, res);
        break;
      case 'signed-url':
        await handleSignedUrl(req, res);
        break;
      default:
        res.status(400).json({ error: 'Invalid action. Valid actions: upload, list, download, signed-url' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleUpload(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
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
}

async function handleList(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { bucket, limit = 100, search = null } = req.query;
  
  if (!bucket) {
    return res.status(400).json({ error: 'Missing required field: bucket' });
  }
  
  let options = { limit: parseInt(limit) };
  if (search) {
    options.search = search;
  }
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .list('', options);
  
  if (error) {
    console.error('Storage list error:', error);
    return res.status(400).json({ error: error.message });
  }
  
  res.json({ success: true, data });
}

async function handleDownload(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { bucket, filename } = req.query;
  
  if (!bucket || !filename) {
    return res.status(400).json({ 
      error: 'Missing required fields: bucket, filename' 
    });
  }
  
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
}

async function handleSignedUrl(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { bucket, filename, expiresIn = 94608000 } = req.query; // Default 3 years expiration (3*365*24*3600)
  
  if (!bucket || !filename) {
    return res.status(400).json({ 
      error: 'Missing required fields: bucket, filename' 
    });
  }
  
  try {
    // Generate time-limited signed URL
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filename, parseInt(expiresIn));
    
    if (error) {
      console.error('Storage signed URL error:', error);
      return res.status(404).json({ error: 'Failed to create signed URL' });
    }
    
    if (!data?.signedUrl) {
      return res.status(404).json({ error: 'File not found' });
    }
        
    res.json({ 
      success: true, 
      data: {
        signedUrl: data.signedUrl,
        expiresAt: new Date(Date.now() + parseInt(expiresIn) * 1000).toISOString(),
        expiresIn: parseInt(expiresIn)
      }
    });
  } catch (error) {
    console.error('Signed URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
}
