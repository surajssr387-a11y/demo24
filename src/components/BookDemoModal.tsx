import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  Phone,
  CheckCircle2,
  MessageCircle,
  Send,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { studioInfo } from '../data/danceData';
import { CategoryItem, BatchSchedule, loadCategories, DEFAULT_CATEGORIES } from '../data/categoriesData';

// Dynamic fee calculation for Custom Wedding Choreography
function getCustomWeddingFee(count: number): number {
  if (count <= 1) return 3049;
  if (count === 2) return 5549;
  if (count === 3) return 7549;
  if (count === 4) return 8999;
  if (count === 5) return 10049;
  return 10049 + (count - 5) * 1800;
}

// Kids Dance specific batch timings for Level 1, Level 2, Level 3
const KIDS_LEVEL_BATCHES: Record<string, BatchSchedule[]> = {
  'Level 1': [
    {
      id: 'batch-1',
      name: 'Batch 1',
      days: 'Thu, Sat, Sun',
      schedules: [
        'Thursday — 5:00 PM',
        'Saturday — 5:00 PM',
        'Sunday — 9:00 AM'
      ]
    },
    {
      id: 'batch-2',
      name: 'Batch 2',
      days: 'Sat, Sun, Mon',
      schedules: [
        'Saturday — 5:00 PM',
        'Sunday — 9:00 AM',
        'Monday — 4:00 PM'
      ]
    },
    {
      id: 'batch-3',
      name: 'Batch 3',
      days: 'Tue, Sat, Sun',
      schedules: [
        'Tuesday — 4:30 PM',
        'Saturday — 4:00 PM',
        'Sunday — 11:00 AM'
      ]
    }
  ],
  'Level 2': [
    {
      id: 'kids-l2-b1',
      name: 'Batch 1',
      days: 'Thu, Sat, Sun',
      schedules: [
        'Thursday — 4:00 PM',
        'Saturday — 4:00 PM',
        'Sunday — 12:00 PM'
      ]
    }
  ],
  'Level 3': [
    {
      id: 'kids-l3-b1',
      name: 'Batch 1',
      days: 'Thu, Fri, Sun',
      schedules: [
        'Thursday — 4:30 PM',
        'Friday — 4:30 PM',
        'Sunday — 9:00 AM'
      ]
    }
  ]
};

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  categories?: CategoryItem[];
}

export const BookDemoModal: React.FC<BookDemoModalProps> = ({
  isOpen,
  onClose,
  initialCategory = "Kids Dance",
  categories: propCategories,
}) => {
  const activeCategories = propCategories && propCategories.length > 0
    ? propCategories
    : loadCategories();

  // Helper to find category from string
  const findCategory = (rawName?: unknown): CategoryItem => {
    const fallback = (activeCategories && activeCategories[0]) || {
      id: 'kids-dance',
      title: 'Kids dance',
      imageUrl: '/kids-dance.jpg',
      pillTag: 'FOUNDATIONAL',
      levelLabel: 'LEVEL 1',
      description: 'Rhythm, Coordination & Confidence',
      demoPrice: '₹49',
      feeLabel: 'Demo Registration Fee',
      monthlyFee: '₹1,549 / month (12 sessions)',
      trialInfo: 'Trial Class Available',
      batches: []
    };

    if (typeof rawName !== 'string' || !rawName.trim()) return fallback;
    const lower = rawName.trim().toLowerCase();

    // Exact title match
    const byTitle = activeCategories.find((c) => c && c.title && c.title.toLowerCase() === lower);
    if (byTitle) return byTitle;

    // Exact id match
    const byId = activeCategories.find((c) => c && c.id && c.id.toLowerCase() === lower);
    if (byId) return byId;

    // Partial keywords
    if (lower.includes('kid')) return activeCategories.find((c) => c && c.id === 'kids-dance') || fallback;
    if (lower.includes('senior') || lower.includes('beginner')) return activeCategories.find((c) => c && c.id === 'senior-beginner') || fallback;
    if (lower.includes('advance')) return activeCategories.find((c) => c && c.id === 'advance') || fallback;
    if (lower.includes('gym') || lower.includes('free') || lower.includes('style')) return activeCategories.find((c) => c && c.id === 'gymnastic') || fallback;
    if (lower.includes('bollywood') || lower.includes('ladies') || lower.includes('girl')) return activeCategories.find((c) => c && c.id === 'bollywood-ladies') || fallback;
    if (lower.includes('private')) return activeCategories.find((c) => c && c.id === 'private-class') || fallback;
    if (lower.includes('home')) return activeCategories.find((c) => c && c.id === 'home-service') || fallback;
    if (lower.includes('job')) return activeCategories.find((c) => c && c.id === 'job-person') || fallback;
    if (lower.includes('wedding') || lower.includes('weeding')) return activeCategories.find((c) => c && c.id === 'wedding-choreography') || fallback;

    return fallback;
  };

  const [selectedCatId, setSelectedCatId] = useState<string>(() => {
    return findCategory(initialCategory).id;
  });

  // Course Plan: 'demo' (Trial) vs 'monthly' (Full Course)
  const [planType, setPlanType] = useState<'demo' | 'monthly'>('monthly');

  // Multi-step booking flow: 'form' -> 'payment' -> 'success'
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');

  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState('');

  // Payment details
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(true);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Skill Level: Level 1, Level 2, Level 3 (Used specifically for Kids Dance)
  const [selectedLevel, setSelectedLevel] = useState<string>('Level 1');

  // Custom Wedding Choreography customization
  const [customChoreographyCount, setCustomChoreographyCount] = useState<number>(3);
  const [customSelectedRoutines, setCustomSelectedRoutines] = useState<string[]>(['Bride & Groom Couple']);
  const [customNotes, setCustomNotes] = useState<string>('');

  // Category slide helpers with real animation & swipe/drag
  const validCategories = activeCategories.filter(
    (c) => c && c.id !== 'home-service' && c.id !== 'job-person'
  );

  const currentCategoryIndex = Math.max(0, validCategories.findIndex((c) => c.id === selectedCatId));

  const [slideAnim, setSlideAnim] = useState<'slide-left' | 'slide-right' | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);

  const goToNextCategory = () => {
    setSlideAnim('slide-left');
    const nextIdx = (currentCategoryIndex + 1) % validCategories.length;
    const nextCat = validCategories[nextIdx];
    if (nextCat) {
      setTimeout(() => {
        setSelectedCatId(nextCat.id);
        const popIdx = nextCat.batches?.findIndex((b) => b.badge === 'POPULAR');
        setSelectedBatchIndex(popIdx !== undefined && popIdx >= 0 ? popIdx : 0);
        if (nextCat.id !== 'private-class' && nextCat.id !== 'home-service' && nextCat.id !== 'wedding-choreography') {
          setTime('');
        }
        setErrorMessage('');
        setSlideAnim(null);
      }, 160);
    }
  };

  const goToPrevCategory = () => {
    setSlideAnim('slide-right');
    const prevIdx = (currentCategoryIndex - 1 + validCategories.length) % validCategories.length;
    const prevCat = validCategories[prevIdx];
    if (prevCat) {
      setTimeout(() => {
        setSelectedCatId(prevCat.id);
        const popIdx = prevCat.batches?.findIndex((b) => b.badge === 'POPULAR');
        setSelectedBatchIndex(popIdx !== undefined && popIdx >= 0 ? popIdx : 0);
        if (prevCat.id !== 'private-class' && prevCat.id !== 'home-service' && prevCat.id !== 'wedding-choreography') {
          setTime('');
        }
        setErrorMessage('');
        setSlideAnim(null);
      }, 160);
    }
  };

  const nextCategory = validCategories[(currentCategoryIndex + 1) % validCategories.length];
  const prevCategory = validCategories[(currentCategoryIndex - 1 + validCategories.length) % validCategories.length];

  // Drag and Swipe Handlers (Mouse & Touch)
  const handlePointerDown = (clientX: number, target: EventTarget) => {
    const el = target as HTMLElement;
    if (el.tagName === 'INPUT' || el.tagName === 'BUTTON' || el.closest('button') || el.closest('input')) {
      return;
    }
    isDraggingRef.current = true;
    startXRef.current = clientX;
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const diff = clientX - startXRef.current;
    if (Math.abs(diff) > 4) {
      setIsDragging(true);
      setDragOffset(diff);
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const diff = dragOffset;
    setDragOffset(0);
    setIsDragging(false);

    if (diff < -45) {
      goToNextCategory();
    } else if (diff > 45) {
      goToPrevCategory();
    }
  };

  // Sync selected program when initialCategory changes or modal opens
  useEffect(() => {
    if (initialCategory && isOpen) {
      const cat = findCategory(initialCategory);
      setSelectedCatId(cat.id);
      const popIdx = cat.batches?.findIndex((b) => b.badge === 'POPULAR');
      setSelectedBatchIndex(popIdx !== undefined && popIdx >= 0 ? popIdx : 0);
      setPlanType('monthly');
      setSelectedLevel('Level 1');
      setStep('form');
      setErrorMessage('');
      setLastWhatsAppUrl('');
      setIsPaymentConfirmed(true);
      setUtrNumber('');
      setTime('');
    }
  }, [initialCategory, isOpen]);

  if (!isOpen) return null;

  const currentCategory =
    (activeCategories && activeCategories.find((c) => c && c.id === selectedCatId)) ||
    (activeCategories && activeCategories[0]) ||
    DEFAULT_CATEGORIES[0];
  const isKidsDance = currentCategory.id === 'kids-dance' || currentCategory.title.toLowerCase().includes('kids');

  const currentBatches = isKidsDance
    ? (selectedLevel === 'Level 2'
        ? KIDS_LEVEL_BATCHES['Level 2']
        : selectedLevel === 'Level 3'
        ? KIDS_LEVEL_BATCHES['Level 3']
        : KIDS_LEVEL_BATCHES['Level 1'])
    : (currentCategory?.batches && currentCategory.batches.length > 0
        ? currentCategory.batches
        : [
            {
              id: 'b1',
              name: 'Regular Batch',
              days: 'Thu, Sat, Sun',
              schedules: ['Thursday — 5:00 PM', 'Saturday — 5:00 PM']
            }
          ]);

  const activeBatch = currentBatches[selectedBatchIndex] || currentBatches[0];
  const isHomeService = currentCategory.id === 'home-service';
  const isPrivateClass = currentCategory.id === 'private-class';
  const isWeddingChoreo = currentCategory.id === 'wedding-choreography';
  const isSpecialCategory = isHomeService || isPrivateClass || isWeddingChoreo;
  const isGymnastic = currentCategory.id === 'gymnastic';
  const isDemoCategory = !isSpecialCategory;

  // Helper to extract clean monthly price text (e.g. "₹1,549")
  const getMonthlyPriceText = (monthlyStr?: string): string => {
    if (!monthlyStr) return '₹1,549';
    const match = monthlyStr.match(/₹[\d,]+/);
    return match ? match[0] : monthlyStr;
  };

  const monthlyPriceText = isGymnastic
    ? '₹1,950'
    : getMonthlyPriceText(currentCategory.monthlyFee);
  const demoPriceText = currentCategory.demoPrice || '₹49';

  // Dynamic fee calculation for Custom Wedding Choreography
  const customChoreographyFee = getCustomWeddingFee(customChoreographyCount);

  // Active price based on plan choice or package choice
  const activeFeeText = isSpecialCategory
    ? (isWeddingChoreo && activeBatch?.id === 'batch-custom'
        ? 'Custom Quote'
        : (activeBatch?.price || currentCategory.demoPrice || currentCategory.monthlyFee || '₹6,000'))
    : (planType === 'monthly' ? (activeBatch?.price || monthlyPriceText) : demoPriceText);

  // Numeric amount for UPI
  const numericAmount = parseInt(activeFeeText.replace(/[^\d]/g, ''), 10) || (planType === 'monthly' ? 1950 : 49);

  // Studio UPI details (RAM SINGH BABLU / 8340158178@ybi)
  const upiPayee = studioInfo.upiPayeeName || 'RAM SINGH BABLU';
  const studioUpiId = studioInfo.upiId || '8340158178@ybi';
  const upiPayNote = isSpecialCategory
    ? `${currentCategory.title} ${activeBatch?.name || 'Package'}`
    : `${currentCategory.title} ${planType === 'monthly' ? (isGymnastic ? `${activeBatch?.name || 'Course'} (${activeFeeText})` : 'Monthly Course') : 'Demo ₹49'}`;
  const upiPayUrl = `upi://pay?pa=${studioUpiId}&pn=${encodeURIComponent(upiPayee)}&am=${numericAmount}&cu=INR&tn=${encodeURIComponent(upiPayNote)}`;

  // Dynamic QR Code image URL (with high resolution and proper margin)
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(upiPayUrl)}`;

  const handleSelectBatch = (index: number) => {
    const target = currentBatches[index];
    if (target?.isFull) {
      setErrorMessage(`${target.name} is currently FULL. Please select an available batch.`);
      return;
    }
    setErrorMessage('');
    setSelectedBatchIndex(index);
    // Always activate monthly course so the batch fee is displayed in Proceed to Payment
    setPlanType('monthly');
  };

  const handleCopyUpi = () => {
    try {
      navigator.clipboard.writeText(studioUpiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Direct WhatsApp Enquiry submission for Customize According To You
  const handleCustomEnquirySubmit = () => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const chosenDate = date ? date : 'Flexible / Event date to be decided';
    const chosenTime = time ? time : 'Flexible (Mon to Sun)';

    const performersList = customSelectedRoutines.length > 0
      ? `• *Performance Types:* ${customSelectedRoutines.join(', ')}\n`
      : '';
    const notesText = customNotes.trim()
      ? `• *Special Songs / Notes:* ${customNotes.trim()}\n`
      : '';

    const formattedMessage =
`💍 *WEDDING CHOREOGRAPHY CUSTOM ENQUIRY* 💍
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Package:* Customize According To You
💃 *Program:* Wedding Choreography
💰 *Pricing:* Custom Quote Required (To discuss on WhatsApp)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *CLIENT DETAILS:*
• *Full Name:* ${name.trim()}
• *Mobile Number:* ${cleanPhone}
• *Target Event / Date:* ${chosenDate}
• *Preferred Time:* ${chosenTime}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 *CHOREOGRAPHY REQUIREMENTS:*
• *Routines Requested:* ${customChoreographyCount} ${customChoreographyCount === 1 ? 'Choreography' : 'Choreographies'}
${performersList}${notesText}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 *Client Message:* Namaste Ramy's Dance Studio, hume wedding dance choreography ke liye custom package aur pricing discuss karni hai. Please details share kijiye!`;

    const whatsappUrl = `https://wa.me/${studioInfo.whatsappNumber}?text=${encodeURIComponent(formattedMessage)}`;
    setLastWhatsAppUrl(whatsappUrl);
    setStep('success');

    // Automatically try opening WhatsApp
    try {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Handled by direct button on success screen
    }

    // Save lead to database/server
    try {
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          category: currentCategory.title,
          batch: 'Customize According To You',
          date: chosenDate,
          time: chosenTime,
          fee: 'Custom Quote (Discuss on WhatsApp)',
          paymentStatus: 'Custom Enquiry Submitted',
          customRoutines: customChoreographyCount,
          performers: customSelectedRoutines,
          notes: customNotes.trim(),
          submittedAt: new Date().toISOString()
        })
      }).catch(() => {});
    } catch {}
  };

  // Step 1: Validate form and proceed to Payment Screen OR Direct WhatsApp Enquiry
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (activeBatch.isFull) {
      setErrorMessage(`${activeBatch.name} is currently FULL. Please select an open batch.`);
      return;
    }
    setErrorMessage('');

    // If Wedding Choreography Customize According To You is selected: Submit Enquiry directly on WhatsApp!
    if (isWeddingChoreo && activeBatch?.id === 'batch-custom') {
      handleCustomEnquirySubmit();
      return;
    }

    // Advance to Payment step
    setStep('payment');
  };

  // Step 2: Confirm Payment & Submit Booking Notification
  const handleFinalSubmit = () => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const scheduleBulletList = activeBatch.schedules.map((s) => `  • ${s}`).join('\n');
    const chosenDate = date ? date : 'Flexible (Earliest Available)';
    const chosenTime = time ? time : 'Flexible (Mon to Sun)';
    const isCustomChoreo = isWeddingChoreo && activeBatch?.id === 'batch-custom';
    const planLabel = isSpecialCategory
      ? (isCustomChoreo
          ? `${currentCategory.title} (Custom: ${customChoreographyCount} Routines)`
          : `${currentCategory.title} (${activeBatch.name})`)
      : planType === 'monthly'
      ? (isGymnastic ? `${(activeBatch?.name || '4 Days').replace(/\s*\/\s*week/i, '')} (16 Sessions Course)` : 'Full Monthly Course')
      : 'Demo Class (Trial ₹49)';
    const paymentStatusBadge = 'PAID ONLINE VIA UPI (Verified)';

    const customDetailsBlock = isCustomChoreo ? `
✨ *CUSTOM CHOREOGRAPHY SPECIFICATIONS:*
• *Total Routines Selected:* ${customChoreographyCount} Choreographies
${customSelectedRoutines.length > 0 ? `• *Performers / Events:* ${customSelectedRoutines.join(', ')}\n` : ''}${customNotes.trim() ? `• *Song / Special Notes:* ${customNotes.trim()}\n` : ''}` : '';

    const formattedMessage =
`🔔 *NEW BOOKING & PAYMENT RECEIVED - RAMY'S DANCE STUDIO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *Booking Type:* ${planLabel}
💃 *Dance Program:* ${currentCategory.title}
${isKidsDance ? `🎯 *Skill Level:* ${selectedLevel}\n` : ''}🏷️ *Selected Batch:* ${activeBatch.name}${activeBatch.days ? ` (${activeBatch.days})` : ''}
🕒 *Schedule & Timings:*
${scheduleBulletList}${customDetailsBlock}
💵 *Amount:* ${activeFeeText}
💳 *Payment Status:* ✅ ${paymentStatusBadge}
${utrNumber.trim() ? `🔢 *Transaction / UTR ID:* ${utrNumber.trim()}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *STUDENT DETAILS:*
• *Full Name:* ${name.trim()}
• *Mobile Number:* ${cleanPhone}
• *Preferred Starting Date:* ${chosenDate}
${(time || isPrivateClass || isHomeService) ? `• *Preferred Time:* ${chosenTime} (Flexible Mon to Sun)\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *Admin Action:* Payment received. Please verify batch slot and reply with admission confirmation.`;

    const whatsappUrl = `https://wa.me/${studioInfo.whatsappNumber}?text=${encodeURIComponent(formattedMessage)}`;
    setLastWhatsAppUrl(whatsappUrl);
    setStep('success');

    // Automatically try opening WhatsApp
    try {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Handled by direct button
    }

    // Save booking to server
    try {
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking: {
            name: name.trim(),
            phone: cleanPhone,
            program: currentCategory.title,
            level: isKidsDance ? selectedLevel : undefined,
            plan: planLabel,
            batch: activeBatch.name,
            schedule: activeBatch.schedules,
            fee: activeFeeText,
            preferredDate: chosenDate,
            preferredTime: chosenTime,
            paymentStatus: paymentStatusBadge,
            utrNumber: utrNumber.trim(),
            isDemo: planType === 'demo',
          }
        })
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-14 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[640px] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side Slide Arrow (Outside modal card on the side) */}
        {step === 'form' && currentCategoryIndex > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevCategory();
            }}
            className="absolute -left-3 sm:-left-12 md:-left-14 top-1/2 -translate-y-1/2 z-50 p-2 text-white hover:text-blue-300 opacity-90 hover:opacity-100 transition-all hover:scale-125 active:scale-95 border-none outline-none cursor-pointer group"
            title={`Slide to previous: ${prevCategory?.title || 'Previous'}`}
            aria-label="Slide to previous dance program"
          >
            <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3] animate-slide-left drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]" />
          </button>
        )}

        {/* The White Modal Card */}
        <div 
          className="relative w-full bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto overflow-x-hidden"
          onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.target)}
          onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
          onTouchEnd={handlePointerUp}
          onMouseDown={(e) => handlePointerDown(e.clientX, e.target)}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer z-20"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

        {/* ============================================================== */}
        {/* STEP 3: SUCCESS / BOOKING COMPLETE WITH NOTIFICATION */}
        {/* ============================================================== */}
        {step === 'success' && (() => {
          const isCustomChoreo = isWeddingChoreo && activeBatch?.id === 'batch-custom';
          return (
            <div className="text-center py-5 sm:py-7 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold font-display text-slate-900">
                {isCustomChoreo ? 'Custom Enquiry Submitted!' : 'Booking & Payment Successful!'}
              </h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                {isCustomChoreo
                  ? 'Aapki custom choreography enquiry submit ho chuki hai. Admin aapse WhatsApp par connect karke pricing aur schedule finalize karenge.'
                  : <>Aapka slot <span className="text-blue-600 font-semibold">{currentCategory.title}</span> ({planType === 'monthly' ? 'Monthly Course' : 'Trial Demo at'}) ke liye register ho gaya hai.</>}
              </p>

              {/* Direct WhatsApp Notification Button (Green) */}
              {lastWhatsAppUrl && (
                <a
                  href={lastWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:from-[#20ba59] hover:to-[#17a54f] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-600/25 active:scale-95 cursor-pointer border border-emerald-400 relative overflow-hidden group"
                >
                  <MessageCircle className="w-5 h-5 fill-white shrink-0" />
                  <span>
                    {isCustomChoreo
                      ? `📲 Open WhatsApp & Chat With Admin (${studioInfo.phoneDisplay})`
                      : `📲 Open WhatsApp & Send Booking Notification (${studioInfo.phoneDisplay})`}
                  </span>
                </a>
              )}

              {/* Receipt Summary (Light White Card) */}
              <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200 space-y-2.5 text-xs text-slate-700 mt-3 shadow-inner">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-semibold text-slate-900">{name.trim()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile Number:</span>
                  <span className="font-semibold text-slate-900">{phone.trim()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dance Program:</span>
                  <span className="font-semibold text-blue-600">{currentCategory.title}</span>
                </div>
                {isCustomChoreo ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Selected Package:</span>
                      <span className="font-bold text-slate-900">Customize According To You</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Routines Requested:</span>
                      <span className="font-bold text-slate-900">{customChoreographyCount} Routines</span>
                    </div>
                    {customSelectedRoutines.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Performance Types:</span>
                        <span className="font-medium text-slate-900 text-right max-w-[200px]">{customSelectedRoutines.join(', ')}</span>
                      </div>
                    )}
                    {customNotes.trim() && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Special Notes:</span>
                        <span className="font-medium text-slate-900 text-right max-w-[200px]">{customNotes.trim()}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {isKidsDance && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Selected Level:</span>
                        <span className="font-semibold text-slate-900">{selectedLevel}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Selected Plan:</span>
                      <span className="font-bold text-slate-900">
                        {planType === 'monthly' ? 'Full Monthly Course' : 'Trial Demo at'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Selected Batch:</span>
                      <span className="font-medium text-slate-900">{activeBatch.name}</span>
                    </div>
                  </>
                )}
                {date && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Preferred Date:</span>
                    <span className="font-medium text-slate-900">{date}</span>
                  </div>
                )}
                {time && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Preferred Time:</span>
                    <span className="font-semibold text-blue-600">{time} (Flexible Mon-Sun)</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {isCustomChoreo ? 'Pricing Details:' : 'Amount Paid:'}
                  </span>
                  <span className="font-extrabold text-emerald-600">
                    {isCustomChoreo ? 'Custom Quote (Discuss on WhatsApp)' : `${activeFeeText} (UPI Paid)`}
                  </span>
                </div>
                {utrNumber && !isCustomChoreo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">UPI Ref/UTR:</span>
                    <span className="font-mono text-slate-800">{utrNumber.trim()}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer border border-slate-200"
                >
                  Done / Close
                </button>
              </div>
            </div>
          );
        })()}

        {/* ============================================================== */}
        {/* STEP 2: UPI PAYMENT SCREEN (QR CODE + UPI DETAILS) */}
        {/* ============================================================== */}
        {step === 'payment' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Payment Header with High-Contrast Back button */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm sm:text-base font-extrabold text-slate-800 hover:text-slate-950 border border-slate-300 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 text-blue-600 stroke-[2.5]" />
                <span>Back to Details</span>
              </button>
              <div className="text-right">
                <span className="text-xs sm:text-sm font-extrabold text-slate-600 uppercase tracking-wider block">
                  STEP 2 OF 2: PAYMENT
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-600 font-display">
                  {activeFeeText}
                </span>
              </div>
            </div>

            {/* Title & Order Summary Pill */}
            <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 block">
                  {currentCategory.title}
                </span>
                <span className="text-xs sm:text-sm text-slate-700 font-medium">
                  {isKidsDance ? `${selectedLevel} • ` : ''}
                  {planType === 'monthly'
                    ? (isGymnastic ? `${(activeBatch?.name || '4 Days').replace(/\s*\/\s*week/i, '')} (16 Sessions)` : 'Full Monthly Course')
                    : 'Trial Demo at'} • {activeBatch.name.replace(/\s*\/\s*week/i, '')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900 block">{name}</span>
                <span className="text-xs sm:text-sm text-blue-700 font-black">{activeFeeText} Payable</span>
              </div>
            </div>

            {/* Main UPI QR Code Card (Clean White with Blue Accent) */}
            <div className="bg-gradient-to-b from-slate-50 to-slate-100/70 border-2 border-blue-500/40 rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg">
              {/* Payee Name & UPI ID Pill */}
              <div className="mb-3 space-y-1.5 flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-black text-slate-950 tracking-wide">
                  {upiPayee}
                </span>
                <div className="inline-flex items-center gap-1.5 bg-white border-2 border-slate-300 px-4 py-1.5 rounded-full text-sm sm:text-base font-mono font-bold text-slate-900 shadow-xs">
                  <span>{studioUpiId}</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="relative bg-white p-3 rounded-2xl shadow-md border border-slate-200 my-2 group">
                <div className="bg-white p-2.5 rounded-xl overflow-hidden relative">
                  <img
                    src={qrCodeImageUrl}
                    alt={`UPI QR Code - ${upiPayee} (${studioUpiId})`}
                    className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-lg"
                    loading="eager"
                  />
                  {/* Central Emblem Badge - PhonePe */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-[#5f259f] border-2 border-white shadow-md flex items-center justify-center">
                      <span className="text-white font-black text-base select-none">पे</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scan to pay caption */}
              <span className="text-xs sm:text-sm font-black text-slate-800 tracking-wider uppercase mt-1">
                Scan to pay with any UPI app
              </span>
              <span className="text-xs sm:text-sm text-slate-600 font-semibold mt-0.5">
                Google Pay • PhonePe • Paytm • FamApp • BHIM
              </span>

              {/* Amount reminder under QR */}
              <div className="mt-2.5 px-5 py-2 bg-blue-50 border border-blue-200 rounded-full flex items-center gap-2">
                <span className="text-xs sm:text-sm text-slate-700 font-bold">Payable:</span>
                <span className="text-blue-700 text-sm sm:text-base font-black">{activeFeeText}</span>
              </div>

              {/* Direct UPI Apps Link Button (Mobile Users) - Blue */}
              <div className="mt-3.5 w-full flex flex-wrap items-center justify-center gap-2">
                <a
                  href={upiPayUrl}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Open in UPI App (Pay {activeFeeText})</span>
                </a>
              </div>

              {/* Copy UPI ID Row */}
              <div className="mt-3 w-full max-w-sm flex items-center justify-between bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm shadow-xs">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-600">UPI ID (Tap to copy):</span>
                  <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900 select-all">{studioUpiId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-colors cursor-pointer border border-slate-300"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-700" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Final Action Button: DONE - BOOK & SEND NOTIFICATION (Green as requested!) */}
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-800 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99] shadow-xl shadow-emerald-600/30 cursor-pointer border border-emerald-500/40"
            >
              <Send className="w-5 h-5 text-white" />
              <span>DONE — BOOK &amp; SEND NOTIFICATION</span>
            </button>

            {/* Security Guarantee Notice */}
            <div className="flex items-center justify-center gap-2 text-center text-xs sm:text-sm text-slate-600 font-medium">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Direct Bank Payment to Ramy&apos;s Dance Studio • 100% Verified Admission</span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: BOOKING FORM (DETAILS & PLAN SELECTION) */}
        {/* ============================================================== */}
        {step === 'form' && (
          <form 
            onSubmit={handleProceedToPayment} 
            className={`space-y-5 transition-all duration-200 ${
              slideAnim === 'slide-left' ? '-translate-x-6 opacity-60' :
              slideAnim === 'slide-right' ? 'translate-x-6 opacity-60' : 'translate-x-0 opacity-100'
            }`}
            style={{
              transform: isDragging ? `translateX(${dragOffset * 0.4}px)` : undefined,
            }}
          >
            {/* Header Lockup */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pr-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight flex items-baseline gap-2">
                  <span>
                    {currentCategory.title}
                  </span>
                </h2>
              </div>
            </div>

            {/* CHOOSE PLAN OR DIRECT PACKAGE SELECTION */}
            {isSpecialCategory ? (
              <div>
                <div className={`grid gap-3 ${currentBatches.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                  {currentBatches.map((batch, idx) => {
                    const isSelected = selectedBatchIndex === idx;
                    const isCustomBatch = isWeddingChoreo && batch.id === 'batch-custom';
                    const displayPrice = isCustomBatch
                      ? 'Custom Quote'
                      : (batch.price || activeFeeText);

                    return (
                      <div
                        key={batch.id || idx}
                        onClick={() => setSelectedBatchIndex(idx)}
                        className={`rounded-2xl p-4 transition-all border cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-slate-900">
                              {batch.name}
                            </span>
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </div>

                          <div className="space-y-1.5 my-2.5">
                            {batch.schedules
                              .filter((schedule) => {
                                const lower = schedule.toLowerCase();
                                return !lower.includes('fee') && !lower.startsWith('total package') && !lower.startsWith('per class');
                              })
                              .map((schedule, sIdx) => (
                              <p key={sIdx} className="text-xs text-slate-600 flex items-start gap-1.5 leading-snug">
                                <span className="text-blue-600 font-bold shrink-0">•</span>
                                <span>{schedule}</span>
                              </p>
                            ))}
                          </div>
                        </div>

                        {isCustomBatch ? (
                          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">
                              Package Fee:
                            </span>
                            <span className="text-xs font-black text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                              <MessageCircle className="w-3.5 h-3.5 fill-emerald-600/30 text-emerald-700 shrink-0" />
                              Custom Quote on WhatsApp
                            </span>
                          </div>
                        ) : (
                          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-baseline justify-between">
                            <span className="text-xs text-slate-500">
                              Total Fee:
                            </span>
                            <span className="text-xl font-black text-blue-600 font-display">
                              {displayPrice}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Customization Box when Customize According To You is selected */}
                {isWeddingChoreo && activeBatch?.id === 'batch-custom' && (
                  <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border-2 border-emerald-300 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-emerald-100">
                      <div>
                        <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider block">
                          Customize Your Package
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          How many choreographies do you need?
                        </h4>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomChoreographyCount(Math.max(1, customChoreographyCount - 1));
                          }}
                          className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Decrease choreography count"
                        >
                          -
                        </button>
                        <span className="text-sm font-extrabold text-emerald-950 min-w-[75px] text-center">
                          {customChoreographyCount} {customChoreographyCount === 1 ? 'Routine' : 'Routines'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomChoreographyCount(Math.min(20, customChoreographyCount + 1));
                          }}
                          className="w-7 h-7 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Increase choreography count"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Performer / Performance options */}
                    <div className="mb-3">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Select performance types (Optional):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Bride & Groom Couple',
                          'Parents / Elders',
                          'Friends & Cousins',
                          'Full Family Flashmob',
                          'Bride / Groom Solo',
                          'Ring Ceremony / Entry'
                        ].map((routineType) => {
                          const isPicked = customSelectedRoutines.includes(routineType);
                          return (
                            <button
                              type="button"
                              key={routineType}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isPicked) {
                                  setCustomSelectedRoutines(customSelectedRoutines.filter((r) => r !== routineType));
                                } else {
                                  setCustomSelectedRoutines([...customSelectedRoutines, routineType]);
                                }
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                                isPicked
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                              }`}
                            >
                              {isPicked ? '✓ ' : '+ '} {routineType}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom note or song name */}
                    <div>
                      <input
                        type="text"
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        placeholder="Song names or special family requirements? (Optional)"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 text-slate-900"
                      />
                    </div>

                    {/* WhatsApp enquiry callout */}
                    <div className="mt-3 p-3 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-950 text-xs flex items-start gap-2.5">
                      <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 fill-emerald-600/30" />
                      <p className="leading-snug">
                        <strong className="font-extrabold text-emerald-900">Submit Enquiry to WhatsApp:</strong> Niche diye gaye button par click karein. Aapki details ke sath WhatsApp open hoga jahan admin aapse direct connect karke customized pricing aur songs finalize karenge.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Standard Categories: COURSE PLAN */}
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Plan A: Trial Demo Session ₹49 */}
                    <div
                      onClick={() => setPlanType('demo')}
                      className={`rounded-2xl p-4 transition-all border cursor-pointer relative flex flex-col justify-between ${
                        planType === 'demo'
                          ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-black uppercase tracking-wider text-slate-900">
                          Trial Demo at
                        </span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          planType === 'demo' ? 'border-blue-600 bg-blue-600' : 'border-slate-400 bg-white'
                        }`}>
                          {planType === 'demo' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-baseline justify-between">
                        <span className="text-xs font-semibold text-slate-600">Trial Fee:</span>
                        <span className="text-xl sm:text-2xl font-black text-blue-600 font-display">
                          {demoPriceText}
                        </span>
                      </div>
                    </div>

                    {/* Plan B: Full Monthly Course / 4 Days / Week for Gymnastic */}
                    <div
                      onClick={() => setPlanType('monthly')}
                      className={`rounded-2xl p-4 transition-all border cursor-pointer relative flex flex-col justify-between ${
                        planType === 'monthly'
                          ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black uppercase tracking-wider text-slate-900">
                            {isGymnastic ? ((activeBatch?.name || '4 Days').replace(/\s*\/\s*week/i, '')) : 'Monthly Course'}
                          </span>
                          {!isGymnastic && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          planType === 'monthly' ? 'border-blue-600 bg-blue-600' : 'border-slate-400 bg-white'
                        }`}>
                          {planType === 'monthly' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-baseline justify-between">
                        <span className="text-xs font-semibold text-slate-600">
                          {isGymnastic ? 'Monthly Plan Fee:' : 'Course Fee:'}
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-blue-600 font-display">
                          {activeBatch?.price || monthlyPriceText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SELECT LEVEL (Only for Kids Dance as requested) */}
                {isKidsDance && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                        SELECT LEVEL
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {['Level 1', 'Level 2', 'Level 3'].map((lvl) => {
                        const isSelected = selectedLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                              setSelectedLevel(lvl);
                              setSelectedBatchIndex(0);
                            }}
                            className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20 text-slate-900 font-bold'
                                : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 text-slate-700 hover:border-slate-400 font-medium'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-400 bg-white'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span className="text-xs sm:text-sm font-bold">{lvl}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SELECT TIMINGS */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                      SELECT TIMINGS
                    </label>
                  </div>
                  <div className={`grid gap-2.5 ${currentBatches.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {currentBatches.map((batch, idx) => {
                      const isSelected = planType === 'monthly' && selectedBatchIndex === idx;
                      const isFull = batch.isFull;

                      return (
                        <div
                          key={batch.id || idx}
                          onClick={() => handleSelectBatch(idx)}
                          className={`rounded-xl p-3.5 transition-all text-xs border relative ${
                            isFull
                              ? 'border-red-200 bg-red-50/60 opacity-80 cursor-not-allowed text-red-900'
                              : isSelected
                              ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 cursor-pointer shadow-sm text-slate-900'
                              : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-400 cursor-pointer text-slate-800'
                          }`}
                        >
                          <div className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className="font-extrabold">{batch.name.replace(/\s*\/\s*week/i, '')}</span>
                              {batch.days && (
                                <span className="text-xs text-slate-600 font-medium">
                                  ({batch.days})
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              {batch.badge === 'POPULAR' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-700 border border-blue-200 tracking-wider">
                                  POPULAR
                                </span>
                              )}
                              {batch.price && (
                                <span className="text-xs font-black text-blue-700 bg-blue-100/80 border border-blue-200 px-2 py-0.5 rounded-full">
                                  {batch.price}
                                </span>
                              )}
                              {isFull ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                  FULL
                                </span>
                              ) : isSelected ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs shadow-blue-500/80" />
                              ) : null}
                            </div>
                          </div>
                          <div className="space-y-1 text-slate-700">
                            {batch.schedules
                              .filter((schedule) => !schedule.toLowerCase().startsWith('course fee'))
                              .map((schedule, sIdx) => (
                                <div key={sIdx} className="leading-tight text-xs sm:text-sm font-medium">
                                  {schedule}
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* 4. NAME & MOBILE INPUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  YOUR FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm sm:text-base font-medium text-slate-900 placeholder-slate-400 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  MOBILE NUMBER *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm sm:text-base font-medium text-slate-900 placeholder-slate-400 focus:outline-none transition-colors shadow-xs"
                />
              </div>
            </div>

            {/* 5. PREFERRED DATE & TIME INPUTS (Special categories like Private Class, Home Service & Wedding Choreography) */}
            {isSpecialCategory && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    PREFERRED DATE *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm sm:text-base font-medium text-slate-900 focus:outline-none transition-colors shadow-xs [color-scheme:light]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    PREFERRED TIME (MON - SUN) *
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm sm:text-base font-medium text-slate-900 focus:outline-none transition-colors shadow-xs [color-scheme:light]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <p className="text-red-600 text-sm font-bold">{errorMessage}</p>
            )}

            {/* 6. BOOK YOUR APPOINTMENT OR SUBMIT ENQUIRY BUTTON */}
            {isWeddingChoreo && activeBatch?.id === 'batch-custom' ? (
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99] shadow-lg shadow-emerald-600/30 cursor-pointer border border-emerald-500/40"
              >
                <MessageCircle className="w-5 h-5 text-white fill-white/20" />
                <span>SUBMIT ENQUIRY ON WHATSAPP</span>
              </button>
            ) : (
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99] shadow-lg shadow-blue-600/30 cursor-pointer border border-blue-500/40"
              >
                <span>BOOK YOUR APPOINTMENT</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            )}
          </form>
        )}
        </div>

        {/* Right Side Slide Arrow (Outside modal card on the side) */}
        {step === 'form' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToNextCategory();
            }}
            className="absolute -right-3 sm:-right-12 md:-right-14 top-1/2 -translate-y-1/2 z-50 p-2 text-white hover:text-blue-300 opacity-90 hover:opacity-100 transition-all hover:scale-125 active:scale-95 border-none outline-none cursor-pointer group"
            title={`Slide to next: ${nextCategory?.title || 'Next'}`}
            aria-label="Slide to next dance program"
          >
            <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3] animate-slide-right drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]" />
          </button>
        )}
      </div>
    </div>
  );
};
