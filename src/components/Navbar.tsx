import React, { useState, useEffect } from 'react';
import { Calendar, Menu, X, MapPin, Phone } from 'lucide-react';
import { studioInfo } from '../data/danceData';

interface NavbarProps {
  onOpenBooking: (category?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Run once on mount to set initial state correctly
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Categories', href: '#categories' },
    { name: 'Achievements', href: '#achievements' },
    { name: 'Choreography', href: '#choreography' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 transition-all select-none">
      {/* Main Navbar Bar - Transparent initially, turns White upon scroll */}
      <div
        className={`w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200/90 shadow-sm py-2 sm:py-2.5 text-neutral-900'
            : 'bg-transparent border-b border-transparent py-2.5 sm:py-3.5 text-white'
        }`}
      >
        <div className="w-full px-3.5 sm:px-6 md:px-8 lg:px-10 flex items-center justify-between">
          {/* Full Left: Brand Lockup */}
          <a href="#" className="flex items-center gap-2.5 sm:gap-3.5 select-none group shrink-0">
            <img
              src="/logo-transparent.png"
              alt="Ramy's Dance Studio"
              className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-22 lg:w-22 object-contain group-hover:scale-105 transition-transform duration-200 shrink-0"
            />
            <div className="flex flex-col justify-center shrink-0">
              <div
                className={`font-black font-display tracking-tight transition-colors ${
                  isScrolled ? 'text-neutral-950' : 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]'
                }`}
              >
                {/* Mobile View: Strictly 2 lines */}
                <div className="sm:hidden flex flex-col leading-none">
                  <span className="text-[13px] font-black tracking-wide whitespace-nowrap">
                    RAMY&apos;S
                  </span>
                  <span className="text-xs font-black tracking-tight whitespace-nowrap mt-0.5">
                    DANCE STUDIO
                  </span>
                </div>

                {/* Tablet / Desktop View: 1 single clean line */}
                <span className="hidden sm:inline-block text-lg md:text-xl lg:text-2xl leading-tight whitespace-nowrap">
                  RAMY&apos;S DANCE STUDIO
                </span>
              </div>
            </div>
          </a>

          {/* Full Right: Desktop Navigation Links + Book Button + Mobile/Tablet Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-8 shrink-0">
            {/* Desktop Navigation Links */}
            <nav
              className={`hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold transition-colors ${
                isScrolled ? 'text-neutral-700' : 'text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]'
              }`}
            >
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`transition-colors cursor-pointer ${
                    isScrolled ? 'hover:text-[#0066FF]' : 'hover:text-white'
                  }`}
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Action Button: Responsive sizing */}
            <button
              onClick={() => onOpenBooking()}
              className="flex items-center gap-1.5 sm:gap-2 bg-[#0066FF] hover:bg-[#0052cc] text-white font-extrabold text-xs sm:text-sm px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">BOOK DEMO {studioInfo.demoPriceText}</span>
              <span className="inline sm:hidden">Demo {studioInfo.demoPriceText}</span>
            </button>

            {/* Mobile & Tablet Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors cursor-pointer ${
                isScrolled
                  ? 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                  : 'bg-black/30 backdrop-blur-xs text-white hover:bg-black/50'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-b px-5 sm:px-8 py-5 space-y-4 shadow-xl backdrop-blur-xl ${
            isScrolled
              ? 'bg-white/98 border-neutral-200 text-neutral-900'
              : 'bg-neutral-950/98 border-neutral-800 text-white'
          }`}
        >
          {/* Navigation Links */}
          <nav className="flex flex-col space-y-2 text-base font-semibold">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`py-2 px-3 rounded-lg transition-colors flex items-center justify-between ${
                  isScrolled
                    ? 'text-neutral-800 hover:bg-neutral-100 hover:text-[#0066FF]'
                    : 'text-neutral-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{link.name}</span>
                <span className="text-xs opacity-50">→</span>
              </a>
            ))}
          </nav>

          {/* Quick Studio Info in Drawer */}
          <div
            className={`pt-3 border-t text-xs flex flex-col gap-2 ${
              isScrolled ? 'border-neutral-200 text-neutral-600' : 'border-neutral-800 text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
              <span className="truncate">{studioInfo.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
              <span>{studioInfo.phone}</span>
            </div>
          </div>

          {/* Full Width Action Button in Drawer */}
          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#0066FF] hover:bg-[#0052cc] text-white font-extrabold text-sm py-3 rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              <Calendar className="w-4 h-4 stroke-[2.5]" />
              BOOK DEMO {studioInfo.demoPriceText}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
