import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const ImageCarousel: React.FC = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.carousel-header', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
      });

      gsap.from('.carousel-wrapper', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
        opacity: 0,
        scale: 0.95,
        y: 40,
        duration: 1,
        ease: 'power3.out'
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const trainerImages = [
    'https://bcos-dz.com/wp-content/uploads/2025/12/Artboard-1-1.avif',
    'https://bcos-dz.com/wp-content/uploads/2025/12/Artboard-1-copy-1.avif',
    'https://bcos-dz.com/wp-content/uploads/2025/12/Artboard-1-copy-2-1.avif',
    'https://bcos-dz.com/wp-content/uploads/2025/12/Artboard-1-copy-3-1.avif',
    'https://bcos-dz.com/wp-content/uploads/2025/12/Artboard-1-copy-4-1.avif',
    'https://bcos-dz.com/wp-content/uploads/2025/12/Artboard-1-copy-5-1.avif',
    'https://bcos-dz.com/wp-content/uploads/2025/12/Artboard-1-copy-6-1.avif'
  ];

  const translations = {
    fr: {
      title: 'Nos Formateurs'
    },
    ar: {
      title: 'مدربونا'
    }
  };

  const t = translations[language];

  // Autoplay plugin
  const autoplayPlugin = useMemo(
    () =>
      Autoplay({
        delay: 3000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    []
  );

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section ref={sectionRef} className="py-12 lg:py-20 relative bg-transparent">
      <div className="container mx-auto px-0 sm:px-4 lg:px-8">
        {/* Title */}
        <div className="carousel-header flex justify-center items-center mb-8 lg:mb-12 px-4">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {t.title}
          </h3>
        </div>

        {/* Carousel */}
        <div className="carousel-wrapper relative w-full px-4 md:px-8 lg:px-12 xl:px-16" dir="ltr">
          <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              loop: true,
              slidesToScroll: 1,
              direction: "ltr",
            }}
            plugins={[autoplayPlugin]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {trainerImages.map((url, index) => {
                const isActive = current === index;
                return (
                  <CarouselItem 
                    key={index} 
                    className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/3"
                  >
                    <div className="relative group px-2 md:px-4">
                      <div
                        className={`transition-all duration-500 ${
                          isActive 
                            ? 'scale-110 opacity-100' 
                            : 'scale-95 opacity-60'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`${t.title} ${index + 1}`}
                          className="w-full h-auto object-cover transition-transform duration-300"
                          style={{ backgroundColor: 'transparent' }}
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>

          {/* Navigation Dots */}
          {trainerImages.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-6 lg:mt-8">
              {trainerImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    current === index ? 'bg-primary w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'
                  }`}
                  aria-label={`${t.title} ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ImageCarousel;