import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CouplesSession from './CouplesSession';
import { useToast } from '@/components/ui/use-toast';

const CouplesTexting = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const createSession = async () => {
    setIsCreating(true);
    try {
      // Generate unique user IDs for the session
      const user1_id = `user_${Math.random().toString(36).substring(2, 15)}`;
      const user2_id = `user_${Math.random().toString(36).substring(2, 15)}`;
      
      // Call the backend API to create a unique session ID
      const response = await fetch('/api/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user1_id,
          user2_id
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const data = await response.json();
      const newSessionId = data.session?.session_code || data.sessionId;

      // Navigate to the new session
      navigate(`/couples/${newSessionId}`);
      
      toast({
        title: "Session Created! 💬",
        description: "Share this URL with your partner to start chatting.",
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error Creating Session",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="couples-texting-container">
      <h1 className="text-2xl font-bold mb-4">Couples Texting</h1>
      {sessionId ? (
        <CouplesSession sessionId={sessionId} />
      ) : (
        <div className="text-center">
            <p className="mb-4">Start a new session to begin chatting with your partner.</p>
            <button 
              onClick={createSession} 
              disabled={isCreating}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating Session...' : 'Start New Session'}
            </button>
        </div>
      )}
    </div>
  );
};

export default CouplesTexting;
