import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SimpleHTMLEditor from './SimpleHTMLEditor';
import { SimpleSupabaseService } from '@/lib/supabaseSimple';
import { 
  Save, 
  X, 
  Eye, 
  Code, 
  BookOpen
} from 'lucide-react';

interface SimpleCourseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SimpleCourseForm = ({ isOpen, onClose, onSave }: SimpleCourseFormProps) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

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
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validation
      if (!formData.title.trim()) {
        alert('Veuillez saisir le titre de la formation');
        return;
      }

      if (!formData.content.trim()) {
        alert('Veuillez saisir le contenu HTML de la formation');
        return;
      }

      // Generate slug from title
      const slug = generateSlug(formData.title);

      // Create course data with minimal required fields
      const courseData = {
        title: formData.title.trim(),
        slug: slug,
        description: `Formation: ${formData.title}`, // Auto-generated description
        content: formData.content,
        duration: '1 jour', // Default duration
        level: 'Tous niveaux', // Default level
        price: 0, // Default price
        currency: 'EUR',
        max_participants: 20, // Default max participants
        is_online: true, // Default to online
        is_popular: false,
        is_active: true
      };

      // Save to Supabase
      console.log('Calling createFormationSimple with:', courseData);
      const result = await SimpleSupabaseService.createFormationSimple(courseData);
      console.log('Formation created successfully:', result);

      // Reset form
      setFormData({
        title: '',
        content: ''
      });

      // Close dialog and refresh
      onSave();
      onClose();
      
      alert('Formation créée avec succès!');
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Erreur lors de la création de la formation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      title: '',
      content: ''
    });
    setActiveTab('editor');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Nouvelle Formation
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle formation avec un titre et du contenu HTML
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Titre de la formation *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex: Techniques de vente avancées"
              className="text-lg"
            />
            {formData.title && (
              <p className="text-sm text-muted-foreground">
                URL: /formation/{generateSlug(formData.title)}
              </p>
            )}
          </div>

          {/* Content Editor */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Contenu HTML de la formation *
            </Label>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Éditeur HTML
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Aperçu
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="mt-4">
                <SimpleHTMLEditor
                  value={formData.content}
                  onChange={(value) => handleInputChange('content', value)}
                  height="400px"
                  placeholder="Créez le contenu de votre formation avec l'éditeur HTML..."
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-lg p-6 bg-white min-h-[400px]">
                  {formData.content ? (
                    <div 
                      className="prose prose-lg max-w-none
                        prose-headings:text-foreground
                        prose-p:text-muted-foreground
                        prose-strong:text-foreground
                        prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                        prose-blockquote:border-l-accent prose-blockquote:text-muted-foreground
                        prose-code:bg-muted prose-code:text-foreground prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                        prose-pre:bg-muted prose-pre:border
                        prose-img:rounded-lg prose-img:shadow-md
                        prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                        prose-li:text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>L'aperçu apparaîtra ici une fois que vous aurez ajouté du contenu</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Information</p>
                <p className="text-blue-700">
                  Cette formation sera créée avec des paramètres par défaut (durée: 1 jour, niveau: Tous niveaux, prix: gratuit). 
                  Vous pourrez modifier ces détails plus tard dans la gestion complète des formations.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !formData.title.trim() || !formData.content.trim()} 
            className="bg-accent hover:bg-accent/90"
          >
            {loading ? (
              <>Création...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Créer la formation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleCourseForm;
