import React, { useState } from 'react';
import { Star, CheckCircle, ExternalLink, ThumbsUp, Quote, MessageSquarePlus } from 'lucide-react';
import { studioInfo } from '../data/danceData';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  category: 'Kids' | 'Advance' | 'Wedding' | 'Ladies';
  rating: number;
  date: string;
  avatarBg: string;
  text: string;
  verified: boolean;
  highlightTag?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: 'Pooja Agarwal',
    role: 'Parent of Aarav (Age 7)',
    category: 'Kids',
    rating: 5,
    date: '2 days ago',
    avatarBg: 'bg-emerald-500',
    highlightTag: 'Kids Dance Batch',
    text: "Ramy sir is exceptionally patient and encouraging with little kids. My son was very shy initially, but within 2 months of joining at Metro Market, his stage confidence and rhythm improved dramatically. Truly the best dance academy in Ranchi!",
    verified: true,
  },
  {
    id: 't-2',
    name: 'Karan Verma',
    role: 'College Student',
    category: 'Advance',
    rating: 5,
    date: '1 week ago',
    avatarBg: 'bg-blue-600',
    highlightTag: 'Advance Hip-Hop',
    text: "The energy in Ramy's class is unmatched! They don't just teach steps, they teach musicality, footwork, and stage presence. If you're serious about hip-hop or freestyle, this is 100% the place to be.",
    verified: true,
  },
  {
    id: 't-3',
    name: 'Sneha & Rahul Tiwari',
    role: 'Bride & Groom',
    category: 'Wedding',
    rating: 5,
    date: '2 weeks ago',
    avatarBg: 'bg-rose-500',
    highlightTag: 'Wedding Sangeet',
    text: "We had barely 10 days before our wedding sangeet. The choreography was custom-made for our comfort level, modern yet graceful. Our family dance medley became the highlight of our reception night!",
    verified: true,
  },
  {
    id: 't-4',
    name: 'Anjali Soren',
    role: 'Working Professional',
    category: 'Ladies',
    rating: 5,
    date: '3 weeks ago',
    avatarBg: 'bg-purple-600',
    highlightTag: 'Ladies Bollywood',
    text: "Super safe, welcoming, and empowering environment for women. Perfect workout after a long office day, and the instructors are so warm and humble. Always look forward to evening batches!",
    verified: true,
  }
];

export function ReviewsSection({ onOpenBooking }: { onOpenBooking: (category: string) => void }) {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Kids' | 'Advance' | 'Wedding' | 'Ladies'>('All');
  const [helpfulCount, setHelpfulCount] = useState<Record<string, number>>({
    't-1': 14,
    't-2': 19,
    't-3': 22,
    't-4': 11
  });
  const [userVoted, setUserVoted] = useState<Record<string, boolean>>({});

  const handleHelpful = (id: string) => {
    if (userVoted[id]) return;
    setHelpfulCount(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setUserVoted(prev => ({ ...prev, [id]: true }));
  };

  const filteredTestimonials = activeCategory === 'All'
    ? TESTIMONIALS
    : TESTIMONIALS.filter(t => t.category === activeCategory);

  return (
    <section id="reviews" className="py-16 sm:py-24 bg-[#0B0F19] text-white border-t border-neutral-800/80 relative overflow-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#0066FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header: Clean title only, removed extra pill and descriptive paragraph */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-white">
            Google Reviews &amp; Student Stories
          </h2>
        </div>

        {/* 2-Column Split: Google Live Credibility (Left) & Client Testimonials (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* LEFT COLUMN: Google Reviews Live Card (5 Cols) */}
          <div className="lg:col-span-5 bg-neutral-900/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-2xl relative">
            
            {/* Google Brand Header */}
            <div className="flex items-center justify-between pb-6 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                {/* Official Google G Logo */}
                <div className="w-10 h-10 rounded-xl bg-white p-2 flex items-center justify-center shadow-sm shrink-0">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
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
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight flex items-center gap-1.5">
                    Google Reviews
                    <CheckCircle className="w-4 h-4 text-[#0066FF] fill-[#0066FF]/20" />
                  </h3>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Rating
              </span>
            </div>

            {/* Score Big Display */}
            <div className="py-6 flex items-baseline gap-4">
              <span className="text-5xl sm:text-6xl font-black font-display tracking-tight text-white">
                4.9
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 font-medium">
                  Based on <strong className="text-white">180+ verified reviews</strong>
                </p>
              </div>
            </div>

            {/* Rating Distribution Bars */}
            <div className="space-y-2 py-4 border-t border-b border-neutral-800/80 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-10 text-neutral-400 font-semibold">5 Star</span>
                <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '96%' }} />
                </div>
                <span className="w-8 text-right text-neutral-400 font-mono">96%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-10 text-neutral-400 font-semibold">4 Star</span>
                <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400/80 rounded-full" style={{ width: '4%' }} />
                </div>
                <span className="w-8 text-right text-neutral-400 font-mono">4%</span>
              </div>
              <div className="flex items-center gap-3 opacity-40">
                <span className="w-10 text-neutral-400 font-semibold">3 Star</span>
                <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400/40 rounded-full" style={{ width: '0%' }} />
                </div>
                <span className="w-8 text-right text-neutral-400 font-mono">0%</span>
              </div>
            </div>

            {/* Key Studio Highlights based on real reviews */}
            <div className="pt-5 space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                What students love most:
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Friendly Instructors',
                  'Individual Attention',
                  'Spacious Studio',
                  'Stage Exposure',
                  'Affordable Pricing'
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-lg bg-neutral-800/80 text-neutral-300 border border-neutral-700/60"
                  >
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Direct Google Action CTAs */}
            <div className="mt-8 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row gap-3">
              <a
                href={studioInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs sm:text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="w-4 h-4 text-neutral-700" />
              </a>

              <a
                href={studioInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs sm:text-sm border border-neutral-700 transition-all duration-200"
              >
                <MessageSquarePlus className="w-4 h-4 text-[#0066FF]" />
                <span>Write a Review</span>
              </a>
            </div>

          </div>

          {/* RIGHT COLUMN: Client Testimonials / Student Stories (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Filter Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {(['All', 'Kids', 'Advance', 'Wedding', 'Ladies'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/30'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {cat === 'All' ? 'All Stories' : `${cat} Batch`}
                </button>
              ))}
            </div>

            {/* Testimonials List */}
            <div className="grid grid-cols-1 gap-4">
              {filteredTestimonials.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-900/70 hover:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-800 transition-all duration-200 relative group"
                >
                  {/* Subtle quote watermark */}
                  <Quote className="absolute top-5 right-5 w-8 h-8 text-neutral-800 group-hover:text-neutral-700 transition-colors pointer-events-none" />

                  {/* Header: Avatar, Name, Rating & Tag */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${item.avatarBg} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm`}>
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
                            {item.name}
                          </h4>
                          {item.verified && (
                            <span title="Verified Student/Parent" className="inline-flex items-center text-[#0066FF]">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400">{item.role}</p>
                      </div>
                    </div>

                    {/* Star Rating & Date */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(item.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                        {item.date}
                      </span>
                    </div>
                  </div>

                  {/* Highlight pill */}
                  {item.highlightTag && (
                    <div className="mb-2.5">
                      <span className="inline-block text-[11px] font-semibold text-[#0066FF] bg-[#0066FF]/10 px-2 py-0.5 rounded-md border border-[#0066FF]/20">
                        {item.highlightTag}
                      </span>
                    </div>
                  )}

                  {/* Review Text */}
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                    &ldquo;{item.text}&rdquo;
                  </p>

                  {/* Card Footer: Helpful button & Google sync notice */}
                  <div className="mt-4 pt-3.5 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]">Source:</span>
                      <span className="text-neutral-400 font-medium text-[11px] flex items-center gap-1">
                        Google Verified Review
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleHelpful(item.id)}
                      className={`inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                        userVoted[item.id]
                          ? 'text-[#0066FF] font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      title="Mark review as helpful"
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${userVoted[item.id] ? 'fill-[#0066FF]' : ''}`} />
                      <span>Helpful ({helpfulCount[item.id] || 0})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Demo CTA Banner */}
            <div className="bg-gradient-to-r from-[#0066FF]/20 via-[#0066FF]/10 to-transparent p-5 rounded-2xl border border-[#0066FF]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Experience It Yourself First-Hand!</h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Book a live trial session for just ₹49. No commitment required.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenBooking('Kids Dance')}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-[#0066FF]/25 hover:shadow-[#0066FF]/40 transition-all shrink-0 cursor-pointer"
              >
                Book ₹49 Demo Class
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
