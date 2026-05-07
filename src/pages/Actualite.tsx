import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { SupabaseService } from '@/lib/supabase';

type CompanyEvent = {
  id: string;
  title?: string;
  title_fr?: string;
  title_ar?: string;
  description?: string;
  description_fr?: string;
  description_ar?: string;
  slug?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
  image_url?: string;
  tags?: string[];
  is_published?: boolean;
  created_at?: string;
};

const Actualite = () => {
  const location = useLocation();
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/ar')) {
      setLanguage('ar');
    } else {
      setLanguage('fr');
    }
  }, [location.pathname]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const data = await SupabaseService.getCompanyEvents(false);
        setEvents(data || []);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const t = {
    badge: language === 'ar' ? 'الأخبار والأنشطة' : 'Actualités & Activités',
    title: language === 'ar' ? 'فعاليات وأنشطة الشركة' : 'Activités et événements',
    seeMore: language === 'ar' ? 'عرض التفاصيل' : 'Voir le détail',
    empty: language === 'ar' ? 'لا توجد فعاليات حالياً' : 'Aucun événement pour le moment',
    loading: language === 'ar' ? 'جاري التحميل...' : 'Chargement...',
  };

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <main>
        {/* ── Hero ── */}
        <section className="py-14 sm:py-20 lg:py-28 relative min-h-[40vh] sm:min-h-[50vh] flex items-center">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80')` }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(37, 59, 116, 0.80)' }} />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-block mb-3">
                <Badge className="bg-accent text-accent-foreground px-3 py-1 text-xs sm:text-sm">
                  {t.badge}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-bold text-white leading-tight">
                {t.title}
              </h1>
            </div>
          </div>
        </section>

        {/* ── Content ── */}
        <section className="py-10 sm:py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">{t.loading}</div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">{t.empty}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                {events.map((ev) => {
                  const title =
                    language === 'ar'
                      ? ev.title_ar || ev.title
                      : ev.title_fr || ev.title;
                  const description =
                    language === 'ar'
                      ? ev.description_ar || ev.description
                      : ev.description_fr || ev.description;
                  const dateText = ev.event_date
                    ? new Date(ev.event_date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')
                    : '';
                  return (
                    <Card key={ev.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-36 sm:h-44 bg-muted">
                        {ev.image_url ? (
                          <img
                            src={ev.image_url}
                            alt={title || ''}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';
                            }}
                          />
                        ) : null}
                      </div>
                      <CardHeader className="pb-2 px-4 pt-4">
                        <CardTitle className="line-clamp-2 text-sm sm:text-base">{title}</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-2 sm:space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          {ev.event_date ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              {dateText}
                            </span>
                          ) : null}
                          {ev.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              {ev.location}
                            </span>
                          ) : null}
                        </div>
                        {description ? (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">{description}</p>
                        ) : null}
                        <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm" asChild>
                          <a href={`${language === 'ar' ? '/ar' : '/fr'}/actualite/${ev.id}`}>
                            {t.seeMore}
                            <ArrowRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${language === 'ar' ? 'mr-1 rotate-180' : 'ml-1'}`} />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Actualite;
