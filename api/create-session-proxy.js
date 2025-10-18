import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert([{}])
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    const sessionId = data.id;

    res.status(200).json({ sessionId });
  } catch (error) {
    console.error('Error creating session in Supabase:', error);
    res.status(500).json({ error: 'Failed to create session', details: error.message });
  }
};
