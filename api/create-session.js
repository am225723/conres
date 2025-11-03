import { createClient } from '@supabase/supabase-js';

// A simple function to generate a random 6-character code
function generateSessionCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle non-POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Generate the required session_code
    const newSessionCode = generateSessionCode();

    // 2. Initialize Supabase client
    // Using the anon key for demo purposes
    // In production, use a service role key for server-side operations
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // 3. Create the session in the database
    // Only insert the session_code, let other columns use defaults or be set later
    const { data, error} = await supabase
      .from('sessions')
      .insert([{
        session_code: newSessionCode
      }])
      .select()
      .single();

    // 5. Handle Supabase errors
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    // 6. Send the successful response
    res.status(200).json({ success: true, session: data });

  } catch (error) {
    // Catch any other server errors
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
}
