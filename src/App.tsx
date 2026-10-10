import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PromoBanner } from './components/PromoBanner';
import { CategoriesSection } from './components/CategoriesSection';
import { AchievementsSection } from './components/AchievementsSection';
import { ChoreographySection } from './components/ChoreographySection';
import { ReviewsSection } from './components/ReviewsSection';
import { FooterSection } from './components/FooterSection';
import { FloatingOfferButton } from './components/FloatingOfferButton';
import {
  CategoryItem,
  loadCategories,
  saveCategories,
} from './data/categoriesData';

// Lazy load heavy booking modal to minimize initial bundle size and boost page speed
const BookDemoModal = lazy(() =>
  import('./components/BookDemoModal').then((m) => ({ default: m.BookDemoModal }))
);

// Lazy load special offer modal to keep initial bundle size ultra-fast
const SpecialOfferModal = lazy(() =>
  import('./components/SpecialOfferModal').then((m) => ({ default: m.SpecialOfferModal }))
);

export default function App() {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedCategoryForBooking, setSelectedCategoryForBooking] = useState('Kids Dance');
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<CategoryItem[]>(loadCategories);

  // Sync with live server on load
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => {
        if (!res.ok) throw new Error('Not ok');
        const ct = res.headers.get('content-type');
        if (!ct || !ct.includes('application/json')) throw new Error('Not JSON');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          saveCategories(data);
        }
      })
      .catch(() => {
        // Fallback to static category catalog seamlessly
      });
  }, []);

  const handleOpenBooking = (category?: unknown) => {
    if (typeof category === 'string' && category.trim()) {
      setSelectedCategoryForBooking(category.trim());
    } else {
      setSelectedCategoryForBooking('Kids Dance');
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
          onCategoriesChange={setCategories}
        />

        {/* Achievements Section - 3x3 Grid (Row 1: 3 Videos, Row 2: 3 Photos, Row 3: 3 Photos) */}
        <AchievementsSection />

        {/* Choreography Section - Cinematic Showcase & Services */}
        <ChoreographySection onOpenBooking={handleOpenBooking} />

        {/* Live Google Review & Client Testimonials Section */}
        <ReviewsSection onOpenBooking={handleOpenBooking} />
      </main>

      {/* Footer Section with Location & Contact */}
      <FooterSection onOpenBooking={handleOpenBooking} />

      {/* Floating 30% OFF Special Offer Button */}
      <FloatingOfferButton onOpen={() => setOfferModalOpen(true)} />

      {/* Interactive Booking Demo Modal (Loaded on-demand) */}
      {bookingModalOpen && (
        <Suspense fallback={null}>
          <BookDemoModal
            isOpen={bookingModalOpen}
            onClose={() => setBookingModalOpen(false)}
            initialCategory={selectedCategoryForBooking}
            categories={categories}
          />
        </Suspense>
      )}

      {/* Special 30% OFF Afternoon Offer Modal (Loaded on-demand) */}
      {offerModalOpen && (
        <Suspense fallback={null}>
          <SpecialOfferModal
            isOpen={offerModalOpen}
            onClose={() => setOfferModalOpen(false)}
            categories={categories}
          />
        </Suspense>
      )}
    </div>
  );
}
