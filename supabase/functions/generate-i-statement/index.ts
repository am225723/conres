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

const buildFallbackIStatement = (text?: string, prompt?: string) => {
  const input = (text || prompt || '').trim()

  if (!input) {
    return ''
  }

  const lowerInput = input.toLowerCase()

  if (lowerInput.includes('you never')) {
    return "I feel disappointed when this does not happen, because it is something I value in our relationship. I would like us to talk about how we can make this happen more often."
  }

  if (lowerInput.includes('you always')) {
    return "I feel overwhelmed when this keeps happening, because it affects how connected and heard I feel. I would like us to find a calmer way to handle this together."
  }

  if (lowerInput.includes("you don't") || lowerInput.includes('you do not')) {
    return "I feel hurt when I do not see this need being considered, because it makes me feel less supported. I would like us to talk about what could work better for both of us."
  }

  if (/angry|mad|furious|pissed|frustrated/i.test(input)) {
    return "I feel frustrated about what happened, because it is affecting me deeply. I would like us to slow down and talk through this together."
  }

  if (/sad|hurt|disappointed/i.test(input)) {
    return "I feel hurt about what happened, because my feelings matter to me. I would like some understanding and support right now."
  }

  if (/worried|anxious|scared/i.test(input)) {
    return "I feel anxious about this situation, because I care about our relationship. I would like us to talk openly about what is on my mind."
  }

  return "I feel affected by this situation, because it matters to me and I want us to understand each other. I would like us to talk about it calmly and find a way forward together."
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    let body: { text?: string; prompt?: string; systemPrompt?: string }
    try {
      body = await req.json()
    } catch (_error) {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }

    const { text, prompt: directPrompt, systemPrompt: customSystemPrompt } = body

    if (!text && !directPrompt) {
      return jsonResponse({ iStatement: '' })
    }

    const apiKey = Deno.env.get('PPLX_API_KEY')
    if (!apiKey) {
      console.warn('PPLX_API_KEY not configured; returning local fallback I-Statement')
      return jsonResponse({
        iStatement: buildFallbackIStatement(text, directPrompt),
        fallback: true,
        warning: 'AI provider is not configured',
      })
    }

    const systemContent = customSystemPrompt || "You are an expert communication coach. Convert messages to I-Statements."

    let userContent: string
    if (directPrompt) {
      userContent = directPrompt
    } else {
      userContent = `Convert this message into a constructive I-Statement format. Use this structure:
"I feel [emotion] when [situation] because [impact]. I would like [request]."

Make it empathetic, non-blaming, and focused on expressing feelings and needs constructively.

Original message: "${text}"

Respond with ONLY the I-Statement, no additional explanation.`
    }

    const response = await fetch("https://api.perplexity.ai/v1/sonar", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Perplexity API error:', response.status, errorBody)
      return jsonResponse({
        iStatement: buildFallbackIStatement(text, directPrompt),
        fallback: true,
        warning: `AI provider returned ${response.status}`,
      })
    }

    const data = await response.json()
    const iStatement = data?.choices?.[0]?.message?.content?.trim()

    if (!iStatement) {
      console.error('Perplexity response missing message content:', JSON.stringify(data))
      return jsonResponse({
        iStatement: buildFallbackIStatement(text, directPrompt),
        fallback: true,
        warning: 'AI provider returned an empty response',
      })
    }

    return jsonResponse({ iStatement })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Unexpected generate-i-statement error:', message)
    return jsonResponse({
      iStatement: buildFallbackIStatement(),
      fallback: true,
      warning: 'Unexpected function error',
    })
  }
})
