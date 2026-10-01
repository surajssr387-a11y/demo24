import React, { useRef, useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';

interface HeroProps {
  onOpenBooking?: () => void;
}

export const Hero: React.FC<HeroProps> = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string>('/hero-uploaded.mp4');

  // Exact framing configuration finalized by user
  const heroConfig = {
    xPosition: 50,
    yPosition: 16,
    zoom: 1,
    brightness: 0.95,
    contrast: 1.04,
    topGapPx: 48,
  };

  // Sync latest video URL from server if custom URL was set
  useEffect(() => {
    fetch('/api/hero-config')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.videoUrl && !data.videoUrl.startsWith('blob:')) {
          setVideoSrc(data.videoUrl);
        }
      })
      .catch(() => {});
  }, []);

  // Ensure autoplay works reliably across mobile & desktop browsers
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.defaultMuted = true;
    vid.muted = true;

    const playVideo = () => {
      vid.muted = true;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const unlock = () => {
            vid.muted = true;
            vid.play().catch(() => {});
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
          };
          window.addEventListener('click', unlock, { once: true });
          window.addEventListener('touchstart', unlock, { once: true });
        });
      }
    };

    playVideo();
  }, [videoSrc]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-end overflow-hidden bg-[#0C0E12] select-none">
      {/* Background Full-Screen Looping Video */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <video
          ref={videoRef}
          key={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
          }}
          onCanPlay={() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
          }}
          style={{
            objectPosition: `${heroConfig.xPosition}% ${heroConfig.yPosition}%`,
            transform: `scale(${heroConfig.zoom})`,
            filter: `brightness(${heroConfig.brightness}) contrast(${heroConfig.contrast})`,
            paddingTop: `${heroConfig.topGapPx}px`,
          }}
          className="w-full h-full object-cover transition-all duration-150 pointer-events-none"
        >
          <source src={videoSrc} type="video/mp4" />
          <source src="/hero-uploaded.mp4" type="video/mp4" />
          <source src="/choreography-loop.mp4" type="video/mp4" />
        </video>

        {/* Ambient Top & Bottom Lighting Gradients */}
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.25) 100%)',
          }}
        />

        {/* Soft top navbar vignette */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/60 via-black/15 to-transparent pointer-events-none" />
      </div>

      {/* Main Center-Bottom Action - Clean single CATEGORIES Button */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 flex flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center mt-6">
          <button
            onClick={() => scrollToSection('categories')}
            className="group flex items-center gap-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white font-extrabold text-sm md:text-base px-9 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 cursor-pointer tracking-wide"
          >
            <span>CATEGORIES</span>
            <ArrowDown className="w-4 h-4 stroke-[3] group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
