import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

const AiModal = ({
  isOpen,
  onClose,
  title,
  initialMessage,
  onInsert,
}) => {
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setConversation([{ author: 'ai', text: initialMessage }]);
    } else {
      // Clear conversation when closed, as requested
      setConversation([]);
    }
  }, [isOpen, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleUserSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isThinking) return;

    const newConversation = [...conversation, { author: 'user', text: userInput }];
    setConversation(newConversation);
    setUserInput('');
    setIsThinking(true);

    const prompt = `Continuing the conversation based on this new message: "${userInput}". The previous context is: ${JSON.stringify(conversation)}. Provide a helpful response.`;

    try {
      const { callAI } = await import('../lib/aiService');
      const aiResponse = await callAI(prompt);
      setConversation([...newConversation, { author: 'ai', text: aiResponse }]);
    } catch (err) {
      console.error('Error with AI assistant:', err);
      toast.error('The AI assistant is having trouble. Please try again.');
      setConversation([...newConversation, { author: 'ai', text: "I'm sorry, I encountered an error." }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleInsert = () => {
    const lastAiResponse = conversation.slice().reverse().find(m => m.author === 'ai');
    if (lastAiResponse) {
      onInsert(lastAiResponse.text);
      onClose();
    } else {
      toast.info('There is no AI response to insert.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[80vh]">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">&times;</button>
        </div>

        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {conversation.map((msg, index) => (
            <div key={index} className={`flex ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${msg.author === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-lg bg-muted">
                <p className="whitespace-pre-wrap break-words animate-pulse">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border">
          <form onSubmit={handleUserSendMessage} className="flex gap-2 mb-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="flex-grow bg-input border border-border text-foreground placeholder:text-muted-foreground p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isThinking}
            />
            <button
              type="submit"
              disabled={!userInput.trim() || isThinking}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isThinking ? '...' : 'Send'}
            </button>
          </form>
          <button
            onClick={handleInsert}
            disabled={isThinking}
            className="w-full bg-muted hover:bg-muted/80 text-foreground py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Insert Last Reply
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiModal;