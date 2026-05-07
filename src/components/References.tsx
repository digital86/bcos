import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ScrollFloat from './ScrollFloat';

const References = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const [references, setReferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [sequenceRepeat, setSequenceRepeat] = useState(2);

  useEffect(() => {
    loadReferences();
  }, []);

  // Calculate how many times to repeat the base sequence so it fills the viewport,
  // then duplicate the whole sequence exactly twice for seamless infinite loop
  useEffect(() => {
    if (references.length === 0) return;

    const calculateRepetitions = () => {
      if (!containerRef.current || !marqueeRef.current) return;
      
      const containerWidth = window.innerWidth;
      const logoWidth = 256; // w-56 (224px) + mx-4 (32px total margin)
      const logosPerSet = references.length;
      const singleSetWidth = logosPerSet * logoWidth;
      
      // Build a base sequence that at least fills the viewport once
      // Add more buffer to ensure it starts "filling" from beyond the edges
      const baseRepeat = Math.max(2, Math.ceil(containerWidth / singleSetWidth) + 1);
      setSequenceRepeat(baseRepeat);
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(calculateRepetitions, 100);
    window.addEventListener('resize', calculateRepetitions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateRepetitions);
    };
  }, [references]);

  const loadReferences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_references')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReferences(data || []);
    } catch (error) {
      console.error('Error loading references:', error);
      // Fallback to hardcoded references if Supabase fails
      setReferences([
        { id: '1', company_name: 'lodgo', logo_url: 'https://bcos-dz.com/wp-content/uploads/2024/08/lodgo.webp' },
        { id: '2', company_name: 'logos', logo_url: 'https://bcos-dz.com/wp-content/uploads/2024/08/logos.webp' },
        { id: '3', company_name: 'logsdxo', logo_url: 'https://bcos-dz.com/wp-content/uploads/2024/08/logsdxo.webp' },
        { id: '4', company_name: 'logxsdo', logo_url: 'https://bcos-dz.com/wp-content/uploads/2024/08/logxsdo.webp' },
        { id: '5', company_name: 'sdzsx', logo_url: 'https://bcos-dz.com/wp-content/uploads/2024/08/sdzsx.webp' },
        { id: '6', company_name: 'szdszx', logo_url: 'https://bcos-dz.com/wp-content/uploads/2024/08/szdszx.webp' },
        { id: '7', company_name: '--', logo_url: 'https://bcos-dz.com/wp-content/uploads/2024/08/zsxdds.webp' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="references" className="py-4 lg:py-6 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-6 animate-fade-in">
          <div className="text-center">
            <div className="mb-2">
              <ScrollFloat
                containerClassName="text-4xl lg:text-5xl xl:text-6xl font-heading"
                style={{ color: '#253b74' }}
              >
                {language === 'ar' ? 'مراجعنا' : 'Nos Références'}
              </ScrollFloat>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : references.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <p className="text-muted-foreground">
            {language === 'ar' ? 'لا توجد مراجع متاحة حالياً' : 'Aucune référence disponible pour le moment'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden w-full relative" ref={containerRef}>
          {/* Gradient Masks for "Infinity" look on both sides */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>

          <div className={`flex ${language === 'ar' ? 'animate-marquee-rtl' : 'animate-marquee'}`} ref={marqueeRef}>
            {/* Reduced duplication to save DOM nodes while maintaining seamless loop */}
            {Array.from({ length: 1 }).map((_, dupIndex) => (
              <div key={`sequence-dup-${dupIndex}`} className="flex">
                {Array.from({ length: Math.min(sequenceRepeat, 4) }).map((_, repIndex) =>
                  references.map((reference, index) => (
                    <div 
                      key={`rep-${repIndex}-ref-${reference.id}-${index}`} 
                      className="mx-3 flex-shrink-0"
                    >
                      <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 transform hover:scale-110">
                        <img 
                          src={reference.logo_url}
                          alt={reference.company_name || 'Company logo'}
                          className="max-w-full max-h-full object-contain mix-blend-multiply"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
            {/* One more simple duplicate of the core list for the seamless wrap-around */}
            <div className="flex">
                {references.map((reference, index) => (
                    <div 
                      key={`wrap-ref-${reference.id}-${index}`} 
                      className="mx-3 flex-shrink-0"
                    >
                      <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300">
                        <img 
                          src={reference.logo_url}
                          alt={reference.company_name || 'Company logo'}
                          className="max-w-full max-h-full object-contain mix-blend-multiply"
                          loading="lazy"
                        />
                      </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};


// Add marquee animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes marquee-ar {
    0% { transform: translateX(0); }
    100% { transform: translateX(50%); }
  }
  .animate-marquee {
    animation: marquee 240s linear infinite;
    display: flex;
    width: max-content;
    will-change: transform;
  }
  .animate-marquee-rtl {
    animation: marquee-ar 240s linear infinite;
    display: flex;
    width: max-content;
    will-change: transform;
    flex-direction: row-reverse;
  }
`;
// Only add style once
if (!document.getElementById('marquee-style')) {
  style.id = 'marquee-style';
  document.head.appendChild(style);
}

export default References;
