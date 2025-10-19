import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vrzpwzwhdikmdmagkbtt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenB3endoZGlrbWRtYWdrYnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODUyMTAsImV4cCI6MjA3NjM2MTIxMH0.Q4SYhikV38ZcHeIxCo28wWUI1pqDPPz4SKETnzxfCYE';

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

// Helper function to generate session code
export const generateSessionCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper function to create a new session
export const createSession = async (user1Id = 'user1', user2Id = 'user2') => {
  try {
    const response = await fetch('/api/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user1_id: user1Id,
        user2_id: user2Id
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to create session`);
    }

    const data = await response.json();

    if (data.success) {
      return { success: true, session: data.session };
    } else {
      throw new Error(data.error || 'Unknown error');
    }
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
      .from('sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .single();

    if (sessionError) throw new Error('Session not found');

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', session.id)
      .eq('user_id', userId)
      .single();

    if (existingParticipant) {
      // Update last_seen
      await supabase
        .from('participants')
        .update({ last_seen: new Date().toISOString(), is_active: true })
        .eq('id', existingParticipant.id);
      
      return { success: true, session, isRejoining: true };
    }

    // Add user as participant
    const { error: participantError } = await supabase
      .from('participants')
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
      .from('messages')
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
      .from('messages')
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
      .from('participants')
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
      .from('participants')
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