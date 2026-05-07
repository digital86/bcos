import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SimpleSupabaseService } from '@/lib/supabaseSimple';
import { toast } from 'sonner';

const TestCourseCreation = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Veuillez saisir le titre de la formation');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Veuillez saisir le contenu HTML de la formation');
      return;
    }

    try {
      setLoading(true);
      
      const slug = generateSlug(formData.title);
      
      const courseData = {
        title: formData.title.trim(),
        slug: slug,
        description: `Formation: ${formData.title}`,
        content: formData.content,
        duration: '1 jour',
        level: 'Tous niveaux',
        price: 0,
        currency: 'EUR',
        max_participants: 20,
        is_online: true,
        is_popular: false,
        is_active: true
      };

      console.log('=== TEST COURSE CREATION ===');
      console.log('Course data to be sent:', courseData);
      
      const result = await SimpleSupabaseService.createFormationSimple(courseData);
      
      console.log('=== CREATION RESULT ===');
      console.log('Result:', result);
      
      toast.success(`Formation "${formData.title}" créée avec succès!`);
      
      // Reset form
      setFormData({
        title: '',
        content: ''
      });
      
    } catch (error) {
      console.error('=== ERROR CREATING COURSE ===');
      console.error('Error:', error);
      toast.error('Erreur lors de la création de la formation');
    } finally {
      setLoading(false);
    }
  };

  const testDirectSupabaseCall = async () => {
    try {
      setLoading(true);
      console.log('=== TESTING DIRECT SUPABASE CALL ===');
      
      // Import supabase directly
      const { supabase } = await import('@/lib/supabaseClient');
      
      const testData = {
        title: 'Test Direct Supabase Call',
        slug: 'test-direct-supabase-call',
        description: 'Test direct call to Supabase',
        content: '<h1>Test Content</h1>',
        duration: '1 jour',
        level: 'Débutant',
        price: 0,
        currency: 'EUR',
        max_participants: 20,
        current_participants: 0,
        is_active: true,
        is_popular: false,
        is_online: false,
        location: 'À définir',
        objectives: ['Test objective'],
        prerequisites: 'Aucun',
        image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Test data:', testData);
      
      const { data, error } = await supabase
        .from('formations')
        .insert([testData])
        .select()
        .single();
      
      console.log('Direct Supabase response:', { data, error });
      
      if (error) {
        console.error('Direct Supabase error:', error);
        toast.error(`Erreur directe: ${error.message}`);
      } else {
        toast.success('Appel direct Supabase réussi!');
      }
      
    } catch (error) {
      console.error('Direct test error:', error);
      toast.error('Erreur lors du test direct');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Test de Création de Cours</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test via SimpleSupabaseService</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la formation</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Formation Leadership"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Contenu HTML</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="<h1>Titre</h1><p>Contenu de la formation...</p>"
                  rows={6}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Création en cours...' : 'Créer la Formation'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Direct Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Direct Supabase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ce test appelle directement Supabase sans passer par SimpleSupabaseService
              </p>
              
              <Button 
                onClick={testDirectSupabaseCall}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Test en cours...' : 'Test Direct Supabase'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions de Test</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Ouvrez la console du navigateur (F12)</li>
            <li>Essayez de créer une formation via le formulaire</li>
            <li>Vérifiez les logs dans la console</li>
            <li>Essayez le test direct Supabase</li>
            <li>Comparez les résultats</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestCourseCreation;








