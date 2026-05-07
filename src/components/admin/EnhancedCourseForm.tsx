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
  Plus,
  Trash2,
  GripVertical,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import HTMLEditor from './HTMLEditor';
import { Badge } from '@/components/ui/badge';

interface EnhancedCourseFormProps {
  course?: Formation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

// Form field type definition
export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date';
  label_fr: string;
  label_ar: string;
  required: boolean;
  placeholder_fr?: string;
  placeholder_ar?: string;
  options?: { value: string; label_fr: string; label_ar: string }[];
  order: number;
}

const EnhancedCourseForm = ({ course, isOpen, onClose, onSave }: EnhancedCourseFormProps) => {
  const { categories } = useCategories();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showFormPreview, setShowFormPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    // General
    is_published: true,
    category_id: '',
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
    currency: 'DZD',
    
    // Media
    cover_image_url: '',
    
    // Enrollment Form Fields (NEW)
    inscription_form_fields: [] as FormField[],
    
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

  // Default form fields template
  const defaultFormFields: FormField[] = [
    {
      id: 'field_1',
      name: 'full_name',
      type: 'text',
      label_fr: 'Nom complet',
      label_ar: 'الاسم الكامل',
      required: true,
      placeholder_fr: 'Entrez votre nom complet',
      placeholder_ar: 'أدخل اسمك الكامل',
      order: 1
    },
    {
      id: 'field_2',
      name: 'email',
      type: 'email',
      label_fr: 'Email',
      label_ar: 'البريد الإلكتروني',
      required: true,
      placeholder_fr: 'votre.email@exemple.com',
      placeholder_ar: 'your.email@example.com',
      order: 2
    },
    {
      id: 'field_3',
      name: 'phone',
      type: 'phone',
      label_fr: 'Téléphone',
      label_ar: 'الهاتف',
      required: true,
      placeholder_fr: '+213 XX XX XX XX',
      placeholder_ar: '+213 XX XX XX XX',
      order: 3
    },
    {
      id: 'field_4',
      name: 'company',
      type: 'text',
      label_fr: 'Entreprise',
      label_ar: 'الشركة',
      required: false,
      placeholder_fr: 'Nom de votre entreprise',
      placeholder_ar: 'اسم شركتك',
      order: 4
    },
    {
      id: 'field_5',
      name: 'position',
      type: 'text',
      label_fr: 'Poste',
      label_ar: 'المنصب',
      required: false,
      placeholder_fr: 'Votre poste',
      placeholder_ar: 'منصبك',
      order: 5
    },
    {
      id: 'field_6',
      name: 'motivation',
      type: 'textarea',
      label_fr: 'Motivation',
      label_ar: 'الدافع',
      required: false,
      placeholder_fr: 'Pourquoi souhaitez-vous suivre cette formation?',
      placeholder_ar: 'لماذا تريد متابعة هذا التدريب؟',
      order: 6
    },
    {
      id: 'field_7',
      name: 'how_did_you_hear',
      type: 'select',
      label_fr: 'Comment avez-vous connu BCOS?',
      label_ar: 'كيف سمعت عن بيكوص؟',
      required: false,
      options: [
        { value: 'google', label_fr: 'Recherche Google', label_ar: 'بحث جوجل' },
        { value: 'social', label_fr: 'Réseaux sociaux', label_ar: 'وسائل التواصل الاجتماعي' },
        { value: 'referral', label_fr: 'Recommandation', label_ar: 'توصية' },
        { value: 'website', label_fr: 'Site web', label_ar: 'الموقع الإلكتروني' },
        { value: 'other', label_fr: 'Autre', label_ar: 'آخر' }
      ],
      order: 7
    }
  ];

  useEffect(() => {
    if (course) {
      setFormData({
        is_published: course.is_published ?? true,
        category_id: course.category_id || '',
        reference: course.reference || '',
        slug: course.slug || '',
        tags: course.tags || [],
        
        title_fr: course.title_fr || '',
        description_fr: course.description_fr || '',
        content_fr: course.content_fr || '',
        objectives_fr: course.objectives_fr || [],
        prerequisites_fr: course.prerequisites_fr || '',
        program_fr: course.program_fr || '',
        target_audience_fr: course.target_audience_fr || '',
        
        title_ar: course.title_ar || '',
        description_ar: course.description_ar || '',
        content_ar: course.content_ar || '',
        objectives_ar: course.objectives_ar || [],
        prerequisites_ar: course.prerequisites_ar || '',
        program_ar: course.program_ar || '',
        target_audience_ar: course.target_audience_ar || '',
        
        price_ht: course.price_ht || 0,
        price_ttc: course.price_ttc || 0,
        currency: course.currency || 'DZD',
        
        cover_image_url: course.cover_image_url || '',
        
        // Load custom form fields or use defaults
        inscription_form_fields: (course as any).inscription_form_fields || defaultFormFields,
        
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
      });
    } else {
      // Initialize with default form fields for new courses
      setFormData(prev => ({
        ...prev,
        inscription_form_fields: defaultFormFields
      }));
    }
  }, [course]);

  // Auto-generate slug from French title
  useEffect(() => {
    if (formData.title_fr && !course) {
      const slug = formData.title_fr
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title_fr, course]);

  // Auto-calculate TTC from HT (TVA 9%)
  useEffect(() => {
    if (formData.price_ht > 0) {
      const tva = 1.09; // 9% TVA
      const ttc = formData.price_ht * tva;
      setFormData(prev => ({ ...prev, price_ttc: Math.round(ttc * 100) / 100 }));
    }
  }, [formData.price_ht]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const filePath = `course-covers/${Date.now()}-${file.name}`;
      const imageUrl = await SupabaseService.uploadFile('course-covers', filePath, file);
      setFormData(prev => ({ ...prev, cover_image_url: imageUrl }));
      toast.success('Image téléchargée avec succès');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validation
      if (!formData.title_fr) {
        toast.error('Le titre français est requis');
        setActiveTab('french');
        return;
      }

      if (!formData.slug) {
        toast.error('Le slug est requis');
        setActiveTab('general');
        return;
      }

      // Prepare data for saving
      const dataToSave = {
        ...formData,
        // Convert empty strings to null for UUID fields
        category_id: formData.category_id || null,
        trainer_id: (formData as any).trainer_id || null,
        // Ensure legacy fields are populated from French
        title: formData.title_fr,
        description: formData.description_fr,
        content: formData.content_fr,
        price: formData.price_ttc,
      };

      if (course) {
        await SupabaseService.updateFormation(course.id, dataToSave);
        toast.success('Formation mise à jour avec succès');
      } else {
        await SupabaseService.createFormation(dataToSave);
        toast.success('Formation créée avec succès');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  // Form Builder Functions
  const addFormField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      name: '',
      type: 'text',
      label_fr: '',
      label_ar: '',
      required: false,
      order: formData.inscription_form_fields.length + 1
    };
    setFormData(prev => ({
      ...prev,
      inscription_form_fields: [...prev.inscription_form_fields, newField]
    }));
  };

  const updateFormField = (id: string, updates: Partial<FormField>) => {
    setFormData(prev => ({
      ...prev,
      inscription_form_fields: prev.inscription_form_fields.map(field =>
        field.id === id ? { ...field, ...updates } : field
      )
    }));
  };

  const deleteFormField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      inscription_form_fields: prev.inscription_form_fields
        .filter(field => field.id !== id)
        .map((field, index) => ({ ...field, order: index + 1 }))
    }));
  };

  const moveFieldUp = (id: string) => {
    const index = formData.inscription_form_fields.findIndex(f => f.id === id);
    if (index > 0) {
      const newFields = [...formData.inscription_form_fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      newFields.forEach((field, i) => field.order = i + 1);
      setFormData(prev => ({ ...prev, inscription_form_fields: newFields }));
    }
  };

  const moveFieldDown = (id: string) => {
    const index = formData.inscription_form_fields.findIndex(f => f.id === id);
    if (index < formData.inscription_form_fields.length - 1) {
      const newFields = [...formData.inscription_form_fields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      newFields.forEach((field, i) => field.order = i + 1);
      setFormData(prev => ({ ...prev, inscription_form_fields: newFields }));
    }
  };

  const addOptionToField = (fieldId: string) => {
    const newOption = { value: '', label_fr: '', label_ar: '' };
    setFormData(prev => ({
      ...prev,
      inscription_form_fields: prev.inscription_form_fields.map(field =>
        field.id === fieldId
          ? { ...field, options: [...(field.options || []), newOption] }
          : field
      )
    }));
  };

  const updateFieldOption = (fieldId: string, optionIndex: number, updates: Partial<{ value: string; label_fr: string; label_ar: string }>) => {
    setFormData(prev => ({
      ...prev,
      inscription_form_fields: prev.inscription_form_fields.map(field =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options?.map((opt, idx) =>
                idx === optionIndex ? { ...opt, ...updates } : opt
              )
            }
          : field
      )
    }));
  };

  const deleteFieldOption = (fieldId: string, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      inscription_form_fields: prev.inscription_form_fields.map(field =>
        field.id === fieldId
          ? { ...field, options: field.options?.filter((_, idx) => idx !== optionIndex) }
          : field
      )
    }));
  };

  const loadDefaultFormFields = () => {
    setFormData(prev => ({
      ...prev,
      inscription_form_fields: defaultFormFields
    }));
    toast.success('Formulaire par défaut chargé');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {course ? 'Modifier la formation' : 'Nouvelle formation'}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations de la formation en français et arabe
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="french">Français</TabsTrigger>
            <TabsTrigger value="arabic">العربية</TabsTrigger>
            <TabsTrigger value="form">Formulaire</TabsTrigger>
            <TabsTrigger value="media">Média</TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut de publication</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_published: checked }))
                    }
                  />
                  <span className="text-sm">
                    {formData.is_published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name_fr || cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Référence</Label>
                <Input
                  placeholder="ex: INV-PHYS-FR-2025"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reference: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input
                  placeholder="ex: techniques-inventaires"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (séparés par des virgules)</Label>
              <Input
                placeholder="ex: inventaire, finance, comptabilité"
                value={formData.tags.join(', ')}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tags: e.target.value.split(',').map((t) => t.trim()),
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Durée</Label>
                <Input
                  placeholder="ex: 2 jours"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, duration: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Débutant">Débutant</SelectItem>
                    <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                    <SelectItem value="Avancé">Avancé</SelectItem>
                    <SelectItem value="Tous niveaux">Tous niveaux</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Participants max</Label>
                <Input
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_participants: parseInt(e.target.value) || 20,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prix HT</Label>
                <Input
                  type="number"
                  placeholder="ex: 24000"
                  value={formData.price_ht}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price_ht: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Prix TTC (auto-calculé)</Label>
                <Input
                  type="number"
                  value={formData.price_ttc}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price_ttc: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Devise</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DZD">DZD (Dinar Algérien)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="USD">USD (Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_online}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_online: checked }))
                  }
                />
                <span className="text-sm">Formation en ligne</span>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_popular}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_popular: checked }))
                  }
                />
                <span className="text-sm">Formation populaire</span>
              </div>
            </div>
          </TabsContent>

          {/* FRENCH TAB */}
          <TabsContent value="french" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Contenu en français
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input
                    placeholder="Titre de la formation en français"
                    value={formData.title_fr}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title_fr: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description courte</Label>
                  <Textarea
                    placeholder="Description courte en français"
                    rows={3}
                    value={formData.description_fr}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description_fr: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contenu HTML</Label>
                  <HTMLEditor
                    value={formData.content_fr}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, content_fr: value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prérequis (HTML)</Label>
                  <Textarea
                    placeholder="<ul><li>Prérequis 1</li></ul>"
                    rows={4}
                    className="font-mono"
                    value={formData.prerequisites_fr}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prerequisites_fr: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Programme (HTML)</Label>
                  <Textarea
                    placeholder="<h3>Module 1</h3><ul><li>Point 1</li></ul>"
                    rows={6}
                    className="font-mono"
                    value={formData.program_fr}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, program_fr: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Public concerné (HTML)</Label>
                  <Textarea
                    placeholder="<ul><li>Public 1</li></ul>"
                    rows={4}
                    className="font-mono"
                    value={formData.target_audience_fr}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        target_audience_fr: e.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ARABIC TAB */}
          <TabsContent value="arabic" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  المحتوى بالعربية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4" dir="rtl">
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input
                    placeholder="عنوان الدورة بالعربية"
                    value={formData.title_ar}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title_ar: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>الوصف القصير</Label>
                  <Textarea
                    placeholder="وصف قصير بالعربية"
                    rows={3}
                    value={formData.description_ar}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description_ar: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>المحتوى (HTML)</Label>
                  <HTMLEditor
                    value={formData.content_ar}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, content_ar: value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>المتطلبات الأساسية (HTML)</Label>
                  <Textarea
                    placeholder="<ul><li>متطلب 1</li></ul>"
                    rows={4}
                    className="font-mono"
                    value={formData.prerequisites_ar}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prerequisites_ar: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>البرنامج (HTML)</Label>
                  <Textarea
                    placeholder="<h3>الوحدة 1</h3><ul><li>النقطة 1</li></ul>"
                    rows={6}
                    className="font-mono"
                    value={formData.program_ar}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, program_ar: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>الجمهور المستهدف (HTML)</Label>
                  <Textarea
                    placeholder="<ul><li>جمهور 1</li></ul>"
                    rows={4}
                    className="font-mono"
                    value={formData.target_audience_ar}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        target_audience_ar: e.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FORM BUILDER TAB */}
          <TabsContent value="form" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Formulaire d'inscription personnalisé
                    </CardTitle>
                    <CardDescription>
                      Configurez les champs du formulaire d'inscription pour cette formation
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFormPreview(!showFormPreview)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showFormPreview ? 'Masquer' : 'Aperçu'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadDefaultFormFields}>
                      Charger par défaut
                    </Button>
                    <Button onClick={addFormField}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un champ
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.inscription_form_fields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Aucun champ. Cliquez sur "Ajouter un champ" ou "Charger par défaut"
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.inscription_form_fields
                      .sort((a, b) => a.order - b.order)
                      .map((field, index) => (
                        <Card key={field.id} className="p-4">
                          <div className="space-y-4">
                            {/* Field Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                                <Badge variant="outline">Champ {field.order}</Badge>
                                {field.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Requis
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveFieldUp(field.id)}
                                  disabled={index === 0}
                                >
                                  ↑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveFieldDown(field.id)}
                                  disabled={
                                    index === formData.inscription_form_fields.length - 1
                                  }
                                >
                                  ↓
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteFormField(field.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>

                            {/* Field Configuration */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nom du champ</Label>
                                <Input
                                  placeholder="ex: full_name"
                                  value={field.name}
                                  onChange={(e) =>
                                    updateFormField(field.id, { name: e.target.value })
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                  value={field.type}
                                  onValueChange={(value: any) =>
                                    updateFormField(field.id, { type: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Texte</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="phone">Téléphone</SelectItem>
                                    <SelectItem value="textarea">Zone de texte</SelectItem>
                                    <SelectItem value="select">Liste déroulante</SelectItem>
                                    <SelectItem value="checkbox">Case à cocher</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Label (FR)</Label>
                                <Input
                                  placeholder="ex: Nom complet"
                                  value={field.label_fr}
                                  onChange={(e) =>
                                    updateFormField(field.id, { label_fr: e.target.value })
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Label (AR)</Label>
                                <Input
                                  placeholder="ex: الاسم الكامل"
                                  value={field.label_ar}
                                  dir="rtl"
                                  onChange={(e) =>
                                    updateFormField(field.id, { label_ar: e.target.value })
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Placeholder (FR)</Label>
                                <Input
                                  placeholder="ex: Entrez votre nom"
                                  value={field.placeholder_fr || ''}
                                  onChange={(e) =>
                                    updateFormField(field.id, {
                                      placeholder_fr: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Placeholder (AR)</Label>
                                <Input
                                  placeholder="ex: أدخل اسمك"
                                  value={field.placeholder_ar || ''}
                                  dir="rtl"
                                  onChange={(e) =>
                                    updateFormField(field.id, {
                                      placeholder_ar: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.required}
                                onCheckedChange={(checked) =>
                                  updateFormField(field.id, { required: checked })
                                }
                              />
                              <span className="text-sm">Champ requis</span>
                            </div>

                            {/* Options for select fields */}
                            {field.type === 'select' && (
                              <div className="space-y-2 border-t pt-4">
                                <div className="flex items-center justify-between">
                                  <Label>Options de sélection</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addOptionToField(field.id)}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajouter une option
                                  </Button>
                                </div>
                                {field.options?.map((option, optIdx) => (
                                  <div key={optIdx} className="grid grid-cols-4 gap-2">
                                    <Input
                                      placeholder="Valeur"
                                      value={option.value}
                                      onChange={(e) =>
                                        updateFieldOption(field.id, optIdx, {
                                          value: e.target.value,
                                        })
                                      }
                                    />
                                    <Input
                                      placeholder="Label FR"
                                      value={option.label_fr}
                                      onChange={(e) =>
                                        updateFieldOption(field.id, optIdx, {
                                          label_fr: e.target.value,
                                        })
                                      }
                                    />
                                    <Input
                                      placeholder="Label AR"
                                      value={option.label_ar}
                                      dir="rtl"
                                      onChange={(e) =>
                                        updateFieldOption(field.id, optIdx, {
                                          label_ar: e.target.value,
                                        })
                                      }
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteFieldOption(field.id, optIdx)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Preview */}
            {showFormPreview && (
              <Card>
                <CardHeader>
                  <CardTitle>Aperçu du formulaire</CardTitle>
                  <CardDescription>
                    Voici comment le formulaire apparaîtra aux utilisateurs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {/* French Preview */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-gray-600">
                        Version française
                      </h4>
                      {formData.inscription_form_fields
                        .sort((a, b) => a.order - b.order)
                        .map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label>
                              {field.label_fr}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </Label>
                            {field.type === 'textarea' ? (
                              <Textarea
                                placeholder={field.placeholder_fr}
                                disabled
                                rows={3}
                              />
                            ) : field.type === 'select' ? (
                              <Select disabled>
                                <SelectTrigger>
                                  <SelectValue placeholder={field.placeholder_fr} />
                                </SelectTrigger>
                              </Select>
                            ) : field.type === 'checkbox' ? (
                              <div className="flex items-center space-x-2">
                                <input type="checkbox" disabled />
                                <span className="text-sm">{field.placeholder_fr}</span>
                              </div>
                            ) : (
                              <Input
                                type={field.type}
                                placeholder={field.placeholder_fr}
                                disabled
                              />
                            )}
                          </div>
                        ))}
                    </div>

                    {/* Arabic Preview */}
                    <div className="space-y-4" dir="rtl">
                      <h4 className="font-semibold text-sm text-gray-600">
                        النسخة العربية
                      </h4>
                      {formData.inscription_form_fields
                        .sort((a, b) => a.order - b.order)
                        .map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label>
                              {field.label_ar}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </Label>
                            {field.type === 'textarea' ? (
                              <Textarea
                                placeholder={field.placeholder_ar}
                                disabled
                                rows={3}
                              />
                            ) : field.type === 'select' ? (
                              <Select disabled>
                                <SelectTrigger>
                                  <SelectValue placeholder={field.placeholder_ar} />
                                </SelectTrigger>
                              </Select>
                            ) : field.type === 'checkbox' ? (
                              <div className="flex items-center space-x-2">
                                <input type="checkbox" disabled />
                                <span className="text-sm">{field.placeholder_ar}</span>
                              </div>
                            ) : (
                              <Input
                                type={field.type}
                                placeholder={field.placeholder_ar}
                                disabled
                              />
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* MEDIA TAB */}
          <TabsContent value="media" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Image de couverture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload d'image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Téléchargement en cours...
                    </div>
                  )}
                </div>

                {formData.cover_image_url && (
                  <div className="space-y-2">
                    <Label>Aperçu</Label>
                    <img
                      src={formData.cover_image_url}
                      alt="Couverture"
                      className="w-full max-w-md rounded-lg border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
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

export default EnhancedCourseForm;

