/**
 * Admin page to import courses from HTML
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/admin/AdminLayout';
import { SupabaseService } from '@/lib/supabase';
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const ImportCourse = () => {
  const [htmlContent, setHtmlContent] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await SupabaseService.getCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  const parseHTML = (html: string) => {
    // Extract title
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract image URL - look in Objectifs section first, then anywhere
    let imageUrl = '';
    const objectivesSectionForImage = html.match(/<h2[^>]*>Objectifs<\/h2>[\s\S]*?<\/section>/i);
    if (objectivesSectionForImage) {
      const imgMatch = objectivesSectionForImage[0].match(/<img[^>]+src="([^"]+)"[^>]*>/i);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }
    // Fallback: search entire HTML
    if (!imageUrl) {
      const imageMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*alt="[^"]*Formation[^"]*"/i);
      if (imageMatch) {
        imageUrl = imageMatch[1];
      } else {
        // Try any img tag
        const anyImgMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
        if (anyImgMatch) {
          imageUrl = anyImgMatch[1];
        }
      }
    }

    // Extract reference
    const referenceMatch = html.match(/Référence:.*?<span[^>]*>([^<]+)<\/span>/i);
    const reference = referenceMatch ? referenceMatch[1].trim() : '';

    // Extract duration
    const durationMatch = html.match(/Durée:.*?<span[^>]*>([^<]+)<\/span>/i);
    const duration = durationMatch ? durationMatch[1].trim() : '';

    // Extract prices - handle formats like "30 000,00 DA / HT" or "32700 DA / TTC"
    const priceHTMatch = html.match(/(\d+(?:[\s,]\d+)*(?:[,\.]\d+)?)[\s,]*DA\s*\/\s*HT/i);
    const priceHT = priceHTMatch ? parseFloat(priceHTMatch[1].replace(/\s/g, '').replace(',', '.')) : 0;

    const priceTTCMatch = html.match(/(\d+(?:[\s,]\d+)*(?:[,\.]\d+)?)[\s,]*DA\s*\/\s*TTC/i);
    const priceTTC = priceTTCMatch ? parseFloat(priceTTCMatch[1].replace(/\s/g, '').replace(',', '.')) : 0;

    // Extract objectives
    const objectives: string[] = [];
    const objectivesSection = html.match(/<h2[^>]*>Objectifs<\/h2>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i);
    if (objectivesSection) {
      const objectivesList = objectivesSection[1];
      const objectiveItems = objectivesList.matchAll(/<li[^>]*>.*?<span[^>]*>([^<]+)<\/span><\/li>/g);
      for (const match of objectiveItems) {
        objectives.push(match[1].trim());
      }
    }

    // Extract program - look for sections inside border-l-4 divs
    const programSections: string[] = [];
    // Match div with border-l-4 containing h4 and ul
    const programMatches = html.matchAll(/<div[^>]*class="[^"]*border-l-4[^"]*"[^>]*>[\s\S]*?<h4[^>]*>([^<]+)<\/h4>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>[\s\S]*?<\/div>/g);
    for (const match of programMatches) {
      const sectionTitle = match[1].trim();
      const sectionItems = match[2].matchAll(/<li[^>]*>([^<]+)<\/li>/g);
      const items: string[] = [];
      for (const item of sectionItems) {
        items.push(item[1].trim());
      }
      if (items.length > 0) {
        programSections.push(`<h3>${sectionTitle}</h3><ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`);
      }
    }
    // Fallback: if no border-l-4 divs found, try the old pattern
    if (programSections.length === 0) {
      const fallbackMatches = html.matchAll(/<h4[^>]*>([IVX]+\.\s*[^<]+)<\/h4>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/g);
      for (const match of fallbackMatches) {
        const sectionTitle = match[1].trim();
        const sectionItems = match[2].matchAll(/<li[^>]*>([^<]+)<\/li>/g);
        const items: string[] = [];
        for (const item of sectionItems) {
          items.push(item[1].trim());
        }
        if (items.length > 0) {
          programSections.push(`<h3>${sectionTitle}</h3><ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`);
        }
      }
    }
    const program = programSections.join('');

    // Extract target audience
    const targetAudience: string[] = [];
    const audienceSection = html.match(/<h2[^>]*>Public Concerné<\/h2>[\s\S]*?<div[^>]*class="grid[^"]*">([\s\S]*?)<\/div>/i);
    if (audienceSection) {
      const audienceItems = audienceSection[1].matchAll(/<h3[^>]*>([^<]+)<\/h3>/g);
      for (const match of audienceItems) {
        targetAudience.push(match[1].trim().replace(/\.$/, ''));
      }
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return {
      title,
      slug,
      imageUrl,
      reference,
      duration,
      priceHT,
      priceTTC,
      objectives,
      program,
      targetAudience,
    };
  };

  const handleImport = async () => {
    if (!htmlContent.trim()) {
      toast.error('Veuillez coller le contenu HTML');
      return;
    }

    try {
      setImporting(true);
      setResult(null);

      const parsed = parseHTML(htmlContent);
      
      if (!parsed.title) {
        toast.error('Impossible d\'extraire le titre du HTML');
        return;
      }

      // Get category
      let categoryId: string | undefined;
      if (categorySlug) {
        const category = categories.find(cat => cat.slug === categorySlug);
        if (category) {
          categoryId = category.id;
        }
      }

      const description = parsed.objectives[0] || parsed.title;

      const formationData: any = {
        title: parsed.title,
        title_fr: parsed.title,
        slug: parsed.slug,
        description,
        description_fr: description,
        content: htmlContent,
        content_fr: htmlContent,
        image_url: parsed.imageUrl,
        cover_image_url: parsed.imageUrl,
        price: parsed.priceTTC || parsed.priceHT || 0,
        price_ht: parsed.priceHT,
        price_ttc: parsed.priceTTC,
        currency: 'DZD',
        duration: parsed.duration,
        reference: parsed.reference,
        level: 'Tous niveaux',
        max_participants: 20,
        current_participants: 0,
        rating: 0,
        is_active: true,
        is_popular: false,
        is_online: false,
        is_published: true,
        location: 'À définir',
        objectives: parsed.objectives,
        objectives_fr: parsed.objectives,
        program_fr: parsed.program,
        target_audience_fr: parsed.targetAudience,
        category_id: categoryId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await SupabaseService.createFormation(formationData);
      
      setResult({
        success: true,
        data: result,
        parsed,
      });

      toast.success('Formation importée avec succès!');
    } catch (error: any) {
      console.error('Error importing course:', error);
      setResult({
        success: false,
        error: error.message,
      });
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Importer une formation depuis HTML</h1>
          <p className="text-gray-600 mt-1">Collez le contenu HTML de la formation pour l'importer automatiquement</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contenu HTML</CardTitle>
            <CardDescription>
              Collez le code HTML complet de la page de formation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">Catégorie (optionnel)</Label>
              <Select value={categorySlug} onValueChange={setCategorySlug}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name_fr || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="html">Contenu HTML</Label>
              <Textarea
                id="html"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Collez le HTML ici..."
                rows={20}
                className="font-mono text-sm"
              />
            </div>

            <Button onClick={handleImport} disabled={importing || !htmlContent.trim()}>
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importer la formation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Import réussi
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    Erreur d'import
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-2">
                  <p><strong>Titre:</strong> {result.parsed.title}</p>
                  <p><strong>Slug:</strong> {result.data.slug}</p>
                  <p><strong>Prix HT:</strong> {result.parsed.priceHT} DA</p>
                  <p><strong>Prix TTC:</strong> {result.parsed.priceTTC} DA</p>
                  <p><strong>Durée:</strong> {result.parsed.duration}</p>
                  <p><strong>Référence:</strong> {result.parsed.reference}</p>
                  <p className="mt-4">
                    <a 
                      href={`/fr/formation/${result.data.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Voir la formation →
                    </a>
                  </p>
                </div>
              ) : (
                <p className="text-red-600">{result.error}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default ImportCourse;

