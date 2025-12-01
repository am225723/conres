import { analyzeToneLocally, TONE_COLORS } from './toneAnalysis';

const PPLX_API_KEY = import.meta.env.VITE_PPLX_API_KEY;

const callPerplexityAPI = async (messages, maxTokens = 200, temperature = 0.7) => {
  if (!PPLX_API_KEY) {
    throw new Error('Perplexity API key not configured');
  }

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PPLX_API_KEY}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API Error: ${response.status}`);
  }

  return response.json();
};

export const analyzeTone = async (text) => {
  if (!text || text.trim().length === 0) {
    return { tone: 'calm', confidence: 0.3 };
  }

  if (!PPLX_API_KEY) {
    console.log('Using local tone analysis (no API key)');
    return analyzeToneLocally(text);
  }

  try {
    const prompt = `Analyze the emotional tone of this message and respond with ONLY ONE WORD from this list: calm, reassuring, empathetic, compassionate, cooperative, curious, assertive, passive-aggressive, sarcastic, anxious, impatient, dismissive, judgmental, blaming, confrontational, aggressive, hostile.

Message: "${text}"

Respond with only the single most appropriate tone word, nothing else.`;

    const data = await callPerplexityAPI([
      { role: "system", content: "You are a tone analysis expert. Respond with only one word." },
      { role: "user", content: prompt },
    ], 50, 0.3);

    const rawTone = data.choices[0].message.content.trim().toLowerCase();
    const tone = rawTone.replace(/[^a-z-]/g, '');
    
    const validTones = Object.keys(TONE_COLORS);
    const validatedTone = validTones.includes(tone) ? tone : 'calm';
    
    return { tone: validatedTone, confidence: 0.9 };
  } catch (error) {
    console.warn('AI tone analysis failed, using local fallback:', error.message);
    return analyzeToneLocally(text);
  }
};

export const generateIStatement = async (text) => {
  if (!text || text.trim().length === 0) {
    return text;
  }

  if (!PPLX_API_KEY) {
    console.log('Using local I-Statement generation (no API key)');
    return generateIStatementLocally(text);
  }

  try {
    const prompt = `Convert this message into a constructive I-Statement format. Use this structure:
"I feel [emotion] when [situation] because [impact]. I would like [request]."

Make it empathetic, non-blaming, and focused on expressing feelings and needs constructively.

Original message: "${text}"

Respond with ONLY the I-Statement, no additional explanation.`;

    const data = await callPerplexityAPI([
      { role: "system", content: "You are an expert communication coach. Convert messages to I-Statements." },
      { role: "user", content: prompt },
    ], 200, 0.7);

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.warn('AI I-Statement generation failed, using local fallback:', error.message);
    return generateIStatementLocally(text);
  }
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
  if (!PPLX_API_KEY) {
    throw new Error('AI features require API key configuration');
  }

  try {
    const data = await callPerplexityAPI([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ], 500, 0.7);

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI call failed:', error);
    throw error;
  }
};
