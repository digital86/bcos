import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import { generateLocalBusinessSchema } from '@/utils/seoUtils';
import GoogleSheetsEnrollmentForm from '@/components/GoogleSheetsEnrollmentForm';

const ProjectAccelerator = () => {
  const location = useLocation();
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/ar/') || path === '/ar' || path.endsWith('/ar')) {
      setLanguage('ar');
    } else {
      setLanguage('fr');
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const seoData = language === 'ar' ? {
    title: 'مسرعة المشاريع | بيكوص الجزائر',
    description: 'ندعمك في رحلة ريادة الأعمال من خلال مسرعة المشاريع بيكوص. مرافقة مكثفة، دورات تكوينية، واستشارات متخصصة.',
    canonical: 'https://bcos-dz.com/ar/accelerateur-de-projets',
    schemaData: generateLocalBusinessSchema('ar')
  } : {
    title: 'Accélérateur de Projets | BCOS Algérie',
    description: 'Nous vous accompagnons dans votre parcours entrepreneurial avec l\'accélérateur de projets BCOS. Accompagnement intensif et coaching stratégique.',
    canonical: 'https://bcos-dz.com/fr/accelerateur-de-projets',
    schemaData: generateLocalBusinessSchema('fr')
  };

  const translations = {
    fr: {
      badge: 'Programme',
      heroTitle: "Accélérateur de projets BCOS..",
      heroSubtitle: "Nous vous accompagnons dans votre parcours entrepreneurial",
      heroDesc: "Nous proposons des formations et un accompagnement aux nouveaux entrepreneurs afin qu'ils puissent assurer la bonne gestion de leurs projets sur le marché et leur développement en fonction de ses exigences et enjeux. Grâce à nos services représentés dans :",
      benefitsTitle: "Nos services incluent :",
      benefit1: "Consultations",
      benefit2: "Ateliers de formation (En personne et en ligne)",
      benefit3: "Suivi privé",
      benefit4: "Un espace de travail commun",
      projectsTitle: "Modèles de projets de l'accélérateur..",
      enrollmentTitle: "Inscription au programme",
    },
    ar: {
      badge: 'البرنامج',
      heroTitle: "مسرعة المشاريع بيكوص..",
      heroSubtitle: "ندعمك في رحلة ريادة الأعمال",
      heroDesc: "نقدم دورات تكوينية ومرافقة لأصحاب المشاريع الجديد حتى يتمكنوا من التسيير الجيد لمشاريعهم في السوق وتطويرها وفق متطلباته وتحدياته من خلال خدماتنا المتمثلة في:",
      benefitsTitle: "خدماتنا تشمل:",
      benefit1: "استشــــارات",
      benefit2: "ورشات تكوينية (حضورية وأونلاين)",
      benefit3: "متابعة خاصة",
      benefit4: "مساحة العمل المشتركة",
      projectsTitle: "نماذج من مشاريع المسرعة..",
      enrollmentTitle: "التسجيل في البرنامج",
    }
  };

  const t = translations[language];
  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEO {...seoData} lang={language} />
      <main className="pb-12">

        {/* ── Hero ── */}
        <section className="py-10 sm:py-20 lg:py-28 relative min-h-[40vh] sm:min-h-[60vh] flex items-center">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&fm=webp')` }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(37, 59, 116, 0.80)' }} />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block mb-2 sm:mb-4">
                <Badge className="bg-accent text-accent-foreground px-2 py-0.5 text-[10px] sm:text-sm">
                  {t.badge}
                </Badge>
              </div>
              <h1 className="text-xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-white mb-2 sm:mb-4 leading-tight">
                {t.heroTitle}
              </h1>
              <h2 className="text-xs sm:text-xl lg:text-2xl font-heading font-semibold text-white mb-3 sm:mb-6">
                {t.heroSubtitle}
              </h2>
              <p className="text-[10px] sm:text-base lg:text-lg text-white/90 leading-relaxed max-w-3xl mx-auto">
                {t.heroDesc}
              </p>
            </div>
          </div>
        </section>

        {/* ── Benefits ── */}
        <section className="py-8 sm:py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-heading font-bold text-foreground mb-6 sm:mb-10 text-center">
              {t.benefitsTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 max-w-6xl mx-auto">
              {[t.benefit1, t.benefit2, t.benefit3, t.benefit4].map((benefit, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(37, 59, 116, 0.1)' }}>
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  <span className="text-foreground font-medium text-xs sm:text-sm leading-snug">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── Enrollment Form ── */}
        <section className="py-10 sm:py-16 lg:py-24 bg-gray-50/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">
                  {t.enrollmentTitle}
                </h3>
                <div className="w-16 h-1 bg-accent mx-auto rounded-full"></div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-6">
                <GoogleSheetsEnrollmentForm 
                  courseName={language === 'ar' ? "مسرعة المشاريع" : "Accélérateur de Projets"}
                  language={language}
                />
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default ProjectAccelerator;
