import React, { useState, useEffect } from 'react';
import { Play, X, ZoomIn, Sliders } from 'lucide-react';
import { MediaCustomizationModal, MediaCustomizationConfig } from './MediaCustomizationModal';

export interface AchievementMediaItem {
  id: string;
  type: 'video' | 'photo';
  title: string;
  imageUrl: string;
  videoUrl?: string;
  badge?: string;
  xPosition?: number; // 0 to 100% (Left - Right)
  yPosition?: number; // 0 to 100% (Upar - Niche)
  brightness?: number; // 0.5 to 2.0
  contrast?: number;
}

export const DEFAULT_ACHIEVEMENTS: AchievementMediaItem[] = [
  // 3 Verified Video Achievements
  {
    id: 'vid-1',
    type: 'video',
    title: 'Dance India Dance (DID)',
    imageUrl: '/achievements/did-thumb.png',
    videoUrl: '/achievements/did-video.mp4',
    badge: 'Video',
  },
  {
    id: 'vid-2',
    type: 'video',
    title: "India's Got Talent (IGT)",
    imageUrl: '/achievements/igt-thumb.png',
    videoUrl: '/achievements/igt-video.mp4',
    badge: 'Video',
  },
  {
    id: 'vid-3',
    type: 'video',
    title: 'Bollywood Movies Choreography',
    imageUrl: '/achievements/bollywood-thumb.png',
    videoUrl: '/achievements/bollywood-video.mp4',
    badge: 'Video',
  },

  // 2nd Row: 3 Photos
  {
    id: 'img-1',
    type: 'photo',
    title: '',
    imageUrl: '/achievements/ramy-igt.jpg',
  },
  {
    id: 'img-2',
    type: 'photo',
    title: '',
    imageUrl: '/achievements/magazine-collage.png',
  },
  {
    id: 'img-3',
    type: 'photo',
    title: '',
    imageUrl: '/achievements/studio-photo-1.png',
  },

  // 3rd Row: 3 Photos
  {
    id: 'img-4',
    type: 'photo',
    title: '',
    imageUrl: '/achievements/studio-photo-2.png',
    xPosition: 50,
    yPosition: 50,
    brightness: 1.0,
  },
  {
    id: 'img-5',
    type: 'photo',
    title: '',
    imageUrl: '/achievements/studio-photo-3.png',
    xPosition: 50,
    yPosition: 50,
    brightness: 1.0,
  },
  {
    id: 'img-6',
    type: 'photo',
    title: '',
    imageUrl: '/achievements/studio-photo-4.jpg',
  },
];

export const AchievementsSection: React.FC = () => {
  const [items, setItems] = useState<AchievementMediaItem[]>(DEFAULT_ACHIEVEMENTS);
  const [activeVideo, setActiveVideo] = useState<AchievementMediaItem | null>(null);
  const [activePhoto, setActivePhoto] = useState<AchievementMediaItem | null>(null);
  const [customizingItem, setCustomizingItem] = useState<AchievementMediaItem | null>(null);

  const handleSaveCustomization = async (newConfig: MediaCustomizationConfig) => {
    if (!customizingItem) return;
    const updated = items.map((it) =>
      it.id === customizingItem.id
        ? { ...it, ...newConfig }
        : it
    );
    setItems(updated);
    try {
      localStorage.setItem('ramys_achievements_config_v1', JSON.stringify(updated));
      await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error('Failed to save achievements customization:', e);
    }
  };

  // Sync latest achievements from server if available
  useEffect(() => {
    fetch('/api/achievements')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleCardClick = (item: AchievementMediaItem) => {
    if (item.type === 'video') {
      setActiveVideo(item);
    } else {
      setActivePhoto(item);
    }
  };

  return (
    <section id="achievements" className="relative bg-white text-neutral-900 overflow-hidden py-10 sm:py-14 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="relative mb-8 sm:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-950 font-display tracking-tight uppercase cursor-default select-none">
            Achievements
          </h2>
        </div>

        {/* 3x3 Grid (3 columns x 3 rows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {items.map((item) => {
            const isVideo = item.type === 'video';

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="group cursor-pointer flex flex-col select-none relative"
              >
                {/* Card Container (Clean, rounded-2xl, 16/10.5 aspect ratio) */}
                <div className="relative w-full aspect-[16/10.5] rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/90 shadow-xs transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-md group-hover:border-neutral-300">
                  {/* Media Image */}
                  <img
                    src={item.imageUrl}
                    alt={item.title || 'Studio Achievement'}
                    style={{
                      objectPosition: `${item.xPosition ?? 50}% ${item.yPosition ?? 50}%`,
                      filter: `brightness(${item.brightness ?? 1.0}) contrast(${item.contrast ?? 1.0})`,
                    }}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Gentle hover overlay */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors" />

                  {/* Quick Customize / Adjust Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomizingItem(item);
                    }}
                    title="Customize framing & brightness (left-right, upar-niche, brightness)"
                    className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer opacity-90 group-hover:opacity-100"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Customize</span>
                  </button>

                  {/* Video Badge / Play Indicator */}
                  {isVideo ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:scale-110 group-hover:bg-[#0052cc] transition-all duration-300">
                        <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-xs flex items-center justify-center">
                        <ZoomIn className="w-4 h-4" />
                      </span>
                    </div>
                  )}

                  {/* Video Badge Tag */}
                  {isVideo && item.badge && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#0066FF] text-white text-[11px] font-black tracking-wider px-2.5 py-1 rounded-md uppercase shadow-md">
                        {item.badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title Label Centered Below Card (if present) */}
                {item.title && item.title.trim().length > 0 && (
                  <h3 className="mt-3 text-center font-bold text-neutral-950 text-sm sm:text-base md:text-lg tracking-tight group-hover:text-[#0066FF] transition-colors">
                    {item.title}
                  </h3>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Lightbox Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
          onClick={() => setActiveVideo(null)}
        >
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
            title="Close video (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="relative max-w-4xl w-full bg-black rounded-2xl overflow-hidden border border-white/15 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full aspect-video bg-black flex items-center justify-center">
              <video
                src={activeVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
            {activeVideo.title && (
              <div className="w-full p-4 bg-neutral-950 border-t border-white/10 text-center">
                <h3 className="text-base sm:text-lg font-bold text-white font-display">
                  {activeVideo.title}
                </h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
          onClick={() => setActivePhoto(null)}
        >
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
            title="Close photo (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="relative max-w-4xl w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/80 shadow-2xl max-h-[75vh] flex items-center justify-center">
              <img
                src={activePhoto.imageUrl}
                alt={activePhoto.title || 'Achievement Photo'}
                className="w-auto h-auto max-h-[75vh] max-w-full object-contain rounded-2xl"
              />
            </div>
            {activePhoto.title && (
              <div className="mt-4 text-center">
                <h3 className="text-base sm:text-xl font-bold text-white font-display">
                  {activePhoto.title}
                </h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media Customization Modal */}
      {customizingItem && (
        <MediaCustomizationModal
          isOpen={!!customizingItem}
          onClose={() => setCustomizingItem(null)}
          title={customizingItem.title || 'Studio Achievement Photo'}
          mediaType={customizingItem.type === 'video' ? 'video' : 'image'}
          mediaUrl={customizingItem.type === 'video' ? (customizingItem.videoUrl || customizingItem.imageUrl) : customizingItem.imageUrl}
          initialConfig={{
            xPosition: customizingItem.xPosition ?? 50,
            yPosition: customizingItem.yPosition ?? 50,
            brightness: customizingItem.brightness ?? 1.0,
            contrast: customizingItem.contrast ?? 1.0,
          }}
          onSave={handleSaveCustomization}
        />
      )}
    </section>
  );
};
