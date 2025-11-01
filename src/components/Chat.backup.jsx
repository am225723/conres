import React, { useState, useEffect, useRef, useMemo } from 'react'; // Added useMemo
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
    // saveEmotionAnalysis, // REMOVED unused import
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
    // Removed emotionChannelRef
    const pollingIntervalRef = useRef(null);

    // *** ADDED: Calculate impact preview ***
    const impactPreview = useMemo(() => {
        if (!message) return "—"; // Return baseline if no message

        // Basic check for blaming language ("you" followed by negative/absolute terms)
        const isAccusatory = /\byou\b(?!.*I feel)/i.test(message) && /never|always|should|fault|blame/i.test(message);

        // Get firmness value safely
        const firmnessValue = Array.isArray(firmness) && firmness.length > 0 ? firmness[0] : 50; // Default to 50 if invalid

        // Determine firmness label
        const firmnessLabel = firmnessValue < 40 ? "gentle" : firmnessValue < 70 ? "balanced" : "firm";

        // Construct the preview string
        return `Tone reads ${firmnessLabel}. ${
            isAccusatory
                ? "May sound blaming — try focusing on 'I feel' + a specific request."
                : "Likely to be received constructively."
        }`;
    }, [message, firmness]);
    // *** END ADDITION ***

    // Polling fallback (keep as is)
    const startPolling = () => {
        console.log('🔄 Starting polling fallback for messages');
        setRealtimeEnabled(false);
        if (channelRef.current) channelRef.current.unsubscribe().catch(err => console.error("Error unsubscribing polling:", err));
        // Removed emotionChannelRef unsubscribe
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const result = await getMessageHistory(session.id);
                if (result.success) {
                    setMessages(prevMessages => {
                         // More robust check: compare lengths or stringify for changes
                        if (result.messages.length !== prevMessages.length || JSON.stringify(result.messages) !== JSON.stringify(prevMessages)) {
                             // Update background based on latest message after polling
                             const lastMsg = result.messages[result.messages.length - 1];
                             if (lastMsg?.tone_analysis?.primaryEmotion) { // Check nested property safely
                                setChatBackgroundColor(getEmotionColor(lastMsg.tone_analysis.primaryEmotion, lastMsg.tone_analysis.intensity || 5));
                            }
                            return result.messages;
                        }
                        return prevMessages;
                    });
                }
            } catch (error) {
                console.error('Polling error:', error);
                 // Maybe add a toast here if polling fails repeatedly
            }
        }, 2500); // Poll every 2.5 seconds
    };

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            console.log("Polling stopped.");
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
                    const lastMsg = messagesResult.messages.length > 0 ? messagesResult.messages[messagesResult.messages.length - 1] : null;
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
                     // Ensure participants are active ones initially
                    setParticipants(participantsResult.participants.filter(p => p.is_active));
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
         // Cleanup function for component unmount
        return () => {
            stopPolling(); // Stop polling if component unmounts
             if (channelRef.current) {
                channelRef.current.unsubscribe().catch(err => console.error("Error unsubscribing on unmount:", err));
            }
        };
    }, [session.id]); // Only re-run if session.id changes

    // Real-time subscription (updated: remove emotionChannel listener, update color on message insert)
    useEffect(() => {
        // Guard against running if session.id is not yet available or if polling is active
        if (!session?.id || !realtimeEnabled) {
            // If realtime was previously enabled but now disabled (polling started), unsubscribe
             if (!realtimeEnabled && channelRef.current) {
                 console.log("Unsubscribing from realtime due to polling activation.");
                 channelRef.current.unsubscribe().catch(err => console.error("Error unsubscribing for polling:", err));
                 channelRef.current = null; // Clear ref
            }
            return;
        }

        let realtimeTimeout;
        let subscriptionSuccessful = false;
        console.log(`Attempting to subscribe to channel: session-${session.id}`);

        // Channel for New Messages and Participant changes
        const messageChannel = supabase.channel(`session-${session.id}`, { // Use a single channel for the session
            config: {
                broadcast: { ack: true, self: true } // Request ack and enable self-broadcast
            }
        });

        messageChannel
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${session.id}` },
                (payload) => {
                     // Check if ack indicates it's our own message we just sent
                     // This helps prevent double-adding if local update is also used
                     // Note: Supabase ack might not work exactly like this, adjust if needed
                    const isOwnEcho = payload.commit_timestamp === payload.sent_at; // Example heuristic

                    console.log(`✅ New message received via realtime (ownEcho=${isOwnEcho}):`, payload.new.id);
                    const newMessage = payload.new;

                    setMessages((prev) => {
                        // Prevent adding duplicates
                        if (prev.find(m => m.id === newMessage.id)) {
                             console.log("Duplicate message prevented:", newMessage.id);
                            return prev;
                        }
                        console.log("Adding new message via realtime:", newMessage.id);
                        return [...prev, newMessage];
                    });
                     // Update background color when a new message arrives via realtime
                    if (newMessage.tone_analysis?.primaryEmotion) {
                       setChatBackgroundColor(getEmotionColor(newMessage.tone_analysis.primaryEmotion, newMessage.tone_analysis.intensity || 5));
                    }
                    subscriptionSuccessful = true; // Mark as successful on first payload
                     if (realtimeTimeout) clearTimeout(realtimeTimeout); // Clear timeout once successful
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` },
                (payload) => {
                    console.log('✅ New participant joined via realtime:', payload.new.id);
                    setParticipants((currentParticipants) => {
                         // Avoid adding duplicates
                         if (currentParticipants.find(p => p.id === payload.new.id)) return currentParticipants;
                         return [...currentParticipants, payload.new];
                    });
                    if (payload.new.user_id !== userId) {
                        toast.info(`${payload.new.nickname || 'Someone'} joined the chat`);
                    }
                }
            )
             .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` },
                (payload) => {
                    console.log('Participant update received:', payload.new.id, 'Active:', payload.new.is_active);
                     setParticipants(currentParticipants =>
                        currentParticipants
                            .map(p => p.id === payload.new.id ? payload.new : p) // Update the participant
                            .filter(p => p.is_active) // Keep only active participants in the list
                     );
                     // Notify if someone else leaves
                     if (payload.old.is_active && !payload.new.is_active && payload.new.user_id !== userId) {
                        toast.info(`${payload.new.nickname || 'Someone'} left the chat.`);
                     }
                }
            )
            .subscribe((status, err) => { // Updated to include error object
                console.log('📡 Realtime subscription status:', status);
                 if (err) {
                    console.error('❌ Realtime subscription error:', err);
                 }

                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to real-time updates');
                    // We now wait for a message or timeout to confirm it's truly working
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('❌ Realtime subscription failed or timed out');
                     if (realtimeEnabled) { // Only start polling if not already polling
                        toast.error('Real-time connection failed, switching to polling mode');
                        startPolling(); // Switch to polling
                    }
                } else if (status === 'CLOSED') {
                     console.log('Realtime channel closed.');
                     // Optionally attempt to resubscribe or switch to polling if not already polling
                     if (realtimeEnabled) {
                        console.warn("Realtime closed unexpectedly, switching to polling.");
                        toast.warn("Connection lost, switching to backup mode.");
                        startPolling();
                    }
                }
            });

        // Set timeout to detect if subscription *never* receives a confirmation or message
        realtimeTimeout = setTimeout(() => {
            if (!subscriptionSuccessful) { // If no message received after 10s
                console.warn('⚠️ Realtime subscription seems inactive (no messages received), switching to polling');
                if (realtimeEnabled) { // Avoid duplicate actions
                    toast.warning('Real-time connection unstable, switching to backup mode.');
                    startPolling();
                }
            }
        }, 10000); // 10 second timeout

        channelRef.current = messageChannel; // Store the channel reference

        // Cleanup function for this effect run
        return () => {
            console.log('🧹 Cleaning up realtime effect...');
            if (realtimeTimeout) clearTimeout(realtimeTimeout);
             if (messageChannel) {
                console.log(`Unsubscribing from channel: ${messageChannel.topic}`);
                messageChannel.unsubscribe().catch(err => console.error("Error unsubscribing channel:", err));
            }
            channelRef.current = null; // Clear ref on cleanup
        };
    // Re-run effect if session.id changes OR if realtimeEnabled changes (to potentially re-subscribe)
    }, [session?.id, userId, realtimeEnabled]);

    // Auto-scroll (keep as is)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]); // Trigger scroll whenever messages state updates

    // *** MODIFIED handleSendMessage ***
    const handleSendMessage = async () => {
        if (!message.trim() || isSending) return;

        setIsSending(true);
        let emotionData = null; // Variable to hold the analysis result

        try {
            // ---> STEP 1: Analyze emotion BEFORE sending <---
            if (emotionAnalysisEnabled) {
                const context = messages.slice(-5).map(m => `${m.user_id === userId ? 'Me' : 'Partner'}: ${m.message_text}`).join('\n'); // Add speaker context
                console.log("Analyzing message:", message, "with context:", context);
                emotionData = await analyzeEmotionWithAI(message, context);
                console.log("AI Analysis result:", emotionData);
            } else {
                emotionData = fallbackEmotionAnalysis(message); // Use fallback if AI disabled
                console.log("Fallback Analysis result:", emotionData);
            }

            // Ensure emotionData is valid, use fallback if necessary
             if (!emotionData || typeof emotionData !== 'object' || !emotionData.primaryEmotion) {
                 console.warn("Emotion analysis returned invalid data, using fallback.", emotionData);
                 emotionData = fallbackEmotionAnalysis(message);
            }

            // Add firmness level from the 'firmness' prop
            const firmnessValue = Array.isArray(firmness) ? firmness[0] : 50; // Default to 50
            const firmnessLabel = firmnessValue < 40 ? "gentle" : firmnessValue < 70 ? "balanced" : "firm";

             // Combine analysis results into the object to be saved in `tone_analysis`
             const messagePayloadAnalysis = {
                primaryEmotion: emotionData.primaryEmotion,
                intensity: emotionData.intensity,
                secondaryEmotions: emotionData.secondaryEmotions || [],
                sentimentScore: emotionData.sentimentScore,
                triggerWords: emotionData.triggerWords || [],
                emotionalContext: emotionData.emotionalContext || '',
                firmnessLevel: firmnessLabel, // Add the calculated firmness label
                 firmnessValue: firmnessValue, // Optionally store the numeric value too
                 // Use the calculated impactPreview state here
                 impactPreview: impactPreview,
            };

            // ---> STEP 2: Send message WITH the full emotion data <---
            console.log("Sending message with analysis:", messagePayloadAnalysis);
            const result = await sendMessage(session.id, userId, message, messagePayloadAnalysis);

            if (result.success && result.message) {
                 console.log("Message sent successfully, ID:", result.message.id);
                // ---> ADD THIS BACK for immediate local update <---
                setMessages(prev => {
                    // Prevent adding duplicates if realtime also adds it quickly
                    if (prev.find(m => m.id === result.message.id)) {
                        console.log("Local update skipped, message already present:", result.message.id);
                        return prev;
                    }
                     console.log("Adding message locally:", result.message.id);
                    return [...prev, result.message];
                });
                // ---> END ADDITION <---

                // ---> STEP 3: Update background color immediately <---
                const color = getEmotionColor(emotionData.primaryEmotion, emotionData.intensity || 5);
                setChatBackgroundColor(color);

                setMessage(''); // Clear the input box

                // No separate saveEmotionAnalysis needed

            } else {
                console.error("Failed to send message via Supabase:", result.error);
                toast.error('Failed to send message: ' + (result.error?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            toast.error('An error occurred: ' + error.message);
        } finally {
            setIsSending(false);
        }
    };
// *** END OF MODIFIED handleSendMessage ***

    // handleKeyPress (keep as is)
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent newline
            handleSendMessage(); // Trigger send
        }
    };

    // suggestReply and rewordAsIStatement (keep as is)
     const suggestReply = () => {
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        if (!lastMessage || lastMessage.user_id === userId) { // Don't suggest reply to own message
            toast.info("Select a message from your partner to get a reply suggestion.");
            return;
        }
        setModalTitle('Suggest a Reply');
        setModalInitialMessage(`Based on your partner's last message: "${lastMessage.message_text}", how would you like to respond? (e.g., empathetically, assertively, seeking clarification)`);
        setIsAiHelping(true);
        setIsModalOpen(true);
    };

    const rewordAsIStatement = () => {
        if (!message.trim()) {
            toast.info("Please type a message first to reword it.");
            return;
        }
        setModalTitle('Reword as I-Statement');
        setModalInitialMessage(`Let's reword this: "${message}". What is the core feeling (e.g., hurt, frustrated, happy) and the specific situation causing it?`);
        setIsAiHelping(true);
        setIsModalOpen(true);
    };

     // handleInvitePartner (keep as is)
     const handleInvitePartner = () => {
        const inviteLink = `${window.location.origin}${window.location.pathname}?session=${session.session_code}`; // Use current path
        const messageBody = `Join our private chat session: ${inviteLink}`;

        navigator.clipboard.writeText(inviteLink).then(() => {
            toast.success('Invite link copied! Send it to your partner.');
        }).catch(err => {
            toast.error('Could not copy link. Please copy it manually.');
            prompt("Copy this link:", inviteLink); // Fallback
        });
    };


    // handleLeaveSession (keep as is)
    const handleLeaveSession = async () => {
        const confirmLeave = window.confirm("Are you sure you want to leave this session?");
        if (!confirmLeave) return;

        try {
            await leaveSession(session.id, userId);
            stopPolling(); // Stop polling if active
             if (channelRef.current) { // Ensure channel exists before unsubscribing
                 channelRef.current.unsubscribe().catch(err => console.error("Error unsubscribing on leave:", err));
                 channelRef.current = null; // Clear ref
            }
            onLeave(); // Callback to parent
            toast.info('You have left the session.');
        } catch (error) {
            console.error('Error leaving session:', error);
            toast.error('Failed to leave session: ' + error.message);
        }
    };

    // Loading state display (keep as is)
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-150px)]">
                {/* ... loading spinner ... */}
                 <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-foreground/70">Loading chat history...</p>
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
                    setMessage(text); // Put suggested text into input box
                    toast.success('Suggestion inserted!');
                    setIsAiHelping(false);
                }}
            />
            {/* Main Chat UI */}
            <div
                // Use `key` to force re-render if session changes, helps reset state
                key={session.id}
                className={`flex flex-col h-[calc(100vh-150px)] max-w-2xl mx-auto bg-card rounded-lg shadow-2xl overflow-hidden border border-border/10 ${isModalOpen ? 'filter blur-sm pointer-events-none' : ''}`} // Blur background when modal is open
                style={{ backgroundColor: chatBackgroundColor, transition: 'background-color 0.8s ease-in-out' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-r from-background to-muted/30 shadow-sm sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
                           Session: <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-primary">{session.session_code}</span>
                        </h2>
                        <p className="text-xs text-foreground/60 flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${realtimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></span>
                             {participants.filter(p => p.is_active).length} participant{participants.filter(p => p.is_active).length !== 1 ? 's' : ''} online
                            {!realtimeEnabled && (
                                <span className="ml-2 text-orange-600 font-medium">• Polling</span>
                            )}
                        </p>
                    </div>
                     {/* Header Buttons */}
                     <div className="flex items-center gap-2 flex-shrink-0">
                         {/* Toggle AI Analysis Button */}
                         <button
                            onClick={() => setEmotionAnalysisEnabled(!emotionAnalysisEnabled)}
                            title={emotionAnalysisEnabled ? "Disable AI Emotion Analysis (uses simple keywords)" : "Enable AI Emotion Analysis (more accurate)"}
                            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border ${
                                emotionAnalysisEnabled
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                            }`}
                         >
                            AI: {emotionAnalysisEnabled ? 'ON' : 'OFF'}
                        </button>
                        <button onClick={handleInvitePartner} className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-md text-xs font-medium transition-colors hidden sm:inline-block">
                            Invite
                        </button>
                        <button onClick={handleLeaveSession} className="bg-destructive/10 hover:bg-destructive/20 text-destructive px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
                            Leave
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-grow p-4 overflow-y-auto space-y-3 scroll-smooth"> {/* Added scroll-smooth */}
                    {messages.length === 0 ? (
                        <div className="text-center text-foreground/50 mt-10 px-4">
                            <p className="font-medium">This is the beginning of your chat session.</p>
                            <p className="text-sm mt-1">Send a message to get started!</p>
                             {!realtimeEnabled && (
                                <p className="text-xs mt-4 p-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-md">Real-time connection failed. Using backup polling mode (updates every few seconds).</p>
                            )}
                        </div>
                    ) : (
                        messages.map((msg) => {
                             if (!msg || !msg.id || !msg.user_id) return null; // Added check for msg.id

                            const isOwnMessage = msg.user_id === userId;
                            const participant = participants.find(p => p.user_id === msg.user_id);
                            const displayName = participant?.nickname || (isOwnMessage ? (nickname || 'You') : 'Partner');

                             const analysis = msg.tone_analysis;
                             const primaryEmotion = analysis?.primaryEmotion;
                             const intensity = analysis?.intensity || analysis?.emotion_intensity;
                             const firmnessLevel = analysis?.firmnessLevel || msg.firmness_level;

                             const firmnessBorder =
                                firmnessLevel === 'gentle' ? 'border-l-4 border-green-400' :
                                firmnessLevel === 'balanced' ? 'border-l-4 border-blue-400' :
                                firmnessLevel === 'firm' ? 'border-l-4 border-red-400' : '';

                            return (
                                <div key={msg.id} className={`flex flex-col ${isOwnMessage ? 'items-end pl-10' : 'items-start pr-10'}`}> {/* Added padding */}
                                    <div className={`relative max-w-[85%] p-3 rounded-lg shadow-sm ${isOwnMessage ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-foreground rounded-bl-none'} ${firmnessBorder}`}> {/* Added rounded corners exception */}
                                        <p className="font-semibold text-sm mb-1 opacity-90">{displayName}</p>
                                        <p className="whitespace-pre-wrap break-words text-base">{msg.message_text || ''}</p>

                                         {primaryEmotion && (
                                            <p className={`text-xs mt-1.5 ${isOwnMessage ? 'opacity-80' : 'opacity-60'} italic`}>
                                                 {primaryEmotion}
                                                 {intensity ? ` (${intensity}/10)` : ''}
                                            </p>
                                        )}

                                        <p className={`text-xs mt-1 ${isOwnMessage ? 'opacity-70' : 'opacity-50'} text-right`}>
                                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} /> {/* For auto-scrolling */}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-border bg-gradient-to-r from-background to-muted/30">
                     {/* *** ADDED: Impact Preview Display *** */}
                     <div className="mb-1.5 px-1 text-xs text-foreground/60 truncate">
                        {impactPreview}
                     </div>
                     {/* *** END ADDITION *** */}
                    <div className="flex gap-2 mb-1.5">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="flex-grow bg-input border border-border text-foreground placeholder:text-muted-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80 resize-none shadow-inner text-base" // Adjusted padding/font
                            rows={1} // Start with 1 row, let it expand? Or keep fixed?
                            disabled={isSending}
                            style={{ maxHeight: '100px', overflowY: 'auto' }} // Limit height
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!message.trim() || isSending}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[70px] aspect-square" // Square button-like
                        >
                             {isSending ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                             ) : (
                                // Simple Send Icon (example using SVG or text)
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            )}
                        </button>
                    </div>

                     {/* AI Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={suggestReply}
                            disabled={isAiHelping || isLoading || messages.length === 0 || messages[messages.length-1]?.user_id === userId} // Also disable if last msg is own
                            className="flex-1 bg-background hover:bg-muted/80 border border-border text-foreground py-1.5 px-3 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                             title="Suggest a reply to the last message from your partner"
                        >
                            Suggest Reply
                        </button>
                        <button
                            onClick={rewordAsIStatement}
                            disabled={isAiHelping || isLoading || !message.trim()}
                            className="flex-1 bg-background hover:bg-muted/80 border border-border text-foreground py-1.5 px-3 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                             title="Reword your typed message as an I-Statement"
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
