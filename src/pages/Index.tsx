import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import About from '@/components/About';
import WhyChoose from '@/components/WhyChoose';
import Services from '@/components/Services';
import References from '@/components/References';
import TrainingCarousel from '@/components/TrainingCarousel';
import OnlineTrainingSection from '@/components/OnlineTrainingSection';
import SEO from '@/components/SEO';

// Lazy load non-critical sections to reduce initial DOM size
const Testimonials = lazy(() => import('@/components/Testimonials'));
const Blog = lazy(() => import('@/components/Blog'));
const CircularGallerySection = lazy(() => import('@/components/CircularGallerySection'));
import { generateOrganizationSchema } from '@/utils/seoUtils';

const Index = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const seoData = language === 'ar' ? {
    title: 'بيكوص - تدريب واستشارات | 20 سنة من الخبرة في الجزائر',
    description: 'بيكوص ترافق الشركات الجزائرية منذ 2006: تدريب مهني، تعلم إلكتروني، استشارات وكوتشينج. أكثر من 30,000 مشارك في دورات BCOS.',
    canonical: 'https://bcos-dz.com/ar',
    schemaData: generateOrganizationSchema('ar')
  } : {
    title: "BCOS - Formation & Conseil | 20 ans d'expérience en Algérie",
    description: "BCOS accompagne les entreprises algériennes depuis 2006 : formations professionnelles, e-learning, conseil et coaching. Plus de 30 000 participants formés.",
    canonical: 'https://bcos-dz.com/fr',
    schemaData: generateOrganizationSchema('fr')
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <SEO {...seoData} lang={language as any} />
      <main className="pb-16">
        <Hero />
        <Stats />
        <WhyChoose />
        <About />
        <Services />
        <TrainingCarousel />
        <OnlineTrainingSection />
        <References />
        
        <Suspense fallback={<div className="min-h-[450px] w-full animate-pulse bg-muted/10 rounded-3xl my-10" />}>
          <Testimonials />
        </Suspense>
        
        <Suspense fallback={<div className="min-h-[600px] w-full animate-pulse bg-muted/10 rounded-3xl my-10" />}>
          <Blog />
        </Suspense>
        
        <Suspense fallback={<div className="min-h-[500px] w-full animate-pulse bg-muted/10 rounded-3xl my-10" />}>
          <CircularGallerySection />
        </Suspense>
      </main>
    </div>
  );
};

export default Index;
