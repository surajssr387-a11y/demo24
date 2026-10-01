import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Maximize2,
  X,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Check,
  Upload,
  Loader2,
  Sliders,
  Video as VideoIcon,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';
import { getActiveAdminPin } from '../utils/adminAuth';

export interface AchievementMediaItem {
  id: string;
  type: 'video' | 'photo';
  title: string;
  imageUrl: string;
  videoUrl?: string;
  badge?: string;
}

const DEFAULT_ACHIEVEMENTS: AchievementMediaItem[] = [
  // 3 Verified Video Achievements
  {
    id: 'vid-1',
    type: 'video',
    title: 'Dance India Dance (DID)',
    imageUrl: '/uploads/ChatGPT_Image_Oct_1__2026__12_20_07_AM_1790832662761.png',
    videoUrl: '/uploads/AQMLI2bJ6sMnShrOsIXMemd0-Pa6H_bEdh1Hn8GohDymPSyADekWeiuzp9OG3XzSqlEFRrwZ4mZ64H2wLNI4732DuvsDVxu1d61cwOA_1790832621594.mp4',
    badge: 'Video',
  },
  {
    id: 'vid-2',
    type: 'video',
    title: "India's Got Talent (IGT)",
    imageUrl: '/uploads/ChatGPT_Image_Oct_1__2026__12_14_05_AM_1790832699160.png',
    videoUrl: '/uploads/AQOvR-9lYfKHjUTkTX_8OBJqJMXac3XLVryccYXgsrDqJ84PQ2A2GR2c8DkOAMcWI296NN4YG1b3zwTRcM5wMO0wmr0fSnlpwl6Z_W4_1790832731422.mp4',
    badge: 'Video',
  },
  {
    id: 'vid-3',
    type: 'video',
    title: 'Bollywood Movies Choreography',
    imageUrl: '/uploads/IMG_2823_1790832800063.png',
    videoUrl: '/uploads/AQPw_TA4RspIi0vv7UJ0YyDZYBTNbTuB6NXmB1-G9StG7rvbMIh7qfUmHZMkjsFWndozRe_MXizIzbFC2jyNK6gR3anNqGQsrK1mLLg_1790832872884.mp4',
    badge: 'Video',
  },

  // 2nd Row: 3 Photos
  {
    id: 'img-1',
    type: 'photo',
    title: '',
    imageUrl: '/ramy/ramy-igt.jpg',
  },
  {
    id: 'img-2',
    type: 'photo',
    title: '',
    imageUrl: '/uploads/Bollywood_Achievements_Magazine_Collage_1790834031148.png',
  },
  {
    id: 'img-3',
    type: 'photo',
    title: '',
    imageUrl: '/uploads/IMG_2823_1790832912853.png',
  },

  // 3rd Row: 3 Photos
  {
    id: 'img-4',
    type: 'photo',
    title: '',
    imageUrl: '/uploads/IMG_2824_1790832930233.png',
  },
  {
    id: 'img-5',
    type: 'photo',
    title: '',
    imageUrl: '/uploads/IMG_5596_1790832961808.png',
  },
  {
    id: 'img-6',
    type: 'photo',
    title: '',
    imageUrl: '/uploads/IMG_5939_1790834073058.jpg',
  },
];

const CUSTOMIZE_BTN_STORAGE_KEY = 'ramy_achievements_show_customize_btn';

export const AchievementsSection: React.FC = () => {
  const [items, setItems] = useState<AchievementMediaItem[]>(DEFAULT_ACHIEVEMENTS);
  const [activeVideo, setActiveVideo] = useState<AchievementMediaItem | null>(null);
  const [activePhoto, setActivePhoto] = useState<AchievementMediaItem | null>(null);

  // Customization controls - defaulted to TRUE so user can immediately customize & upload photos
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [showCustomizeButton, setShowCustomizeButton] = useState<boolean>(false);

  // Modal editor state
  const [editingItem, setEditingItem] = useState<AchievementMediaItem | null>(null);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);

  // Form inputs
  const [formType, setFormType] = useState<'video' | 'photo'>('photo');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formVideoUrl, setFormVideoUrl] = useState<string>('');
  const [formBadge, setFormBadge] = useState<string>('Video');

  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Direct card upload ref & state
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const targetCardIdRef = useRef<string | null>(null);

  // Quick new photo file input ref
  const quickNewPhotoInputRef = useRef<HTMLInputElement>(null);

  // Modal file input refs
  const modalImageFileInputRef = useRef<HTMLInputElement>(null);
  const modalVideoFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch live achievements from server on mount
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

  // Save to server helper with admin authentication & persistent disk storage
  const saveAchievementsToServer = async (newItems: AchievementMediaItem[]) => {
    setItems(newItems);
    try {
      const pin = getActiveAdminPin();
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievements: newItems, adminPin: pin }),
      });
      if (res.ok) {
        showToast('Achievements permanently updated on server!');
      } else {
        showToast('Saved locally');
      }
    } catch {
      showToast('Saved locally');
    }
  };

  const showToast = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // Toggle hiding the customize button (hide/unhide)
  const toggleCustomizeButtonVisibility = (visible: boolean) => {
    setShowCustomizeButton(visible);
    if (!visible) {
      setIsCustomizing(false);
    }
    try {
      localStorage.setItem(CUSTOMIZE_BTN_STORAGE_KEY, visible ? 'true' : 'false');
    } catch {}
    showToast(visible ? 'Customization button visible' : 'Customization button hidden');
  };

  // Direct quick upload for a new photo (one-click upload & add)
  const handleQuickNewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    showToast(`Uploading ${file.name}...`);

    const safeAsciiName = (file.name || 'photo.jpg').replace(/[^\x00-\x7F]/g, '_');
    const encodedName = encodeURIComponent(file.name || 'photo.jpg');

    try {
      const res = await fetch(`/api/upload-media?name=${encodedName}`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'image/jpeg',
          'x-filename': safeAsciiName,
        },
        body: file,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          const newPhotoItem: AchievementMediaItem = {
            id: 'img-' + Date.now(),
            type: 'photo',
            title: '',
            imageUrl: data.url,
          };
          const updated = [...items, newPhotoItem];
          await saveAchievementsToServer(updated);
          showToast('✅ New photo uploaded and permanently saved!');
        }
      } else {
        showToast('Upload failed. Please try again.');
      }
    } catch {
      showToast('Upload error. Please retry.');
    } finally {
      setIsUploadingMedia(false);
      if (e.target) e.target.value = '';
    }
  };

  // Direct replace photo on a specific card
  const handleCardReplacePhotoClick = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    targetCardIdRef.current = itemId;
    cardFileInputRef.current?.click();
  };

  const handleCardFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = targetCardIdRef.current;
    if (!file || !targetId) return;

    const targetItem = items.find((it) => it.id === targetId);
    const oldImageUrl = targetItem?.imageUrl || '';

    setUploadingCardId(targetId);
    showToast(`Uploading photo for card...`);

    const safeAsciiName = (file.name || 'photo.jpg').replace(/[^\x00-\x7F]/g, '_');
    const encodedName = encodeURIComponent(file.name || 'photo.jpg');

    try {
      const res = await fetch(`/api/upload-media?name=${encodedName}`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'image/jpeg',
          'x-filename': safeAsciiName,
          'x-replace-url': oldImageUrl,
        },
        body: file,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          const updated = items.map((it) => {
            if (it.id === targetId) {
              return {
                ...it,
                imageUrl: data.url,
              };
            }
            return it;
          });
          await saveAchievementsToServer(updated);
          showToast('✅ Photo replaced & purana photo delete kar diya!');
        }
      } else {
        showToast('Upload failed. Please retry.');
      }
    } catch {
      showToast('Upload error. Please try again.');
    } finally {
      setUploadingCardId(null);
      targetCardIdRef.current = null;
      if (e.target) e.target.value = '';
    }
  };

  // Open modal to add
  const handleOpenAdd = () => {
    setIsAddMode(true);
    setEditingItem(null);
    setFormType('photo');
    setFormTitle('');
    setFormImageUrl('');
    setFormVideoUrl('');
    setFormBadge('Video');
  };

  // Open modal to edit
  const handleOpenEdit = (item: AchievementMediaItem) => {
    setIsAddMode(false);
    setEditingItem(item);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormImageUrl(item.imageUrl || '');
    setFormVideoUrl(item.videoUrl || '');
    setFormBadge(item.badge || 'Video');
  };

  // Close modal
  const handleCloseModal = () => {
    setEditingItem(null);
    setIsAddMode(false);
    setUploadStatus(null);
  };

  // Handle uploading media in modal
  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isVideoFile: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const oldReplaceUrl = isVideoFile
      ? (formVideoUrl || editingItem?.videoUrl || '')
      : (formImageUrl || editingItem?.imageUrl || '');

    setIsUploadingMedia(true);
    setUploadStatus(`Uploading ${file.name} to server...`);

    const safeAsciiName = (file.name || (isVideoFile ? 'video.mp4' : 'photo.jpg')).replace(/[^\x00-\x7F]/g, '_');
    const encodedName = encodeURIComponent(file.name || (isVideoFile ? 'video.mp4' : 'photo.jpg'));

    try {
      const res = await fetch(`/api/upload-media?name=${encodedName}`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || (isVideoFile ? 'video/mp4' : 'image/jpeg'),
          'x-filename': safeAsciiName,
          'x-replace-url': oldReplaceUrl,
        },
        body: file,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          if (isVideoFile) {
            setFormVideoUrl(data.url);
            setUploadStatus('✅ Video uploaded & old file deleted!');
            if (!formImageUrl) {
              setFormImageUrl('/official-banner.jpg');
            }
          } else {
            setFormImageUrl(data.url);
            setUploadStatus('✅ Photo uploaded & old file deleted!');
          }
        }
      } else {
        setUploadStatus('Upload failed. Please try again.');
      }
    } catch {
      setUploadStatus('Upload error. Please retry.');
    } finally {
      setIsUploadingMedia(false);
      setTimeout(() => setUploadStatus(null), 4000);
      if (e.target) e.target.value = '';
    }
  };

  // Submit add or edit form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Title is required only for videos; photos can have empty or custom title
    if (formType === 'video' && !formTitle.trim()) {
      alert('Please enter a title for the video achievement');
      return;
    }

    if (!formImageUrl.trim() && formType === 'photo') {
      alert('Please upload a photo or enter an image URL');
      return;
    }

    if (isAddMode) {
      const newItem: AchievementMediaItem = {
        id: (formType === 'video' ? 'vid-' : 'img-') + Date.now(),
        type: formType,
        title: formTitle.trim(),
        imageUrl: formImageUrl.trim() || '/official-banner.jpg',
        videoUrl: formType === 'video' ? formVideoUrl.trim() : undefined,
        badge: formType === 'video' ? (formBadge.trim() || 'Video') : undefined,
      };
      const updated = [...items, newItem];
      await saveAchievementsToServer(updated);
    } else if (editingItem) {
      // If photo or video was changed, clean up previous one
      if (editingItem.imageUrl && editingItem.imageUrl !== formImageUrl.trim()) {
        fetch('/api/delete-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: editingItem.imageUrl }),
        }).catch(() => {});
      }
      if (editingItem.videoUrl && editingItem.videoUrl !== formVideoUrl.trim()) {
        fetch('/api/delete-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: editingItem.videoUrl }),
        }).catch(() => {});
      }

      const updated = items.map((it) => {
        if (it.id === editingItem.id) {
          return {
            ...it,
            type: formType,
            title: formTitle.trim(),
            imageUrl: formImageUrl.trim(),
            videoUrl: formType === 'video' ? formVideoUrl.trim() : undefined,
            badge: formType === 'video' ? (formBadge.trim() || 'Video') : undefined,
          };
        }
        return it;
      });
      await saveAchievementsToServer(updated);
    }

    handleCloseModal();
  };

  // Delete item and its media files
  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemToDelete = items.find((it) => it.id === id);
    if (window.confirm('Are you sure you want to delete this achievement?')) {
      if (itemToDelete) {
        if (itemToDelete.imageUrl) {
          fetch('/api/delete-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUrl: itemToDelete.imageUrl }),
          }).catch(() => {});
        }
        if (itemToDelete.videoUrl) {
          fetch('/api/delete-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUrl: itemToDelete.videoUrl }),
          }).catch(() => {});
        }
      }
      const updated = items.filter((it) => it.id !== id);
      await saveAchievementsToServer(updated);
    }
  };

  // Move item position
  const handleMove = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const newItems = [...items];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;

    await saveAchievementsToServer(newItems);
  };

  const handleCardClick = (item: AchievementMediaItem) => {
    if (isCustomizing) {
      handleOpenEdit(item);
      return;
    }
    if (item.type === 'video') {
      setActiveVideo(item);
    } else {
      setActivePhoto(item);
    }
  };

  return (
    <section id="achievements" className="relative bg-white text-neutral-900 overflow-hidden py-10 sm:py-14 md:py-16 border-t border-neutral-100">
      {/* Hidden file inputs for direct card replace & quick new photo */}
      <input
        ref={cardFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCardFileInputChange}
      />
      <input
        ref={quickNewPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleQuickNewPhotoUpload}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Toast status alert */}
        {statusNotification && (
          <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2 text-xs font-semibold">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{statusNotification}</span>
          </div>
        )}

        {/* Section Header */}
        <div className="relative mb-6 sm:mb-10 flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 relative">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-950 font-display tracking-tight uppercase text-center cursor-default select-none">
              Achievements
            </h2>
          </div>
        </div>

        {/* Customization Banner (Active Mode) */}
        {isCustomizing && (
          <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-white to-blue-50 border-2 border-blue-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#0066FF] animate-pulse shrink-0" />
              <div>
                <h4 className="text-sm font-extrabold text-neutral-950 flex items-center gap-1.5">
                  <span>Photo &amp; Video Customization Mode</span>
                  <span className="text-[11px] font-semibold text-[#0066FF] bg-blue-100 px-2 py-0.5 rounded-full">
                    Permanent Server Storage
                  </span>
                </h4>
                <p className="text-xs text-neutral-600">
                  Tap &quot;Change Photo&quot; on any card to replace it instantly, or click &quot;+ Add New&quot; below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => quickNewPhotoInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-[#0066FF] hover:bg-[#0052cc] text-white px-4 py-2 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>+ Upload Photo</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 bg-neutral-900 hover:bg-black text-white px-3.5 py-2 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom / Video</span>
              </button>

              <button
                onClick={() => setIsCustomizing(false)}
                className="flex items-center gap-1 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        )}

        {/* 3x3 Grid Form (3 columns x 3 rows or responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {items.map((item, index) => {
            const isVideo = item.type === 'video';
            const isThisCardUploading = uploadingCardId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="group cursor-pointer flex flex-col select-none relative"
              >
                {/* Card Container (Clean, rounded-2xl, 16/10.5 aspect ratio) */}
                <div className="relative w-full aspect-[16/10.5] rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/90 shadow-xs transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-md group-hover:border-neutral-300">
                  <img
                    src={item.imageUrl}
                    alt={item.title || 'Achievement Photo'}
                    className="w-full h-full object-cover object-center transition-all duration-300 group-hover:brightness-105"
                    loading="lazy"
                  />

                  {/* Dark gradient overlay for videos to highlight play icon */}
                  {isVideo && (
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-white translate-x-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Photo Hover Zoom Icon */}
                  {!isVideo && !isCustomizing && (
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  )}

                  {/* Top Video Badge */}
                  {isVideo && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/75 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span>{item.badge || 'VIDEO'}</span>
                      </span>
                    </div>
                  )}

                  {/* Loading spinner while uploading a photo for this card */}
                  {isThisCardUploading && (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white gap-2 z-20">
                      <Loader2 className="w-7 h-7 animate-spin text-[#0066FF]" />
                      <span className="text-xs font-bold">Uploading &amp; Saving...</span>
                    </div>
                  )}

                  {/* Customization Controls Overlay on Each Card */}
                  {isCustomizing && !isThisCardUploading && (
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col justify-between p-3 animate-in fade-in duration-150">
                      {/* Top Bar: Reorder arrows & actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleMove(index, 'up', e)}
                            disabled={index === 0}
                            title="Move left/up"
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleMove(index, 'down', e)}
                            disabled={index === items.length - 1}
                            title="Move right/down"
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(item);
                            }}
                            title="Edit details"
                            className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-md"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            title="Delete this item"
                            className="p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer shadow-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Center Direct Photo Upload Button */}
                      <div className="flex flex-col items-center justify-center gap-1">
                        <button
                          onClick={(e) => handleCardReplacePhotoClick(item.id, e)}
                          title="Click to choose a photo from your phone or PC and replace this image directly"
                          className="flex items-center gap-1.5 bg-[#0066FF] hover:bg-[#0052cc] text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Change Photo</span>
                        </button>
                      </div>

                      {/* Bottom status badge */}
                      <div className="bg-black/80 px-2 py-0.5 rounded text-center">
                        <span className="text-[10px] font-semibold text-neutral-300">
                          {item.type === 'video' ? 'Video Achievement' : 'Permanent Photo'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Single Bold Text Label Centered Directly Below Each Card - Only rendered if title exists */}
                {item.title && item.title.trim().length > 0 && (
                  <h3 className="mt-3 text-center font-bold text-neutral-950 text-sm sm:text-base md:text-lg tracking-tight group-hover:text-[#0066FF] transition-colors">
                    {item.title}
                  </h3>
                )}
              </div>
            );
          })}

          {/* Add New Card Slot (shown in customization mode) */}
          {isCustomizing && (
            <div
              onClick={() => quickNewPhotoInputRef.current?.click()}
              className="cursor-pointer flex flex-col group select-none"
            >
              <div className="w-full aspect-[16/10.5] rounded-2xl border-2 border-dashed border-[#0066FF]/60 hover:border-[#0066FF] bg-blue-50/40 hover:bg-blue-50/70 transition-all flex flex-col items-center justify-center gap-2 p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-sm font-extrabold text-[#0066FF]">Upload New Photo</span>
                  <span className="text-xs text-neutral-500">Permanently added to website</span>
                </div>
              </div>
              <h3 className="mt-3 text-center font-medium text-neutral-400 text-sm">
                + Upload New Photo
              </h3>
            </div>
          )}
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

      {/* Add / Edit Achievement Modal */}
      {(isAddMode || editingItem) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 select-none"
          onClick={handleCloseModal}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#0066FF]/10 text-[#0066FF]">
                  {formType === 'video' ? <VideoIcon className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900">
                    {isAddMode ? 'Add Achievement' : 'Edit Achievement'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Permanently saved to studio server
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 overflow-y-auto">
              {/* Type Switcher: Photo vs Video */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Achievement Type
                </label>
                <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormType('photo')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formType === 'photo'
                        ? 'bg-white text-neutral-950 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('video')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formType === 'video'
                        ? 'bg-white text-neutral-950 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <VideoIcon className="w-3.5 h-3.5" />
                    <span>Video</span>
                  </button>
                </div>
              </div>

              {/* Title input (optional for photo, required for video) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    {formType === 'video' ? 'Title / Headline *' : 'Title (Optional)'}
                  </label>
                  {formType === 'photo' && (
                    <span className="text-[11px] text-neutral-400">Leave blank for clean photo</span>
                  )}
                </div>
                <input
                  type="text"
                  required={formType === 'video'}
                  placeholder={formType === 'video' ? 'e.g. Dance India Dance Reality Stage' : 'Optional label or leave blank'}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 outline-none transition-all"
                />
              </div>

              {/* Photo Upload or URL */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                  {formType === 'video' ? 'Video Cover / Thumbnail Photo *' : 'Achievement Photo *'}
                </label>
                <div className="space-y-2">
                  <input
                    ref={modalImageFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleModalFileUpload(e, false)}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Upload photo or enter image URL"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:border-[#0066FF] outline-none"
                    />
                    <button
                      type="button"
                      disabled={isUploadingMedia}
                      onClick={() => modalImageFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 bg-neutral-900 hover:bg-black text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>

                  {/* Thumbnail Preview */}
                  {formImageUrl && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Video Specific: Video File Upload or URL */}
              {formType === 'video' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    Video File / Video URL *
                  </label>
                  <div className="space-y-2">
                    <input
                      ref={modalVideoFileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/mov"
                      className="hidden"
                      onChange={(e) => handleModalFileUpload(e, true)}
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Upload video or enter URL (/hero-loop.mp4)"
                        value={formVideoUrl}
                        onChange={(e) => setFormVideoUrl(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:border-[#0066FF] outline-none"
                      />
                      <button
                        type="button"
                        disabled={isUploadingMedia}
                        onClick={() => modalVideoFileInputRef.current?.click()}
                        className="flex items-center gap-1.5 bg-[#0066FF] hover:bg-[#0052cc] text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Video</span>
                      </button>
                    </div>

                    {/* Badge input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Video Badge Label (e.g. &quot;VIDEO&quot;, &quot;TV SPECIAL&quot;, &quot;AUDITION&quot;)
                      </label>
                      <input
                        type="text"
                        placeholder="Video"
                        value={formBadge}
                        onChange={(e) => setFormBadge(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 text-xs focus:border-[#0066FF] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Uploading Status Indicator */}
              {uploadStatus && (
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                  {isUploadingMedia && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0066FF]" />}
                  <span>{uploadStatus}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingMedia}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#0066FF] hover:bg-[#0052cc] text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {isAddMode ? 'Add Achievement' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
