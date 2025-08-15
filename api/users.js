// Vercel API route for all user operations
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 完全禁用realtime功能
process.env.SUPABASE_DISABLE_REALTIME = 'true';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    db: {
      schema: 'public',
    },
  }
);

// AES加密密钥 - 必须从环境变量获取
const AES_SECRET_KEY = process.env.AES_KEY;

if (!AES_SECRET_KEY) {
  console.error('❌ 错误: 未设置 AES_KEY 环境变量');
  throw new Error('AES_KEY environment variable is required');
}

if (AES_SECRET_KEY.length < 32) {
  console.error('❌ 错误: AES_KEY 长度必须至少32个字符');
  throw new Error('AES_KEY must be at least 32 characters long');
}

function quickHash(text) {
  if (!text) return '';
  return CryptoJS.SHA256(text.replace(/\s+/g, '').toLowerCase()).toString();
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
      case 'create':
        await handleCreateUser(req, res);
        break;
      case 'get':
        await handleGetUser(req, res);
        break;
      case 'check-duplicate':
        await handleCheckDuplicate(req, res);
        break;
      case 'query':
        await handleQueryUser(req, res);
        break;
      case 'validate':
        await handleValidateUser(req, res);
        break;
      default:
        res.status(400).json({ error: 'Invalid action. Valid actions: create, get, check-duplicate, query, validate' });
    }
  } catch (error) {
    console.error('❌ API error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateUser(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
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
    is_guardian: req.body.is_guardian === true || req.body.is_guardian === 'true',
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
}

async function handleGetUser(req, res) {
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
    is_guardian: data.is_guardian,
    signature: decrypt(data.signature || ''),
    selfie: decrypt(data.selfie || ''),
  };
  
  res.json({ success: true, data: decryptedData });
}

async function handleCheckDuplicate(req, res) {
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
    
    const result = { 
      success: true, 
      data: { 
        phoneExists, 
        emailExists,
        isDuplicate: phoneExists || emailExists
      } 
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ CheckDuplicate unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error in check-duplicate',
      details: error.message 
    });
  }
}

async function handleQueryUser(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
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
}

async function handleValidateUser(req, res) {
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
}
