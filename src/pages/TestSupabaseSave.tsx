import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { SupabaseService } from '@/lib/supabase';
import { CheckCircle, Loader2, Save } from 'lucide-react';

const TestSupabaseSave = () => {
  const [loading, setLoading] = useState(false);
  const [savedCourse, setSavedCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title_fr: 'Test Formation ' + Date.now(),
    slug: 'test-formation-' + Date.now(),
    description_fr: 'Description de test pour la formation',
    content_fr: '<h2>Contenu de la formation</h2><p>Ceci est un test.</p>',
    price_ht: 10000,
    price_ttc: 10900,
    duration: '2 jours',
    level: 'Débutant' as const,
    max_participants: 20,
    is_published: true,
  });

  const handleSaveToSupabase = async () => {
    try {
      setLoading(true);
      setSavedCourse(null);

      console.log('📤 Tentative de sauvegarde dans Supabase...');
      console.log('Données à sauvegarder:', formData);

      // Prepare course data
      const courseData = {
        // Bilingual fields
        title_fr: formData.title_fr,
        description_fr: formData.description_fr,
        content_fr: formData.content_fr,
        
        // Legacy fields (required for backward compatibility)
        title: formData.title_fr,
        description: formData.description_fr,
        content: formData.content_fr,
        
        // Basic info
        slug: formData.slug,
        
        // Pricing
        price_ht: formData.price_ht,
        price_ttc: formData.price_ttc,
        price: formData.price_ttc,
        currency: 'DZD', // Algerian Dinar (ISO 4217)
        
        // Details
        duration: formData.duration,
        level: formData.level,
        max_participants: formData.max_participants,
        current_participants: 0,
        
        // Flags
        is_published: formData.is_published,
        is_active: true,
        is_online: false,
        is_popular: false,
        
        // Optional fields (set to null to avoid UUID errors)
        category_id: null,
        trainer_id: null,
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('📦 Données préparées:', courseData);

      // Save to Supabase
      const result = await SupabaseService.createFormation(courseData);
      
      console.log('✅ Sauvegarde réussie! Résultat:', result);
      
      setSavedCourse(result);
      toast.success('✅ Formation sauvegardée dans Supabase!');
      
      // Generate new test data for next save
      setFormData({
        ...formData,
        title_fr: 'Test Formation ' + Date.now(),
        slug: 'test-formation-' + Date.now(),
      });

    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      console.error('Détails de l\'erreur:', error.message, error.code, error.details);
      toast.error(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAllCourses = async () => {
    try {
      setLoading(true);
      const courses = await SupabaseService.getFormations();
      console.log('📚 Toutes les formations:', courses);
      toast.success(`✅ ${courses?.length || 0} formations chargées`);
    } catch (error: any) {
      console.error('❌ Erreur de chargement:', error);
      toast.error(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Test: Sauvegarder dans Supabase</CardTitle>
            <CardDescription>
              Testez la sauvegarde directe des formations dans Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titre (FR)</Label>
                <Input
                  value={formData.title_fr}
                  onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description (FR)</Label>
                <Textarea
                  value={formData.description_fr}
                  onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prix HT (DA)</Label>
                  <Input
                    type="number"
                    value={formData.price_ht}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      price_ht: parseFloat(e.target.value),
                      price_ttc: parseFloat(e.target.value) * 1.09
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prix TTC (DA)</Label>
                  <Input
                    type="number"
                    value={formData.price_ttc}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durée</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Participants max</Label>
                  <Input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      max_participants: parseInt(e.target.value) 
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={handleSaveToSupabase} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    💾 Sauvegarder dans Supabase
                  </>
                )}
              </Button>

              <Button 
                onClick={handleLoadAllCourses} 
                disabled={loading}
                variant="outline"
              >
                📚 Charger toutes les formations
              </Button>
            </div>

            {/* Success Message */}
            {savedCourse && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    ✅ Formation sauvegardée avec succès!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">ID:</span>
                      <p className="text-xs text-gray-600 font-mono">{savedCourse.id}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Titre:</span>
                      <p className="text-gray-600">{savedCourse.title_fr}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Slug:</span>
                      <p className="text-gray-600 font-mono">{savedCourse.slug}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Prix TTC:</span>
                      <p className="text-gray-600">{savedCourse.price_ttc} DA</p>
                    </div>
                    <div>
                      <span className="font-semibold">Publié:</span>
                      <p className="text-gray-600">{savedCourse.is_published ? '✅ Oui' : '❌ Non'}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Créé le:</span>
                      <p className="text-xs text-gray-600">
                        {new Date(savedCourse.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/fr/formation/${savedCourse.slug}`, '_blank')}
                    >
                      🔗 Voir la formation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 text-sm">📝 Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 space-y-2">
                <p>1. ✏️ Modifiez les champs ci-dessus (ou gardez les valeurs par défaut)</p>
                <p>2. 💾 Cliquez sur "Sauvegarder dans Supabase"</p>
                <p>3. ✅ Vérifiez le message de succès</p>
                <p>4. 🔗 Cliquez sur "Voir la formation" pour voir le résultat</p>
                <p>5. 🔍 Consultez la console du navigateur pour voir les logs détaillés</p>
                <p className="pt-2 font-semibold text-blue-800">
                  💡 La formation sera créée dans la table "formations" de Supabase
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestSupabaseSave;

