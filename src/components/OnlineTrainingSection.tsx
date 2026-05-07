import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const OnlineTrainingSection: React.FC = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const translations = {
    fr: {
      title: "Explorez l'excellence avec nos formations en ligne adaptées à tous !",
      subtitle: "Que vous soyez entrepreneur, manager ou professionnel, nos formations créatives et pratiques vous aideront à atteindre vos objectifs et à développer vos compétences.",
      buttonText: "Découvrir nos formations"
    },
    ar: {
      title: "اكتشف عالم المعرفة والتطوير من خلال دوراتنا الأونلاين المميزة!",
      subtitle: "نساعد رواد الأعمال على تطوير مشاريعهم من خلال دورات أونلاين بطرق عرض إبداعية وفعالة!",
      buttonText: "منصة بيكوص التعليمية"
    }
  };

  const t = translations[language];

  return (
    <section 
      ref={sectionRef}
      className="py-6 lg:py-8"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text Content */}
          <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-center lg:text-left'} transition-all duration-1000 transform ${isVisible ? 'translate-x-0 opacity-100' : (language === 'ar' ? 'translate-x-32' : '-translate-x-32') + ' opacity-0'}`} dir={dir}>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-heading font-bold text-foreground mb-6 leading-tight">
              {t.title}
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto lg:mx-0">
              {t.subtitle}
            </p>
            <a href="https://elearning.bcos-dz.com/" target="_blank" rel="noopener noreferrer">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {t.buttonText}
                <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            </a>
          </div>
          
          {/* Image */}
          <div className={`flex-1 flex justify-center lg:justify-end transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-x-0 opacity-100' : (language === 'ar' ? 'translate-x-32' : '-translate-x-32') + ' opacity-0'}`}>
            <div className="w-full max-w-xl">
              <img
                src="https://res.cloudinary.com/de88x1rlt/image/upload/f_auto,q_auto/Artboard_3_3x_qt88lm"
                alt={language === 'ar' ? 'دورات تدريبية عبر الإنترنت' : 'Formations en ligne'}
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OnlineTrainingSection;