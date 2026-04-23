import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const jsonResponse = (body: Record<string, unknown>, status = 200) => {
  return new Response(
    JSON.stringify(body),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    let body: { text?: string }
    try {
      body = await req.json()
    } catch (_error) {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }

    const { text } = body

    if (!text || text.trim().length === 0) {
      return jsonResponse({ tone: 'calm', confidence: 0.3 })
    }

    const apiKey = Deno.env.get('PPLX_API_KEY')
    if (!apiKey) {
      console.warn('PPLX_API_KEY not configured; returning fallback tone')
      return jsonResponse({
        tone: 'calm',
        confidence: 0.3,
        fallback: true,
        warning: 'AI provider is not configured',
      })
    }

    const prompt = `Analyze the emotional tone of this message and respond with ONLY ONE WORD from this list: calm, reassuring, empathetic, compassionate, cooperative, curious, assertive, passive-aggressive, sarcastic, anxious, impatient, dismissive, judgmental, blaming, confrontational, aggressive, hostile.

Message: "${text}"

Respond with only the single most appropriate tone word, nothing else.`

    const response = await fetch("https://api.perplexity.ai/v1/sonar", {
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
      const errorBody = await response.text()
      console.error('Perplexity API error:', response.status, errorBody)
      return jsonResponse({
        tone: 'calm',
        confidence: 0.3,
        fallback: true,
        warning: `AI provider returned ${response.status}`,
      })
    }

    const data = await response.json()
    const rawTone = data?.choices?.[0]?.message?.content?.trim()?.toLowerCase()
    if (!rawTone) {
      console.error('Perplexity response missing message content:', JSON.stringify(data))
      return jsonResponse({
        tone: 'calm',
        confidence: 0.3,
        fallback: true,
        warning: 'AI provider returned an empty response',
      })
    }

    const tone = rawTone.replace(/[^a-z-]/g, '')

    const validTones = ['calm', 'reassuring', 'empathetic', 'compassionate', 'cooperative', 'curious', 'assertive', 'passive-aggressive', 'sarcastic', 'anxious', 'impatient', 'dismissive', 'judgmental', 'blaming', 'confrontational', 'aggressive', 'hostile']
    const validatedTone = validTones.includes(tone) ? tone : 'calm'

    return jsonResponse({ tone: validatedTone, confidence: 0.9 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Unexpected tone-analyze error:', message)
    return jsonResponse({
      tone: 'calm',
      confidence: 0.3,
      fallback: true,
      warning: 'Unexpected function error',
    })
  }
})
