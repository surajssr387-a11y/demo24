import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw, Sliders, Sun, MoveHorizontal, MoveVertical } from 'lucide-react';

export interface MediaCustomizationConfig {
  xPosition: number;
  yPosition: number;
  brightness: number;
  contrast?: number;
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

export const MediaCustomizationModal: React.FC<MediaCustomizationModalProps> = ({
  isOpen,
  onClose,
  title,
  mediaType,
  mediaUrl,
  initialConfig,
  onSave,
}) => {
  const [xPosition, setXPosition] = useState<number>(initialConfig.xPosition ?? 50);
  const [yPosition, setYPosition] = useState<number>(initialConfig.yPosition ?? 50);
  const [brightness, setBrightness] = useState<number>(initialConfig.brightness ?? 1.0);
  const [contrast, setContrast] = useState<number>(initialConfig.contrast ?? 1.04);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync state whenever initialConfig changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setXPosition(initialConfig.xPosition ?? 50);
      setYPosition(initialConfig.yPosition ?? 50);
      setBrightness(initialConfig.brightness ?? 1.0);
      setContrast(initialConfig.contrast ?? 1.04);
      setSaveSuccess(false);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleReset = () => {
    setXPosition(50);
    setYPosition(mediaType === 'video' ? 25 : 50);
    setBrightness(1.0);
    setContrast(1.04);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        xPosition,
        yPosition,
        brightness,
        contrast,
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
        className="relative w-full max-w-[620px] bg-[#0E1015] border border-[#272A34] rounded-3xl p-5 sm:p-7 shadow-2xl text-white max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0066FF]/20 border border-[#0066FF]/40 flex items-center justify-center text-[#0066FF]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Customize Framing &amp; Brightness
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[280px] sm:max-w-md">
                {title || 'Adjust left-right, upar-niche &amp; brightness'}
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

        {/* Live Preview Card */}
        <div className="my-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Live Preview
            </span>
            <span className="text-[11px] text-[#0066FF] font-semibold">
              X: {xPosition}% • Y: {yPosition}% • Brightness: {Math.round(brightness * 100)}%
            </span>
          </div>

          <div className="relative w-full aspect-[16/10.5] rounded-2xl overflow-hidden bg-neutral-950 border-2 border-white/20 shadow-xl">
            {mediaType === 'video' ? (
              <video
                src={mediaUrl}
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
                src={mediaUrl}
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
