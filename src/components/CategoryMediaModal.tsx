import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Video,
  Image as ImageIcon,
  RotateCcw,
  Check,
  Loader2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
} from 'lucide-react';
import { CategoryItem } from '../data/categoriesData';

interface CategoryMediaModalProps {
  isOpen: boolean;
  category: CategoryItem | null;
  onClose: () => void;
  onSave: (updatedCategory: CategoryItem) => void;
}

export const CategoryMediaModal: React.FC<CategoryMediaModalProps> = ({
  isOpen,
  category,
  onClose,
  onSave,
}) => {
  const [mediaType, setMediaType] = useState<'video' | 'image'>(
    category?.videoUrl ? 'video' : 'image'
  );

  // Video states
  const [videoUrl, setVideoUrl] = useState(category?.videoUrl || '');
  const [videoXPos, setVideoXPos] = useState(category?.videoXPosition ?? 50);
  const [videoYPos, setVideoYPos] = useState(category?.videoYPosition ?? 50);
  const [videoZoom, setVideoZoom] = useState(category?.videoZoom ?? 1);

  // Image states
  const [imageUrl, setImageUrl] = useState(category?.imageUrl || '');
  const [imageXPos, setImageXPos] = useState(category?.imageXPosition ?? 50);
  const [imageYPos, setImageYPos] = useState(category?.imageYPosition ?? 50);
  const [imageZoom, setImageZoom] = useState(category?.imageZoom ?? 1);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when category changes
  useEffect(() => {
    if (category) {
      setMediaType(category.videoUrl ? 'video' : 'image');
      setVideoUrl(category.videoUrl || '');
      setVideoXPos(category.videoXPosition ?? 50);
      setVideoYPos(category.videoYPosition ?? 50);
      setVideoZoom(category.videoZoom ?? 1);

      setImageUrl(category.imageUrl || '');
      setImageXPos(category.imageXPosition ?? 50);
      setImageYPos(category.imageYPosition ?? 50);
      setImageZoom(category.imageZoom ?? 1);
      setUploadError(null);
      setUploadSuccess(null);
    }
  }, [category]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const isVideo =
      file.type.startsWith('video/') ||
      ['.mp4', '.mov', '.webm'].some((ext) => file.name.toLowerCase().endsWith(ext));

    // Instant local preview
    const localPreviewUrl = URL.createObjectURL(file);
    if (isVideo) {
      setVideoUrl(localPreviewUrl);
      setMediaType('video');
    } else {
      setImageUrl(localPreviewUrl);
      setMediaType('image');
    }

    try {
      let uploadBlob: Blob = file;
      let uploadFilename = file.name;

      // If it's an image, convert to standard JPEG via canvas for 100% universal compatibility
      if (!isVideo) {
        try {
          const prepared = await new Promise<{ blob: Blob; filename: string }>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const maxDim = 1920;
              let width = img.width;
              let height = img.height;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                  (b) => {
                    if (b) {
                      const cleanBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
                      resolve({ blob: b, filename: `${cleanBase || 'photo'}.jpg` });
                    } else {
                      resolve({ blob: file, filename: file.name });
                    }
                  },
                  'image/jpeg',
                  0.92
                );
              } else {
                resolve({ blob: file, filename: file.name });
              }
            };
            img.onerror = () => resolve({ blob: file, filename: file.name });
            img.src = localPreviewUrl;
          });
          uploadBlob = prepared.blob;
          uploadFilename = prepared.filename;
        } catch {
          // fallback to raw file
        }
      }

      const response = await fetch(
        `/api/upload-media?name=${encodeURIComponent(uploadFilename)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': uploadBlob.type || 'application/octet-stream',
          },
          body: uploadBlob,
        }
      );

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to upload media');
      }

      const uploadedUrl = data.url;

      if (isVideo) {
        setVideoUrl(uploadedUrl);
        setMediaType('video');
        setUploadSuccess('Video uploaded! Click "Save Customization" below to keep changes.');
      } else {
        setImageUrl(uploadedUrl);
        setMediaType('image');
        setUploadSuccess('Photo uploaded! Click "Save Customization" below to keep changes.');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Upload error. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const nudge = (direction: 'up' | 'down' | 'left' | 'right', amount = 5) => {
    if (mediaType === 'video') {
      if (direction === 'left') setVideoXPos((prev) => Math.max(0, prev - amount));
      if (direction === 'right') setVideoXPos((prev) => Math.min(100, prev + amount));
      if (direction === 'up') setVideoYPos((prev) => Math.max(0, prev - amount));
      if (direction === 'down') setVideoYPos((prev) => Math.min(100, prev + amount));
    } else {
      if (direction === 'left') setImageXPos((prev) => Math.max(0, prev - amount));
      if (direction === 'right') setImageXPos((prev) => Math.min(100, prev + amount));
      if (direction === 'up') setImageYPos((prev) => Math.max(0, prev - amount));
      if (direction === 'down') setImageYPos((prev) => Math.min(100, prev + amount));
    }
  };

  const handleResetPosition = () => {
    if (mediaType === 'video') {
      setVideoXPos(50);
      setVideoYPos(50);
      setVideoZoom(1);
    } else {
      setImageXPos(50);
      setImageYPos(50);
      setImageZoom(1);
    }
  };

  const handleSave = async () => {
    if (!category) return;
    setIsSaving(true);
    const updated: CategoryItem = {
      ...category,
      imageUrl: imageUrl.trim() || category.imageUrl,
      videoUrl: mediaType === 'video' && videoUrl.trim() ? videoUrl.trim() : undefined,
      videoXPosition: videoXPos,
      videoYPosition: videoYPos,
      videoZoom: videoZoom,
      imageXPosition: imageXPos,
      imageYPosition: imageYPos,
      imageZoom: imageZoom,
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSave(updated);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !category) return null;

  const currentX = mediaType === 'video' ? videoXPos : imageXPos;
  const currentY = mediaType === 'video' ? videoYPos : imageYPos;
  const currentZoom = mediaType === 'video' ? videoZoom : imageZoom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl text-white overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Customize Media</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0066FF]/20 text-[#3385ff] font-semibold">
                {category.title}
              </span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Change video or photo and adjust Left / Right / Up / Down framing in real-time
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
          
          {/* Media Mode Tabs: Video vs Image */}
          <div className="flex items-center gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setMediaType('video')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mediaType === 'video'
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video Component</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType('image')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mediaType === 'image'
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Photo Component</span>
            </button>
          </div>

          {/* Live Real-Time Preview Box (Identical 16/10.5 Aspect Ratio) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
              <span>Live Card Preview</span>
              <span>
                X: <strong className="text-white">{currentX}%</strong> | Y:{' '}
                <strong className="text-white">{currentY}%</strong> | Zoom:{' '}
                <strong className="text-white">{currentZoom.toFixed(2)}x</strong>
              </span>
            </div>

            <div className="relative w-full aspect-[16/10.5] rounded-xl overflow-hidden bg-black border border-neutral-700/80 shadow-inner flex items-center justify-center group">
              {mediaType === 'video' && videoUrl ? (
                <video
                  key={`${videoUrl}-${videoXPos}-${videoYPos}-${videoZoom}`}
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    objectPosition: `${videoXPos}% ${videoYPos}%`,
                    transform: `scale(${videoZoom})`,
                  }}
                  className="w-full h-full object-cover transition-all duration-75"
                />
              ) : (
                <img
                  src={imageUrl || '/kids-dance.jpg'}
                  alt={category.title}
                  style={{
                    objectPosition: `${imageXPos}% ${imageYPos}%`,
                    transform: `scale(${imageZoom})`,
                  }}
                  className="w-full h-full object-cover transition-all duration-75"
                />
              )}

              {/* Crosshair Guide Lines Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20 border border-white/20">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40 -translate-y-1/2" />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/40 -translate-x-1/2" />
              </div>
            </div>
          </div>

          {/* Upload & Source Controls */}
          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-200 block">
                  {mediaType === 'video' ? 'Upload New Video' : 'Upload New Photo'}
                </label>
                <p className="text-[11px] text-neutral-400">
                  {mediaType === 'video'
                    ? 'MP4, MOV, WebM formats supported (up to 50MB)'
                    : 'JPG, PNG, WebP formats supported'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white border border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0066FF]" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>{mediaType === 'video' ? 'Choose Video' : 'Choose Photo'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                {uploadError}
              </p>
            )}

            {uploadSuccess && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span>{uploadSuccess}</span>
              </p>
            )}

            {/* Direct URL Input fallback */}
            <div className="pt-2 border-t border-neutral-800/80">
              <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                Or enter direct URL:
              </label>
              <input
                type="text"
                value={mediaType === 'video' ? videoUrl : imageUrl}
                onChange={(e) => {
                  if (mediaType === 'video') setVideoUrl(e.target.value);
                  else setImageUrl(e.target.value);
                }}
                placeholder={mediaType === 'video' ? '/uploads/... or https://...' : '/photo.jpg or https://...'}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#0066FF]"
              />
            </div>
          </div>

          {/* Positioning & Framing Adjustment Controls (Left, Right, Up, Down, Zoom) */}
          <div className="p-4 bg-neutral-950/70 rounded-xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Position &amp; Alignment Adjuster
              </h4>
              <button
                type="button"
                onClick={handleResetPosition}
                className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset (50% / 50%)</span>
              </button>
            </div>

            {/* Quick D-Pad Nudge Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
              <span className="text-xs text-neutral-300 font-medium">
                Directional Controls:
              </span>
              <div className="grid grid-cols-3 gap-1.5 w-32">
                <div />
                <button
                  type="button"
                  title="Move Up"
                  onClick={() => nudge('up')}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 active:bg-[#0066FF] rounded-md flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <div />
                <button
                  type="button"
                  title="Move Left"
                  onClick={() => nudge('left')}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 active:bg-[#0066FF] rounded-md flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-center text-[10px] text-neutral-500 font-bold">
                  MOVE
                </div>
                <button
                  type="button"
                  title="Move Right"
                  onClick={() => nudge('right')}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 active:bg-[#0066FF] rounded-md flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div />
                <button
                  type="button"
                  title="Move Down"
                  onClick={() => nudge('down')}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 active:bg-[#0066FF] rounded-md flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <div />
              </div>
            </div>

            {/* Precision Range Sliders */}
            <div className="space-y-3">
              {/* Left / Right (X-Position) Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Horizontal (Left ↔ Right):</span>
                  <span className="font-bold text-[#0066FF]">{currentX}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={currentX}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (mediaType === 'video') setVideoXPos(val);
                    else setImageXPos(val);
                  }}
                  className="w-full accent-[#0066FF] cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>0% (Left)</span>
                  <span>50% (Center)</span>
                  <span>100% (Right)</span>
                </div>
              </div>

              {/* Up / Down (Y-Position) Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Vertical (Up ↕ Down):</span>
                  <span className="font-bold text-[#0066FF]">{currentY}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={currentY}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (mediaType === 'video') setVideoYPos(val);
                    else setImageYPos(val);
                  }}
                  className="w-full accent-[#0066FF] cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>0% (Top / Up)</span>
                  <span>50% (Center)</span>
                  <span>100% (Bottom / Down)</span>
                </div>
              </div>

              {/* Zoom / Scale Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Zoom / Scale:</span>
                  </span>
                  <span className="font-bold text-[#0066FF]">{currentZoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={currentZoom}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (mediaType === 'video') setVideoZoom(val);
                    else setImageZoom(val);
                  }}
                  className="w-full accent-[#0066FF] cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>1.0x (Standard)</span>
                  <span>1.75x</span>
                  <span>2.5x (Close-up)</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-neutral-800 bg-neutral-950/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || isUploading}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Customization</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
