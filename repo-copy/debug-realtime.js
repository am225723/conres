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

async function debugRealtime() {
  console.log('🔍 Debugging real-time subscription...');

  // Test 1: Check if we can connect to realtime at all
  console.log('\n📡 Test 1: Basic realtime connection...');
  const testChannel = supabase.channel('test-connection');

  testChannel.subscribe((status) => {
    console.log('Basic connection status:', status);
    if (status === 'SUBSCRIBED') {
      console.log('✅ Basic realtime connection works');
      testChannel.unsubscribe();
      testMessagesTable();
    } else if (status === 'CHANNEL_ERROR') {
      console.error('❌ Basic realtime connection failed');
      process.exit(1);
    }
  });

  async function testMessagesTable() {
    console.log('\n📝 Test 2: Messages table realtime...');

    // Create test session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert([{
        session_code: `TEST${Date.now()}`,
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

    // Try different subscription approaches
    console.log('\n🔄 Testing subscription approaches...');

    // Approach 1: Exact match like in Chat component
    const channel1 = supabase.channel(`session-${sessionData.id}`, {
      config: {
        broadcast: { self: true }
      }
    });

    let received1 = false;

    channel1
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionData.id}`
        },
        (payload) => {
          console.log('✅ Approach 1 - Message received:', payload.new.id);
          received1 = true;
        }
      )
      .subscribe((status) => {
        console.log('Approach 1 status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('✅ Approach 1 subscribed');

          // Insert test message after delay
          setTimeout(async () => {
            console.log('📤 Inserting test message...');
            const { data: messageData, error: messageError } = await supabase
              .from('messages')
              .insert([{
                session_id: sessionData.id,
                user_id: 'test-user',
                message_text: 'Test message'
              }])
              .select()
              .single();

            if (messageError) {
              console.error('❌ Failed to insert message:', messageError.message);
            } else {
              console.log('✅ Message inserted:', messageData.id);
            }
          }, 1000);
        }
      });

    // Wait and check results
    setTimeout(() => {
      console.log('\n📊 Results:');
      console.log('Approach 1 received message:', received1 ? '✅ YES' : '❌ NO');

      if (!received1) {
        console.log('\n🔧 Possible issues:');
        console.log('1. Realtime is not enabled for this Supabase project');
        console.log('2. RLS policies are blocking realtime events');
        console.log('3. Publication is not set up for the messages table');
        console.log('4. Network/firewall issues blocking websocket connections');
      }

      // Clean up
      supabase.from('messages').delete().eq('session_id', sessionData.id);
      supabase.from('sessions').delete().eq('id', sessionData.id);
      console.log('✅ Test data cleaned up');
      process.exit(0);
    }, 5000);
  }
}

debugRealtime();