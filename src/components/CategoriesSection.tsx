import React, { useState, useEffect, useRef } from 'react';
import { CategoryItem, DEFAULT_CATEGORIES, loadCategories, saveCategories } from '../data/categoriesData';
import { Video, Upload, X, Check, Loader2, Trash2, Play, ChevronUp, ChevronDown, Sliders } from 'lucide-react';

interface CategoriesSectionProps {
  onSelectCategory: (categoryTitle: string) => void;
  categories?: CategoryItem[];
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  onSelectCategory,
  categories: propCategories,
}) => {
  const [internalCategories, setInternalCategories] = useState<CategoryItem[]>(() => {
    return propCategories && propCategories.length > 0 ? propCategories : loadCategories();
  });

  // Advance Category Video Modal state
  const [isChangeVideoOpen, setIsChangeVideoOpen] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoYPosition, setVideoYPosition] = useState<number>(50);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state if propCategories changes
  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setInternalCategories(propCategories);
    }
  }, [propCategories]);

  // Sync latest categories from server
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const filtered = data.filter(
            (c) => c.id !== 'home-service' && c.id !== 'job-person'
          );
          setInternalCategories(filtered);
          saveCategories(filtered);
        }
      })
      .catch(() => {});
  }, []);

  const displayCategories = internalCategories && internalCategories.length > 0
    ? internalCategories.filter((c) => c.id !== 'home-service' && c.id !== 'job-person')
    : DEFAULT_CATEGORIES;

  const advanceCategory = displayCategories.find((c) => c.id === 'advance');

  // Sync videoYPosition when advanceCategory is loaded
  useEffect(() => {
    if (advanceCategory?.videoYPosition !== undefined) {
      setVideoYPosition(advanceCategory.videoYPosition);
    }
  }, [advanceCategory?.videoYPosition]);

  const openChangeVideoModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentVid = advanceCategory?.videoUrl || '';
    setVideoUrlInput(currentVid);
    setVideoPreview(currentVid);
    setVideoYPosition(advanceCategory?.videoYPosition ?? 50);
    setUploadError(null);
    setSaveSuccess(false);
    setIsChangeVideoOpen(true);
  };

  const handleNudgeY = async (delta: number) => {
    const currentY = advanceCategory?.videoYPosition ?? 50;
    const newY = Math.max(0, Math.min(100, currentY + delta));
    setVideoYPosition(newY);

    const updated = internalCategories.map((c) =>
      c.id === 'advance' ? { ...c, videoYPosition: newY } : c
    );
    setInternalCategories(updated);
    saveCategories(updated);

    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updated }),
      });
    } catch {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video file (.mp4, .webm, .mov).');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Video file size exceeds the 50MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch(`/api/upload-media?name=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'video/mp4',
        },
        body: file,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to upload video');
      }

      const result = await response.json();
      if (result.url) {
        setVideoUrlInput(result.url);
        setVideoPreview(result.url);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveVideo = async (finalUrl: string, finalYPos = videoYPosition) => {
    const updated = internalCategories.map((c) => {
      if (c.id === 'advance') {
        const copy = { ...c, videoYPosition: finalYPos };
        if (finalUrl.trim()) {
          copy.videoUrl = finalUrl.trim();
        } else {
          delete copy.videoUrl;
        }
        return copy;
      }
      return c;
    });

    setInternalCategories(updated);
    saveCategories(updated);

    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updated }),
      });
    } catch {}

    setSaveSuccess(true);
    setTimeout(() => {
      setIsChangeVideoOpen(false);
      setSaveSuccess(false);
    }, 900);
  };

  const handleRemoveVideo = async () => {
    await handleSaveVideo('');
  };

  return (
    <section id="categories" className="relative bg-white text-neutral-900 overflow-hidden">
      {/* Main Categories Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16">
        
        {/* Section Header */}
        <div className="relative mb-8 sm:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-950 font-display tracking-tight uppercase">
            Categories
          </h2>
        </div>

        {/* Categories Grid (3 columns on desktop, Wedding centered in its row with same size) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {displayCategories.map((category: CategoryItem) => {
            const isWedding = category.id === 'wedding-choreography' || category.title.toLowerCase().includes('wedding');
            const isAdvance = category.id === 'advance';
            const yPos = category.videoYPosition ?? 50;

            return (
              <div
                key={category.id}
                onClick={() => onSelectCategory(category.title)}
                className={`group cursor-pointer flex flex-col select-none relative ${
                  isWedding
                    ? 'sm:col-span-2 sm:w-full sm:max-w-[420px] sm:mx-auto lg:col-span-1 lg:col-start-2 lg:max-w-none lg:mx-0'
                    : ''
                }`}
              >
                {/* Card Container: Identical size & aspect-ratio across all cards */}
                <div className="relative w-full aspect-[16/10.5] rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/90 shadow-xs transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-md group-hover:border-neutral-300">
                  {/* Option to change video & position ONLY for the selected Advance card */}
                  {isAdvance && (
                    <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5">
                      {/* Quick Up/Down Nudge Controls */}
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="flex items-center bg-black/75 backdrop-blur-md border border-white/25 rounded-xl overflow-hidden shadow-lg p-0.5"
                        title="Video position upar/niche karein"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNudgeY(-5);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-white hover:text-blue-400 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                          title="Move Up (Upar)"
                          aria-label="Move Up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold text-white/90 px-1 select-none font-mono">
                          {yPos}%
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNudgeY(5);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-white hover:text-blue-400 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                          title="Move Down (Niche)"
                          aria-label="Move Down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Change Video Button */}
                      <button
                        type="button"
                        onClick={openChangeVideoModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 text-white text-xs font-bold border border-white/25 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer group/btn"
                        title="Change Video / Adjust Position"
                        aria-label="Change Video"
                      >
                        <Video className="w-3.5 h-3.5 text-blue-400 group-hover/btn:rotate-12 transition-transform" />
                        <span>Change Video</span>
                      </button>
                    </div>
                  )}

                  {/* Media: Video if present, else Image (plays seamlessly without overlays) */}
                  {category.videoUrl ? (
                    <video
                      key={category.videoUrl}
                      src={category.videoUrl}
                      style={{ objectPosition: `50% ${yPos}%` }}
                      ref={(el) => {
                        if (el) {
                          el.muted = true;
                          el.defaultMuted = true;
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      onLoadedData={(e) => {
                        e.currentTarget.play().catch(() => {});
                      }}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-105 pointer-events-none"
                    />
                  ) : (
                    <img
                      src={category.imageUrl}
                      alt={category.title}
                      style={{ objectPosition: `50% ${yPos}%` }}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-105"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                {/* Single Bold Text Label Centered Directly Below Each Card */}
                <h3 className="mt-3 text-center font-bold text-neutral-950 text-sm sm:text-base md:text-lg tracking-tight group-hover:text-[#0066FF] transition-colors">
                  {category.title}
                </h3>
              </div>
            );
          })}
        </div>

      </div>

      {/* CHANGE VIDEO & POSITION MODAL (Exclusively for Advance Category) */}
      {isChangeVideoOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isUploading && setIsChangeVideoOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Change Video & Position — Advance
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Upload video, enter URL, aur video ko upar/niche adjust karein
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isUploading && setIsChangeVideoOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Preview Box with dynamic object-position */}
            <div className="my-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Live Preview
                </label>
                <span className="text-[11px] font-bold text-blue-600 font-mono">
                  Position: {videoYPosition}%
                </span>
              </div>
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner flex items-center justify-center">
                {videoPreview ? (
                  <video
                    key={videoPreview}
                    src={videoPreview}
                    style={{ objectPosition: `50% ${videoYPosition}%` }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-[object-position] duration-150"
                  />
                ) : advanceCategory?.imageUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={advanceCategory.imageUrl}
                      alt="Current preview"
                      style={{ objectPosition: `50% ${videoYPosition}%` }}
                      className="w-full h-full object-cover opacity-60 transition-[object-position] duration-150"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
                      <Play className="w-10 h-10 opacity-60 mb-1" />
                      <span className="text-xs font-bold bg-black/60 px-3 py-1 rounded-full">
                        No video set yet (showing static image)
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">No media available</span>
                )}
              </div>
            </div>

            {/* Vertical Position Control (Upar / Niche) */}
            <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Video Upar / Niche Adjust Karein</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setVideoYPosition(Math.max(0, videoYPosition - 5))}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                    title="5% Upar"
                  >
                    ▲ Upar (-5%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoYPosition(Math.min(100, videoYPosition + 5))}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                    title="5% Niche"
                  >
                    ▼ Niche (+5%)
                  </button>
                </div>
              </div>

              {/* Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Top (0%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={videoYPosition}
                  onChange={(e) => setVideoYPosition(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-[11px] font-bold text-slate-500 uppercase">Bottom (100%)</span>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {[
                  { label: 'Top', val: 0 },
                  { label: 'Upper', val: 25 },
                  { label: 'Center', val: 50 },
                  { label: 'Lower', val: 75 },
                  { label: 'Bottom', val: 100 }
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setVideoYPosition(preset.val)}
                    className={`py-1 text-[11px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                      videoYPosition === preset.val
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Option A: Upload Video File */}
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/60 hover:bg-blue-50 text-blue-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Uploading video (Max 50MB)...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>Click to Upload MP4 / WebM Video</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option B: Enter Video URL/Path */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Or Video URL / Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoUrlInput}
                    placeholder="e.g. /advance-dance.mp4 or https://..."
                    onChange={(e) => {
                      setVideoUrlInput(e.target.value);
                      setVideoPreview(e.target.value);
                    }}
                    className="flex-1 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setVideoPreview(videoUrlInput.trim())}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* Error Notification */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {uploadError}
                </div>
              )}

              {/* Success Notification */}
              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Changes saved successfully!</span>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                {advanceCategory?.videoUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    disabled={isUploading}
                    className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Video</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChangeVideoOpen(false)}
                    disabled={isUploading}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveVideo(videoUrlInput, videoYPosition)}
                    disabled={isUploading}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};
