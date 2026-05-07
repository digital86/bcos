import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Star,
  MapPin,
  Banknote,
  BookOpen,
  Target,
  CheckCircle,
  User,
  Award,
  Globe,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';
import { SimpleSupabaseService } from '@/lib/supabaseSimple';
import DirectEnrollmentForm from '@/components/DirectEnrollmentForm';
import type { Formation } from '../../supabase-config';
import SEO from '@/components/SEO';
import { generateCourseSchema } from '@/utils/seoUtils';
import { useMemo } from 'react';

const CourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourse = async () => {
      if (!slug) {
        setError('Slug du cours manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Loading course with slug:', slug);
        
        const data = await SimpleSupabaseService.getFormationBySlugSimple(slug);
        console.log('Course data received:', data);
        
        if (!data) {
          console.log('No course found for slug:', slug);
          setError('Cours non trouvé');
          return;
        }
        
        setCourse(data);
        console.log('Course loaded successfully:', data.title);
        console.log('Course ID:', data.id);
        console.log('Full course data:', data);
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Erreur lors du chargement du cours');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [slug]);

  const formatPrice = (price: number, currency: string = 'DZD') => {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (categorySlug?: string) => {
    switch (categorySlug) {
      case 'commercial': return 'bg-green-100 text-green-800';
      case 'management': return 'bg-blue-100 text-blue-800';
      case 'finance': return 'bg-yellow-100 text-yellow-800';
      case 'logistique': return 'bg-purple-100 text-purple-800';
      case 'rh': return 'bg-pink-100 text-pink-800';
      case 'digital': return 'bg-indigo-100 text-indigo-800';
      case 'soft-skills': return 'bg-orange-100 text-orange-800';
      case 'qualite': return 'bg-emerald-100 text-emerald-800';
      case 'securite': return 'bg-red-100 text-red-800';
      case 'communication': return 'bg-violet-100 text-violet-800';
      case 'innovation': return 'bg-amber-100 text-amber-800';
      case 'gestion-projet': return 'bg-sky-100 text-sky-800';
      case 'developpement-personnel': return 'bg-rose-100 text-rose-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <span className="text-lg text-muted-foreground">Chargement du cours...</span>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cours non trouvé</h1>
          <p className="text-gray-600 mb-6">{error || 'Ce cours n\'existe pas ou n\'est plus disponible.'}</p>
          <Button onClick={() => navigate('/formations')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux formations
          </Button>
        </div>
      </div>
    );
  }

  const seoData = {
    title: `${course.title} | BCOS Formation`,
    description: course.description || `Découvrez notre formation ${course.title} en Algérie.`,
    canonical: `https://bcos-dz.com/fr/formation/${slug}`,
    schemaData: generateCourseSchema({
      name: course.title,
      description: course.description,
      provider: "BCOS Formation & Conseil",
      url: `https://bcos-dz.com/fr/formation/${slug}`,
      image: course.image_url,
      price: course.price,
      currencyCode: course.currency === 'DA' ? 'DZD' : course.currency,
      ratingValue: 4.8, // Fallback default
      reviewCount: 12
    })
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO {...seoData} lang="fr" />
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 py-8">
        <div className="container mx-auto px-4">
          <Button 
            onClick={() => navigate('/formations')} 
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux formations
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge className={getCategoryColor(course.category?.slug)} variant="secondary">
                  {course.category?.name || 'Formation'}
                </Badge>
                {course.is_popular && (
                  <Badge className="bg-red-100 text-red-800" variant="secondary">
                    <Star className="w-3 h-3 mr-1" />
                    Populaire
                  </Badge>
                )}
                <Badge className="bg-green-100 text-green-800" variant="secondary">
                  {course.level}
                </Badge>
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                {course.title}
              </h1>
              
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {course.description}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Durée</p>
                    <p className="font-semibold">{course.duration}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Participants</p>
                    <p className="font-semibold">{course.current_participants || 0}/{course.max_participants}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Prix</p>
                    <p className="font-semibold">{formatPrice(course.price, course.currency)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {course.is_online ? (
                    <Globe className="w-5 h-5 text-accent" />
                  ) : (
                    <MapPin className="w-5 h-5 text-accent" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Format</p>
                    <p className="font-semibold">{course.is_online ? 'En ligne' : 'Présentiel'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {course.image_url && (
              <div className="lg:w-96">
                <img 
                  src={course.image_url} 
                  alt={course.title}
                  className="w-full h-64 lg:h-80 object-cover rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8 lg:items-start">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Content HTML */}
            {course.content && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Contenu de la formation
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                    dangerouslySetInnerHTML={{ __html: course.content }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Objectives */}
            {course.objectives && course.objectives.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Objectifs pédagogiques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {course.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Prerequisites */}
            {course.prerequisites && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Prérequis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {course.prerequisites}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <Card className="lg:sticky lg:top-6 lg:self-start">
              <CardHeader>
                <CardTitle className="text-center">Inscription</CardTitle>
                <CardDescription className="text-center">
                  Rejoignez cette formation dès maintenant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {formatPrice(course.price, course.currency)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Prix par participant
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  {course.start_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Date de début</p>
                        <p className="text-sm text-muted-foreground">{formatDate(course.start_date)}</p>
                      </div>
                    </div>
                  )}
                  
                  {course.end_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Date de fin</p>
                        <p className="text-sm text-muted-foreground">{formatDate(course.end_date)}</p>
                      </div>
                    </div>
                  )}
                  
                  {course.location && !course.is_online && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Lieu</p>
                        <p className="text-sm text-muted-foreground">{course.location}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Places disponibles</p>
                      <p className="text-sm text-muted-foreground">
                        {(course.max_participants || 0) - (course.current_participants || 0)} places restantes
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full bg-accent hover:bg-accent/90 mb-6" size="lg">
                  <Phone className="w-4 h-4 mr-2" />
                  اتصل بنا للاستفسار
                </Button>
                
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Besoin d'informations ?
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trainer Info */}
            {course.trainer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Formateur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {course.trainer.avatar_url ? (
                      <img 
                        src={course.trainer.avatar_url} 
                        alt={course.trainer.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-accent" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{course.trainer.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Formateur expert
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>

        {/* Direct Enrollment Form */}
        <div className="max-w-4xl mx-auto mt-12 px-4 sm:px-6 lg:px-8">
          <DirectEnrollmentForm
            courseId={course.id}
            courseTitle={course.title}
            coursePrice={course.price}
            courseCurrency={course.currency}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
