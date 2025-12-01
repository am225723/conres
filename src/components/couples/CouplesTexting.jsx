import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CouplesSession from './CouplesSession';
import { useToast } from '@/components/ui/use-toast';
import { createSession as createSupabaseSession } from '@/lib/supabase';

const CouplesTexting = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const createSession = async () => {
    setIsCreating(true);
    try {
      const result = await createSupabaseSession();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create session');
      }

      const newSessionId = result.session?.session_code;

      navigate(`/couples/${newSessionId}`);
      
      toast({
        title: "Session Created!",
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
