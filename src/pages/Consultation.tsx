import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EditableText, EditableImage } from '@/components/admin/EditableContent';
import GoogleSheetsEnrollmentForm from '@/components/GoogleSheetsEnrollmentForm';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

import SEO from '@/components/SEO';

const Consultation = () => {
  const location = useLocation();
  const [language, setLanguage] = useState<'fr' | 'ar'>(() => {
    if (typeof window === 'undefined') return 'fr';
    const path = window.location.pathname;
    return (path.includes('/ar/') || path === '/ar' || path.endsWith('/ar')) ? 'ar' : 'fr';
  });

  const seoData = language === 'ar' ? {
    title: 'الاستشارة والمرافقة الميدانية | بيكوص الجزائر',
    description: 'وفر وقتك وجهدك مع جلسات الاستشارة والمرافقة الميدانية من خبراء بيكوص. حلول تسيير ذكية للمؤسسات.',
    canonical: 'https://bcos-dz.com/ar/consultation-et-accompagnement-sur-le-terrain'
  } : {
    title: 'Consultation et Accompagnement sur le Terrain | BCOS Algérie',
    description: 'Économisez vos efforts et votre temps grâce à des séances de conseil avec nos experts. Accompagnement sur mesure pour les entreprises.',
    canonical: 'https://bcos-dz.com/fr/consultation-et-accompagnement-sur-le-terrain'
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/ar/') || path === '/ar' || path.endsWith('/ar')) {
      setLanguage('ar');
    } else {
      setLanguage('fr');
    }
  }, [location.pathname]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-element', {
        y: 40,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power3.out',
      });

      gsap.from('.content-card', {
        scrollTrigger: {
          trigger: '.content-card',
          start: 'top 80%',
        },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });
    }, [heroRef, contentRef]);

    return () => ctx.revert();
  }, [language]);

  const t = {
    fr: {
      title: 'Économisez désormais vos efforts et votre temps grâce à des séances de conseil avec nos experts',
      desc: "Nous permettons à nos clients de gagner du temps en leur apportant l'expertise et les conseils de nos experts dans divers domaines de gestion. Nous proposons également un programme intégré pour accompagner les institutions et les entreprises après un diagnostic complet",
      formTitle: "Intéressé par nos services de conseil et l'accompagnement ?"
    },
    ar: {
      title: 'وفر الآن جهدك ووقتك من خلال جلسات الاستشارة مع خبرائنا..',
      desc: 'نحن نمكن زبائننا من توفير الوقت بتقديم خبرات ونصائح من خبرائنا في مختلف مجالات التسيير . كما نوفر برنامجا متكاملا لمرافقة المؤسسات والشركات بعد تشخيص كلي لها',
      formTitle: 'مهتم بخدماتنا في الاستشارة والمرافقة؟ .. سجل الآن'
    }
  }[language];

  const isRtl = language === 'ar';

  return (
    <div className={`min-h-screen bg-slate-50 pb-20 ${isRtl ? 'font-[\'Almarai\',sans-serif]' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <SEO {...seoData} lang={language as any} />
      
      {/* Premium Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-24 lg:pt-56 lg:pb-40 flex items-center justify-center overflow-hidden min-h-[65vh]">
        <div className="absolute inset-0 z-0">
          <EditableImage 
            pageKey="consult"
            contentKey="consult_hero_bg" 
            defaultUrl="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80" 
            className="w-full h-full object-cover scale-105" 
            alt="Consultation BCOS" 
          />
          <div className="absolute inset-0 bg-[#253b74]/70 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="hero-element text-3xl md:text-5xl lg:text-6xl font-heading font-black text-white leading-tight max-w-5xl mx-auto drop-shadow-xl">
            <EditableText pageKey="consult" contentKey={`consult_text_${language}_title_v2`} defaultContent={t.title} />
          </h1>
        </div>
      </section>

      <main className="container mx-auto px-4 lg:px-8 relative z-20 -mt-8 lg:-mt-24 max-w-6xl">
        
        {/* Description Glass Card */}
        <div ref={contentRef} className="content-card mb-12 lg:mb-20 bg-white/80 backdrop-blur-xl rounded-3xl p-6 lg:p-14 shadow-2xl shadow-blue-900/5 border border-white">
          <p className="text-lg lg:text-3xl text-slate-700 leading-relaxed font-medium text-center max-w-4xl mx-auto">
            <EditableText pageKey="consult" contentKey={`consult_text_${language}_desc_v2`} defaultContent={t.desc} multiline />
          </p>
        </div>

        {/* Premium Contact Form directly matching IntraEnterprise format */}
        <div className="max-w-4xl mx-auto bg-[#253b74] rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden relative">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
           <div className="relative z-10 pt-14 pb-10 px-6 lg:px-12 text-center">
              <h3 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-4">
                <EditableText pageKey="consult" contentKey={`consult_text_${language}_formtitle_v2`} defaultContent={t.formTitle} />
              </h3>
              <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                {language === 'ar' ? 'سجل الآن وسنتواصل معك في أقرب وقت لترتيب جلستك الاستشارية.' : "Inscrivez-vous maintenant et nous vous contacterons dans les plus brefs délais pour organiser votre séance."}
              </p>
              
              <div className="bg-white rounded-2xl p-6 lg:p-10 shadow-inner text-left" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <GoogleSheetsEnrollmentForm 
                  courseName={language === 'ar' ? 'طلب استشارة ومرافقة' : 'Demande de consultation et accompagnement'} 
                  language={language} 
                  theme="transparent"
                />
              </div>
           </div>
        </div>

      </main>
    </div>
  );
};

export default Consultation;
