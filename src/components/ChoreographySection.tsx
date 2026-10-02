import React, { useState, useEffect } from 'react';
import {
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

export interface ChoreographyPerformanceItem {
  id: string;
  title: string;
  videoUrl: string;
  xPosition?: number; // 0 to 100% (Left - Right)
  yPosition: number; // 0 to 100% (Upar - Niche)
  brightness: number; // 0.5 to 2.0
  contrast?: number; // e.g. 1.04
}

const DEFAULT_PERFORMANCES: ChoreographyPerformanceItem[] = [
  {
    id: 'choreo-1',
    title: 'Kids Performance',
    videoUrl: '/choreography/choreo-kids.mp4',
    yPosition: 20,
    brightness: 1.1,
    contrast: 1.04,
  },
  {
    id: 'choreo-2',
    title: 'Beginner Routine',
    videoUrl: '/choreography/choreo-senior.mp4',
    yPosition: 22,
    brightness: 1.05,
    contrast: 1.04,
  },
  {
    id: 'choreo-3',
    title: 'Advance Hip-Hop Choreography',
    videoUrl: '/choreography/choreo-advance.mp4',
    yPosition: 20,
    brightness: 1.05,
    contrast: 1.04,
  },
  {
    id: 'choreo-4',
    title: 'Girls Choreography',
    videoUrl: '/choreography/choreo-ladies.mp4',
    xPosition: 50,
    yPosition: 25,
    brightness: 1.0,
    contrast: 1.04,
  },
  {
    id: 'choreo-5',
    title: 'Free Style Dance',
    videoUrl: '/choreography/choreo-freestyle.mp4',
    yPosition: 20,
    brightness: 1.0,
    contrast: 1.04,
  },
  {
    id: 'choreo-6',
    title: 'Wedding Choreography',
    videoUrl: '/choreography/choreo-private.mp4',
    yPosition: 18,
    brightness: 1.05,
    contrast: 1.04,
  },
];

interface ChoreographySectionProps {
  onOpenBooking?: (category?: string) => void;
}

export const ChoreographySection: React.FC<ChoreographySectionProps> = ({ onOpenBooking }) => {
  const [performances, setPerformances] = useState<ChoreographyPerformanceItem[]>(DEFAULT_PERFORMANCES);
  const [activeModalVideo, setActiveModalVideo] = useState<ChoreographyPerformanceItem | null>(null);
  const [modalIsMuted, setModalIsMuted] = useState<boolean>(false);

  // Sync saved performances from server on mount
  useEffect(() => {
    fetch('/api/choreography-performances')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const cleaned = data.map((item, idx) => {
            if (!item.videoUrl || item.videoUrl.startsWith('blob:')) {
              const fallback = DEFAULT_PERFORMANCES[idx] || DEFAULT_PERFORMANCES[0];
              return { ...item, videoUrl: fallback.videoUrl };
            }
            return item;
          });
          setPerformances(cleaned);
        }
      })
      .catch(() => {});
  }, []);

  // Keep active modal video in sync with latest performances
  useEffect(() => {
    if (activeModalVideo) {
      const match = performances.find((p) => p.id === activeModalVideo.id);
      if (match && (match.title !== activeModalVideo.title || match.videoUrl !== activeModalVideo.videoUrl)) {
        setActiveModalVideo(match);
      }
    }
  }, [performances, activeModalVideo]);

  // Ensure all videos play smoothly when rendered
  useEffect(() => {
    const vids = document.querySelectorAll<HTMLVideoElement>('section#choreography video');
    vids.forEach((v) => {
      v.muted = true;
      v.play().catch(() => {});
    });
  }, [performances]);

  return (
    <section id="choreography" className="relative bg-white text-neutral-900 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16">
        {/* Section Header: Title matching Categories section */}
        <div className="relative mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-950 font-display tracking-tight uppercase">
            Choreography
          </h2>
        </div>

        {/* 3x3 / 3-Column Grid of Dance Performance Videos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {performances.map((item) => {
            return (
              <div
                key={item.id}
                className="group flex flex-col select-none relative"
              >
                {/* Card Container */}
                <div className="relative w-full aspect-[16/10.5] rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-200/90 shadow-xs transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-md group-hover:border-neutral-300">
                  {/* Performance Video */}
                  <video
                    key={item.videoUrl}
                    src={item.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    onLoadedData={(e) => {
                      const v = e.currentTarget;
                      v.muted = true;
                      v.play().catch(() => {});
                    }}
                    onCanPlay={(e) => {
                      const v = e.currentTarget;
                      v.muted = true;
                      v.play().catch(() => {});
                    }}
                    style={{
                      objectPosition: `${item.xPosition ?? 50}% ${item.yPosition}%`,
                      filter: `brightness(${item.brightness}) contrast(${item.contrast || 1.04})`,
                    }}
                    className="w-full h-full object-cover transition-all duration-200 pointer-events-none"
                  />

                  {/* Play Overlay Button (Opens Theater Modal with sound) */}
                  <button
                    onClick={() => {
                      setActiveModalVideo(item);
                      setModalIsMuted(false);
                    }}
                    title="Watch performance video with sound"
                    className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/25 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-neutral-950 shadow-xl flex items-center justify-center transform group-hover:scale-110 active:scale-95 transition-all">
                      <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULL THEATER VIDEO PLAYER MODAL (WITH SOUND & FULLSCREEN) */}
      {/* ========================================================= */}
      {activeModalVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 border-b border-neutral-800 text-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-extrabold text-sm sm:text-base text-white font-display">
                  {activeModalVideo.title}
                </span>
                <span className="text-[11px] text-neutral-400">Studio Performance</span>
              </div>
              <button
                onClick={() => setActiveModalVideo(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
              <video
                src={activeModalVideo.videoUrl}
                autoPlay
                controls
                playsInline
                muted={modalIsMuted}
                style={{
                  objectPosition: `${activeModalVideo.xPosition ?? 50}% ${activeModalVideo.yPosition}%`,
                  filter: `brightness(${activeModalVideo.brightness}) contrast(${activeModalVideo.contrast || 1.04})`,
                }}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer with Actions */}
            <div className="px-5 py-3.5 bg-neutral-900/90 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModalIsMuted(!modalIsMuted)}
                  className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 hover:text-white bg-neutral-800 px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  {modalIsMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  <span>{modalIsMuted ? 'Unmute Sound' : 'Mute Sound'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const isWedding = activeModalVideo.title.toLowerCase().includes('wedding');
                    const categoryName = isWedding
                      ? 'Wedding Choreography'
                      : activeModalVideo.title.includes('Kids')
                      ? 'Kids Dance'
                      : activeModalVideo.title.includes('Bollywood') || activeModalVideo.title.includes('Girls') || activeModalVideo.title.includes('Ladies')
                      ? 'Bollywood Ladies'
                      : activeModalVideo.title.includes('Private')
                      ? 'Private Class'
                      : activeModalVideo.title.includes('Style') || activeModalVideo.title.includes('Free')
                      ? 'Gymnastic'
                      : 'Advance';
                    setActiveModalVideo(null);
                    onOpenBooking?.(categoryName);
                  }}
                  className="bg-[#0066FF] hover:bg-[#0052cc] text-white px-5 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {activeModalVideo.title.toLowerCase().includes('wedding')
                    ? 'Book Wedding Choreography'
                    : 'Join This Batch / Book Demo ₹49'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
