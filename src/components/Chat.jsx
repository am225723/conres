import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import { 
  sendMessage, 
  getMessageHistory, 
  getSessionParticipants,
  leaveSession,
  supabase 
} from '../lib/supabase';

const Chat = ({ session, firmness, userId, nickname, onLeave }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAiHelping, setIsAiHelping] = useState(false); // New state for AI buttons
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);

  // Calculate impact preview based on message content
  const impactPreview = useMemo(() => {
    if (!message) return "—";
    
    const isAccusatory = /\byou\b(?!.*I feel)/i.test(message) && /never|always|should|fault/i.test(message);
    const firmnessValue = firmness?.[0] || 50;
    const firmnessLabel = firmnessValue < 40 ? "gentle" : firmnessValue < 70 ? "balanced" : "firm";
    
    return `Tone reads ${firmnessLabel}. ${
      isAccusatory 
        ? "Note: may sound blaming — consider focusing more on 'I feel' + a concrete request." 
        : "Likely to be received as self-focused and constructive."
    }`;
  }, [message, firmness]);

  // Load message history and participants on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const messagesResult = await getMessageHistory(session.id);
        if (messagesResult.success) {
          setMessages(messagesResult.messages);
        }

        const participantsResult = await getSessionParticipants(session.id);
        if (participantsResult.success) {
          setParticipants(participantsResult.participants);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [session.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!session?.id) return;

    const channel = supabase.channel(`session-${session.id}`, {
      config: {
        broadcast: { self: true }
      }
    });

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${session.id}` },
        (payload) => {
          console.log('New message received:', payload);
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` },
        // ✨ SUGGESTION APPLIED: Update participants directly from payload
        (payload) => {
          console.log('New participant joined:', payload.new);
          setParticipants((currentParticipants) => [...currentParticipants, payload.new]);
          if (payload.new.user_id !== userId) {
            toast.info(`${payload.new.nickname || 'Someone'} joined the chat`);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          toast.error('Could not connect to real-time service');
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('Cleaning up channel subscription');
      channel.unsubscribe();
    };
  }, [session?.id, userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      const firmnessValue = firmness?.[0] || 50;
      const firmnessLabel = firmnessValue < 40 ? "gentle" : firmnessValue < 70 ? "balanced" : "firm";
      
      const toneAnalysis = {
        impactPreview,
        firmnessLevel: firmnessLabel,
        firmnessValue
      };

      const result = await sendMessage(session.id, userId, message, toneAnalysis);

      if (result.success) {
        setMessage('');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ✨ SUGGESTION APPLIED: Add loading state
  const suggestReply = async () => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      toast.info("No message to reply to.");
      return;
    }
    
    setIsAiHelping(true);
    const prompt = `Based on the last message "${lastMessage.message_text}", suggest a supportive and constructive reply.`;

    try {
      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      setMessage(result.choices[0].message.content);
      toast.success("Suggested reply has been filled in the message box.");
    } catch (e) {
      console.error('Error getting suggested reply:', e);
      toast.error("Failed to get suggested reply.");
    } finally {
      setIsAiHelping(false);
    }
  };

  // ✨ SUGGESTION APPLIED: Add loading state
  const rewordAsIStatement = async () => {
    if (!message.trim()) {
      toast.info("Please type a message to reword.");
      return;
    }

    setIsAiHelping(true);
    const prompt = `Reword the following message as an I-statement: "${message}"`;

    try {
      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      setMessage(result.choices[0].message.content);
      toast.success("Message has been reworded as an I-statement.");
    } catch (e) {
      console.error('Error rewording message:', e);
      toast.error("Failed to reword message.");
    } finally {
      setIsAiHelping(false);
    }
  };

  const handleLeaveSession = async () => {
    try {
      await leaveSession(session.id, userId);
      if (channelRef.current) channelRef.current.unsubscribe();
      onLeave();
      toast.info('Left the session');
    } catch (error) {
      console.error('Error leaving session:', error);
      toast.error('Failed to leave session');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-w-2xl mx-auto bg-card rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div>
          <h2 className="text-lg font-bold text-foreground">Session: {session.session_code}</h2>
          <p className="text-xs text-foreground/60">{participants.length} participant{participants.length !== 1 ? 's' : ''} online</p>
        </div>
        <button onClick={handleLeaveSession} className="bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Leave
        </button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-foreground/50 mt-8"><p>No messages yet. Start the conversation!</p></div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.user_id === userId;
            const participant = participants.find(p => p.user_id === msg.user_id);
            const displayName = participant?.nickname || (isOwnMessage ? 'You' : 'Partner');
            
            return (
              <div key={msg.id || index} className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'} ${msg.firmness_level === 'gentle' ? 'border-l-4 border-green-400' : msg.firmness_level === 'balanced' ? 'border-l-4 border-blue-400' : msg.firmness_level === 'firm' ? 'border-l-4 border-red-400' : ''}`}>
                  <p className="font-semibold text-sm mb-1">{displayName}</p>
                  <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                  {msg.impact_preview && (<p className="text-xs mt-2 opacity-70 italic">{msg.impact_preview}</p>)}
                  <p className="text-xs mt-1 opacity-60">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-muted/30">
        {message && (
          <div className="mb-2 p-2 bg-muted rounded text-xs text-foreground/70"><strong>Impact Preview:</strong> {impactPreview}</div>
        )}
        <div className="flex gap-2 mb-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-grow bg-input border border-border text-foreground placeholder:text-muted-foreground p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={2}
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>

        {/* ✨ SUGGESTION APPLIED: Update button text and disabled state */}
        <div className="flex gap-2">
          <button
            onClick={suggestReply}
            disabled={isAiHelping}
            className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAiHelping ? 'Thinking...' : 'Suggest a Reply'}
          </button>
          <button
            onClick={rewordAsIStatement}
            disabled={isAiHelping || !message.trim()}
            className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAiHelping ? 'Rewording...' : 'Reword as I-Statement'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
