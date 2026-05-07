import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight,
  Calendar,
  Users,
  Heart,
  BookOpen,
  Award,
  Briefcase,
  Sparkles,
  Star,
  Zap,
  Target,
  MapPin,
} from 'lucide-react';
import EventForm from '@/components/EventForm';

import SEO from '@/components/SEO';
import { generateLocalBusinessSchema } from '@/utils/seoUtils';


const Evenements = () => {
  const location = useLocation();
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/ar/')) {
      setLanguage('ar');
    } else {
      setLanguage('fr');
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const seoData = language === 'ar' ? {
    title: 'تنظيم الفعاليات والتظاهرات | بيكوص إيفنتس',
    description: 'نرافقكم في تنظيم برامجكم، فعالياتكم، واجتماعاتكم الاحترافية في الجزائر بخبرة واحترافية عالية.',
    canonical: 'https://bcos-dz.com/ar/events',
    schemaData: generateLocalBusinessSchema('ar')
  } : {
    title: 'Organisation d\'Événements et Manifestations | BCOS Events',
    description: 'BCOS vous accompagne dans l\'organisation de vos manifestations, séminaires et réunions professionnelles en Algérie.',
    canonical: 'https://bcos-dz.com/fr/events',
    schemaData: generateLocalBusinessSchema('fr')
  };

  const langPrefix = language === 'ar' ? '/ar' : '/fr';

  const translations = {
    fr: {
      heroTitle: "Événements BCOS..votre raccourci vers",
      heroSubtitle: "Réussissez vos événements, manifestations et réunions",
      description: "Pour tout événement ou programme auquel vous envisagez, vous êtes à la bonne destination. Nous vous aidons à organiser et à réaliser vos programmes et vos événements au bénéfice de votre équipe, clients, fournisseurs, partenaires... etc.\nNous partageons également avec vous notre expérience dans ce domaine",
      programsTitle: "Nos services",
      reservationsTitle: "Réservations",
      reservationsDesc: "Nous vous accompagnons depuis le début de l'idée jusqu'à sa réalisation. Nous vous guidons et vous aidons à choisir les meilleurs détails.",
      formTitle: "Intéressé par nos services d'organisation d'événements\nEt les manifestations ?!",
      formSubtitle: ".. S'inscrire maintenant",
      servicesBadge: "Nos Services",
    },
    ar: {
      heroTitle: "BCOS Events .. طريقكم المختصر إلى",
      heroSubtitle: "إنجاح الأحداث والتظاهرات واللقاءات الخاصة بكم",
      description: "لأي حدث أو برنامج تفكرون فيه، أنتم في الوجهة الصحيحة، نساعدكم على تنظيم وتحقيق برامجكم\nوأحداثكم لصالح فريقكم، زبائنكم، مورديكم، شركائكم...الخ\nكما نشارك معكم خبرتنا في هذا المجال:",
      programsTitle: "خدماتنا",
      reservationsTitle: "الحجوزات",
      reservationsDesc: "نرافقكم من بداية الفكرة إلى تحقيقها.. نوجهكم ونساعدكم في اختيار أحسن التفاصيل",
      formTitle: "مهتم بخدماتنا في تنظيم الأحداث\nوالتظاهرات؟! .. سجل الآن",
      formSubtitle: "",
      servicesBadge: "خدماتنا",
    }
  };

  const t = translations[language];

  const programs = [
    {
      icon: Users,
      title: language === 'ar' ? 'برامج بناء الفر يق' : "Programmes de consolidation d'équipe",
      color: 'bg-blue-500',
    },
    {
      icon: Heart,
      title: language === 'ar' ? 'تنمية ولاء الزبائن' : "Développer la fidélisation de la clientèle",
      color: 'bg-pink-500',
    },
    {
      icon: Calendar,
      title: language === 'ar' ? 'الأيام المفتوحة' : "Jours ouverts",
      color: 'bg-green-500',
    },
    {
      icon: BookOpen,
      title: language === 'ar' ? 'الندوات و المحاضرات' : "Séminaires et conférences",
      color: 'bg-purple-500',
    },
    {
      icon: Award,
      title: language === 'ar' ? 'الإفتتاحات و التدشينات' : "Vernissage et inauguration",
      color: 'bg-yellow-500',
    },
    {
      icon: Briefcase,
      title: language === 'ar' ? 'البرامج السياحية للمؤسسات' : "Programmes touristiques pour les institutions",
      color: 'bg-indigo-500',
    },
    {
      icon: Target,
      title: language === 'ar' ? 'الحجوزات' : "Réservations",
      color: 'bg-teal-500',
    },
  ];




  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <SEO {...seoData} lang={language as any} />
      <main className="pb-16">
        {/* Hero Section with Background */}
        <section className="py-14 sm:py-20 lg:py-28 relative min-h-[50vh] sm:min-h-[60vh] flex items-center">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1280&fm=webp')`
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(37, 59, 116, 0.8)' }} />
          
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          </div>
          
          {/* Content */}
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-white mb-6 sm:mb-8 leading-tight drop-shadow-md text-balance mx-auto text-center flex flex-col justify-center items-center w-full">
                <span className="block w-full text-center">{t.heroTitle}</span>
                <span className="block w-full text-center text-white/95 mt-2 sm:mt-4">{t.heroSubtitle}</span>
              </h1>
              <div className="text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed max-w-4xl mx-auto text-center flex flex-col items-center justify-center gap-2">
                {t.description.split('\n').map((line, i) => (
                  <p key={i} className="text-center w-full block m-0">{line}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Programs Grid */}
        <section className="py-10 sm:py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-foreground mb-6 sm:mb-10 text-center">
              {t.programsTitle}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
              {programs.map((program, index) => (
                <Card 
                  key={index} 
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20 group overflow-hidden relative"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 ${program.color} opacity-10 rounded-full blur-2xl transform group-hover:scale-150 transition-transform duration-500`}></div>
                  <CardHeader className="relative z-10 flex flex-col items-center text-center">
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 ${program.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <program.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <CardTitle className="text-sm sm:text-base lg:text-xl font-semibold text-foreground">
                      {program.title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Reservations Section */}
        <section className="py-10 sm:py-16 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <p className={`text-base sm:text-lg lg:text-xl text-foreground font-medium leading-relaxed max-w-3xl mx-auto ${language === 'ar' ? 'text-center' : ''}`}>
                  {t.reservationsDesc}
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Registration Form */}
        <section className="py-10 sm:py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              {/* Title and Subtitle */}
              <div className="text-center mb-8">
                <h3 className="text-lg sm:text-2xl lg:text-3xl font-heading font-bold mb-2 whitespace-pre-line" style={{ color: '#1a237e' }}>
                  {t.formTitle}
                </h3>
                <p className="text-lg" style={{ color: '#1a237e' }}>
                  {t.formSubtitle}
                </p>
              </div>
              
              {/* Form Card */}
              <Card className="shadow-2xl border-2 border-primary/10 overflow-hidden">
                <CardContent className="p-0">
                  <EventForm language={language} />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Evenements;

