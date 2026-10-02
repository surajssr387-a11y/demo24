import React, { useState, useRef } from 'react';
import { X, Check, Video, Upload, Link, Film, Play } from 'lucide-react';

interface ChangeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentVideoUrl: string;
  onSave: (newVideoUrl: string) => Promise<void> | void;
}

const PRESET_VIDEOS = [
  { label: 'Free Style Dance', url: '/choreography/choreo-freestyle.mp4' },
  { label: 'Kids Dance Routine', url: '/choreography/choreo-kids.mp4' },
  { label: 'Girls Choreography', url: '/choreography/choreo-ladies.mp4' },
  { label: 'Advance Hip-Hop', url: '/choreography/choreo-advance.mp4' },
  { label: 'Beginner Routine', url: '/choreography/choreo-senior.mp4' },
  { label: 'Private Class Routine', url: '/choreography/choreo-private.mp4' },
  { label: 'Hero Studio Video', url: '/hero-uploaded.mp4' },
];

export const ChangeVideoModal: React.FC<ChangeVideoModalProps> = ({
  isOpen,
  onClose,
  title,
  currentVideoUrl,
  onSave,
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(currentVideoUrl || '');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [showUrlField, setShowUrlField] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(`Uploading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

    // Immediate local object URL for preview
    const previewUrl = URL.createObjectURL(file);
    setSelectedUrl(previewUrl);

    try {
      const res = await fetch(`/api/upload-media?name=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'video/mp4',
          'x-filename': encodeURIComponent(file.name),
        },
        body: file,
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          setSelectedUrl(data.url);
          setStatusMessage('Video uploaded successfully!');
        }
      } else {
        setStatusMessage('Video loaded (ready to save)');
      }
    } catch {
      setStatusMessage('Video loaded (ready to save)');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setSelectedUrl(customUrl.trim());
    setStatusMessage('Custom video URL applied!');
    setShowUrlField(false);
  };

  const handleSave = async () => {
    if (!selectedUrl) return;
    setIsSaving(true);
    try {
      await onSave(selectedUrl);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (e) {
      console.error('Error saving video:', e);
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
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0066FF]/20 border border-[#0066FF]/40 flex items-center justify-center text-[#0066FF]">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Change Video
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[280px] sm:max-w-md">
                {title}
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

        {/* Action Controls */}
        <div className="mt-4 p-4 bg-[#14161E] border border-[#272A35] rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-[#0066FF]" />
              Choose New Video (Video Badle)
            </span>
            {statusMessage && (
              <span className="text-[11px] text-emerald-400 font-semibold truncate max-w-[220px]">
                {statusMessage}
              </span>
            )}
          </div>

          {/* Quick buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
              onClick={() => setShowUrlField(!showUrlField)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Link className="w-3.5 h-3.5 text-blue-400" />
              <span>Paste Video URL</span>
            </button>

            <div className="relative">
              <select
                value={PRESET_VIDEOS.some((p) => p.url === selectedUrl) ? selectedUrl : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedUrl(e.target.value);
                    setStatusMessage('Preset selected!');
                  }
                }}
                className="w-full h-full px-2.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer appearance-none"
              >
                <option value="" disabled className="bg-neutral-900 text-slate-400">
                  Select Preset Video...
                </option>
                {PRESET_VIDEOS.map((preset) => (
                  <option key={preset.url} value={preset.url} className="bg-neutral-900 text-white">
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paste URL Box */}
          {showUrlField && (
            <div className="flex items-center gap-2 pt-2 animate-in fade-in duration-150">
              <input
                type="text"
                placeholder="https://.../video.mp4 or /choreography/..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
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

        {/* Live Preview Card */}
        <div className="my-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-3 h-3 text-[#0066FF]" />
              Live Video Preview
            </span>
            <span className="text-[11px] text-slate-400 font-mono truncate max-w-[260px]">
              {selectedUrl || 'No video selected'}
            </span>
          </div>

          <div className="relative w-full aspect-[16/10.5] rounded-2xl overflow-hidden bg-neutral-950 border border-white/20 shadow-xl flex items-center justify-center">
            {selectedUrl ? (
              <video
                key={selectedUrl}
                src={selectedUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <p className="text-xs text-slate-500">No video selected</p>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
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
            disabled={isSaving || !selectedUrl}
            className="px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved Permanently!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Video'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
