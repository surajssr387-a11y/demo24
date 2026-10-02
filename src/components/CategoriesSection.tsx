import React, { useState, useEffect } from 'react';
import { Video } from 'lucide-react';
import { CategoryItem, DEFAULT_CATEGORIES, loadCategories } from '../data/categoriesData';
import { ChangeVideoModal } from './ChangeVideoModal';

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
  const [changingCategory, setChangingCategory] = useState<CategoryItem | null>(null);

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
          setInternalCategories(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveCategoryVideo = async (newVideoUrl: string) => {
    if (!changingCategory) return;
    const updated = internalCategories.map((c) =>
      c.id === changingCategory.id ? { ...c, videoUrl: newVideoUrl } : c
    );
    setInternalCategories(updated);
    try {
      localStorage.setItem('ramys_categories_data_v1', JSON.stringify(updated));
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error('Error saving category video:', e);
    }
  };

  const displayCategories = internalCategories && internalCategories.length > 0
    ? internalCategories
    : DEFAULT_CATEGORIES;

  return (
    <section id="categories" className="relative bg-white text-neutral-900 overflow-hidden">
      {/* Main Categories Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16">
        
        {/* Section Header: Title */}
        <div className="relative mb-8 sm:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-950 font-display tracking-tight uppercase">
            Categories
          </h2>
        </div>

        {/* 3x3 Grid Form (9 Categories arranged in 3 columns x 3 rows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {displayCategories.map((category: CategoryItem, idx: number) => {
            const isKidsDanceCard = category.id === 'kids-dance' || idx === 0;

            return (
              <div
                key={category.id}
                onClick={() => onSelectCategory(category.title)}
                className="group cursor-pointer flex flex-col select-none relative"
              >
                {/* Card Container (Clean, rounded-2xl, high contrast photography / video) */}
                <div className="relative w-full aspect-[16/10.5] rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/90 shadow-xs transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-md group-hover:border-neutral-300">
                  {/* Media: Video if present, else Image */}
                  {category.videoUrl ? (
                    <video
                      key={category.videoUrl}
                      src={category.videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover object-center transition-all duration-300 group-hover:brightness-105 pointer-events-none"
                    />
                  ) : (
                    <img
                      src={category.imageUrl}
                      alt={category.title}
                      className="w-full h-full object-cover object-center transition-all duration-300 group-hover:brightness-105"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Change Video Button - SPECIFICALLY ONLY ON CARD 1 (Kids Dance) */}
                  {isKidsDanceCard && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChangingCategory(category);
                      }}
                      title="Change Video for Kids Dance"
                      className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer opacity-90 group-hover:opacity-100"
                    >
                      <Video className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>Change Video</span>
                    </button>
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

      {/* Change Video Modal for Selected Category */}
      {changingCategory && (
        <ChangeVideoModal
          isOpen={!!changingCategory}
          onClose={() => setChangingCategory(null)}
          title={`Category: ${changingCategory.title}`}
          currentVideoUrl={changingCategory.videoUrl || ''}
          onSave={handleSaveCategoryVideo}
        />
      )}
    </section>
  );
};
