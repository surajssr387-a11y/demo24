import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { studioInfo } from '../data/danceData';
import { CategoryItem, loadCategories, DEFAULT_CATEGORIES } from '../data/categoriesData';

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
  const [planType, setPlanType] = useState<'demo' | 'monthly'>('demo');

  // Multi-step booking flow: 'form' -> 'payment' -> 'success'
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');

  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState('');

  // Payment details
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(true);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Sync selected program when initialCategory changes or modal opens
  useEffect(() => {
    if (initialCategory && isOpen) {
      const cat = findCategory(initialCategory);
      setSelectedCatId(cat.id);
      const popIdx = cat.batches?.findIndex((b) => b.badge === 'POPULAR');
      setSelectedBatchIndex(popIdx !== undefined && popIdx >= 0 ? popIdx : 0);
      setPlanType('demo');
      setStep('form');
      setErrorMessage('');
      setLastWhatsAppUrl('');
      setIsPaymentConfirmed(true);
      setUtrNumber('');
    }
  }, [initialCategory, isOpen]);

  if (!isOpen) return null;

  const currentCategory =
    (activeCategories && activeCategories.find((c) => c && c.id === selectedCatId)) ||
    (activeCategories && activeCategories[0]) ||
    DEFAULT_CATEGORIES[0];
  const currentBatches = currentCategory?.batches && currentCategory.batches.length > 0
    ? currentCategory.batches
    : [
        {
          id: 'b1',
          name: 'Regular Batch',
          days: 'Thu, Sat, Sun',
          schedules: ['Thursday — 5:00 PM', 'Saturday — 5:00 PM']
        }
      ];

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

  // Active price based on plan choice or package choice
  const activeFeeText = isSpecialCategory
    ? (activeBatch?.price || currentCategory.demoPrice || currentCategory.monthlyFee || '₹6,000')
    : (planType === 'monthly' ? monthlyPriceText : demoPriceText);

  // Numeric amount for UPI
  const numericAmount = parseInt(activeFeeText.replace(/[^\d]/g, ''), 10) || (planType === 'monthly' ? 1950 : 49);

  // Studio UPI details (sanjeev biruly / 9692451182@fam)
  const upiPayee = studioInfo.upiPayeeName || 'sanjeev biruly';
  const studioUpiId = studioInfo.upiId || '9692451182@fam';
  const upiPayNote = isSpecialCategory
    ? `${currentCategory.title} ${activeBatch?.name || 'Package'}`
    : `${currentCategory.title} ${planType === 'monthly' ? (isGymnastic ? '4 Days Week (16 Sessions)' : 'Monthly Course') : 'Demo ₹49'}`;
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

  // Step 1: Validate form and proceed to Payment Screen
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
    // Advance to Payment step
    setStep('payment');
  };

  // Step 2: Confirm Payment & Submit Booking Notification
  const handleFinalSubmit = () => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const scheduleBulletList = activeBatch.schedules.map((s) => `  • ${s}`).join('\n');
    const chosenDate = date ? date : 'Earliest Available Batch';
    const planLabel = isSpecialCategory
      ? `${currentCategory.title} (${activeBatch.name})`
      : planType === 'monthly'
      ? (isGymnastic ? '4 Days / Week (16 Sessions Course)' : 'Full Monthly Course')
      : 'Demo Class (Trial ₹49)';
    const paymentStatusBadge = 'PAID ONLINE VIA UPI (Verified)';

    const formattedMessage =
`🔔 *NEW BOOKING & PAYMENT RECEIVED - RAMY'S DANCE STUDIO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *Booking Type:* ${planLabel}
💃 *Dance Program:* ${currentCategory.title}
🏷️ *Selected Batch:* ${activeBatch.name}${activeBatch.days ? ` (${activeBatch.days})` : ''}
🕒 *Schedule & Timings:*
${scheduleBulletList}

💵 *Amount:* ${activeFeeText}
💳 *Payment Status:* ✅ ${paymentStatusBadge}
${utrNumber.trim() ? `🔢 *Transaction / UTR ID:* ${utrNumber.trim()}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *STUDENT DETAILS:*
• *Full Name:* ${name.trim()}
• *Mobile Number:* ${cleanPhone}
• *Preferred Starting Date:* ${chosenDate}
• *Studio Branch:* 2nd Floor, Metro Market, Kutchery Road, Ranchi
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
            plan: planLabel,
            batch: activeBatch.name,
            schedule: activeBatch.schedules,
            fee: activeFeeText,
            preferredDate: chosenDate,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[640px] bg-[#0E0F12] border border-[#272932] rounded-2xl md:rounded-3xl p-6 sm:p-8 shadow-2xl text-white max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1E24] hover:bg-[#2A2D36] text-white/80 hover:text-white flex items-center justify-center transition-colors border border-white/5 cursor-pointer z-10"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ============================================================== */}
        {/* STEP 3: SUCCESS / BOOKING COMPLETE WITH NOTIFICATION */}
        {/* ============================================================== */}
        {step === 'success' && (
          <div className="text-center py-5 sm:py-7 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold font-display text-white">Booking &amp; Payment Successful!</h3>
            <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
              Aapka slot <span className="text-[#0066FF] font-semibold">{currentCategory.title}</span> ({planType === 'monthly' ? 'Monthly Course' : 'Trial Demo'}) ke liye register ho gaya hai.
            </p>

            {/* Direct WhatsApp Notification Button */}
            {lastWhatsAppUrl && (
              <a
                href={lastWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:from-[#20ba59] hover:to-[#17a54f] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-950/40 active:scale-95 cursor-pointer border border-emerald-300/40 relative overflow-hidden group"
              >
                <MessageCircle className="w-5 h-5 fill-white shrink-0" />
                <span>📲 Open WhatsApp &amp; Send Booking Notification ({studioInfo.phoneDisplay})</span>
              </a>
            )}

            {/* Receipt Summary */}
            <div className="bg-[#15161B] rounded-2xl p-4 text-left border border-white/10 space-y-2.5 text-xs text-slate-300 mt-3">
              <div className="flex justify-between">
                <span>Student Name:</span>
                <span className="font-semibold text-white">{name.trim()}</span>
              </div>
              <div className="flex justify-between">
                <span>Mobile Number:</span>
                <span className="font-semibold text-white">{phone.trim()}</span>
              </div>
              <div className="flex justify-between">
                <span>Dance Program:</span>
                <span className="font-semibold text-[#0066FF]">{currentCategory.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected Plan:</span>
                <span className="font-bold text-white">
                  {planType === 'monthly' ? 'Full Monthly Course' : 'Trial Demo Session'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Selected Batch:</span>
                <span className="font-medium text-white">{activeBatch.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-extrabold text-amber-400">{activeFeeText} (UPI Paid)</span>
              </div>
              {utrNumber && (
                <div className="flex justify-between">
                  <span>UPI Ref/UTR:</span>
                  <span className="font-mono text-slate-200">{utrNumber.trim()}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: UPI PAYMENT SCREEN (QR CODE + UPI DETAILS) */}
        {/* ============================================================== */}
        {step === 'payment' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Payment Header with Back button */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Details</span>
              </button>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  STEP 2 OF 2: PAYMENT
                </span>
                <span className="text-lg font-black text-amber-400 font-display">
                  {activeFeeText}
                </span>
              </div>
            </div>

            {/* Title & Order Summary Pill */}
            <div className="bg-[#14161C] border border-[#262832] rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  {currentCategory.title}
                </span>
                <span className="text-[11px] text-slate-400">
                  {planType === 'monthly'
                    ? (isGymnastic ? '4 Days / Week (16 Sessions)' : 'Full Monthly Course')
                    : 'Trial Demo Session'} • {activeBatch.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-300 block">{name}</span>
                <span className="text-[11px] text-amber-400 font-bold">{activeFeeText} Payable</span>
              </div>
            </div>

            {/* Main UPI QR Code Card (Styled exactly like user's FamApp QR poster) */}
            <div className="bg-gradient-to-b from-[#181A20] via-[#101216] to-[#0A0B0E] border-2 border-[#0066FF]/60 rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
              {/* Payee Name & FamApp Pill */}
              <div className="mb-3 space-y-1.5 flex flex-col items-center">
                <span className="text-lg sm:text-xl font-black text-white tracking-wide">
                  {upiPayee}
                </span>
                <div className="inline-flex items-center gap-1.5 bg-black/60 border border-white/20 px-3.5 py-1 rounded-full text-xs font-mono font-semibold text-slate-200 shadow-inner">
                  <span>{studioUpiId}</span>
                </div>
              </div>

              {/* QR Code Container with Centered FamApp Logo Badge */}
              <div className="relative bg-[#1A1D24] p-3 rounded-2xl shadow-2xl border-2 border-white/10 my-2 group">
                <div className="bg-white p-2.5 rounded-xl overflow-hidden relative">
                  <img
                    src={qrCodeImageUrl}
                    alt={`UPI QR Code - ${upiPayee} (${studioUpiId})`}
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                    loading="eager"
                  />
                  {/* Central FamApp Bird Emblem Badge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-[#181A20] border-2 border-[#FF9900] shadow-lg flex items-center justify-center">
                      <span className="text-base select-none">🕊️</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scan to pay caption */}
              <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase mt-1">
                Scan to pay with any UPI app
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Google Pay • PhonePe • Paytm • FamApp • BHIM
              </span>

              {/* Amount reminder under QR */}
              <div className="mt-2.5 px-4 py-1.5 bg-amber-950/40 border border-amber-500/30 rounded-full flex items-center gap-2">
                <span className="text-xs text-slate-300 font-semibold">Payable:</span>
                <span className="text-amber-400 text-sm font-extrabold">{activeFeeText}</span>
              </div>

              {/* Direct UPI Apps Link Button (Mobile Users) */}
              <div className="mt-3.5 w-full flex flex-wrap items-center justify-center gap-2">
                <a
                  href={upiPayUrl}
                  className="inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052cc] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Open in UPI App (Pay {activeFeeText})</span>
                </a>
              </div>

              {/* Copy UPI ID Row */}
              <div className="mt-3 w-full max-w-sm flex items-center justify-between bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-400">UPI ID (Tap to copy):</span>
                  <span className="font-mono font-bold text-white select-all">{studioUpiId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Final Action Button: DONE - BOOK & SEND NOTIFICATION ON WHATSAPP */}
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#25D366] via-[#1ebe5d] to-[#128C7E] hover:from-[#20ba59] hover:to-[#0f7c6e] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99] shadow-xl shadow-emerald-950/40 cursor-pointer border border-emerald-400/40"
            >
              <Send className="w-4 h-4 text-white" />
              <span>DONE — BOOK &amp; SEND NOTIFICATION ({activeFeeText})</span>
            </button>

            {/* Security Guarantee Notice */}
            <div className="flex items-center justify-center gap-2 text-center text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct Bank Payment to Ramy&apos;s Dance Studio • 100% Verified Admission</span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: BOOKING FORM (DETAILS & PLAN SELECTION) */}
        {/* ============================================================== */}
        {step === 'form' && (
          <form onSubmit={handleProceedToPayment} className="space-y-5">
            {/* Header Lockup */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pr-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight flex items-baseline gap-2">
                  <span>
                    {isHomeService
                      ? `HOME SERVICE – ${activeFeeText}`
                      : isSpecialCategory
                      ? `${currentCategory.title.toUpperCase()} – ${activeFeeText}`
                      : `BOOK ADMISSION – ${activeFeeText}`}
                  </span>
                </h2>
              </div>
            </div>

            {/* 1. SELECT DANCE PROGRAM */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  1. SELECT DANCE PROGRAM
                </label>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  {isSpecialCategory ? activeFeeText : `Demo ${currentCategory.demoPrice || '₹49'}`}
                </span>
              </div>
              <div className="relative">
                <select
                  value={selectedCatId}
                  onChange={(e) => {
                    const newCatId = e.target.value;
                    setSelectedCatId(newCatId);
                    const targetCat = activeCategories.find((c) => c && c.id === newCatId);
                    const popIdx = targetCat?.batches?.findIndex((b) => b.badge === 'POPULAR');
                    setSelectedBatchIndex(popIdx !== undefined && popIdx >= 0 ? popIdx : 0);
                    setErrorMessage('');
                  }}
                  className="w-full bg-[#14161C] border border-[#2B2E39] focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm text-white focus:outline-none appearance-none cursor-pointer transition-colors"
                >
                  {activeCategories.map((program) => {
                    const isSpec = ['home-service', 'private-class', 'wedding-choreography'].includes(program.id);
                    return (
                      <option key={program.id} value={program.id} className="bg-[#14161C] text-white">
                        {program.title} {isSpec ? `(Package: ${program.demoPrice || program.monthlyFee})` : `(Demo: ${program.demoPrice || '₹49'} | Monthly: ${getMonthlyPriceText(program.monthlyFee)})`}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
            </div>

            {/* 2. CHOOSE PLAN OR DIRECT PACKAGE SELECTION */}
            {isSpecialCategory ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    {isHomeService ? '2. SELECT HOME SERVICE PACKAGE' : '2. SELECT PACKAGE / BATCH'}
                  </label>
                  <span className="text-xs font-black text-amber-400 font-display">
                    {activeFeeText}
                  </span>
                </div>

                <div className={`grid gap-3 ${currentBatches.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                  {currentBatches.map((batch, idx) => {
                    const isSelected = selectedBatchIndex === idx;
                    return (
                      <div
                        key={batch.id || idx}
                        onClick={() => setSelectedBatchIndex(idx)}
                        className={`rounded-2xl p-4 transition-all border cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/60'
                            : 'border-[#262832] bg-[#13151A] hover:border-slate-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-white">
                              {batch.name}
                            </span>
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </span>
                          </div>

                          {batch.days && (
                            <span className="text-xs text-[#0066FF] font-semibold mb-2 block">
                              {batch.days}
                            </span>
                          )}

                          <div className="space-y-1.5 my-2.5">
                            {batch.schedules.map((schedule, sIdx) => (
                              <p key={sIdx} className="text-xs text-slate-300 flex items-start gap-1.5 leading-snug">
                                <span className="text-[#0066FF] font-bold shrink-0">•</span>
                                <span>{schedule}</span>
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-baseline justify-between">
                          <span className="text-xs text-slate-400">Total Fee:</span>
                          <span className="text-xl font-black text-amber-400 font-display">
                            {batch.price || activeFeeText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* Standard Categories: 2. SELECT COURSE PLAN (TRIAL DEMO ₹49 VS FULL MONTHLY COURSE) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                    2. CHOOSE YOUR PLAN (TRIAL OR MONTHLY COURSE)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Plan A: Trial Demo Session ₹49 */}
                    <div
                      onClick={() => setPlanType('demo')}
                      className={`rounded-2xl p-4 transition-all border cursor-pointer relative flex flex-col justify-between ${
                        planType === 'demo'
                          ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/60'
                          : 'border-[#262832] bg-[#13151A] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          Trial Demo Class
                        </span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          planType === 'demo' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                        }`}>
                          {planType === 'demo' && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-snug">
                        Experience the studio ambiance, meet coaches &amp; try 1 full class.
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-400">Trial Fee:</span>
                        <span className="text-xl font-extrabold text-amber-400 font-display">
                          {demoPriceText}
                        </span>
                      </div>
                    </div>

                    {/* Plan B: Full Monthly Course / 4 Days / Week for Gymnastic */}
                    <div
                      onClick={() => setPlanType('monthly')}
                      className={`rounded-2xl p-4 transition-all border cursor-pointer relative flex flex-col justify-between ${
                        planType === 'monthly'
                          ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/60'
                          : 'border-[#262832] bg-[#13151A] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black uppercase tracking-wider text-white">
                            {isGymnastic ? '4 Days / Week' : 'Monthly Course'}
                          </span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            POPULAR
                          </span>
                        </div>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          planType === 'monthly' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                        }`}>
                          {planType === 'monthly' && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-snug">
                        {isGymnastic
                          ? 'Full total 16 sessions comprehensive training with stage & certificate track.'
                          : 'Full 12 sessions comprehensive training with stage & certificate track.'}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-400">
                          {isGymnastic ? 'Plan Fee:' : 'Course Fee:'}
                        </span>
                        <span className="text-xl font-extrabold text-amber-400 font-display">
                          {monthlyPriceText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. SELECT BATCH & TIMINGS */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      3. SELECT BATCH &amp; TIMINGS
                    </label>
                  </div>
                  <div className={`grid gap-2.5 ${currentBatches.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {currentBatches.map((batch, idx) => {
                      const isSelected = selectedBatchIndex === idx;
                      const isFull = batch.isFull;

                      return (
                        <div
                          key={batch.id || idx}
                          onClick={() => handleSelectBatch(idx)}
                          className={`rounded-xl p-3.5 transition-all text-xs border relative ${
                            isFull
                              ? 'border-red-900/60 bg-red-950/20 opacity-80 cursor-not-allowed'
                              : isSelected
                              ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/60 cursor-pointer shadow-md shadow-amber-950/40'
                              : 'border-[#262832] bg-[#13151A] hover:border-slate-500 cursor-pointer'
                          }`}
                        >
                          <div className="font-bold text-white text-xs sm:text-sm mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span>{batch.name}</span>
                              {batch.days && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({batch.days})
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              {batch.badge === 'POPULAR' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/25 text-amber-300 border border-amber-500/40 tracking-wider">
                                  POPULAR
                                </span>
                              )}
                              {batch.price && (
                                <span className="text-[11px] font-extrabold text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                  {batch.price}
                                </span>
                              )}
                              {isFull ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                  FULL
                                </span>
                              ) : isSelected ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400/80" />
                              ) : null}
                            </div>
                          </div>
                          <div className="space-y-1 text-slate-300">
                            {batch.schedules
                              .filter((schedule) => !schedule.toLowerCase().startsWith('course fee'))
                              .map((schedule, sIdx) => (
                                <div key={sIdx} className="leading-tight text-[11px] sm:text-xs">
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
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  YOUR FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#14161C] border border-[#2B2E39] focus:border-[#0066FF] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  MOBILE NUMBER *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#14161C] border border-[#2B2E39] focus:border-[#0066FF] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* 5. PREFERRED DATE INPUT */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                PREFERRED STARTING DATE (OPTIONAL)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#14161C] border border-[#2B2E39] focus:border-[#0066FF] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="text-red-400 text-xs font-semibold">{errorMessage}</p>
            )}

            {/* 6. PROCEED TO UPI PAYMENT BUTTON */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052cc] hover:from-[#0052cc] hover:to-[#003d99] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99] shadow-lg shadow-blue-600/25 cursor-pointer border border-blue-400/30"
            >
              <CreditCard className="w-4 h-4 text-white" />
              <span>PROCEED TO UPI PAYMENT ({activeFeeText})</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            {/* 7. PREFER CALLING FOOTER */}
            <div className="text-center pt-1">
              <a
                href={`tel:${studioInfo.phone}`}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#0066FF]" />
                <span>Prefer calling? {studioInfo.phoneDisplay}</span>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
