# Emotion Tracking & Sentiment Analysis
## Advanced Communication Insights for Couples

This document explains the emotion tracking system implemented in the couple's messaging platform.

---

## Overview

The emotion tracking system provides real-time emotion detection, sentiment analysis, and pattern recognition to help couples understand their communication dynamics better.

---

## Features

### 1. Real-Time Emotion Detection

Every message is automatically analyzed for emotional content:

- **Primary Emotion:** The dominant emotion (joy, love, sadness, anger, etc.)
- **Intensity:** How strong the emotion is (1-10 scale)
- **Secondary Emotions:** Other emotions present in the message
- **Sentiment Score:** Overall positivity/negativity (-1.0 to 1.0)
- **Trigger Words:** Words that indicate specific emotions

### 2. Visual Feedback

**Dynamic Background Colors:**
- Background color changes based on the emotional tone of messages
- Colors transition smoothly for a pleasant experience
- Each emotion has a unique color palette

**Emotion Colors:**
- 😊 Joy: Golden yellow
- ❤️ Love: Vibrant pink
- 😌 Calm: Sky blue
- 😢 Sadness: Deep blue
- 😠 Anger: Intense red
- 😨 Fear: Anxious purple
- 😮 Surprise: Light pink
- 🤢 Disgust: Muted brown
- 🙏 Gratitude: Fresh green
- 🎉 Excitement: Energetic orange-red
- 😐 Neutral: Gray

### 3. Emotion Timeline

**Visual Journey:**
- See your emotional journey through the conversation
- Timeline view with emotion indicators
- Message context for each emotion
- Intensity levels displayed

**Features:**
- Chronological emotion flow
- Color-coded emotion bubbles
- Intensity ratings (1-10)
- Sentiment scores
- Timestamp information

### 4. Emotion Gauge

**Real-Time Emotional Temperature:**
- Circular gauge showing current emotion intensity
- Average intensity tracking
- Sentiment score visualization
- Color-coded display

**Metrics:**
- Current emotion and intensity
- Average intensity over time
- Sentiment trend (positive/negative)
- Visual progress indicators

### 5. Emotion Distribution

**Statistical Overview:**
- Pie chart of emotion distribution
- Percentage breakdown
- Most common emotions
- Total message count

**Insights:**
- Dominant emotion identification
- Emotional diversity
- Communication patterns
- Trend analysis

### 6. Emotion Journal

**Personal Reflection:**
- Log emotions before and after sessions
- Track emotional progress
- Add notes and insights
- Review past entries

**Journal Features:**
- Pre-session emotion recording
- Post-session emotion recording
- Intensity tracking (1-10)
- Personal notes
- Insights and learnings
- Emotional change indicators

### 7. Pattern Recognition

**Automatic Detection:**
- Escalation patterns (negative emotions increasing)
- De-escalation patterns (emotions improving)
- Emotional volatility
- Trigger identification

**Pattern Types:**
- **Escalation:** Negative emotions building up
- **De-escalation:** Emotions improving
- **Volatility:** Rapid emotional changes
- **Triggers:** Specific words/topics causing reactions

---

## How It Works

### Emotion Analysis Process

1. **Message Sent:** User sends a message
2. **AI Analysis:** Message is analyzed by Perplexity AI
3. **Emotion Detection:** Primary and secondary emotions identified
4. **Intensity Calculation:** Emotion strength measured (1-10)
5. **Sentiment Scoring:** Overall sentiment calculated (-1.0 to 1.0)
6. **Database Storage:** Emotion data saved to database
7. **Visual Update:** Background color and UI updated
8. **Pattern Detection:** System checks for emotional patterns

### AI-Powered Analysis

The system uses Perplexity AI for advanced emotion detection:

```javascript
// Example emotion analysis result
{
  primaryEmotion: "joy",
  intensity: 8,
  secondaryEmotions: [
    { emotion: "excitement", intensity: 6 },
    { emotion: "gratitude", intensity: 5 }
  ],
  sentimentScore: 0.85,
  triggerWords: ["happy", "wonderful", "love"],
  emotionalContext: "Expressing happiness and gratitude"
}
```

### Fallback Analysis

If AI is unavailable, the system uses keyword-based analysis:

- Pattern matching for emotion keywords
- Punctuation analysis (!, !!, ...)
- Capitalization detection
- Sentiment word counting

---

## Database Schema

### Tables

**message_emotions:**
- Stores emotion data for each message
- Links to messages table
- Contains primary/secondary emotions
- Tracks intensity and sentiment

**emotion_patterns:**
- Records detected patterns
- Links to sessions and users
- Stores pattern type and severity
- Includes recommendations

**emotion_journal:**
- User journal entries
- Pre/post session emotions
- Personal notes and insights
- Emotional progress tracking

**emotion_statistics:**
- Aggregated emotion data
- Emotion distribution
- Average intensity
- Dominant emotions
- Emotional volatility

**emotion_colors:**
- Emotion-to-color mappings
- Intensity gradients
- Color descriptions

### Automatic Calculations

The system automatically calculates:
- Emotion distribution percentages
- Average intensity levels
- Dominant emotions
- Emotional volatility
- Positive/negative ratios

---

## Using the Emotion Tracking Features

### Viewing Emotion Timeline

1. Navigate to the Emotions tab
2. Select "Timeline" view
3. Scroll through your emotional journey
4. Click on emotions for details

### Checking Emotional Temperature

1. Open the Emotion Gauge
2. View current emotion and intensity
3. Check average intensity
4. Monitor sentiment trends

### Analyzing Distribution

1. Go to Emotion Distribution
2. View pie chart breakdown
3. Check percentages
4. Identify patterns

### Keeping a Journal

1. Open Emotion Journal
2. Click "New Entry"
3. Record pre-session emotion
4. After session, record post-session emotion
5. Add notes and insights
6. Save entry

---

## Interpreting Results

### Emotion Intensity Scale

- **1-3:** Low intensity (mild emotion)
- **4-6:** Moderate intensity (noticeable emotion)
- **7-9:** High intensity (strong emotion)
- **10:** Very high intensity (overwhelming emotion)

### Sentiment Score

- **0.5 to 1.0:** Very positive
- **0.1 to 0.5:** Somewhat positive
- **-0.1 to 0.1:** Neutral
- **-0.5 to -0.1:** Somewhat negative
- **-1.0 to -0.5:** Very negative

### Pattern Severity

- **Level 1-2:** Low concern (normal variation)
- **Level 3:** Moderate concern (worth noting)
- **Level 4-5:** High concern (needs attention)

---

## Best Practices

### For Accurate Emotion Tracking

1. **Be Authentic:** Express genuine emotions
2. **Be Specific:** Use descriptive language
3. **Be Consistent:** Regular communication helps patterns emerge
4. **Review Regularly:** Check insights weekly

### For Better Communication

1. **Notice Patterns:** Pay attention to recurring emotions
2. **Address Triggers:** Work on identified triggers
3. **Celebrate Progress:** Acknowledge positive changes
4. **Seek Balance:** Aim for emotional diversity

### For Personal Growth

1. **Keep a Journal:** Regular journaling helps awareness
2. **Reflect on Insights:** Think about what emotions mean
3. **Set Goals:** Work on emotional regulation
4. **Track Progress:** Monitor improvements over time

---

## Privacy and Security

- All emotion data is stored securely in Supabase
- Row Level Security (RLS) policies protect your data
- Only you can see your emotion data
- Data can be exported or deleted anytime

---

## Technical Details

### API Endpoints

**Emotion Analysis:**
```javascript
POST /api/perplexity
Body: { prompt: "Analyze emotion in: [message]" }
Response: { primaryEmotion, intensity, ... }
```

### Database Functions

**Calculate Statistics:**
```sql
SELECT calculate_emotion_statistics(session_id, user_id);
```

**Detect Patterns:**
```sql
SELECT detect_emotion_pattern(session_id, user_id, message_id);
```

**Get Emotion Color:**
```sql
SELECT get_emotion_color(emotion, intensity);
```

### React Components

- `EmotionTimeline.jsx` - Timeline visualization
- `EmotionGauge.jsx` - Real-time gauge
- `EmotionDistribution.jsx` - Pie chart
- `EmotionJournal.jsx` - Journal interface

### Emotion Analysis Library

Located in `src/lib/emotionAnalysis.js`:
- `analyzeEmotionWithAI()` - AI-powered analysis
- `fallbackEmotionAnalysis()` - Keyword-based analysis
- `getEmotionColor()` - Color calculation
- `detectEmotionPatterns()` - Pattern recognition
- `generateEmotionInsights()` - Insight generation

---

## Troubleshooting

### Emotions Not Being Detected

**Check:**
1. Is AI enabled in settings?
2. Is PPLX_API_KEY configured?
3. Are messages being saved to database?

**Solution:**
- Enable AI emotion analysis in chat settings
- Add Perplexity API key to .env
- Check browser console for errors

### Background Color Not Changing

**Check:**
1. Is emotion analysis enabled?
2. Are emotions being saved?
3. Is the component rendering?

**Solution:**
- Toggle emotion analysis on/off
- Refresh the page
- Check emotion data in database

### Visualizations Not Loading

**Check:**
1. Is database schema applied?
2. Are there messages with emotions?
3. Are there JavaScript errors?

**Solution:**
- Run emotion-tracking-schema.sql
- Send some messages first
- Check browser console

---

## Future Enhancements

Planned features:
- Machine learning for better emotion detection
- Predictive pattern analysis
- Personalized recommendations
- Therapist integration
- Export reports as PDF
- Mobile app with notifications

---

## Support

For questions or issues:
- See `COMPREHENSIVE_DEBUG_REPORT.md`
- Check `QUICK_START.md`
- Open GitHub issue

---

**Emotion tracking helps couples communicate better by providing insights into emotional patterns and communication dynamics. Use it regularly for best results!** 💙