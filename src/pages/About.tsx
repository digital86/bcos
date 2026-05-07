import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, GraduationCap, Briefcase, Users, Rocket } from 'lucide-react';
import ScrollFloat from '@/components/ScrollFloat';
import Counter from '@/components/Counter';

import SEO from '@/components/SEO';
import { generateOrganizationSchema } from '@/utils/seoUtils';

const About = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const isArabic = language === 'ar';

  const seoData = isArabic ? {
    title: 'عن بيكوص | خبرة 20 سنة في التدريب والاستشارات',
    description: 'تعرف على مؤسسة بيكوص، شريككم في التدريب والاستشارات في الجزائر منذ 2006. خبرة ومرافقة مخصصة للمؤسسات.',
    canonical: 'https://bcos-dz.com/ar/about',
    schemaData: generateOrganizationSchema('ar')
  } : {
    title: 'À propos de BCOS | 20 ans d\'expertise en Formation & Conseil',
    description: 'Découvrez BCOS, votre partenaire en formation et conseil en Algérie depuis 2006. Expertise et accompagnement sur mesure pour les entreprises.',
    canonical: 'https://bcos-dz.com/fr/about',
    schemaData: generateOrganizationSchema('fr')
  };

  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stat-card', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 85%',
        },
      });
    }, statsRef);

    return () => ctx.revert();
  }, []);

  const t = {
    fr: {
      badge: 'Qui sommes-nous ?',
      title: 'BCOS – Établissement de conseil, formation et accompagnement des entreprises',
      intro1: "BCOS est un établissement de formation et de conseil dans le domaine de la gestion et de la gestion des établissements agréés par l’Etat sous le numéro : 1805.",
      intro2: "Depuis sa création en 2006, BCOS a su améliorer sa connaissance des réalités économiques du marché algérien et se positionner comme une référence en matière de formation dans le domaine du management et du développement des collaborateurs.",
      whyTitle: 'Pourquoi choisir BCOS ?',
      why1: 'Conseillers avec une vaste expérience de terrain',
      why2: 'Solutions pratiques adaptées au marché algérien',
      why3: 'Méthodes de formation modernes et engageantes',
      servicesTitle: 'Ce que nous faisons',
      service1Title: 'Cours de formation',
      service1Text: 'Nous proposons des formations (présentielles au siège de l’institution ou en ligne) porteuses de nombreuses valeurs ajoutées destinées aux institutions et aux particuliers.',
      service2Title: 'Service de conseil',
      service2Text: 'Nous permettons à nos clients de gagner du temps en leur apportant l’expertise et les conseils de nos consultants dans différents domaines de la gestion.',
      service3Title: 'Service d’accompagnement',
      service3Text: 'Nous proposons un programme complet d’accompagnement en institution après un diagnostic complet.',
      service4Title: 'Accélérateur de projets',
      service4Text: 'Nous proposons des formations et un accompagnement de terrain aux entrepreneurs émergents afin qu’ils puissent bien gérer leurs projets sur le marché et les développer selon ses exigences et ses enjeux.',
      statsTitle: 'BCOS en chiffres',
      stat1Val: '20+', stat1Label: "Années d'expertise",
      stat2Val: '20000+', stat2Label: 'Participants formés',
      stat3Val: '700+', stat3Label: 'Entreprises clientes',
      stat4Val: '1100+', stat4Label: 'Formations et programmes',
      ctaTitle: 'Prêt à développer vos compétences ?',
      ctaBtn: 'Nos Formations',
      ctaBtn2: 'Nous contacter',
    },
    ar: {
      badge: <><span dir="ltr">BCOS</span> من هي !؟</>,
      title: 'مؤسسة بيكوص للتكوين والاستشارات ومرافقة الشركات',
      intro1: 'بيـــكوص هــــي مؤسسة تكــــــوين واستشارات في مجال التسيير وإدارة المؤسسات معتمدة من طرف الدولة تحت رقم: 1805.',
      intro2: <>منذ إنشائها في عام 2006، تمكنت <span dir="ltr">BCOS</span> من تحسين معرفتها بالحقائق الاقتصادية للسوق الجـــــزائرية، ووضعت نفسها كمرجع في التدريب في مجال الإدارة وتطوير المتعاونين.</>,
      whyTitle: <><span dir="ltr">BCOS</span> لماذا !؟</>,
      why1: 'مستشارون ذوو خبرة ميدانية طويلة.',
      why2: 'حلول عملية وملموسة تتلاءم مع السوق الجزائرية.',
      why3: 'أساليب وتقنيات تكوينية ممتعة وحديثة.',
      servicesTitle: 'ماذا نقدم؟',
      service1Title: 'الدورات التكوينية',
      service1Text: 'نقدم دورات تكوينية تحمل العديد من القيم المضافة مخصصة للمؤسسات والأفراد.',
      service2Title: 'استشـارات ومرافقة ميدانية',
      service2Text: 'نحن نمكن زبائننا من توفير الوقت بتقديم خبرات ونصائح من مستشارينا في مختلف مجالات تسيير الشركات، كما نوفر برنامج متكـامل لمرافقة المؤسسات بعد تشخيص كلي لها.',
      service3Title: 'منصة للتعلم أونلاين',
      service3Text: 'نرافقك في رحلة تطوير شركتك من خلال دورات أونلاين في منصة متكاملة بطرق عرض إبداعية.',
      service4Title: 'مسرعة المشاريع',
      service4Text: 'نقدم دورات تكوينية ومرافقة ميدانية لأصحاب المشاريع الناشئة حتى يتمكنوا من إطلاق مشاريعهم في السوق الجزائرية وتطويرها وفق متطلباته وتحدياته.',
      statsTitle: 'بيكوص بالأرقام',
      stat1Val: '20+', stat1Label: 'سنوات الخبرة',
      stat2Val: '20000+', stat2Label: <>مشارك في دورات <span dir="ltr">BCOS</span></>,
      stat3Val: '700+', stat3Label: 'شركة استفادت من خدماتنا',
      stat4Val: '1100+', stat4Label: 'عدد الدورات و البرامج',
      ctaTitle: 'هل أنت مستعد لتطوير مهاراتك؟',
      ctaBtn: 'دوراتنا',
      ctaBtn2: 'اتصل بنا',
    }
  };

  const content = t[language];

  const services = [
    { icon: GraduationCap, title: content.service1Title, text: content.service1Text, color: 'bg-blue-500' },
    { icon: Briefcase, title: content.service2Title, text: content.service2Text, color: 'bg-indigo-500' },
    { icon: Users, title: content.service3Title, text: content.service3Text, color: 'bg-purple-500' },
    { icon: Rocket, title: content.service4Title, text: content.service4Text, color: 'bg-accent' },
  ];

  const stats = [
    { value: content.stat1Val, label: content.stat1Label },
    { value: content.stat2Val, label: content.stat2Label },
    { value: content.stat3Val, label: content.stat3Label },
    { value: content.stat4Val, label: content.stat4Label },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isArabic ? 'rtl' : 'ltr'}>
      <SEO {...seoData} lang={language as any} />
      <main className="pb-12">

        {/* ── Hero ── */}
        <section className="py-14 sm:py-20 lg:py-28 relative min-h-[50vh] sm:min-h-[60vh] flex items-center">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&q=80&fm=webp')` }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(37, 59, 116, 0.80)' }} />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block mb-3 sm:mb-4">
                <Badge className="bg-accent text-accent-foreground px-3 py-1 text-xs sm:text-sm">
                  {content.badge}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-white mb-4 leading-tight">
                {content.title}
              </h1>
              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed max-w-3xl mx-auto">
                <p>{content.intro1}</p>
                <p>{content.intro2}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why BCOS ── */}
        <section className="py-12 sm:py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://i.postimg.cc/j5LccKrM/Asset-1.webp"
              alt="Background"
              className="w-full h-full object-cover opacity-30"
            />
          </div>
          <div className="absolute inset-0 bg-background/20" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
              {/* Image */}
              <div className="order-2 lg:order-1">
                <img
                  src="https://i.postimg.cc/x84HsR5Q/Asset-8.webp"
                  alt="BCOS Asset"
                  className="w-full h-auto rounded-xl sm:rounded-2xl max-w-sm mx-auto lg:max-w-none object-cover"
                />
              </div>

              {/* Text */}
              <div className={`space-y-4 sm:space-y-6 order-1 lg:order-2 flex flex-col ${isArabic ? 'items-end text-right' : 'items-start text-left'}`}>
                <div style={{ color: '#253b74' }} className="w-full">
                  <ScrollFloat
                    containerClassName={`text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-heading leading-tight font-bold`}
                  >
                    {content.whyTitle}
                  </ScrollFloat>
                </div>
                <ul className="space-y-2 sm:space-y-3 w-full">
                  {[content.why1, content.why2, content.why3].filter(p => p && p.trim() !== '').map((point, i) => (
                    <li key={i} className={`text-sm sm:text-base text-black leading-relaxed flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className={`flex flex-col sm:flex-row gap-3 pt-2 w-full ${isArabic ? 'sm:flex-row-reverse justify-start' : 'justify-start'}`}>
                  <Button size="default" className="rounded-xl sm:rounded-2xl gradient-primary text-sm sm:text-base" asChild>
                    <Link to={isArabic ? '/ar/qui-sommes-nous' : '/fr/qui-sommes-nous'}>
                      {isArabic ? 'اكتشف بيكوص' : 'Découvrir BCOS'}
                      <ArrowRight className={`w-4 h-4 ${isArabic ? 'mr-1 rotate-180' : 'ml-1'}`} />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Services ── */}
        <section className="py-10 sm:py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-foreground mb-8 sm:mb-12 text-center">
              {content.servicesTitle}
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {services.map((service, index) => (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border hover:border-primary/20 group overflow-hidden relative"
                >
                  <CardContent className="p-4 sm:p-6 relative z-10 flex flex-col items-center text-center">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${service.color} rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-md group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                      <service.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-1 sm:mb-2 w-full">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm w-full">
                      {service.text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-10 sm:py-16 lg:py-24" style={{ background: 'linear-gradient(135deg, rgba(37,59,116,0.08) 0%, rgba(37,59,116,0.04) 100%)' }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8" ref={statsRef}>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-foreground mb-6 sm:mb-10 text-center">
              {content.statsTitle}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 max-w-4xl mx-auto">
              {stats.map((stat, i) => (
                <Card key={i} className="stat-card text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1" style={{ color: '#253b74' }}>
                      <Counter end={stat.value} />
                    </h3>
                    <p className="text-muted-foreground font-medium text-xs sm:text-sm">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>



      </main>
    </div>
  );
};

export default About;
