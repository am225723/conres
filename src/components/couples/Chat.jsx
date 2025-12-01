import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  sendMessage, 
  getMessageHistory, 
  supabase 
} from '../../lib/supabase';
import { 
  analyzeEmotionWithAI, 
  fallbackEmotionAnalysis, 
  getEmotionColor,
  saveEmotionAnalysis 
} from '../../lib/emotionAnalysis';

const Chat = ({ currentUser, otherUser, sessionId }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('neutral');
  const [suggestions, setSuggestions] = useState([]);
  const [rewording, setRewording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#F5F5F5');
  const [emotionAnalysisEnabled, setEmotionAnalysisEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);

  // Load message history on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const result = await getMessageHistory(sessionId);
        if (result.success) {
          setMessages(result.messages);
          // Update background based on latest emotion
          updateBackgroundFromMessages(result.messages);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [sessionId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `session_id=eq.${sessionId}` 
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages((prev) => [...prev, payload.new]);
          
          // Update background color based on emotion
          if (payload.new.tone_analysis?.primaryEmotion) {
            const color = getEmotionColor(
              payload.new.tone_analysis.primaryEmotion,
              payload.new.tone_analysis.intensity || 5
            );
            setBackgroundColor(color);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          toast.error('Real-time connection failed');
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update background color from message history
  const updateBackgroundFromMessages = (msgs) => {
    if (msgs.length === 0) return;
    
    const latestMessage = msgs[msgs.length - 1];
    if (latestMessage.tone_analysis?.primaryEmotion) {
      const color = getEmotionColor(
        latestMessage.tone_analysis.primaryEmotion,
        latestMessage.tone_analysis.intensity || 5
      );
      setBackgroundColor(color);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      // Analyze emotion if enabled
      let emotionData = null;
      if (emotionAnalysisEnabled) {
        const context = messages.slice(-3).map(m => m.message_text).join(' ');
        emotionData = await analyzeEmotionWithAI(message, context);
      } else {
        emotionData = fallbackEmotionAnalysis(message);
      }

      const toneAnalysis = {
        primaryEmotion: emotionData.primaryEmotion,
        intensity: emotionData.intensity,
        sentimentScore: emotionData.sentimentScore,
        emotionalContext: emotionData.emotionalContext,
        firmnessLevel: tone
      };

      // Send message
      const result = await sendMessage(sessionId, currentUser, message, toneAnalysis);

      if (result.success) {
        // Save emotion analysis to database
        if (emotionAnalysisEnabled) {
          await saveEmotionAnalysis(result.message.id, emotionData, supabase);
        }

        setMessage('');
        setSuggestions([]);
        
        // Update background color
        const color = getEmotionColor(emotionData.primaryEmotion, emotionData.intensity);
        setBackgroundColor(color);
        
        toast.success('Message sent!');
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

  const fetchSuggestions = async () => {
    if (!message.trim()) {
      toast.info('Please type a message first');
      return;
    }

    try {
      const { callAI } = await import('../../lib/aiService');
      const content = await callAI(`Generate 3 alternative ways to say "${message}" in a ${tone} tone. Provide only the alternatives, one per line.`);
      const suggestionsList = content.split('\n').filter(s => s.trim()).slice(0, 3);
      
      setSuggestions(suggestionsList);
      toast.success('Suggestions generated!');
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to generate suggestions');
    }
  };

  const handleReword = async () => {
    if (!message.trim()) {
      toast.info('Please type a message first');
      return;
    }

    setRewording(true);
    try {
      const { callAI } = await import('../../lib/aiService');
      const rewordedMessage = await callAI(`Reword the following message in a ${tone} tone: "${message}". Provide only the reworded message.`);
      setMessage(rewordedMessage.trim());
      toast.success('Message reworded!');
    } catch (error) {
      console.error('Error rewording message:', error);
      toast.error('Failed to reword message');
    } finally {
      setRewording(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="chat-container rounded-lg shadow-lg p-6 transition-colors duration-1000"
      style={{ backgroundColor }}
    >
      {/* Emotion Analysis Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{currentUser}'s Chat</h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={emotionAnalysisEnabled}
            onChange={(e) => setEmotionAnalysisEnabled(e.target.checked)}
            className="rounded"
          />
          <span>AI Emotion Analysis</span>
        </label>
      </div>

      {/* Messages Area */}
      <div className="messages-area bg-white/80 rounded-lg p-4 mb-4 h-96 overflow-y-auto">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`message mb-3 p-3 rounded-lg ${
              msg.user_id === currentUser 
                ? 'bg-primary/20 ml-auto max-w-[80%]' 
                : 'bg-secondary/20 mr-auto max-w-[80%]'
            }`}
          >
            <p className="font-semibold text-sm mb-1">{msg.user_id}</p>
            <p className="text-foreground">{msg.message_text}</p>
            {msg.tone_analysis?.primaryEmotion &amp;&amp; (
              <p className="text-xs text-muted-foreground mt-2">
                Emotion: {msg.tone_analysis.primaryEmotion} 
                ({msg.tone_analysis.intensity}/10)
              </p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="message-form mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSending}
          />
          <button 
            type="submit"
            disabled={isSending || !message.trim()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      {/* AI Features */}
      <div className="ai-features bg-white/80 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tone Selection */}
          <div className="tone-analysis">
            <label htmlFor="tone-select" className="block text-sm font-medium mb-2">
              Tone:
            </label>
            <select 
              id="tone-select" 
              value={tone} 
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="neutral">Neutral</option>
              <option value="friendly">Friendly</option>
              <option value="romantic">Romantic</option>
              <option value="playful">Playful</option>
              <option value="empathetic">Empathetic</option>
              <option value="assertive">Assertive</option>
            </select>
          </div>

          {/* Suggestions */}
          <div className="suggestions">
            <button 
              onClick={fetchSuggestions}
              disabled={!message.trim()}
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Suggestions
            </button>
          </div>

          {/* Rewording */}
          <div className="rewording">
            <button 
              onClick={handleReword} 
              disabled={rewording || !message.trim()}
              className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rewording ? 'Rewording...' : 'Reword Message'}
            </button>
          </div>
        </div>

        {/* Display Suggestions */}
        {suggestions.length > 0 &amp;&amp; (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Suggestions:</p>
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li 
                  key={i}
                  onClick={() => setMessage(s.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''))}
                  className="p-2 bg-white rounded cursor-pointer hover:bg-primary/10 transition-colors text-sm"
                >
                  {s.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '')}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;