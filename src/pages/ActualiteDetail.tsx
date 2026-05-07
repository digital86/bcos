import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';
import { SupabaseService } from '@/lib/supabase';
import SEO from '@/components/SEO';

type CompanyEvent = {
  id: string;
  title?: string;
  title_fr?: string;
  title_ar?: string;
  description?: string;
  description_fr?: string;
  description_ar?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
  image_url?: string;
  tags?: string[];
};

const ActualiteDetail = () => {
  const location = useLocation();
  const params = useParams();
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [event, setEvent] = useState<CompanyEvent | null>(null);
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
    const loadEvent = async () => {
      if (!params.id) return;
      try {
        setLoading(true);
        const data = await SupabaseService.getCompanyEventById(params.id);
        setEvent(data);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [params.id]);

  if (loading) {
    return (
      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        </div>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center py-16 text-muted-foreground">
            {language === 'ar' ? 'لم يتم العثور على الحدث' : 'Événement introuvable'}
          </div>
        </div>
      </section>
    );
  }

  const title = language === 'ar' ? (event.title_ar || event.title) : (event.title_fr || event.title);
  const description = language === 'ar' ? (event.description_ar || event.description) : (event.description_fr || event.description);
  const dateText = event.event_date ? new Date(event.event_date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR') : '';

  return (
    <section className="py-20 lg:py-32 bg-white">
      <SEO 
        title={`${title} | BCOS Actualité`}
        description={description?.substring(0, 160) || ''}
        lang={language}
        canonical={`https://bcos-dz.com/${language}/actualite/${params.id}`}
      />
      <div className="container mx-auto px-4 lg:px-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          {event.image_url ? (
            <div className="aspect-video w-full rounded-3xl overflow-hidden mb-8">
              <img
                src={event.image_url}
                alt={title || ''}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';
                }}
              />
            </div>
          ) : null}
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-primary/10 text-primary">
              {language === 'ar' ? 'خبر BCOS' : 'Actualité BCOS'}
            </Badge>
            {event.tags && event.tags.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {event.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{t}</span>
                ))}
              </div>
            ) : null}
          </div>
          <h1 className="text-3xl lg:text-4xl font-heading font-bold mb-4">{title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            {event.event_date ? (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {dateText}
              </span>
            ) : null}
            {event.event_time ? (
              <span>{event.event_time}</span>
            ) : null}
            {event.location ? (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location}
              </span>
            ) : null}
          </div>
          {description ? (
            <div className="prose max-w-none text-foreground">
              <p className="leading-7">{description}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default ActualiteDetail;
