import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vrzpwzwhdikmdmagkbtt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenB3endoZGlrbWRtYWdrYnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODUyMTAsImV4cCI6MjA3NjM2MTIxMH0.Q4SYhikV38ZcHeIxCo28wWUI1pqDPPz4SKETnzxfCYE';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

async function testRealtime() {
  console.log('Testing real-time subscription...');
  
  // First, create a test session
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .insert([{
      session_code: 'TEST123',
      status: 'active',
      participant_count: 0
    }])
    .select()
    .single();
  
  if (sessionError) {
    console.error('❌ Failed to create test session:', sessionError.message);
    return;
  }
  
  console.log('✅ Test session created:', sessionData.id);
  
  // Set up real-time subscription
  const channel = supabase.channel(`session-${sessionData.id}`, {
    config: {
      broadcast: { self: true }
    }
  });
  
  channel
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `session_id=eq.${sessionData.id}` 
      },
      (payload) => {
        console.log('✅ Real-time message received:', payload.new.message_text);
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to real-time updates');
        
        // Test inserting a message
        setTimeout(async () => {
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .insert([{
              session_id: sessionData.id,
              user_id: 'test-user',
              message_text: 'Test message for real-time'
            }])
            .select()
            .single();
          
          if (messageError) {
            console.error('❌ Failed to insert test message:', messageError.message);
          } else {
            console.log('✅ Test message inserted:', messageData.id);
          }
          
          // Clean up
          setTimeout(async () => {
            await supabase.from('messages').delete().eq('session_id', sessionData.id);
            await supabase.from('sessions').delete().eq('id', sessionData.id);
            console.log('✅ Test data cleaned up');
            process.exit(0);
          }, 2000);
        }, 1000);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Real-time subscription failed');
        process.exit(1);
      }
    });
  
  // Timeout after 10 seconds
  setTimeout(() => {
    console.error('❌ Real-time test timed out');
    process.exit(1);
  }, 10000);
}

testRealtime();