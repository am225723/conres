import fetch from 'node-fetch';

export default async function handler(req, res) {
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
    model: "pplx-7b-chat",
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
}