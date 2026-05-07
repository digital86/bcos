import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import ScrollFloat from './ScrollFloat';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useUpcomingScheduledFormations, useFormations } from '@/hooks/useSupabase';
import type { Formation } from '../../supabase-config';

interface ScheduledFormation {
  id: string;
  formation_id: string;
  scheduled_date: string;
  scheduled_time: string;
  end_time: string;
  location?: string;
  is_online: boolean;
  formation?: Formation;
}

const TrainingCarousel = () => {
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const { scheduledFormations, loading, error } = useUpcomingScheduledFormations(12);
  const { formations, loading: formationsLoading } = useFormations();

  // Transform scheduled formations to include formation data
  const activeFormations = scheduledFormations
    .filter((sf: ScheduledFormation) => {
      if (!sf.formation || !sf.formation.is_active) return false;
      if (language === 'ar') {
        return !!(sf.formation as any).title_ar || !!(sf.formation as any).content_ar;
      }
      return true;
    })
    .map((sf: ScheduledFormation) => ({
      ...sf.formation,
      scheduled_date: sf.scheduled_date,
      scheduled_time: sf.scheduled_time,
      end_time: sf.end_time,
      location: sf.location,
      is_online: sf.is_online,
    }));

  // Color gradients for cards
  const colorGradients = [
    'from-blue-500/20 to-indigo-500/20',
    'from-purple-500/20 to-pink-500/20',
    'from-emerald-500/20 to-teal-500/20',
    'from-orange-500/20 to-red-500/20',
    'from-cyan-500/20 to-blue-500/20',
    'from-pink-500/20 to-rose-500/20',
  ];

  // Translations
  const translations = {
    fr: {
      agenda: 'Agenda',
      title: 'Nos Prochaines Formations',
      subtitle: 'Découvrez notre sélection de formations à venir',
      duration: 'Durée',
      schedule: 'Horaires',
      scheduleTime: '09:00 - 17:00',
      seeFormation: 'Voir la formation',
      seeAll: 'Voir toutes les formations',
      noFormations: 'Aucune formation disponible pour le moment',
    },
    ar: {
      agenda: 'الأجندة',
      title: 'دوراتنا القادمة',
      subtitle: 'اكتشف مجموعتنا المختارة من الدورات القادمة',
      duration: 'المدة',
      schedule: 'المواعيد',
      scheduleTime: '09:00 - 17:00',
      seeFormation: 'عرض الدورة',
      seeAll: 'عرض كل الدورات',
      noFormations: 'لا توجد دورات متاحة في الوقت الحالي',
    },
  };

  const t = translations[language];

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Helper to extract content from HTML
  const extractFromHtml = (html: string | undefined, tag: string): string => {
    if (!html) return '';
    try {
      if (tag === 'h1') {
        const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (h1Match) return h1Match[1].replace(/<[^>]*>/g, '').trim();
        const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        if (h2Match) return h2Match[1].replace(/<[^>]*>/g, '').trim();
      }
      if (tag === 'desc') {
        const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
        if (headerMatch) {
          const pMatch = headerMatch[1].match(/<div[^>]*class="[^"]*text-[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          if (pMatch) return pMatch[1].replace(/<[^>]*>/g, '').trim();
        }
        return html.replace(/<[^>]*>/g, ' ').trim().substring(0, 150) + '...';
      }
    } catch (e) { return ''; }
    return '';
  };

  // Get formation title based on language
  const getFormationTitle = (formation: Formation) => {
    if (language === 'ar') {
      return formation.title_ar || extractFromHtml((formation as any).content_ar, 'h1') || '';
    }
    return formation.title_fr || formation.title;
  };

  // Get formation description based on language
  const getFormationDescription = (formation: Formation) => {
    if (language === 'ar') {
      return formation.description_ar || extractFromHtml((formation as any).content_ar, 'desc') || '';
    }
    return formation.description_fr || formation.description || '';
  };

  // Get formation image
  const getFormationImage = (formation: Formation) => {
    return formation.cover_image_url || 
           formation.image_url || 
           'https://i.postimg.cc/x84HsR5Q/Asset-8.webp';
  };

  // Get formation URL
  const getFormationUrl = (formation: Formation) => {
    return `/${language}/formation/${formation.slug}`;
  };

  if (loading) {
    return (
      <section id="formations" className="py-20 lg:py-32 pb-4 lg:pb-8 relative overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </section>
    );
  }

  const displayFormations = (() => {
    // If we have scheduled formations, use them
    let list = [...activeFormations];
    
    // If we have less than 8 formations, pad with random ones from the full list
    if (list.length < 8) {
      const remainingCount = 8 - list.length;
      const existingIds = new Set(list.map((f: any) => f.id));
      
      const randomPads = [...formations]
        .filter((f: any) => {
          if (!f.is_active || existingIds.has(f.id)) return false;
          // In Arabic mode, we strictly show ones with Arabic content
          if (language === 'ar') {
            return f.title_ar || f.content_ar;
          }
          return true;
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, remainingCount);
      
      list = [...list, ...randomPads];
    }
    
    return list;
  })();

  return (
    <section id="formations" className="py-4 lg:py-6 relative overflow-x-hidden">
      {/* Decorative Circle - Right Side */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 lg:right-12 xl:right-20 w-20 h-20 lg:w-32 lg:h-32 xl:w-40 xl:h-40 opacity-40 pointer-events-none z-0">
        <img 
          src="https://i.postimg.cc/50p2pdfH/Asset-3.webp"
          alt="Decorative circle"
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Decorative Circle - Left Side */}
      <div className="absolute top-1/3 left-2 lg:left-6 xl:left-12 w-16 h-16 lg:w-28 lg:h-28 xl:w-36 xl:h-36 opacity-40 pointer-events-none z-0">
        <img 
          src="https://i.postimg.cc/50p2pdfH/Asset-3.webp"
          alt="Decorative circle"
          className="w-full h-full object-contain"
        />
      </div>
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Section Header — centered, original style */}
        <div className="text-center mb-16 animate-fade-in">

          <ScrollFloat
            containerClassName="text-3xl lg:text-4xl xl:text-5xl font-heading mb-6"
            style={{ color: '#253b74' }}
          >
            {t.title}
          </ScrollFloat>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">

          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
              slidesToScroll: 1,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 py-4">
              {displayFormations.map((formation: Formation, index: number) => {
                const colorGradient = colorGradients[index % colorGradients.length];
                const title = getFormationTitle(formation);
                const description = getFormationDescription(formation);
                const image = getFormationImage(formation);
                const url = getFormationUrl(formation);

                return (
                  <CarouselItem key={formation.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                    <div className="py-2 h-full">
                      <Link to={url} className="block h-full">
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all hover:scale-105 group cursor-pointer h-full flex flex-col">
                        {/* Image */}
                        <div className="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-bcos-indigo/10">
                          <img
                            src={image}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className={`absolute inset-0 bg-gradient-to-br ${colorGradient} opacity-50`} />
                          <div className={`absolute top-3 ${language === 'ar' ? 'left-3' : 'right-3'} flex flex-col gap-2`}>
                            {formation.duration && (
                              <span className="px-2 py-1 rounded-full bg-primary/90 text-white text-xs font-medium">
                                {formation.duration}
                              </span>
                            )}

                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 flex flex-col flex-1">
                          {/* Title */}
                          <h3 className="text-xl lg:text-2xl font-heading font-bold text-foreground mb-4 line-clamp-2 group-hover:text-primary transition-colors">
                            {title}
                          </h3>
                          
                          {/* Horaires & Durée */}
                          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">{t.schedule}</span>
                                <span className="text-sm font-medium text-foreground">
                                  {(formation as any).scheduled_time || '09:00'} - {(formation as any).end_time || '17:00'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-bcos-lime/20 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-bcos-dark-indigo" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">{t.duration}</span>
                                <span className="text-sm font-medium text-foreground">{formation.duration}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Description */}
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                            {description}
                          </p>
                          
                          {/* CTA Button */}
                          <Button className="rounded-xl gradient-primary w-full mt-auto" size="sm">
                            {t.seeFormation}
                            <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                          </Button>
                        </div>
                      </div>
                    </Link>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="-left-4 md:-left-12 hidden md:flex z-10 bg-background/80" />
            <CarouselNext className="-right-4 md:-right-12 hidden md:flex z-10 bg-background/80" />
          </Carousel>

          {/* Bottom Actions: Dots & See All */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-14 mt-8 px-2 md:px-0">
            {/* Navigation Dots */}
            <div className="flex items-center gap-2">
              {displayFormations.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={`h-2.5 rounded-full transition-smooth ${
                    current === index ? 'bg-primary w-8 shadow-sm' : 'bg-muted-foreground/30 w-2.5 hover:bg-primary/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* See All Button */}
            <Button variant="outline" className="rounded-xl shadow-sm hover:shadow-md hover:bg-primary hover:text-white transition-all group" asChild>
              <Link to={`/${language}/nos-formations`}>
                {t.seeAll}
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${language === 'ar' ? 'mr-2 rotate-180 group-hover:-translate-x-1' : 'ml-2'}`} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrainingCarousel;
