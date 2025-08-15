// Vercel API route for all visit operations
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
  console.log('🚀 Visits API called:', { method: req.method, url: req.url, query: req.query });
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    res.status(200).end();
    return;
  }
  
  const { action } = req.query;
  console.log('🔍 Action requested:', action);
  
  try {
    switch (action) {
      case 'create':
        console.log('📝 Creating visit...');
        await handleCreateVisit(req, res);
        break;
      case 'update':
        console.log('📝 Updating visit...');
        await handleUpdateVisit(req, res);
        break;
      case 'get':
        console.log('🔍 Getting visits...');
        await handleGetVisits(req, res);
        break;
      case 'check':
        console.log('🔍 Checking visit...');
        await handleCheckVisit(req, res);
        break;
      default:
        console.log('❌ Invalid action:', action);
        res.status(400).json({ error: 'Invalid action. Valid actions: create, update, get, check' });
    }
  } catch (error) {
    console.error('❌ API error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateVisit(req, res) {
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('📝 Visit creation request body:', req.body);
  console.log('📝 Request headers:', req.headers);
  
  // 验证必需字段 - 根据数据库表结构
  const requiredFields = ['clinic_id', 'user_row_id', 'visit_time', 'book_time'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    console.log('❌ Missing required fields:', missingFields);
    return res.status(400).json({ 
      error: `Missing required fields: ${missingFields.join(', ')}`,
      missing: missingFields 
    });
  }
  
  // 验证数据类型
  if (typeof req.body.clinic_id !== 'string' && typeof req.body.clinic_id !== 'number') {
    console.log('❌ Invalid clinic_id type:', typeof req.body.clinic_id);
    return res.status(400).json({ error: 'clinic_id must be string or number' });
  }
  
  if (typeof req.body.user_row_id !== 'string' && typeof req.body.user_row_id !== 'number') {
    console.log('❌ Invalid user_row_id type:', typeof req.body.user_row_id);
    return res.status(400).json({ error: 'user_row_id must be string or number' });
  }
  
  // 验证时间字段格式
  let visitTimeValid = false;
  let bookTimeValid = false;
  
  // 验证 visit_time (timestamp with time zone)
  if (req.body.visit_time) {
    const visitDate = new Date(req.body.visit_time);
    if (!isNaN(visitDate.getTime())) {
      visitTimeValid = true;
      console.log('✅ visit_time is valid ISO timestamp:', req.body.visit_time);
    } else {
      console.log('❌ Invalid visit_time format:', req.body.visit_time);
      return res.status(400).json({ error: 'visit_time must be a valid ISO timestamp' });
    }
  }
  
  // 验证 book_time (timestamp with time zone)
  if (req.body.book_time) {
    const bookDate = new Date(req.body.book_time);
    if (!isNaN(bookDate.getTime())) {
      bookTimeValid = true;
      console.log('✅ book_time is valid ISO timestamp:', req.body.book_time);
    } else {
      console.log('❌ Invalid book_time format:', req.body.book_time);
      return res.status(400).json({ error: 'book_time must be a valid ISO timestamp' });
    }
  }
  
  if (!visitTimeValid || !bookTimeValid) {
    return res.status(400).json({ error: 'Both visit_time and book_time must be valid ISO timestamps' });
  }
  
  console.log('✅ All validations passed, attempting database insert...');
  console.log('📊 Data to insert:', {
    clinic_id: req.body.clinic_id,
    user_row_id: req.body.user_row_id,
    visit_time: req.body.visit_time,
    book_time: req.body.book_time,
    status: req.body.status || 'booked',
    is_first: req.body.is_first !== undefined ? req.body.is_first : true
  });
  
  try {
    const { data, error } = await supabase
      .from('visits')
      .insert([req.body])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Visit insert error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return res.status(400).json({ 
        error: error.message,
        details: error.details,
        hint: error.hint
      });
    }
    
    console.log('✅ Visit created successfully:', data);
    res.json({ success: true, data });
    
  } catch (dbError) {
    console.error('❌ Database operation failed:', dbError);
    console.error('❌ Error stack:', dbError.stack);
    res.status(500).json({ 
      error: 'Database operation failed',
      details: dbError.message 
    });
  }
}

async function handleUpdateVisit(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { id } = req.query;
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
}

async function handleGetVisits(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { clinicId, userRowId } = req.query;
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
}

async function handleCheckVisit(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { clinicId, userRowId } = req.query;
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
}
