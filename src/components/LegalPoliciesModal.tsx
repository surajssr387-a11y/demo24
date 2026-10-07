import React, { useState } from 'react';
import { X, ShieldCheck, FileText, RefreshCw, Truck, Phone, ChevronRight } from 'lucide-react';
import { studioInfo } from '../data/danceData';

export type PolicyType = 'terms' | 'privacy' | 'refund' | 'shipping' | 'contact';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  initialPolicy?: PolicyType;
  onClose: () => void;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  initialPolicy = 'terms',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PolicyType>(initialPolicy);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-policy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className="relative max-w-3xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 my-auto z-10 animate-in zoom-in-95 duration-200 text-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-neutral-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Policies &amp; Compliance</span>
            </div>
            <h2 id="legal-policy-modal-title" className="text-xl sm:text-2xl font-black font-display text-white">
              Ramy&apos;s Dance Studio Policies
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (5 Mandatory Razorpay Policies) */}
        <div className="bg-neutral-100 p-2 sm:p-3 border-b border-neutral-200 flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
            }`}
          >
            Terms &amp; Conditions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('refund')}
            className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
            }`}
          >
            Cancellation &amp; Refund
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'shipping'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
            }`}
          >
            Shipping &amp; Delivery
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
            }`}
          >
            Contact Us
          </button>
        </div>

        {/* Policy Content Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          {/* 1. TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-lg font-black text-neutral-950 font-display flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Terms and Conditions</span>
              </h3>
              <p className="text-neutral-500 text-xs">Last Updated: October 2026</p>
              
              <div className="space-y-3">
                <p>
                  Welcome to <strong>Ramy&apos;s Dance Studio</strong>. By registering for demo classes, full-time dance batches, gymnastics, or choreography sessions through our website, you agree to comply with the following terms and conditions:
                </p>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-neutral-900">1. Enrollment &amp; Attendance</h4>
                  <p>
                    • Registration fees for demo sessions (₹49) or monthly courses (₹899 – ₹1,950) reserve an exclusive batch slot at our studio.
                  </p>
                  <p>
                    • Students must arrive 10 minutes prior to their scheduled batch timing in proper dance/fitness attire and clean training shoes.
                  </p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-neutral-900">2. Safety &amp; Studio Decorum</h4>
                  <p>
                    • Our instructors take utmost care regarding warm-ups and injury prevention. Students are advised to notify trainers of any prior medical conditions or physical limitations.
                  </p>
                  <p>
                    • Studio discipline and mutual respect among students, parents, and instructors must be maintained at all times.
                  </p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-neutral-900">3. Fee Payments</h4>
                  <p>
                    • All online payments are securely processed via verified digital payment gateways (UPI, Cards, NetBanking). Receipts and admission confirmations are issued digitally via WhatsApp and SMS immediately upon payment success.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-lg font-black text-neutral-950 font-display flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Privacy Policy</span>
              </h3>
              <p className="text-neutral-500 text-xs">Last Updated: October 2026</p>

              <div className="space-y-3">
                <p>
                  At <strong>Ramy&apos;s Dance Studio</strong>, your privacy and personal data protection are our highest priorities. This Privacy Policy outlines what information we collect and how it is used.
                </p>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-neutral-900">1. Information We Collect</h4>
                  <p>
                    • When booking a demo class or enrolling in a course, we collect your Full Name, WhatsApp Mobile Number, preferred batch timings, and selected dance style.
                  </p>
                  <p>
                    • For payment processing, transactions are handled through PCI-DSS compliant secure gateways. We <strong>never</strong> store your credit/debit card numbers or UPI PINs.
                  </p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-neutral-900">2. How We Use Your Information</h4>
                  <p>
                    • To verify batch reservations, send instant digital enrollment receipts, and provide customer support via WhatsApp.
                  </p>
                  <p>
                    • We do <strong>not</strong> sell, rent, or trade student contact details with any third-party marketing companies.
                  </p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-neutral-900">3. Data Security &amp; Contact</h4>
                  <p>
                    • All data transmission on our website is encrypted using 256-bit SSL protocols. For questions regarding your personal information, reach out to us at <strong>+91 8340158178</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. CANCELLATION & REFUNDS */}
          {activeTab === 'refund' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-lg font-black text-neutral-950 font-display flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600" />
                <span>Cancellation and Refund Policy</span>
              </h3>
              <p className="text-neutral-500 text-xs">Last Updated: October 2026</p>

              <div className="space-y-3">
                <p>
                  We strive to ensure complete satisfaction for all our students and parents at <strong>Ramy&apos;s Dance Studio</strong>.
                </p>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-neutral-900">1. Demo Class Cancellation (₹49)</h4>
                  <p>
                    • If you cannot attend your scheduled demo class, you may request a reschedule or cancellation up to <strong>12 hours prior</strong> to the scheduled time by messaging us on WhatsApp (+91 8340158178).
                  </p>
                  <p>
                    • In case of cancellation, 100% of the demo fee will be refunded back to your original payment method within <strong>5 to 7 working days</strong>.
                  </p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-neutral-900">2. Monthly Course &amp; Special Offer Batches</h4>
                  <p>
                    • Students enrolled in monthly courses who face unavoidable emergencies before batch commencement can request a batch transfer or pause their sessions for up to 30 days.
                  </p>
                  <p>
                    • If a course is cancelled by the studio due to unforeseen operational circumstances, a full pro-rata refund will be processed promptly.
                  </p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-neutral-900">3. Refund Processing Timeline</h4>
                  <p>
                    • Approved refunds are credited directly to the customer&apos;s original bank account, UPI ID, or card within <strong>5–7 working days</strong> as per banking and payment gateway guidelines.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. SHIPPING & DELIVERY POLICY */}
          {activeTab === 'shipping' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-lg font-black text-neutral-950 font-display flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <span>Shipping and Delivery Policy (Service Fulfillment)</span>
              </h3>
              <p className="text-neutral-500 text-xs">Last Updated: October 2026</p>

              <div className="space-y-3">
                <p>
                  <strong>Ramy&apos;s Dance Studio</strong> provides premium educational dance coaching, fitness training, and choreography services. Because our offerings are studio-based educational services, delivery is conducted digitally and in-person:
                </p>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-neutral-900">1. Digital Delivery of Admission Pass</h4>
                  <p>
                    • Upon successful online payment, your booking confirmation, admission receipt, batch schedule, and studio access pass are delivered <strong>instantly (within 5 minutes)</strong> to your registered WhatsApp number and phone.
                  </p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <h4 className="font-bold text-neutral-900">2. Physical Service Fulfillment</h4>
                  <p>
                    • In-person classes and training sessions take place physically at our official studio venue:
                    <br />
                    <strong>2nd Floor, Metro Market, Opp. Vendor Market, Kutchery Road, Ranchi - 834002, Jharkhand</strong>.
                  </p>
                  <p>
                    • No physical goods are shipped via courier. All materials (welcome guidelines, badges, certificates) are handed over in person at the studio counter.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. CONTACT US */}
          {activeTab === 'contact' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-lg font-black text-neutral-950 font-display flex items-center gap-2">
                <Phone className="w-5 h-5 text-indigo-600" />
                <span>Contact Us</span>
              </h3>
              <p className="text-neutral-500 text-xs">Official Business &amp; Grievance Contact</p>

              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3">
                <div>
                  <span className="block text-xs font-bold text-neutral-500 uppercase">Operating Business Name</span>
                  <span className="font-bold text-neutral-950 text-base">Ramy&apos;s Dance Studio</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-neutral-500 uppercase">Founder &amp; Master Instructor</span>
                  <span className="font-bold text-neutral-950">Ramyyy Singh (DID &amp; IGT Finalist)</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-neutral-500 uppercase">Physical Studio Address</span>
                  <span className="font-medium text-neutral-800">{studioInfo.address}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
                  <div>
                    <span className="block text-xs font-bold text-neutral-500 uppercase">Phone &amp; WhatsApp</span>
                    <a href={`tel:${studioInfo.phone}`} className="font-black text-blue-600 hover:underline">
                      +91 {studioInfo.phoneDisplay}
                    </a>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-neutral-500 uppercase">Studio Timings</span>
                    <span className="font-medium text-neutral-800">{studioInfo.hours.weekdays}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Close Button */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
