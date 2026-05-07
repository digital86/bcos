import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '8053126609:AAEkDnEhOWG10Szhu8GgfspQrT9gHr6GDWc';
const TELEGRAM_ADMIN_ID = Deno.env.get('TELEGRAM_ADMIN_ID') || '7506216384';
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

  // Telegram webhook doesn't send Authorization header, so we allow all requests
  // Security is handled by verifying admin ID in the callback handler

  try {
    // Parse JSON safely
    let update;
    try {
      update = await req.json();
    } catch (e) {
      // If JSON parsing fails, return ok response anyway
      console.error('Failed to parse JSON:', e);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    
    console.log('📱 Telegram update received:', update);
    
    // If no update data, return ok
    if (!update) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Handle callback query (button clicks)
    if (update.callback_query) {
      const callback = update.callback_query;
      let data;
      try {
        data = JSON.parse(callback.data);
      } catch (e) {
        console.error('Failed to parse callback data:', e);
        await answerCallbackQuery(callback.id, '❌ خطأ في معالجة الطلب');
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      const messageId = callback.message?.message_id;
      const chatId = callback.message?.chat?.id;

      // Verify admin ID
      if (String(callback.from.id) !== TELEGRAM_ADMIN_ID) {
        await answerCallbackQuery(callback.id, '❌ غير مصرح لك');
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      switch (data.action) {
        case 'approve':
          // Publish articles
          await Promise.all([
            supabase.from('blog_articles').update({ is_published: true }).eq('id', data.frId),
            supabase.from('blog_articles').update({ is_published: true }).eq('id', data.arId),
          ]);

          await answerCallbackQuery(callback.id, '✅ تم النشر بنجاح');
          await editMessageText(chatId, messageId, '✅ *تم قبول ونشر المقال بنجاح*', null);
          break;

        case 'reject':
          // Delete articles
          await Promise.all([
            supabase.from('blog_articles').delete().eq('id', data.frId),
            supabase.from('blog_articles').delete().eq('id', data.arId),
          ]);

          await answerCallbackQuery(callback.id, '❌ تم رفض المقال');
          await editMessageText(chatId, messageId, '❌ *تم رفض وحذف المقال*', null);
          break;

        case 'regenerate':
          // Regenerate articles
          await answerCallbackQuery(callback.id, '🔄 جاري إعادة التخمين...');
          
          // Get formation
          const { data: formationData } = await supabase
            .from('formations')
            .select('*')
            .eq('id', data.formationId)
            .single();

          if (formationData) {
            // Delete old articles
            await Promise.all([
              supabase.from('blog_articles').delete().eq('id', data.frId),
              supabase.from('blog_articles').delete().eq('id', data.arId),
            ]);

            // Trigger regeneration
            await fetch(`${SUPABASE_URL}/functions/v1/automate-blog`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                manual: true,
                formationId: data.formationId,
              }),
            });

            await editMessageText(chatId, messageId, '🔄 *جاري إعادة توليد المقال...*', null);
          }
          break;

        case 'change_image':
          // Regenerate image
          await answerCallbackQuery(callback.id, '🖼️ جاري تغيير الصورة...');
          
          // Get formation
          const { data: formationData2 } = await supabase
            .from('formations')
            .select('*')
            .eq('id', data.formationId)
            .single();

          if (formationData2) {
            // Generate new image
            const imageResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                prompt: `${formationData2.title_fr || formationData2.title}. ${formationData2.description_fr || formationData2.description}`,
                language: 'fr',
                titleFr: formationData2.title_fr || formationData2.title,
              }),
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              if (imageData.imageBase64) {
                const newImageUrl = `data:image/png;base64,${imageData.imageBase64}`;
                
                // Update articles with new image
                await Promise.all([
                  supabase.from('blog_articles').update({ image_url: newImageUrl }).eq('id', data.frId),
                  supabase.from('blog_articles').update({ image_url: newImageUrl }).eq('id', data.arId),
                ]);

                // Send new image
                await sendPhoto(chatId, newImageUrl, '🖼️ *الصورة الجديدة*');
                await answerCallbackQuery(callback.id, '✅ تم تغيير الصورة');
              }
            }
          }
          break;
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Handle regular messages
    if (update.message) {
      const message = update.message;
      if (message.text === '/start' || message.text === '/help') {
        await sendMessage(message.chat.id, 'مرحباً! أنا بوت لإدارة مقالات المدونة.\n\nاستخدم الأزرار في الرسائل للتفاعل مع المقالات.');
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('❌ Error in telegram-webhook:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
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

// Helper functions for Telegram API
async function answerCallbackQuery(callbackId: string, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackId,
      text: text,
    }),
  });
}

async function editMessageText(chatId: number, messageId: number, text: string, replyMarkup: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown',
      reply_markup: replyMarkup,
    }),
  });
}

async function sendMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });
}

async function sendPhoto(chatId: number, imageUrl: string, caption: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const base64Data = imageUrl.split(',')[1];
  const blob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob());
  
  const formData = new FormData();
  formData.append('photo', blob, 'image.png');
  formData.append('chat_id', String(chatId));
  formData.append('caption', caption);
  formData.append('parse_mode', 'Markdown');

  await fetch(url, {
    method: 'POST',
    body: formData,
  });
}
