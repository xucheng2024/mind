// server.js
import express from 'express';
import { Resend } from 'resend';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { z } from 'zod';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Debug environment
console.log('🚀 Server starting...');
console.log('📍 PORT:', PORT);
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔗 FRONTEND_URL:', process.env.FRONTEND_URL);

// Security middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',  // Vite dev server
    'https://appclinic.vercel.app',  // Production frontend
    'https://appclinic-git-main-xuchengs-projects-27b3e479.vercel.app',  // Preview deployments
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limit request size

// Rate limiting (simple in-memory)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // 100 requests per window

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }
  
  const requests = rateLimit.get(ip).filter(time => time > windowStart);
  rateLimit.set(ip, requests);
  
  if (requests.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  requests.push(now);
  return true;
}

// Rate limiting middleware
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
});

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role key to bypass RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Security utilities (Vercel/PWA compatible)
const SALT_ROUNDS = 12;

// Secure hashing for phone/email (for duplicate checking)
async function hashData(text) {
  return await bcrypt.hash(text.toLowerCase().trim(), SALT_ROUNDS);
}

// Quick hash for non-sensitive lookups (phone/email hash for indexing)
function quickHash(text) {
  return Buffer.from(text.toLowerCase().trim()).toString('base64');
}

// Simple encryption for sensitive data (Vercel compatible)
function encrypt(text) {
  if (!text) return '';
  // Simple base64 encoding with salt - replace with proper encryption in production
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

// Server handles only encryption/decryption
// Image compression is handled on the frontend

app.post('/api/send-verification', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', // 替换为你的发送域名
      to: [email],
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Verification Code</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${code}</span>
          </div>
          <p style="color: #666;">This code will expire in 5 minutes.</p>
          <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Database API endpoints (bypasses RLS)
app.post('/api/users', async (req, res) => {
  try {
    // Input validation
    const { full_name, phone, email, clinic_id } = req.body;
    
    if (!full_name || !phone || !email || !clinic_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: full_name, phone, email, clinic_id' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate phone format (basic)
    const phoneRegex = /^\d+$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Phone must contain only digits' });
    }
    
    // Check if user already exists
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
    
    // Encrypt sensitive data on server side
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
});

app.get('/api/users/:clinicId/:userRowId', async (req, res) => {
  try {
    const { clinicId, userRowId } = req.params;
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
    
    // Decrypt sensitive data before sending to client
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
});

// Query user by email/phone hash
app.post('/api/users/query', async (req, res) => {
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
});

// Check if user exists by phone or email (for duplicate checking during registration)
app.post('/api/users/check-duplicate', async (req, res) => {
  try {
    const { clinicId, phone, email } = req.body;
    
    if (!clinicId || (!phone && !email)) {
      return res.status(400).json({ 
        error: 'Missing required fields: clinicId and either phone or email' 
      });
    }
    
    let phoneExists = false;
    let emailExists = false;
    
    // Check phone if provided
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
    
    // Check email if provided
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
});

app.post('/api/visits', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('visits')
      .insert([req.body])
      .select()
      .single();
    
    if (error) {
      console.error('Visit insert error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('visits')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Visit update error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user visits
app.get('/api/visits/:clinicId/:userRowId', async (req, res) => {
  try {
    const { clinicId, userRowId } = req.params;
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('user_row_id', userRowId);
    
    if (error) {
      console.error('Visits query error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get clinic info
app.get('/api/clinics/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();
    
    if (error) {
      console.error('Clinic query error:', error);
      return res.status(404).json({ error: 'Clinic not found' });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get slot availability
app.get('/api/slots/:clinicId/:date', async (req, res) => {
  try {
    const { clinicId, date } = req.params;
    
    // Use the database function to get slot availability
    const { data, error } = await supabase
      .rpc('get_slot_availability_admin', {
        p_clinic_id: clinicId,
        p_days: 14
      });
    
    if (error) {
      console.error('Slot availability query error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    // Filter data for the specific date requested
    const requestedDate = new Date(date).toISOString().split('T')[0];
    const filteredData = data.filter(slot => {
      const slotDate = new Date(slot.visit_date).toISOString().split('T')[0];
      return slotDate === requestedDate;
    });
    
    // Transform the data to match the expected format
    const transformedData = filteredData.map(slot => ({
      visit_time: slot.visit_time,
      booking_count: slot.booked_count,
      is_available: slot.is_available
    }));
    
    res.json({ success: true, data: transformedData });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user has existing visit
app.get('/api/visits/check/:clinicId/:userRowId', async (req, res) => {
  try {
    const { clinicId, userRowId } = req.params;
    const { data, error } = await supabase
      .from('visits')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('user_row_id', userRowId)
      .maybeSingle();
    
    if (error) {
      console.error('Visit check error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ success: true, data: { hasVisit: !!data, visitId: data?.id } });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate user and return basic info
app.get('/api/users/validate/:clinicId/:userRowId', async (req, res) => {
  try {
    const { clinicId, userRowId } = req.params;
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
    
    // Decrypt the full name
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
});

// Storage API endpoints (using service role)
app.post('/api/storage/upload', async (req, res) => {
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
});

app.post('/api/storage/signed-url', async (req, res) => {
  try {
    const { bucket, filename, expiresIn = 157680000 } = req.body; // Default 5 years
    
    if (!bucket || !filename) {
      return res.status(400).json({ 
        error: 'Missing required fields: bucket, filename' 
      });
    }
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filename, expiresIn);
    
    if (error) {
      console.error('Storage signed URL error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download and decrypt file from storage
app.get('/api/storage/download/:bucket/:filename', async (req, res) => {
  try {
    const { bucket, filename } = req.params;
    
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
    
    res.set({
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length,
      'Cache-Control': 'private, max-age=3600'
    });
    
    res.send(fileBuffer);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/storage/list/:bucket', async (req, res) => {
  try {
    const { bucket } = req.params;
    const { limit = 100, search } = req.query;
    
    const options = { limit: parseInt(limit) };
    if (search) options.search = search;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', options);
    
    if (error) {
      console.error('Storage list error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/storage/delete', async (req, res) => {
  try {
    const { bucket, filenames } = req.body;
    
    if (!bucket || !filenames || !Array.isArray(filenames)) {
      return res.status(400).json({ 
        error: 'Missing required fields: bucket, filenames (array)' 
      });
    }
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(filenames);
    
    if (error) {
      console.error('Storage delete error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
