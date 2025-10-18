import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vrzpwzwhdikmdmagkbtt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenB3endoZGlrbWRtYWdrYnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODUyMTAsImV4cCI6MjA3NjM2MTIxMH0.Q4SYhikV38ZcHeIxCo28wWUI1pqDPPz4SKETnzxfCYE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection by checking if we can access the sessions table
    const { data, error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test messages table
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('count')
      .limit(1);
    
    if (messagesError) {
      console.error('❌ Messages table access failed:', messagesError.message);
      return false;
    }
    
    console.log('✅ Messages table accessible');
    
    // Test participants table
    const { data: participantsData, error: participantsError } = await supabase
      .from('participants')
      .select('count')
      .limit(1);
    
    if (participantsError) {
      console.error('❌ Participants table access failed:', participantsError.message);
      return false;
    }
    
    console.log('✅ Participants table accessible');
    console.log('✅ All database connections working properly');
    
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

testConnection();