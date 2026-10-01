import React, { useState, useEffect } from 'react';
import { CategoryItem, loadCategories } from '../data/categoriesData';
import { resolvePlayableUrl, isDeviceMediaKey } from '../utils/mediaStorage';

interface CategoriesSectionProps {
  onSelectCategory: (categoryTitle: string) => void;
  categories?: CategoryItem[];
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  onSelectCategory,
  categories: propCategories,
}) => {
  const [internalCategories, setInternalCategories] = useState<CategoryItem[]>(() => {
    return propCategories || loadCategories();
  });

  const [resolvedCategories, setResolvedCategories] = useState<CategoryItem[]>(internalCategories);

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

  // Resolve IndexedDB device media URLs for uploaded photos if needed
  useEffect(() => {
    let isMounted = true;
    const resolveImages = async () => {
      const resolved = await Promise.all(
        internalCategories.map(async (cat) => {
          let imageUrl = cat.imageUrl;
          if (isDeviceMediaKey(imageUrl)) {
            const resolvedImg = await resolvePlayableUrl(imageUrl);
            if (resolvedImg) imageUrl = resolvedImg;
          }
          return { ...cat, imageUrl };
        })
      );
      if (isMounted) {
        setResolvedCategories(resolved);
      }
    };
    resolveImages();
    return () => {
      isMounted = false;
    };
  }, [internalCategories]);

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
          {resolvedCategories.map((category: CategoryItem) => {
            return (
              <div
                key={category.id}
                onClick={() => onSelectCategory(category.title)}
                className="group cursor-pointer flex flex-col select-none relative"
              >
                {/* Card Container (Clean, rounded-2xl, high contrast photography) */}
                <div className="relative w-full aspect-[16/10.5] rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/90 shadow-xs transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-md group-hover:border-neutral-300">
                  <img
                    src={category.imageUrl}
                    alt={category.title}
                    className="w-full h-full object-cover object-center transition-all duration-300 group-hover:brightness-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
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
