import React, { useState, useEffect } from 'react';
import Pusher from 'pusher-js';

const Chat = ({ currentUser, otherUser, sessionId }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('neutral');
  const [suggestions, setSuggestions] = useState([]);
  const [rewording, setRewording] = useState(false);

  const channelName = `presence-chat-${sessionId}`;
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
      authEndpoint: '/api/pusher-auth',
      auth: {
        params: { userId: currentUser }
      }
    });

    const channel = pusher.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', (members) => {
      setMembers(Object.keys(members.members));
    });

    channel.bind('pusher:member_added', (member) => {
      setMembers((prevMembers) => [...prevMembers, member.id]);
    });

    channel.bind('pusher:member_removed', (member) => {
      setMembers((prevMembers) => prevMembers.filter((m) => m !== member.id));
    });

    channel.bind('new-message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      pusher.unsubscribe(channelName);
    };
  }, [channelName, currentUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const payload = {
      message,
      sender: currentUser,
      channel: channelName,
    };

    await fetch('/api/pusher-send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    setMessage('');
    setSuggestions([]);
  };

  const fetchSuggestions = async () => {
    if (!message.trim()) return;
    try {
      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate 3 alternative ways to say "${message}" in a ${tone} tone.`,
        }),
      });
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleReword = async () => {
    if (!message.trim()) return;
    setRewording(true);
    try {
      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Reword the following message in a ${tone} tone: "${message}"`,
        }),
      });
      const data = await response.json();
      setMessage(data.rewording);
    } catch (error) {
      console.error('Error rewording message:', error);
    } finally {
      setRewording(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="members-list">
        <h3 className="text-lg font-bold">In this session:</h3>
        <ul>
          {members.map((member) => (
            <li key={member}>{member}</li>
          ))}
        </ul>
      </div>
      <div className="messages-area">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender === currentUser ? 'sent' : 'received'}`}>
            <p><strong>{msg.sender}:</strong> {msg.message}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
      <div className="ai-features">
        <div className="tone-analysis">
          <label htmlFor="tone-select">Tone:</label>
          <select id="tone-select" value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="neutral">Neutral</option>
            <option value="friendly">Friendly</option>
            <option value="romantic">Romantic</option>
            <option value="playful">Playful</option>
          </select>
        </div>
        <div className="suggestions">
          <button onClick={fetchSuggestions}>Get Suggestions</button>
          {suggestions.length > 0 && (
            <ul>
              {suggestions.map((s, i) => (
                <li key={i} onClick={() => setMessage(s)}>{s}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rewording">
          <button onClick={handleReword} disabled={rewording}>
            {rewording ? 'Rewording...' : 'Reword'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;