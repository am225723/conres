import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CouplesSession from './CouplesSession';

const CouplesTexting = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const createSession = async () => {
    const response = await fetch('/api/create-session', {
      method: 'POST',
    });
    const data = await response.json();
    navigate(`/couples/${data.sessionId}`);
  };

  return (
    <div className="couples-texting-container">
      <h1 className="text-2xl font-bold mb-4">Couples Texting</h1>
      {sessionId ? (
        <CouplesSession sessionId={sessionId} />
      ) : (
        <button onClick={createSession} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Start New Session
        </button>
      )}
    </div>
  );
};

export default CouplesTexting;