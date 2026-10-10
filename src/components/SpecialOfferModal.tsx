import React, { useState } from 'react';
import {
  X,
  Flame,
  Clock,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Send,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { studioInfo } from '../data/danceData';
import { CategoryItem } from '../data/categoriesData';
import { openRazorpayCheckout } from '../utils/razorpayClient';

interface SpecialOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: CategoryItem[];
}

// 1-Hour Time Slots between 11:00 AM and 3:00 PM
const TIME_SLOTS = [
  '11:00 AM – 12:00 PM',
  '12:00 PM – 01:00 PM',
  '01:00 PM – 02:00 PM',
  '02:00 PM – 03:00 PM',
];

// Available days (Monday to Friday)
const WEEK_DAYS = [
  { id: 'Mon', label: 'Monday', short: 'Mon' },
  { id: 'Tue', label: 'Tuesday', short: 'Tue' },
  { id: 'Wed', label: 'Wednesday', short: 'Wed' },
  { id: 'Thu', label: 'Thursday', short: 'Thu' },
  { id: 'Fri', label: 'Friday', short: 'Fri' },
];

// Eligible Dance Styles for 30% OFF offer
const DANCE_STYLES = [
  'Beginner',
  'Advance',
  'Bollywood Ladies',
];

export const SpecialOfferModal: React.FC<SpecialOfferModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Wizard steps: 'form' | 'payment' | 'success'
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');

  // Client form data
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('Beginner');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0]);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [utrNumber, setUtrNumber] = useState('');

  // UI state
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState('');
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [verifiedPaymentId, setVerifiedPaymentId] = useState('');
  const [lastTraceId, setLastTraceId] = useState('');

  if (!isOpen) return null;

  // Toggle day selection (Strict limit of 3 days from Monday to Friday)
  const handleToggleDay = (dayId: string) => {
    setErrorMessage('');
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) {
        setErrorMessage('Please select at least 1 day (choose exactly 3 days).');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      if (selectedDays.length >= 3) {
        setErrorMessage('You can choose maximum 3 days for this special offer course.');
        return;
      }
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  // Preset day combinations for quick selection
  const handleApplyPresetDays = (preset: string[]) => {
    setErrorMessage('');
    setSelectedDays(preset);
  };

  // UPI payment details
  const studioUpiId = studioInfo.upiId || '8340158178@ybi';
  const upiPayee = studioInfo.upiPayeeName || 'RAM SINGH BABLU';
  const offerAmount = 899;
  const regularAmount = 1549;
  const upiPayNote = `Special 30% Off Offer - ${selectedCourse}`;
  const upiPayUrl = `upi://pay?pa=${studioUpiId}&pn=${encodeURIComponent(upiPayee)}&am=${offerAmount}&cu=INR&tn=${encodeURIComponent(upiPayNote)}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(upiPayUrl)}`;

  const handleCopyUpi = () => {
    try {
      navigator.clipboard.writeText(studioUpiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Step 1: Validate selections and proceed to Payment
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
    if (selectedDays.length !== 3) {
      setErrorMessage('Please select exactly 3 days from Monday to Friday for this offer.');
      return;
    }
    if (!selectedTimeSlot) {
      setErrorMessage('Please select a 1-hour time slot between 11:00 AM and 3:00 PM.');
      return;
    }
    setErrorMessage('');
    setStep('payment');
  };

  // Launch Official Razorpay Payment Gateway for ₹899 Special Offer
  const handleInitiateRazorpay = () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    setErrorMessage('');
    setPaymentError('');
    setIsProcessingPayment(true);

    const chosenDaysNames = WEEK_DAYS.filter((d) => selectedDays.includes(d.id))
      .map((d) => d.short)
      .join(', ');
    const batchSummary = `Special Offer (11AM-3PM) — ${chosenDaysNames} at ${selectedTimeSlot}`;

    openRazorpayCheckout({
      studentName: name.trim(),
      studentPhone: cleanPhone,
      programId: 'special-offer',
      programName: `${selectedCourse} (Special 30% Off Offer)`,
      planType: 'special_offer',
      batchDetails: batchSummary,
      preferredDate: startDate || undefined,
      preferredTime: selectedTimeSlot,
      onSuccess: (result) => {
        setIsProcessingPayment(false);
        setIsPaymentConfirmed(true);
        setVerifiedPaymentId(result.paymentId);
        setUtrNumber(result.paymentId);
        if (result.traceId) setLastTraceId(result.traceId);
        if (result.whatsappUrl) {
          setLastWhatsAppUrl(result.whatsappUrl);
          try {
            window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
          } catch {}
        }
        setStep('success');
      },
      onFailure: (errMsg, traceId) => {
        setIsProcessingPayment(false);
        setPaymentError(errMsg);
        if (traceId) setLastTraceId(traceId);
      },
      onClose: () => {
        setIsProcessingPayment(false);
      },
    });
  };

  const handleCheckVerificationStatus = async () => {
    const checkId = verifiedPaymentId || lastTraceId;
    if (!checkId) {
      setPaymentError('No active transaction reference found to verify. Please proceed with payment.');
      return;
    }
    setIsProcessingPayment(true);
    setPaymentError('');
    try {
      const res = await fetch(`/api/payment/verify-or-status?orderId=${encodeURIComponent(checkId)}`);
      const data = await res.json();
      if (data.status === 'SUCCESS' || data.success) {
        if (data.whatsappUrl) setLastWhatsAppUrl(data.whatsappUrl);
        setVerifiedPaymentId(data.paymentId || checkId);
        setUtrNumber(data.paymentId || checkId);
        setIsPaymentConfirmed(true);
        setStep('success');
        return;
      }
      setPaymentError(`Order status: ${data.status || 'PENDING'}. If amount was debited, payment will auto-sync in 5 minutes.`);
    } catch {
      setPaymentError('Network check failed. Please check internet connection.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Step 2: Confirm Payment and trigger WhatsApp message
  const handleConfirmAndSendWhatsApp = () => {
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setPaymentError('⚠️ Payment First! Pehle QR code scan karke ₹899 payment complete karein aur apna 12-digit UTR No. enter karein.');
      return;
    }
    setPaymentError('');

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const chosenDaysNames = WEEK_DAYS.filter((d) => selectedDays.includes(d.id))
      .map((d) => d.label)
      .join(', ');
    const chosenStartDate = startDate ? startDate : 'Flexible / Earliest available batch';

    const paymentDateStr = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const txnId = verifiedPaymentId || utrNumber.trim() || 'UPI_ONLINE_VERIFIED';

    const formattedMessage =
`🎉 *NEW ADMISSION & PAYMENT CONFIRMATION* 🎉
🏢 *RAMY'S DANCE STUDIO — RANCHI*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *STATUS:* SEAT RESERVED & PAYMENT CONFIRMED

💳 *TRANSACTION RECEIPT (PAID):*
• *Payment Status:* ✅ SUCCESS & RECEIVED
• *Transaction / UTR ID:* ${txnId}
• *Amount Paid:* ₹${offerAmount} INR (30% Discount Applied, Saved ₹650)
• *Transaction Time:* ${paymentDateStr}
${lastTraceId ? `• *Security Trace ID:* #${lastTraceId}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎟️ *BOOKING & ADMISSION DETAILS:*
• *Dance Style:* ${selectedCourse}
• *Special Package:* Flexible Afternoon Batch (11:00 AM – 3:00 PM)
• *Chosen Days (3 Days/Week):* ${chosenDaysNames}
• *Daily Time Slot:* ${selectedTimeSlot}
• *Preferred Starting Date:* ${chosenStartDate}
• *Total Sessions:* 12 Sessions (1 Month Course)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *STUDENT INFORMATION:*
• *Full Name:* ${name.trim()}
• *Mobile / WhatsApp:* +91 ${cleanPhone}

📍 *STUDIO BRANCH & CONTACT:*
🏢 *Address:* 2nd Floor, Above Reliance Smart Point, Plaza Chowk, Old H.B. Road, Ranchi – 834001
📞 *Director / Support:* Ramyyy Singh (+91 8340158178)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 *ADMIN ACTION:*
Payment received. Special afternoon batch slot reserved. Please acknowledge & send orientation guidelines! ✨`;

    const whatsappUrl = `https://wa.me/${studioInfo.whatsappNumber}?text=${encodeURIComponent(formattedMessage)}`;
    setLastWhatsAppUrl(whatsappUrl);
    setStep('success');

    // Automatically open WhatsApp in new tab
    try {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Handled by direct button on success screen
    }

    // Save lead to local server database
    try {
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          category: selectedCourse,
          batch: `Special Offer (11AM-3PM) — ${chosenDaysNames} at ${selectedTimeSlot}`,
          date: chosenStartDate,
          startDate: chosenStartDate,
          time: selectedTimeSlot,
          fee: `₹${offerAmount}`,
          paymentStatus: 'Special Offer Booking (₹899)',
          utrNumber: utrNumber.trim(),
          submittedAt: new Date().toISOString(),
        }),
      }).catch(() => {});
    } catch {}
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="special-offer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      {/* Click outside backdrop to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Modal Card */}
      <div
        className="relative max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 my-auto z-10 animate-in zoom-in-95 duration-200 text-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner with Gradient */}
        <div className="relative bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white p-5 sm:p-6 select-none overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 hover:bg-black/35 text-white/90 hover:text-white transition-all cursor-pointer backdrop-blur-xs"
            title="Close offer modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Tag */}
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-pulse" />
            <span>Limited Afternoon Flexi-Offer</span>
            <span className="bg-amber-300 text-neutral-950 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
              SAVE ₹650
            </span>
          </div>

          <h2
            id="special-offer-modal-title"
            className="text-xl sm:text-2xl font-black font-display tracking-tight text-white leading-tight"
          >
            Special 30% OFF Dance Course
          </h2>

          <p className="mt-1 text-white/90 text-xs sm:text-sm font-medium">
            Choose your flexible 3 days &amp; preferred 1-hour slot between 11:00 AM – 3:00 PM.
          </p>

          {/* Price Tag Row */}
          <div className="mt-3.5 flex items-center gap-3 bg-black/25 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-white/20 w-fit">
            <div className="flex items-baseline gap-2">
              <span className="text-white/60 line-through text-sm sm:text-base font-semibold">
                ₹{regularAmount}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
                ₹{offerAmount}
              </span>
              <span className="text-xs text-white/90 font-medium">
                / Full Month (12 Sessions)
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: Form & Custom Selection */}
          {step === 'form' && (
            <form onSubmit={handleProceedToPayment} className="space-y-5">
              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold animate-in shake">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* 1. Dance Style Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                  1. Select Dance Style / Program
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DANCE_STYLES.map((style) => {
                    const isSelected = selectedCourse === style;
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setSelectedCourse(style)}
                        className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-sm shadow-blue-500/30'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100'
                        }`}
                      >
                        {style}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Days Selection (Monday to Friday, choose 3 days) */}
              <div className="pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-600" />
                    <span>2. Choose Flexible 3 Days (Mon to Fri)</span>
                  </label>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      selectedDays.length === 3
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Selected: {selectedDays.length} / 3 Days
                  </span>
                </div>

                {/* Days Toggle Chips */}
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {WEEK_DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleToggleDay(day.id)}
                        className={`py-2.5 sm:py-3 px-1 rounded-xl text-center border font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100'
                        }`}
                      >
                        <span className="block font-black">{day.short}</span>
                        <span className="block text-[10px] font-normal opacity-75 hidden xs:block">
                          {day.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Presets for 1-Click Convenience */}
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-neutral-400 font-medium">Quick options:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetDays(['Mon', 'Wed', 'Fri'])}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors"
                  >
                    Mon, Wed, Fri
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetDays(['Tue', 'Thu', 'Fri'])}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors"
                  >
                    Tue, Thu, Fri
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetDays(['Wed', 'Thu', 'Fri'])}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors"
                  >
                    Wed, Thu, Fri
                  </button>
                </div>
              </div>

              {/* 3. Preferred 1-Hour Time Slot (11 AM to 3 PM) */}
              <div className="pt-2 border-t border-neutral-100">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Choose 1-Hour Time Slot (11 AM – 3 PM)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`p-2.5 rounded-xl border text-left font-bold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-[#0066FF] text-[#0066FF] shadow-xs'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0066FF]' : 'text-neutral-400'}`} />
                          <span>{slot}</span>
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#0066FF]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Student / Client Details */}
              <div className="pt-2 border-t border-neutral-100 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  4. Your Contact Details
                </label>

                <div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name *"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="WhatsApp Mobile Number (10 digits) *"
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1 flex items-center justify-between">
                    <span>Preferred Starting Date (Optional)</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Choose when to start</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all font-medium bg-white text-neutral-800 cursor-pointer"
                  />
                </div>
              </div>

              {/* Offer Summary & Action Button */}
              <div className="pt-3 border-t border-neutral-100">
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-extrabold text-amber-800 block">
                      Total Course Fee (Monthly)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-500 line-through mr-1.5 font-medium">
                      ₹{regularAmount}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-neutral-950 font-display">
                      ₹{offerAmount}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-rose-600/30 hover:shadow-rose-600/50 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>BOOK YOUR APPOINTMENT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-neutral-500 mt-2">
                  🔒 100% Safe UPI Payment &amp; Instant WhatsApp Confirmation
                </p>
              </div>
            </form>
          )}

          {/* STEP 2: Payment Screen with Live QR Code & UPI Details */}
          {step === 'payment' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to selections</span>
                </button>
                <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase">
                  Step 2: Pay ₹{offerAmount}
                </span>
              </div>

              {/* Payment Summary Box */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-neutral-950 text-sm">{selectedCourse} (Afternoon Offer)</h3>
                    <p className="text-xs text-neutral-600">
                      {WEEK_DAYS.filter((d) => selectedDays.includes(d.id)).map((d) => d.short).join(', ')} • {selectedTimeSlot}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-[#0066FF] font-display">₹{offerAmount}</span>
                    <span className="block text-[10px] text-neutral-500 line-through">₹{regularAmount}</span>
                  </div>
                </div>
                <div className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-200/80 flex items-center justify-between flex-wrap gap-1">
                  <span>Student: <strong>{name}</strong></span>
                  <span>Phone: <strong>{phone}</strong></span>
                  {startDate && <span>Start: <strong>{startDate}</strong></span>}
                </div>
              </div>

              {/* Official Razorpay Gateway Card for Special Offer */}
              <div className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-white via-rose-50/20 to-amber-50/20 border-2 border-rose-300 shadow-md text-center space-y-4">
                <div className="flex items-center gap-1.5 bg-rose-100/90 border border-rose-200 px-3 py-1 rounded-full text-xs font-black text-rose-800 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>Official Razorpay Payment Gateway</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xl sm:text-2xl font-black text-neutral-950 font-display block">
                    Pay ₹{offerAmount} Securely
                  </span>
                  <p className="text-xs sm:text-sm text-neutral-600 max-w-sm mx-auto">
                    Instant automated seat confirmation via UPI (Google Pay, PhonePe, Paytm, BHIM), Debit/Credit Cards &amp; NetBanking.
                  </p>
                </div>

                {/* Supported Payment Badges */}
                <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-3 shadow-xs flex items-center justify-around gap-2 text-neutral-700">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-neutral-900">UPI</span>
                    <span className="text-[10px] text-neutral-500 font-medium">GPay • PhonePe</span>
                  </div>
                  <div className="h-6 w-px bg-neutral-200" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-neutral-900">CARDS</span>
                    <span className="text-[10px] text-neutral-500 font-medium">Visa • RuPay</span>
                  </div>
                  <div className="h-6 w-px bg-neutral-200" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-neutral-900">NETBANKING</span>
                    <span className="text-[10px] text-neutral-500 font-medium">50+ Banks</span>
                  </div>
                </div>

                {/* Primary Gateway Trigger Button */}
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleInitiateRazorpay}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black text-sm sm:text-base shadow-xl shadow-rose-600/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Launching Secure Razorpay Gateway...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>PAY ₹{offerAmount} SECURELY VIA RAZORPAY</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Payment Error Alert / Failure Recovery with Trace ID */}
                {paymentError && (
                  <div className="w-full p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs sm:text-sm font-semibold text-left space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 font-black text-base shrink-0">⚠️</span>
                      <div>
                        <span className="font-extrabold block text-amber-950">Payment Status / Notice</span>
                        <span>{paymentError}</span>
                        {lastTraceId && (
                          <span className="block mt-1 font-mono text-[11px] text-amber-800">
                            Transaction Trace ID: <strong>#{lastTraceId}</strong> (auto-reconciling in 5 min)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={handleCheckVerificationStatus}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        Check Verification Status
                      </button>
                    </div>
                  </div>
                )}

                {/* Security Guarantee Notice */}
                <div className="flex items-center justify-center gap-2 text-center text-xs text-neutral-500 font-medium pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>256-Bit SSL Encrypted • PCI-DSS Compliant • WhatsApp Notification Unlocks After Payment</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Success Screen */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-neutral-950 font-display">
                  Registration Received!
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-sm mx-auto">
                  Aapki Special 30% OFF Afternoon Slot booking receipt generate ho gayi hai.
                </p>
              </div>

              {/* Receipt Summary */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 text-left text-xs space-y-1.5 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Program:</span>
                  <span className="font-bold text-neutral-900">{selectedCourse}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Days:</span>
                  <span className="font-bold text-neutral-900">
                    {WEEK_DAYS.filter((d) => selectedDays.includes(d.id)).map((d) => d.short).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Timing:</span>
                  <span className="font-bold text-neutral-900">{selectedTimeSlot}</span>
                </div>
                {startDate && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Starting Date:</span>
                    <span className="font-bold text-neutral-900">{startDate}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-neutral-200">
                  <span className="text-neutral-500">Offer Fee:</span>
                  <span className="font-black text-emerald-600 text-sm">₹{offerAmount} (Saved ₹650)</span>
                </div>
              </div>

              {/* Direct WhatsApp Open Button (In case popup was blocked) */}
              {lastWhatsAppUrl && (
                <div className="pt-2">
                  <a
                    href={lastWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4 fill-white" />
                    <span>Open in WhatsApp</span>
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="block mx-auto text-xs text-neutral-500 hover:text-neutral-800 font-semibold pt-2"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
