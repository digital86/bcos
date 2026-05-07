// Supabase Edge Function for DeepSeek-V3.2 Arabic Course Generation
// This function uses DeepSeek-V3.2 model from Hugging Face for Arabic content generation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEEPSEEK_API_URL = Deno.env.get('DEEPSEEK_API_URL') || 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') || ''

interface RequestBody {
  prompt: string
  language?: 'ar' | 'fr'
  model?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { prompt, language = 'ar', model = 'deepseek-chat' }: RequestBody = await req.json()

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
      )
    }

    // Use DeepSeek API (if available) or fallback to Hugging Face Inference API
    const useHuggingFace = !DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === ''
    
    let response: Response
    let result: any

    if (useHuggingFace) {
      // Use Hugging Face Inference API for DeepSeek-V3.2
      const HF_API_URL = `https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-V3.2`
      const HF_API_KEY = Deno.env.get('HF_API_KEY') || ''

      const messages = [
        {
          role: "user",
          content: prompt
        }
      ]

      // For Arabic, add specific instructions
      const systemPrompt = language === 'ar' 
        ? "أنت خبير في إنشاء محتوى تدريبي احترافي باللغة العربية. أنشئ محتوى HTML كامل ومنسق."
        : "You are an expert in creating professional training course content. Generate complete HTML content."

      response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': HF_API_KEY ? `Bearer ${HF_API_KEY}` : '',
        },
        body: JSON.stringify({
          inputs: `${systemPrompt}\n\n${prompt}`,
          parameters: {
            max_new_tokens: 4000,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false,
          },
        }),
      })

      result = await response.json()
      
      // Handle Hugging Face response
      if (result.error) {
        throw new Error(result.error)
      }

      // Extract generated text from HF response
      const generatedText = Array.isArray(result) 
        ? result[0]?.generated_text || result[0]?.text || ''
        : result.generated_text || result.text || ''

      return new Response(
        JSON.stringify({ 
          content: generatedText,
          model: 'deepseek-ai/DeepSeek-V3.2',
          source: 'huggingface'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    } else {
      // Use DeepSeek API directly
      response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: language === 'ar' 
                ? "أنت خبير في إنشاء محتوى تدريبي احترافي باللغة العربية. أنشئ محتوى HTML كامل ومنسق."
                : "You are an expert in creating professional training course content. Generate complete HTML content."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      })

      result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'DeepSeek API error')
      }

      const generatedText = result.choices?.[0]?.message?.content || ''

      return new Response(
        JSON.stringify({ 
          content: generatedText,
          model: model,
          source: 'deepseek-api'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  } catch (error: any) {
    console.error('Error in deepseek-arabic function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})


