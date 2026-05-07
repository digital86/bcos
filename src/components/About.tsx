import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { EditableText, EditableImage } from './admin/EditableContent';

const About = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  return (
    <section className="py-10 sm:py-14 lg:py-18 xl:py-24 relative overflow-hidden bg-white">
      {/* Background Image with Fade */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url('https://i.postimg.cc/j5LccKrM/Asset-1.webp')`,
          maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
        }}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-center">
          {/* Left: Image */}
          <div className="animate-fade-in order-2 lg:order-1 mt-8 lg:mt-0">
            <EditableImage
              contentKey="home_about_main_img"
              defaultUrl="https://i.postimg.cc/x84HsR5Q/Asset-8.webp"
              className="w-full h-auto rounded-2xl"
              alt="BCOS Asset"
            />
          </div>

          {/* Right: Content */}
          <div className="space-y-6 sm:space-y-8 animate-slide-up order-1 lg:order-2">
            <div className="space-y-4 sm:space-y-5">
              <div style={{ color: '#253b74' }} className={language === 'ar' ? 'text-right' : 'text-left'} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <h2 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-heading leading-tight font-bold ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' 
                    ? <EditableText contentKey="home_ar_about_title" defaultContent={<><span dir="ltr">BCOS</span> لماذا !؟</>} />
                    : <EditableText contentKey="home_fr_about_title" defaultContent="Pourquoi BCOS !?" />
                  }
                </h2>
              </div>
              <p className={`text-base sm:text-lg text-black leading-relaxed ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {language === 'ar' 
                  ? 'مستشارون ذوو خبرة ميدانية طويلة.'
                  : 'Consultants avec une longue expérience de terrain.'
                }
              </p>
              <p className={`text-base sm:text-lg text-black leading-relaxed ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {language === 'ar' ? 'حلول عملية وملموسة تتلاءم مع السوق الجزائرية.' : 'Solutions pratiques et concrètes adaptées au marché algérien.'}
              </p>
              <p className={`text-base sm:text-lg text-black leading-relaxed ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {language === 'ar' ? 'أساليب وتقنيات تكوينية ممتعة وحديثة.' : 'Méthodes et techniques de formation ludiques et modernes.'}
              </p>
            </div>

            <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 ${language === 'ar' ? 'sm:flex-row-reverse' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <Button size="lg" className="rounded-2xl gradient-primary" asChild>
                <Link to={language === 'ar' ? '/ar/qui-sommes-nous' : '/fr/qui-sommes-nous'}>
                  {language === 'ar' ? 'اكتشف بيكوص' : 'Découvrir BCOS'}
                  <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
