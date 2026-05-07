import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || 'start')
    const type = String(body.type || 'video')
    const prompt = String(body.prompt || '')
    const operationName = String(body.operationName || '')
    const maxWaitMs = Number(body.maxWaitMs ?? 20000)
    const pollIntervalMs = Number(body.pollIntervalMs ?? 2000)
    const model = String(body.model || 'veo-3.1-generate-preview')

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'image') {
      if (!prompt) {
        return new Response(
          JSON.stringify({ error: 'Prompt is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const models: string[] = Array.isArray(body.models) && body.models.length > 0
        ? body.models
        : ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image', 'imagen-3.0-generate-001', 'imagen-3.0-fast-001']
      const tryEndpoints = async (m: string) => {
        if (m.startsWith('gemini')) {
          for (const base of ['v1', 'v1beta'] as const) {
            const url = `https://generativelanguage.googleapis.com/${base}/models/${m}:generateContent?key=${GEMINI_API_KEY}`
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.4 }
              })
            })
            if (res.ok) {
              const data = await res.json()
              const parts = data?.candidates?.[0]?.content?.parts || []
              let imageBase64 = ''
              for (const p of parts) {
                const inlineData = p?.inlineData || p?.inline_data
                if (inlineData?.data) {
                  imageBase64 = inlineData.data
                  break
                }
              }
              if (imageBase64) return { imageBase64, model: m }
            }
          }
        } else {
          for (const base of ['v1', 'v1beta'] as const) {
            const url = `https://generativelanguage.googleapis.com/${base}/models/${m}:predict?key=${GEMINI_API_KEY}`
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                instances: [{ prompt }],
                parameters: { sampleCount: 1, aspectRatio: body.aspectRatio || '16:9' }
              })
            })
            if (res.ok) {
              const data = await res.json()
              const pred = data?.predictions?.[0]
              const b64 = pred?.bytesBase64Encoded || pred?.imageBase64 || ''
              if (b64) return { imageBase64: b64, model: m }
            }
          }
        }
        return null
      }
      for (const m of models) {
        const out = await tryEndpoints(m)
        if (out) {
          return new Response(
            JSON.stringify({ imageBase64: out.imageBase64, model: out.model }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
      return new Response(
        JSON.stringify({ error: 'All models failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'start') {
      if (!prompt) {
        return new Response(
          JSON.stringify({ error: 'Prompt is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const startUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:predictLongRunning?key=${GEMINI_API_KEY}`
      const startRes = await fetch(startUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      })

      if (!startRes.ok) {
        const errTxt = await startRes.text()
        return new Response(
          JSON.stringify({ error: 'Start failed', details: errTxt }),
          { status: startRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const startData = await startRes.json()
      const opName = startData.name || startData.operation?.name || ''
      if (!opName) {
        return new Response(
          JSON.stringify({ error: 'No operation name returned', details: startData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ operationName: opName }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'status') {
      if (!operationName) {
        return new Response(
          JSON.stringify({ error: 'operationName is required for status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const opUrl = `https://generativelanguage.googleapis.com/v1/operations/${operationName}?key=${GEMINI_API_KEY}`
      const endTime = Date.now() + Math.max(1000, maxWaitMs)
      let finalData: any = null

      while (Date.now() < endTime) {
        const res = await fetch(opUrl, { method: 'GET' })
        if (!res.ok) {
          const txt = await res.text()
          return new Response(
            JSON.stringify({ error: 'Status check failed', details: txt }),
            { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        const data = await res.json()
        if (data.done) {
          finalData = data
          break
        }
        await sleep(Math.max(500, pollIntervalMs))
      }

      if (!finalData) {
        return new Response(
          JSON.stringify({ done: false, operationName }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const response = finalData.response || {}
      const candidates = response.candidates || []
      const parts = candidates[0]?.content?.parts || []

      let videoUrl = ''
      for (const p of parts) {
        if (p?.fileData?.uri) {
          videoUrl = p.fileData.uri
          break
        }
        if (p?.videoData?.uri) {
          videoUrl = p.videoData.uri
          break
        }
        if (p?.inlineData?.data && p?.inlineData?.mimeType?.includes('video')) {
          videoUrl = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`
          break
        }
      }

      return new Response(
        JSON.stringify({
          done: true,
          operationName,
          videoUrl,
          raw: finalData,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
