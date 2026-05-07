import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategories } from '@/hooks/useSupabase';
import { SupabaseService } from '@/lib/supabase';
import { AIService } from '@/lib/aiService';
import type { Formation } from '../../../supabase-config';
import { 
  Save, 
  X, 
  Upload, 
  BookOpen,
  Globe,
  Image as ImageIcon,
  Loader2,
  Code,
  Sparkles,
  Check,
  Search,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import MediaPicker from './MediaPicker';
import { Checkbox } from '@/components/ui/checkbox';
import HTMLEditor from './HTMLEditor';
import { optimizeImage } from '@/utils/imageUtils';

interface BilingualCourseFormProps {
  course?: Formation | null;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit' | 'duplicate';
  onSave: () => void;
}

const BilingualCourseForm = ({ course, isOpen, onClose, mode, onSave }: BilingualCourseFormProps) => {
  const { categories } = useCategories();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importText, setImportText] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [singleCategorySelection, setSingleCategorySelection] = useState(true);
  
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const effectiveMode: 'create' | 'edit' | 'duplicate' = mode || (course ? 'edit' : 'create');
  
  const [formData, setFormData] = useState({
    // General
    is_published: true,
    category_id: '', // Keep for backward compatibility
    reference: '',
    slug: '',
    tags: [] as string[],
    
    // French
    title_fr: '',
    description_fr: '',
    content_fr: '',
    objectives_fr: [] as string[],
    prerequisites_fr: '',
    program_fr: '',
    target_audience_fr: '',
    
    // Arabic
    title_ar: '',
    description_ar: '',
    content_ar: '',
    objectives_ar: [] as string[],
    prerequisites_ar: '',
    program_ar: '',
    target_audience_ar: '',
    
    // Pricing
    price_ht: 0,
    price_ttc: 0,
    currency: 'EUR',
    
    // Media
    cover_image_url: '',
    
    // Legacy fields (for backward compatibility)
    title: '',
    description: '',
    content: '',
    duration: '1 jour',
    level: 'Tous niveaux' as const,
    price: 0,
    max_participants: 20,
    is_online: false,
    is_popular: false,
    is_active: true,
  });

  const [objectiveFrInput, setObjectiveFrInput] = useState('');
  const [objectiveArInput, setObjectiveArInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [contentFrMode, setContentFrMode] = useState<'editor' | 'html'>('editor');
  const [contentArMode, setContentArMode] = useState<'editor' | 'html'>('editor');
  const [generatingFr, setGeneratingFr] = useState(false);
  const [generatingAr, setGeneratingAr] = useState(false);

  // Initialize form data when course is provided
  useEffect(() => {
    setImportFile(null);
    if (course) {
      // Load categories for this course
      const loadCourseCategories = async () => {
        try {
          const courseCategories = await SupabaseService.getFormationCategories(course.id);
          setSelectedCategoryIds(courseCategories.map(cat => cat.id));
        } catch (error) {
          console.error('Error loading course categories:', error);
          // Fallback to single category_id
          if (course.category_id) {
            setSelectedCategoryIds([course.category_id]);
          }
        }
      };
      loadCourseCategories();
      
      const baseForm = {
        is_published: course.is_published ?? course.is_active ?? true,
        category_id: course.category_id || '',
        reference: course.reference || '',
        slug: course.slug || '',
        tags: course.tags || [],
        title_fr: course.title_fr || course.title || '',
        description_fr: course.description_fr || course.description || '',
        content_fr: course.content_fr || course.content || '',
        objectives_fr: course.objectives_fr || course.objectives || [],
        prerequisites_fr: course.prerequisites_fr || course.prerequisites || '',
        program_fr: course.program_fr || '',
        target_audience_fr: course.target_audience_fr || '',
        title_ar: course.title_ar || '',
        description_ar: course.description_ar || '',
        content_ar: course.content_ar || '',
        objectives_ar: course.objectives_ar || [],
        prerequisites_ar: course.prerequisites_ar || '',
        program_ar: course.program_ar || '',
        target_audience_ar: course.target_audience_ar || '',
        price_ht: course.price_ht || course.price || 0,
        price_ttc: course.price_ttc || (course.price ? course.price * 1.19 : 0),
        currency: course.currency || 'EUR',
        cover_image_url: course.cover_image_url || course.image_url || '',
        title: course.title || '',
        description: course.description || '',
        content: course.content || '',
        duration: course.duration || '1 jour',
        level: course.level || 'Tous niveaux',
        price: course.price || 0,
        max_participants: course.max_participants || 20,
        is_online: course.is_online || false,
        is_popular: course.is_popular || false,
        is_active: course.is_active ?? true,
      };
      if (effectiveMode === 'duplicate') {
        const slugBase = baseForm.slug || generateSlug(baseForm.title_fr || baseForm.title || '');
        baseForm.slug = `${slugBase}-copy-${String(Date.now()).slice(-4)}`;
      }
      setFormData(baseForm);
    } else {
      // Reset form for new course
      setFormData({
        is_published: true,
        category_id: '',
        reference: '',
        slug: '',
        tags: [],
        title_fr: '',
        description_fr: '',
        content_fr: '',
        objectives_fr: [],
        prerequisites_fr: '',
        program_fr: '',
        target_audience_fr: '',
        title_ar: '',
        description_ar: '',
        content_ar: '',
        objectives_ar: [],
        prerequisites_ar: '',
        program_ar: '',
        target_audience_ar: '',
        price_ht: 0,
        price_ttc: 0,
        currency: 'EUR',
        cover_image_url: '',
        title: '',
        description: '',
        content: '',
        duration: '1 jour',
        level: 'Tous niveaux',
        price: 0,
        max_participants: 20,
        is_online: false,
        is_popular: false,
        is_active: true,
      });
    }
  }, [course, effectiveMode, isOpen]);

  // Auto-generate slug from French title
  const generateSlug = (title: string) => {
    if (!title) return '';
    return title
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => {
        const res = String(reader.result || '');
        const idx = res.indexOf('base64,');
        resolve(idx >= 0 ? res.slice(idx + 'base64,'.length) : res);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImportFromDocument = async () => {
    try {
      setImporting(true);
      let extracted;
      
      if (importText.trim()) {
        // Import from pasted text/HTML
        extracted = await AIService.extractCourseFromSource({
          text: importText.trim()
        });
      } else if (importFile) {
        // Import from file
        const isHtml = importFile.type === 'text/html' || importFile.name.endsWith('.html') || importFile.name.endsWith('.htm');
        
        if (isHtml) {
          const text = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.readAsText(importFile);
          });
          extracted = await AIService.extractCourseFromSource({ text });
        } else {
          const base64 = await readFileAsBase64(importFile);
          extracted = await AIService.extractCourseFromSource({
            base64,
            mimeType: importFile.type || 'application/octet-stream',
          });
        }
      } else {
        return;
      }

      const titleFr = String(extracted?.title_fr || '').trim();
      const descriptionFr = String(extracted?.description_fr || '').trim();
      const contentFr = String((extracted as any)?.content_fr || '').trim();
      const titleAr = String(extracted?.title_ar || '').trim();
      const descriptionAr = String(extracted?.description_ar || '').trim();
      const contentAr = String((extracted as any)?.content_ar || '').trim();
      const duration = String(extracted?.duration || '').trim();
      const price = Number(extracted?.price || 0);
      const currency = String(extracted?.currency || 'DZD').trim() || 'DZD';
      const slug = String(extracted?.slug || '').trim();
      const reference = String((extracted as any)?.reference || '').trim();
      
      const isEmptyExtraction =
        !titleFr &&
        !descriptionFr &&
        !titleAr &&
        !descriptionAr &&
        !duration &&
        (!Number.isFinite(price) || price === 0) &&
        !slug;

      // Try to match category
      const categoryName = String((extracted as any)?.category || '').trim();
      let matchedCategoryId = '';
      if (categoryName && categories.length > 0) {
        const found = categories.find(c => 
          c.name.toLowerCase().includes(categoryName.toLowerCase()) || 
          (c.name_ar && c.name_ar.includes(categoryName))
        );
        if (found) matchedCategoryId = found.id;
      }

      setFormData(prev => {
        // Calculate prices based on duration business rules
        let pHT = Number.isFinite(price) ? price : prev.price_ht;
        let pTTC = Number.isFinite(price) ? price * 1.19 : prev.price_ttc;
        const durLower = duration.toLowerCase();
        if (durLower.includes('2') && (durLower.includes('jour') || durLower.includes('يوم'))) {
          pHT = 24000;
          pTTC = 26160;
        } else if (durLower.includes('3') && (durLower.includes('jour') || durLower.includes('يوم'))) {
          pHT = 30000;
          pTTC = 32700;
        }

        return {
          ...prev,
          category_id: matchedCategoryId || prev.category_id,
          title_fr: titleFr || prev.title_fr,
          description_fr: descriptionFr || prev.description_fr,
          content_fr: contentFr || prev.content_fr,
          title_ar: titleAr || prev.title_ar,
          description_ar: descriptionAr || prev.description_ar,
          content_ar: contentAr || prev.content_ar,
          duration: duration || prev.duration,
          price_ht: pHT,
          price_ttc: pTTC,
          currency,
          reference: reference || prev.reference,
          slug: slug || (titleFr ? generateSlug(titleFr) : prev.slug || `formation-${String(Date.now()).slice(-6)}`),
          title: titleFr || prev.title || titleAr || prev.title,
          description: descriptionFr || prev.description || descriptionAr || prev.description,
          content: contentFr || prev.content || contentAr || prev.content,
          price: pHT,
        };
      });

      if (isEmptyExtraction) {
        toast.warning(
          'Import terminé لكن بدون بيانات. غالباً Edge Function generate-text غير محدّثة لدعم تحليل PDF/JPG. قم بنشر آخر نسخة من generate-text في Supabase ثم أعد المحاولة.',
          { duration: 8000 }
        );
      } else {
        toast.success('Import réussi');
        // Automatically generate cover image if title is available
        if (titleFr || titleAr) {
          setTimeout(() => {
            handleGenerateImage(titleFr || titleAr);
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-update slug when title_fr changes
    if (field === 'title_fr' && effectiveMode !== 'edit') {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
      // Also update legacy title for backward compatibility
      setFormData(prev => ({ ...prev, title: value }));
    }
  };

  const handleAddObjective = (lang: 'fr' | 'ar') => {
    const input = lang === 'fr' ? objectiveFrInput : objectiveArInput;
    if (!input.trim()) return;
    
    const field = `objectives_${lang}` as 'objectives_fr' | 'objectives_ar';
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], input.trim()]
    }));
    
    if (lang === 'fr') setObjectiveFrInput('');
    else setObjectiveArInput('');
  };

  const handleRemoveObjective = (lang: 'fr' | 'ar', index: number) => {
    const field = `objectives_${lang}` as 'objectives_fr' | 'objectives_ar';
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (!tagsInput.trim()) return;
    const newTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, ...newTags]
    }));
    setTagsInput('');
  };

  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Optimize image before upload: Convert to WebP and compress
      const optimizedDataUrl = await optimizeImage(URL.createObjectURL(file), { 
        quality: 0.6, 
        maxWidth: 1200 
      });
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', optimizedDataUrl);
      formDataUpload.append('upload_preset', 'ml_default');
      formDataUpload.append('folder', 'bcos/courses');

      const clResponse = await fetch(`https://api.cloudinary.com/v1_1/de88x1rlt/image/upload`, {
        method: 'POST',
        body: formDataUpload,
      });

      const clData = await clResponse.json();
      if (clData.error) throw new Error(clData.error.message);

      const publicUrl = clData.secure_url;
      
      // Also register in gallery
      await SupabaseService.addGalleryImage({
        title: file.name,
        url: publicUrl,
        category: 'Courses',
        status: 'active'
      });

      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }));
      toast.success('Image téléchargée avec succès');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGenerateImage = async (customPrompt?: string) => {
    // Construct a rich prompt using title and description for better context
    const basePrompt = (typeof customPrompt === 'string' ? customPrompt : imagePrompt.trim()) || formData.title_fr || formData.title;
    const richPrompt = (typeof customPrompt === 'string' || imagePrompt.trim()) 
      ? basePrompt 
      : `${basePrompt}. ${formData.description_fr || ''}`.slice(0, 500);

    if (!basePrompt) {
      toast.error('Veuillez saisir un prompt ou un titre pour générer une image');
      return;
    }

    try {
      setGeneratingImage(true);
      const dataUrl = await AIService.generateCourseImage({
        prompt: richPrompt,
        titleFr: formData.title_fr || (typeof customPrompt === 'string' ? customPrompt : ''),
        language: 'fr'
      });

      // Optimize generated image: Convert to WebP and compress significantly
      const optimizedDataUrl = await optimizeImage(dataUrl, { 
        quality: 0.5, // High compression for AI generated images
        maxWidth: 1000 
      });

      // Upload Optimized Data URL to Cloudinary
      const formDataUpload = new FormData();
      formDataUpload.append('file', optimizedDataUrl);
      formDataUpload.append('upload_preset', 'ml_default');
      formDataUpload.append('folder', 'bcos/generated');

      const clResponse = await fetch(`https://api.cloudinary.com/v1_1/de88x1rlt/image/upload`, {
        method: 'POST',
        body: formDataUpload,
      });

      const clData = await clResponse.json();
      if (clData.error) throw new Error(clData.error.message);

      const publicUrl = clData.secure_url;

      // Also register in gallery so it shows up in media library
      await SupabaseService.addGalleryImage({
        title: `AI: ${basePrompt}`,
        url: publicUrl,
        category: 'Courses',
        status: 'active'
      });

      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }));
      toast.success('Image générée et sauvegardée !');
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error(`Erreur de génération: ${error.message}`);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateContent = async (language: 'fr' | 'ar') => {
    if (!formData.title_fr && language === 'fr') {
      toast.error('Veuillez d\'abord saisir le titre français');
      return;
    }

    if (!formData.title_ar && !formData.title_fr && language === 'ar') {
      toast.error('Veuillez d\'abord saisir le titre');
      return;
    }

    try {
      if (language === 'fr') {
        setGeneratingFr(true);
      } else {
        setGeneratingAr(true);
      }

      const selectedCategory = categories.find(cat => cat.id === formData.category_id);
      
      // If Arabic and French content exists, translate it
      if (language === 'ar' && formData.content_fr) {
        const generatedContent = await AIService.generateCourseContent({
          title: formData.title_ar || formData.title_fr,
          description: formData.description_ar || formData.description_fr,
          category: selectedCategory?.name,
          price: formData.price_ht || formData.price,
          duration: formData.duration,
          level: formData.level,
          language: 'ar',
          reference: formData.reference,
          image_url: formData.cover_image_url,
          frenchContent: formData.content_fr, // Pass French content for translation
        });
        handleInputChange('content_ar', generatedContent);
        toast.success('تم توليد المحتوى العربي بنجاح!');
      } else {
        // Generate new content
        const generatedContent = await AIService.generateCourseContent({
          title: language === 'fr' ? formData.title_fr : (formData.title_ar || formData.title_fr),
          description: language === 'fr' ? formData.description_fr : formData.description_ar,
          category: selectedCategory?.name,
          price: formData.price_ht || formData.price,
          duration: formData.duration,
          level: formData.level,
          language: language,
          reference: formData.reference,
          image_url: formData.cover_image_url,
        });

        if (language === 'fr') {
          handleInputChange('content_fr', generatedContent);
          toast.success('Contenu français généré avec succès!');
        } else {
          handleInputChange('content_ar', generatedContent);
          toast.success('تم توليد المحتوى العربي بنجاح!');
        }
      }
    } catch (error: any) {
      console.error(`Error generating ${language} content:`, error);
      toast.error(`Erreur lors de la génération: ${error.message || 'Erreur inconnue'}`);
    } finally {
      if (language === 'fr') {
        setGeneratingFr(false);
      } else {
        setGeneratingAr(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validation
      if (!formData.title_fr.trim()) {
        toast.error('Le titre français est requis');
        return;
      }

      if (!formData.slug.trim()) {
        toast.error('Le slug est requis');
        return;
      }

      // Prepare data for save
      const courseData: any = {
        ...formData,
        // Convert empty strings to null for UUID fields
        category_id: formData.category_id || null,
        trainer_id: (formData as any).trainer_id || null,
        // Legacy fields for backward compatibility
        title: formData.title_fr || formData.title,
        description: formData.description_fr || formData.description,
        content: formData.content_fr || formData.content,
        objectives: formData.objectives_fr,
        price: formData.price_ht || formData.price,
        image_url: formData.cover_image_url,
        is_active: formData.is_published,
      };

      let result;
      if (course && effectiveMode === 'edit') {
        // Update existing course
        result = await SupabaseService.updateFormation(course.id, courseData);
        toast.success('Formation mise à jour avec succès');
      } else {
        // Create new course
        result = await SupabaseService.createFormation(courseData);
        toast.success('Formation créée avec succès');
      }

      // Save multiple categories
      const formationId = result?.id || (Array.isArray(result) ? result[0]?.id : null);
      if (formationId && selectedCategoryIds.length > 0) {
        try {
          console.log('Saving categories for formation:', formationId, 'Categories:', selectedCategoryIds);
          await SupabaseService.setFormationCategories(formationId, selectedCategoryIds);
          console.log('Categories saved successfully');
        } catch (categoryError: any) {
          console.error('Error saving categories:', categoryError);
          console.error('Category error details:', JSON.stringify(categoryError, null, 2));
          // Don't fail the whole save if categories fail
          toast.warning('Formation sauvegardée mais erreur lors de la sauvegarde des catégories: ' + (categoryError.message || 'Erreur inconnue'));
        }
      } else if (selectedCategoryIds.length > 0) {
        console.warn('Cannot save categories: formationId is missing', { result, selectedCategoryIds });
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {effectiveMode === 'edit' ? 'Modifier la Formation' : effectiveMode === 'duplicate' ? 'Dupliquer la Formation' : 'Nouvelle Formation'}
          </DialogTitle>
          <DialogDescription>
            Créez ou modifiez une formation avec support bilingue (Français/Arabe)
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="french">Français</TabsTrigger>
            <TabsTrigger value="arabic">عربي</TabsTrigger>
            <TabsTrigger value="media">Média</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations Générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_published">Publié</Label>
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => handleInputChange('is_published', checked)}
                  />
                </div>

                <div className="space-y-4 border-b pb-6 mb-6 bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <Label className="text-base font-semibold text-indigo-900">Analyseur de Programme (AI)</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="import_text">Coller du Texte ou HTML (Détails de la formation)</Label>
                    <Textarea 
                      id="import_text"
                      placeholder="Collez ici les détails de la formation ou un code HTML existant pour que l'IA l'analyse..."
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      rows={4}
                      className="text-sm"
                    />
                  </div>

                  <div className="text-center text-xs text-muted-foreground my-2">— OU —</div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="import_file">Fichier (PDF/JPG/PNG/HTML)</Label>
                      <Input
                        id="import_file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.html,.htm,application/pdf,image/*,text/html"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        disabled={importing}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleImportFromDocument}
                      disabled={(!importFile && !importText.trim()) || importing}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      Lancer l'analyse AI
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    L'IA va extraire le titre, les prix, la durée et générer les blocs HTML (Français/Arabe) automatiquement.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Catégories</Label>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="single_cat" className="text-xs text-muted-foreground">Sélection unique</Label>
                      <Switch
                        id="single_cat"
                        checked={singleCategorySelection}
                        onCheckedChange={setSingleCategorySelection}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-4">
                    {categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucune catégorie disponible</p>
                    ) : (
                      categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={selectedCategoryIds.includes(category.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                if (singleCategorySelection) {
                                  setSelectedCategoryIds([category.id]);
                                  setFormData(prev => ({ ...prev, category_id: category.id }));
                                } else {
                                  setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                                  if (!formData.category_id) {
                                    setFormData(prev => ({ ...prev, category_id: category.id }));
                                  }
                                }
                              } else {
                                setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id));
                                if (formData.category_id === category.id) {
                                  const nextId = selectedCategoryIds.filter(id => id !== category.id)[0] || '';
                                  setFormData(prev => ({ ...prev, category_id: nextId }));
                                }
                              }
                            }}
                          />
                          <label
                            htmlFor={`category-${category.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {category.name_ar
                              ? `${category.name_fr || category.name} — ${category.name_ar}`
                              : (category.name_fr || category.name)}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedCategoryIds.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedCategoryIds.length} catégorie(s) sélectionnée(s)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference">Référence</Label>
                    <Input
                      id="reference"
                      value={formData.reference}
                      onChange={(e) => handleInputChange('reference', e.target.value)}
                      placeholder="REF-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="formation-slug"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_ht">Prix HT (€)</Label>
                    <Input
                      id="price_ht"
                      type="number"
                      value={formData.price_ht}
                      onChange={(e) => {
                        const ht = parseFloat(e.target.value) || 0;
                        handleInputChange('price_ht', ht);
                        handleInputChange('price_ttc', ht * 1.19);
                        handleInputChange('price', ht);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_ttc">Prix TTC (€)</Label>
                    <Input
                      id="price_ttc"
                      type="number"
                      value={formData.price_ttc}
                      onChange={(e) => {
                        const ttc = parseFloat(e.target.value) || 0;
                        handleInputChange('price_ttc', ttc);
                        handleInputChange('price_ht', ttc / 1.19);
                        handleInputChange('price', ttc / 1.19);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée (Nombre de jours)</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      placeholder="ex: 3 jours / 3 أيام"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Niveau</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value: any) => handleInputChange('level', value)}
                    >
                      <SelectTrigger id="level">
                        <SelectValue placeholder="Sélectionner un niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tous niveaux">Tous niveaux</SelectItem>
                        <SelectItem value="Débutant">Débutant</SelectItem>
                        <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                        <SelectItem value="Avancé">Avancé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button type="button" onClick={handleAddTag}>Ajouter</Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* French Tab */}
          <TabsContent value="french" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Contenu Français (Généré par AI)</CardTitle>
                <CardDescription>
                  Collez ici le HTML complet généré par l'IA contenant tous les détails (objectifs, prix, programme, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title_fr">Titre *</Label>
                  <Input
                    id="title_fr"
                    value={formData.title_fr}
                    onChange={(e) => handleInputChange('title_fr', e.target.value)}
                    placeholder="Titre de la formation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_fr">Description courte</Label>
                  <Textarea
                    id="description_fr"
                    value={formData.description_fr}
                    onChange={(e) => handleInputChange('description_fr', e.target.value)}
                    placeholder="Description courte (optionnel)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content_fr" className="text-lg font-semibold">
                      Contenu HTML Complet (Généré par AI) *
                    </Label>
                    <Button
                      type="button"
                      onClick={() => handleGenerateContent('fr')}
                      disabled={generatingFr || !formData.title_fr.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {generatingFr ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Générer avec AI
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                    <div className="text-sm text-blue-800">
                      <p className="mb-2">
                        <strong>💡 Conseil:</strong> Cliquez sur "Générer avec AI" pour créer automatiquement le contenu, ou collez ici le HTML complet généré par l'IA qui contient:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Les objectifs pédagogiques</li>
                        <li>Le prix et informations de tarification</li>
                        <li>Le programme détaillé</li>
                        <li>Les prérequis</li>
                        <li>Le public concerné</li>
                        <li>Toutes les autres informations</li>
                      </ul>
                    </div>
                  </div>
                  <Textarea
                    id="content_fr"
                    value={formData.content_fr}
                    onChange={(e) => handleInputChange('content_fr', e.target.value)}
                    placeholder="Collez le HTML complet généré par l'IA ici... (peut contenir tout le contenu: objectifs, prix, programme, etc.)"
                    rows={30}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ce contenu HTML complet sera affiché directement sur la page publique de la formation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Arabic Tab */}
          <TabsContent value="arabic" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>المحتوى العربي (مولّد بالذكاء الاصطناعي)</CardTitle>
                <CardDescription dir="rtl">
                  الصق هنا HTML الكامل المولّد بالذكاء الاصطناعي الذي يحتوي على جميع التفاصيل (الأهداف، السعر، البرنامج، إلخ)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4" dir="rtl">
                <div className="space-y-2">
                  <Label htmlFor="title_ar">العنوان</Label>
                  <Input
                    id="title_ar"
                    value={formData.title_ar}
                    onChange={(e) => handleInputChange('title_ar', e.target.value)}
                    placeholder="عنوان الدورة"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_ar">الوصف القصير</Label>
                  <Textarea
                    id="description_ar"
                    value={formData.description_ar}
                    onChange={(e) => handleInputChange('description_ar', e.target.value)}
                    placeholder="وصف قصير (اختياري)"
                    rows={3}
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content_ar" className="text-lg font-semibold">
                      المحتوى HTML الكامل (مولّد بالذكاء الاصطناعي) *
                    </Label>
                    <Button
                      type="button"
                      onClick={() => handleGenerateContent('ar')}
                      disabled={generatingAr || (!formData.title_ar.trim() && !formData.title_fr.trim())}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {generatingAr ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          جاري التوليد...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          توليد بالذكاء الاصطناعي
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2" dir="rtl">
                    <div className="text-sm text-blue-800">
                      <p className="mb-2">
                        <strong>💡 نصيحة:</strong> انقر على "توليد بالذكاء الاصطناعي" لإنشاء المحتوى تلقائياً، أو الصق هنا HTML الكامل المولّد بالذكاء الاصطناعي الذي يحتوي على:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>الأهداف التعليمية</li>
                        <li>السعر ومعلومات التسعير</li>
                        <li>البرنامج المفصل</li>
                        <li>المتطلبات</li>
                        <li>الفئة المستهدفة</li>
                        <li>جميع المعلومات الأخرى</li>
                      </ul>
                    </div>
                  </div>
                  <Textarea
                    id="content_ar"
                    value={formData.content_ar}
                    onChange={(e) => handleInputChange('content_ar', e.target.value)}
                    placeholder="الصق HTML الكامل المولّد بالذكاء الاصطناعي هنا... (يمكن أن يحتوي على كل المحتوى: الأهداف، السعر، البرنامج، إلخ)"
                    rows={30}
                    className="font-mono text-sm"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500 mt-1" dir="rtl">
                    سيتم عرض محتوى HTML الكامل هذا مباشرة على الصفحة العامة للدورة.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Image de Couverture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.cover_image_url && (
                  <div className="relative">
                    <img
                      src={formData.cover_image_url}
                      alt="Cover"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer" 
                    onClick={() => setIsMediaPickerOpen(true)}
                  >
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-700">Choisir depuis la médiathèque</p>
                    <p className="text-xs text-gray-500 mt-1">Parcourez les images déjà téléchargées</p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <Label htmlFor="cover-upload" className="cursor-pointer">
                      <span className="text-accent hover:underline font-medium block">
                        Télécharger une nouvelle image
                      </span>
                      <input
                        id="cover-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </Label>
                    {uploadingImage && (
                      <div className="flex items-center justify-center mt-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="ml-2 text-sm">Téléchargement...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-indigo-900">Générateur d'image AI</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_prompt">Prompt pour l'image (Description visuelle)</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="image_prompt"
                        placeholder="Décrivez l'image souhaitée (ex: Réunion de travail moderne, illustration épurée...)"
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={() => handleGenerateImage()}
                        disabled={generatingImage}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
                      >
                        {generatingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Générer
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-[10px] text-indigo-500 italic">
                      L'IA ajoutera automatiquement le titre de la formation au bas de l'image.
                    </p>
                  </div>
                </div>

                <MediaPicker 
                  open={isMediaPickerOpen}
                  onOpenChange={setIsMediaPickerOpen}
                  onSelect={(url) => handleInputChange('cover_image_url', url)}
                  preferredType="General"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading || !formData.title_fr.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BilingualCourseForm;
