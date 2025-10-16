const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const { PPLX_API_KEY } = process.env;

  if (!PPLX_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Perplexity API key is not configured.' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { prompt } = JSON.parse(event.body);

  if (!prompt) {
    return { statusCode: 400, body: 'Bad Request: Missing prompt' };
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
      return { statusCode: response.status, body: `Perplexity API Error: ${errorText}` };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};