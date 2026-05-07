import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Star } from 'lucide-react';
import { SupabaseService } from '@/lib/supabase';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const TrainersSection = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (loading || trainers.length === 0 || !sectionRef.current) return;
    
    const ctx = gsap.context(() => {
      // Header Animation
      gsap.from('.section-header > *', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      });

      // Trainer Cards Animation
      gsap.from('.trainer-card', {
        scrollTrigger: {
          trigger: '.trainers-grid',
          start: 'top 75%',
        },
        opacity: 0,
        y: 60,
        scale: 0.95,
        duration: 0.8,
        stagger: 0.15,
        ease: 'back.out(1.2)'
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [loading, trainers]);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setLoading(true);
        const allUsers = await SupabaseService.getUsers();
        const trainerList = allUsers?.filter(user => user.role === 'trainer' && user.status === 'active') || [];
        setTrainers(trainerList);
      } catch (error) {
        console.error('Error fetching trainers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (trainers.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="section-header text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
            {language === 'ar' ? 'فريق المكونين الخبراء' : 'Notre Équipe de Formateurs Experts'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {language === 'ar' 
              ? 'نخبة من الخبراء والمختصين يرافقونكم في رحلتكم التدريبية لضمان أفضل النتائج'
              : 'Une équipe d\'experts passionnés et certifiés pour vous accompagner dans votre montée en compétences.'
            }
          </p>
        </div>

        <div className="trainers-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {trainers.map((trainer) => (
            <Card key={trainer.id} className="trainer-card group overflow-hidden border-none shadow-glass hover:shadow-xl transition-smooth">
              <div className="aspect-square relative overflow-hidden">
                {trainer.avatar_url ? (
                  <img 
                    src={trainer.avatar_url} 
                    alt={trainer.full_name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                    <User className="w-20 h-20 opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <div className="text-white space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{trainer.email}</span>
                    </div>
                    {trainer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4" />
                        <span>{trainer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <CardContent className="p-6 text-center">
                <h3 className="font-heading font-bold text-xl mb-1">{trainer.full_name}</h3>
                <p className="text-primary font-medium text-sm mb-4">{trainer.company || (language === 'ar' ? 'مكون معتمد' : 'Formateur Expert')}</p>
                <div className="flex items-center justify-center gap-1 text-yellow-500 mb-4">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <Badge variant="secondary" className="bg-primary/5 text-primary border-none">
                  {language === 'ar' ? 'خبير معتمد' : 'Expert Certifié'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrainersSection;
