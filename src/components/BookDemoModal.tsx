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
  const [planType, setPlanType] = useState<'demo' | 'monthly'>('monthly');

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

  // Skill Level: Level 1, Level 2, Level 3
  const [selectedLevel, setSelectedLevel] = useState<string>('Level 1');

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
${isSpecialCategory ? '' : `🎯 *Skill Level:* ${selectedLevel}\n`}🏷️ *Selected Batch:* ${activeBatch.name}${activeBatch.days ? ` (${activeBatch.days})` : ''}
🕒 *Schedule & Timings:*
${scheduleBulletList}

💵 *Amount:* ${activeFeeText}
💳 *Payment Status:* ✅ ${paymentStatusBadge}
${utrNumber.trim() ? `🔢 *Transaction / UTR ID:* ${utrNumber.trim()}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *STUDENT DETAILS:*
• *Full Name:* ${name.trim()}
• *Mobile Number:* ${cleanPhone}
• *Preferred Starting Date:* ${chosenDate}
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
            level: selectedLevel,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[640px] bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer z-10"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ============================================================== */}
        {/* STEP 3: SUCCESS / BOOKING COMPLETE WITH NOTIFICATION */}
        {/* ============================================================== */}
        {step === 'success' && (
          <div className="text-center py-5 sm:py-7 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold font-display text-slate-900">Booking &amp; Payment Successful!</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
              Aapka slot <span className="text-blue-600 font-semibold">{currentCategory.title}</span> ({planType === 'monthly' ? 'Monthly Course' : 'Trial Demo'}) ke liye register ho gaya hai.
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
                <span>📲 Open WhatsApp &amp; Send Booking Notification ({studioInfo.phoneDisplay})</span>
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
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Level:</span>
                <span className="font-semibold text-slate-900">{selectedLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Plan:</span>
                <span className="font-bold text-slate-900">
                  {planType === 'monthly' ? 'Full Monthly Course' : 'Trial Demo Session'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Batch:</span>
                <span className="font-medium text-slate-900">{activeBatch.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-extrabold text-emerald-600">{activeFeeText} (UPI Paid)</span>
              </div>
              {utrNumber && (
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
        )}

        {/* ============================================================== */}
        {/* STEP 2: UPI PAYMENT SCREEN (QR CODE + UPI DETAILS) */}
        {/* ============================================================== */}
        {step === 'payment' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Payment Header with Back button */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Details</span>
              </button>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  STEP 2 OF 2: PAYMENT
                </span>
                <span className="text-lg font-black text-blue-600 font-display">
                  {activeFeeText}
                </span>
              </div>
            </div>

            {/* Title & Order Summary Pill */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {currentCategory.title}
                </span>
                <span className="text-[11px] text-slate-500">
                  {selectedLevel} • {planType === 'monthly'
                    ? (isGymnastic ? '4 Days / Week (16 Sessions)' : 'Full Monthly Course')
                    : 'Trial Demo Session'} • {activeBatch.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700 block">{name}</span>
                <span className="text-[11px] text-blue-600 font-bold">{activeFeeText} Payable</span>
              </div>
            </div>

            {/* Main UPI QR Code Card (Clean White with Blue Accent) */}
            <div className="bg-gradient-to-b from-slate-50 to-slate-100/70 border-2 border-blue-500/40 rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg">
              {/* Payee Name & UPI ID Pill */}
              <div className="mb-3 space-y-1.5 flex flex-col items-center">
                <span className="text-lg sm:text-xl font-black text-slate-900 tracking-wide">
                  {upiPayee}
                </span>
                <div className="inline-flex items-center gap-1.5 bg-white border border-slate-300 px-3.5 py-1 rounded-full text-xs font-mono font-semibold text-slate-800 shadow-xs">
                  <span>{studioUpiId}</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="relative bg-white p-3 rounded-2xl shadow-md border border-slate-200 my-2 group">
                <div className="bg-white p-2.5 rounded-xl overflow-hidden relative">
                  <img
                    src={qrCodeImageUrl}
                    alt={`UPI QR Code - ${upiPayee} (${studioUpiId})`}
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                    loading="eager"
                  />
                  {/* Central Emblem Badge - PhonePe */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-9 h-9 rounded-full bg-[#5f259f] border-2 border-white shadow-md flex items-center justify-center">
                      <span className="text-white font-extrabold text-sm select-none">पे</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scan to pay caption */}
              <span className="text-[11px] font-bold text-slate-700 tracking-wider uppercase mt-1">
                Scan to pay with any UPI app
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Google Pay • PhonePe • Paytm • FamApp • BHIM
              </span>

              {/* Amount reminder under QR */}
              <div className="mt-2.5 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full flex items-center gap-2">
                <span className="text-xs text-slate-600 font-semibold">Payable:</span>
                <span className="text-blue-700 text-sm font-extrabold">{activeFeeText}</span>
              </div>

              {/* Direct UPI Apps Link Button (Mobile Users) - Blue */}
              <div className="mt-3.5 w-full flex flex-wrap items-center justify-center gap-2">
                <a
                  href={upiPayUrl}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Open in UPI App (Pay {activeFeeText})</span>
                </a>
              </div>

              {/* Copy UPI ID Row */}
              <div className="mt-3 w-full max-w-sm flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs shadow-xs">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-500">UPI ID (Tap to copy):</span>
                  <span className="font-mono font-bold text-slate-800 select-all">{studioUpiId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border border-slate-200"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
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
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99] shadow-xl shadow-emerald-600/30 cursor-pointer border border-emerald-500/40"
            >
              <Send className="w-4 h-4 text-white" />
              <span>DONE — BOOK &amp; SEND NOTIFICATION ({activeFeeText})</span>
            </button>

            {/* Security Guarantee Notice */}
            <div className="flex items-center justify-center gap-2 text-center text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
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
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight flex items-baseline gap-2">
                  <span>
                    {currentCategory.title}
                  </span>
                </h2>
              </div>
            </div>

            {/* 1. SELECT DANCE PROGRAM */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  1. SELECT DANCE PROGRAM
                </label>
                <span className="text-[10px] text-blue-600 font-mono font-bold">
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
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none appearance-none cursor-pointer transition-colors shadow-xs"
                >
                  {activeCategories.map((program) => {
                    const isSpec = ['home-service', 'private-class', 'wedding-choreography'].includes(program.id);
                    return (
                      <option key={program.id} value={program.id} className="bg-white text-slate-900">
                        {program.title} {isSpec ? (program.id === 'private-class' ? '(Studio: ₹549 | Home: ₹849)' : `(Package: ${program.demoPrice || program.monthlyFee})`) : `(Demo: ${program.demoPrice || '₹49'} | Monthly: ${getMonthlyPriceText(program.monthlyFee)})`}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  ▼
                </div>
              </div>
            </div>

            {/* 2. CHOOSE PLAN OR DIRECT PACKAGE SELECTION */}
            {isSpecialCategory ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    {isHomeService ? '2. SELECT HOME SERVICE PACKAGE' : '2. SELECT PACKAGE'}
                  </label>
                  <span className="text-xs font-black text-blue-600 font-display">
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

                          {batch.days && (
                            <span className="text-xs text-blue-600 font-semibold mb-2 block">
                              {batch.days}
                            </span>
                          )}

                          <div className="space-y-1.5 my-2.5">
                            {batch.schedules.map((schedule, sIdx) => (
                              <p key={sIdx} className="text-xs text-slate-600 flex items-start gap-1.5 leading-snug">
                                <span className="text-blue-600 font-bold shrink-0">•</span>
                                <span>{schedule}</span>
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-baseline justify-between">
                          <span className="text-xs text-slate-500">Total Fee:</span>
                          <span className="text-xl font-black text-blue-600 font-display">
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
                {/* Standard Categories: 2. SELECT COURSE PLAN */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    2. CHOOSE YOUR PLAN (TRIAL OR MONTHLY COURSE)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Plan A: Trial Demo Session ₹49 */}
                    <div
                      onClick={() => setPlanType('demo')}
                      className={`rounded-2xl p-4 transition-all border cursor-pointer relative flex flex-col justify-between ${
                        planType === 'demo'
                          ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Trial Demo Class
                        </span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          planType === 'demo' ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                        }`}>
                          {planType === 'demo' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug">
                        Experience the studio ambiance, meet coaches &amp; try 1 full class.
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-500">Trial Fee:</span>
                        <span className="text-xl font-extrabold text-blue-600 font-display">
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
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                            {isGymnastic ? (activeBatch?.name || '4 Days / Week') : 'Monthly Course'}
                          </span>
                          {((isGymnastic && (activeBatch?.badge === 'POPULAR' || !activeBatch?.badge)) || (!isGymnastic)) && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          planType === 'monthly' ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                        }`}>
                          {planType === 'monthly' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug">
                        {isGymnastic
                          ? (activeBatch?.name === '2 Days / Week'
                              ? 'Full total 8 sessions comprehensive training with stage & certificate track.'
                              : activeBatch?.name === '3 Days / Week'
                              ? 'Full total 12 sessions comprehensive training with stage & certificate track.'
                              : 'Full total 16 sessions comprehensive training with stage & certificate track.')
                          : 'Full 12 sessions comprehensive training with stage & certificate track.'}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-500">
                          {isGymnastic ? 'Plan Fee:' : 'Course Fee:'}
                        </span>
                        <span className="text-xl font-extrabold text-blue-600 font-display">
                          {activeBatch?.price || monthlyPriceText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. SELECT LEVEL */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      3. SELECT LEVEL
                    </label>
                    <span className="text-[10px] text-blue-600 font-semibold uppercase">
                      {selectedLevel}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {['Level 1', 'Level 2', 'Level 3'].map((lvl) => {
                      const isSelected = selectedLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSelectedLevel(lvl)}
                          className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20 text-slate-900 font-bold'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-700 hover:border-slate-300 font-medium'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold">{lvl}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. SELECT TIMINGS */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      4. SELECT TIMINGS
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
                              ? 'border-red-200 bg-red-50/60 opacity-80 cursor-not-allowed text-red-900'
                              : isSelected
                              ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 cursor-pointer shadow-sm text-slate-900'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300 cursor-pointer text-slate-800'
                          }`}
                        >
                          <div className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span>{batch.name}</span>
                              {batch.days && (
                                <span className="text-[10px] text-slate-500 font-normal">
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
                                <span className="text-[11px] font-extrabold text-blue-700 bg-blue-100/80 border border-blue-200 px-2 py-0.5 rounded-full">
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
                          <div className="space-y-1 text-slate-600">
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
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  YOUR FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  MOBILE NUMBER *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors shadow-xs"
                />
              </div>
            </div>

            {/* 5. PREFERRED DATE INPUT */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                PREFERRED STARTING DATE (OPTIONAL)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition-colors shadow-xs [color-scheme:light]"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="text-red-600 text-xs font-semibold">{errorMessage}</p>
            )}

            {/* 6. PROCEED TO UPI PAYMENT BUTTON (Blue as requested!) */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99] shadow-lg shadow-blue-600/30 cursor-pointer border border-blue-500/40"
            >
              <CreditCard className="w-4 h-4 text-white" />
              <span>PROCEED TO UPI PAYMENT ({activeFeeText})</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            {/* 7. PREFER CALLING FOOTER */}
            <div className="text-center pt-1">
              <a
                href={`tel:${studioInfo.phone}`}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Prefer calling? {studioInfo.phoneDisplay}</span>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
