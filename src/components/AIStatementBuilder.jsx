import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

const AIStatementBuilder = ({ onSaveStatement }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you build a healthy I-Statement. What would you normally want to say to your partner? Don't hold back - type exactly what you're feeling, even if it sounds harsh. I'll help you transform it into a constructive message."
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [finalStatement, setFinalStatement] = useState(null);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newUserMessage = { role: 'user', content: userInput };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const conversationHistory = [...messages, newUserMessage].map(m => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n');

      const { data, error } = await supabase.functions.invoke('generate-i-statement', {
        body: { 
          text: `You are an expert relationship coach helping someone build an I-Statement.

CONVERSATION SO FAR:
${conversationHistory}

YOUR TASK:
1. If this is the user's first message expressing what they want to say, acknowledge their feelings and ask 1-2 clarifying questions to understand:
   - What specific situation triggered this feeling?
   - What emotion are they experiencing (hurt, frustrated, anxious, etc.)?
   - What do they need from their partner?

2. If you have enough information, create a well-formed I-Statement using this format:
   "I feel [emotion] when [specific situation] because [reason]. I would appreciate if [specific request]."

3. When presenting the final I-Statement, wrap it in [FINAL_STATEMENT] tags like this:
   [FINAL_STATEMENT]I feel hurt when you don't call me back because it makes me feel unimportant. I would appreciate if you could send a quick text if you're busy.[/FINAL_STATEMENT]

4. After presenting the I-Statement, ask if they'd like to refine it further.

Keep responses warm, supportive, and concise. Never judge their original message.`
        }
      });

      if (error) throw error;

      const responseText = data.iStatement || data.response || "I'm having trouble processing that. Could you try rephrasing?";
      
      const statementMatch = responseText.match(/\[FINAL_STATEMENT\]([\s\S]*?)\[\/FINAL_STATEMENT\]/);
      if (statementMatch) {
        setFinalStatement(statementMatch[1].trim());
      }

      const cleanedResponse = responseText.replace(/\[FINAL_STATEMENT\][\s\S]*?\[\/FINAL_STATEMENT\]/g, '').trim();
      
      setMessages(prev => [...prev, { role: 'assistant', content: cleanedResponse || responseText }]);

    } catch (error) {
      console.error('AI error:', error);
      toast.error('AI service unavailable. Please try again.');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Let me help you manually. Can you tell me:\n1. What emotion are you feeling?\n2. What specific situation triggered this?\n3. What do you need from your partner?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyStatement = () => {
    if (finalStatement) {
      navigator.clipboard.writeText(finalStatement);
      setCopied(true);
      toast.success('I-Statement copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const saveStatement = async () => {
    if (!finalStatement) return;
    
    try {
      const { error } = await supabase
        .from('conres_istatement_history')
        .insert([{
          original_message: messages.find(m => m.role === 'user')?.content || '',
          final_statement: finalStatement,
          conversation: JSON.stringify(messages)
        }]);
      
      if (error) throw error;
      toast.success('I-Statement saved!');
      if (onSaveStatement) onSaveStatement(finalStatement);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Could not save. Please try again.');
    }
  };

  const resetConversation = () => {
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm here to help you build a healthy I-Statement. What would you normally want to say to your partner? Don't hold back - type exactly what you're feeling, even if it sounds harsh. I'll help you transform it into a constructive message."
    }]);
    setFinalStatement(null);
    setUserInput('');
  };

  return (
    <Card className="glass-card border-border h-full">
      <CardContent className="p-0 flex flex-col h-[600px]">
        <div className="flex items-center justify-between p-4 border-b border-border/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-foreground">AI I-Statement Builder</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={resetConversation}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Start Over
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                    : 'bg-muted/50 text-foreground rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-muted/50 p-4 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {finalStatement && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">Your I-Statement</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={copyStatement}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={saveStatement}>
                  Save
                </Button>
              </div>
            </div>
            <p className="text-foreground font-medium">{finalStatement}</p>
          </motion.div>
        )}

        <div className="p-4 border-t border-border/20">
          <div className="flex gap-2">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type what you want to say..."
              className="resize-none"
              rows={2}
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!userInput.trim() || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIStatementBuilder;
