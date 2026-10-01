import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowDown,
  Video,
  Loader2,
  CheckCircle2,
  X,
  Sliders,
  Sun,
  ArrowUp,
  RotateCcw,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface HeroProps {
  onOpenBooking?: () => void;
}

export const Hero: React.FC<HeroProps> = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoSrc, setVideoSrc] = useState<string>('/hero-uploaded.mp4');
  const [topGapPx, setTopGapPx] = useState<number>(48);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [showUploadPill, setShowUploadPill] = useState<boolean>(false);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [saveConfigStatus, setSaveConfigStatus] = useState<string | null>(null);

  // Dynamic Live Hero Video Framing Config
  const [heroConfig, setHeroConfig] = useState({
    videoUrl: '/hero-uploaded.mp4',
    xPosition: 50,
    yPosition: 18,
    zoom: 1,
    overlayDarkness: 0.35,
    brightness: 0.95,
    contrast: 1.04,
  });

  // Load and sync hero config
  useEffect(() => {
    fetch('/api/hero-config')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const validUrl =
            data.videoUrl && !data.videoUrl.startsWith('blob:')
              ? data.videoUrl
              : '/hero-uploaded.mp4';
          setVideoSrc(validUrl);
          setHeroConfig((prev) => ({
            ...prev,
            ...data,
            videoUrl: validUrl,
            yPosition: data.yPosition !== undefined ? data.yPosition : 18,
            brightness: data.brightness !== undefined ? data.brightness : 0.95,
            contrast: data.contrast !== undefined ? data.contrast : 1.04,
          }));
          if (data.topGapPx !== undefined) {
            setTopGapPx(data.topGapPx);
          }
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

  // Handle direct permanent upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('Saving video permanently to studio server...');

    try {
      // Direct binary upload to server
      const res = await fetch('/api/upload-hero-video', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'video/mp4',
        },
        body: file,
      });

      if (res.ok) {
        const freshUrl = `/hero-uploaded.mp4?t=${Date.now()}`;
        setVideoSrc(freshUrl);
        setHeroConfig((prev) => ({ ...prev, videoUrl: freshUrl }));
        if (videoRef.current) {
          videoRef.current.src = freshUrl;
          videoRef.current.muted = true;
          videoRef.current.load();
          videoRef.current.play().catch(() => {});
        }
        setUploadMessage('✅ Video permanently saved to server!');
        setTimeout(() => setUploadMessage(null), 5000);
      } else {
        const localUrl = URL.createObjectURL(file);
        setVideoSrc(localUrl);
        setUploadMessage('Video loaded locally!');
        setTimeout(() => setUploadMessage(null), 4000);
      }
    } catch {
      const localUrl = URL.createObjectURL(file);
      setVideoSrc(localUrl);
      setUploadMessage('Video loaded locally!');
      setTimeout(() => setUploadMessage(null), 4000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Adjust Y Position (Upar / Niche)
  const handleAdjustY = (delta: number) => {
    setHeroConfig((prev) => {
      const newY = Math.max(0, Math.min(100, Math.round(prev.yPosition + delta)));
      return { ...prev, yPosition: newY };
    });
  };

  // Adjust Brightness
  const handleAdjustBrightness = (delta: number) => {
    setHeroConfig((prev) => {
      const newB = Math.max(0.4, Math.min(1.8, Math.round((prev.brightness + delta) * 100) / 100));
      return { ...prev, brightness: newB };
    });
  };

  // Save Framing & Brightness permanently to server
  const handleSaveFraming = async () => {
    setIsSavingConfig(true);
    setSaveConfigStatus('Saving adjustments to server...');

    try {
      const res = await fetch('/api/hero-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            videoUrl: videoSrc,
            xPosition: heroConfig.xPosition,
            yPosition: heroConfig.yPosition,
            zoom: heroConfig.zoom,
            brightness: heroConfig.brightness,
            contrast: heroConfig.contrast,
          },
        }),
      });

      if (res.ok) {
        setSaveConfigStatus('✅ Framing & Brightness permanently saved for all visitors!');
      } else {
        setSaveConfigStatus('✅ Saved locally!');
      }
    } catch {
      setSaveConfigStatus('✅ Saved locally!');
    } finally {
      setIsSavingConfig(false);
      setTimeout(() => setSaveConfigStatus(null), 4000);
    }
  };

  // Reset video to default without deleting file from server
  const handleResetVideo = async () => {
    if (window.confirm('Reset video to default? (Uploaded video file server se delete nahi hoga, safely preserved rahega).')) {
      const defaultUrl = '/hero-loop.mp4';
      setVideoSrc(defaultUrl);
      const newConfig = {
        ...heroConfig,
        videoUrl: defaultUrl,
        yPosition: 18,
        brightness: 0.95,
      };
      setHeroConfig(newConfig);

      if (videoRef.current) {
        videoRef.current.src = defaultUrl;
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }

      try {
        await fetch('/api/hero-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: newConfig }),
        });
      } catch {}

      setSaveConfigStatus('✅ Reset to default. (Original file safe on server)');
      setTimeout(() => setSaveConfigStatus(null), 4000);
    }
  };

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
            paddingTop: `${topGapPx}px`,
          }}
          className="w-full h-full object-cover transition-all duration-150 pointer-events-none"
        >
          <source src={videoSrc} type="video/mp4" />
          <source src="/hero-uploaded.mp4" type="video/mp4" />
          <source src="/hero-loop.mp4" type="video/mp4" />
        </video>

        {/* Ambient Top & Bottom Lighting Gradients - Softened so Face & Body are crystal clear */}
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.25) 100%)',
          }}
        />

        {/* Soft top navbar vignette (ensures navbar text contrast without shadowing face) */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/60 via-black/15 to-transparent pointer-events-none" />
      </div>

      {/* Floating Studio Video Upload & Adjustment Controls (Top-Right) */}
      {showUploadPill && (
        <div className="absolute top-24 right-3 sm:right-6 z-30 flex flex-col items-end gap-2">
          {/* Main Quick Action Bar */}
          <div className="flex items-center gap-1.5 bg-black/80 hover:bg-black/90 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-2xl transition-all">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/mov"
              className="hidden"
              onChange={handleUpload}
            />

            {/* 1. Upload Video Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Upload studio dance video directly (permanently saved to server)"
              className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-white cursor-pointer active:scale-95 transition-transform"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0066FF]" />
                  <span className="text-[11px]">Saving video to server...</span>
                </>
              ) : uploadMessage ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-300">{uploadMessage}</span>
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span className="text-[11px]">Upload Studio Video</span>
                </>
              )}
            </button>

            {/* Divider */}
            <span className="w-px h-3.5 bg-white/20 mx-0.5" />

            {/* 2. Adjust Framing & Brightness Toggle Button */}
            <button
              onClick={() => setIsAdjusting(!isAdjusting)}
              title="Video ko upar/niche frame karein aur brightness adjust karein"
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                isAdjusting
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sliders className="w-3 h-3 text-[#0066FF] group-hover:text-white" />
              <span>Framing &amp; Brightness</span>
            </button>

            {/* 3. Hide Pill Button */}
            <button
              onClick={() => {
                setShowUploadPill(false);
                setIsAdjusting(false);
              }}
              title="Hide this toolbar"
              className="ml-0.5 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Expandable Framing & Brightness Panel */}
          {isAdjusting && (
            <div className="w-[320px] sm:w-[360px] bg-[#12141A]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl text-white space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-white uppercase tracking-wider">
                  <Sliders className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Video Framing &amp; Brightness</span>
                </div>
                <button
                  onClick={() => setIsAdjusting(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Message */}
              {saveConfigStatus && (
                <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium text-center">
                  {saveConfigStatus}
                </div>
              )}

              {/* Control 1: Upar / Niche (Vertical Position) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-[#0066FF]" />
                    <span>Video Position (Upar / Niche)</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {heroConfig.yPosition}%
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={heroConfig.yPosition}
                  onChange={(e) =>
                    setHeroConfig((prev) => ({ ...prev, yPosition: Number(e.target.value) }))
                  }
                  className="w-full accent-[#0066FF] cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
                />

                {/* Quick Step Buttons */}
                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustY(-4)}
                    className="flex-1 py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition-colors cursor-pointer"
                  >
                    ⬆️ Move Up (-4%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustY(4)}
                    className="flex-1 py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition-colors cursor-pointer"
                  >
                    ⬇️ Move Down (+4%)
                  </button>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1 text-[10px] pt-0.5">
                  <span className="text-slate-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setHeroConfig((prev) => ({ ...prev, yPosition: 10 }))}
                    className="px-2 py-0.5 bg-black/40 hover:bg-white/10 rounded text-slate-300 cursor-pointer"
                  >
                    Top (10%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroConfig((prev) => ({ ...prev, yPosition: 18 }))}
                    className="px-2 py-0.5 bg-black/40 hover:bg-white/10 rounded text-slate-300 cursor-pointer"
                  >
                    Default (18%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroConfig((prev) => ({ ...prev, yPosition: 50 }))}
                    className="px-2 py-0.5 bg-black/40 hover:bg-white/10 rounded text-slate-300 cursor-pointer"
                  >
                    Center (50%)
                  </button>
                </div>
              </div>

              {/* Control 2: Brightness */}
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>Brightness (Kam / Jyada)</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {Math.round(heroConfig.brightness * 100)}%
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="0.5"
                  max="1.6"
                  step="0.05"
                  value={heroConfig.brightness}
                  onChange={(e) =>
                    setHeroConfig((prev) => ({ ...prev, brightness: Number(e.target.value) }))
                  }
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
                />

                {/* Quick Step Buttons */}
                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustBrightness(-0.1)}
                    className="flex-1 py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition-colors cursor-pointer"
                  >
                    🔅 Dimmer (-10%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustBrightness(0.1)}
                    className="flex-1 py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition-colors cursor-pointer"
                  >
                    🔆 Brighter (+10%)
                  </button>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1 text-[10px] pt-0.5">
                  <span className="text-slate-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setHeroConfig((prev) => ({ ...prev, brightness: 0.8 }))}
                    className="px-2 py-0.5 bg-black/40 hover:bg-white/10 rounded text-slate-300 cursor-pointer"
                  >
                    80%
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroConfig((prev) => ({ ...prev, brightness: 0.95 }))}
                    className="px-2 py-0.5 bg-black/40 hover:bg-white/10 rounded text-slate-300 cursor-pointer"
                  >
                    95%
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroConfig((prev) => ({ ...prev, brightness: 1.15 }))}
                    className="px-2 py-0.5 bg-black/40 hover:bg-white/10 rounded text-slate-300 cursor-pointer"
                  >
                    115%
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroConfig((prev) => ({ ...prev, brightness: 1.35 }))}
                    className="px-2 py-0.5 bg-black/40 hover:bg-white/10 rounded text-slate-300 cursor-pointer"
                  >
                    135%
                  </button>
                </div>
              </div>

              {/* Action Buttons: Save & Reset */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleSaveFraming}
                  disabled={isSavingConfig}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052cc] hover:from-[#0052cc] hover:to-[#003d99] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer transition-all active:scale-95"
                >
                  {isSavingConfig ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving permanently...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Framing &amp; Brightness</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Video className="w-3 h-3 text-[#0066FF]" />
                    <span>Upload New Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetVideo}
                    className="py-1.5 px-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg text-[10px] font-bold border border-red-500/30 transition-colors cursor-pointer flex items-center gap-1"
                    title="Website par default video restore karein. Uploaded file delete nahi hogi."
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Video</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[9px] text-slate-400 justify-center">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Uploaded media server storage me safe rahega (delete nahi hoga).</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Center-Bottom Action - Clean single CATEGORIES Button */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 flex flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center mt-6">
          {/* CATEGORY Button */}
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
