import React, { useState } from 'react';
import {
  TrendingUp,
  Target,
  Rocket,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const WhyChoose = () => {
  const [showVideo, setShowVideo] = useState(false);
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  
  const benefits = language === 'ar'
    ? [
        {
          icon: TrendingUp,
          title: 'تحسين الأداء',
        },
        {
          icon: Target,
          title: 'تعزيز موقعك في السوق',
        },
        {
          icon: Rocket,
          title: 'حلول متكيفة للنمو المستدام',
        },
      ]
    : [
        {
          icon: TrendingUp,
          title: 'Optimisation des performances',
        },
        {
          icon: Target,
          title: 'Renforcement de votre position sur le marché',
        },
        {
          icon: Rocket,
          title: 'Solutions adaptées pour une croissance durable',
        },
      ];

  return (
    <section id="why-choose" className="py-10 sm:py-14 lg:py-18 xl:py-24 relative overflow-hidden bg-white">
      {/* Background Image with Fade */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url('https://i.postimg.cc/MK7WGMx5/Asset-18.webp')`,
          maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
        }}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top section with text and image */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-start">
          {/* Left: Content */}
          <div className="space-y-6 sm:space-y-8 animate-slide-up" dir={language === 'ar' ? 'rtl' : 'ltr'} style={language === 'ar' ? { fontFamily: "'Almarai', sans-serif" } : {}}>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-heading font-bold leading-tight ${language === 'ar' ? 'text-right' : 'text-left'}`} style={{ color: '#253b74', ...(language === 'ar' ? { fontFamily: "'Almarai', sans-serif" } : {}) }}>
              {language === 'ar' ? <><span dir="ltr">BCOS</span> من هي !؟</> : 'Qui est BCOS !?'}
            </h2>
            <p className={`text-base sm:text-lg text-muted-foreground leading-relaxed ${language === 'ar' ? 'text-right' : 'text-left'}`} style={language === 'ar' ? { fontFamily: "'Almarai', sans-serif" } : {}}>
              {language === 'ar' 
                ? 'مؤسسة تكوين واستشارات في مجال تسيير و إدارة الشركات.'
                : 'Une institution de formation et de conseil dans le domaine du management et de la gestion d\'entreprise.'
              }
            </p>
            <p className={`text-base sm:text-lg text-muted-foreground leading-relaxed ${language === 'ar' ? 'text-right' : 'text-left'}`} style={language === 'ar' ? { fontFamily: "'Almarai', sans-serif" } : {}}>
              {language === 'ar' 
                ? <><span dir="ltr">BCOS</span> منذ 2006 على دعم وتطوير أداء الشركات الاقتصادية بغية الرفع من أدائها لضمان قوتها وديمومتها في السوق. تعمل</>
                : 'Depuis 2006, BCOS travaille à soutenir et développer la performance des entreprises économiques afin d\'améliorer leurs performances pour assurer leur force et leur pérennité sur le marché.'
              }
            </p>
            
            {/* Benefits list */}
            <div className={`space-y-3 sm:space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.title}
                  className="flex items-start gap-3 sm:gap-4 animate-slide-up"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className={`text-base sm:text-lg font-heading font-semibold text-foreground pt-1 sm:pt-2 ${language === 'ar' ? 'text-right' : 'text-left'}`} style={language === 'ar' ? { fontFamily: "'Almarai', sans-serif" } : {}}>
                    {benefit.title}
                  </h3>
                </div>
              ))}
            </div>

            {/* Closing statement */}
            <p className={`text-base sm:text-lg text-muted-foreground leading-relaxed pt-2 sm:pt-4 ${language === 'ar' ? 'text-right' : 'text-left'}`} style={language === 'ar' ? { fontFamily: "'Almarai', sans-serif" } : {}}>
              {language === 'ar' 
                ? 'مع بيكوص، حوّل التحديات إلى فرص وضمن استمرارية مؤسستك'
                : 'Avec BCOS, transformez les défis en opportunités et assurez la pérennité de votre entreprise.'
              }
            </p>
          </div>

          {/* Right: Video */}
          <div className="animate-fade-in" style={{ marginTop: 'clamp(3rem, 8vw, 5rem)' }}>
            <div className="relative group rounded-3xl overflow-hidden shadow-2xl bg-black aspect-video transition-transform hover:scale-[1.02] duration-500">
              {showVideo ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/wcGGKUXCyLE?autoplay=1"
                  title="BCOS Presentation Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div 
                  className="absolute inset-0 w-full h-full cursor-pointer group"
                  onClick={() => setShowVideo(true)}
                >
                  <img 
                    src="https://i.ytimg.com/vi/wcGGKUXCyLE/maxresdefault.jpg" 
                    alt="BCOS Video Thumbnail"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-primary/90 text-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
