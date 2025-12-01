import { analyzeToneLocally, TONE_COLORS } from './toneAnalysis';

export const analyzeTone = async (text) => {
  if (!text || text.trim().length === 0) {
    return { tone: 'calm', confidence: 0.3 };
  }

  return analyzeToneLocally(text);
};

export const generateIStatement = async (text) => {
  if (!text || text.trim().length === 0) {
    return text;
  }

  return generateIStatementLocally(text);
};

export const generateIStatementLocally = (text) => {
  if (!text) return text;
  
  const lowerText = text.toLowerCase();
  
  const youPatterns = [
    { pattern: /you never (.+)/i, emotion: 'disappointed', situation: 'I notice this doesn\'t happen often' },
    { pattern: /you always (.+)/i, emotion: 'overwhelmed', situation: 'this happens frequently' },
    { pattern: /you don't (.+)/i, emotion: 'hurt', situation: 'I feel like my needs aren\'t being met' },
    { pattern: /you make me (.+)/i, emotion: 'frustrated', situation: 'certain situations arise' },
    { pattern: /you should (.+)/i, emotion: 'concerned', situation: 'I think about what could help' },
    { pattern: /why don't you (.+)/i, emotion: 'curious', situation: 'I wonder about alternatives' },
    { pattern: /you're so (.+)/i, emotion: 'affected', situation: 'I observe certain behaviors' },
  ];

  for (const { pattern, emotion, situation } of youPatterns) {
    if (pattern.test(text)) {
      return `I feel ${emotion} when ${situation} because it matters to me. I would appreciate if we could talk about this together.`;
    }
  }

  if (/angry|mad|furious|pissed/i.test(lowerText)) {
    return `I feel frustrated when this situation arises because it affects me deeply. I would like us to find a way to address this together.`;
  }
  
  if (/sad|hurt|disappointed/i.test(lowerText)) {
    return `I feel hurt when I think about this because my emotional well-being is important to me. I would appreciate your understanding and support.`;
  }
  
  if (/worried|anxious|scared/i.test(lowerText)) {
    return `I feel anxious when I consider this situation because I care about our relationship. I would like to discuss this openly with you.`;
  }

  const hasBlaming = /you|your|yourself/i.test(text) && !/I feel|I think|I need|I want/i.test(text);
  
  if (hasBlaming) {
    return `I feel concerned when this topic comes up because it's important to me. I would like to share my perspective and hear yours.`;
  }

  if (!/^I feel/i.test(text)) {
    return `I feel a need to express that ${text.charAt(0).toLowerCase() + text.slice(1).replace(/\.$/, '')}. I would appreciate if we could discuss this.`;
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
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('i-statement') || lowerPrompt.includes('reword')) {
    const messageMatch = prompt.match(/"([^"]+)"/);
    if (messageMatch) {
      return generateIStatementLocally(messageMatch[1]);
    }
  }
  
  if (lowerPrompt.includes('suggest') && lowerPrompt.includes('reply')) {
    return "I hear what you're saying, and I appreciate you sharing that with me. Could you tell me more about how you're feeling?";
  }
  
  if (lowerPrompt.includes('alternative') || lowerPrompt.includes('ways to say')) {
    const messageMatch = prompt.match(/"([^"]+)"/);
    if (messageMatch) {
      const original = messageMatch[1];
      return [
        `I'd like to share my thoughts on ${original.toLowerCase().replace(/\.$/, '')}`,
        `I feel it would help if we talked about ${original.toLowerCase().replace(/\.$/, '')}`,
        `Would you be open to discussing ${original.toLowerCase().replace(/\.$/, '')}?`
      ].join('\n');
    }
  }
  
  if (lowerPrompt.includes('emotion') || lowerPrompt.includes('analyze')) {
    return JSON.stringify({
      primaryEmotion: 'calm',
      intensity: 5,
      secondaryEmotions: [],
      sentimentScore: 0.5,
      triggerWords: [],
      emotionalContext: 'The message appears to express a neutral to positive emotional state.'
    });
  }
  
  return "I understand what you're sharing. It's important to express feelings openly and constructively. Consider using I-statements to communicate your needs while remaining respectful of the other person's perspective.";
};
