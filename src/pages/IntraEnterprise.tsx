import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  FileEdit, MapPin, CircleDollarSign, Wrench, Users, Calendar, 
  MonitorSmartphone, BarChart3, Lightbulb, Calculator, Boxes,
  Factory, Stethoscope, ShoppingCart, Truck, HardHat, Laptop, Satellite, Plane
} from 'lucide-react';
import { EditableImage } from '@/components/admin/EditableContent';
import GoogleSheetsEnrollmentForm from '@/components/GoogleSheetsEnrollmentForm';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

import SEO from '@/components/SEO';
import { generateLocalBusinessSchema } from '@/utils/seoUtils';


const IntraEnterprise = () => {
  const location = useLocation();
  const [language, setLanguage] = useState<'fr' | 'ar'>(() => {
    if (typeof window === 'undefined') return 'fr';
    const path = window.location.pathname;
    return (path.includes('/ar/') || path === '/ar' || path.endsWith('/ar')) ? 'ar' : 'fr';
  });

  const seoData = language === 'ar' ? {
    title: 'تكوينات داخل المؤسسة | بيكوص الجزائر',
    description: 'طور مهارات فرق عملك مع تكوينات بيكوص داخل المؤسسة. برامج مخصصة، تكوين في الموقع، وتحسين التكاليف.',
    canonical: 'https://bcos-dz.com/ar/formations-intra',
    schemaData: generateLocalBusinessSchema('ar')
  } : {
    title: 'Formations Intra-entreprises | BCOS Algérie',
    description: 'Faites évoluer vos équipes vers l\'excellence avec les formations intra-entreprises de BCOS. Contenu personnalisé et formation sur site.',
    canonical: 'https://bcos-dz.com/fr/formations-intra',
    schemaData: generateLocalBusinessSchema('fr')
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const [statistics, setStatistics] = useState<any[]>([]);

  const sectionsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

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
        y: 50,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power3.out',
      });
    }, sectionsRef);

    return () => ctx.revert();
  }, [language]);

  const isRtl = language === 'ar';

  const t = {
    fr: {
      heroTitle: "Formations Intra-entreprises BCOS",
      heroSub: "Faites évoluer vos équipes vers l'excellence",
      whyTitle: "Pourquoi choisir BCOS ?",
      whyItems: [
        { icon: <FileEdit size={32} />, title: "Contenu personnalisé", desc: "Programmes adaptés aux besoins spécifiques de votre entreprise." },
        { icon: <MapPin size={32} />, title: "Formation sur site", desc: "Nos formateurs se déplacent dans vos locaux." },
        { icon: <CircleDollarSign size={32} />, title: "Optimisation des coûts", desc: "Solution économique pour former plusieurs collaborateurs." },
        { icon: <Wrench size={32} />, title: "Outils pratiques", desc: "Méthodes concrètes directement applicables en entreprise." },
        { icon: <Users size={32} />, title: "Cohésion d'équipe", desc: "Renforce la collaboration interne et l’esprit d’équipe." },
        { icon: <Calendar size={32} />, title: "Flexibilité maximale", desc: "Sessions planifiées selon votre disponibilité." }
      ],
      expertiseTitle: "Nos domaines d'expertise",
      expertises: [
        { icon: <MonitorSmartphone size={28} />, name: "Digital & Intelligence Artificielle" },
        { icon: <BarChart3 size={28} />, name: "Commercial & Marketing" },
        { icon: <Lightbulb size={28} />, name: "Management & Leadership" },
        { icon: <Calculator size={28} />, name: "Finance & Comptabilité" },
        { icon: <Boxes size={28} />, name: "Logistique & Supply Chain" },
        { icon: <Users size={28} />, name: "Ressources Humaines" }
      ],
      sectorsTitle: "Nos formations par secteur d'activité",
      sectors: [
        { icon: <Factory size={24} />, name: "Industrie & Production" },
        { icon: <Stethoscope size={24} />, name: "Santé & Pharmaceutique" },
        { icon: <ShoppingCart size={24} />, name: "Grande distribution & Commerce" },
        { icon: <Truck size={24} />, name: "Transport & Logistique" },
        { icon: <HardHat size={24} />, name: "BTP & Construction" },
        { icon: <Laptop size={24} />, name: "Informatique & Digital" },
        { icon: <Satellite size={24} />, name: "Télécommunications" },
        { icon: <Plane size={24} />, name: "Aéronautique & Automobile" }
      ],
      formTitle: "Intéressé par nos services ?"
    },
    ar: {
      heroTitle: "تكوينات داخل المؤسسة بيكوص",
      heroSub: "ارتقِ بفرق عملك نحو التميز",
      whyTitle: "لماذا تختار بيكوص؟",
      whyItems: [
        { icon: <FileEdit size={32} />, title: "محتوى مخصص", desc: "برامج تتناسب مع الاحتياجات الخاصة لشركتك." },
        { icon: <MapPin size={32} />, title: "تكوين في الموقع", desc: "المدربون لدينا ينتقلون إلى مقرك." },
        { icon: <CircleDollarSign size={32} />, title: "تحسين التكاليف", desc: "حل اقتصادي لتكوين العديد من المتعاونين." },
        { icon: <Wrench size={32} />, title: "أدوات عملية", desc: "أساليب ملموسة قابلة للتطبيق مباشرة في الشركة." },
        { icon: <Users size={32} />, title: "تماسك الفريق", desc: "يعزز التعاون الداخلي وروح الفريق." },
        { icon: <Calendar size={32} />, title: "مرونة قصوى", desc: "جلسات مبرمجة حسب توفرك." }
      ],
      expertiseTitle: "مجالات خبرتنا",
      expertises: [
        { icon: <MonitorSmartphone size={28} />, name: "الرقمنة والذكاء الاصطناعي" },
        { icon: <BarChart3 size={28} />, name: "التجارة والتسويق" },
        { icon: <Lightbulb size={28} />, name: "الإدارة والقيادة" },
        { icon: <Calculator size={28} />, name: "المالية والمحاسبة" },
        { icon: <Boxes size={28} />, name: "اللوجستيك وسلسلة التوريد" },
        { icon: <Users size={28} />, name: "الموارد البشرية" }
      ],
      sectorsTitle: "تكويناتنا حسب قطاع النشاط",
      sectors: [
        { icon: <Factory size={24} />, name: "الصناعة والإنتاج" },
        { icon: <Stethoscope size={24} />, name: "الصحة والصيدلة" },
        { icon: <ShoppingCart size={24} />, name: "التوزيع الكبير والتجارة" },
        { icon: <Truck size={24} />, name: "النقل واللوجستيك" },
        { icon: <HardHat size={24} />, name: "البناء والأشغال العمومية" },
        { icon: <Laptop size={24} />, name: "الإعلام الآلي والرقمنة" },
        { icon: <Satellite size={24} />, name: "الاتصالات" },
        { icon: <Plane size={24} />, name: "الطيران والسيارات" }
      ],
      formTitle: "مهتم بخدماتنا؟"
    }
  }[language];

  return (
    <div ref={sectionsRef} className={`min-h-screen bg-background pb-16 ${isRtl ? 'font-[\'Almarai\',sans-serif]' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <SEO {...seoData} lang={language as any} />
      
      {/* Premium Hero Section */}
      <section ref={heroRef} className="relative pt-24 pb-12 lg:pt-48 lg:pb-32 flex items-center justify-center overflow-hidden min-h-[50vh] md:min-h-[70vh]">
        <div className="absolute inset-0 z-0">
          <EditableImage 
            pageKey="intra"
            contentKey="intra_hero_bg" 
            defaultUrl="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&fm=webp" 
            className="w-full h-full object-cover" 
            alt="Corporate Excellence" 
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-[#253b74]/80 backdrop-blur-[2px]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="hero-element text-2xl md:text-6xl lg:text-7xl font-heading font-black text-white leading-tight mb-4 md:mb-6 max-w-4xl mx-auto drop-shadow-lg">
            {t.heroTitle}
          </h1>
          <p className="hero-element text-base md:text-3xl text-white/95 max-w-3xl mx-auto font-medium tracking-wide drop-shadow-md">
            {t.heroSub}
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 lg:px-8 mt-16 max-w-7xl">
        
        {/* Pourquoi choisir BCOS ? */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-4xl font-heading font-bold text-center mb-8 md:mb-12 text-[#253b74]">
            {t.whyTitle}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {t.whyItems.map((item, index) => (
              <div key={index} className="h-full flex flex-col bg-white rounded-2xl p-5 md:p-8 shadow-lg shadow-blue-900/5 border border-blue-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl shrink-0 bg-blue-50 text-blue-600 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-[#253b74] group-hover:text-white transition-colors duration-300">
                  <div className="scale-75 md:scale-100">{item.icon}</div>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-[#253b74] mb-2 md:mb-3 leading-snug">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base flex-grow">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Nos domaines d'expertise */}
        <div className="mb-16 py-8 md:py-12 bg-slate-50 rounded-3xl px-4 md:px-12 border border-slate-100">
          <h2 className="text-2xl md:text-4xl font-heading font-bold text-center mb-8 md:mb-12 text-[#253b74]">
            {t.expertiseTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
             {t.expertises.map((exp, index) => (
                <div key={index} className="flex items-center gap-3 md:gap-4 bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-100/50 hover:border-blue-200 transition-colors">
                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 text-[#253b74] flex flex-shrink-0 items-center justify-center scale-90 md:scale-100">
                     {exp.icon}
                   </div>
                   <h4 className="font-bold text-base md:text-lg text-slate-800">{exp.name}</h4>
                </div>
             ))}
          </div>
        </div>

        {/* Nos formations par secteur d'activité */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-4xl font-heading font-bold text-center mb-8 md:mb-12 text-[#253b74]">
            {t.sectorsTitle}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {t.sectors.map((sector, index) => (
              <div key={index} className="group flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-3 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-default text-slate-700 hover:text-[#253b74] text-center sm:text-left">
                <span className="text-[#253b74]/60 group-hover:text-blue-500 transition-colors scale-75 sm:scale-100">{sector.icon}</span>
                <span className="font-semibold text-xs sm:text-base">{sector.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Contact Form */}
        <div className="max-w-4xl mx-auto bg-[#253b74] rounded-2xl shadow-xl overflow-hidden relative">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3')] opacity-5 bg-cover bg-center"></div>
           <div className="relative z-10 pt-8 pb-6 md:pt-12 md:pb-8 px-4 md:px-12 text-center">
              <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-2 md:mb-3">{t.formTitle}</h3>
              <p className="text-white/80 text-sm md:text-lg mb-6 md:mb-8 max-w-xl mx-auto">
                {language === 'ar' ? 'سجل الآن وسنتواصل معك في أقرب وقت لتخصيص محتواك التدريبي.' : 'Inscrivez-vous maintenant et nous vous contacterons dans les plus brefs délais pour personnaliser votre formation.'}
              </p>
              
              <div className="bg-white rounded-xl p-4 md:p-8 shadow-inner text-left" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <GoogleSheetsEnrollmentForm 
                  courseName={language === 'ar' ? 'تكوين داخل المؤسسة' : 'Formations Intra-entreprises'} 
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

export default IntraEnterprise;