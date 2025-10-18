import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

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