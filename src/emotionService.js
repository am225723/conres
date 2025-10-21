/**
* Emotion Analysis Service
* Integrates with Perplexity AI for advanced emotion detection and sentiment analysis
*/

// Emotion categories and their characteristics
export const EMOTIONS = {
  joy: { color: '#FFD700', intensity: [1, 10], category: 'positive' },
  love: { color: '#FF69B4', intensity: [1, 10], category: 'positive' },
  excitement: { color: '#FF6347', intensity: [1, 10], category: 'positive' },
  gratitude: { color: '#98FB98', intensity: [1, 10], category: 'positive' },
  calm: { color: '#87CEEB', intensity: [1, 10], category: 'positive' },
  sadness: { color: '#4682B4', intensity: [1, 10], category: 'negative' },
  anger: { color: '#DC143C', intensity: [1, 10], category: 'negative' },
  fear: { color: '#9370DB', intensity: [1, 10], category: 'negative' },
  surprise: { color: '#FFB6C1', intensity: [1, 10], category: 'neutral' },
  disgust: { color: '#8B7355', intensity: [1, 10], category: 'negative' },
  neutral: { color: '#D3D3D3', intensity: [1, 10], category: 'neutral' }
};

/**
* Analyze emotion using AI
* @param {string} messageText - The message to analyze
* @param {string} context - Optional context from previous messages
* @returns {Promise<Object>} Emotion analysis result
*/
export async function analyzeEmotionWithAI(messageText, context = '') {
  try {
    const prompt = `Analyze the emotional content of this message and provide a detailed emotion analysis.

Message: "${messageText}"
${context ? `Context: ${context}` : ''}

Please respond with a JSON object containing:
1. primaryEmotion: The main emotion (joy, love, excitement, gratitude, calm, sadness, anger, fear, surprise, disgust, or neutral)
2. intensity: A number from 1-10 indicating the strength of the emotion
3. secondaryEmotions: An array of other emotions present with their intensities (e.g., [{"emotion": "fear", "intensity": 3}])
4. sentimentScore: A number from -1.0 (very negative) to 1.0 (very positive)
5. triggerWords: An array of words that indicate the emotion
6. emotionalContext: A brief explanation of the emotional state

Format your response as valid JSON only, no additional text.`;

    const response = await fetch('/api/perplexity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;

    // Robust JSON parsing
    let emotionData;
    try {
      // First, try to parse the whole string directly
      emotionData = JSON.parse(content);
    } catch (e1) {
      // If that fails, try to extract it from a markdown block or find the object
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/); // Find the first { to the last }
        if (jsonMatch) {
          emotionData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON object found in AI response");
        }
      } catch (e2) {
        console.warn('Failed to parse AI response, using fallback.', { content, e2 });
        return fallbackEmotionAnalysis(messageText);
      }
    }

    return {
      primaryEmotion: emotionData.primaryEmotion || 'neutral',
      intensity: Math.min(10, Math.max(1, emotionData.intensity || 5)),
      secondaryEmotions: emotionData.secondaryEmotions || [],
      sentimentScore: Math.min(1, Math.max(-1, emotionData.sentimentScore || 0)),
      triggerWords: emotionData.triggerWords || [],
      emotionalContext: emotionData.emotionalContext || ''
    };
  } catch (error) {
    console.error('Error in AI emotion analysis:', error);
    return fallbackEmotionAnalysis(messageText);
  }
}

/**
* Fallback emotion analysis using keyword matching
* @param {string} messageText - The message to analyze
* @returns {Object} Basic emotion analysis
*/
export function fallbackEmotionAnalysis(messageText) {
  const text = messageText.toLowerCase();

  // Emotion keyword patterns
  const patterns = {
    joy: /happy|joy|excited|wonderful|great|amazing|love it|fantastic|delighted/i,
    love: /love|adore|cherish|treasure|affection|care about|mean everything/i,
    excitement: /excited|thrilled|can't wait|pumped|eager|enthusiastic/i,
    gratitude: /thank|grateful|appreciate|thankful|blessed/i,
    calm: /calm|peaceful|relaxed|serene|tranquil|content/i,
    sadness: /sad|unhappy|depressed|down|miserable|heartbroken|disappointed/i,
    anger: /angry|mad|furious|irritated|annoyed|frustrated|pissed/i,
    fear: /afraid|scared|worried|anxious|nervous|terrified|frightened/i,
    surprise: /surprised|shocked|amazed|astonished|unexpected/i,
    disgust: /disgusted|gross|revolting|sick of|hate/i
  };

  // Find matching emotions
  const matches = [];
  for (const [emotion, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      matches.push(emotion);
    }
  }

  // Determine primary emotion
  const primaryEmotion = matches.length > 0 ? matches[0] : 'neutral';

  // Calculate intensity based on punctuation and caps
  let intensity = 5;
  if (text.includes('!')) intensity += 2;
  if (text.includes('!!')) intensity += 2;
  if (text === text.toUpperCase() && text.length > 3) intensity += 2;
  intensity = Math.min(10, intensity);

  // Calculate sentiment score
  const positiveWords = (text.match(/good|great|love|happy|wonderful|amazing|excellent/g) || []).length;
  const negativeWords = (text.match(/bad|hate|terrible|awful|horrible|sad|angry/g) || []).length;
  const sentimentScore = Math.max(-1, Math.min(1, (positiveWords - negativeWords) / 5));

  return {
    primaryEmotion,
    intensity,
    secondaryEmotions: matches.slice(1).map(e => ({ emotion: e, intensity: intensity - 2 })),
    sentimentScore,
    triggerWords: matches,
    emotionalContext: `Detected ${primaryEmotion} with ${intensity}/10 intensity`
  };
}

/**
* Get background color based on emotion and intensity
* @param {string} emotion - The emotion name
* @param {number} intensity - Intensity from 1-10
* @returns {string} Hex color code
*/
export function getEmotionColor(emotion, intensity = 5) {
  const emotionData = EMOTIONS[emotion] || EMOTIONS.neutral;
  const baseColor = emotionData.color;

  // Adjust color brightness based on intensity
  const factor = intensity / 10;
  return adjustColorIntensity(baseColor, factor);
}

/**
* Adjust color intensity
* @param {string} hexColor - Base hex color
* @param {number} factor - Intensity factor (0-1)
* @returns {string} Adjusted hex color
*/
function adjustColorIntensity(hexColor, factor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Adjust brightness
  const adjust = (value) => {
    // We adjust towards the middle grey (128) for low intensity, and full color for high intensity
    // This makes low intensity colors less saturated and "greyer"
    const mid = 128;
    const adjusted = Math.round(mid + (value - mid) * factor);
    return Math.min(255, Math.max(0, adjusted));
  };

  // Convert back to hex
  const toHex = (value) => value.toString(16).padStart(2, '0');
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

/**
* Detect emotion patterns in message history
* @param {Array} messages - Array of messages with emotion data
* @returns {Object} Pattern analysis
*/
export function detectEmotionPatterns(messages) {
  if (messages.length < 3) {
    return { patterns: [], insights: [] };
  }

  const patterns = [];
  const recentEmotions = messages.slice(-5).map(m => m.emotion_analysis?.primaryEmotion || 'neutral');

  // Check for escalation (negative emotions increasing)
  const negativeEmotions = ['anger', 'fear', 'sadness', 'disgust'];
  const recentNegative = recentEmotions.filter(e => negativeEmotions.includes(e));

  if (recentNegative.length >= 3) {
    patterns.push({
      type: 'escalation',
      description: 'Negative emotions are escalating',
      severity: 4,
      recommendation: 'Consider taking a break or using calming techniques'
    });
  }

  // Check for de-escalation (moving from negative to positive)
  const positiveEmotions = ['joy', 'love', 'gratitude', 'calm'];
  if (recentEmotions.length >= 2 &&
    negativeEmotions.includes(recentEmotions[recentEmotions.length - 2]) &&
    positiveEmotions.includes(recentEmotions[recentEmotions.length - 1])) {
    patterns.push({
      type: 'de-escalation',
      description: 'Emotions are improving',
      severity: 2,
      recommendation: 'Great progress! Continue with constructive communication'
    });
  }

  // Check for emotional volatility
  const uniqueEmotions = new Set(recentEmotions);
  if (uniqueEmotions.size >= 4) {
    patterns.push({
      type: 'volatility',
      description: 'Emotions are changing rapidly',
      severity: 3,
      recommendation: 'Try to maintain emotional stability and focus'
    });
  }

  return { patterns, insights: patterns.map(p => p.recommendation) };
}

/**
* Generate emotion-based insights
* @param {Object} emotionStats - Emotion statistics for a user
* @returns {Array} Array of insights
*/
export function generateEmotionInsights(emotionStats) {
  // ... (implementation unchanged)
  return [];
}

/**
* Save emotion analysis to database
* @param {string} messageId - The message ID
* @param {Object} emotionData - Emotion analysis data
* @param {Object} supabase - Supabase client
* @returns {Promise<Object>} Result of the save operation
*/
export async function saveEmotionAnalysis(messageId, emotionData, supabase) {
  try {
    const { data, error } = await supabase
      .from('message_emotions')
      .insert([{
        message_id: messageId,
        primary_emotion: emotionData.primaryEmotion,
        emotion_intensity: emotionData.intensity,
        secondary_emotions: emotionData.secondaryEmotions,
        sentiment_score: emotionData.sentimentScore,
        trigger_words: emotionData.triggerWords,
        emotional_context: emotionData.emotionalContext
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving emotion analysis:', error);
    return { success: false, error: error.message };
  }
}
