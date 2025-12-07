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
        JSON.stringify({ tone: 'calm', confidence: 0.3 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('PPLX_API_KEY')
    if (!apiKey) {
      throw new Error('PPLX_API_KEY not configured')
    }

    const prompt = `Analyze the emotional tone of this message and respond with ONLY ONE WORD from this list: calm, reassuring, empathetic, compassionate, cooperative, curious, assertive, passive-aggressive, sarcastic, anxious, impatient, dismissive, judgmental, blaming, confrontational, aggressive, hostile.

Message: "${text}"

Respond with only the single most appropriate tone word, nothing else.`

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
    })

    if (!response.ok) {
      throw new Error(`Perplexity API Error: ${response.status}`)
    }

    const data = await response.json()
    const rawTone = data.choices[0].message.content.trim().toLowerCase()
    const tone = rawTone.replace(/[^a-z-]/g, '')

    const validTones = ['calm', 'reassuring', 'empathetic', 'compassionate', 'cooperative', 'curious', 'assertive', 'passive-aggressive', 'sarcastic', 'anxious', 'impatient', 'dismissive', 'judgmental', 'blaming', 'confrontational', 'aggressive', 'hostile']
    const validatedTone = validTones.includes(tone) ? tone : 'calm'

    return new Response(
      JSON.stringify({ tone: validatedTone, confidence: 0.9 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message, tone: 'calm', confidence: 0.3 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
