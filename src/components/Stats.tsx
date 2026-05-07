import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface StatItemProps {
  value: string;
  label: string;
  delay?: number;
  isGreen?: boolean;
}

import Counter from './Counter';

const StatItem = ({ value, label, isGreen = false, language = 'fr' }: StatItemProps) => {
  return (
    <div
      className={`rounded-2xl p-6 lg:p-8 text-center transform transition-smooth hover:scale-105 ${
        isGreen 
          ? 'bg-gradient-to-br from-bcos-lime to-[#a8d84a]' 
          : 'bg-gradient-to-br from-primary to-[#5ba3f5]'
      }`}
    >
      <div className="text-3xl lg:text-4xl xl:text-5xl font-heading font-bold text-white mb-1 text-center">
        <Counter end={value} />
      </div>
      <div className="text-sm lg:text-base font-medium text-white/90 text-center">
        {label}
      </div>
    </div>
  );
};

const Stats = () => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const statsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stat-box', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 85%',
        },
      });
    }, statsRef);

    return () => ctx.revert();
  }, []);

  const stats = language === 'ar' 
    ? [
        { value: '30000+', label: <>مشارك في دورات <span dir="ltr">BCOS</span></>, isGreen: true },
        { value: '90+', label: 'دورات متاحة', isGreen: false },
        { value: '700+', label: 'شركة استفادت من خدماتنا', isGreen: true },
        { value: '20+', label: 'سنوات الخبرة', isGreen: false },
      ]
    : [
        { value: '30000+', label: 'Participants formés', isGreen: true },
        { value: '90+', label: 'Formations disponibles', isGreen: false },
        { value: '700+', label: 'Entreprises clientes', isGreen: true },
        { value: '20+', label: "Années d'expertise", isGreen: false },
      ];

  return (
    <section className="py-8 lg:py-12 relative overflow-hidden -mt-16 lg:-mt-24">
      <div className="container mx-auto px-4 lg:px-8" ref={statsRef}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="stat-box">
                <StatItem
                  value={stat.value}
                  label={stat.label}
                  isGreen={stat.isGreen}
                  language={language}
                />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
