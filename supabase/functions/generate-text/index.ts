import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || ''

function normalizeModelName(model?: string): string {
  let m = (model || 'gemini-1.5-pro').trim()
  if (m === 'gemini-pro') m = 'gemini-1.5-pro'
  if (m === 'gemini-3prev') m = 'gemini-3-pro'
  if (m.endsWith('-latest')) m = m.replace('-latest', '')
  if (m === 'gemini-2.0-flash-exp') m = 'gemini-1.5-pro'
  return m
}

async function callGemini(
  version: 'v1' | 'v1beta',
  model: string,
  prompt: string,
  systemPrompt?: string,
  temperature?: number,
  maxOutputTokens?: number,
  partsInput?: unknown[],
) {
  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`
  const baseParts = Array.isArray(partsInput) && partsInput.length > 0
    ? partsInput
    : [{ text: prompt }]
  const requestParts = (systemPrompt && systemPrompt.trim().length > 0)
    ? [{ text: `SYSTEM:\n${systemPrompt}` }, ...baseParts]
    : baseParts
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: requestParts }],
    generationConfig: {
      temperature: typeof temperature === 'number' ? temperature : 0.4,
      maxOutputTokens: typeof maxOutputTokens === 'number' ? maxOutputTokens : 4096,
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    if (res.status === 403 && txt.includes('CONSUMER_SUSPENDED')) {
      throw new Error(`Gemini ${version} ${res.status}: API key suspended. Please update GEMINI_API_KEY in Supabase secrets.`)
    }
    throw new Error(`Gemini ${version} ${res.status}: ${txt}`)
  }

  const data = await res.json()
  const responseParts: unknown[] = Array.isArray(data?.candidates?.[0]?.content?.parts)
    ? data.candidates[0].content.parts
    : []
  const textParts = responseParts
    .map((p) => (p as { text?: unknown })?.text)
    .filter((t): t is string => typeof t === 'string' && t.length > 0)
  const content = textParts.join('\n').trim()
  return content
}

async function listModels(version: 'v1' | 'v1beta'): Promise<string[]> {
  const url = `https://generativelanguage.googleapis.com/${version}/models?key=${GEMINI_API_KEY}`
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) {
    return []
  }
  const data = await res.json().catch(() => ({}))
  const models: string[] = Array.isArray((data as { models?: unknown }).models)
    ? ((data as { models: unknown[] }).models
        .map((m) => (m as { name?: unknown })?.name)
        .filter((n): n is string => typeof n === 'string')
        .map((name) => name.replace(`${version}/models/`, '').replace(`models/`, '')))
    : []
  return models
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY is not configured in Supabase secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = await req.json().catch(() => ({}))
    const prompt: string = (payload.prompt || '').trim()
    const systemPrompt: string | undefined = (payload.system_prompt || payload.systemPrompt || '').trim()
    const modelReq: string = payload.model || ''
    const temperature: number | undefined = typeof payload.temperature === 'number' ? payload.temperature : undefined
    const maxOutputTokens: number | undefined = typeof payload.maxOutputTokens === 'number' ? payload.maxOutputTokens : undefined
    const partsInput: unknown[] | undefined = Array.isArray(payload.parts) ? payload.parts : undefined

    if (!prompt && (!partsInput || partsInput.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Version-aware model selection and fallback
    const firstModel = normalizeModelName(modelReq)
    const baseCandidates = [firstModel, 'gemini-1.5-pro', 'gemini-1.5-flash']
    const deduped = Array.from(new Set(baseCandidates.filter((m) => m && m.trim().length > 0)))
    const availableV1 = await listModels('v1')
    const availableV1beta = await listModels('v1beta')
    const isInV1 = (m: string) => availableV1.includes(m)
    const isInV1beta = (m: string) => availableV1beta.includes(m)
    const filteredCandidates = deduped.filter((m) => {
      // If we couldn't list models (empty arrays), don't filter away anything
      if (availableV1.length === 0 && availableV1beta.length === 0) return true
      return isInV1(m) || isInV1beta(m)
    })

    let lastError = ''
    const attempts: Array<{ model: string; apiVersion: 'v1' | 'v1beta'; error: string }> = []
    for (const m of filteredCandidates) {
      // Choose best API version order for this model
      const order: Array<'v1' | 'v1beta'> =
        isInV1(m) && isInV1beta(m) ? ['v1', 'v1beta']
        : isInV1(m) ? ['v1']
        : isInV1beta(m) ? ['v1beta', 'v1']
        : ['v1', 'v1beta']
      for (const ver of order) {
        try {
          const content = await callGemini(ver, m, prompt, systemPrompt, temperature, maxOutputTokens, partsInput)
          return new Response(
            JSON.stringify({ content, model: m, apiVersionTried: ver }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e)
          attempts.push({ model: m, apiVersion: ver, error: errMsg })
          lastError = errMsg
        }
      }
    }

    return new Response(
      JSON.stringify({ error: lastError || 'Text generation failed for all candidates', attempts }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: message || 'Unhandled error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
