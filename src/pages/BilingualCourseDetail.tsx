import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { SupabaseService } from '@/lib/supabase';
import { toast } from 'sonner';
import GoogleSheetsEnrollmentForm from '@/components/GoogleSheetsEnrollmentForm';
import type { Formation } from '../../supabase-config';
import References from '@/components/References';

import SEO from '@/components/SEO';
import { generateCourseSchema } from '@/utils/seoUtils';

const BilingualCourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = window.location;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Detect language from URL path - handle /ar/ or /fr/ anywhere in path
  const [language, setLanguage] = useState<'fr' | 'ar'>(
    pathname.includes('/ar/') || pathname.endsWith('/ar/') || pathname.endsWith('/ar') ? 'ar' : 'fr'
  );
  
  const [course, setCourse] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const courseTitle = course ? (language === 'ar' ? (course.title_ar || course.title) : (course.title_fr || course.title)) : '';
  const courseDesc = course ? (language === 'ar' ? (course.description_ar || course.description) : (course.description_fr || course.description)) : '';
  
  const seoData = {
    title: `${courseTitle} | BCOS Formation`,
    description: courseDesc || `Découvrez notre formation ${courseTitle} en Algérie.`,
    canonical: `https://bcos-dz.com/${language}/formation/${slug}`,
    schemaData: course ? generateCourseSchema({
      name: courseTitle,
      description: courseDesc,
      provider: "BCOS Formation & Conseil",
      url: `https://bcos-dz.com/${language}/formation/${slug}`,
      image: course.cover_image_url || course.image_url
    }) : undefined
  };

  // Update language when path changes
  useEffect(() => {
    if (pathname.includes('/ar/') || pathname.endsWith('/ar/') || pathname.endsWith('/ar')) {
      setLanguage('ar');
    } else {
      setLanguage('fr');
    }
  }, [pathname]);

  useEffect(() => {
    const loadCourse = async () => {
      if (!slug) {
        setError('Slug du cours manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await SupabaseService.getFormationBySlug(slug);
        
        if (!data) {
          setError('Cours non trouvé');
          return;
        }
        
        setCourse(data);
      } catch (err: any) {
        console.error('Error loading course:', err);
        setError('Erreur lors du chargement du cours');
        toast.error('Erreur lors du chargement du cours');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [slug]);


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

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <SEO {...seoData} lang={language as any} />
      {/* Simple Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 py-8 pt-32">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button 
              onClick={() => navigate(language === 'ar' ? '/ar/formations' : '/fr/formations')} 
              variant="ghost"
            >
              <ArrowLeft className={`w-4 h-4 \${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'العودة إلى الدورات' : 'Retour aux formations'}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant={language === 'fr' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setLanguage('fr');
                  navigate(`/fr/formation/${slug}`, { replace: true });
                }}
              >
                FR
              </Button>
              <Button
                variant={language === 'ar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setLanguage('ar');
                  navigate(`/ar/formation/${slug}`, { replace: true });
                }}
              >
                عربي
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-0 sm:px-4 py-4 sm:py-12">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          {/* Category Badge */}
          {course.category && (
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-lg px-6 py-2">
                {language === 'ar' ? course.category.name_ar || course.category.name : course.category.name_fr || course.category.name}
              </Badge>
            </div>
          )}

          {/* HTML Content */}
          {(course.content_fr || course.content_ar || course.content) && (
            <Card className="rounded-none sm:rounded-xl border-x-0 sm:border-x shadow-none sm:shadow-sm">
              <CardContent className="p-0">
                <div 
                  className="prose prose-sm sm:prose-lg max-w-none p-2 sm:p-6
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
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  dangerouslySetInnerHTML={{ 
                    __html: (() => {
                      let baseContent = language === 'ar' 
                        ? (course.content_ar || course.content_fr || course.content || '')
                        : (course.content_fr || course.content || '');
                      
                      const imageUrl = course.cover_image_url || course.image_url || 'https://i.postimg.cc/x84HsR5Q/Asset-8.webp';
                      
                      // 1. Try to find image tags inside the template's designated column and replace their src
                      // This handles legacy courses with hardcoded freepik or other URLs
                      let processed = baseContent.replace(
                        /(<div class="w-full md:w-2\/5">[\s\S]*?<img src=")([^"]+)(")/g, 
                        `$1${imageUrl}$3`
                      );
                      
                      // 2. Also replace the explicit [COURSE_IMAGE] placeholder for new generations
                      return processed.replace(/\[COURSE_IMAGE\]/g, imageUrl);
                    })()
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* References Section */}
          <div className="py-8">
            <References />
          </div>

          {/* Enrollment Form */}
          <Card className="rounded-none sm:rounded-xl border-x-0 sm:border-x shadow-none sm:shadow-sm">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {language === 'ar' ? 'التسجيل في الدورة' : 'Inscription à la formation'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GoogleSheetsEnrollmentForm
                course={course}
                language={language}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BilingualCourseDetail;
