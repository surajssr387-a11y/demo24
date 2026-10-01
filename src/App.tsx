import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PromoBanner } from './components/PromoBanner';
import { CategoriesSection } from './components/CategoriesSection';
import { AchievementsSection } from './components/AchievementsSection';
import { ChoreographySection } from './components/ChoreographySection';
import { FooterSection } from './components/FooterSection';
import { BookDemoModal } from './components/BookDemoModal';
import {
  CategoryItem,
  loadCategories,
  saveCategories,
} from './data/categoriesData';

export default function App() {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedCategoryForBooking, setSelectedCategoryForBooking] = useState('Kids Dance');

  // Categories state
  const [categories, setCategories] = useState<CategoryItem[]>(loadCategories);

  // Sync with live server on load
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          saveCategories(data);
        }
      })
      .catch((err) => {
        console.log('Using local categories cache', err);
      });
  }, []);

  const handleOpenBooking = (category?: string) => {
    if (category) {
      setSelectedCategoryForBooking(category);
    }
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-[#0066FF] selection:text-white font-sans">
      {/* Fixed Navigation Bar */}
      <Navbar onOpenBooking={handleOpenBooking} />

      {/* Main Sections */}
      <main>
        {/* Hero Section */}
        <Hero onOpenBooking={handleOpenBooking} />

        {/* Studio Official Photo Banner (Between Hero & Category Section) */}
        <PromoBanner onOpenBooking={handleOpenBooking} />

        {/* Categories Section - 3x3 Grid of 9 Categories */}
        <CategoriesSection
          onSelectCategory={handleOpenBooking}
          categories={categories}
        />

        {/* Achievements Section - 3x3 Grid (Row 1: 3 Videos, Row 2: 3 Photos, Row 3: 3 Photos) */}
        <AchievementsSection />

        {/* Choreography Section - Cinematic Showcase & Services */}
        <ChoreographySection onOpenBooking={handleOpenBooking} />
      </main>

      {/* Footer Section with Location & Contact */}
      <FooterSection onOpenBooking={handleOpenBooking} />

      {/* Interactive Booking Demo Modal */}
      <BookDemoModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialCategory={selectedCategoryForBooking}
        categories={categories}
      />
    </div>
  );
}
