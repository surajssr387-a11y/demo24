import React, { useRef, useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';

interface HeroProps {
  onOpenBooking?: () => void;
}

interface HeroConfigState {
  videoUrl: string;
  xPosition: number;
  yPosition: number;
  zoom: number;
  brightness: number;
  contrast: number;
}

export const Hero: React.FC<HeroProps> = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [heroConfig, setHeroConfig] = useState<HeroConfigState>({
    videoUrl: '/uploads/media_1791123532086_IMG_3618.mp4',
    xPosition: 50,
    yPosition: 21,
    zoom: 1,
    brightness: 1,
    contrast: 1,
  });

  // Sync latest video URL and framing from server
  useEffect(() => {
    fetch('/api/hero-config')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setHeroConfig((prev) => ({
            ...prev,
            videoUrl: data.videoUrl || prev.videoUrl,
            xPosition: typeof data.xPosition === 'number' ? data.xPosition : prev.xPosition,
            yPosition: typeof data.yPosition === 'number' ? data.yPosition : prev.yPosition,
            zoom: typeof data.zoom === 'number' ? data.zoom : prev.zoom,
            brightness: typeof data.brightness === 'number' ? data.brightness : 1,
            contrast: typeof data.contrast === 'number' ? data.contrast : 1,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Ensure autoplay works buttery-smooth and instantly across all browsers
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
  }, [heroConfig.videoUrl]);

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
          key={heroConfig.videoUrl}
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
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
          }}
          className="w-full h-full object-cover pointer-events-none"
        >
          <source src={heroConfig.videoUrl} type="video/mp4" />
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
            className="group flex items-center gap-2.5 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-extrabold text-sm md:text-base px-9 py-4 rounded-full backdrop-blur-xl border border-white/40 hover:border-white/60 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:scale-105 active:scale-95 cursor-pointer tracking-wide"
          >
            <span>CATEGORIES</span>
            <ArrowDown className="w-4 h-4 stroke-[3] group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
