import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { prompt, language = 'fr', titleFr } = await req.json();

    console.log('📸 Image generation request:', { prompt, language, titleFr });

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const listModels = async (version: 'v1' | 'v1beta'): Promise<string[]> => {
      const url = `https://generativelanguage.googleapis.com/${version}/models?key=${GEMINI_API_KEY}`
      const res = await fetch(url, { method: 'GET' })
      if (!res.ok) return []
      const data = await res.json().catch(() => ({}))
      const models: string[] = Array.isArray(data.models)
        ? data.models.map((m: any) => String(m?.name || '')
            .replace(`${version}/models/`, '')
            .replace(`models/`, '')
          ).filter((n) => typeof n === 'string' && n.length > 0)
        : []
      return models
    }

    const availableV1 = await listModels('v1')
    const availableV1beta = await listModels('v1beta')
    const isInV1 = (m: string) => availableV1.includes(m)
    const isInV1beta = (m: string) => availableV1beta.includes(m)
    const baseCandidates = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image']
    const candidates = Array.from(new Set(baseCandidates.filter((m) => {
      if (availableV1.length === 0 && availableV1beta.length === 0) return true
      return isInV1(m) || isInV1beta(m)
    })))
    
    // Build final prompt with constraints and optional French title
    let finalPrompt = `Professional high-end PHOTOGRAPH of: "${prompt}". 
Requirements:
- SUBJECT: The image must directly show the subject matter: "${prompt}" in a realistic professional setting.
- STYLE: Corporate high-quality photography, realistic lighting, 8k resolution.
- NO cameras, NO lenses, NO photographers, NO equipment must be visible in the image.
- NO illustrations, NO 3D renders, NO cartoons, NO diagrams.
- NO text inside the image (no writing, no letters).
- No human faces or people.
- Clean, modern, corporate aesthetic.`;
    if (titleFr) {
      finalPrompt += `
- At the bottom, add the French title "${titleFr}" over a semi-transparent black gradient overlay (black gradient wave at the bottom). Ensure high readability.`;
    }
    
    let data: any = null
    let lastErrorStatus = 0
    let lastErrorText = ''
    for (const model of candidates) {
      const order: Array<'v1' | 'v1beta'> =
        isInV1(model) && isInV1beta(model) ? ['v1', 'v1beta']
        : isInV1(model) ? ['v1']
        : isInV1beta(model) ? ['v1beta', 'v1']
        : ['v1', 'v1beta']
      for (const base of order) {
        const url = `https://generativelanguage.googleapis.com/${base}/models/${model}:generateContent?key=${GEMINI_API_KEY}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
            generationConfig: { temperature: 0.4 }
          })
        })
        if (res.ok) {
          data = await res.json()
          break
        } else {
          lastErrorStatus = res.status
          lastErrorText = await res.text()
        }
      }
      if (data) break
    }
    if (!data) {
      const diag = lastErrorText || 'No available Gemini image model for this API key'
      return new Response(
        JSON.stringify({
          prompt: finalPrompt,
          diagnostic: diag,
          source: 'gemini-image'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }
    const parts = data?.candidates?.[0]?.content?.parts || [];
    
    // Handle both inlineData (camelCase) and inline_data (snake_case)
    let imageBase64: string | undefined = undefined;
    for (const part of parts) {
      const inlineData = part?.inlineData || part?.inline_data;
      if (inlineData?.data) {
        imageBase64 = inlineData.data;
        break;
      }
    }
    
    if (imageBase64) {
      console.log('✅ Image generated successfully by Gemini image model');
      return new Response(
        JSON.stringify({
          imageBase64,
          prompt: finalPrompt,
          source: 'gemini-image',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    const firstText = parts.find((p: any) => p.text)?.text || '';
    console.warn('⚠️ No image part found in response. Returning diagnostic text if present.');
    return new Response(
      JSON.stringify({
        prompt: finalPrompt,
        diagnostic: firstText || 'No image content returned',
        source: 'gemini-2.5-flash-image',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    console.error('❌ Error in generate-image function:', errorMessage, errorDetails);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
