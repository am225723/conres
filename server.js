import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Perplexity API endpoint
app.post('/api/perplexity', async (req, res) => {
  const { PPLX_API_KEY } = process.env;

  if (!PPLX_API_KEY) {
    return res.status(500).json({ error: 'Perplexity API key is not configured.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Bad Request: Missing prompt' });
  }

  const body = {
    model: "sonar",
    messages: [
      { role: "system", content: "You are an expert communication coach." },
      { role: "user", content: prompt },
    ],
    max_tokens: 500,
    temperature: 0.7,
    top_p: 1,
    stream: false,
  };

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PPLX_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API Error:', errorText);
      return res.status(response.status).send(`Perplexity API Error: ${errorText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Tone analysis endpoint
app.post('/api/analyze-tone', async (req, res) => {
  const { PPLX_API_KEY } = process.env;

  if (!PPLX_API_KEY) {
    return res.status(500).json({ error: 'Perplexity API key is not configured.' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Bad Request: Missing text' });
  }

  const prompt = `Analyze the emotional tone of this message and respond with ONLY ONE WORD from this list: calm, reassuring, empathetic, compassionate, cooperative, curious, assertive, passive-aggressive, sarcastic, anxious, impatient, dismissive, judgmental, blaming, confrontational, aggressive, hostile.

Message: "${text}"

Respond with only the single most appropriate tone word, nothing else.`;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PPLX_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "You are a tone analysis expert. Respond with only one word." },
          { role: "user", content: prompt },
        ],
        max_tokens: 50,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API Error:', errorText);
      return res.status(response.status).send(`Perplexity API Error: ${errorText}`);
    }

    const data = await response.json();
    // Strip all non-letter characters and normalize tone response
    const rawTone = data.choices[0].message.content.trim().toLowerCase();
    const tone = rawTone.replace(/[^a-z-]/g, ''); // Keep only letters and hyphens for "passive-aggressive"
    
    // Validate against allowed tones, fallback to 'calm' if invalid
    const validTones = [
      'calm', 'reassuring', 'empathetic', 'compassionate', 'cooperative', 
      'curious', 'assertive', 'passive-aggressive', 'sarcastic', 'anxious', 
      'impatient', 'dismissive', 'judgmental', 'blaming', 'confrontational', 
      'aggressive', 'hostile'
    ];
    const validatedTone = validTones.includes(tone) ? tone : 'calm';
    
    if (!validTones.includes(tone)) {
      console.warn(`Invalid tone received from AI: "${rawTone}", normalized to: "${tone}", using fallback: calm`);
    }
    
    res.status(200).json({ tone: validatedTone });
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// I-Statement generation endpoint
app.post('/api/generate-i-statement', async (req, res) => {
  const { PPLX_API_KEY } = process.env;

  if (!PPLX_API_KEY) {
    return res.status(500).json({ error: 'Perplexity API key is not configured.' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Bad Request: Missing text' });
  }

  const prompt = `Convert this message into a constructive I-Statement format. Use this structure:
"I feel [emotion] when [situation] because [impact]. I would like [request]."

Make it empathetic, non-blaming, and focused on expressing feelings and needs constructively.

Original message: "${text}"

Respond with ONLY the I-Statement, no additional explanation.`;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PPLX_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "You are an expert communication coach. Convert messages to I-Statements." },
          { role: "user", content: prompt },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API Error:', errorText);
      return res.status(response.status).send(`Perplexity API Error: ${errorText}`);
    }

    const data = await response.json();
    const iStatement = data.choices[0].message.content.trim();
    res.status(200).json({ iStatement });
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Voice transcription endpoint
app.post('/api/transcribe-voice', upload.single('audio'), async (req, res) => {
  const { PPLX_API_KEY } = process.env;

  if (!PPLX_API_KEY) {
    return res.status(500).json({ error: 'Perplexity API key is not configured.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  try {
    // NOTE: This is a placeholder implementation
    // In production, integrate with OpenAI Whisper or similar speech-to-text service
    // For now, we simulate transcription with varied responses
    
    const sampleTranscriptions = [
      { text: "Hey, I wanted to talk to you about something that's been on my mind.", tone: "calm" },
      { text: "I feel frustrated when plans change at the last minute.", tone: "assertive" },
      { text: "I really appreciate you listening to me. Thank you.", tone: "empathetic" },
      { text: "Can we talk about this later? I need some time to think.", tone: "anxious" },
      { text: "I love spending time with you. Let's do this more often!", tone: "compassionate" },
    ];
    
    // Use file size or timestamp to pick a sample
    const index = req.file.size % sampleTranscriptions.length;
    const sample = sampleTranscriptions[index];
    
    console.log(`Voice message received (${req.file.size} bytes) - Simulated transcription`);
    
    res.status(200).json({ 
      transcription: sample.text,
      tone: sample.tone,
      note: "Using simulated transcription. Integrate OpenAI Whisper API for production."
    });
  } catch (error) {
    console.error('Error transcribing voice:', error);
    res.status(500).json({ error: 'Failed to transcribe voice message' });
  }
});

// Create session endpoint
app.post('/api/create-session', async (req, res) => {
  try {
    // Import the createSession function from the api file
    const { default: createSessionHandler } = await import('./api/create-session.js');
    return createSessionHandler(req, res);
  } catch (error) {
    console.error('Error in create-session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Serve static files from the dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Perplexity API endpoint: http://localhost:${PORT}/api/perplexity`);
});