import React, { useState } from 'react';
import {
  MessageCircle,
  Phone,
  Mail,
  Sparkles,
  ShieldCheck,
  Send,
  Building2,
  Lock,
  Check,
} from 'lucide-react';
import { SHOWCASE_CONTACT } from './showcaseData';

interface ShowcaseHomePageProps {
  onNavigate: (tab: string) => void;
}

export const ShowcaseHomePage: React.FC<ShowcaseHomePageProps> = ({ onNavigate }) => {
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryProduct, setEnquiryProduct] = useState('All Products (Wholesale Range)');
  const [enquiryMessage, setEnquiryMessage] = useState('');

  const handleSendWhatsAppEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Hello Savouré team,
Name: ${enquiryName || 'Prospective Wholesale Client'}
Phone: ${enquiryPhone || 'Not provided'}
Interested In: ${enquiryProduct}
Message: ${enquiryMessage || 'I would like to enquire about wholesale pricing and supply.'}`;
    const url = `https://wa.me/${SHOWCASE_CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white text-[#2B150A] min-h-[calc(100vh-5rem)] flex flex-col justify-between">
      {/* Fancy Coming Soon Hero Section (Clean, Luxury, Pure White Background) */}
      <section className="relative overflow-hidden pt-12 pb-14 sm:pt-20 sm:pb-20 border-b border-stone-200 bg-white">
        <div className="page-shell relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#CC8468]/10 border border-[#CC8468]/30 text-[#CC8468] text-xs font-serif font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#CC8468] animate-pulse" />
            <span>A Taste of Tradition · South Africa</span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-[0.98] text-[#2B150A] tracking-tight">
            Website Coming Soon.
          </h1>

          <p className="font-serif italic text-lg sm:text-2xl text-[#CC8468] font-medium">
            Something truly artisanal is in the oven.
          </p>

          <p className="max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-stone-600">
            We are curating an exquisite online home for Savouré. While our full digital showcase is being perfected, our bakery kitchens remain in full daily production of our beloved rotis, tortilla wraps, samoosa pastries, and spring roll sheets.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <a
              href={SHOWCASE_CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold tracking-wide text-white bg-[#25D366] hover:bg-[#20bd5a] transition-all shadow-md active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white stroke-[#25D366]" />
              <span>Chat on WhatsApp ({SHOWCASE_CONTACT.phone})</span>
            </a>

            <button
              onClick={() => onNavigate('merchant-login')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-[#391E0F] bg-white hover:bg-stone-50 border border-stone-200 hover:border-[#CC8468] transition-colors active:scale-95 shadow-xs"
            >
              <Lock className="w-4 h-4 text-[#CC8468]" />
              <span>Merchant Portal Login</span>
            </button>
          </div>

          {/* Heritage Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-6 border-t border-stone-200 text-xs font-semibold uppercase tracking-[0.16em] text-[#2B150A]">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <span>100% Vegan Options</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <span>Halal Certified</span>
            </span>
            <span className="flex items-center gap-2 text-stone-500">
              <span className="w-2 h-2 rounded-full bg-[#CC8468]" />
              <span>Fresh Daily Bakery Distribution</span>
            </span>
          </div>
        </div>
      </section>

      {/* Fancy Executive Contact Card (Clean White Surface with Luxury Copper & Brown Accents) */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="page-shell max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-serif uppercase tracking-widest text-[#CC8468] font-bold">Direct Contact & Wholesale Desk</span>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl text-[#2B150A]">
              Connect With Us
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Direct assistance for wholesale orders, merchant account queries, and delivery schedules.
            </p>
          </div>

          {/* Master Contact Card */}
          <div className="bg-white text-[#2B150A] rounded-3xl p-6 sm:p-10 shadow-lg border border-stone-200 relative overflow-hidden">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
              {/* Left Column: Direct Communication Channels */}
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-[#391E0F] text-xs font-serif font-bold uppercase tracking-wider mb-2.5">
                    <Building2 className="w-3.5 h-3.5 text-[#CC8468]" />
                    <span>Savouré Central Office</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl text-[#2B150A]">
                    Wholesale & Inquiries
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-stone-500 leading-relaxed">
                    Our team is available daily for orders, pricing inquiries, and distribution logistics.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  {/* WhatsApp Direct Action */}
                  <a
                    href={SHOWCASE_CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all group shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-md shrink-0">
                        <MessageCircle className="w-5 h-5 fill-white stroke-[#25D366]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-serif uppercase tracking-wider text-[#391E0F] font-bold block">
                          WhatsApp Direct
                        </span>
                        <span className="text-sm sm:text-base font-bold text-[#2B150A] group-hover:text-emerald-600 transition-colors">
                          {SHOWCASE_CONTACT.phone}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Message →
                    </span>
                  </a>

                  {/* Phone Call */}
                  <a
                    href={SHOWCASE_CONTACT.phoneHref}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all group shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#391E0F] text-white flex items-center justify-center shadow-md shrink-0">
                        <Phone className="w-4 h-4 text-[#E0A282]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-serif uppercase tracking-wider text-[#391E0F] font-bold block">
                          Telephone Call
                        </span>
                        <span className="text-sm sm:text-base font-bold text-[#2B150A] group-hover:text-[#CC8468] transition-colors">
                          {SHOWCASE_CONTACT.phone}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#391E0F] group-hover:translate-x-1 transition-transform">
                      Call Desk →
                    </span>
                  </a>

                  {/* Email Channels */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 text-[#391E0F] flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-[#CC8468]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-serif uppercase tracking-wider text-[#391E0F] font-bold block">
                          Email Communications
                        </span>
                        <a
                          href={SHOWCASE_CONTACT.emailHref}
                          className="text-xs sm:text-sm font-semibold text-[#2B150A] hover:text-[#CC8468] transition-colors block"
                        >
                          {SHOWCASE_CONTACT.email}
                        </a>
                      </div>
                    </div>
                    <div className="pl-13 text-[11px] text-stone-500">
                      Wholesale Desk: <a href={`mailto:${SHOWCASE_CONTACT.alternateEmail}`} className="text-[#391E0F] hover:underline font-medium">{SHOWCASE_CONTACT.alternateEmail}</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Quick WhatsApp Enquiry Sender */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 sm:p-7 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-serif uppercase tracking-wider text-[#391E0F] font-bold">
                      Direct WhatsApp Dispatch
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      Live
                    </span>
                  </div>

                  <form onSubmit={handleSendWhatsAppEnquiry} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-[#2B150A] mb-1">
                        Your Name / Business Name
                      </label>
                      <input
                        type="text"
                        required
                        value={enquiryName}
                        onChange={(e) => setEnquiryName(e.target.value)}
                        placeholder="e.g. Tariq Patel"
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-stone-200 rounded-xl text-[#2B150A] placeholder-stone-400 focus:outline-none focus:border-[#CC8468] shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#2B150A] mb-1">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        value={enquiryPhone}
                        onChange={(e) => setEnquiryPhone(e.target.value)}
                        placeholder="e.g. 082 123 4567"
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-stone-200 rounded-xl text-[#2B150A] placeholder-stone-400 focus:outline-none focus:border-[#CC8468] shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#2B150A] mb-1">
                        Enquiry Type
                      </label>
                      <select
                        value={enquiryProduct}
                        onChange={(e) => setEnquiryProduct(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-stone-200 rounded-xl text-[#2B150A] focus:outline-none focus:border-[#CC8468] shadow-2xs"
                      >
                        <option value="All Products (Wholesale Range)">Wholesale Bakery Range</option>
                        <option value="Roti (White & Brown Varieties)">Fresh Roti Supplies</option>
                        <option value="Tortilla Wraps (Small, Medium, Large)">Tortilla Wraps</option>
                        <option value="Samoosa Pastry Sheets">Samoosa Pastry Sheets</option>
                        <option value="Spring Roll Pastry Sheets">Spring Roll Pastry Sheets</option>
                        <option value="Merchant Account Registration">Merchant Account Registration</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#2B150A] mb-1">
                        Message / Order Note
                      </label>
                      <textarea
                        rows={2}
                        value={enquiryMessage}
                        onChange={(e) => setEnquiryMessage(e.target.value)}
                        placeholder="Tell us what you need or ask for current wholesale rate cards..."
                        className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl text-[#2B150A] placeholder-stone-400 focus:outline-none focus:border-[#CC8468] resize-none shadow-2xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5 text-[#E0A282]" />
                      <span>Send Direct via WhatsApp</span>
                    </button>
                  </form>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 text-[11px] text-stone-500 text-center">
                  Minimum wholesale order: <strong className="text-[#391E0F]">10 dozen / 10 packs</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
