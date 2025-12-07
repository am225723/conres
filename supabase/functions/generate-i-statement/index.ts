import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ iStatement: text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('PPLX_API_KEY')
    if (!apiKey) {
      throw new Error('PPLX_API_KEY not configured')
    }

    const prompt = `Convert this message into a constructive I-Statement format. Use this structure:
"I feel [emotion] when [situation] because [impact]. I would like [request]."

Make it empathetic, non-blaming, and focused on expressing feelings and needs constructively.

Original message: "${text}"

Respond with ONLY the I-Statement, no additional explanation.`

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
    })

    if (!response.ok) {
      throw new Error(`Perplexity API Error: ${response.status}`)
    }

    const data = await response.json()
    const iStatement = data.choices[0].message.content.trim()

    return new Response(
      JSON.stringify({ iStatement }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
