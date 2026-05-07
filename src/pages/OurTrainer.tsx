import { useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import TrainersSection from '@/components/TrainersSection';
import ImageCarousel from '@/components/ImageCarousel';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

import SEO from '@/components/SEO';
import { generateLocalBusinessSchema } from '@/utils/seoUtils';


const OurTrainer = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const pageRef = useRef<HTMLDivElement>(null);

  const seoData = language === 'ar' ? {
    title: 'خبراؤنا ومكونونا | بيكوص الجزائر',
    description: 'تعرف على شبكة الخبراء والمكونين المتخصصين في بيكوص. خبرة ميدانية لمرافقة نجاحكم.',
    canonical: 'https://bcos-dz.com/ar/experts',
    schemaData: generateLocalBusinessSchema('ar')
  } : {
    title: 'Nos Experts et Formateurs | BCOS Algérie',
    description: 'Découvrez le réseau d\'experts et de formateurs spécialisés de BCOS. Une expérience terrain pour accompagner votre réussite.',
    canonical: 'https://bcos-dz.com/fr/experts',
    schemaData: generateLocalBusinessSchema('fr')
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.gallery-title', {
        scrollTrigger: {
          trigger: '.gallery-section',
          start: 'top 80%',
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out'
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-background">
      <SEO {...seoData} lang={language as any} />
      <main className="pt-20 pb-16">
        <TrainersSection />
        
        <div className="gallery-section mt-20">
          <div className="container mx-auto px-4 lg:px-8 text-center mb-10">
            <h2 className="gallery-title text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
              {language === 'ar' ? 'معرض صور فعالياتنا' : 'Notre Galerie d\'événements'}
            </h2>
          </div>
          <ImageCarousel />
        </div>
      </main>
    </div>
  );
};

export default OurTrainer;
