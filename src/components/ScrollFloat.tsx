import React, { useEffect, useMemo, useRef, ReactNode, RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollFloat.css';

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  containerClassName?: string;
  textClassName?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
}

const ScrollFloat: React.FC<ScrollFloatProps> = ({
  children,
  scrollContainerRef,
  containerClassName = '',
  textClassName = '',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'top bottom+=20%',
  scrollEnd = 'bottom bottom-=30%',
  stagger = 0.03
}) => {
  const location = useLocation();
  const language = location.pathname.startsWith('/ar') ? 'ar' : 'fr';
  const containerRef = useRef<HTMLHeadingElement>(null);

  const splitText = useMemo(() => {
    // For Arabic, if children is JSX, return it directly
    if (language === 'ar' && typeof children !== 'string') {
      return children;
    }
    
    const text = typeof children === 'string' ? children : '';
    
    // For Arabic, don't split - display as normal text to avoid issues
    if (language === 'ar') {
      return text;
    }
    
    // For French/English, split by characters for animation
    return text.split('').map((char, index) => (
      <span className="char" key={index}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  }, [children, language]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Disable animation for Arabic to avoid text issues
    if (language === 'ar') {
      const charElements = el.querySelectorAll('.char');
      charElements.forEach((char) => {
        (char as HTMLElement).style.opacity = '1';
        (char as HTMLElement).style.transform = 'none';
      });
      return;
    }

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    const charElements = el.querySelectorAll('.char');
    const elementsArray = Array.from(charElements);

    gsap.fromTo(
      elementsArray,
      {
        willChange: 'opacity, transform',
        opacity: 0,
        yPercent: 120,
        scaleY: 2.3,
        scaleX: 0.7,
        transformOrigin: '50% 0%'
      },
      {
        duration: animationDuration,
        ease: ease,
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        stagger: stagger,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: scrollStart,
          end: scrollEnd,
          scrub: true
        }
      }
    );
  }, [scrollContainerRef, animationDuration, ease, scrollStart, scrollEnd, stagger, language]);

  return (
    <h2 
      ref={containerRef} 
      className={`scroll-float font-bold text-center ${containerClassName}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {language === 'ar' ? (
        <span 
          className={`scroll-float-text ${textClassName} scroll-float-rtl`}
          dir="rtl"
        >
          {splitText}
        </span>
      ) : (
        <span 
          className={`scroll-float-text ${textClassName}`}
          dir="ltr"
        >
          {splitText}
        </span>
      )}
    </h2>
  );
};

export default ScrollFloat;

