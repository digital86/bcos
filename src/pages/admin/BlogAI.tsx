import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Wand2, Save, Upload, RefreshCw, Languages, Sparkles, Calendar, Image as ImageIcon, Check, X, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseService, supabase } from '@/lib/supabase';
import { useUpcomingScheduledFormations } from '@/hooks/useSupabase';
import type { Formation } from '../../../supabase-config';
import { optimizeImage } from '@/utils/imageUtils';

type ArticleDraft = {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  image_url?: string;
  tags?: string[];
  category_id?: string;
  read_time?: number;
  formation_id?: string;
};

type SuggestedFormation = {
  formation: Formation;
  scheduled_date?: string;
  scheduled_time?: string;
};

const randomSubjects = {
  fr: [
    'Comment l’IA transforme la formation professionnelle en Algérie',
    '10 conseils pour lancer un programme e-learning en entreprise',
    'Leadership hybride : gérer des équipes terrain et remote',
    'Construire une culture de vente centrée client en 2025',
    'Stratégies agiles pour des projets industriels complexes'
  ],
  ar: [
    'كيف تغيّر الذكاء الاصطناعي التكوين المهني في الجزائر',
    '10 نصائح لإطلاق برنامج تعلم إلكتروني داخل المؤسسة',
    'القيادة الهجينة: إدارة فرق ميدانية وعن بُعد',
    'بناء ثقافة مبيعات تتمحور حول العميل في 2025',
    'استراتيجيات رشيقة للمشاريع الصناعية المعقدة'
  ]
};

const sanitizeJson = (text: string): string => {
  // Remove markdown code blocks
  let cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // Try to extract JSON object if there's text before/after
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  // Remove comments (basic)
  cleaned = cleaned
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  return cleaned.trim();
};

type ParsedArticle = {
  title: string;
  excerpt?: string;
  content?: string;
  image_url?: string;
  tags?: string[];
  slug?: string;
  read_time?: number;
  description?: string;
  keywords?: string;
};

const parseJsonSafely = (text: string): ParsedArticle => {
  try {
    // First try: simple parse after basic cleaning
    const cleaned = sanitizeJson(text);
    return JSON.parse(cleaned);
  } catch (error) {
    // Second try: extract JSON and fix common issues
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        let jsonStr = jsonMatch[0];
        
        // Fix trailing commas (most common issue)
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
        
        // Try parsing
        return JSON.parse(jsonStr);
      } catch (e2) {
        // Third try: more aggressive fixes
        try {
          let jsonStr = jsonMatch[0];
          
          // Remove trailing commas
          jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
          
          // Fix unescaped newlines in strings (but preserve escaped ones)
          jsonStr = jsonStr.replace(/(?<!\\)\n/g, '\\n');
          jsonStr = jsonStr.replace(/(?<!\\)\r/g, '\\r');
          
          // Normalize whitespace but preserve string content
          jsonStr = jsonStr.replace(/\s+/g, ' ');
          
          return JSON.parse(jsonStr);
        } catch (e3) {
          // Last resort: manually extract fields using regex
          const jsonStr = jsonMatch[0];
          
          // Extract title (handle multiline and escaped quotes)
          const titleMatch = jsonStr.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
          const excerptMatch = jsonStr.match(/"excerpt"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
          const contentMatch = jsonStr.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
          const imageMatch = jsonStr.match(/"image_url"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
          const tagsMatch = jsonStr.match(/"tags"\s*:\s*\[([^\]]+)\]/);
          
          const tags = tagsMatch 
            ? tagsMatch[1]
                .split(',')
                .map(t => t.trim().replace(/^["']|["']$/g, ''))
                .filter(t => t.length > 0)
            : [];

          return {
            title: titleMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') || 'Article sans titre',
            excerpt: excerptMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') || '',
            content: contentMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') || '',
            image_url: imageMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') || '',
            tags: tags
          };
        }
      }
    }
    throw new Error(`Impossible de parser le JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const supabaseGenerateText = async (prompt: string, systemPrompt: string | undefined, model: string): Promise<string> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured');
  }
  const res = await fetch(`${supabaseUrl}/functions/v1/generate-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnon}`,
    },
    body: JSON.stringify({
      prompt,
      system_prompt: systemPrompt || '',
      model,
      temperature: 0.7,
      maxOutputTokens: 4096,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt);
  }
  const data = await res.json();
  return data.content || '';
};

const httpGenerateContent = async (apiKey: string, prompt: string, model: string): Promise<string> => {
  const tryEndpoint = async (base: 'v1' | 'v1beta') => {
    const url = `https://generativelanguage.googleapis.com/${base}/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 }
      })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`${res.status} ${txt}`);
    }
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return raw;
  };
  try {
    return await tryEndpoint('v1');
  } catch {
    return await tryEndpoint('v1beta');
  }
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .replace(/--+/g, '-');

const BlogAI = () => {
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [subject, setSubject] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [draft, setDraft] = useState<ArticleDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modelName, setModelName] = useState('gemini-3-pro');
  const [suggestedFormation, setSuggestedFormation] = useState<SuggestedFormation | null>(null);
  const [generatingBilingual, setGeneratingBilingual] = useState(false);
  const [savingBilingual, setSavingBilingual] = useState(false);
  const [suggestedImage, setSuggestedImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [approvedImage, setApprovedImage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewArticles, setPreviewArticles] = useState<{
    fr: ArticleDraft;
    ar: ArticleDraft;
    formation: Formation;
    unifiedSlug: string;
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { scheduledFormations, loading: loadingFormations } = useUpcomingScheduledFormations(20);

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();
          
          if (userData) {
            setCurrentUserId(userData.id);
          }
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    getSession();
  }, []);

  const placeholderSubject = useMemo(() => {
    const pool = randomSubjects[language];
    return pool[Math.floor(Math.random() * pool.length)];
  }, [language]);

  const pickRandomSubject = () => {
    const pool = randomSubjects[language];
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    setSubject(chosen);
  };

  const handleGenerate = async () => {
    const promptSubject = subject.trim() || placeholderSubject;
    setGenerating(true);
    try {
      let safeModelName = modelName;
      if (safeModelName === 'gemini-pro') {
        safeModelName = 'gemini-1.5-pro';
      }
      if (safeModelName === 'gemini-3prev') {
        safeModelName = 'gemini-3-pro';
      }
      if (safeModelName.endsWith('-latest')) {
        safeModelName = safeModelName.replace('-latest', '');
      }
      if (safeModelName === 'gemini-2.0-flash-exp') {
        safeModelName = 'gemini-1.5-pro';
      }
      const prompt = `Rédige un article de blog complet en ${language === 'fr' ? 'français' : 'arabe (RTL)'} pour une plateforme de formations.

Sujet: "${promptSubject}"

Retourne uniquement un JSON strict sans texte additionnel, structure:
{
  "title": "...",
  "excerpt": "Résumé accrocheur <= 220 caractères dans la langue cible",
  "content": "Article en HTML léger (paragraphes <p>, listes <ul><li>) sans scripts",
  "image_url": "URL d'illustration pertinente ou vide",
  "tags": ["mot-clé1", "mot-clé2", "mot-clé3", "mot-clé4"]
}

Longueur: 400-700 mots, ton professionnel et pédagogique.`;
      let rawText: string;
      const systemStrict = language === 'ar'
        ? 'أرجع JSON صالحاً فقط بالمفاتيح التالية: title, excerpt, content, image_url, tags. لا تستخدم Markdown. تأكد من الهروب الصحيح لعلامات الاقتباس والأسطر الجديدة. المحتوى يجب أن يكون سلسلة HTML.'
        : 'Return only valid JSON with keys: title, excerpt, content, image_url, tags. No markdown. Properly escape quotes and newlines. content must be an HTML string.';
      const candidateModels = Array.from(new Set([safeModelName, 'gemini-3-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']));
      let lastError = '';
      for (const m of candidateModels) {
        try {
          rawText = await supabaseGenerateText(prompt, systemStrict, m);
          lastError = '';
          break;
        } catch (e: any) {
          lastError = e?.message || String(e);
        }
      }
      if (lastError) throw new Error(lastError);
      const parsed = parseJsonSafely(rawText);

      setDraft({
        title: parsed.title,
        slug: parsed.slug || slugify(parsed.title),
        excerpt: parsed.excerpt,
        content: parsed.content,
        image_url: parsed.image_url,
        tags: parsed.tags,
        read_time: parsed.read_time
      });
      toast.success(language === 'ar' ? 'تم إنشاء المقال' : 'Article généré');
    } catch (error: unknown) {
      console.error('Gemini generation error', error);
      
      // Handle different error types
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorString = JSON.stringify(error);
      
      if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('not supported')) {
        const modelError = language === 'ar' 
          ? `النموذج ${modelName} غير متاح. جرب "Gemini 1.5 Pro" أو "Gemini 1.5 Flash".`
          : `Modèle ${modelName} non disponible. Essayez "Gemini 1.5 Pro" ou "Gemini 1.5 Flash".`;
        toast.error(modelError, { duration: 8000 });
      } else if (errorMessage.includes('429') || errorMessage.includes('quota') || errorString.includes('Quota exceeded')) {
        const quotaMessage = language === 'ar' 
          ? `تم تجاوز الحصة المجانية لـ ${modelName}. جرب نموذجاً آخر أو انتظر قليلاً.`
          : `Quota gratuit ${modelName} dépassé. Essayez un autre modèle ou attendez quelques minutes.`;
        toast.error(quotaMessage, { duration: 8000 });
      } else if (errorMessage.includes('API key')) {
        toast.error(language === 'ar' ? 'مفتاح API غير صالح' : 'Clé API invalide');
      } else {
        toast.error(errorMessage || (language === 'ar' ? 'خطأ أثناء التوليد' : 'Erreur lors de la génération'));
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleImportJson = () => {
    if (!jsonInput.trim()) {
      toast.error(language === 'ar' ? 'الرجاء لصق JSON' : 'Veuillez coller un JSON');
      return;
    }
    try {
      const parsed = parseJsonSafely(jsonInput);
      setDraft({
        title: parsed.title,
        slug: parsed.slug || slugify(parsed.title || ''),
        excerpt: parsed.excerpt || '',
        content: parsed.content || '',
        image_url: parsed.image_url,
        tags: parsed.tags,
        read_time: parsed.read_time
      });
      toast.success(language === 'ar' ? 'تم استيراد JSON' : 'JSON importé');
    } catch (error: unknown) {
      toast.error(language === 'ar' ? 'JSON غير صالح' : 'JSON invalide');
    }
  };

  const handleSave = async () => {
    if (!draft) {
      toast.error(language === 'ar' ? 'لا يوجد مقال للحفظ' : 'Aucun article à enregistrer');
      return;
    }
    if (!draft.title || !draft.content) {
      toast.error(language === 'ar' ? 'العنوان والمحتوى إلزاميان' : 'Titre et contenu obligatoires');
      return;
    }

    setSaving(true);
    try {
      await SupabaseService.createBlogArticle({
        title: draft.title,
        slug: draft.slug || slugify(draft.title),
        excerpt: draft.excerpt || draft.content.slice(0, 220),
        content: draft.content,
        image_url: draft.image_url,
        tags: draft.tags,
        read_time: draft.read_time,
        language,
        is_published: true,
        is_featured: false,
        author_id: currentUserId || undefined
      });
      toast.success(language === 'ar' ? 'تم حفظ المقال' : 'Article enregistré');
      setDraft(null);
    } catch (error: unknown) {
      console.error('Save article error', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Generate image using Google Imagen API via Supabase Edge Function
  const generateImageForFormation = async (formation: Formation): Promise<string | null> => {
    try {
      setGeneratingImage(true);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // Get formation title in current language
      const formationTitle = language === 'ar'
        ? (formation.title_ar || formation.title)
        : (formation.title_fr || formation.title);
      
      // Get French title for image overlay
      const formationTitleFr = formation.title_fr || formation.title;
      
      const formationDescription = language === 'ar'
        ? (formation.description_ar || formation.description)
        : (formation.description_fr || formation.description);

      // Create prompt for image generation
      const imagePrompt = `${formationTitle}. ${formationDescription}`;

      // Call Supabase Edge Function to generate image using Imagen
      try {
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-image`;
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
          },
          body: JSON.stringify({
            prompt: imagePrompt,
            language: language,
            titleFr: formationTitleFr, // Send French title for overlay
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // If image was generated, return it as data URL
          if (data.imageBase64) {
            console.log('✅ Image generated by Gemini. Optimizing...');
            const rawDataUrl = `data:image/png;base64,${data.imageBase64}`;
            
            // Optimize image: Convert to WebP and compress
            const optimizedDataUrl = await optimizeImage(rawDataUrl, { 
              quality: 0.5, // High compression for AI images
              maxWidth: 1000 
            });
            
            toast.success(language === 'ar' 
              ? 'تم توليد وتصغير الصورة بنجاح' 
              : 'Image générée et optimisée avec succès');
            return optimizedDataUrl;
          }
          
          // If only prompt returned, Gemini has created an enhanced description
          // User can use this description to find or upload an image manually
          if (data.prompt) {
            console.log('✅ Gemini generated enhanced prompt for image');
            toast.info(language === 'ar' 
              ? 'تم إنشاء وصف الصورة باستخدام Gemini. يمكنك اختيار صورة يدوياً' 
              : 'Description créée avec Gemini. Vous pouvez choisir une image manuellement');
            // Return null - user should select image manually
            return null;
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Edge Function error:', response.status, errorData);
          toast.error(language === 'ar' 
            ? 'خطأ في توليد وصف الصورة' 
            : 'Erreur lors de la génération de la description de l\'image');
        }
      } catch (edgeFunctionError) {
        console.error('Error calling Edge Function:', edgeFunctionError);
        toast.error(language === 'ar' 
          ? 'فشل استدعاء وظيفة توليد الصورة' 
          : 'Échec de l\'appel à la fonction de génération d\'image');
      }
      
      // Return null if image generation fails
      return null;
    } catch (error) {
      console.error('Error generating image:', error);
      // Return null if generation fails
      return null;
    } finally {
      setGeneratingImage(false);
    }
  };

  // Suggest article based on upcoming formations
  const handleSuggestFromFormations = async () => {
    if (!scheduledFormations || scheduledFormations.length === 0) {
      toast.error(language === 'ar' ? 'لا توجد دورات قادمة' : 'Aucune formation à venir');
      return;
    }

    // Get formations with actual formation data
    const activeFormations = scheduledFormations
      .filter((sf: { formation?: Formation }) => sf.formation && sf.formation.is_active)
      .map((sf: { formation?: Formation; scheduled_date?: string; scheduled_time?: string }) => ({
        formation: sf.formation,
        scheduled_date: sf.scheduled_date,
        scheduled_time: sf.scheduled_time
      }));

    if (activeFormations.length === 0) {
      toast.error(language === 'ar' ? 'لا توجد دورات نشطة' : 'Aucune formation active');
      return;
    }

    // Pick a random formation
    const randomFormation = activeFormations[Math.floor(Math.random() * activeFormations.length)];
    setSuggestedFormation(randomFormation);
    setApprovedImage(null); // Reset approved image
    setSuggestedImage(null); // Reset suggested image
    setImageLoadError(false); // Reset image load error

    // Set subject based on formation
    const formationTitle = language === 'ar' 
      ? (randomFormation.formation.title_ar || randomFormation.formation.title)
      : (randomFormation.formation.title_fr || randomFormation.formation.title);
    
    setSubject(formationTitle);
    
    // Generate image for the formation
    setImageLoadError(false); // Reset error state
    const generatedImage = await generateImageForFormation(randomFormation.formation);
    if (generatedImage) {
      setSuggestedImage(generatedImage);
    }

    // Generate preview articles (FR + AR) for the suggested formation
    try {
      const formationTitleFr = randomFormation.formation.title_fr || randomFormation.formation.title;
      const unifiedSlug = slugify(formationTitleFr);

      const frArticle = await generateArticleWithCTA(
        'fr',
        randomFormation.formation,
        randomFormation.scheduled_date,
        generatedImage,
        unifiedSlug
      );

      const arArticle = await generateArticleWithCTA(
        'ar',
        randomFormation.formation,
        randomFormation.scheduled_date,
        generatedImage,
        unifiedSlug
      );

      setPreviewArticles({
        fr: frArticle,
        ar: arArticle,
        formation: randomFormation.formation,
        unifiedSlug
      });
      setShowPreview(true);

      toast.success(language === 'ar' ? 'تم إنشاء معاينة المقال المقترح' : 'Aperçu de l’article suggéré généré');
    } catch (e: any) {
      const msg = e?.message || String(e);
      toast.error(msg || (language === 'ar' ? 'فشل إنشاء المعاينة' : 'Échec de la génération de l’aperçu'));
    }
  };

  // Generate article with CTA for formation
  const generateArticleWithCTA = async (lang: 'fr' | 'ar', formation: Formation, scheduledDate?: string, customImageUrl?: string | null, unifiedSlug?: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Clé API Gemini non configurée');
    }

    let modelToUse = modelName;
    if (modelToUse === 'gemini-pro') {
      modelToUse = 'gemini-1.5-pro';
    }
    if (modelToUse.endsWith('-latest')) {
      modelToUse = modelToUse.replace('-latest', '');
    }
    if (modelToUse === 'gemini-2.0-flash-exp') {
      modelToUse = 'gemini-1.5-pro';
    }
    // Ensure good Arabic support
    if (lang === 'ar') {
      if (!['gemini-1.5-pro', 'gemini-1.5-flash'].includes(modelToUse)) {
        modelToUse = 'gemini-1.5-pro';
      }
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
- العنوان: جذاب ومهني ومحسّن لـ SEO (يحتوي على كلمات مفتاحية)
- المحتوى: 400-700 كلمة، HTML خفيف (<p>, <ul><li>, <h2>, <h3>) بدون سكريبت
- استخدم عناوين فرعية (<h2>, <h3>) لتحسين SEO
- الملخص: أقل من 220 حرف، محسّن لـ SEO
- في نهاية المقال، أضف دعوة واضحة للتسجيل في الدورة "${formationTitle}"${dateText ? ` المقررة في ${dateText}` : ''}
- رابط الدورة: ${formationUrl}
- الوسوم: 3-4 كلمات مفتاحية متعلقة بالموضوع
- استخدم كلمات مفتاحية طبيعية في المحتوى لتحسين SEO

ارجع JSON فقط بدون نص إضافي:
{
  "title": "...",
  "excerpt": "...",
  "content": "...",
  "image_url": "...",
  "tags": ["...", "...", "..."]
}`
      : `Rédige un article de blog complet en français pour une plateforme de formations sur le sujet: "${formationTitle}"

Description: ${formationDescription}

Exigences:
- Titre: accrocheur, professionnel et optimisé SEO (contient des mots-clés)
- Contenu: 400-700 mots, HTML léger (<p>, <ul><li>, <h2>, <h3>) sans scripts
- Utilisez des sous-titres (<h2>, <h3>) pour améliorer le SEO
- Résumé: moins de 220 caractères, optimisé SEO
- À la fin de l'article, ajoutez un appel clair à l'action pour s'inscrire à la formation "${formationTitle}"${dateText ? ` prévue le ${dateText}` : ''}
- Lien de la formation: ${formationUrl}
- Tags: 3-4 mots-clés liés au sujet
- Utilisez des mots-clés naturels dans le contenu pour améliorer le SEO

Retourne uniquement un JSON sans texte additionnel:
{
  "title": "...",
  "excerpt": "...",
  "content": "...",
  "image_url": "...",
  "tags": ["...", "...", "..."]
}`;

    let rawText: string;
    {
      const candidateModels = [modelToUse, 'gemini-1.5-flash', 'gemini-1.5-pro'];
      let lastError = '';
      const systemStrict = lang === 'ar'
        ? 'أرجع JSON صالحاً فقط بالمفاتيح التالية: title, excerpt, content, image_url, tags. لا تستخدم Markdown. تأكد من الهروب الصحيح لعلامات الاقتباس والأسطر الجديدة. المحتوى يجب أن يكون سلسلة HTML.'
        : 'Return only valid JSON with keys: title, excerpt, content, image_url, tags. No markdown. Properly escape quotes and newlines. content must be an HTML string.';
      for (const m of candidateModels) {
        try {
          rawText = await supabaseGenerateText(prompt, systemStrict, m);
          lastError = '';
          break;
        } catch (e: any) {
          lastError = e?.message || String(e);
        }
      }
      if (lastError) throw new Error(lastError);
    }
    const parsed = parseJsonSafely(rawText);

    // Add CTA to content if not already present
    let contentWithCTA = parsed.content;
    
    // Ensure content has proper SEO structure (headings, semantic HTML)
    // Check if content has h2/h3 headings, if not, add them
    if (!contentWithCTA.includes('<h2') && !contentWithCTA.includes('<h3')) {
      // Try to add headings to improve SEO
      const paragraphs = contentWithCTA.split('</p>');
      if (paragraphs.length > 3) {
        // Add h2 after first paragraph for better SEO
        contentWithCTA = paragraphs[0] + '</p>' + 
          (lang === 'ar' 
            ? '<h2>محتوى الدورة</h2>' 
            : '<h2>Contenu de la formation</h2>') +
          paragraphs.slice(1).join('</p>');
      }
    }
    
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

    if (!contentWithCTA.includes(formationUrl)) {
      contentWithCTA += ctaHTML;
    }

    // Use custom image (approved) if available, otherwise fallback to parsed image or formation image
    const finalImageUrl = customImageUrl || parsed.image_url || formation.cover_image_url || formation.image_url;

    // Use unified slug if provided, otherwise generate from title
    const articleSlug = unifiedSlug || slugify(parsed.title);

    return {
      title: parsed.title,
      slug: articleSlug,
      excerpt: parsed.excerpt,
      content: contentWithCTA,
      image_url: finalImageUrl,
      tags: parsed.tags || [],
      formation_id: formation.id,
      read_time: Math.ceil(contentWithCTA.split(' ').length / 200)
    };
  };

  // Generate and publish bilingual articles
  const handleGenerateAndPublishBilingual = async () => {
    if (!suggestedFormation) {
      toast.error(language === 'ar' ? 'لا توجد دورة مقترحة' : 'Aucune formation suggérée');
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error('Configurez la clé Gemini dans VITE_GEMINI_API_KEY');
      return;
    }

    setGeneratingBilingual(true);
    setSavingBilingual(true);

    try {
      // Generate unified slug based on formation title (French version for consistency)
      const formationTitleFr = suggestedFormation.formation.title_fr || suggestedFormation.formation.title;
      const unifiedSlug = slugify(formationTitleFr);

      // Generate French article first to get the title for unified slug
      const frArticle = await generateArticleWithCTA(
        'fr',
        suggestedFormation.formation,
        suggestedFormation.scheduled_date,
        approvedImage,
        unifiedSlug
      );

      // Use the same unified slug for Arabic article
      const arArticle = await generateArticleWithCTA(
        'ar',
        suggestedFormation.formation,
        suggestedFormation.scheduled_date,
        approvedImage,
        unifiedSlug
      );

      // Store articles for preview
      setPreviewArticles({
        fr: frArticle,
        ar: arArticle,
        formation: suggestedFormation.formation,
        unifiedSlug
      });
      
      // Show preview modal instead of publishing directly
      setShowPreview(true);

      // Don't publish yet, just show preview
      setGeneratingBilingual(false);
    } catch (error: unknown) {
      console.error('Bilingual generation error', error);
      
      // Handle Supabase errors
      let errorMessage = '';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }
      
      // Check for duplicate key error (shouldn't happen now with auto-timestamp, but handle it)
      if (errorMessage.includes('duplicate key') || errorMessage.includes('23505') || errorMessage.includes('409')) {
        toast.error(language === 'ar' 
          ? 'المقال موجود بالفعل بنفس العنوان. سيتم إضافة رقم فريد تلقائياً. حاول مرة أخرى' 
          : 'L\'article existe déjà avec le même titre. Un numéro unique sera ajouté automatiquement. Réessayez');
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast.error(language === 'ar' 
          ? `النموذج ${modelName} غير متاح. جرب "Gemini 1.5 Pro" أو "Gemini 1.5 Flash"` 
          : `Modèle ${modelName} non disponible. Essayez "Gemini 1.5 Pro" ou "Gemini 1.5 Flash"`);
      } else if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        toast.error(language === 'ar' 
          ? 'تم تجاوز الحصة. انتظر قليلاً' 
          : 'Quota dépassé. Attendez quelques minutes');
      } else {
        toast.error(errorMessage || (language === 'ar' ? 'خطأ أثناء التوليد' : 'Erreur lors de la génération'));
      }
    } finally {
      setGeneratingBilingual(false);
      setSavingBilingual(false);
    }
  };

  // Publish articles from preview
  const handlePublishFromPreview = async () => {
    if (!previewArticles) return;

    setSavingBilingual(true);
    try {
      await Promise.all([
        SupabaseService.createBlogArticle({
          ...previewArticles.fr,
          language: 'fr',
          is_published: true,
          is_featured: false,
          author_id: currentUserId || undefined
        }),
        SupabaseService.createBlogArticle({
          ...previewArticles.ar,
          language: 'ar',
          is_published: true,
          is_featured: false,
          author_id: currentUserId || undefined
        })
      ]);

      toast.success(language === 'ar' 
        ? 'تم إنشاء ونشر المقال بالعربية والفرنسية' 
        : 'Articles créés et publiés en français et en arabe');
      
      setSuggestedFormation(null);
      setSubject('');
      setSuggestedImage(null);
      setApprovedImage(null);
      setImageLoadError(false);
      setShowPreview(false);
      setPreviewArticles(null);
    } catch (error: unknown) {
      console.error('Publish error', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage || (language === 'ar' ? 'خطأ أثناء النشر' : 'Erreur lors de la publication'));
    } finally {
      setSavingBilingual(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6" dir={dir}>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Languages className="w-6 h-6 text-primary" />
            {language === 'ar' ? 'إنشاء مقالات بالذكاء الاصطناعي' : 'Générer des articles (IA)'}
          </h1>
          <p className="text-gray-600">
            {language === 'ar'
              ? 'أنشئ أو استورد مقالات باللغتين العربية والفرنسية، مع حفظ مباشر في Supabase.'
              : 'Générez ou importez des articles en français et en arabe, puis enregistrez-les dans Supabase.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Button
            variant={language === 'fr' ? 'default' : 'outline'}
            onClick={() => setLanguage('fr')}
          >
            FR
          </Button>
          <Button
            variant={language === 'ar' ? 'default' : 'outline'}
            onClick={() => setLanguage('ar')}
          >
            AR
          </Button>
          <Button variant="secondary" onClick={pickRandomSubject}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'موضوع عشوائي' : 'Sujet aléatoire'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSuggestFromFormations}
            disabled={loadingFormations}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'مشاهدة المقال المقترح' : 'Voir l\'article suggéré'}
          </Button>
          <div className="flex items-center gap-2">
            <Label className="text-sm">{language === 'ar' ? 'النموذج:' : 'Modèle:'}</Label>
            <Select value={modelName} onValueChange={setModelName}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                <SelectItem value="gemini-3.0-pro-preview">Gemini 3 Pro (Preview)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Suggested Formation Card */}
        {suggestedFormation && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {language === 'ar' ? 'مقال مقترح من دورة قادمة' : 'Article suggéré depuis une formation'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'سيتم إنشاء مقال بالعربية والفرنسية مع دعوة للتسجيل في الدورة'
                  : 'Un article sera créé en français et en arabe avec un appel à l\'inscription'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">
                  {language === 'ar' ? 'الدورة:' : 'Formation:'}
                </Label>
                <p className="text-lg font-medium mt-1">
                  {language === 'ar'
                    ? (suggestedFormation.formation.title_ar || suggestedFormation.formation.title)
                    : (suggestedFormation.formation.title_fr || suggestedFormation.formation.title)}
                </p>
                {suggestedFormation.scheduled_date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'ar' ? 'التاريخ:' : 'Date:'} {new Date(suggestedFormation.scheduled_date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}
                  </p>
                )}
              </div>

              {/* Suggested Image Preview */}
              {(suggestedImage || generatingImage) && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {language === 'ar' ? 'الصورة المقترحة:' : 'Image suggérée:'}
                    </Label>
                    <div className="flex items-center gap-2">
                      {generatingImage && (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">
                            {language === 'ar' ? 'توليد باستخدام Gemini...' : 'Génération avec Gemini...'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {suggestedImage && !generatingImage && (
                    <>
                      <div className="relative rounded-lg overflow-hidden border-2 border-border bg-muted">
                        {!imageLoadError ? (
                          <img
                            src={suggestedImage}
                            alt={language === 'ar' ? 'صورة مقترحة' : 'Image suggérée'}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              console.error('Image load error for URL:', suggestedImage);
                              setImageLoadError(true);
                              // Show warning message but don't block the UI
                              toast.warning(language === 'ar' 
                                ? 'فشل تحميل الصورة. سيتم استخدام صورة الدورة الحالية' 
                                : 'Échec du chargement de l\'image. L\'image de la formation sera utilisée');
                            }}
                            onLoad={() => {
                              // Image loaded successfully
                              setImageLoadError(false);
                              console.log('Image loaded successfully:', suggestedImage);
                            }}
                          />
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center bg-muted text-muted-foreground">
                            <div className="text-center p-4">
                              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">
                                {language === 'ar' 
                                  ? 'فشل تحميل الصورة' 
                                  : 'Échec du chargement de l\'image'}
                              </p>
                              <p className="text-xs mt-1 opacity-75">
                                {language === 'ar' 
                                  ? 'سيتم استخدام صورة الدورة' 
                                  : 'L\'image de la formation sera utilisée'}
                              </p>
                            </div>
                          </div>
                        )}
                        {approvedImage === suggestedImage && !imageLoadError && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={approvedImage === suggestedImage ? "default" : "outline"}
                          onClick={() => {
                            setApprovedImage(suggestedImage);
                            toast.success(language === 'ar' ? 'تم اعتماد الصورة' : 'Image approuvée');
                          }}
                          className="flex-1"
                        >
                          <Check className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                          {language === 'ar' ? 'اعتماد' : 'Approuver'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            // Generate a new image
                            setImageLoadError(false); // Reset error state
                            const newImage = await generateImageForFormation(suggestedFormation.formation);
                            if (newImage) {
                              setSuggestedImage(newImage);
                              setApprovedImage(null);
                            }
                          }}
                          disabled={generatingImage}
                        >
                          <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${generatingImage ? 'animate-spin' : ''}`} />
                          {language === 'ar' ? 'تغيير' : 'Changer'}
                        </Button>
                        {approvedImage === suggestedImage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setApprovedImage(null);
                              toast.info(language === 'ar' ? 'تم إلغاء اعتماد الصورة' : 'Approbation annulée');
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {approvedImage === suggestedImage && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {language === 'ar' ? 'الصورة معتمدة - سيتم استخدامها عند النشر' : 'Image approuvée - sera utilisée lors de la publication'}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateAndPublishBilingual}
                  disabled={generatingBilingual || savingBilingual || (suggestedImage && !approvedImage)}
                  className="flex-1"
                >
                  {(generatingBilingual || savingBilingual) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Wand2 className="w-4 h-4 mr-2" />
                  {language === 'ar' 
                    ? 'إنشاء ونشر بالعربية والفرنسية' 
                    : 'Générer et publier (FR + AR)'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuggestedFormation(null);
                    setSubject('');
                    setSuggestedImage(null);
                    setApprovedImage(null);
                    setImageLoadError(false);
                  }}
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </Button>
              </div>
              
              {suggestedImage && !approvedImage && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {language === 'ar' 
                    ? '⚠️ يرجى اعتماد الصورة قبل النشر' 
                    : '⚠️ Veuillez approuver l\'image avant la publication'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'توليد بالمحتوى' : 'Génération IA'}</CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'اختر موضوعاً أو الصقه، ثم اطلب من Gemini توليد مقال.'
                : 'Choisissez ou saisissez un sujet, puis laissez Gemini générer un article.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الموضوع' : 'Sujet'}</Label>
              <Input
                dir={dir}
                placeholder={placeholderSubject}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleGenerate} disabled={generating}>
                {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Wand2 className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'توليد بالمحتوى' : 'Générer avec l’IA'}
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={saving || !draft}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'حفظ في Supabase' : 'Enregistrer dans Supabase'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'استيراد JSON' : 'Importer depuis JSON'}</CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'الصق JSON لمقال (title, excerpt, content, image_url, tags, slug اختياري).'
                : 'Collez un JSON d’article (title, excerpt, content, image_url, tags, slug optionnel).'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={6}
              placeholder='{"title": "...", "excerpt": "...", "content": "...", "image_url": "...", "tags": ["..."]}'
              dir={dir}
            />
            <Button variant="outline" onClick={handleImportJson}>
              <Upload className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'استيراد' : 'Importer'}
            </Button>
          </CardContent>
        </Card>

        {draft && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'المعاينة' : 'Aperçu'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'تحقق من البيانات قبل الحفظ.' : 'Vérifiez les données avant sauvegarde.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge>{language.toUpperCase()}</Badge>
                {draft.slug && <Badge variant="outline">slug: {draft.slug}</Badge>}
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'العنوان' : 'Titre'}</Label>
                <Input value={draft.title} readOnly dir={dir} />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الملخص' : 'Extrait'}</Label>
                <Textarea value={draft.excerpt} readOnly dir={dir} />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'المحتوى' : 'Contenu'}</Label>
                <Textarea value={draft.content} readOnly dir={dir} rows={8} />
              </div>
              {draft.tags && (
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الوسوم' : 'Tags'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {draft.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {draft.image_url && (
                <div className="space-y-2">
                  <Label>Image</Label>
                  <a className="text-primary underline break-all" href={draft.image_url} target="_blank" rel="noreferrer">
                    {draft.image_url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'معاينة المقالات' : 'Aperçu des articles'}
              </DialogTitle>
              <DialogDescription>
                {language === 'ar' 
                  ? 'راجع المقالات قبل النشر. يمكنك التبديل بين النسخة الفرنسية والعربية.' 
                  : 'Vérifiez les articles avant publication. Vous pouvez basculer entre les versions française et arabe.'}
              </DialogDescription>
            </DialogHeader>

            {previewArticles && (
              <div className="space-y-6">
                {/* Language Toggle */}
                <div className="flex gap-2 justify-center">
                  <Button
                    variant={language === 'fr' ? 'default' : 'outline'}
                    onClick={() => setLanguage('fr')}
                    size="sm"
                  >
                    Français
                  </Button>
                  <Button
                    variant={language === 'ar' ? 'default' : 'outline'}
                    onClick={() => setLanguage('ar')}
                    size="sm"
                  >
                    العربية
                  </Button>
                </div>

                {/* Article Preview */}
                <div className="border rounded-lg p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-2">
                      {language === 'fr' ? previewArticles.fr.title : previewArticles.ar.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {language === 'fr' ? previewArticles.fr.excerpt : previewArticles.ar.excerpt}
                    </p>
                  </div>
                  
                  {previewArticles.fr.image_url && (
                    <img 
                      src={previewArticles.fr.image_url} 
                      alt={previewArticles.fr.title}
                      className="w-full h-64 object-cover rounded-lg mb-4"
                    />
                  )}

                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: language === 'fr' ? previewArticles.fr.content : previewArticles.ar.content 
                    }}
                  />

                  {previewArticles.fr.tags && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(language === 'fr' ? previewArticles.fr.tags : previewArticles.ar.tags)?.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </Button>
              <Button 
                onClick={handlePublishFromPreview} 
                disabled={savingBilingual}
              >
                {savingBilingual ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'ar' ? 'جاري النشر...' : 'Publication...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'نشر المقالات' : 'Publier les articles'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default BlogAI;
