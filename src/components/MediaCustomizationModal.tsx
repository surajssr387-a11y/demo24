import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  RotateCcw,
  Sliders,
  Sun,
  MoveHorizontal,
  MoveVertical,
  Video,
  Upload,
  Link,
  Film,
  Sparkles,
} from 'lucide-react';

export interface MediaCustomizationConfig {
  xPosition: number;
  yPosition: number;
  brightness: number;
  contrast?: number;
  mediaUrl?: string;
  title?: string;
}

interface MediaCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  initialConfig: MediaCustomizationConfig;
  onSave: (newConfig: MediaCustomizationConfig) => Promise<void> | void;
}

const STUDIO_VIDEO_PRESETS = [
  { label: 'Girls Choreography', url: '/choreography/choreo-ladies.mp4' },
  { label: 'Advance Hip-Hop', url: '/choreography/choreo-advance.mp4' },
  { label: 'Free Style Dance', url: '/choreography/choreo-freestyle.mp4' },
  { label: 'Kids Performance', url: '/choreography/choreo-kids.mp4' },
  { label: 'Beginner Routine', url: '/choreography/choreo-senior.mp4' },
  { label: 'Private Class Routine', url: '/choreography/choreo-private.mp4' },
  { label: 'Hero Studio Video', url: '/hero-uploaded.mp4' },
];

export const MediaCustomizationModal: React.FC<MediaCustomizationModalProps> = ({
  isOpen,
  onClose,
  title,
  mediaType,
  mediaUrl,
  initialConfig,
  onSave,
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>(mediaUrl);
  const [xPosition, setXPosition] = useState<number>(initialConfig.xPosition ?? 50);
  const [yPosition, setYPosition] = useState<number>(initialConfig.yPosition ?? 50);
  const [brightness, setBrightness] = useState<number>(initialConfig.brightness ?? 1.0);
  const [contrast, setContrast] = useState<number>(initialConfig.contrast ?? 1.04);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Video change & upload states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [customUrlValue, setCustomUrlValue] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever initialConfig changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentUrl(initialConfig.mediaUrl || mediaUrl);
      setXPosition(initialConfig.xPosition ?? 50);
      setYPosition(initialConfig.yPosition ?? (mediaType === 'video' ? 25 : 50));
      setBrightness(initialConfig.brightness ?? 1.0);
      setContrast(initialConfig.contrast ?? 1.04);
      setSaveSuccess(false);
      setUploadStatus(null);
      setShowUrlInput(false);
      setCustomUrlValue('');
    }
  }, [isOpen, initialConfig, mediaUrl, mediaType]);

  if (!isOpen) return null;

  const handleReset = () => {
    setCurrentUrl(mediaUrl);
    setXPosition(50);
    setYPosition(mediaType === 'video' ? 25 : 50);
    setBrightness(1.0);
    setContrast(1.04);
    setUploadStatus(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(`Uploading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

    // Immediate local object URL for instant preview
    const previewUrl = URL.createObjectURL(file);
    setCurrentUrl(previewUrl);

    try {
      const res = await fetch(`/api/upload-media?name=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
          'x-filename': encodeURIComponent(file.name),
        },
        body: file,
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          setCurrentUrl(data.url);
          setUploadStatus('Video uploaded & applied successfully!');
        }
      } else {
        setUploadStatus('Using local preview video (ready to save)');
      }
    } catch {
      // Fallback: preview URL is already playing
      setUploadStatus('Using local preview video (ready to save)');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlValue.trim()) return;
    setCurrentUrl(customUrlValue.trim());
    setUploadStatus('Video URL applied!');
    setShowUrlInput(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        xPosition,
        yPosition,
        brightness,
        contrast,
        mediaUrl: currentUrl,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to save customization:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[640px] bg-[#0E1015] border border-[#272A34] rounded-3xl p-5 sm:p-7 shadow-2xl text-white max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime,video/*' : 'image/*'}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0066FF]/20 border border-[#0066FF]/40 flex items-center justify-center text-[#0066FF]">
              {mediaType === 'video' ? <Video className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                {mediaType === 'video' ? 'Change Video & Customize Framing' : 'Customize Framing & Brightness'}
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[280px] sm:max-w-md">
                {title || 'Adjust video, left-right, upar-niche & brightness'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video / Media Source Selection (Change Video Options) */}
        {mediaType === 'video' && (
          <div className="mt-4 p-4 bg-[#14161E] border border-[#272A35] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-[#0066FF]" />
                Change Video Source (Video Badle)
              </span>
              {uploadStatus && (
                <span className="text-[10px] text-emerald-400 font-semibold truncate max-w-[240px]">
                  {uploadStatus}
                </span>
              )}
            </div>

            {/* Quick Action Buttons: Upload Video or Preset */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload Video File'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Link className="w-3.5 h-3.5 text-blue-400" />
                <span>Paste Video Link</span>
              </button>

              <div className="col-span-2 sm:col-span-1 relative">
                <select
                  value={STUDIO_VIDEO_PRESETS.some((p) => p.url === currentUrl) ? currentUrl : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setCurrentUrl(e.target.value);
                      setUploadStatus('Preset video selected!');
                    }
                  }}
                  className="w-full h-full px-2.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer appearance-none"
                >
                  <option value="" disabled className="bg-neutral-900 text-slate-400">
                    Choose Preset Routine...
                  </option>
                  {STUDIO_VIDEO_PRESETS.map((preset) => (
                    <option key={preset.url} value={preset.url} className="bg-neutral-900 text-white">
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Paste Video URL Bar */}
            {showUrlInput && (
              <div className="flex items-center gap-2 pt-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="https://.../dance-video.mp4 or /choreography/..."
                  value={customUrlValue}
                  onChange={(e) => setCustomUrlValue(e.target.value)}
                  className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0066FF]"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="px-3.5 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live Preview Card */}
        <div className="my-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
              Live Preview (Real-Time Playback)
            </span>
            <span className="text-[11px] text-[#0066FF] font-semibold">
              X: {xPosition}% • Y: {yPosition}% • Brightness: {Math.round(brightness * 100)}%
            </span>
          </div>

          <div className="relative w-full aspect-[16/10.5] rounded-2xl overflow-hidden bg-neutral-950 border-2 border-white/20 shadow-xl">
            {mediaType === 'video' ? (
              <video
                key={currentUrl}
                src={currentUrl}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  objectPosition: `${xPosition}% ${yPosition}%`,
                  filter: `brightness(${brightness}) contrast(${contrast})`,
                }}
                className="w-full h-full object-cover pointer-events-none"
              />
            ) : (
              <img
                key={currentUrl}
                src={currentUrl}
                alt={title || 'Preview'}
                style={{
                  objectPosition: `${xPosition}% ${yPosition}%`,
                  filter: `brightness(${brightness}) contrast(${contrast})`,
                }}
                className="w-full h-full object-cover pointer-events-none"
              />
            )}

            {/* Subtle guidelines overlay for easy framing */}
            <div className="absolute inset-0 pointer-events-none border border-white/10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF]/60" />
            </div>
          </div>
        </div>

        {/* Customization Sliders */}
        <div className="space-y-4 bg-[#14161E] border border-[#272A35] rounded-2xl p-4 sm:p-5">
          {/* 1. Left - Right (X-Position) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <MoveHorizontal className="w-3.5 h-3.5 text-[#0066FF]" />
                Left / Right (Horizontal X)
              </span>
              <span className="font-mono font-bold text-[#0066FF] bg-[#0066FF]/10 px-2 py-0.5 rounded-md">
                {xPosition}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={xPosition}
              onChange={(e) => setXPosition(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0066FF]"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
              <span>0% (Left)</span>
              <button
                type="button"
                onClick={() => setXPosition(50)}
                className="hover:text-white transition-colors underline cursor-pointer"
              >
                Center (50%)
              </button>
              <span>100% (Right)</span>
            </div>
          </div>

          {/* 2. Upar - Niche (Y-Position) */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <MoveVertical className="w-3.5 h-3.5 text-emerald-400" />
                Upar / Niche (Vertical Y)
              </span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                {yPosition}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={yPosition}
              onChange={(e) => setYPosition(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
              <span>0% (Top)</span>
              <button
                type="button"
                onClick={() => setYPosition(50)}
                className="hover:text-white transition-colors underline cursor-pointer"
              >
                Center (50%)
              </button>
              <span>100% (Bottom)</span>
            </div>
          </div>

          {/* 3. Brightness */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Brightness (Chamak)
              </span>
              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                {Math.round(brightness * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.02}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
              <span>50% (Darker)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBrightness(1.0)}
                  className="hover:text-white transition-colors underline cursor-pointer"
                >
                  Normal (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setBrightness(1.15)}
                  className="hover:text-white transition-colors underline cursor-pointer"
                >
                  +15% (115%)
                </button>
              </div>
              <span>200% (Brightest)</span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
