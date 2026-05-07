// Supabase Edge Function to proxy You.com API requests
// This bypasses CORS restrictions by calling You.com API from the server

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, apiKey } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean API key (remove whitespace)
    const cleanApiKey = apiKey.trim()

    // Log API key prefix for debugging (without exposing full key)
    console.log('API Key received:', cleanApiKey ? `${cleanApiKey.substring(0, 10)}...` : 'MISSING')
    console.log('API Key length:', cleanApiKey.length)
    console.log('Prompt length:', prompt.length)

    const YOU_COM_BASE_URL = 'https://api.ydc-index.io/v1'
    const errors: string[] = []
    
    // Try Unified Search API first (most reliable for You.com)
    // Try both X-API-Key and Authorization: Bearer headers
    try {
      // Try GET first with Authorization Bearer
      const searchQuery = encodeURIComponent(prompt.substring(0, 500))
      let unifiedResponse = await fetch(`${YOU_COM_BASE_URL}/search?query=${searchQuery}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanApiKey}`,
          'X-API-Key': cleanApiKey,
        },
      })

      // If GET fails, try POST with both headers
      if (!unifiedResponse.ok) {
        console.log('GET failed, trying POST. Status:', unifiedResponse.status)
        unifiedResponse = await fetch(`${YOU_COM_BASE_URL}/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanApiKey}`,
            'X-API-Key': cleanApiKey,
          },
          body: JSON.stringify({
            query: prompt.substring(0, 1000),
            num_web_results: 5,
          }),
        })
      }
      
      console.log('Unified Search response status:', unifiedResponse.status)

      if (unifiedResponse.ok) {
        const unifiedData = await unifiedResponse.json()
        console.log('Unified Search response:', JSON.stringify(unifiedData).substring(0, 1000))
        
        // You.com unified search may return LLM-generated answer
        const content = unifiedData.answer || 
                       unifiedData.response || 
                       unifiedData.text ||
                       unifiedData.results?.[0]?.answer ||
                       unifiedData.results?.[0]?.snippet || '';
        
        if (content && content.length > 100) {
          return new Response(
            JSON.stringify({ content, source: 'unified/search' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          errors.push('Unified Search returned empty or short content')
        }
      } else {
        const errorText = await unifiedResponse.text()
        errors.push(`Unified Search failed: ${unifiedResponse.status} - ${errorText.substring(0, 200)}`)
      }
    } catch (error: any) {
      errors.push(`Unified Search error: ${error.message}`)
    }

    // Try Agents API (try both Authorization Bearer and X-API-Key)
    try {
      const agentsResponse = await fetch(`${YOU_COM_BASE_URL}/agents/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanApiKey}`,
          'X-API-Key': cleanApiKey,
        },
        body: JSON.stringify({
          agent: 'express',
          input: prompt,
          stream: false,
        }),
      })

      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json()
        console.log('Agents API response:', JSON.stringify(agentsData).substring(0, 500))
        
        const content = agentsData.output || 
                       agentsData.text || 
                       agentsData.response || 
                       agentsData.content ||
                       agentsData.result?.output ||
                       agentsData.data?.output ||
                       agentsData.run?.output ||
                       '';
        
        if (content) {
          return new Response(
            JSON.stringify({ content, source: 'agents/runs' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          errors.push('Agents API returned empty content')
        }
      } else {
        const errorText = await agentsResponse.text()
        errors.push(`Agents API failed: ${agentsResponse.status} - ${errorText.substring(0, 200)}`)
      }
    } catch (error: any) {
      errors.push(`Agents API error: ${error.message}`)
    }

    // Fallback: Try other endpoints
    const endpoints = [
      { url: `${YOU_COM_BASE_URL}/chat/completions`, method: 'POST' },
      { url: `${YOU_COM_BASE_URL}/completions`, method: 'POST' },
      { url: `${YOU_COM_BASE_URL}/unified`, method: 'POST' },
      { url: `${YOU_COM_BASE_URL}/search`, method: 'POST' },
    ]

    // Try each endpoint (only X-API-Key, no Authorization header)
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanApiKey}`,
            'X-API-Key': cleanApiKey,
          },
          body: JSON.stringify({
            query: prompt.substring(0, 1000),
            messages: [
              {
                role: 'system',
                content: 'You are an expert in creating professional training course content. Generate complete HTML pages following exact templates and structures provided.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 4000,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`Endpoint ${endpoint.url} response:`, JSON.stringify(data).substring(0, 500))
          
          const content = data.choices?.[0]?.message?.content || 
                         data.choices?.[0]?.text ||
                         data.content || 
                         data.text || 
                         data.response?.text || 
                         data.response?.answer ||
                         data.answer ||
                         '';
          
          if (content) {
            return new Response(
              JSON.stringify({ content, source: endpoint.url }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          } else {
            console.warn(`Endpoint ${endpoint.url} returned empty content`)
          }
        } else {
          const errorText = await response.text()
          console.warn(`Endpoint ${endpoint.url} failed with status:`, response.status, 'Response:', errorText.substring(0, 500))
        }
      } catch (error: any) {
        console.warn(`Endpoint ${endpoint.url} failed:`, error.message)
        continue
      }
    }

    // If all endpoints fail, return detailed error with all error messages
    return new Response(
      JSON.stringify({ 
        error: 'All You.com API endpoints failed',
        message: 'Please check your API key and try again',
        details: errors.join('; '),
        attemptedEndpoints: ['unified/search', 'agents/runs', 'chat/completions', 'completions', 'unified', 'search']
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

