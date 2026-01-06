import React, { useState, useEffect } from 'react';
import { Button } from './Button';

export const StickyCTA: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const startPosition = window.scrollY;
    const distance = -startPosition; // Moving up means negative distance
    const duration = 1000;
    let start: number | null = null;

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      
      window.scrollTo(0, startPosition + (distance * ease));

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-3 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 md:hidden animate-slide-up">
       <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
             <span className="block font-bold text-dark-900 text-sm">Poucas Vagas Restantes</span>
             <span className="text-success-600 text-xs font-bold">100% OFF (Grátis) + Bônus</span>
          </div>
          <Button variant="urgency" className="py-3 px-6 text-sm whitespace-nowrap" onClick={scrollToTop}>
            GARANTIR VAGA
          </Button>
       </div>
    </div>
  );
};