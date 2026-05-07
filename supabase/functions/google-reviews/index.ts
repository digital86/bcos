// Supabase Edge Function to fetch Google Reviews from Google Places API
// This bypasses CORS restrictions by calling Google Places API from the server

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get API key from environment or request
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY') || 'AIzaSyDpjsXDyoQo0zEAffUIPdyOiuL81sRI_SA'
    
    // Get Place ID from query params or use default BCOS Place ID
    const url = new URL(req.url)
    const placeId = url.searchParams.get('place_id') || 'ChIJDf06yv9NjhIRbw8vg5bcPcY' // BCOS Google Place ID
    
    if (!placeId) {
      return new Response(
        JSON.stringify({ error: 'Place ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Google Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,name&key=${GOOGLE_PLACES_API_KEY}`
    
    console.log('Fetching reviews from Google Places API...')
    console.log('Place ID:', placeId)
    
    const response = await fetch(placesUrl)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Places API error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch reviews from Google Places API',
          details: errorText
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API status:', data.status)
      console.error('Error message:', data.error_message)
      
      // Provide helpful error messages
      let errorMessage = data.error_message || 'Unknown error'
      if (data.status === 'REQUEST_DENIED') {
        errorMessage = 'REQUEST_DENIED: Please check:\n1. Places API is enabled in Google Cloud Console\n2. API Key is correct and has no restrictions\n3. Billing is enabled for your Google Cloud project\n\nSee FIX_GOOGLE_PLACES_API_ERROR.md for detailed instructions.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Google Places API error: ${data.status}`,
          message: errorMessage,
          status: data.status,
          troubleshooting: data.status === 'REQUEST_DENIED' ? {
            step1: 'Go to https://console.cloud.google.com/',
            step2: 'Enable Places API in APIs & Services > Library',
            step3: 'Check API Key restrictions in APIs & Services > Credentials',
            step4: 'Ensure billing is enabled'
          } : null
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format reviews for frontend and sort by time (newest first)
    // Keep original text and language - display reviews in their original language
    const reviews = (data.result?.reviews || [])
      .map((review: any) => {
        // Detect language from text if not provided by Google
        const detectLanguage = (text: string): string => {
          // Simple detection: check for Arabic characters
          const arabicPattern = /[\u0600-\u06FF]/;
          const frenchPattern = /[àâäéèêëïîôùûüÿç]/i;
          
          if (arabicPattern.test(text)) return 'ar';
          if (frenchPattern.test(text)) return 'fr';
          return 'en';
        };
        
        const detectedLang = detectLanguage(review.text || '');
        const originalLang = review.original_language || review.language || detectedLang || 'en';
        
        return {
          id: review.time || Date.now(),
          name: review.author_name,
          rating: review.rating,
          text: review.text, // Original text - no translation
          date: review.relative_time_description || review.time,
          time: review.time || 0, // Keep timestamp for sorting
          verified: true, // Google reviews are always verified
          profilePhotoUrl: review.profile_photo_url,
          language: originalLang,
          originalLanguage: originalLang, // Always use original language
          translated: review.translated || false,
        };
      })
      // Sort by time (newest first) - time is in seconds since epoch
      .sort((a: any, b: any) => (b.time || 0) - (a.time || 0))

    return new Response(
      JSON.stringify({
        reviews,
        rating: data.result?.rating || 0,
        totalRatings: data.result?.user_ratings_total || 0,
        placeName: data.result?.name || 'BCOS',
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error fetching Google reviews:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

