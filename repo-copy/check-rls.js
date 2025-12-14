import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vrzpwzwhdikmdmagkbtt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenB3endoZGlrbWRtYWdrYnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODUyMTAsImV4cCI6MjA3NjM2MTIxMH0.Q4SYhikV38ZcHeIxCo28wWUI1pqDPPz4SKETnzxfCYE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLS() {
  console.log('Checking Row Level Security policies...');

  try {
    // Try to read from messages table without any filters
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Messages table RLS check failed:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Messages table accessible (RLS might be permissive)');
    }

    // Try to read from sessions table
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .limit(1);

    if (sessionError) {
      console.error('❌ Sessions table RLS check failed:', sessionError.message);
    } else {
      console.log('✅ Sessions table accessible');
    }

    // Try to read from participants table
    const { data: participantData, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .limit(1);

    if (participantError) {
      console.error('❌ Participants table RLS check failed:', participantError.message);
    } else {
      console.log('✅ Participants table accessible');
    }

  } catch (error) {
    console.error('❌ RLS check failed:', error.message);
  }
}

checkRLS();