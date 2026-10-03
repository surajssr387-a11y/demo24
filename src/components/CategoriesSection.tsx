import React, { useState, useEffect } from 'react';
import { CategoryItem, DEFAULT_CATEGORIES, loadCategories, saveCategories } from '../data/categoriesData';

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

  return (
    <section id="categories" className="relative bg-white text-neutral-900 overflow-hidden">
      {/* Main Categories Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16">
        
        {/* Section Header */}
        <div className="relative mb-8 sm:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-950 font-display tracking-tight uppercase">
            Categories
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Select a category to view schedules, batches &amp; book demo
          </p>
        </div>

        {/* Categories Grid (3 columns on desktop, Wedding centered in its row with same size) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {displayCategories.map((category: CategoryItem) => {
            const isWedding = category.id === 'wedding-choreography' || category.title.toLowerCase().includes('wedding');

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
                  {/* Media: Video if present, else Image (plays seamlessly without overlays) */}
                  {category.videoUrl ? (
                    <video
                      key={category.videoUrl}
                      src={category.videoUrl}
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
    </section>
  );
};
