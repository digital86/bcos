import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import {
  Briefcase,
  GraduationCap,
  Monitor,
  Rocket,
  Calendar,
  Users,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import ScrollFloat from './ScrollFloat';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const Services = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Auto-scroll on mobile based on scroll position
  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md breakpoint
    
    if (!isMobile || !carouselRef.current || !api) {
      return;
    }

    let scrollTimeout: NodeJS.Timeout;
    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    let isScrolling = false;

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
      }

      // Clear existing timeout
      clearTimeout(scrollTimeout);

      // Check if section is in viewport
      const rect = carouselRef.current?.getBoundingClientRect();
      if (!rect) return;

      const isInViewport = 
        rect.top < window.innerHeight * 0.8 && 
        rect.bottom > window.innerHeight * 0.2;

      if (isInViewport) {
        // After scroll stops, advance carousel
        scrollTimeout = setTimeout(() => {
          const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollDifference = Math.abs(currentScrollTop - lastScrollTop);

          // Only advance if user scrolled enough
          if (scrollDifference > 50) {
            if (api.canScrollNext()) {
              api.scrollNext();
            } else {
              api.scrollTo(0);
            }
          }
          
          lastScrollTop = currentScrollTop;
          isScrolling = false;
        }, 500); // Wait 500ms after scroll stops
      }
    };

    // Also add time-based auto-scroll when section is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start auto-scrolling when section is visible
            autoScrollIntervalRef.current = setInterval(() => {
              if (api.canScrollNext()) {
                api.scrollNext();
              } else {
                api.scrollTo(0);
              }
            }, 5000); // Change slide every 5 seconds
          } else {
            // Stop auto-scrolling when section is not visible
            if (autoScrollIntervalRef.current) {
              clearInterval(autoScrollIntervalRef.current);
              autoScrollIntervalRef.current = null;
            }
          }
        });
      },
      {
        threshold: 0.3,
      }
    );

    if (carouselRef.current) {
      observer.observe(carouselRef.current);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      clearTimeout(scrollTimeout);
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [api]);

  const services = language === 'ar'
    ? [
        {
          icon: Briefcase,
          title: 'استشـارات ومرافقة ميدانية',
          description: 'نحن نمكن زبائننا من توفير الوقت بتقديم خبرات ونصائح من مستشارينا في مختلف مجالات تسيير الشركات، كما نوفر برنامج متكـامل لمرافقة المؤسسات بعد تشخيص كلي لها.',
          features: ['تشخيص استراتيجي', 'خطط عمل', 'مراقبة الأداء'],
          link: '/ar/services/consulting',
        },
        {
          icon: GraduationCap,
          title: 'الدورات التكوينية',
          description: 'نقدم دورات تكوينية تحمل العديد من القيم المضافة مخصصة للمؤسسات والأفراد.',
          features: ['شهادات معتمدة', 'مدربون خبراء', 'مناهج عملية'],
          link: '/ar/formations',
        },
        {
          icon: Monitor,
          title: 'منصة للتعلم أونلاين',
          description: 'نرافقك في رحلة تطوير شركتك من خلال دورات أونلاين في منصة متكاملة بطرق عرض إبداعية.',
          features: ['وحدات تفاعلية', 'وصول غير محدود', 'شهادات رقمية'],
          link: 'https://elearning.bcos-dz.com/',
        },
        {
          icon: Rocket,
          title: 'مسرعة المشاريع',
          description: 'نقدم دورات تكوينية ومرافقة ميدانية لأصحاب المشاريع الناشئة حتى يتمكنوا من إطلاق مشاريعهم في السوق الجزائرية وتطويرها وفق متطلباته وتحدياته.',
          features: ['احتضان مشاريع', 'توجيه فردي', 'شبكة أعمال'],
          link: '/ar/accelerator',
        },
        {
          icon: Calendar,
          title: 'تنظيم الأحداث والتظاهرات',
          description: 'نساعدك على تنفيذ مختلف الأحداث والتظاهرات لشركتك بكفاءة عالية تمكنك من تحقيق أهدافك منها، إضافة إلى برامج بناء الفريق الموجه لفرق العمل في الشركات.',
          features: ['بناء فرق العمل', 'تعزيز الثقافة', 'تطوير القيادة'],
          link: '/ar/services/events',
        },
      ]
    : [
        {
          icon: Briefcase,
          title: 'Accompagnement & Consulting',
          description:
            'Diagnostic, conseil stratégique et accompagnement personnalisé pour optimiser vos performances et atteindre vos objectifs.',
          features: ['Audit organisationnel', 'Stratégie d\'entreprise', 'Change management'],
          link: '/fr/consultation-et-accompagnement-sur-le-terrain',
        },
        {
          icon: GraduationCap,
          title: 'Formations Professionnelles',
          description:
            'Catalogue complet de formations inter et intra-entreprises dans tous les domaines du management, commerce et gestion.',
          features: ['Formations sur-mesure', 'Certifications', 'Coaching individuel'],
          link: '/fr/nos-formations',
        },
        {
          icon: Monitor,
          title: 'E-learning Innovant',
          description:
            'Plateforme moderne de formation en ligne accessible 24/7 avec contenus interactifs et suivi personnalisé.',
          features: ['Modules interactifs', 'Accès illimité', 'Certificats digitaux'],
          link: 'https://elearning.bcos-dz.com/',
        },
        {
          icon: Rocket,
          title: 'Accélérateur de Projets',
          description:
            'Programme intensif d\'accompagnement pour startups et entrepreneurs visant à accélérer leur croissance.',
          features: ['Mentorat expert', 'Networking', 'Financement'],
          link: '/fr/accelerateur-de-projets',
        },
        {
          icon: Calendar,
          title: 'Organisation d\'Événements',
          description:
            'Conception et animation de séminaires, conférences et démonstrations professionnelles sur mesure.',
          features: ['Événements corporate', 'Webinaires', 'Conférences'],
          link: '/fr/organisation-devenements-et-de-demonstrations',
        },
      ];

  return (
    <section id="services" className="py-12 lg:py-20 relative overflow-hidden bg-white">
      {/* Background Image with Fade */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url('https://i.postimg.cc/ZRj5jtJv/Asset-4.webp')`,
          maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
        }}
      />
      
      {/* Decorative Circle - Right Side */}
      <div className="absolute top-1/2 -translate-y-1/2 right-8 lg:right-16 xl:right-24 w-32 h-32 lg:w-48 lg:h-48 xl:w-64 xl:h-64 opacity-20 pointer-events-none z-0">
        <img 
          src="https://i.postimg.cc/50p2pdfH/Asset-3.webp"
          alt="Decorative circle"
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Decorative Circle - Left Side */}
      <div className="absolute top-1/4 left-4 lg:left-8 xl:left-16 w-24 h-24 lg:w-40 lg:h-40 xl:w-56 xl:h-56 opacity-20 pointer-events-none z-0">
        <img 
          src="https://i.postimg.cc/50p2pdfH/Asset-3.webp"
          alt="Decorative circle"
          className="w-full h-full object-contain"
        />
      </div>
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-10 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <ScrollFloat
            containerClassName="text-3xl lg:text-4xl xl:text-5xl font-heading mb-6"
            style={{ color: '#253b74' }}
          >
            {language === 'ar' ? 'خدماتنا' : 'Nos Services'}
          </ScrollFloat>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-center" style={{ textAlign: 'center' }}>
            {language === 'ar' 
              ? 'حلول شاملة لمرافقة تطويرك وتطوير فرقك.'
              : 'Des solutions complètes pour accompagner votre développement et celui de vos équipes.'
            }
          </p>
        </div>

        {/* Desktop Grid View - 3 on top, 2 centered on bottom */}
        <div className="hidden md:block">
          {/* Top Row - 3 cards */}
          <div className="grid grid-cols-3 gap-8 mb-8">
            {services.slice(0, 3).map((service, index) => {
              const isSelected = selectedCard === index;
              return (
                <div
                  key={service.title}
                  onClick={() => setSelectedCard(isSelected ? null : index)}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`glass-card rounded-3xl p-8 hover:shadow-glass transition-smooth hover:scale-105 group animate-slide-up cursor-pointer ${
                    isSelected || hoveredCard === index ? 'text-white' : ''
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    backgroundColor: isSelected || hoveredCard === index ? '#243c7c' : undefined,
                  }}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-smooth ${
                    isSelected || hoveredCard === index
                      ? 'border-2 border-white' 
                      : 'gradient-primary'
                  }`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className={`text-xl font-heading font-bold mb-3 ${language === 'ar' ? 'text-right' : 'text-left'} ${
                    isSelected || hoveredCard === index ? 'text-white' : 'text-foreground'
                  }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {service.title}
                  </h3>
                  
                  <p className={`mb-4 leading-relaxed ${language === 'ar' ? 'text-right' : 'text-left'} ${
                    isSelected || hoveredCard === index ? 'text-white/90' : 'text-muted-foreground'
                  }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {service.description}
                  </p>

                  <ul className={`space-y-2 mb-6 ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {service.features.map((feature) => (
                      <li key={feature} className={`flex items-center text-sm ${
                        isSelected || hoveredCard === index ? 'text-white/90' : 'text-muted-foreground'
                      }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <div className={`w-1.5 h-1.5 rounded-full ${language === 'ar' ? 'ml-2' : 'mr-2'} ${
                          isSelected || hoveredCard === index ? 'bg-white' : 'bg-bcos-lime'
                        }`}></div>
                        <span className={language === 'ar' ? 'text-right' : ''} dir={language === 'ar' ? 'rtl' : 'ltr'}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="ghost"
                    className={`w-full rounded-xl transition-smooth ${
                      isSelected || hoveredCard === index
                        ? 'bg-white/20 text-white hover:bg-white/30' 
                        : ''
                    }`}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    asChild
                  >
                    <a href={service.link}>
                      {language === 'ar' ? 'اعرف المزيد' : 'En savoir plus'}
                      <ArrowRight className={`w-4 h-4 transition-smooth ${
                        language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'
                      } ${isSelected ? '' : 'group-hover:translate-x-1'}`} />
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Bottom Row - 2 cards centered */}
          <div className="flex justify-center gap-8">
            {services.slice(3, 5).map((service, index) => {
              const actualIndex = index + 3;
              const isSelected = selectedCard === actualIndex;
              return (
                <div
                  key={service.title}
                  onClick={() => setSelectedCard(isSelected ? null : actualIndex)}
                  onMouseEnter={() => setHoveredCard(actualIndex)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`glass-card rounded-3xl p-8 hover:shadow-glass transition-smooth hover:scale-105 group animate-slide-up cursor-pointer w-full max-w-md ${
                    isSelected || hoveredCard === actualIndex ? 'text-white' : ''
                  }`}
                  style={{
                    animationDelay: `${(actualIndex) * 100}ms`,
                    backgroundColor: isSelected || hoveredCard === actualIndex ? '#243c7c' : undefined,
                  }}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-smooth ${
                    isSelected || hoveredCard === actualIndex
                      ? 'border-2 border-white' 
                      : 'gradient-primary'
                  }`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className={`text-xl font-heading font-bold mb-3 ${language === 'ar' ? 'text-right' : 'text-left'} ${
                    isSelected || hoveredCard === actualIndex ? 'text-white' : 'text-foreground'
                  }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {service.title}
                  </h3>
                  
                  <p className={`mb-4 leading-relaxed ${language === 'ar' ? 'text-right' : 'text-left'} ${
                    isSelected || hoveredCard === actualIndex ? 'text-white/90' : 'text-muted-foreground'
                  }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {service.description}
                  </p>

                  <ul className={`space-y-2 mb-6 ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {service.features.map((feature) => (
                      <li key={feature} className={`flex items-center text-sm ${
                        isSelected || hoveredCard === actualIndex ? 'text-white/90' : 'text-muted-foreground'
                      }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <div className={`w-1.5 h-1.5 rounded-full ${language === 'ar' ? 'ml-2' : 'mr-2'} ${
                          isSelected || hoveredCard === actualIndex ? 'bg-white' : 'bg-bcos-lime'
                        }`}></div>
                        <span className={language === 'ar' ? 'text-right' : ''} dir={language === 'ar' ? 'rtl' : 'ltr'}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="ghost"
                    className={`w-full rounded-xl transition-smooth ${
                      isSelected || hoveredCard === actualIndex
                        ? 'bg-white/20 text-white hover:bg-white/30' 
                        : ''
                    }`}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    asChild
                  >
                    <a href={service.link}>
                      {language === 'ar' ? 'اعرف المزيد' : 'En savoir plus'}
                      <ArrowRight className={`w-4 h-4 transition-smooth ${
                        language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'
                      } ${isSelected ? '' : 'group-hover:translate-x-1'}`} />
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Carousel View */}
        <div className="md:hidden relative" ref={carouselRef}>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {services.map((service, index) => (
                <CarouselItem key={service.title} className="pl-2 basis-1/2">
                  <div
                    onClick={() => setSelectedCard(selectedCard === index ? null : index)}
                    className={`glass-card rounded-2xl p-3 hover:shadow-glass transition-smooth group cursor-pointer h-full ${
                      selectedCard === index ? 'text-white' : ''
                    }`}
                    style={{
                      backgroundColor: selectedCard === index ? '#243c7c' : undefined,
                    }}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-smooth ${
                      selectedCard === index
                        ? 'border-2 border-white' 
                        : 'gradient-primary'
                    }`}>
                      <service.icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <h3 className={`text-xs font-heading font-bold mb-1.5 ${language === 'ar' ? 'text-right' : 'text-left'} ${
                      selectedCard === index ? 'text-white' : 'text-foreground'
                    }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {service.title}
                    </h3>
                    
                    <p className={`mb-2 leading-relaxed text-[11px] line-clamp-3 ${language === 'ar' ? 'text-right' : 'text-left'} ${
                      selectedCard === index ? 'text-white/90' : 'text-muted-foreground'
                    }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {service.description}
                    </p>

                    <ul className={`space-y-1 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {service.features.slice(0, 2).map((feature) => (
                        <li key={feature} className={`flex items-center text-[10px] ${
                          selectedCard === index ? 'text-white/90' : 'text-muted-foreground'
                        }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                          <div className={`w-1 h-1 rounded-full ${language === 'ar' ? 'ml-1.5' : 'mr-1.5'} ${
                            selectedCard === index ? 'bg-white' : 'bg-bcos-lime'
                          }`}></div>
                          <span className={language === 'ar' ? 'text-right' : ''} dir={language === 'ar' ? 'rtl' : 'ltr'}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant="ghost"
                      className={`w-full rounded-lg transition-smooth text-[11px] px-2 h-7 ${
                        selectedCard === index
                          ? 'bg-white/20 text-white hover:bg-white/30' 
                          : ''
                      }`}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      asChild
                    >
                      <a href={service.link}>
                        {language === 'ar' ? 'المزيد' : 'En savoir plus'}
                        <ArrowRight className={`w-3 h-3 ${language === 'ar' ? 'mr-1 rotate-180' : 'ml-1'}`} />
                      </a>
                    </Button>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-3 top-1/2 -translate-y-1/2 sm:flex hidden" />
            <CarouselNext className="-right-3 top-1/2 -translate-y-1/2 sm:flex hidden" />
          </Carousel>
          
          {/* Mobile Navigation Dots */}
          <div className="flex items-center justify-center gap-2 mt-6 sm:hidden">
            {services.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-smooth ${
                  current === index ? 'bg-primary w-6' : 'bg-muted-foreground/30'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>



      </div>
    </section>
  );
};

export default Services;
