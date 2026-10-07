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
    <div className="bg-[#F9F6F0] text-[#261C14] min-h-[calc(100vh-5rem)] flex flex-col justify-between">
      {/* Fancy Coming Soon Hero Section (Clean, Luxury, Zero Product Pictures) */}
      <section className="relative overflow-hidden pt-12 pb-14 sm:pt-20 sm:pb-20 border-b border-[#D5C8B9]/60">
        {/* Subtle decorative atmospheric background blurs */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-24 w-[36rem] h-[36rem] rounded-full bg-[#EFE6DC]/70 blur-3xl pointer-events-none" />

        <div className="page-shell relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#9E582E]/10 border border-[#9E582E]/30 text-[#9E582E] text-xs font-serif font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#9E582E] animate-pulse" />
            <span>A Taste of Tradition · South Africa</span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-[0.98] text-[#261C14] tracking-tight">
            Website Coming Soon.
          </h1>

          <p className="font-serif italic text-lg sm:text-2xl text-[#9E582E] font-medium">
            Something truly artisanal is in the oven.
          </p>

          <p className="max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-[#736254]">
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
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-[#261C14] bg-[#EEE6DC] hover:bg-[#E5DACE] border border-[#D5C8B9] transition-colors active:scale-95"
            >
              <Lock className="w-4 h-4 text-[#9E582E]" />
              <span>Merchant Portal Login</span>
            </button>
          </div>

          {/* Heritage Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-6 border-t border-[#D5C8B9]/80 text-xs font-semibold uppercase tracking-[0.16em] text-[#261C14]">
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
            <span className="flex items-center gap-2 text-[#736254]">
              <span className="w-2 h-2 rounded-full bg-[#9E582E]" />
              <span>Fresh Daily Bakery Distribution</span>
            </span>
          </div>
        </div>
      </section>

      {/* Fancy Executive Contact Card (Requested by user) */}
      <section className="py-14 sm:py-20 bg-[#F9F6F0]">
        <div className="page-shell max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="eyebrow">Direct Contact & Wholesale Desk</span>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl text-[#261C14]">
              Connect With Us
            </h2>
            <p className="mt-2 text-sm text-[#736254]">
              Direct assistance for wholesale orders, merchant account queries, and delivery schedules.
            </p>
          </div>

          {/* Master Contact Card */}
          <div className="bg-[#201713] text-[#F9F6F0] rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-[#C98A5B]/40 relative overflow-hidden">
            {/* Subtle corner luxury gradient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#C98A5B]/20 to-transparent blur-2xl pointer-events-none" />

            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
              {/* Left Column: Direct Communication Channels */}
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DE9E74]/15 border border-[#DE9E74]/30 text-[#DE9E74] text-xs font-serif font-bold uppercase tracking-wider mb-2.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Savouré Central Office</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl text-white">
                    Wholesale & Inquiries
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-[#F9F6F0]/70 leading-relaxed">
                    Our team is available daily for orders, pricing inquiries, and distribution logistics.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  {/* WhatsApp Direct Action */}
                  <a
                    href={SHOWCASE_CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#2A1E18] hover:bg-[#34261F] border border-[#DE9E74]/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-md shrink-0">
                        <MessageCircle className="w-5 h-5 fill-white stroke-[#25D366]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-serif uppercase tracking-wider text-[#DE9E74] font-bold block">
                          WhatsApp Direct
                        </span>
                        <span className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {SHOWCASE_CONTACT.phone}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-700/50">
                      Message →
                    </span>
                  </a>

                  {/* Phone Call */}
                  <a
                    href={SHOWCASE_CONTACT.phoneHref}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#2A1E18] hover:bg-[#34261F] border border-[#DE9E74]/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#9E582E] text-white flex items-center justify-center shadow-md shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-serif uppercase tracking-wider text-[#DE9E74] font-bold block">
                          Telephone Call
                        </span>
                        <span className="text-sm sm:text-base font-bold text-white group-hover:text-[#DE9E74] transition-colors">
                          {SHOWCASE_CONTACT.phone}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#DE9E74] group-hover:translate-x-1 transition-transform">
                      Call Desk →
                    </span>
                  </a>

                  {/* Email Channels */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-[#2A1E18] border border-[#DE9E74]/30 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#3E2C22] text-[#DE9E74] flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-serif uppercase tracking-wider text-[#DE9E74] font-bold block">
                          Email Communications
                        </span>
                        <a
                          href={SHOWCASE_CONTACT.emailHref}
                          className="text-xs sm:text-sm font-semibold text-white hover:text-[#DE9E74] transition-colors block"
                        >
                          {SHOWCASE_CONTACT.email}
                        </a>
                      </div>
                    </div>
                    <div className="pl-13 text-[11px] text-[#F9F6F0]/60">
                      Wholesale Desk: <a href={`mailto:${SHOWCASE_CONTACT.alternateEmail}`} className="text-[#DE9E74] hover:underline">{SHOWCASE_CONTACT.alternateEmail}</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Quick WhatsApp Enquiry Sender */}
              <div className="bg-[#19110D] border border-[#C98A5B]/30 rounded-2xl p-5 sm:p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-serif uppercase tracking-wider text-[#DE9E74] font-bold">
                      Direct WhatsApp Dispatch
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800">
                      Live
                    </span>
                  </div>

                  <form onSubmit={handleSendWhatsAppEnquiry} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-[#F9F6F0]/80 mb-1">
                        Your Name / Business Name
                      </label>
                      <input
                        type="text"
                        required
                        value={enquiryName}
                        onChange={(e) => setEnquiryName(e.target.value)}
                        placeholder="e.g. Tariq Patel"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#241913] border border-[#3E2C22] rounded-xl text-white placeholder-[#736254] focus:outline-none focus:border-[#C98A5B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#F9F6F0]/80 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        value={enquiryPhone}
                        onChange={(e) => setEnquiryPhone(e.target.value)}
                        placeholder="e.g. 082 123 4567"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#241913] border border-[#3E2C22] rounded-xl text-white placeholder-[#736254] focus:outline-none focus:border-[#C98A5B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#F9F6F0]/80 mb-1">
                        Enquiry Type
                      </label>
                      <select
                        value={enquiryProduct}
                        onChange={(e) => setEnquiryProduct(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-[#241913] border border-[#3E2C22] rounded-xl text-white focus:outline-none focus:border-[#C98A5B]"
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
                      <label className="block text-xs font-medium text-[#F9F6F0]/80 mb-1">
                        Message / Order Note
                      </label>
                      <textarea
                        rows={2}
                        value={enquiryMessage}
                        onChange={(e) => setEnquiryMessage(e.target.value)}
                        placeholder="Tell us what you need or ask for current wholesale rate cards..."
                        className="w-full px-3.5 py-2 text-xs bg-[#241913] border border-[#3E2C22] rounded-xl text-white placeholder-[#736254] focus:outline-none focus:border-[#C98A5B] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C98A5B] to-[#DE9E74] hover:from-[#B87A4D] hover:to-[#CD8E66] text-[#14100D] font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Direct via WhatsApp</span>
                    </button>
                  </form>
                </div>

                <div className="mt-4 pt-3 border-t border-[#3E2C22] text-[11px] text-[#F9F6F0]/50 text-center">
                  Minimum wholesale order: <strong className="text-[#DE9E74]">10 dozen / 10 packs</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
