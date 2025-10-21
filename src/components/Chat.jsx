import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
    sendMessage,
    getMessageHistory,
    getSessionParticipants,
    leaveSession,
    supabase
} from '../lib/supabase'; // Corrected import path
import {
    analyzeEmotionWithAI,
    fallbackEmotionAnalysis, // Added fallback import
    // saveEmotionAnalysis, // Removed unused import
    getEmotionColor,
    detectEmotionPatterns // Kept detectEmotionPatterns if used elsewhere or planned
} from '../emotionService.js'; // Ensure this path is correct

import AiModal from './AiModal'; // Assuming AiModal is in the same directory or adjust path

const Chat = ({ session, firmness, userId, nickname, onLeave }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isAiHelping, setIsAiHelping] = useState(false);
    const [realtimeEnabled, setRealtimeEnabled] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalInitialMessage, setModalInitialMessage] = useState('');
    const [chatBackgroundColor, setChatBackgroundColor] = useState('#FFFFFF');
    const [emotionAnalysisEnabled, setEmotionAnalysisEnabled] = useState(true); // Added state for toggling analysis

    const messagesEndRef = useRef(null);
    const channelRef = useRef(null);
    const emotionChannelRef = useRef(null); // Keep if still listening separately for updates, though redundant now
    const pollingIntervalRef = useRef(null);

    // Polling fallback (keep as is)
    const startPolling = () => {
        console.log('🔄 Starting polling fallback for messages');
        setRealtimeEnabled(false);
        if (channelRef.current) channelRef.current.unsubscribe();
        if (emotionChannelRef.current) emotionChannelRef.current.unsubscribe(); // Unsubscribe if still used
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const result = await getMessageHistory(session.id);
                if (result.success) {
                    setMessages(prevMessages => {
                        if (result.messages.length > prevMessages.length || JSON.stringify(result.messages) !== JSON.stringify(prevMessages)) {
                             // Update background based on latest message after polling
                             const lastMsg = result.messages[result.messages.length - 1];
                             if (lastMsg?.tone_analysis) { // Use tone_analysis now
                                setChatBackgroundColor(getEmotionColor(lastMsg.tone_analysis.primaryEmotion, lastMsg.tone_analysis.intensity || 5));
                            }
                            return result.messages;
                        }
                        return prevMessages;
                    });
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 2000);
    };

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    // Load initial data (updated to look at tone_analysis)
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true); // Ensure loading state is true initially
            try {
                const messagesResult = await getMessageHistory(session.id);
                if (messagesResult.success) {
                    setMessages(messagesResult.messages);
                    const lastMsg = messagesResult.messages[messagesResult.messages.length - 1];
                    // Updated check for tone_analysis field
                    if (lastMsg?.tone_analysis?.primaryEmotion) {
                        setChatBackgroundColor(getEmotionColor(lastMsg.tone_analysis.primaryEmotion, lastMsg.tone_analysis.intensity || 5));
                    } else {
                         setChatBackgroundColor('#FFFFFF'); // Default if no analysis found
                    }
                } else {
                     toast.error('Failed to load chat history: ' + (messagesResult.error?.message || 'Unknown error'));
                }

                const participantsResult = await getSessionParticipants(session.id);
                if (participantsResult.success) {
                    setParticipants(participantsResult.participants);
                } else {
                     toast.error('Failed to load participants: ' + (participantsResult.error?.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error loading initial data:', error);
                toast.error('Failed to load initial chat data: ' + error.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [session.id]);

    // Real-time subscription (updated: remove emotionChannel listener, update color on message insert)
    useEffect(() => {
        if (!session?.id) return;

        let realtimeTimeout;
        let subscriptionSuccessful = false;

        // Channel for New Messages and Participant changes
        const messageChannel = supabase.channel(`session-${session.id}`, { // Use a single channel
            config: {
                broadcast: { self: true }
            }
        });

        messageChannel
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${session.id}` },
                (payload) => {
                    console.log('✅ New message received via realtime:', payload);
                    const newMessage = payload.new;

                    setMessages((prev) => {
                        if (prev.find(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                     // Update background color when a new message arrives via realtime
                    if (newMessage.tone_analysis?.primaryEmotion) {
                       setChatBackgroundColor(getEmotionColor(newMessage.tone_analysis.primaryEmotion, newMessage.tone_analysis.intensity || 5));
                    }
                    subscriptionSuccessful = true; // Mark as successful on first message
                     if (realtimeTimeout) clearTimeout(realtimeTimeout); // Clear timeout once successful
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` },
                (payload) => {
                    console.log('✅ New participant joined via realtime:', payload.new);
                    setParticipants((currentParticipants) => {
                         // Avoid adding duplicates if already present
                         if (currentParticipants.find(p => p.id === payload.new.id)) return currentParticipants;
                         return [...currentParticipants, payload.new];
                    });
                    if (payload.new.user_id !== userId) {
                        toast.info(`${payload.new.nickname || 'Someone'} joined the chat`);
                    }
                }
            )
            // Listen for participant updates (e.g., leaving)
             .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` },
                (payload) => {
                    console.log('Participant update:', payload.new);
                     setParticipants(currentParticipants =>
                        currentParticipants.map(p => p.id === payload.new.id ? payload.new : p).filter(p => p.is_active) // Update and filter inactive
                     );
                     // Optionally notify if someone leaves
                     // if (payload.old.is_active && !payload.new.is_active && payload.new.user_id !== userId) {
                     //    toast.info(`${payload.new.nickname || 'Someone'} left the chat.`);
                     // }
                }
            )
            .subscribe((status) => {
                console.log('📡 Realtime subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to real-time updates');
                    // Don't set subscriptionSuccessful here; wait for first message or timeout
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { // Handle TIMED_OUT as well
                    console.error('❌ Real-time subscription failed or timed out');
                     if (realtimeEnabled) { // Only start polling if not already polling
                        toast.error('Real-time connection failed, switching to polling mode');
                        startPolling();
                     }
                } else if (status === 'CLOSED') {
                     console.log('Realtime channel closed.');
                     // Optionally attempt to resubscribe or switch to polling
                }
            });

        // Set timeout to detect if subscription *never* becomes active or receives messages
        realtimeTimeout = setTimeout(() => {
            if (!subscriptionSuccessful) { // Check if we haven't received any message yet
                console.warn('⚠️ Realtime subscription seems inactive, switching to polling');
                if (realtimeEnabled) { // Avoid duplicate toasts/polling starts
                    toast.warning('Real-time unavailable, switching to polling mode');
                    startPolling();
                }
            }
        }, 10000); // Increased timeout to 10 seconds

        channelRef.current = messageChannel;
        // emotionChannelRef.current = null; // No longer needed

        return () => {
            console.log('🧹 Cleaning up subscriptions');
            if (realtimeTimeout) clearTimeout(realtimeTimeout);
            stopPolling();
             if (messageChannel) {
                messageChannel.unsubscribe().catch(err => console.error("Error unsubscribing:", err));
             }
            // No need to unsubscribe emotionChannelRef
        };
    }, [session?.id, userId, realtimeEnabled]); // Added realtimeEnabled dependency

    // Auto-scroll (keep as is)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // *** MODIFIED handleSendMessage ***
    const handleSendMessage = async () => {
        if (!message.trim() || isSending) return;

        setIsSending(true);
        let emotionData = null; // Variable to hold the analysis result

        try {
            // ---> STEP 1: Analyze emotion BEFORE sending <---
            if (emotionAnalysisEnabled) {
                const context = messages.slice(-5).map(m => m.message_text).join('\n'); // Use newline for context
                console.log("Analyzing message:", message, "with context:", context);
                emotionData = await analyzeEmotionWithAI(message, context);
                console.log("AI Analysis result:", emotionData);
            } else {
                emotionData = fallbackEmotionAnalysis(message); // Use fallback if AI disabled
                console.log("Fallback Analysis result:", emotionData);
            }

            // Ensure emotionData is not null/undefined before proceeding
             if (!emotionData || !emotionData.primaryEmotion) {
                 console.warn("Emotion analysis failed or returned invalid data, using fallback.");
                 emotionData = fallbackEmotionAnalysis(message);
            }


            // Add firmness level from the 'firmness' prop (assuming it's like [50])
            const firmnessValue = Array.isArray(firmness) ? firmness[0] : 50; // Default to 50 if prop is not array
            const firmnessLabel = firmnessValue < 40 ? "gentle" : firmnessValue < 70 ? "balanced" : "firm";

             // Combine analysis results into the object to be saved
             const messagePayloadAnalysis = {
                ...emotionData, // Include all fields from analysis
                firmnessLevel: firmnessLabel, // Add the calculated firmness label
                 firmnessValue: firmnessValue, // Optionally store the numeric value
                // impactPreview: emotionData.emotionalContext || "No preview available" // Example: use context as preview
            };


            // ---> STEP 2: Send message WITH the full emotion data <---
            // Pass the combined messagePayloadAnalysis object
            const result = await sendMessage(session.id, userId, message, messagePayloadAnalysis);

            if (result.success && result.message) {
                 // No need to manually add message if using broadcast: { self: true } and realtime works
                 // setMessages(prev => [...prev, result.message]); // Keep if you want instant local update regardless of realtime

                // ---> STEP 3: Update background color immediately <---
                const color = getEmotionColor(emotionData.primaryEmotion, emotionData.intensity || 5);
                setChatBackgroundColor(color);

                setMessage('');
                // setSuggestions([]); // Clear suggestions if you have that state

                // Don't toast success here, let the realtime listener confirm receipt visually? Or keep it for sender feedback.
                // toast.success('Message sent!');

                 // ---> STEP 4: REMOVE the separate saveEmotionAnalysis call <---
                 // It's saved as part of the message now.

            } else {
                console.error("Failed to send message:", result.error);
                toast.error('Failed to send message: ' + (result.error?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending message or analyzing emotion:', error);
            toast.error('Failed to send message: ' + error.message);
            // Consider sending the message without analysis if analysis fails?
            // Or just show error like currently implemented.
        } finally {
            setIsSending(false);
        }
    };
    // *** END OF MODIFIED handleSendMessage ***

    // handleKeyPress (keep as is)
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // suggestReply and rewordAsIStatement (keep as is)
    const suggestReply = () => {
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        if (!lastMessage) {
            toast.info("No message to reply to.");
            return;
        }
        setModalTitle('Suggest a Reply');
        setModalInitialMessage(`Based on the last message: "${lastMessage.message_text}", what kind of reply would you like to send? For example, you could ask for a more empathetic, assertive, or understanding response.`);
        setIsAiHelping(true);
        setIsModalOpen(true);
    };

    const rewordAsIStatement = () => {
        if (!message.trim()) {
            toast.info("Please type a message to reword.");
            return;
        }
        setModalTitle('Reword as I-Statement');
        setModalInitialMessage(`You want to reword this message as an I-statement: "${message}". What is the core feeling or need you want to express?`);
        setIsAiHelping(true);
        setIsModalOpen(true);
    };

     // handleInvitePartner (keep as is)
     const handleInvitePartner = () => {
        const inviteLink = `${window.location.origin}/couples?session=${session.session_code}`; // Assuming '/couples' is the route
        const messageBody = `Join our interactive session: ${inviteLink}`;

        // Attempt clipboard copy first
        navigator.clipboard.writeText(inviteLink).then(() => {
            toast.success('Invite link copied! Share it with your partner.');
            // Optionally try SMS link as fallback or alternative
            // const smsLink = `sms:?body=${encodeURIComponent(messageBody)}`;
            // window.location.href = smsLink;
        }).catch(err => {
            toast.error('Could not copy invite link. Please copy it manually.');
            // Fallback: Show link for manual copying
            prompt("Copy this link and send it to your partner:", inviteLink);
        });
    };


    // handleLeaveSession (keep as is)
    const handleLeaveSession = async () => {
        try {
            await leaveSession(session.id, userId);
            if (channelRef.current) channelRef.current.unsubscribe();
            // No emotionChannelRef to unsubscribe
            stopPolling();
            onLeave(); // Callback to parent component
            toast.info('Left the session');
        } catch (error) {
            console.error('Error leaving session:', error);
            toast.error('Failed to leave session: ' + error.message);
        }
    };

    // Loading state display (keep as is)
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

    // JSX Return
    return (
        <>
            <AiModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setIsAiHelping(false);
                }}
                title={modalTitle}
                initialMessage={modalInitialMessage}
                onInsert={(text) => {
                    setMessage(text);
                    toast.success('Text inserted!');
                    setIsAiHelping(false);
                }}
            />
            {/* Main Chat UI */}
            <div
                className={`flex flex-col h-[calc(100vh-150px)] max-w-2xl mx-auto bg-card rounded-lg shadow-lg ${isModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} // Hide visually instead of removing
                style={{ backgroundColor: chatBackgroundColor, transition: 'background-color 0.8s ease-in-out' }} // Smoother transition
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Session: {session.session_code}</h2>
                        <p className="text-xs text-foreground/60">
                             {/* Display active participants */}
                             {participants.filter(p => p.is_active).length} participant{participants.filter(p => p.is_active).length !== 1 ? 's' : ''} online
                            {!realtimeEnabled && (
                                <span className="ml-2 text-orange-500 font-semibold">• Polling mode</span>
                            )}
                        </p>
                    </div>
                    {/* Header Buttons */}
                     <div className="flex items-center gap-2">
                         {/* Toggle AI Analysis Button */}
                         <button
                            onClick={() => setEmotionAnalysisEnabled(!emotionAnalysisEnabled)}
                            title={emotionAnalysisEnabled ? "Disable AI Emotion Analysis" : "Enable AI Emotion Analysis"}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                emotionAnalysisEnabled
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                         >
                            AI: {emotionAnalysisEnabled ? 'On' : 'Off'}
                        </button>
                        <button onClick={handleInvitePartner} className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            Invite Partner
                        </button>
                        <button onClick={handleLeaveSession} className="bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            Leave
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-foreground/50 mt-8">
                            <p>No messages yet. Start the conversation!</p>
                             {!realtimeEnabled && (
                                <p className="text-xs mt-1 text-orange-500">Real-time connection failed. Using polling mode.</p>
                            )}
                        </div>
                    ) : (
                        messages.map((msg) => { // Removed index, use msg.id
                            // Ensure msg and msg.user_id exist before proceeding
                             if (!msg || !msg.user_id) {
                                console.warn("Skipping rendering invalid message:", msg);
                                return null; // Skip rendering this message
                            }
                            const isOwnMessage = msg.user_id === userId;
                            // Find participant based on user_id
                            const participant = participants.find(p => p.user_id === msg.user_id);
                            // Use nickname from participant if found, fallback logic
                            const displayName = participant?.nickname || (isOwnMessage ? (nickname || 'You') : 'Partner');

                             // Get analysis data safely
                             const analysis = msg.tone_analysis; // Data is now directly in tone_analysis
                             const primaryEmotion = analysis?.primaryEmotion;
                             const intensity = analysis?.intensity || analysis?.emotion_intensity; // Allow for both keys
                             const firmnessLevel = analysis?.firmnessLevel || msg.firmness_level; // Use analysis first, fallback to message root

                             // Determine border based on firmnessLevel
                             const firmnessBorder =
                                firmnessLevel === 'gentle' ? 'border-l-4 border-green-500' :
                                firmnessLevel === 'balanced' ? 'border-l-4 border-blue-500' :
                                firmnessLevel === 'firm' ? 'border-l-4 border-red-500' : '';

                            return (
                                <div key={msg.id} className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-lg shadow-sm ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} ${firmnessBorder}`}>
                                        <p className="font-semibold text-sm mb-1 opacity-90">{displayName}</p>
                                        <p className="whitespace-pre-wrap break-words">{msg.message_text || ''}</p>

                                         {/* Display emotion analysis if available */}
                                         {primaryEmotion && (
                                            <p className={`text-xs mt-2 ${isOwnMessage ? 'opacity-80' : 'opacity-60'} italic`}>
                                                 Emotion: {primaryEmotion}
                                                 {intensity ? ` (${intensity}/10)` : ''}
                                            </p>
                                        )}

                                        <p className={`text-xs mt-1 ${isOwnMessage ? 'opacity-70' : 'opacity-50'} text-right`}>
                                             {/* Safer date formatting */}
                                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} /> {/* For auto-scrolling */}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-muted/30">
                    <div className="flex gap-2 mb-2">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="flex-grow bg-input border border-border text-foreground placeholder:text-muted-foreground p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-inner"
                            rows={2} // Keep rows fixed or make dynamic
                            disabled={isSending}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!message.trim() || isSending}
                            className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]" // Ensure button size consistency
                        >
                             {isSending ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                             ) : (
                                'Send'
                            )}
                        </button>
                    </div>

                     {/* AI Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={suggestReply}
                            disabled={isAiHelping || isLoading || messages.length === 0} // Disable if loading or no messages
                            className="flex-1 bg-background hover:bg-muted/80 border border-border text-foreground py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Suggest Reply
                        </button>
                        <button
                            onClick={rewordAsIStatement}
                            disabled={isAiHelping || isLoading || !message.trim()} // Disable if loading or no message typed
                            className="flex-1 bg-background hover:bg-muted/80 border border-border text-foreground py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Reword Message
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Chat;
