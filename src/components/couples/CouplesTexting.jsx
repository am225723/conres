import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CouplesSession from './CouplesSession';

const CouplesTexting = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const createSession = async () => {
    // This is a placeholder for your actual session creation logic.
    // You would typically make an API call to your backend to create a unique session ID.
    const newSessionId = Math.random().toString(36).substring(2, 12);
    navigate(`/couples/${newSessionId}`);
  };

  return (
    <div className="couples-texting-container">
      <h1 className="text-2xl font-bold mb-4">Couples Texting</h1>
      {sessionId ? (
        <CouplesSession sessionId={sessionId} />
      ) : (
        <div className="text-center">
            <p className="mb-4">Start a new session to begin chatting with your partner.</p>
            <button onClick={createSession} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Start New Session
            </button>
        </div>
      )}
    </div>
  );
};

export default CouplesTexting;
