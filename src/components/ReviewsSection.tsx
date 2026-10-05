import React, { useState } from 'react';
import { Star, Share2 } from 'lucide-react';
import { studioInfo } from '../data/danceData';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  category: 'Kids' | 'Advance' | 'Wedding' | 'Ladies' | 'General';
  rating: number;
  date: string;
  avatarBg: string;
  text: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: 'Pooja Agarwal',
    role: 'Parent of Aarav (Age 7)',
    category: 'Kids',
    rating: 5,
    date: '4 days ago',
    avatarBg: 'bg-[#A855F7]',
    text: "Ramy sir is exceptionally patient with little kids. My son was very shy, but within 2 months of joining at Metro Market, his stage confidence and rhythm improved drastically. Highly recommended!",
  },
  {
    id: 't-2',
    name: 'Karan Verma',
    role: 'Advance Batch Dancer',
    category: 'Advance',
    rating: 5,
    date: '1 week ago',
    avatarBg: 'bg-[#3B82F6]',
    text: "Best dance academy in Ranchi without a doubt! The choreographies are modern, energy levels in class are insane, and musicality guidance is spot-on. Worth every rupee.",
  },
  {
    id: 't-3',
    name: 'Sneha & Rahul Tiwari',
    role: 'Wedding Sangeet Couple',
    category: 'Wedding',
    rating: 5,
    date: '2 weeks ago',
    avatarBg: 'bg-[#EF4444]',
    text: "We had barely 10 days to prepare for our wedding sangeet. The team choreographed a customized medley that our entire family loved. Everyone at the reception was stunned!",
  },
  {
    id: 't-4',
    name: 'Anjali Soren',
    role: 'Working Professional',
    category: 'Ladies',
    rating: 5,
    date: '3 weeks ago',
    avatarBg: 'bg-[#10B981]',
    text: "Super safe, encouraging, and vibrant atmosphere for women. Great fitness workout after office hours, and the instructors break down every step with so much patience.",
  },
  {
    id: 't-5',
    name: 'Vikram Singh',
    role: 'Fitness & Bollywood Student',
    category: 'General',
    rating: 5,
    date: '1 month ago',
    avatarBg: 'bg-[#F59E0B]',
    text: "The studio space at Metro Market Kutchery Road is spacious, air-conditioned, and fully mirrored. The training environment pushes you to become a confident dancer.",
  },
  {
    id: 't-6',
    name: 'Priya Mukherjee',
    role: 'Parent of Tanvi (Age 6)',
    category: 'Kids',
    rating: 5,
    date: '1 month ago',
    avatarBg: 'bg-[#EC4899]',
    text: "My daughter always looks forward to her weekend classes. The trainers maintain great discipline while keeping the learning joyful and playful for children.",
  },
  {
    id: 't-7',
    name: 'Mohit Raj',
    role: 'Freestyle & B-Boying',
    category: 'Advance',
    rating: 5,
    date: '2 months ago',
    avatarBg: 'bg-[#6366F1]',
    text: "From basic footwork drills to battle freezes, Ramy's guidance is top notch. If you want authentic hip-hop culture and freestyle training in Ranchi, this is the spot.",
  },
  {
    id: 't-8',
    name: 'Neha & Ankit Gupta',
    role: 'Family Performance',
    category: 'Wedding',
    rating: 5,
    date: '2 months ago',
    avatarBg: 'bg-[#14B8A6]',
    text: "Choreographed our entire family sangeet event with over 15 people of all age groups. They made everyone look graceful and synchronized on stage effortlessly.",
  }
];

export function ReviewsSection({ onOpenBooking }: { onOpenBooking: (category: string) => void }) {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Kids' | 'Advance' | 'Wedding' | 'Ladies'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = (id: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text} — Ramy's Dance Studio Google Review: ${studioInfo.googleMapsUrl}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredTestimonials = activeCategory === 'All'
    ? TESTIMONIALS
    : TESTIMONIALS.filter(t => t.category === activeCategory);

  return (
    <section id="reviews" className="py-16 sm:py-20 bg-[#F8F9FA] text-neutral-900 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading & Category Filter Bar (Centered, with selected subtitle removed) */}
        <div className="text-center max-w-3xl mx-auto mb-10 pb-6 border-b border-neutral-200">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-neutral-900 text-center">
            Google Reviews &amp; Student Stories
          </h2>

          {/* Filter Pills Centered */}
          <div className="flex items-center justify-center flex-wrap gap-2 mt-4">
            {(['All', 'Kids', 'Advance', 'Wedding', 'Ladies'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {cat === 'All' ? 'All Reviews' : `${cat} Batch`}
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Reviews Grid (Matching the Uploaded Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Main Google Profile Summary Card (Matching Left Card in Reference Image) */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-neutral-200/90 shadow-sm flex flex-col items-center text-center justify-between min-h-[260px]">
            <div className="w-full flex flex-col items-center">
              
              {/* Google Brand Wordmark SVG */}
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-[#4285F4] text-2xl font-black font-sans leading-none tracking-tight">G</span>
                <span className="text-[#EA4335] text-2xl font-black font-sans leading-none tracking-tight">o</span>
                <span className="text-[#FBBC05] text-2xl font-black font-sans leading-none tracking-tight">o</span>
                <span className="text-[#4285F4] text-2xl font-black font-sans leading-none tracking-tight">g</span>
                <span className="text-[#34A853] text-2xl font-black font-sans leading-none tracking-tight">l</span>
                <span className="text-[#EA4335] text-2xl font-black font-sans leading-none tracking-tight">e</span>
              </div>

              {/* Studio Name */}
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
                Ramy&apos;s Dance Studio
              </h3>

              {/* Rating & Stars */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-sm font-bold text-neutral-900">4.9</span>
                <div className="flex items-center gap-0.5 text-[#FBBC05]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#FBBC05] text-[#FBBC05]" />
                  ))}
                </div>
              </div>

              {/* Total Reviews Count */}
              <p className="text-xs text-neutral-500 mt-1">
                Read our 180+ Google Reviews
              </p>
            </div>

            {/* Black Pill "Write a review" Button - Opens Google Maps review dialog directly */}
            <div className="w-full mt-6 space-y-2">
              <a
                href={studioInfo.googleReviewWriteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center py-2.5 px-6 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wide shadow-sm transition-all duration-150 cursor-pointer"
              >
                Write a review
              </a>

              <a
                href={studioInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 block text-center transition-colors"
              >
                View verified profile on Google Maps →
              </a>
            </div>
          </div>

          {/* Testimonial Cards */}
          {filteredTestimonials.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header: User Avatar + Name + Date */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-full ${item.avatarBg} text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs`}>
                    {item.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      {item.date}
                    </p>
                  </div>
                </div>

                {/* 5 Yellow Stars */}
                <div className="flex items-center gap-0.5 text-[#FBBC05] mb-2.5">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#FBBC05] text-[#FBBC05]" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                  {item.text}
                </p>
              </div>

              {/* Card Footer: View on Google (Left) + Share Icon (Right) */}
              <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <a
                  href={studioInfo.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 font-medium text-xs transition-colors"
                >
                  {/* Google G small icon */}
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>View on Google</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleShare(item.id, item.text)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer rounded-md hover:bg-neutral-100"
                  title="Share review"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

        </div>

        {/* Quick Demo CTA Strip below the grid */}
        <div className="mt-10 bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900">
              Ready to start your dance journey with us?
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Book your personal trial demo class for just ₹49. Batches available for kids, teens, and adults.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenBooking('Kids Dance')}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold rounded-full shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
          >
            Book ₹49 Demo Class
          </button>
        </div>

      </div>
    </section>
  );
}
