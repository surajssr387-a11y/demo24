import React from 'react';
import { MapPin, Clock, Phone, ArrowUp, ExternalLink } from 'lucide-react';
import { studioInfo } from '../data/danceData';
import { RealInstagramIcon, RealYoutubeIcon, RealWhatsappIcon } from './BrandIcons';

interface FooterSectionProps {
  onOpenBooking: (category?: string) => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ onOpenBooking }) => {

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="location" className="relative bg-black text-white pt-16 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 3 Column Footer Layout matching Screenshot 5 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-16">
          
          {/* Left Column: Brand & Direct Action (spans 5 cols) */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo-transparent.png"
                alt="Ramy's Dance Studio"
                className="h-14 sm:h-16 w-auto object-contain shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-[#0066FF] text-xs font-black tracking-[0.25em] uppercase">
                  {studioInfo.brandKicker}
                </span>
                <span className="text-white text-xl sm:text-2xl font-black font-display tracking-tight leading-none mt-0.5">
                  {studioInfo.brandMain}
                </span>
              </div>
            </div>

            {/* CTAs with clean matte styling */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenBooking('Kids Dance')}
                className="bg-[#0066FF] hover:bg-[#0052cc] text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-full transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                BOOK DEMO {studioInfo.demoPriceText}
              </button>

              <a
                href={`https://wa.me/${studioInfo.whatsappNumber}?text=Hi%20Ramy's%20Dance%20Studio!%20I%20am%20interested%20in%20dance%20classes`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#171A20] hover:bg-[#20252E] text-white border border-white/15 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-full transition-all"
              >
                <RealWhatsappIcon className="w-4 h-4 shrink-0" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Middle Column: Studio Location (spans 4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base font-display">
              <MapPin className="w-4 h-4 text-[#0066FF]" />
              <span>Studio Location</span>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xs">
              {studioInfo.address}
            </p>

            <div>
              <a
                href={studioInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0066FF] hover:underline"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Hours, Phone & Social Links */}
          <div className="md:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base font-display">
              <Clock className="w-4 h-4 text-[#0066FF]" />
              <span>Hours &amp; Connect</span>
            </div>

            <div className="space-y-1 text-xs sm:text-sm text-slate-400">
              <p>{studioInfo.hours.weekdays}</p>
              <p>{studioInfo.hours.sunday}</p>
            </div>

            {/* Social Media & Contact Links */}
            <div className="space-y-2.5 pt-2">
              <a
                href={`tel:${studioInfo.phone}`}
                className="flex items-center gap-2.5 text-white hover:text-[#0066FF] font-bold text-xs sm:text-sm transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#16181F] border border-white/10 flex items-center justify-center text-[#0066FF] group-hover:border-white/20 transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span>{studioInfo.phoneDisplay}</span>
              </a>

              {/* YouTube Link */}
              <a
                href={studioInfo.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-slate-300 hover:text-white text-xs font-medium transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#16181F] border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
                  <RealYoutubeIcon className="w-4 h-4 shrink-0" />
                </div>
                <span>{studioInfo.youtubeHandle}</span>
              </a>

              {/* Instagram Link */}
              <a
                href={studioInfo.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-slate-300 hover:text-white text-xs font-medium transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#16181F] border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
                  <RealInstagramIcon className="w-4 h-4 shrink-0" />
                </div>
                <span>{studioInfo.instagramHandle}</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright and Back to Top matching Screenshot 5 */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <p>© 2026 Ramy&apos;s Dance Studio. All rights reserved.</p>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};
