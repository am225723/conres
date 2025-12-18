import { supabase } from './supabase';
import { TONE_COLORS } from './toneAnalysis';

export const analyzeTone = async (text) => {
  if (!text || text.trim().length === 0) {
    return { tone: 'Waiting', confidence: 0 };
  }

  try {
    const { data, error } = await supabase.functions.invoke('tone-analyze', {
      body: { text }
    });

    if (error) {
      console.warn('Edge function error:', error.message);
      return { tone: 'Waiting', confidence: 0 };
    }

    if (data.error) {
      console.warn('AI tone analysis failed:', data.error);
      return { tone: 'Waiting', confidence: 0 };
    }

    return { tone: data.tone, confidence: data.confidence || 0.9 };
  } catch (error) {
    console.warn('AI tone analysis failed:', error.message);
    return { tone: 'Waiting', confidence: 0 };
  }
};

export const generateIStatement = async (text) => {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const { data, error } = await supabase.functions.invoke('generate-i-statement', {
    body: { text }
  });

  if (error) {
    throw new Error(`I-Statement generation failed: ${error.message}`);
  }

  if (data.error) {
    throw new Error(`I-Statement generation failed: ${data.error}`);
  }

  return data.iStatement;
};

export const generateIStatementLocally = (text) => {
  if (!text) return text;
  
  const lowerText = text.toLowerCase();
  
  const youPatterns = [
    { pattern: /you never (.+)/i, extract: (m) => m[1], emotion: 'disappointed', template: (action) => `I feel disappointed when ${action} doesn't happen, because it's something I value in our relationship. Could we find a way to make this happen more often?` },
    { pattern: /you always (.+)/i, extract: (m) => m[1], emotion: 'overwhelmed', template: (action) => `I feel overwhelmed when ${action} happens repeatedly. I need some understanding here. Can we talk about finding a better balance?` },
    { pattern: /you don't (.+)/i, extract: (m) => m[1], emotion: 'hurt', template: (action) => `I feel hurt when I don't see ${action}, because it makes me feel like my needs aren't being considered. I'd really appreciate it if we could work on this together.` },
    { pattern: /you make me (.+)/i, extract: (m) => m[1], emotion: 'frustrated', template: (feeling) => `I feel ${feeling} in certain situations, and I'd like to understand what's happening between us. Can we talk about this?` },
    { pattern: /you should (.+)/i, extract: (m) => m[1], emotion: 'concerned', template: (action) => `I feel concerned about this situation. I think ${action} might help, but I'd love to hear your thoughts too.` },
    { pattern: /why don't you (.+)/i, extract: (m) => m[1], emotion: 'curious', template: (action) => `I'm curious about why ${action} hasn't happened. I'd like to understand your perspective better.` },
    { pattern: /you're so (.+)/i, extract: (m) => m[1], emotion: 'affected', template: (trait) => `I feel affected when I notice ${trait} in our interactions. I care about us, and I'd like to talk about how we can communicate better.` },
  ];

  for (const { pattern, extract, template } of youPatterns) {
    const match = text.match(pattern);
    if (match) {
      const extracted = extract(match);
      return template(extracted);
    }
  }

  if (/angry|mad|furious|pissed/i.test(lowerText)) {
    return `I'm feeling really frustrated right now. This situation is affecting me deeply, and I need us to work through it together. Can we take a moment and talk about what's happening?`;
  }
  
  if (/sad|hurt|disappointed/i.test(lowerText)) {
    return `I'm feeling hurt about what happened. My feelings matter to me, and I'd really appreciate your understanding and support right now.`;
  }
  
  if (/worried|anxious|scared/i.test(lowerText)) {
    return `I'm feeling anxious about this situation because I care deeply about our relationship. I'd like to talk openly about what's on my mind.`;
  }

  const hasBlaming = /you|your|yourself/i.test(text) && !/I feel|I think|I need|I want/i.test(text);
  
  if (hasBlaming) {
    return `I have some thoughts I'd like to share with you. This matters to me, and I want to hear your perspective too. Can we have an open conversation about this?`;
  }

  if (!/^I feel/i.test(text)) {
    const cleanedText = text.charAt(0).toLowerCase() + text.slice(1).replace(/\.$/, '');
    return `I want to share something with you: ${cleanedText}. I'd appreciate it if we could talk about this together.`;
  }

  return text;
};

export const transcribeVoice = async (audioBlob) => {
  const sampleTranscriptions = [
    { text: "Hey, I wanted to talk to you about something that's been on my mind.", tone: "calm" },
    { text: "I feel frustrated when plans change at the last minute.", tone: "assertive" },
    { text: "I really appreciate you listening to me. Thank you.", tone: "empathetic" },
    { text: "Can we talk about this later? I need some time to think.", tone: "anxious" },
    { text: "I love spending time with you. Let's do this more often!", tone: "compassionate" },
  ];
  
  const index = audioBlob.size % sampleTranscriptions.length;
  const sample = sampleTranscriptions[index];
  
  return { 
    transcription: sample.text,
    tone: sample.tone,
    note: "Using simulated transcription. Integrate speech-to-text API for production."
  };
};

export const callAI = async (prompt, systemPrompt = "You are an expert communication coach.") => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-i-statement', {
      body: { text: prompt }
    });

    if (error || data.error) {
      throw new Error(error?.message || data.error);
    }

    return data.iStatement;
  } catch (error) {
    console.error('AI call failed:', error);
    throw error;
  }
};
