import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Send, UserPlus, LogOut, Sparkles } from 'lucide-react';
import {
    sendMessage,
    getMessageHistory,
    getSessionParticipants,
    leaveSession,
    supabase
} from '../lib/supabase';
import { getToneColor, debounce } from '../lib/toneAnalysis';
import { analyzeTone, generateIStatement, transcribeVoice } from '../lib/aiService';
import IStatementModal from './IStatementModal';
import { CoolDownTimer } from './CoolDownTimer';
import { VoiceRecorder } from './VoiceRecorder';

const ChatEnhanced = ({ session, userId, nickname, onLeave }) => {
    // State management
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [realtimeEnabled, setRealtimeEnabled] = useState(true);
    
    // Tone analysis states
    const [currentTone, setCurrentTone] = useState('calm');
    const [inputBoxColor, setInputBoxColor] = useState('#FFFFFF');
    const [chatBackgroundColor, setChatBackgroundColor] = useState('#FFFFFF');
    
    // I-Statement modal states
    const [showIStatementModal, setShowIStatementModal] = useState(false);
    const [generatedIStatement, setGeneratedIStatement] = useState('');
    const [isGeneratingIStatement, setIsGeneratingIStatement] = useState(false);
    const [pendingMessage, setPendingMessage] = useState('');
    
    // Cool-down timer state
    const [showCoolDown, setShowCoolDown] = useState(false);
    
    const messagesEndRef = useRef(null);
    const channelRef = useRef(null);
    const pollingIntervalRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Polling fallback for realtime
    const startPolling = useCallback(() => {
        console.log('🔄 Starting polling fallback');
        setRealtimeEnabled(false);
        
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
        
        pollingIntervalRef.current = setInterval(async () => {
            try {
                const result = await getMessageHistory(session.id);
                if (result.success && result.messages.length > messages.length) {
                    setMessages(result.messages);
                    
                    // Update background based on last message tone
                    const lastMsg = result.messages[result.messages.length - 1];
                    if (lastMsg?.tone_analysis?.tone) {
                        const bgColor = getToneColor(lastMsg.tone_analysis.tone);
                        setChatBackgroundColor(bgColor);
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 2500);
    }, [session.id, messages.length]);

    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const messagesResult = await getMessageHistory(session.id);
                if (messagesResult.success) {
                    setMessages(messagesResult.messages);
                    
                    // Set initial background color from last message
                    const lastMsg = messagesResult.messages[messagesResult.messages.length - 1];
                    if (lastMsg?.tone_analysis?.tone) {
                        setChatBackgroundColor(getToneColor(lastMsg.tone_analysis.tone));
                    }
                }

                const participantsResult = await getSessionParticipants(session.id);
                if (participantsResult.success) {
                    setParticipants(participantsResult.participants.filter(p => p.is_active));
                }
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load chat data');
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
        
        return () => {
            stopPolling();
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
        };
    }, [session.id, stopPolling]);

    // Real-time subscription
    useEffect(() => {
        if (!session?.id || !realtimeEnabled) return;

        let subscriptionTimeout;
        let hasReceivedMessage = false;

        const channel = supabase.channel(`session-${session.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${session.id}` },
                (payload) => {
                    hasReceivedMessage = true;
                    const newMessage = payload.new;
                    
                    setMessages((prev) => {
                        if (prev.find(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                    
                    // Update background color
                    if (newMessage.tone_analysis?.tone) {
                        setChatBackgroundColor(getToneColor(newMessage.tone_analysis.tone));
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` },
                (payload) => {
                    setParticipants((current) => {
                        if (current.find(p => p.id === payload.new.id)) return current;
                        return [...current, payload.new];
                    });
                    if (payload.new.user_id !== userId) {
                        toast.info(`${payload.new.nickname || 'Someone'} joined`);
                    }
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    toast.error('Connection failed, switching to backup mode');
                    startPolling();
                }
            });

        // Fallback timeout
        subscriptionTimeout = setTimeout(() => {
            if (!hasReceivedMessage) {
                console.warn('No realtime messages, switching to polling');
                startPolling();
            }
        }, 10000);

        channelRef.current = channel;

        return () => {
            clearTimeout(subscriptionTimeout);
            if (channel) channel.unsubscribe();
        };
    }, [session?.id, userId, realtimeEnabled, startPolling]);

    // Real-time tone analysis as user types
    const analyzeToneRealtime = useCallback(
        debounce(async (text) => {
            if (!text || text.trim().length === 0) {
                setCurrentTone('calm');
                setInputBoxColor('#FFFFFF');
                return;
            }

            try {
                const result = await analyzeTone(text);
                setCurrentTone(result.tone);
                setInputBoxColor(getToneColor(result.tone));
            } catch (error) {
                console.error('Tone analysis error:', error);
                setCurrentTone('calm');
                setInputBoxColor('#FFFFFF');
            }
        }, 500),
        []
    );

    // Handle message input change
    const handleMessageChange = (e) => {
        const newMessage = e.target.value;
        setMessage(newMessage);
        analyzeToneRealtime(newMessage);
    };

    // Generate I-Statement
    const handleGenerateIStatement = async (text) => {
        setIsGeneratingIStatement(true);
        try {
            const iStatement = await generateIStatement(text);
            setGeneratedIStatement(iStatement);
        } catch (error) {
            console.error('I-Statement generation error:', error);
            toast.error('Could not generate I-Statement. Using your original message instead.');
            setGeneratedIStatement(text);
        } finally {
            setIsGeneratingIStatement(false);
        }
    };

    // Handle send button click - show modal
    const handleSendClick = async () => {
        if (!message.trim() || isSending) return;

        setPendingMessage(message);
        setShowIStatementModal(true);
        await handleGenerateIStatement(message);
    };

    // Cool-down handlers
    const handleCoolDownDismiss = () => {
        setShowCoolDown(false);
    };

    const handleSendSpaceMessage = async () => {
        setShowCoolDown(false);
        await sendMessageWithTone("I need some space right now. Let's take a break and come back to this when we're both calmer. 💙", 'calm');
    };

    // Voice message handler
    const handleVoiceMessage = async (transcription, tone) => {
        await sendMessageWithTone(transcription, tone);
    };

    // Actually send the message with tone analysis
    const sendMessageWithTone = async (messageText, tone) => {
        setIsSending(true);
        try {
            const toneAnalysis = {
                tone: tone || currentTone,
                timestamp: new Date().toISOString(),
                confidence: 0.8
            };

            const result = await sendMessage(
                session.id,
                userId,
                messageText,
                toneAnalysis
            );

            if (result.success) {
                setMessages(prev => {
                    if (prev.find(m => m.id === result.message.id)) return prev;
                    return [...prev, result.message];
                });

                // Update background color
                const bgColor = getToneColor(tone || currentTone);
                setChatBackgroundColor(bgColor);

                // Check for cool-down trigger (hostile tones)
                const hostileTones = ['confrontational', 'aggressive', 'hostile'];
                if (hostileTones.includes(tone || currentTone)) {
                    const recentMessages = [...messages, result.message].slice(-5);
                    const hostileCount = recentMessages.filter(m => 
                        hostileTones.includes(m.tone_analysis?.tone)
                    ).length;
                    
                    if (hostileCount >= 2) {
                        setShowCoolDown(true);
                    }
                }

                setMessage('');
                setInputBoxColor('#FFFFFF');
                setCurrentTone('calm');
                toast.success('Message sent!');
            } else {
                toast.error('Failed to send message');
            }
        } catch (error) {
            console.error('Send error:', error);
            toast.error('Error sending message');
        } finally {
            setIsSending(false);
            setShowIStatementModal(false);
        }
    };

    // Send original message
    const handleSendOriginal = async () => {
        await sendMessageWithTone(pendingMessage, currentTone);
    };

    // Send I-Statement version
    const handleSendIStatement = async () => {
        await sendMessageWithTone(generatedIStatement, 'empathetic');
    };

    // Close modal
    const handleCloseModal = () => {
        setShowIStatementModal(false);
        setPendingMessage('');
        setGeneratedIStatement('');
    };

    // Handle Enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendClick();
        }
    };

    // Invite partner
    const handleInvitePartner = () => {
        // Create a direct link to this session using the session code
        const inviteLink = `${window.location.origin}/couples/${session.session_code}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            toast.success('🔗 Invite link copied to clipboard!');
        }).catch(() => {
            toast.error('Could not copy link');
        });
    };

    // Leave session
    const handleLeaveSession = async () => {
        if (!confirm('Leave this session?')) return;

        try {
            await leaveSession(session.id, userId);
            stopPolling();
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
            onLeave();
            toast.info('You left the session');
        } catch (error) {
            console.error('Leave error:', error);
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
            {/* I-Statement Modal */}
            <CoolDownTimer
                isActive={showCoolDown}
                onDismiss={handleCoolDownDismiss}
                onSendSpaceMessage={handleSendSpaceMessage}
            />
            
            <IStatementModal
                isOpen={showIStatementModal}
                onClose={handleCloseModal}
                originalMessage={pendingMessage}
                iStatement={generatedIStatement}
                onSendOriginal={handleSendOriginal}
                onSendIStatement={handleSendIStatement}
                isLoading={isGeneratingIStatement}
            />

            {/* Main Chat Container */}
            <div
                className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto rounded-2xl shadow-2xl overflow-hidden border border-border/10 transition-all duration-700 ease-in-out"
                style={{ backgroundColor: chatBackgroundColor }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-border/20 shadow-sm">
                    <div>
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <span className="text-2xl">💬</span>
                            Session: <span className="font-mono text-primary">{session.session_code}</span>
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            {participants.length} participant{participants.length !== 1 ? 's' : ''} • {!realtimeEnabled && '🔄 Backup mode'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleInvitePartner}
                            className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all hover:scale-105 active:scale-95"
                            title="Invite Partner"
                        >
                            <UserPlus className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleLeaveSession}
                            className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all hover:scale-105 active:scale-95"
                            title="Leave Session"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <Sparkles className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Start your conversation</p>
                            <p className="text-sm mt-2">Messages will appear here with real-time tone analysis</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isOwnMessage = msg.user_id === userId;
                            const tone = msg.tone_analysis?.tone || 'calm';
                            const toneColor = getToneColor(tone);
                            const participant = participants.find(p => p.user_id === msg.user_id);
                            const senderName = participant?.nickname || (isOwnMessage ? 'You' : 'Partner');

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                        <span className="text-xs font-medium text-foreground/60 px-2">
                                            {senderName}
                                        </span>
                                        <div
                                            className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] ${
                                                isOwnMessage
                                                    ? 'rounded-tr-sm bg-white/90 dark:bg-gray-800/90'
                                                    : 'rounded-tl-sm bg-white/95 dark:bg-gray-700/95'
                                            }`}
                                            style={{
                                                borderColor: toneColor,
                                                borderWidth: '2px'
                                            }}
                                        >
                                            <p className="text-foreground whitespace-pre-wrap break-words">{msg.message_text}</p>
                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                                                <span
                                                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                    style={{
                                                        backgroundColor: `${toneColor}40`,
                                                        color: toneColor
                                                    }}
                                                >
                                                    {tone}
                                                </span>
                                                <span className="text-xs text-muted-foreground ml-auto">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-border/20">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1 relative">
                            {currentTone && message.trim() && (
                                <div 
                                    className="absolute -top-10 left-0 px-4 py-2 rounded-lg text-sm font-semibold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 border-2"
                                    style={{
                                        backgroundColor: inputBoxColor === '#FFFFFF' ? '#f0f0f0' : inputBoxColor,
                                        color: inputBoxColor === '#FFFFFF' ? '#333' : '#fff',
                                        borderColor: inputBoxColor,
                                        textShadow: inputBoxColor !== '#FFFFFF' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                                    }}
                                >
                                    Tone: {currentTone.charAt(0).toUpperCase() + currentTone.slice(1)}
                                </div>
                            )}
                            <textarea
                                value={message}
                                onChange={handleMessageChange}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message... (tone analysis active)"
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                                style={{
                                    borderColor: inputBoxColor,
                                    boxShadow: message.trim() ? `0 0 20px ${inputBoxColor}40` : 'none'
                                }}
                                disabled={isSending}
                            />
                        </div>
                        <div className="flex gap-2">
                            <VoiceRecorder 
                                onSendVoiceMessage={handleVoiceMessage}
                                disabled={isSending}
                            />
                            <button
                                onClick={handleSendClick}
                                disabled={!message.trim() || isSending}
                                className="p-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                            >
                                {isSending ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Press Enter to send • Shift+Enter for new line
                    </p>
                </div>
            </div>
        </>
    );
};

export default ChatEnhanced;
