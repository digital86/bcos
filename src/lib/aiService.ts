// AI Service for generating course content using Google Gemini API (via Supabase Edge Functions)

export interface CourseGenerationInput {
  title: string;
  description?: string;
  category?: string;
  price?: number;
  duration?: string;
  level?: string;
  language: 'fr' | 'ar';
  reference?: string;
  frenchContent?: string;
}

export interface CourseDocumentExtraction {
  language_detected: 'fr' | 'ar' | '';
  title_fr: string;
  description_fr: string;
  title_ar: string;
  description_ar: string;
  reference: string;
  duration: string;
  price: number;
  currency: string;
  slug: string;
  content_fr?: string;
  content_ar?: string;
}

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export interface AgendaImportItem {
  formation_title: string;
  formation_slug?: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:MM
  end_time?: string; // HH:MM
  location?: string;
  is_online?: boolean;
  max_participants?: number;
  notes?: string;
}

export interface AgendaImportData {
  month: number;
  year: number;
  scheduled_formations: AgendaImportItem[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const supabaseGenerateText = async (prompt: string, systemPrompt: string | undefined, model: string): Promise<string> => {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not configured');
  }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
    },
    body: JSON.stringify({
      prompt,
      system_prompt: systemPrompt || '',
      model,
      temperature: 0.6,
      maxOutputTokens: 10000,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt);
  }
  const data = await res.json();
  return data.content || '';
};

const supabaseGenerateTextWithParts = async (parts: GeminiPart[], systemPrompt: string | undefined, model: string): Promise<string> => {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not configured');
  }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
    },
    body: JSON.stringify({
      prompt: 'Analyze the attached document.',
      parts,
      system_prompt: systemPrompt || '',
      model,
      temperature: 0.2,
      maxOutputTokens: 10000,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt);
  }
  const data = await res.json();
  return data.content || '';
};

export class AIService {
  /**
   * Universal extractor for both files (base64) and raw text/HTML
   */
  static async extractCourseFromSource(source: { base64?: string; mimeType?: string; text?: string }): Promise<CourseDocumentExtraction> {
    const systemPrompt = 'Return text with explicit xml tags as instructed. Do not use markdown blocks around them, no JSON.';
    
    // Build templates for the prompt as EXAMPLES with 3 days pricing
    let frTemplate = this.buildPrompt({ title: 'Titre de la formation', description: 'Description...', language: 'fr', duration: '3 jours' });
    frTemplate = frTemplate.replace("Réponds UNIQUEMENT avec le code HTML, sans explications ni commentaires supplémentaires.", "METTRE LE HTML FINAL OBLIGATOIREMENT ENTRE LES BALISES <HTML_FR> ET </HTML_FR>");

    let arTemplate = this.buildPrompt({ title: 'عنوان الدورة', description: 'وصف الدورة...', language: 'ar', duration: '3 أيام' });
    arTemplate = arTemplate.replace("أجب فقط بـ HTML بدون شرح أو تعليقات.", "تأكد من وضع الكود النهائي حصراً داخل علامات <HTML_AR> و </HTML_AR>");

    const prompt = `Extract course details and generate professional HTML pages from the provided source.
MANDATORY PRICING RULES:
1. If text/document duration is 2 days/يومين: Set Price HT=24 000, Price TTC=26 160.
2. If text/document duration is 3 days/أيام: Set Price HT=30 000, Price TTC=32 700.
3. NEVER leave at 0 if the duration matches these cases.

Divide your response into these XML sections:
<LANGUAGE_DETECTED>fr or ar</LANGUAGE_DETECTED>
<TITLE_FR>...</TITLE_FR>
<DESC_FR>...</DESC_FR>
<TITLE_AR>...</TITLE_AR>
<DESC_AR>...</DESC_AR>
<REFERENCE>...</REFERENCE>
<DURATION>...</DURATION>
<PRICE>Numeric only</PRICE>
<CURRENCY>DZD</CURRENCY>
<CATEGORY>...</CATEGORY>
<SLUG>...</SLUG>

<HTML_FR>
(FULL HTML using the French template structure below)
</HTML_FR>

<HTML_AR>
(FULL HTML using the Arabic template structure below)
</HTML_AR>

General Rules:
- If document is French, translate all content to Arabic for the AR tags, and vice versa.
- The HTML must follow the layouts provided exactly.
- slug must be kebab-case in latin.
- For 2 or 3 days, IGNORE any price in the document and use the MANDATORY RULES above.
- Extract the goals (Objectifs) and program from the source and format them inside the HTML.
- **IMPORTANT**: Your response must be COMPLETE. If you are running out of space, be more concise in the program descriptions but ALWAYS ensure both <HTML_FR> and <HTML_AR> are fully generated and closed. Never stop in the middle of a tag or sentence.
- Prioritize clear, professional Arabic translation.

FRENCH TEMPLATE STRUCTURE:
${frTemplate}

ARABIC TEMPLATE STRUCTURE:
${arTemplate}`;

    let generatedContent: string;
    
    if (source.text) {
      // Direct text/HTML analysis
      const fullPrompt = `${prompt}\n\nCONTENT TO ANALYZE:\n${source.text}`;
      generatedContent = await supabaseGenerateText(fullPrompt, systemPrompt, 'gemini-1.5-flash');
    } else {
      // File analysis (PDF, Image)
      const parts: GeminiPart[] = [
        { text: prompt },
        { inlineData: { mimeType: source.mimeType || 'application/pdf', data: source.base64 || '' } },
      ];
      generatedContent = await supabaseGenerateTextWithParts(parts, systemPrompt, 'gemini-1.5-flash');
    }

    try {
      const raw = generatedContent.trim();
      console.log('AI RAW OUTPUT:', raw);
      
      const getTag = (tag: string) => {
        const match = raw.match(new RegExp(`<${tag}>([\\s\\S]*?)(?:<\\/${tag}>|$)`, 'i'));
        let res = match ? match[1].trim() : '';
        if (res.startsWith('```html')) res = res.replace(/^```html/i, '');
        else if (res.startsWith('```')) res = res.replace(/^```/i, '');
        if (res.endsWith('```')) res = res.replace(/```$/i, '');
        return res.trim();
      };
      
      return {
        language_detected: (getTag('LANGUAGE_DETECTED').toLowerCase() === 'fr' ? 'fr' : getTag('LANGUAGE_DETECTED').toLowerCase() === 'ar' ? 'ar' : '') as any,
        title_fr: getTag('TITLE_FR'),
        description_fr: getTag('DESC_FR'),
        title_ar: getTag('TITLE_AR'),
        description_ar: getTag('DESC_AR'),
        reference: getTag('REFERENCE'),
        duration: getTag('DURATION'),
        price: Number(getTag('PRICE').replace(/[^0-9.]/g, '') || 0),
        currency: getTag('CURRENCY') || 'DZD',
        slug: getTag('SLUG'),
        category: getTag('CATEGORY'),
        content_fr: sanitizeImageUrl(getTag('HTML_FR')),
        content_ar: sanitizeImageUrl(getTag('HTML_AR')),
      };
    } catch (error: any) {
      console.error('Error in extractCourseFromSource:', error);
      throw new Error(`Échec de l'analyse: ${error.message}`);
    }
  }

  /**
   * Generate category details (AR name, Slug, Icon, Descriptions) based on FR name
   */
  static async generateCategoryDetails(categoryName: string): Promise<{
    name_ar: string;
    slug: string;
    icon: string;
    description_fr: string;
    description_ar: string;
  }> {
    const prompt = `Generate professional category details for a training center based on this category name: "${categoryName}".
    
    Return EXACTLY this XML structure (no markdown):
    <NAME_AR>Arabic translation</NAME_AR>
    <SLUG>kebab-case-slug</SLUG>
    <ICON>lucide-icon-name (one of: trending-up, target, pie-chart, truck, heart, monitor, zap, award, shield, message-square, lightbulb, briefcase, user, factory, stethoscope, shopping-cart, laptop, satellite, plane)</ICON>
    <DESC_FR>Professional description in French (15-20 words)</DESC_FR>
    <DESC_AR>Professional description in Arabic (15-20 words)</DESC_AR>`;

    const systemPrompt = 'Return XML only. Use professional corporate language.';
    const response = await supabaseGenerateText(prompt, systemPrompt, 'gemini-1.5-flash');

    const getTag = (tag: string) => {
      const match = response.match(new RegExp(`<${tag}>([\\s\\S]*?)(?:<\\/${tag}>|$)`, 'i'));
      return match ? match[1].trim() : '';
    };

    return {
      name_ar: getTag('NAME_AR'),
      slug: getTag('SLUG'),
      icon: getTag('ICON'),
      description_fr: getTag('DESC_FR'),
      description_ar: getTag('DESC_AR'),
    };
  }

  /**
   * Legacy method name kept for compatibility
   */
  static async extractCourseFromDocument(input: { base64: string; mimeType: string }): Promise<CourseDocumentExtraction> {
    return this.extractCourseFromSource(input);
  }

  /**
   * Generate complete HTML content for a course using AI
   */
  static async generateCourseContent(input: CourseGenerationInput): Promise<string> {
    try {
      const prompt = this.buildPrompt(input);
      const systemPrompt = 'Tu es un expert en création de contenu pour formations professionnelles. Réponds uniquement avec le code HTML demandé.';
      const generatedContent = await supabaseGenerateText(prompt, systemPrompt, 'gemini-1.5-pro');

      // Clean up the response
      let cleanedContent = generatedContent.trim();
      if (cleanedContent.startsWith('```html')) {
        cleanedContent = cleanedContent.replace(/^```html\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return sanitizeImageUrl(cleanedContent);
    } catch (error: any) {
      console.error('Error generating course content:', error);
      throw new Error(`Erreur lors de la génération du contenu: ${error.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Build prompt for AI generation based on input
   */
  private static buildPrompt(input: CourseGenerationInput): string {
    const { title, description, category, price, duration, level, language, reference, image_url } = input;
    const courseReference = reference || `FORM-${title.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}`;
    const courseImage = image_url || '[COURSE_IMAGE]';
    
    let priceHT = price || 0;
    let priceTTC = Math.round(priceHT * 1.19 * 100) / 100;

    // Apply business rules for pricing based on duration
    const dur = (duration || '').toLowerCase();
    const is2Days = dur.includes('2') && (dur.includes('jour') || dur.includes('يوم'));
    const is3Days = dur.includes('3') && (dur.includes('jour') || dur.includes('يوم'));

    if (is2Days) {
      priceHT = 24000;
      priceTTC = 26160;
    } else if (is3Days) {
      priceHT = 30000;
      priceTTC = 32700;
    }

    const priceHTStr = priceHT > 0 ? priceHT.toLocaleString('fr-FR') : '[PRICE_HT]';
    const priceTTCStr = priceTTC > 0 ? priceTTC.toLocaleString('fr-FR') : '[PRICE_TTC]';
    const durationStr = duration || '[DURATION]';

    if (language === 'fr') {
      return `Génère une page HTML complète pour une formation professionnelle:
<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Formation: \${title}</title>
    <style>
        @import url(https://fonts.googleapis.com/css2?family=Lato&display=swap);
        @import url(https://fonts.googleapis.com/css2?family=Open+Sans&display=swap);
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
        @import url(https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200);
        html { scroll-behavior: smooth; }
        #gsRegistrationForm { scroll-margin-top: 80px; }
        body { font-family: 'Open Sans', 'Cairo', sans-serif; background-color: #f8fafc; }
        .program-sublist { list-style-type: disc; margin-left: 1.5rem; }
    </style>
</head>
<body data-rsssl=1>
    <div id="webcrumbs">
        <div class="w-full max-w-5xl bg-white font-sans mx-auto shadow-sm">
            <header class="py-8 sm:py-12 px-4 sm:px-12 text-center border-b border-gray-100">
                <div class="text-lg sm:text-2xl font-bold text-gray-500 mb-1 sm:mb-2">Formation</div>
                <h1 class="text-3xl md:text-5xl font-bold text-green-600 mb-2">\${title}</h1>
            </header>

            <section class="px-4 sm:px-12 py-10 sm:py-16">
                <h2 class="text-2xl sm:text-3xl font-semibold text-gray-800 mb-8 sm:mb-10 flex items-center justify-center gap-3">
                    <span class="material-symbols-outlined text-blue-600">task_alt</span>
                    <span>Objectifs</span>
                </h2>
                <div class="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
                    <div class="w-full md:w-2/5">
                        <img src="${courseImage}" class="w-full h-auto rounded-xl shadow-md" />
                    </div>
                    <div class="w-full md:w-3/5">
                        <ul class="space-y-4">
                            <li class="flex items-start">
                                <span class="material-symbols-outlined text-green-500 mr-3 mt-1">check_circle</span>
                                <span class="text-gray-700">Objectif 1</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <section class="px-4 sm:px-12 py-10 sm:py-16 bg-blue-50">
                <h2 class="text-2xl sm:text-3xl font-semibold text-gray-800 mb-8 sm:mb-10 flex items-center justify-center gap-3">
                    <span class="material-symbols-outlined text-blue-600">list_alt</span>
                    <span>Programme</span>
                </h2>
                <div class="flex flex-col md:flex-row gap-12">
                    <div class="w-full md:w-1/3">
                        <div class="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                            <h3 class="text-xl font-semibold mb-5">Détails</h3>
                            <ul class="space-y-5">
                                <li class="flex items-center"><span class="material-symbols-outlined text-blue-600 mr-4">tag</span><div><span class="text-gray-500 block text-sm">Référence:</span><span class="font-medium">\${courseReference}</span></div></li>
                                <li class="flex items-center"><span class="material-symbols-outlined text-blue-600 mr-4">schedule</span><div><span class="text-gray-500 block text-sm">Durée:</span><span class="font-medium">${durationStr}</span></div></li>
                                <li class="flex items-center"><span class="material-symbols-outlined text-blue-600 mr-4">payments</span><div><span class="text-gray-500 block text-sm">Tarif:</span><span class="font-medium block" dir="ltr">${priceHTStr} DA / HT</span><span class="font-medium block mt-1" dir="ltr">${priceTTCStr} DA / TTC</span></div></li>
                            </ul>
                        </div>
                    </div>
                    <div class="w-full md:w-2/3">
                        <div class="space-y-10">
                            <div class="border-l-4 border-blue-500 pl-6">
                                <h4 class="text-xl sm:text-2xl font-bold text-green-700 mb-4">1. Titre Section</h4>
                                <div class="space-y-5">
                                    <div><h5 class="font-bold text-lg text-gray-900 mb-2">Sous-titre 1</h5></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <section class="px-4 sm:px-12 py-10 sm:py-16 bg-green-50">
                <h2 class="text-2xl sm:text-3xl font-semibold text-gray-800 mb-8 sm:mb-10 flex items-center justify-center gap-3">
                    <span class="material-symbols-outlined text-blue-600">groups</span>
                    <span>Public Concerné</span>
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow-md flex items-start">
                        <span class="material-symbols-outlined text-blue-500 mr-2 text-2xl pt-1">track_changes</span>
                        <span class="material-symbols-outlined text-blue-500 mr-3 text-2xl pt-1">arrow_forward</span>
                        <div><h3 class="font-semibold text-lg text-gray-800 mb-1">Rôle</h3></div>
                    </div>
                </div>
            </section>
        </div>
    </div>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = { content: ["./*.php", "./**/*.php", "./*.html"], theme: { extend: { fontFamily: {} } }, plugins: [], important: "#webcrumbs" }
    </script>
</body>
</html>
Réponds UNIQUEMENT avec le code HTML, sans explications ni commentaires supplémentaires.`;
    } else {
      return `Génère une page HTML complète pour une formation professionnelle:
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>دورة تدريبية: \${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
        @import url(https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200);
        html { scroll-behavior: smooth; }
        body { font-family: 'Cairo', sans-serif; background-color: #f8fafc; }
    </style>
</head>
<body data-rsssl=1>
    <div id="webcrumbs">
        <div class="w-full max-w-5xl bg-white font-sans mx-auto shadow-sm">
            <header class="py-8 sm:py-12 px-4 sm:px-12 text-center border-b border-gray-100">
                <div class="text-lg sm:text-2xl font-bold text-gray-500 mb-1 sm:mb-2">دورة تدريبية</div>
                <h1 class="text-3xl md:text-5xl font-bold text-green-600 mb-2">\${title}</h1>
            </header>
            <!-- Same structure as French but translated contents -->
            <section class="px-4 sm:px-12 py-10 sm:py-16">
                <h2 class="text-2xl sm:text-3xl font-semibold text-gray-800 mb-8 sm:mb-10 flex items-center justify-center gap-3">
                    <span class="material-symbols-outlined text-blue-600">task_alt</span>
                    <span>الأهداف</span>
                </h2>
                <div class="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
                    <div class="w-full md:w-2/5">
                        <img src="${courseImage}" class="w-full h-auto rounded-xl shadow-md" />
                    </div>
                    <div class="w-full md:w-3/5">
                        <ul class="space-y-4">
                            <li class="flex items-start">
                                <span class="material-symbols-outlined text-green-500 ml-3 mt-1">check_circle</span>
                                <span class="text-gray-700">هدف 1</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <section class="px-4 sm:px-12 py-10 sm:py-16 bg-blue-50">
                <h2 class="text-2xl sm:text-3xl font-semibold text-gray-800 mb-8 sm:mb-10 flex items-center justify-center gap-3">
                    <span class="material-symbols-outlined text-blue-600">list_alt</span>
                    <span>البرنامج التدريبي</span>
                </h2>
                <div class="flex flex-col md:flex-row gap-12">
                    <div class="w-full md:w-1/3">
                        <div class="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                            <h3 class="text-xl font-semibold mb-5">تفاصيل الدورة</h3>
                            <ul class="space-y-5">
                                <li class="flex items-center"><span class="material-symbols-outlined text-blue-600 ml-4">tag</span><div><span class="text-gray-500 block text-sm">المرجع:</span><span class="font-medium">${courseReference}</span></div></li>
                                <li class="flex items-center"><span class="material-symbols-outlined text-blue-600 ml-4">schedule</span><div><span class="text-gray-500 block text-sm">المدة:</span><span class="font-medium">${durationStr}</span></div></li>
                                <li class="flex items-center"><span class="material-symbols-outlined text-blue-600 ml-4">payments</span><div><span class="text-gray-500 block text-sm">السعر:</span><span class="font-medium block" dir="ltr">${priceHTStr} DA / HT</span><span class="font-medium block mt-1" dir="ltr">${priceTTCStr} DA / TTC</span></div></li>
                            </ul>
                        </div>
                    </div>
                    <div class="w-full md:w-2/3">
                        <div class="space-y-10" id="program-content">
                            <div class="border-r-4 border-blue-500 pr-6">
                                <h4 class="text-2xl font-bold text-green-700 mb-4">1. عنوان القسم</h4>
                                <div class="space-y-5">
                                    <div><h5 class="font-bold text-lg text-gray-900 mb-2">عنوان فرعي 1</h5></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <section class="px-4 sm:px-12 py-10 sm:py-16 bg-green-50">
                <h2 class="text-2xl sm:text-3xl font-semibold text-gray-800 mb-8 sm:mb-10 flex items-center justify-center gap-3">
                    <span class="material-symbols-outlined text-blue-600">groups</span>
                    <span>الفئة المستهدفة</span>
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow-md flex items-start">
                        <span class="material-symbols-outlined text-blue-500 ml-2 text-2xl pt-1">track_changes</span>
                        <span class="material-symbols-outlined text-blue-500 ml-3 text-2xl pt-1">arrow_forward</span>
                        <div><h3 class="font-semibold text-lg text-gray-800 mb-1">الصفة الوظيفية</h3></div>
                    </div>
                </div>
            </section>
        </div>
    </div>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = { content: ["./*.php", "./**/*.php", "./*.html"], theme: { extend: { fontFamily: {} } }, plugins: [], important: "#webcrumbs" }
    </script>
</body>
</html>
أجب فقط بـ HTML بدون شرح أو تعليقات.`;
    }
  }

  /**
   * Analyze agenda image and extract scheduled formations as JSON
   */
  static async analyzeAgendaImage(imageBase64: string, month: number, year: number): Promise<AgendaImportData> {
    const prompt = `Analyze this agenda calendar for \${month}/\${year}. Extract scheduled formations as JSON with structure: { month: number, year: number, scheduled_formations: [{ formation_title: string, formation_slug: string, scheduled_date: "YYYY-MM-DD", scheduled_time: "HH:MM" }] }. Return only JSON.`;
    const sys = 'Return valid JSON only.';
    const parts: GeminiPart[] = [
      { text: prompt },
      { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
    ];

    try {
      const response = await supabaseGenerateTextWithParts(parts, sys, 'gemini-1.5-pro');
      let jsonString = response.trim();
      if (jsonString.includes('```json')) {
        jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      }
      return JSON.parse(jsonString) as AgendaImportData;
    } catch (error: any) {
      throw new Error(`Erreur lors de l'analyse de l'image: ${error.message}`);
    }
  }

  /**
   * Generate an image using AI (Gemini Image model via Supabase Edge Function)
   */
  static async generateCourseImage(input: { prompt: string; titleFr?: string; language?: string }): Promise<string> {
    if (!SUPABASE_URL) {
      throw new Error('Supabase URL not configured');
    }
    
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify({
        prompt: input.prompt,
        titleFr: input.titleFr,
        language: input.language || 'fr'
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt);
    }

    const data = await res.json();
    if (data.imageBase64) {
      return `data:image/png;base64,${data.imageBase64}`;
    } else if (data.diagnostic) {
      throw new Error(`Diagnostic AI: ${data.diagnostic}`);
    } else {
      throw new Error("L'image n'a pas pu être générée correctement");
    }
  }

  /**
   * Convert image file to base64
   */
  static async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static async getChatResponse(messages: { role: 'user' | 'assistant'; content: string }[], knowledgeBase: string = '') {
    const systemPrompt = `Vous êtes l'assistant intelligent de BCOS (Business Center Optimization Services), un centre de formation professionnelle d'élite à Alger.

VOTRE MISSION : 
Aider les visiteurs à choisir la meilleure formation selon leurs besoins. Vous êtes expert, courtois و persuasif.

CONTEXTE BCOS :
- Localisation : Alger, Algérie.
- Services : Formations certifiantes, Accélérateur de projets, Coaching spécialisé.

NOS FORMATIONS ACTUELLES (Contexte en temps réel) :
${knowledgeBase || 'Consultez notre catalogue sur le site.'}

CONSIGNES :
1. Répondez toujours en français (ou arabe si l'utilisateur l'utilise).
2. Soyez concis و allez droit au but.
3. Si un utilisateur s'intéresse à une formation, encouragez-le à s'inscrire via le bouton "S'inscrire" sur la page de la formation.
4. Identifiez-vous comme "L'Assistant BCOS".`;

    const chatHistoryPrompt = messages.map(m => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.content}`).join('\n');
    const fullPrompt = `${chatHistoryPrompt}\nAssistant:`;

    return supabaseGenerateText(fullPrompt, systemPrompt, 'gemini-1.5-flash');
  }
}

/**
 * Sanitizes image URLs in HTML content
 * Replaces placeholders and ensures URLs are valid
 */
function sanitizeImageUrl(content: string): string {
  if (!content) return '';
  
  // Replace [COURSE_IMAGE] placeholder with a generic default from public folder
  let sanitized = content.replace(/\[COURSE_IMAGE\]/g, '/hero-intra.png');
  
  // Also handle common placeholder patterns if the AI hallucinates filenames
  // If the AI provides a filename without a path and it's not a known asset, 
  // we could potentially fallback to/hero-intra.png, but let's stick to explicit placeholders for now.
  
  return sanitized;
}
