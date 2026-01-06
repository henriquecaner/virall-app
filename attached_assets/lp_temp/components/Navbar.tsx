import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Início', href: '#' },
    { name: 'O Problema', href: '#problema' },
    { name: 'Como Funciona', href: '#solucao' },
    { name: 'Resultados', href: '#depoimentos' },
  ];

  const smoothScroll = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const id = targetId.replace('#', '');
    const targetElement = id ? document.getElementById(id) : document.body;
    
    if (!targetElement) return;

    const headerOffset = 90; // Height of the fixed navbar plus breathing room
    const elementPosition = targetElement.getBoundingClientRect().top;
    const startPosition = window.scrollY;
    
    // If scrolling to top (id is empty), final pos is 0. Otherwise calculate offset.
    const finalPosition = id === '' ? 0 : elementPosition + startPosition - headerOffset;
    
    const distance = finalPosition - startPosition;
    const duration = 1200; // Duration in ms (1.2s for a luxurious feel)
    let start: number | null = null;

    // Custom Easing Function: EaseInOutCubic
    // Starts slow, speeds up in middle, slows down at end
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

  const textColorClass = scrolled ? 'text-dark-900 hover:text-brand-600' : 'text-slate-300 hover:text-white';
  const logoColorClass = scrolled ? 'text-dark-900' : 'text-white';

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-sm py-4 border-b border-slate-200/50' 
          : 'bg-transparent py-6 border-b border-white/5'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group" onClick={(e) => smoothScroll(e, '#')}>
             <div className={`text-2xl font-black tracking-tighter ${logoColorClass}`}>
                VIRALL<span className="text-brand-500">.</span>
             </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={(e) => smoothScroll(e, link.href)}
                className={`text-sm font-medium transition-colors ${textColorClass}`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <a href="#" className={`text-sm font-semibold transition-colors ${textColorClass}`}>
                Login
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-5">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                onClick={(e) => smoothScroll(e, link.href)}
                className="text-dark-900 font-medium py-2 px-4 hover:bg-slate-50 rounded-lg"
              >
                {link.name}
              </a>
            ))}
             <div className="h-px bg-slate-100 my-2"></div>
             <a 
                href="#" 
                className="text-center py-2 text-slate-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
             >
                Login
             </a>
          </div>
        )}
      </div>
    </header>
  );
};