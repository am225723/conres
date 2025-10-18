import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';

const Chat = ({ channel, firmness, userId }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const impactPreview = useMemo(() => {
    if (!message) return "—";
    const isAccusatory = /\byou\b(?!.*I feel)/i.test(message) && /never|always|should|fault/i.test(message);
    const firmnessLabel = firmness[0] < 40 ? "gentle" : firmness[0] < 70 ? "balanced" : "firm";
    return `Tone reads ${firmnessLabel}. ${isAccusatory ? "Note: may sound blaming — consider focusing more on 'I feel' + a concrete request." : "Likely to be received as self-focused and constructive."}`;
  }, [message, firmness]);

  useEffect(() => {
    if (!channel) return;

    const subscription = channel
      .on('broadcast', { event: 'message' }, (payload) => {
        setMessages((prev) => [...prev, payload.payload]);
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          toast.error('Could not connect to the real-time service.');
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [channel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !channel) return;

    try {
      await channel.send({
        type: 'broadcast',
        event: 'message',
        payload: { text: message, impact: impactPreview, userId },
      });
      setMessage('');
    } catch (error) {
      toast.error('Failed to send message.');
      console.error('Error sending message:', error);
    }
  };

  const suggestReply = async () => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      toast.info("No message to reply to.");
      return;
    }

    const prompt = `Based on the last message "${lastMessage.text}", suggest a supportive and constructive reply.`;

    try {
      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setMessage(result.choices[0].message.content);
      toast.success("Suggested reply has been filled in the message box.");
    } catch (e) {
      toast.error("Failed to get suggested reply.");
    }
  };

  const rewordAsIStatement = async () => {
    if (!message.trim()) {
      toast.info("Please type a message to reword.");
      return;
    }

    const prompt = `Reword the following message as an I-statement: "${message}"`;

    try {
      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setMessage(result.choices[0].message.content);
      toast.success("Message has been reworded as an I-statement.");
    } catch (e) {
      toast.error("Failed to reword message.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-w-2xl mx-auto bg-card rounded-lg shadow-lg">
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col mb-4 ${msg.userId === userId ? 'items-end' : 'items-start'}`}>
            <div className={`p-2 rounded-lg ${
                msg.userId === userId ? 'bg-primary text-primary-foreground' : 'bg-muted'
              } ${
                msg.impact.includes('gentle') ? 'border-l-4 border-green-400' :
                msg.impact.includes('balanced') ? 'border-l-4 border-blue-400' :
                msg.impact.includes('firm') ? 'border-l-4 border-red-400' : ''
              }`}>
              <p className="font-bold">{msg.userId === userId ? 'You' : 'Partner'}</p>
              <p>{msg.text}</p>
              <p className="text-xs text-muted-foreground italic">{msg.impact}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-grow bg-input border-border text-foreground placeholder:text-muted-foreground p-2 rounded-lg"
          />
          <button
            onClick={sendMessage}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
          >
            Send
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => suggestReply()}
            className="flex-1 bg-muted text-foreground py-2 px-4 rounded-lg"
          >
            Suggest a Reply
          </button>
          <button
            onClick={() => rewordAsIStatement()}
            className="flex-1 bg-muted text-foreground py-2 px-4 rounded-lg"
          >
            Reword as I-Statement
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
