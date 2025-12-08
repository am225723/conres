import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, RotateCcw, Settings, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

const AIRolePlayer = ({ onSaveSession }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [relationshipType, setRelationshipType] = useState('romantic');
  const [partnerStyle, setPartnerStyle] = useState('supportive');
  const [scenario, setScenario] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const messagesEndRef = useRef(null);

  const relationshipTypes = {
    romantic: "your romantic partner",
    friend: "your close friend",
    coworker: "your coworker or colleague",
    manager: "your manager or supervisor",
    family: "a family member"
  };

  const partnerStyles = {
    supportive: "warm, understanding, and validating. You actively listen and acknowledge feelings.",
    defensive: "initially defensive and may make excuses, but can be redirected with patience.",
    dismissive: "tends to minimize feelings, but can learn to be more attentive when approached correctly.",
    avoidant: "uncomfortable with conflict and may try to change the subject, but can engage with gentle persistence.",
    anxious: "worried and may need reassurance, sometimes overthinks situations."
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startRolePlay = async () => {
    if (!scenario.trim()) {
      toast.error('Please describe the situation you want to practice');
      return;
    }

    setIsStarted(true);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-i-statement', {
        body: { 
          text: `You are playing the role of ${relationshipTypes[relationshipType]} in a communication practice role-play.

PARTNER PERSONALITY: ${partnerStyles[partnerStyle]}

SCENARIO: ${scenario}

Start the conversation as this person. React to the scenario naturally based on your personality type. Keep your response to 2-3 sentences. Don't break character.`
        }
      });

      if (error) throw error;

      setMessages([{
        role: 'partner',
        content: data.iStatement || "I noticed you wanted to talk about something. What's on your mind?"
      }]);
    } catch (error) {
      console.error('AI error:', error);
      setMessages([{
        role: 'partner',
        content: "Hey, I can tell something's bothering you. Want to talk about it?"
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
      const conversationHistory = [...messages, newUserMessage].map(m => 
        `${m.role === 'user' ? 'You' : 'Other Person'}: ${m.content}`
      ).join('\n');

      const { data, error } = await supabase.functions.invoke('generate-i-statement', {
        body: { 
          text: `You are playing the role of ${relationshipTypes[relationshipType]} in a communication practice role-play.

PARTNER PERSONALITY: ${partnerStyles[partnerStyle]}

SCENARIO: ${scenario}

CONVERSATION SO FAR:
${conversationHistory}

Respond naturally. Stay in character based on your personality type. If the user is practicing healthy communication (I-statements, active listening), gradually become more receptive. Keep responses to 2-3 sentences. Be authentic but remember this is a learning exercise.`
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { 
        role: 'partner', 
        content: data.iStatement || "I hear what you're saying. Can you tell me more about how you feel?"
      }]);
    } catch (error) {
      console.error('AI error:', error);
      setMessages(prev => [...prev, { 
        role: 'partner', 
        content: "I'm listening. What else is on your mind?"
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

  const resetSession = () => {
    setMessages([]);
    setScenario('');
    setRelationshipType('romantic');
    setIsStarted(false);
  };

  const saveSession = async () => {
    try {
      const { error } = await supabase
        .from('conres_roleplay_sessions')
        .insert([{
          scenario,
          relationship_type: relationshipType,
          partner_style: partnerStyle,
          conversation: JSON.stringify(messages),
          message_count: messages.length
        }]);
      
      if (error) throw error;
      toast.success('Session saved!');
      if (onSaveSession) onSaveSession();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Could not save session');
    }
  };

  return (
    <Card className="glass-card border-border h-full">
      <CardContent className="p-0 flex flex-col h-[600px]">
        <div className="flex items-center justify-between p-4 border-b border-border/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-bold text-foreground">AI Practice Partner</h2>
          </div>
          {isStarted && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={saveSession}>
                Save Session
              </Button>
              <Button variant="ghost" size="sm" onClick={resetSession}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          )}
        </div>

        {!isStarted ? (
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">Practice Your Communication</h3>
              <p className="text-muted-foreground">Set up a scenario to practice with different people</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Relationship Type</label>
                <Select value={relationshipType} onValueChange={setRelationshipType}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="romantic">Romantic Partner</SelectItem>
                    <SelectItem value="friend">Close Friend</SelectItem>
                    <SelectItem value="coworker">Coworker</SelectItem>
                    <SelectItem value="manager">Manager/Supervisor</SelectItem>
                    <SelectItem value="family">Family Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Response Style</label>
                <Select value={partnerStyle} onValueChange={setPartnerStyle}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supportive">Supportive</SelectItem>
                    <SelectItem value="defensive">Defensive</SelectItem>
                    <SelectItem value="dismissive">Dismissive</SelectItem>
                    <SelectItem value="avoidant">Avoidant</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {partnerStyles[partnerStyle].slice(0, 60)}...
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Describe the Situation</label>
                <Textarea
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="Example: I need to discuss a boundary with my friend about how they've been treating me..."
                  rows={4}
                  className="bg-input border-border text-foreground"
                />
              </div>

              <Button 
                onClick={startRolePlay}
                disabled={!scenario.trim() || isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isLoading ? 'Starting...' : 'Start Role-Play'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground mb-4">
                <strong>Scenario:</strong> {scenario}
                <br />
                <strong>Partner Style:</strong> {partnerStyle}
              </div>

              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'partner' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
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

            <div className="p-4 border-t border-border/20">
              <div className="flex gap-2">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Practice your response..."
                  className="resize-none"
                  rows={2}
                  disabled={isLoading}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!userInput.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRolePlayer;
