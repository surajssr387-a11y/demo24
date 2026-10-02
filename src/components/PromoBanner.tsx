import React from 'react';
import { studioInfo } from '../data/danceData';

interface PromoBannerProps {
  onOpenBooking: (category?: string) => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ onOpenBooking }) => {
  return (
    <section className="relative z-20 w-full bg-black leading-none overflow-hidden select-none border-y border-white/10">
      {/* Full-width Responsive Image Container */}
      <div className="relative w-full">
        <img
          src="/image.jpg"
          alt="Ramy's Dance Studio - Ramyyy Singh | Dance India Dance, India's Got Talent, So You Think You Can Dance"
          className="w-full h-auto block select-none object-cover"
          referrerPolicy="no-referrer"
        />

        {/* Interactive Clickable Hotspots overlay matching the visual layout of image.jpg */}
        {/* Main upper banner clickable to Book Demo Class */}
        <div
          onClick={() => onOpenBooking('Ramy Dance Studio Special')}
          className="absolute top-0 left-0 right-0 h-[84%] cursor-pointer group"
          title="Click to Book Demo Class at Ramy's Dance Studio"
        >
          {/* Subtle hover indicator */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/85 text-[#D8F800] text-xs sm:text-sm font-extrabold px-4 py-1.5 rounded-full border border-[#D8F800]/50 shadow-xl transform -translate-y-1 group-hover:translate-y-0 duration-200">
              ⚡ Click to Book Demo Class
            </span>
          </div>
        </div>

        {/* Bottom Yellow Strip Clickable Areas */}
        {/* 1. Address Link -> Google Maps */}
        <a
          href="https://www.google.com/maps/search/?api=1&query=Ramy's+Dance+Studio+Metro+Market+Kutchery+Road+Ranchi"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-0 left-[28%] w-[54%] h-[16%] cursor-pointer z-10"
          title="Open Location on Google Maps: 2nd Floor, Metro Market, Ranchi"
        />

        {/* 2. Phone Call Link -> tel:8340158178 */}
        <a
          href={`tel:${studioInfo.phone}`}
          className="absolute bottom-[8%] right-0 w-[18%] h-[8%] cursor-pointer z-10"
          title={`Call ${studioInfo.phoneDisplay}`}
        />

        {/* 3. WhatsApp Link -> wa.me/918340158178 */}
        <a
          href={`https://wa.me/${studioInfo.whatsappNumber}?text=Hello%20Ramy's%20Dance%20Studio,%20I%20want%20to%20inquire%20about%20dance%20classes.`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-0 right-0 w-[18%] h-[8%] cursor-pointer z-10"
          title={`Chat on WhatsApp: ${studioInfo.phoneDisplay}`}
        />
      </div>
    </section>
  );
};
