import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import HTMLEditor from './HTMLEditor';
import { useCategories } from '@/hooks/useSupabase';
import { SupabaseService } from '@/lib/supabase';
import type { Formation, Category } from '../../../supabase-config';
import { 
  Save, 
  X, 
  Upload, 
  Eye, 
  Code, 
  Settings, 
  BookOpen,
  Calendar,
  Users,
  Euro,
  MapPin,
  Clock,
  Star,
  Target
} from 'lucide-react';

interface CourseFormProps {
  course?: Formation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: any) => void;
}

const CourseForm = ({ course, isOpen, onClose, onSave }: CourseFormProps) => {
  const { categories } = useCategories();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    category_id: '',
    duration: '',
    level: 'Tous niveaux',
    price: 0,
    currency: 'EUR',
    max_participants: 20,
    objectives: [] as string[],
    prerequisites: '',
    start_date: '',
    end_date: '',
    location: '',
    is_online: false,
    is_popular: false,
    is_active: true,
    image_url: ''
  });

  const [objectiveInput, setObjectiveInput] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        slug: course.slug || '',
        description: course.description || '',
        content: course.content || '',
        category_id: course.category_id || '',
        duration: course.duration || '',
        level: course.level || 'Tous niveaux',
        price: course.price || 0,
        currency: course.currency || 'EUR',
        max_participants: course.max_participants || 20,
        objectives: course.objectives || [],
        prerequisites: course.prerequisites || '',
        start_date: course.start_date || '',
        end_date: course.end_date || '',
        location: course.location || '',
        is_online: course.is_online || false,
        is_popular: course.is_popular || false,
        is_active: course.is_active !== undefined ? course.is_active : true,
        image_url: course.image_url || ''
      });
    } else {
      // Reset form for new course
      setFormData({
        title: '',
        slug: '',
        description: '',
        content: '',
        category_id: '',
        duration: '',
        level: 'Tous niveaux',
        price: 0,
        currency: 'EUR',
        max_participants: 20,
        objectives: [],
        prerequisites: '',
        start_date: '',
        end_date: '',
        location: '',
        is_online: false,
        is_popular: false,
        is_active: true,
        image_url: ''
      });
    }
  }, [course, isOpen]);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug when title changes
    if (field === 'title' && !course) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }
  };

  const addObjective = () => {
    if (objectiveInput.trim()) {
      setFormData(prev => ({
        ...prev,
        objectives: [...prev.objectives, objectiveInput.trim()]
      }));
      setObjectiveInput('');
    }
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validation
      if (!formData.title || !formData.description || !formData.category_id) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const courseData = {
        ...formData,
        price: parseFloat(formData.price.toString()),
        max_participants: parseInt(formData.max_participants.toString())
      };

      if (course) {
        // Update existing course
        await SupabaseService.updateFormation(course.id, courseData);
      } else {
        // Create new course
        await SupabaseService.createFormation(courseData);
      }

      onSave(courseData);
      onClose();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Erreur lors de la sauvegarde du cours');
    } finally {
      setLoading(false);
    }
  };

  const levels = [
    'Débutant',
    'Intermédiaire', 
    'Avancé',
    'Tous niveaux'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {course ? 'Modifier le cours' : 'Nouveau cours'}
          </DialogTitle>
          <DialogDescription>
            {course ? 'Modifiez les informations du cours' : 'Créez un nouveau cours de formation'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Contenu HTML
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Aperçu
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du cours *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Techniques de vente avancées"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug URL</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="techniques-vente-avancees"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Description courte du cours..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Niveau</Label>
                <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Durée</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="Ex: 3 jours"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Prix (€)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_participants">Max participants</Label>
                <Input
                  id="max_participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value) || 20)}
                  placeholder="20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">URL de l'image</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_online"
                  checked={formData.is_online}
                  onCheckedChange={(checked) => handleInputChange('is_online', checked)}
                />
                <Label htmlFor="is_online">Formation en ligne</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => handleInputChange('is_popular', checked)}
                />
                <Label htmlFor="is_popular">Formation populaire</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Actif</Label>
              </div>
            </div>
          </TabsContent>

          {/* Content HTML Tab */}
          <TabsContent value="content" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Contenu HTML du cours</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <Code className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {previewMode ? 'Éditeur' : 'Aperçu'}
              </Button>
            </div>
            
            {previewMode ? (
              <Card>
                <CardContent className="p-6">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                </CardContent>
              </Card>
            ) : (
              <HTMLEditor
                value={formData.content}
                onChange={(value) => handleInputChange('content', value)}
                height="500px"
              />
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Objectifs pédagogiques</Label>
              <div className="flex gap-2">
                <Input
                  value={objectiveInput}
                  onChange={(e) => setObjectiveInput(e.target.value)}
                  placeholder="Ajouter un objectif..."
                  onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                />
                <Button onClick={addObjective} variant="outline">
                  Ajouter
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.objectives.map((objective, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2">
                    {objective}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeObjective(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prerequisites">Prérequis</Label>
              <Textarea
                id="prerequisites"
                value={formData.prerequisites}
                onChange={(e) => handleInputChange('prerequisites', e.target.value)}
                placeholder="Aucun prérequis particulier..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Date de début</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Date de fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Ex: Centre de formation BCOS, Alger"
              />
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{formData.title || 'Titre du cours'}</CardTitle>
                    <CardDescription className="mt-2">{formData.description}</CardDescription>
                  </div>
                  {formData.is_popular && (
                    <Badge className="bg-red-500 text-white">Populaire</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.image_url && (
                  <img 
                    src={formData.image_url} 
                    alt={formData.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formData.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formData.max_participants} places</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formData.price}€</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formData.level}</span>
                  </div>
                </div>

                {formData.objectives.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Objectifs pédagogiques</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {formData.objectives.map((objective, index) => (
                        <li key={index} className="text-sm text-muted-foreground">{objective}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {formData.content && (
                  <div>
                    <h3 className="font-semibold mb-2">Contenu du cours</h3>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-accent hover:bg-accent/90">
            {loading ? (
              <>Sauvegarde...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {course ? 'Mettre à jour' : 'Créer le cours'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseForm;








