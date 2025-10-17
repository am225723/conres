import React from 'react';
import Chat from './Chat';

const CouplesSession = ({ sessionId }) => {
  return (
    <div className="couples-session" style={{ display: 'flex', gap: '20px' }}>
      <div className="user1-chat" style={{ flex: 1 }}>
        <h2 className="text-xl font-bold mb-2">User 1</h2>
        <Chat currentUser="User1" otherUser="User2" sessionId={sessionId} />
      </div>
      <div className="user2-chat" style={{ flex: 1 }}>
        <h2 className="text-xl font-bold mb-2">User 2</h2>
        <Chat currentUser="User2" otherUser="User1" sessionId={sessionId} />
      </div>
    </div>
  );
};

export default CouplesSession;