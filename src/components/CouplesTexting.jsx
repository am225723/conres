import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  createSession, 
  joinSession, 
  supabase 
} from '../lib/supabase';

import ChatEnhanced from './ChatEnhanced';

const CouplesTexting = ({ firmness }) => {
  const [session, setSession] = useState(null);
  const [sessionCode, setSessionCode] = useState('');
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNicknameInput, setShowNicknameInput] = useState(false);

  useEffect(() => {
    // Get or create user ID
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = nanoid(10);
      localStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);

    // Get stored nickname if exists
    const storedNickname = localStorage.getItem('nickname');
    if (storedNickname) {
      setNickname(storedNickname);
    }

    // Check for session code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get('session');
    if (sessionFromUrl) {
      setSessionCode(sessionFromUrl);
      toast.info(`Joining session ${sessionFromUrl}...`);
    }
  }, []);

  const handleCreateSession = async () => {
    if (!nickname.trim()) {
      setShowNicknameInput(true);
      toast.info('Please enter a nickname first');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createSession();
      
      if (result.success) {
        // Join the session as the creator
        const joinResult = await joinSession(
          result.session.session_code, 
          userId, 
          nickname
        );
        
        if (joinResult.success) {
          setSession(joinResult.session);
          setSessionCode(result.session.session_code);
          localStorage.setItem('nickname', nickname);
          
          // Copy the shareable link automatically
          const shareableLink = `${window.location.origin}/couples/${result.session.session_code}`;
          navigator.clipboard.writeText(shareableLink).then(() => {
            toast.success(`Session created! Link copied to clipboard: ${result.session.session_code}`);
          }).catch(() => {
            toast.success(`Session created! Code: ${result.session.session_code}`);
          });
        } else {
          toast.error('Failed to join the created session');
        }
      } else {
        toast.error(`Failed to create session: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Could not create a new session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!sessionCode.trim()) {
      toast.error('Please enter a session code.');
      return;
    }

    if (!nickname.trim()) {
      setShowNicknameInput(true);
      toast.info('Please enter a nickname first');
      return;
    }

    setIsLoading(true);
    try {
      const result = await joinSession(
        sessionCode.toUpperCase(), 
        userId, 
        nickname
      );
      
      if (result.success) {
        setSession(result.session);
        localStorage.setItem('nickname', nickname);
        
        if (result.isRejoining) {
          toast.success('Rejoined session successfully!');
        } else {
          toast.success('Joined session successfully!');
        }
      } else {
        toast.error(`Failed to join session: ${result.error}`);
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Could not join the session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveSession = () => {
    setSession(null);
    setSessionCode('');
  };

  if (session) {
    return (
      <ChatEnhanced 
        session={session}
        userId={userId}
        nickname={nickname}
        onLeave={handleLeaveSession}
      />
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Couples Texting
        </h2>
        <p className="text-center text-foreground/70">
          Connect with your partner in a real-time, tone-aware chat.
        </p>

        {/* Nickname Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">
            Your Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter your nickname"
            className="w-full bg-input border border-border text-foreground placeholder:text-muted-foreground p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={50}
          />
        </div>

        {/* Create Session Button */}
        <button
          onClick={handleCreateSession}
          disabled={isLoading || !nickname.trim()}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create New Session'}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">OR</span>
          </div>
        </div>

        {/* Join Session */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">
            Session Code
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              className="flex-grow bg-input border border-border text-foreground placeholder:text-muted-foreground p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary uppercase"
              maxLength={8}
            />
            <button
              onClick={handleJoinSession}
              disabled={isLoading || !sessionCode.trim() || !nickname.trim()}
              className="bg-muted hover:bg-muted/80 text-foreground py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm text-foreground">How it works:</h3>
          <ul className="text-xs text-foreground/70 space-y-1 list-disc list-inside">
            <li>Enter a nickname to identify yourself</li>
            <li>Create a new session or join an existing one</li>
            <li>Share the session code with your partner</li>
            <li>Start chatting with real-time tone analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CouplesTexting;