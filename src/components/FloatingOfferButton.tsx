import React from 'react';
import { Flame, Sparkles } from 'lucide-react';

interface FloatingOfferButtonProps {
  onOpen: () => void;
}

export const FloatingOfferButton: React.FC<FloatingOfferButtonProps> = ({ onOpen }) => {
  return (
    <aside
      aria-label="Special Discount Offer"
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 select-none animate-in fade-in slide-in-from-bottom-5 duration-500"
    >
      <button
        onClick={onOpen}
        type="button"
        className="group relative flex items-center gap-2.5 sm:gap-3 pl-3 pr-4 sm:pl-3.5 sm:pr-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-bold shadow-2xl shadow-rose-600/40 hover:shadow-rose-600/60 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/30 cursor-pointer"
        aria-label="Open Special 30% Off Offer Modal"
      >
        {/* Pulsing Glow Ring */}
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-400 opacity-75 blur-xs group-hover:opacity-100 transition duration-300 animate-pulse pointer-events-none" />

        {/* Content Container */}
        <div className="relative flex items-center gap-2 sm:gap-2.5 z-10">
          {/* Flame Icon with Badge */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-md shrink-0 group-hover:rotate-12 transition-transform duration-300">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-rose-600 text-rose-600 animate-bounce" />
          </div>

          {/* Text Info */}
          <div className="flex flex-col text-left leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-200 flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 fill-amber-300 text-amber-300" />
                Special Offer
              </span>
              <span className="bg-white/20 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                30% OFF
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 text-xs sm:text-sm font-black">
              <span className="text-white/80 line-through text-[11px] sm:text-xs font-normal">₹1,549</span>
              <span className="text-white font-extrabold text-sm sm:text-base">₹899</span>
              <span className="hidden xs:inline text-[10px] text-amber-100 font-medium">/ month</span>
            </div>
          </div>
        </div>
      </button>
    </aside>
  );
};
