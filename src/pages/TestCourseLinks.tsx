import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SimpleSupabaseService } from '@/lib/supabaseSimple';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye } from 'lucide-react';

const TestCourseLinks = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await SimpleSupabaseService.getAllFormationsSimple();
        setCourses(data || []);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  if (loading) {
    return <div className="p-8">Chargement des cours...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test des Liens de Cours</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{course.title}</CardTitle>
              <p className="text-sm text-gray-600">Slug: {course.slug}</p>
              <p className="text-sm text-gray-500">ID: {course.id}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Link 
                    to={`/formation/${course.slug}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    Voir la page (Link interne)
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/formation/${course.slug}`, '_blank')}
                    className="justify-start"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir dans nouvel onglet
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.location.href = `/formation/${course.slug}`}
                    className="justify-start"
                  >
                    Navigation directe
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 mt-4">
                  <p>Créé le: {new Date(course.created_at).toLocaleDateString('fr-FR')}</p>
                  <p>Actif: {course.is_active ? 'Oui' : 'Non'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun cours trouvé</p>
        </div>
      )}
    </div>
  );
};

export default TestCourseLinks;








