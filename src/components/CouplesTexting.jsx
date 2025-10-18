import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../lib/supabase';

import Chat from './Chat';

const CouplesTexting = ({ firmness }) => {
  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [userId, setUserId] = useState('');
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = nanoid(10);
      localStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  const createSession = async () => {
    try {
      const response = await fetch('/api/create-session-proxy', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      const { sessionId: newSessionId } = await response.json();
      const newChannel = supabase.channel(`session-${newSessionId}`);
      setChannel(newChannel);
      setSession({ id: newSessionId, status: 'waiting' });
      setSessionId(newSessionId);
      toast.info('Session created! Share the ID with your partner.');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Could not create a new session.');
    }
  };

  const joinSession = () => {
    if (!sessionId) {
      toast.error('Please enter a session ID.');
      return;
    }
    const newChannel = supabase.channel(`session-${sessionId}`);
    setChannel(newChannel);
    setSession({ id: sessionId, status: 'active' });
  };

  if (session) {
    return <Chat channel={channel} firmness={firmness} userId={userId} />;
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <ToastContainer />
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-2xl font-bold text-center">Couples Texting</h2>
        <p className="text-center text-foreground/70">
          Connect with your partner in a real-time, tone-aware chat.
        </p>
        <button
          onClick={createSession}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-2 rounded-lg"
        >
          Create New Session
        </button>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter Session ID"
            className="flex-grow bg-input border-border text-foreground placeholder:text-muted-foreground p-2 rounded-lg"
          />
          <button
            onClick={joinSession}
            className="bg-muted text-foreground py-2 px-4 rounded-lg"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouplesTexting;
