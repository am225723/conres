import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Copy, Check, RefreshCw, Zap, ThumbsUp, ThumbsDown, Edit3, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

const AIStatementBuilder = ({ onSaveStatement }) => {
  const [rawFeeling, setRawFeeling] = useState('');
  const [feeling, setFeeling] = useState('');
  const [situation, setSituation] = useState('');
  const [because, setBecause] = useState('');
  const [request, setRequest] = useState('');
  const [firmness, setFirmness] = useState([30]);
  const [useRawMode, setUseRawMode] = useState(true);
  
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedStatement, setGeneratedStatement] = useState(null);
  const [verificationStep, setVerificationStep] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateStatement = async () => {
    if (useRawMode) {
      if (!rawFeeling.trim()) {
        toast.error('Please write what you want to say first');
        return;
      }
    } else {
      if (!feeling.trim() && !situation.trim()) {
        toast.error('Please fill in at least the feeling and situation fields');
        return;
      }
    }
    
    setIsLoading(true);
    setVerificationStep(false);
    
    try {
      const firmnessTone = firmness[0] < 33 ? 'gentle and soft' : firmness[0] < 66 ? 'balanced and calm' : 'assertive and direct';
      
      let prompt;
      if (useRawMode) {
        prompt = `Transform this raw, unfiltered message into a healthy I-Statement. The person is venting - help them express this constructively.

WHAT THEY WANT TO SAY (raw, unfiltered):
"${rawFeeling}"

DESIRED TONE: ${firmnessTone}

YOUR TASK:
1. Identify the core emotion behind their words (hurt, frustrated, anxious, overwhelmed, etc.)
2. Understand what situation triggered this feeling
3. Recognize what they need from their partner
4. Transform it into a constructive I-Statement format: "I feel [emotion] when [situation] because [impact]. I would appreciate if [request]."

IMPORTANT: Keep the emotional truth of their message but express it without blame or attack. The I-Statement should address the same concern but in a way their partner can hear.

Return ONLY the I-Statement, nothing else.`;
      } else {
        prompt = `Create a well-formed I-Statement based on these inputs. The tone should be ${firmnessTone}.

USER'S INPUTS:
- Feeling: ${feeling || 'not specified'}
- Situation (When...): ${situation || 'not specified'}
- Impact (Because...): ${because || 'not specified'}
- Request (Could we...): ${request || 'not specified'}

Create a natural, empathetic I-Statement that:
1. Starts with "I feel [emotion]"
2. Describes the specific situation
3. Explains the personal impact
4. Makes a constructive request

Return ONLY the I-Statement, nothing else. Make it sound natural and conversational, not robotic.`;
      }
      
      const { data, error } = await supabase.functions.invoke('generate-i-statement', {
        body: { text: prompt }
      });

      if (error) throw error;

      const statement = data.iStatement || data.response;
      setGeneratedStatement(statement);
      setVerificationStep(true);
      setShowChat(true);
      
      const originalText = useRawMode ? rawFeeling : `Feeling: ${feeling}, Situation: ${situation}`;
      setMessages([{
        role: 'assistant',
        content: `I've transformed your message into this I-Statement:\n\n"${statement}"\n\nDoes this capture what you wanted to express? If not, tell me what's missing or what you'd like to change.`
      }]);

    } catch (error) {
      console.error('AI error:', error);
      let manualStatement;
      if (useRawMode) {
        manualStatement = `I feel [emotion] when [situation] because [impact]. Could we [request]?`;
      } else {
        manualStatement = `I feel ${feeling || '[emotion]'} when ${situation || '[situation]'} because ${because || '[impact]'}. Could we ${request || '[request]'}?`;
      }
      setGeneratedStatement(manualStatement);
      setVerificationStep(true);
      setShowChat(true);
      setMessages([{
        role: 'assistant',
        content: `I couldn't connect to AI right now. Here's a template:\n\n"${manualStatement}"\n\nTell me more about what you're feeling and I'll help you build it.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newUserMessage = { role: 'user', content: userInput };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n');

      const { data, error } = await supabase.functions.invoke('generate-i-statement', {
        body: { 
          text: `You are helping refine an I-Statement. Here's the context:

ORIGINAL INPUTS:
- Feeling: ${feeling}
- Situation: ${situation}
- Impact: ${because}
- Request: ${request}

CURRENT I-STATEMENT:
"${generatedStatement}"

CONVERSATION:
${conversationHistory}

User's latest message: ${userInput}

YOUR TASK:
1. If the user is confirming the statement is good, respond warmly and let them know they can save it.
2. If the user wants changes, create a revised I-Statement that addresses their feedback.
3. When presenting a revised statement, format it clearly.
4. Always ask if the new version captures what they meant.

Keep responses supportive and concise. If you create a new statement, include it clearly in your response starting with "Here's the revised version:" followed by the statement in quotes.`
        }
      });

      if (error) throw error;

      const responseText = data.iStatement || data.response || "I understand. Could you tell me more about what you'd like to change?";
      
      const revisedMatch = responseText.match(/Here's the revised version:?\s*"([^"]+)"/i) || 
                           responseText.match(/"([^"]+)"/);
      if (revisedMatch && revisedMatch[1].toLowerCase().startsWith('i feel')) {
        setGeneratedStatement(revisedMatch[1]);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

    } catch (error) {
      console.error('AI error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting. You can manually edit the statement above, or tell me what changes you'd like and I'll try again." 
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

  const confirmStatement = () => {
    toast.success('Statement confirmed and ready to use!');
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: "Your I-Statement is ready. You can copy it or save it for later reference." 
    }]);
    setVerificationStep(false);
  };

  const copyStatement = () => {
    if (generatedStatement) {
      navigator.clipboard.writeText(generatedStatement);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const saveStatement = async () => {
    if (!generatedStatement) return;
    
    try {
      const originalMessage = useRawMode 
        ? rawFeeling 
        : `Feeling: ${feeling}, Situation: ${situation}, Because: ${because}, Request: ${request}`;
      
      const { error } = await supabase
        .from('conres_istatement_history')
        .insert([{
          original_message: originalMessage,
          final_statement: generatedStatement,
          conversation: JSON.stringify(messages)
        }]);
      
      if (error) throw error;
      toast.success('I-Statement saved!');
      if (onSaveStatement) onSaveStatement(generatedStatement);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Could not save. Please try again.');
    }
  };

  const resetAll = () => {
    setRawFeeling('');
    setFeeling('');
    setSituation('');
    setBecause('');
    setRequest('');
    setFirmness([30]);
    setMessages([]);
    setGeneratedStatement(null);
    setVerificationStep(false);
    setShowChat(false);
    setUserInput('');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="glass-card border-border">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Build Your I-Statement
            </h2>
            {generatedStatement && (
              <Button variant="ghost" size="sm" onClick={resetAll}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Start Over
              </Button>
            )}
          </div>

          <div className="flex rounded-lg bg-muted/50 p-1 mb-2">
            <button
              onClick={() => setUseRawMode(true)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                useRawMode 
                  ? 'bg-white dark:bg-gray-800 shadow text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Express Freely
            </button>
            <button
              onClick={() => setUseRawMode(false)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                !useRawMode 
                  ? 'bg-white dark:bg-gray-800 shadow text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Structured
            </button>
          </div>

          <div className="space-y-4">
            {useRawMode ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  What do you really want to say? Don't hold back...
                </label>
                <Textarea
                  value={rawFeeling}
                  onChange={(e) => setRawFeeling(e.target.value)}
                  placeholder="Write exactly what you're feeling, even if it sounds harsh or blaming. Get it all out - I'll help you transform it into something constructive..."
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-[180px]"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This is a safe space. Express yourself honestly - the AI will help transform it into a healthy I-Statement.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">I feel...</label>
                  <Input
                    value={feeling}
                    onChange={(e) => setFeeling(e.target.value)}
                    placeholder="hurt, frustrated, worried, anxious..."
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">When...</label>
                  <Textarea
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="Describe what happened or the specific situation..."
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Because...</label>
                  <Textarea
                    value={because}
                    onChange={(e) => setBecause(e.target.value)}
                    placeholder="Explain how it affects you personally..."
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Could we... (Request)</label>
                  <Input
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    placeholder="talk about this, find a solution together..."
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tone: {firmness[0] < 33 ? 'Gentle' : firmness[0] < 66 ? 'Balanced' : 'Assertive'}</label>
              <Slider
                value={firmness}
                onValueChange={setFirmness}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-foreground/60 mt-1">
                <span>Gentle</span>
                <span>Balanced</span>
                <span>Assertive</span>
              </div>
            </div>
            <Button
              onClick={generateStatement}
              disabled={isLoading || (useRawMode ? !rawFeeling.trim() : (!feeling.trim() && !situation.trim()))}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Generate with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardContent className="p-0 flex flex-col h-[600px]">
          <div className="p-4 border-b border-border/20 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-500" />
              Your I-Statement
            </h2>
          </div>

          {generatedStatement ? (
            <>
              <div className="p-4 border-b border-border/20">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl"
                >
                  <p className="text-foreground font-medium leading-relaxed">"{generatedStatement}"</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={copyStatement}>
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={saveStatement}>
                      Save
                    </Button>
                  </div>
                </motion.div>

                {verificationStep && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg"
                  >
                    <p className="text-sm text-foreground font-medium mb-2">Does this capture what you wanted to say?</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={confirmStatement} className="border-green-500/50 text-green-600 hover:bg-green-500/10">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Yes, it's good
                      </Button>
                      <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                        onClick={() => document.getElementById('refine-input')?.focus()}>
                        <Edit3 className="w-4 h-4 mr-1" />
                        Needs changes
                      </Button>
                    </div>
                  </motion.div>
                )}
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-sm">
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

              <div className="p-4 border-t border-border/20">
                <div className="flex gap-2">
                  <Textarea
                    id="refine-input"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tell me what to change..."
                    className="resize-none text-sm"
                    rows={2}
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!userInput.trim() || isLoading}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center text-muted-foreground">
                <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Fill in the form and generate</p>
                <p className="text-sm">Your AI-enhanced I-Statement will appear here, and you can refine it through conversation</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIStatementBuilder;
