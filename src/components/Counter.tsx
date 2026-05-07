import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface CounterProps {
  end: string | number;
  duration?: number;
  className?: string;
}

const Counter: React.FC<CounterProps> = ({ end, duration = 2, className = '' }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const counterRef = useRef<HTMLSpanElement>(null);
  
  // Extract number and suffix (e.g., "18+" -> 18, "+")
  const processValue = (val: string | number) => {
    const str = String(val);
    const match = str.match(/(\d+)/);
    const number = match ? parseInt(match[0], 10) : 0;
    const suffix = str.replace(/\d+/g, '');
    const prefixMatch = str.match(/^[^\d]+/);
    const prefix = prefixMatch ? prefixMatch[0] : '';
    const finalSuffix = suffix.replace(prefix, '');
    return { number, prefix, suffix: finalSuffix };
  };

  useEffect(() => {
    const { number, prefix, suffix } = processValue(end);
    let obj = { value: 0 };

    const ctx = gsap.context(() => {
      gsap.to(obj, {
        value: number,
        duration: duration,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: counterRef.current,
          start: 'top 85%',
        },
        onUpdate: () => {
          setDisplayValue(`${prefix}${Math.floor(obj.value)}${suffix}`);
        },
      });
    }, counterRef);

    return () => ctx.revert();
  }, [end, duration]);

  return (
    <span ref={counterRef} className={className}>
      {displayValue}
    </span>
  );
};

export default Counter;
