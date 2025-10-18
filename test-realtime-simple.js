import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vrzpwzwhdikmdmagkbtt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenB3endoZGlrbWRtYWdrYnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODUyMTAsImV4cCI6MjA3NjM2MTIxMH0.Q4SYhikV38ZcHeIxCo28wWUI1pqDPPz4SKETnzxfCYE';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    persistSession: false
  }
});

async function testRealtimeSimple() {
  console.log('Testing real-time subscription (simple)...');
  
  // First, create a test session using the same method as the app
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .insert([{
      session_code: 'TEST123',
      status: 'waiting',
      participant_count: 0
    }])
    .select()
    .single();
  
  if (sessionError) {
    console.error('❌ Failed to create test session:', sessionError.message);
    return;
  }
  
  console.log('✅ Test session created:', sessionData.id);
  
  // Set up real-time subscription exactly like the Chat component
  const channel = supabase.channel(`session-${sessionData.id}`, {
    config: {
      broadcast: { self: true }
    }
  });
  
  let messageReceived = false;
  
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
        console.log('✅ Real-time message received:', payload.new);
        messageReceived = true;
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to real-time updates');
        
        // Test inserting a message exactly like the Chat component
        setTimeout(async () => {
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .insert([{
              session_id: sessionData.id,
              user_id: 'test-user-123',
              message_text: 'Test message for real-time',
              tone_analysis: {
                impactPreview: 'Test impact',
                firmnessLevel: 'balanced',
                firmnessValue: 50
              },
              impact_preview: 'Test impact',
              firmness_level: 'balanced'
            }])
            .select()
            .single();
          
          if (messageError) {
            console.error('❌ Failed to insert test message:', messageError.message);
          } else {
            console.log('✅ Test message inserted:', messageData.id);
          }
        }, 1000);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Real-time subscription failed');
      }
    });
  
  // Wait and check if message was received
  setTimeout(() => {
    if (messageReceived) {
      console.log('✅ Real-time test PASSED - message was received');
    } else {
      console.log('❌ Real-time test FAILED - no message received');
    }
    
    // Clean up
    supabase.from('messages').delete().eq('session_id', sessionData.id).then(() => {
      supabase.from('sessions').delete().eq('id', sessionData.id).then(() => {
        console.log('✅ Test data cleaned up');
        process.exit(0);
      });
    });
  }, 5000);
}

testRealtimeSimple();