import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '8053126609:AAEkDnEhOWG10Szhu8GgfspQrT9gHr6GDWc';
const TELEGRAM_ADMIN_ID = Deno.env.get('TELEGRAM_ADMIN_ID') || '7506216384';

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
    const { manual = false } = await req.json().catch(() => ({}));

    console.log('🤖 Blog automation triggered', { manual });

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check automation settings
    const { data: settings, error: settingsError } = await supabase
      .from('blog_automation_settings')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (settingsError) {
      console.error('❌ Error fetching settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Settings not found. Please run migration 012_create_blog_automation.sql' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Check if automation is enabled (unless manual)
    if (!manual && !settings.is_enabled) {
      console.log('⚠️ Automation is disabled');
      return new Response(
        JSON.stringify({ message: 'Automation is disabled', skipped: true }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Check if it's time to run (unless manual)
    if (!manual && settings.next_run_at) {
      const nextRun = new Date(settings.next_run_at);
      const now = new Date();
      if (now < nextRun) {
        console.log('⚠️ Not time to run yet', { nextRun, now });
        return new Response(
          JSON.stringify({ message: 'Not time to run yet', skipped: true }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // Get upcoming scheduled formations
    const today = new Date().toISOString().split('T')[0];
    const { data: scheduledFormations, error: formationsError } = await supabase
      .from('scheduled_formations')
      .select(`
        *,
        formation:formations(*)
      `)
      .eq('is_active', true)
      .gte('scheduled_date', today)
      .order('scheduled_date', { ascending: true })
      .limit(50);

    if (formationsError) {
      console.error('❌ Error fetching formations:', formationsError);
      throw new Error(`Error fetching formations: ${formationsError.message}`);
    }

    if (!scheduledFormations || scheduledFormations.length === 0) {
      console.log('⚠️ No upcoming formations found');
      return new Response(
        JSON.stringify({ message: 'No upcoming formations found', skipped: true }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Pick a random formation
    const randomFormation = scheduledFormations[Math.floor(Math.random() * scheduledFormations.length)];
    const formation = randomFormation.formation;
    const scheduledDate = randomFormation.scheduled_date;

    console.log('✅ Selected formation:', formation.title);

    // Generate image
    let imageUrl: string | null = null;
    try {
      const imageResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: `${formation.title_fr || formation.title}. ${formation.description_fr || formation.description}`,
          language: 'fr',
          titleFr: formation.title_fr || formation.title,
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        if (imageData.imageBase64) {
          // Convert base64 to data URL
          imageUrl = `data:image/png;base64,${imageData.imageBase64}`;
          console.log('✅ Image generated');
        }
      }
    } catch (imageError) {
      console.error('⚠️ Image generation failed:', imageError);
      // Continue without image
    }

    // Generate articles using Gemini API
    // Always make slug unique for automated articles to avoid any conflict
    let unifiedSlug = slugify(formation.title_fr || formation.title);
    const automationSuffix = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    unifiedSlug = `${unifiedSlug}-${automationSuffix}`;
    console.log('📝 Using automation slug:', unifiedSlug);

    const frArticle = await generateArticle(supabase, 'fr', formation, scheduledDate, imageUrl, unifiedSlug);
    const arArticle = await generateArticle(supabase, 'ar', formation, scheduledDate, imageUrl, unifiedSlug);

    // Save articles as drafts (not published yet - waiting for Telegram approval)
    const [frResult, arResult] = await Promise.all([
      supabase.from('blog_articles').insert({
        ...frArticle,
        language: 'fr',
        is_published: false, // Save as draft, wait for approval
        is_featured: false,
      }).select('id').single(),
      supabase.from('blog_articles').insert({
        ...arArticle,
        language: 'ar',
        is_published: false, // Save as draft, wait for approval
        is_featured: false,
      }).select('id').single(),
    ]);

    if (frResult.error || arResult.error) {
      console.error('❌ Error saving articles:', frResult.error || arResult.error);
      throw new Error(`Error saving articles: ${frResult.error?.message || arResult.error?.message}`);
    }

    console.log('✅ Articles created as drafts:', { fr: frResult.data.id, ar: arResult.data.id });

    // Send to Telegram for approval
    try {
      await sendTelegramMessage(
        frArticle,
        arArticle,
        imageUrl,
        frResult.data.id,
        arResult.data.id,
        formation
      );
      console.log('✅ Telegram message sent');
    } catch (telegramError) {
      console.error('⚠️ Telegram error (continuing anyway):', telegramError);
      // Continue even if Telegram fails
    }

    // Update automation settings
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(nextRun.getHours() + (settings.interval_hours || 24));

    await supabase
      .from('blog_automation_settings')
      .update({
        last_run_at: now.toISOString(),
        next_run_at: nextRun.toISOString(),
        total_articles_generated: (settings.total_articles_generated || 0) + 2,
        updated_at: now.toISOString(),
      })
      .eq('id', '00000000-0000-0000-0000-000000000001');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Articles created and sent to Telegram for approval',
        articleTitle: frArticle.title,
        frArticleId: frResult.data.id,
        arArticleId: arResult.data.id,
        nextRunAt: nextRun.toISOString(),
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
    console.error('❌ Error in automate-blog function:', errorMessage);
    return new Response(
      JSON.stringify({
        error: errorMessage,
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

// Helper function to slugify
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper function to estimate read time
function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Helper function to generate article
async function generateArticle(
  supabase: any,
  lang: 'fr' | 'ar',
  formation: any,
  scheduledDate?: string,
  imageUrl?: string | null,
  unifiedSlug?: string
): Promise<any> {
  // Use gemini-1.5-pro-latest for better compatibility
  // Fallback to gemini-2.0-flash-exp if 1.5-pro fails
  let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;
  
  // For Arabic, prefer gemini-2.0-flash-exp which has better Arabic support
  if (lang === 'ar') {
    geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
  }

  const formationTitle = lang === 'ar'
    ? (formation.title_ar || formation.title)
    : (formation.title_fr || formation.title);

  const formationDescription = lang === 'ar'
    ? (formation.description_ar || formation.description)
    : (formation.description_fr || formation.description);

  const formationSlug = formation.slug;
  const formationUrl = `/${lang}/formation/${formationSlug}`;

  const dateText = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '';

  const prompt = lang === 'ar'
    ? `اكتب مقالاً كاملاً بالعربية لمدونة منصة تدريب حول موضوع: "${formationTitle}"

الوصف: ${formationDescription}

المتطلبات:
- العنوان: جذاب ومهني ومحسّن لـ SEO
- المحتوى: 400-700 كلمة، HTML خفيف (<p>, <ul><li>, <h2>, <h3>) بدون سكريبت
- استخدم عناوين فرعية (<h2>, <h3>) لتحسين SEO
- الملخص: أقل من 220 حرف، محسّن لـ SEO
- في نهاية المقال، أضف دعوة واضحة للتسجيل في الدورة "${formationTitle}"${dateText ? ` المقررة في ${dateText}` : ''}
- رابط الدورة: ${formationUrl}
- الوسوم: 3-4 كلمات مفتاحية متعلقة بالموضوع

ارجع JSON فقط بدون نص إضافي:
{
  "title": "...",
  "excerpt": "...",
  "content": "...",
  "tags": ["...", "...", "..."]
}`
    : `Rédige un article de blog complet en français pour une plateforme de formations sur le sujet: "${formationTitle}"

Description: ${formationDescription}

Exigences:
- Titre: accrocheur, professionnel et optimisé SEO
- Contenu: 400-700 mots, HTML léger (<p>, <ul><li>, <h2>, <h3>) sans scripts
- Utilisez des sous-titres (<h2>, <h3>) pour améliorer le SEO
- Résumé: moins de 220 caractères, optimisé SEO
- À la fin de l'article, ajoutez un appel clair à l'action pour s'inscrire à la formation "${formationTitle}"${dateText ? ` prévue le ${dateText}` : ''}
- Lien de la formation: ${formationUrl}
- Tags: 3-4 mots-clés liés au sujet

Retourne uniquement un JSON sans texte additionnel:
{
  "title": "...",
  "excerpt": "...",
  "content": "...",
  "tags": ["...", "...", "..."]
}`;

  let response = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }),
  });

  // If first model fails, try fallback (only for French)
  if (!response.ok && lang !== 'ar') {
    console.log('⚠️ gemini-1.5-flash failed, trying gemini-1.5-pro...');
    geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
    response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  // Parse JSON from response
  let parsed: any;
  try {
    // Try to extract JSON from markdown code blocks or from the first JSON-looking object
    const jsonMatch =
      rawText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
      rawText.match(/(\{[\s\S]*\})/);

    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1]);
    } else {
      parsed = JSON.parse(rawText);
    }
  } catch (e) {
    console.error('JSON parse error, falling back to basic article structure. Raw text:', rawText);
    // Fallback: build a minimal valid article from formation data so the automation never crashes
    parsed = {
      title: formationTitle,
      excerpt: (formationDescription || formationTitle).slice(0, 220),
      content: `<h2>${formationTitle}</h2><p>${formationDescription || ''}</p>`,
      tags: (formationTitle || '')
        .split(' ')
        .filter((w: string) => w.length > 3)
        .slice(0, 4),
    };
  }

  // Add CTA
  const ctaHTML = lang === 'ar'
    ? `<div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 1.5rem; margin: 2rem 0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #1e40af;">🎯 هل أنت مهتم بهذه الدورة؟</h3>
        <p style="margin-bottom: 1rem;">${dateText ? `انضم إلينا في ${dateText} لتعلم "${formationTitle}".` : `انضم إلينا لتعلم "${formationTitle}".`}</p>
        <a href="${formationUrl}" title="${formationTitle}" style="display: inline-block; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; font-weight: 600;">سجل الآن في هذه الدورة</a>
      </div>`
    : `<div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 1.5rem; margin: 2rem 0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #1e40af;">🎯 Intéressé(e) par cette formation ?</h3>
        <p style="margin-bottom: 1rem;">${dateText ? `Rejoignez-nous le ${dateText} pour apprendre "${formationTitle}".` : `Rejoignez-nous pour apprendre "${formationTitle}".`}</p>
        <a href="${formationUrl}" title="${formationTitle}" style="display: inline-block; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; font-weight: 600;">S'inscrire à cette formation</a>
      </div>`;

  let contentWithCTA = parsed.content;
  if (!contentWithCTA.includes(formationUrl)) {
    contentWithCTA += ctaHTML;
  }

  const articleSlug = unifiedSlug || slugify(parsed.title);

  return {
    title: parsed.title,
    slug: articleSlug,
    excerpt: parsed.excerpt || parsed.title.slice(0, 220),
    content: contentWithCTA,
    image_url: imageUrl || formation.cover_image_url || formation.image_url || null,
    tags: parsed.tags || [],
    formation_id: formation.id,
    read_time: estimateReadTime(contentWithCTA),
  };
}

// Helper function to send Telegram message
async function sendTelegramMessage(
  frArticle: any,
  arArticle: any,
  imageUrl: string | null,
  frArticleId: string,
  arArticleId: string,
  formation: any
): Promise<void> {
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

  // Prepare message text
  const messageText = `📝 *مقال جديد جاهز للمراجعة*

*العنوان (FR):* ${frArticle.title}
*العنوان (AR):* ${arArticle.title}

*الدورة:* ${formation.title_fr || formation.title}

*ID المقالات:*
• FR: \`${frArticleId}\`
• AR: \`${arArticleId}\`

*الملخص (FR):* ${frArticle.excerpt.substring(0, 200)}...

*الملخص (AR):* ${arArticle.excerpt.substring(0, 200)}...

اختر الإجراء:`;

  // Prepare inline keyboard
  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: '✅ قبول ونشر',
          callback_data: JSON.stringify({
            action: 'approve',
            frId: frArticleId,
            arId: arArticleId,
          }),
        },
        {
          text: '❌ رفض',
          callback_data: JSON.stringify({
            action: 'reject',
            frId: frArticleId,
            arId: arArticleId,
          }),
        },
      ],
      [
        {
          text: '🔄 إعادة التخمين',
          callback_data: JSON.stringify({
            action: 'regenerate',
            frId: frArticleId,
            arId: arArticleId,
            formationId: formation.id,
          }),
        },
        {
          text: '🖼️ تغيير الصورة',
          callback_data: JSON.stringify({
            action: 'change_image',
            frId: frArticleId,
            arId: arArticleId,
            formationId: formation.id,
          }),
        },
      ],
    ],
  };

  // Send message with photo if available
  if (imageUrl && imageUrl.startsWith('data:image')) {
    try {
      // Convert data URL (base64) to binary Blob
      const base64Data = imageUrl.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'image/png' });

      // Send photo with caption
      const formData = new FormData();
      formData.append('photo', blob, 'article-image.png');
      formData.append('chat_id', TELEGRAM_ADMIN_ID);
      formData.append('caption', messageText);
      formData.append('parse_mode', 'Markdown');
      formData.append('reply_markup', JSON.stringify(inlineKeyboard));

      const response = await fetch(telegramUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Telegram sendPhoto error:', response.status, errorText);
        throw new Error(`Telegram API error: ${response.statusText} - ${errorText}`);
      }
    } catch (e) {
      console.error('Error sending photo to Telegram, falling back to text message:', e);
      // Fallback to text-only message if photo fails
      const textUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const response = await fetch(textUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_ADMIN_ID,
          text: messageText + (imageUrl ? `\n\nImage: [Lien](${imageUrl})` : ''),
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram API error (fallback): ${response.statusText} - ${errorText}`);
      }
    }
  } else {
    // Send text message only
    const textUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(textUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_ID,
        text: messageText,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API error: ${response.statusText} - ${errorText}`);
    }
  }
}
