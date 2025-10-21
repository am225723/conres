import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  sendMessage, 
  getMessageHistory, 
  getSessionParticipants,
  leaveSession,
  supabase 
} from '../lib/supabase';
import AiModal from './AiModal';

const toneColorMap = {
  Calm: '#A0D2EB',
  Reassuring: '#4A90E2',
  Empathetic: '#A9D8B8',
  Compassionate: '#50C878',
  Cooperative: '#228B22',
  Curious: '#FDFD96',
  Assertive: '#FFD700',
  Anxious: '#FDE74C',
  Impatient: '#FFA500',
  'Passive-aggressive': '#AD8350',
  Sarcastic: '#BF8231',
  Judgmental: '#D2691E',
  Dismissive: '#E25822',
  Blaming: '#E62020',
  Aggressive: '#D40000',
  Confrontational: '#B80F0A',
  Hostile: '#8B0000',
};

const getToneColor = (tone) => {
  if (!tone) return '#FFFFFF'; // Default color
  const lowerTone = tone.toLowerCase();
  for (const key in toneColorMap) {
    if (lowerTone.includes(key.toLowerCase())) {
      return toneColorMap[key];
    }
  }
  return '#FFFFFF'; // Default if no match
};

const Chat = ({ session, firmness, userId, nickname, onLeave }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAiHelping, setIsAiHelping] = useState(false);
  const [impactPreview, setImpactPreview] = useState('—');
  const [isAnalyzingTone, setIsAnalyzingTone] = useState(false);
  const [sendDisabledUntil, setSendDisabledUntil] = useState(0);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalInitialMessage, setModalInitialMessage] = useState('');
  const [currentTone, setCurrentTone] = useState(null);
  const [chatBackgroundColor, setChatBackgroundColor] = useState('#FFFFFF');
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Polling fallback for when realtime fails
  const startPolling = () => {
    console.log('🔄 Starting polling fallback for messages');
    setRealtimeEnabled(false);
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const result = await getMessageHistory(session.id);
        if (result.success) {
          setMessages(prevMessages => {
            // Only update if there are new messages
            if (result.messages.length > prevMessages.length) {
              return result.messages;
            }
            return prevMessages;
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Analyze tone using AI with debounce
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!message.trim()) {
        setImpactPreview('—');
        return;
      }

      setIsAnalyzingTone(true);
      setImpactPreview('Analyzing...');

      const prompt = `Analyze the tone of this message in a couples therapy context: "${message}". Respond with just one or two words from this list: Calm, Reassuring, Empathetic, Compassionate, Cooperative, Curious, Assertive, Anxious, Impatient, Passive-aggressive, Sarcastic, Judgmental, Dismissive, Blaming, Aggressive, Confrontational, Hostile.`;

      try {
        const response = await fetch('/api/perplexity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        const tone = result.choices[0].message.content.trim();
        setCurrentTone(tone);
        setImpactPreview(`Tone detected: ${tone}`);
        setSendDisabledUntil(Date.now() + 1000); // Disable send for 1 second after analysis
      } catch (e) {
        console.error('Error analyzing tone:', e);
        setImpactPreview('Could not analyze tone.');
      } finally {
        setIsAnalyzingTone(false);
      }
    }, 250); // 250ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [message]);

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

  // Set up real-time subscription with fallback
  useEffect(() => {
    if (!session?.id) return;

    let realtimeTimeout;
    let subscriptionSuccessful = false;

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
          console.log('✅ New message received via realtime:', payload);
          const newMessage = payload.new;
          setMessages((prev) => [...prev, newMessage]);

          if (newMessage.tone_analysis?.tone) {
            setChatBackgroundColor(getToneColor(newMessage.tone_analysis.tone));
          }
          subscriptionSuccessful = true;
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` },
        (payload) => {
          console.log('✅ New participant joined via realtime:', payload.new);
          setParticipants((currentParticipants) => [...currentParticipants, payload.new]);
          if (payload.new.user_id !== userId) {
            toast.info(`${payload.new.nickname || 'Someone'} joined the chat`);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time updates');
          subscriptionSuccessful = true;
          
          // Clear any existing timeout
          if (realtimeTimeout) {
            clearTimeout(realtimeTimeout);
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription failed');
          toast.error('Real-time connection failed, using polling mode');
          startPolling();
        }
      });

    // Set a timeout to detect if realtime is not working
    realtimeTimeout = setTimeout(() => {
      if (!subscriptionSuccessful) {
        console.warn('⚠️ Realtime subscription timed out, switching to polling');
        toast.warning('Real-time unavailable, using polling mode');
        startPolling();
      }
    }, 5000); // 5 second timeout

    channelRef.current = channel;

    return () => {
      console.log('🧹 Cleaning up subscriptions');
      if (realtimeTimeout) {
        clearTimeout(realtimeTimeout);
      }
      stopPolling();
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
      const toneAnalysis = {
        tone: currentTone,
        impactPreview,
        firmnessLevel: currentTone,
      };

      setChatBackgroundColor(getToneColor(currentTone));
      const result = await sendMessage(session.id, userId, message, toneAnalysis);

      if (result.success && result.message) {
        // Manually add the new message to the state so it appears instantly for the sender.
        // The realtime subscription will handle it for the other participant.
        setMessages(prev => [...prev, result.message]);
        setMessage('');
        setCurrentTone(null);
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

  const suggestReply = () => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      toast.info("No message to reply to.");
      return;
    }
    setModalTitle('Suggest a Reply');
    setModalInitialMessage(`Based on the last message: "${lastMessage.message_text}", what kind of reply would you like to send? For example, you could ask for a more empathetic, assertive, or understanding response.`);
    setIsModalOpen(true);
  };

  const rewordAsIStatement = () => {
    if (!message.trim()) {
      toast.info("Please type a message to reword.");
      return;
    }
    setModalTitle('Reword as I-Statement');
    setModalInitialMessage(`You want to reword this message as an I-statement: "${message}". What is the core feeling or need you want to express?`);
    setIsModalOpen(true);
  };

  const handleInvitePartner = () => {
    const inviteLink = `${window.location.origin}/couples?session=${session.session_code}`;
    const messageBody = `Join our interactive session: ${inviteLink}`;
    const smsLink = `sms:?body=${encodeURIComponent(messageBody)}`;

    // Attempt to open the messaging app
    window.location.href = smsLink;

    // Also, copy to clipboard as a fallback
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast.success('Invite link copied to clipboard!');
    }, (err) => {
      toast.error('Could not copy invite link.');
      console.error('Clipboard write failed:', err);
    });
  };

  const handleLeaveSession = async () => {
    try {
      await leaveSession(session.id, userId);
      if (channelRef.current) channelRef.current.unsubscribe();
      stopPolling();
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
    <>
      <AiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        initialMessage={modalInitialMessage}
        onInsert={(text) => {
          setMessage(text);
          toast.success('Text inserted!');
        }}
      />
      <div
        className={`flex flex-col h-[calc(100vh-150px)] max-w-2xl mx-auto bg-card rounded-lg shadow-lg ${isModalOpen ? 'hidden' : ''}`}
        style={{ backgroundColor: chatBackgroundColor, transition: 'background-color 0.5s ease' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div>
          <h2 className="text-lg font-bold text-foreground">Session: {session.session_code}</h2>
          <p className="text-xs text-foreground/60">
            {participants.length} participant{participants.length !== 1 ? 's' : ''} online
            {!realtimeEnabled && (
              <span className="ml-2 text-orange-500">• Polling mode</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleInvitePartner} className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Invite Partner
          </button>
          <button onClick={handleLeaveSession} className="bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Leave
          </button>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-foreground/50 mt-8">
            <p>No messages yet. Start the conversation!</p>
            {!realtimeEnabled && (
              <p className="text-xs mt-2 text-orange-500">Using polling mode - messages may take a moment to appear</p>
            )}
          </div>
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
          <div className="mb-2 p-2 bg-muted rounded text-xs text-foreground/70">
            <strong>Impact Preview:</strong> {impactPreview}
          </div>
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
            style={{ backgroundColor: getToneColor(currentTone), transition: 'background-color 0.5s ease' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending || isAnalyzingTone || Date.now() < sendDisabledUntil}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>

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
    </>
  );
};

export default Chat;