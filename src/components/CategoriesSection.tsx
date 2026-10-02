import React, { useState, useEffect } from 'react';
import { CategoryItem, DEFAULT_CATEGORIES, loadCategories } from '../data/categoriesData';

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
          // Filter out home-service and job-person if cached
          const filtered = data.filter(
            (c) => c.id !== 'home-service' && c.id !== 'job-person'
          );
          setInternalCategories(filtered);
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
        
        {/* Section Header: Title */}
        <div className="relative mb-8 sm:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-950 font-display tracking-tight uppercase">
            Categories
          </h2>
        </div>

        {/* Categories Grid (3 columns on desktop, Wedding spans full width) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {displayCategories.map((category: CategoryItem) => {
            const isWedding = category.id === 'wedding-choreography' || category.title.toLowerCase().includes('wedding');

            return (
              <div
                key={category.id}
                onClick={() => onSelectCategory(category.title)}
                className={`group cursor-pointer flex flex-col select-none relative ${
                  isWedding ? 'col-span-1 sm:col-span-2 lg:col-span-3' : ''
                }`}
              >
                {/* Card Container (Wedding takes full width with sleek cinematic aspect ratio) */}
                <div
                  className={`relative w-full ${
                    isWedding
                      ? 'aspect-[16/9] sm:aspect-[21/9] lg:aspect-[3.2/1] min-h-[220px] max-h-[380px]'
                      : 'aspect-[16/10.5]'
                  } rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/90 shadow-xs transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-md group-hover:border-neutral-300`}
                >
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
                      className={`w-full h-full object-cover ${
                        isWedding ? 'object-[center_35%]' : 'object-center'
                      } transition-all duration-300 group-hover:brightness-105`}
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
