import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to generate session code
const generateSessionCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const sessionCode = generateSessionCode();

    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          session_code: sessionCode,
          status: 'waiting',
          participant_count: 0
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      sessionId: data.id,
      sessionCode: data.session_code,
      success: true
    });
  } catch (error) {
    console.error('Error creating session in Supabase:', error);
    res.status(500).json({
      error: 'Failed to create session',
      details: error.message,
      success: false
    });
  }
};