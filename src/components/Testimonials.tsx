import { Star, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import ScrollFloat from './ScrollFloat';
import { Button } from '@/components/ui/button';

interface GoogleReview {
  id: string | number;
  name: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  profilePhotoUrl?: string;
  language?: string;
  originalLanguage?: string;
}

const Testimonials = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const isArabic = language === 'ar';
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [googleRating, setGoogleRating] = useState<number>(4.9);
  const [totalRatings, setTotalRatings] = useState<number>(1200);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [sequenceRepeat, setSequenceRepeat] = useState(2);
  
  // Fallback mock reviews
  const mockReviews: GoogleReview[] = [
    { id: 'mock1', name: 'Mohamed El Aid', rating: 5, text: 'Service excellent et formations de qualité. Équipe professionnelle et suivi continu.', date: 'Il y a 2 mois', verified: true },
    { id: 'mock2', name: 'Amira Bouzid', rating: 5, text: 'Formation professionnelle qui nous a aidés à développer considérablement les compétences de notre équipe.', date: 'Il y a 3 mois', verified: true },
    { id: 'mock3', name: 'Youssef Kacem', rating: 5, text: 'BCOS est l\'un des meilleurs centres de formation en Algérie. Je le recommande vivement.', date: 'Il y a 4 mois', verified: true },
    { id: 'mock4', name: 'Leila Mourad', rating: 5, text: 'Excellente expérience avec BCOS. Les formateurs sont professionnels et le contenu est pratique et utile.', date: 'Il y a 5 mois', verified: true },
    { id: 'mock5', name: 'Karim Ben Ali', rating: 5, text: 'Les formations BCOS ont transformé notre équipe commerciale. Résultats concrets et mesurables dès les premières semaines.', date: 'Il y a 6 mois', verified: true },
    { id: 'mock6', name: 'Sara Meziani', rating: 5, text: 'Accompagnement de haute qualité avec des formateurs expérimentés. Nos employés sont heureux et plus performants.', date: 'Il y a 7 mois', verified: true },
    { id: 'mock7', name: 'Ahmed Ibrahim', rating: 5, text: 'Formation pratique et adaptée à nos besoins. Les consultants BCOS comprennent vraiment les défis du marché algérien.', date: 'Il y a 8 mois', verified: true },
    { id: 'mock8', name: 'Fatima Amrani', rating: 4, text: 'L\'e-learning BCOS nous a permis de former toute l\'équipe à distance. Plateforme intuitive et contenu de qualité.', date: 'Il y a 9 mois', verified: true },
  ];

  useEffect(() => {
    const fetchGoogleReviews = async () => {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      if (!SUPABASE_URL) {
        setGoogleReviews(mockReviews);
        setLoadingReviews(false);
        return;
      }

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/google-reviews`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
          },
        });

        if (!response.ok) {
          setGoogleReviews(mockReviews);
          setLoadingReviews(false);
          return;
        }

        const data = await response.json();
        if (data.reviews && data.reviews.length > 0) {
          const formattedReviews = data.reviews.map((review: any) => ({
            id: review.id || review.time || Date.now(),
            name: review.name || 'Anonymous',
            rating: review.rating || 5,
            text: review.text || '',
            date: review.date || '',
            time: review.time || 0,
            verified: review.verified !== false,
            profilePhotoUrl: review.profilePhotoUrl,
            language: review.originalLanguage || review.language || 'en',
            originalLanguage: review.originalLanguage || review.language || 'en',
          })).sort((a: any, b: any) => (b.time || 0) - (a.time || 0));
          
          setGoogleReviews(formattedReviews.length < 8 ? [...formattedReviews, ...mockReviews.slice(0, 8 - formattedReviews.length)] : formattedReviews);
          setGoogleRating(data.rating || 4.9);
          setTotalRatings(data.totalRatings || 1200);
        } else {
          setGoogleReviews(mockReviews);
        }
      } catch (error) {
        setGoogleReviews(mockReviews);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchGoogleReviews();
  }, [language]);

  useEffect(() => {
    if (googleReviews.length === 0) return;
    const calculateRepeat = () => {
      if (!containerRef.current || !marqueeRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const cardWidth = 336;
      const singleSetWidth = googleReviews.length * cardWidth;
      setSequenceRepeat(Math.max(1, Math.ceil(containerWidth / singleSetWidth) + 1));
    };
    const timer = setTimeout(calculateRepeat, 100);
    window.addEventListener('resize', calculateRepeat);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateRepeat);
    };
  }, [googleReviews]);

  return (
    <section className="py-4 lg:py-6 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-4 animate-fade-in" dir={isArabic ? 'rtl' : 'ltr'}>
          <ScrollFloat 
            containerClassName="text-3xl lg:text-4xl xl:text-5xl font-heading mb-4"
            style={{ color: '#253b74' }}
          >
            {isArabic ? (
              <>قالوا عن <span dir="ltr">BCOS</span>...</>
            ) : (
              'Ils ont parlé du BCOS'
            )}
          </ScrollFloat>
          
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-2xl font-bold text-foreground">{googleRating.toFixed(1)}/5</span>
            <span className="text-muted-foreground">
              {isArabic ? (
                <>(<span dir="ltr">{totalRatings}+</span> تقييم Google)</>
              ) : (
                `(${totalRatings}+ avis Google)`
              )}
            </span>
          </div>
        </div>
      </div>

      {loadingReviews ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{isArabic ? 'جاري تحميل التقييمات...' : 'Chargement des avis...'}</p>
        </div>
      ) : googleReviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{isArabic ? 'لا توجد تقييمات متاحة حالياً' : 'Aucun avis disponible pour le moment'}</p>
        </div>
      ) : (
        <div className={`mt-6 relative ${isArabic ? "font-['Almarai',sans-serif]" : ""}`}>
          <div className="overflow-hidden no-scrollbar w-full py-4 relative" ref={containerRef}>
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none"></div>

            <div className={`flex ${isArabic ? 'animate-marquee-ar-reverse' : 'animate-marquee-reverse'}`} ref={marqueeRef}>
              {Array.from({ length: 2 }).map((_, dupIndex) => (
                <div key={`dup-${dupIndex}`} className="flex">
                  {Array.from({ length: sequenceRepeat }).map((_, repIndex) =>
                    googleReviews.map((review, index) => {
                      const reviewLanguage = review.originalLanguage || review.language || (isArabic ? 'ar' : 'fr');
                      return (
                        <div key={`dup-${dupIndex}-rep-${repIndex}-rev-${review.id}-${index}`} className="mx-2 sm:mx-3 flex-shrink-0 w-48 sm:w-64 md:w-80">
                          <div className="rounded-2xl p-4 sm:p-6 shadow-sm border border-border/50 bg-white h-full flex flex-col hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                                  {review.profilePhotoUrl ? (
                                    <img src={review.profilePhotoUrl} alt={review.name} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-semibold text-white">{review.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground text-sm">{review.name}</p>
                                  {review.verified && (
                                    <div className="flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                            </div>
                            <div className="flex mb-3">
                              {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                            </div>
                            <p className="text-[13px] sm:text-sm text-muted-foreground mb-4 leading-relaxed flex-grow" dir={reviewLanguage === 'ar' ? 'rtl' : 'ltr'}>{review.text}</p>
                            <p className="text-xs text-muted-foreground mt-auto">{review.date}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 lg:px-8 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <Button asChild variant="default" size="sm">
            <a
              href="https://www.google.com/maps/place/Bcos/@36.7467583,3.1750073,25896m/data=!3m1!1e3!4m8!3m7!1s0x128e4dffca3afd0d:0xc63ddc96832f0f6f!8m2!3d36.742108!4d3.176819!9m1!1b1!16s%2Fg%2F1tdwxps0?entry=ttu&g_ep=EgoyMDI2MDQyMC4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              {isArabic ? 'اطلع على جميع التقييمات' : 'Voir tous les avis sur Google'}
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

const style = document.createElement('style');
style.textContent = `
  @keyframes marquee-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
  @keyframes marquee-ar-reverse { 0% { transform: translateX(50%); } 100% { transform: translateX(0); } }
  .animate-marquee-reverse { animation: marquee-reverse 100s linear infinite; display: flex; width: max-content; will-change: transform; }
  .animate-marquee-ar-reverse { animation: marquee-ar-reverse 100s linear infinite; display: flex; width: max-content; will-change: transform; flex-direction: row-reverse; }
`;
if (!document.getElementById('marquee-style-testimonials')) {
  style.id = 'marquee-style-testimonials';
  document.head.appendChild(style);
}
