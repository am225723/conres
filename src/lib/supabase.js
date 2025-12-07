import { createClient } from '@supabase/supabase-js';

// Supabase configuration - uses environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create Supabase client with realtime configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    persistSession: false
  }
});

// Helper function to generate 6-digit session code
export const generateSessionCode = () => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};

// Helper function to create a new session - Direct Supabase call
export const createSession = async () => {
  try {
    const sessionCode = generateSessionCode();
    
    const { data, error } = await supabase
      .from('CONRES_sessions')
      .insert([{ session_code: sessionCode }])
      .select()
      .single();

    if (error) throw error;

    return { success: true, session: data };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to join a session
export const joinSession = async (sessionCode, userId, nickname = null) => {
  try {
    // First, find the session by code
    const { data: session, error: sessionError } = await supabase
      .from('CONRES_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .single();

    if (sessionError) throw new Error('Session not found');

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from('CONRES_participants')
      .select('*')
      .eq('session_id', session.id)
      .eq('user_id', userId)
      .single();

    if (existingParticipant) {
      // Update last_seen
      await supabase
        .from('CONRES_participants')
        .update({ last_seen: new Date().toISOString(), is_active: true })
        .eq('id', existingParticipant.id);
      
      return { success: true, session, isRejoining: true };
    }

    // Add user as participant
    const { error: participantError } = await supabase
      .from('CONRES_participants')
      .insert([
        {
          session_id: session.id,
          user_id: userId,
          nickname: nickname
        }
      ]);

    if (participantError) throw participantError;

    return { success: true, session, isRejoining: false };
  } catch (error) {
    console.error('Error joining session:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to send a message
export const sendMessage = async (sessionId, userId, messageText, toneAnalysis) => {
  try {
    const { data, error } = await supabase
      .from('CONRES_messages')
      .insert([
        {
          session_id: sessionId,
          user_id: userId,
          message_text: messageText,
          tone_analysis: toneAnalysis,
          impact_preview: toneAnalysis?.impactPreview || null,
          firmness_level: toneAnalysis?.firmnessLevel || null
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return { success: true, message: data };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to get message history
export const getMessageHistory = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('CONRES_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, messages: data };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to get session participants
export const getSessionParticipants = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('CONRES_participants')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_active', true);

    if (error) throw error;

    return { success: true, participants: data };
  } catch (error) {
    console.error('Error fetching participants:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to leave a session
export const leaveSession = async (sessionId, userId) => {
  try {
    const { error } = await supabase
      .from('CONRES_participants')
      .update({ is_active: false })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error leaving session:', error);
    return { success: false, error: error.message };
  }
};

export default supabase;
