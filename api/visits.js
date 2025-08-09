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
        await handleCreateVisit(req, res);
        break;
      case 'update':
        await handleUpdateVisit(req, res);
        break;
      case 'get':
        await handleGetVisits(req, res);
        break;
      case 'check':
        await handleCheckVisit(req, res);
        break;
      default:
        res.status(400).json({ error: 'Invalid action. Valid actions: create, update, get, check' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateVisit(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
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
