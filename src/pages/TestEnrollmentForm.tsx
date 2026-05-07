import EnrollmentForm from '@/components/EnrollmentForm';
import DirectEnrollmentForm from '@/components/DirectEnrollmentForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestEnrollmentForm = () => {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Test du Formulaire d'Inscription</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Test 1: Formulaire avec données complètes</CardTitle>
        </CardHeader>
        <CardContent>
          <EnrollmentForm
            courseId="test-course-id-123"
            courseTitle="Formation Test - Leadership et Management"
            coursePrice={899}
            courseCurrency="EUR"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test 2: Formulaire avec bouton personnalisé</CardTitle>
        </CardHeader>
        <CardContent>
          <EnrollmentForm
            courseId="test-course-id-456"
            courseTitle="Formation Test - Vente par Téléphone"
            coursePrice={599}
            courseCurrency="EUR"
            trigger={
              <Button variant="outline" size="lg" className="w-full">
                Inscription Personnalisée
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test 3: Formulaire gratuit</CardTitle>
        </CardHeader>
        <CardContent>
          <EnrollmentForm
            courseId="test-course-id-789"
            courseTitle="Formation Gratuite - Introduction au Digital"
            coursePrice={0}
            courseCurrency="EUR"
            trigger={
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Inscription Gratuite
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test 4: Formulaire Direct (Nouveau)</CardTitle>
        </CardHeader>
        <CardContent>
          <DirectEnrollmentForm
            courseId="direct-test-course-id"
            courseTitle="Formation Test - Formulaire Direct"
            coursePrice={1299}
            courseCurrency="EUR"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test 5: Vérification des props</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h4 className="font-semibold mb-2">Props du composant EnrollmentForm:</h4>
            <ul className="text-sm space-y-1">
              <li><strong>courseId:</strong> string (requis)</li>
              <li><strong>courseTitle:</strong> string (requis)</li>
              <li><strong>coursePrice:</strong> number (optionnel, défaut: 0)</li>
              <li><strong>courseCurrency:</strong> string (optionnel, défaut: 'EUR')</li>
              <li><strong>trigger:</strong> React.ReactNode (optionnel, bouton par défaut)</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-semibold mb-2">Instructions de test:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Cliquez sur chaque bouton d'inscription</li>
              <li>Vérifiez que le dialog s'ouvre correctement</li>
              <li>Remplissez le formulaire avec des données de test</li>
              <li>Vérifiez la validation des champs obligatoires</li>
              <li>Testez la soumission du formulaire</li>
              <li>Vérifiez les messages de succès/erreur</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestEnrollmentForm;
