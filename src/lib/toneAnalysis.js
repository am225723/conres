// Tone Analysis System for Couples Messaging
// Maps emotional tones to specific colors for visual feedback

export const TONE_COLORS = {
  calm: '#AEC6CF',
  reassuring: '#77AADD',
  empathetic: '#66CDAA',
  compassionate: '#98FB98',
  cooperative: '#5DBB63',
  curious: '#FDFD96',
  assertive: '#FFD700',
  'passive-aggressive': '#E09F3E',
  sarcastic: '#DAA520',
  anxious: '#FFA500',
  impatient: '#FF8C00',
  dismissive: '#FF6347',
  judgmental: '#FF4500',
  blaming: '#FF0000',
  confrontational: '#DC143C',
  aggressive: '#B22222',
  hostile: '#8B0000'
};

export const TONE_DESCRIPTIONS = {
  calm: 'Soft, serene',
  reassuring: 'Stable, supportive',
  empathetic: 'Understanding, gentle',
  compassionate: 'Caring, kind',
  cooperative: 'Agreeable, collaborative',
  curious: 'Interested, open',
  assertive: 'Confident, clear',
  'passive-aggressive': 'Indirect, unclear',
  sarcastic: 'Biting, sour',
  anxious: 'Nervous, worried',
  impatient: 'Urgent, restless',
  dismissive: 'Rejecting, disinterested',
  judgmental: 'Critical, accusatory',
  blaming: 'Fault-finding, direct',
  confrontational: 'Challenging, intense',
  aggressive: 'Strong, forceful',
  hostile: 'Dark, threatening'
};

// Get tone color by name
export const getToneColor = (toneName) => {
  if (!toneName) return '#FFFFFF';
  const normalized = toneName.toLowerCase().trim();
  return TONE_COLORS[normalized] || '#FFFFFF';
};

// Get tone description
export const getToneDescription = (toneName) => {
  if (!toneName) return 'Neutral';
  const normalized = toneName.toLowerCase().trim();
  return TONE_DESCRIPTIONS[normalized] || 'Unknown tone';
};

// Analyze text tone locally (fallback when API is unavailable)
export const analyzeToneLocally = (text) => {
  if (!text || text.trim().length === 0) return { tone: 'calm', confidence: 0.3 };

  const lowerText = text.toLowerCase();
  
  // Hostile indicators
  if (/(hate|kill|destroy|die)/i.test(text)) {
    return { tone: 'hostile', confidence: 0.9 };
  }
  
  // Aggressive indicators
  if (/(shut up|stupid|idiot|damn|hell)/i.test(text)) {
    return { tone: 'aggressive', confidence: 0.85 };
  }
  
  // Confrontational indicators
  if (/(what's wrong with you|seriously\?|are you kidding)/i.test(text)) {
    return { tone: 'confrontational', confidence: 0.8 };
  }
  
  // Blaming indicators
  if (/(your fault|you did|you never|you always|you made me)/i.test(text)) {
    return { tone: 'blaming', confidence: 0.85 };
  }
  
  // Judgmental indicators
  if (/(shouldn't|should have|ought to|you're wrong|that's stupid)/i.test(text)) {
    return { tone: 'judgmental', confidence: 0.75 };
  }
  
  // Dismissive indicators
  if (/(whatever|don't care|so what|doesn't matter|fine)/i.test(text)) {
    return { tone: 'dismissive', confidence: 0.7 };
  }
  
  // Impatient indicators
  if (/(hurry|now|quickly|asap|waiting)/i.test(text)) {
    return { tone: 'impatient', confidence: 0.7 };
  }
  
  // Anxious indicators
  if (/(worried|nervous|scared|afraid|anxious|what if)/i.test(text)) {
    return { tone: 'anxious', confidence: 0.75 };
  }
  
  // Sarcastic indicators (harder to detect)
  if (/(yeah right|sure|obviously|great job.*\!)/i.test(text) && text.includes('!')) {
    return { tone: 'sarcastic', confidence: 0.6 };
  }
  
  // Passive-aggressive indicators
  if (/(i'm fine|no problem|if you say so|whatever you want)/i.test(text)) {
    return { tone: 'passive-aggressive', confidence: 0.65 };
  }
  
  // Assertive indicators
  if (/(i need|i want|i believe|i think we should|let's)/i.test(text)) {
    return { tone: 'assertive', confidence: 0.7 };
  }
  
  // Curious indicators
  if (/(how|why|what|when|where|tell me|curious|wonder)/i.test(text) && text.includes('?')) {
    return { tone: 'curious', confidence: 0.75 };
  }
  
  // Cooperative indicators
  if (/(we can|together|let's work|team|collaborate|help)/i.test(text)) {
    return { tone: 'cooperative', confidence: 0.75 };
  }
  
  // Compassionate indicators
  if (/(understand|here for you|support|care about|sorry you)/i.test(text)) {
    return { tone: 'compassionate', confidence: 0.8 };
  }
  
  // Empathetic indicators
  if (/(i hear you|i understand|that must|how you feel|i see)/i.test(text)) {
    return { tone: 'empathetic', confidence: 0.8 };
  }
  
  // Reassuring indicators
  if (/(it's okay|you're doing|everything will|don't worry|i'm here)/i.test(text)) {
    return { tone: 'reassuring', confidence: 0.75 };
  }
  
  // Calm (default for neutral text)
  return { tone: 'calm', confidence: 0.5 };
};

// Debounce utility for real-time analysis
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
