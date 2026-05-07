import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search,
  Plus,
  Edit,
  Copy,
  Trash2,
  Eye,
  Users,
  DollarSign,
  BookOpen,
  Clock,
  Star,
  ExternalLink,
  Loader2,
  Upload,
  FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/components/admin/AdminLayout';
import SimpleCourseForm from '@/components/admin/SimpleCourseForm';
import BilingualCourseForm from '@/components/admin/BilingualCourseForm';
import { SimpleSupabaseService } from '@/lib/supabaseSimple';
import { SupabaseService } from '@/lib/supabase';
import { AIService } from '@/lib/aiService';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const CoursesFixed = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBilingualFormOpen, setIsBilingualFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [bilingualFormMode, setBilingualFormMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [courses, setCourses] = useState<any[]>([]);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [generatingArabic, setGeneratingArabic] = useState<string | null>(null); // Course ID being processed
  const [uploadingProgramme, setUploadingProgramme] = useState(false);
  const [programmeUrl, setProgrammeUrl] = useState('');

  // Setup current programme URL
  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const data = await SupabaseService.getPageContent('formations');
        if (data && data.content && data.content.formations_monthly_program) {
          setProgrammeUrl(data.content.formations_monthly_program);
        }
      } catch (error) {
        console.error('Error fetching programme link:', error);
      }
    };
    fetchUrl();
  }, []);

  const handleSaveProgrammeLink = async () => {
    if (!programmeUrl.trim()) {
      toast.error('Veuillez entrer un lien valide.');
      return;
    }

    try {
      setUploadingProgramme(true);
      toast.info('Sauvegarde en cours...');
      
      const data = await SupabaseService.getPageContent('formations');
      const currentFullContent = data?.content || {};
      
      const newFullContent = {
        ...currentFullContent,
        formations_monthly_program: programmeUrl
      };

      await SupabaseService.updatePageContent('formations', newFullContent);
      toast.success('Lien du programme mensuel mis à jour avec succès');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde du lien.');
    } finally {
      setUploadingProgramme(false);
    }
  };

  // Load courses from Supabase
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        
        // Load courses with multiple categories support
        const coursesData = await SupabaseService.getAllFormationsForAdmin();
        const categoriesData = await SimpleSupabaseService.getCategoriesSimple();
        
        setCategoriesData(categoriesData || []);
        
        // Map courses - use first category from categories array, or fallback to category_id
        const coursesWithCategories = (coursesData || []).map((course: any) => {
          // Use categories array (multiple categories) if available, otherwise use single category
          let category = null;
          if (course.categories && course.categories.length > 0) {
            category = course.categories[0]; // Use first category for display
          } else if (course.category) {
            category = course.category;
          } else if (course.category_id) {
            category = categoriesData?.find((cat: any) => cat.id === course.category_id);
          }
          
          return {
            ...course,
            category: category || null,
            categories: course.categories || (category ? [category] : [])
          };
        });
        
        setCourses(coursesWithCategories);
      } catch (error) {
        console.error('Error loading courses:', error);
        // Fallback to sample data if Supabase fails
        setCourses(sampleCourses);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [refreshTrigger]);

  // Sample data for fallback
  const sampleCourses = [
    {
      id: '1',
      title: 'La vente par téléphone',
      description: 'Maîtrisez les techniques de closing à distance et développez votre portefeuille clients',
      category: { name: 'Commercial & Vente', slug: 'commercial' },
      duration: '3 jours',
      level: 'Intermédiaire',
      price: 899,
      currency: 'EUR',
      max_participants: 20,
      current_participants: 15,
      is_active: true,
      is_popular: true,
      image_url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      slug: 'la-vente-par-telephone'
    },
    {
      id: '2',
      title: 'Leadership et management d\'équipe',
      description: 'Développez votre leadership pour motiver et fédérer vos équipes',
      category: { name: 'Management & Leadership', slug: 'management' },
      duration: '4 jours',
      level: 'Intermédiaire',
      price: 1599,
      currency: 'EUR',
      max_participants: 15,
      current_participants: 8,
      is_active: true,
      is_popular: false,
      image_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      slug: 'leadership-management-equipe'
    }
  ];

  const fallbackCategories = [
    { id: 'commercial', name: 'Commercial & Vente', slug: 'commercial' },
    { id: 'management', name: 'Management & Leadership', slug: 'management' },
    { id: 'digital', name: 'Digital & IA', slug: 'digital' },
    { id: 'finance', name: 'Finance & Comptabilité', slug: 'finance' },
    { id: 'logistique', name: 'Logistique & Supply Chain', slug: 'logistique' },
    { id: 'rh', name: 'Ressources Humaines', slug: 'rh' }
  ];

  const displayCategories = categoriesData.length > 0 ? categoriesData : fallbackCategories;

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setBilingualFormMode('create');
    setIsBilingualFormOpen(true);
  };

  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    setBilingualFormMode('edit');
    setIsBilingualFormOpen(true);
  };
  
  const handleDuplicateCourse = async (course: any) => {
    const generateSlug = (title: string) => {
      if (!title) return 'formation';
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

    const pickFormationForInsert = (src: any) => {
      const data: Record<string, unknown> = {};
      const keys = [
        'title',
        'description',
        'content',
        'category_id',
        'duration',
        'level',
        'price',
        'currency',
        'max_participants',
        'current_participants',
        'rating',
        'image_url',
        'objectives',
        'prerequisites',
        'trainer_id',
        'start_date',
        'end_date',
        'location',
        'is_online',
        'is_popular',
        'is_active',
        'title_fr',
        'description_fr',
        'content_fr',
        'objectives_fr',
        'prerequisites_fr',
        'program_fr',
        'target_audience_fr',
        'title_ar',
        'description_ar',
        'content_ar',
        'objectives_ar',
        'prerequisites_ar',
        'program_ar',
        'target_audience_ar',
        'price_ht',
        'price_ttc',
        'reference',
        'tags',
        'is_published',
        'cover_image_url',
      ];
      keys.forEach((k) => {
        if (src[k] !== undefined) data[k] = src[k];
      });
      return data;
    };

    const isDuplicateSlugError = (err: any) => {
      const code = err?.code;
      const msg = String(err?.message || '');
      return code === '23505' || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique');
    };

    try {
      toast.info('Duplication en cours...');

      let categoryIds: string[] = [];
      try {
        const categories = await SupabaseService.getFormationCategories(course.id);
        categoryIds = (categories || []).map((c: any) => c?.id).filter(Boolean);
      } catch {
        categoryIds = (course.categories || []).map((c: any) => c?.id).filter(Boolean);
        if (categoryIds.length === 0 && course.category_id) {
          categoryIds = [course.category_id];
        }
      }

      const baseSlug = String(course.slug || generateSlug(course.title_fr || course.title || 'formation')).trim() || 'formation';
      const payloadBase = pickFormationForInsert(course);

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const suffix = `${String(Date.now()).slice(-4)}${attempt ? `-${attempt}` : ''}`;
        const slug = `${baseSlug}-copy-${suffix}`;
        try {
          const created = await SupabaseService.createFormation({
            ...payloadBase,
            slug,
          });

          if (categoryIds.length > 0) {
            await SupabaseService.setFormationCategories(created.id, categoryIds);
          }

          toast.success('Dupliqué avec succès');
          setRefreshTrigger((prev) => prev + 1);
          return;
        } catch (e: any) {
          if (isDuplicateSlugError(e)) continue;
          throw e;
        }
      }

      toast.error('Impossible de générer un slug unique pour la copie');
    } catch (error: any) {
      console.error('Duplicate error:', error);
      toast.error(error.message || 'Erreur lors de la duplication');
    }
  };

  const handleSaveCourse = () => {
    setIsFormOpen(false);
    setIsBilingualFormOpen(false);
    setEditingCourse(null);
    setRefreshTrigger(prev => prev + 1); // Refresh the courses list
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la formation "${title}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      toast.info('Suppression en cours...');
      const { error } = await supabase.from('formations').delete().eq('id', id);
      if (error) throw error;

      toast.success('Cours supprimé avec succès');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleGenerateArabicContent = async (course: any) => {
    if (!course.content_fr && !course.content) {
      toast.error('لا يوجد محتوى فرنسي للترجمة / No French content to translate');
      return;
    }

    try {
      setGeneratingArabic(course.id);
      toast.info('جاري إنشاء المحتوى العربي... / Generating Arabic content...');

      const selectedCategory = categoriesData.find(cat => cat.id === course.category_id);
      
      const arabicContent = await AIService.generateCourseContent({
        title: course.title_ar || course.title_fr || course.title,
        description: course.description_ar || course.description_fr || course.description,
        category: selectedCategory?.name,
        price: course.price_ht || course.price,
        duration: course.duration,
        level: course.level,
        language: 'ar',
        reference: course.reference,
        frenchContent: course.content_fr || course.content, // Pass French content for translation
      });

      // Update the course with Arabic content
      await SupabaseService.updateFormation(course.id, {
        content_ar: arabicContent,
        title_ar: course.title_ar || course.title_fr || course.title,
        description_ar: course.description_ar || course.description_fr || course.description,
      });

      toast.success('تم إنشاء المحتوى العربي بنجاح! / Arabic content generated successfully!');
      setRefreshTrigger(prev => prev + 1); // Refresh the courses list
    } catch (error: any) {
      console.error('Error generating Arabic content:', error);
      const errorMessage = error.message || 'Erreur inconnue';
      
      // Provide helpful error messages
      if (errorMessage.includes('No AI service') || errorMessage.includes('API key')) {
        toast.error(
          `خطأ في الإعدادات: ${errorMessage}\n\n` +
          `يرجى إضافة مفتاح API في ملف .env:\n` +
          `VITE_GEMINI_API_KEY=your_key_here\n\n` +
          `أو VITE_FACTORY_AI_API_KEY=sk-your_openai_key`,
          { duration: 10000 }
        );
      } else {
        toast.error(`خطأ في إنشاء المحتوى: ${errorMessage}`, { duration: 5000 });
      }
    } finally {
      setGeneratingArabic(null);
    }
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    // Check if course matches selected category (check both single category and multiple categories)
    const matchesCategory = selectedCategory === 'all' || 
      course.category?.slug === selectedCategory ||
      (course.categories && course.categories.some((cat: any) => cat.slug === selectedCategory));
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && course.is_active) ||
                         (selectedStatus === 'inactive' && !course.is_active) ||
                         (selectedStatus === 'popular' && course.is_popular);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryColor = (categorySlug?: string) => {
    switch (categorySlug) {
      case 'commercial': return 'bg-green-100 text-green-800';
      case 'management': return 'bg-blue-100 text-blue-800';
      case 'digital': return 'bg-indigo-100 text-indigo-800';
      case 'finance': return 'bg-yellow-100 text-yellow-800';
      case 'logistique': return 'bg-purple-100 text-purple-800';
      case 'rh': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number, currency: string = 'EUR') => {
    // Convert DA to DZD (Algerian Dinar ISO 4217 code)
    const currencyCode = currency === 'DA' ? 'DZD' : currency;
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode
      }).format(price);
    } catch (error) {
      // Fallback: just show number with currency text
      return `${price.toLocaleString('fr-FR')} ${currency}`;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Cours</h1>
            <p className="text-gray-600 mt-1">Créez et gérez les formations</p>
          </div>
          <div className="flex-shrink-0">
            <Button 
              onClick={handleCreateCourse}
              className="bg-accent hover:bg-accent/90 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Cours
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Cours</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cours Actifs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Populaires</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.is_popular).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Participants</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, c) => sum + (c.current_participants || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Programme Mensuel UI */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Lien du Programme Mensuel (PDF)
            </CardTitle>
            <CardDescription>
              Insérez le lien externe (Google Drive, espace de stockage...) menant vers le catalogue PDF mensuel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full space-y-2">
                <Label htmlFor="programme-link">URL du fichier PDF</Label>
                <div className="relative">
                  <Input 
                    id="programme-link"
                    type="url" 
                    placeholder="https://..."
                    value={programmeUrl}
                    onChange={(e) => setProgrammeUrl(e.target.value)}
                    disabled={uploadingProgramme}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  disabled={uploadingProgramme}
                  onClick={handleSaveProgrammeLink}
                  className="flex-1 sm:flex-none"
                >
                  {uploadingProgramme ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder le lien
                </Button>
                {programmeUrl && (
                  <Button 
                    variant="outline" 
                    className="flex-none"
                    onClick={() => window.open(programmeUrl, '_blank')}
                    disabled={uploadingProgramme}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Cours</CardTitle>
            <CardDescription>Gérez tous vos cours de formation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher des cours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {displayCategories.map((category) => (
                    <SelectItem key={category.id} value={category.slug || category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                  <SelectItem value="popular">Populaires</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Chargement des cours...</span>
              </div>
            ) : (
              <>
                {/* Courses Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
                      <CardHeader className="flex-shrink-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          {course.categories && course.categories.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {course.categories.map((cat: any, idx: number) => (
                                <Badge key={cat.id || idx} className={getCategoryColor(cat.slug)} variant="secondary">
                                  {cat.name_fr || cat.name}
                                </Badge>
                              ))}
                            </div>
                          ) : course.category ? (
                            <Badge className={getCategoryColor(course.category?.slug)} variant="secondary">
                              {course.category?.name_fr || course.category?.name}
                            </Badge>
                          ) : null}
                          <div className="flex gap-1">
                            {course.is_popular && (
                              <Badge className="bg-red-100 text-red-800" variant="secondary">
                                <Star className="w-3 h-3 mr-1" />
                                Populaire
                              </Badge>
                            )}
                            <Badge 
                              className={course.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} 
                              variant="secondary"
                            >
                              {course.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-3">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="flex-1 flex flex-col">
                        {course.image_url && (
                          <img 
                            src={course.image_url} 
                            alt={course.title}
                            className="w-full h-32 object-cover rounded-md mb-4"
                          />
                        )}
                        
                        <div className="space-y-3 flex-1">
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>{course.duration}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              <span>{course.current_participants || 0}/{course.max_participants}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2" />
                              <span>{formatPrice(course.price, course.currency)}</span>
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-2" />
                              <span>{course.level}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-2 mt-auto">
                          <div className="flex flex-wrap gap-2 items-center flex-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicateCourse(course)}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Dupliquer
                            </Button>
                            {(!course.content_ar && (course.content_fr || course.content)) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleGenerateArabicContent(course)}
                                disabled={generatingArabic === course.id}
                                className="text-blue-600"
                              >
                                {generatingArabic === course.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    جاري...
                                  </>
                                ) : (
                                  <>
                                    <span className="mr-1">🇸🇦</span>
                                    عربي
                                  </>
                                )}
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`/formation/${course.slug}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleDeleteCourse(course.id, course.title_fr || course.title)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredCourses.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Aucun cours trouvé</p>
                    <p className="text-gray-400">Essayez de modifier vos critères de recherche</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Simple Course Form */}
        <SimpleCourseForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveCourse}
        />

        {/* Bilingual Course Form */}
        <BilingualCourseForm
          course={editingCourse}
          mode={bilingualFormMode}
          isOpen={isBilingualFormOpen}
          onClose={() => {
            setIsBilingualFormOpen(false);
            setEditingCourse(null);
          }}
          onSave={handleSaveCourse}
        />
      </div>
    </AdminLayout>
  );
};

export default CoursesFixed;
