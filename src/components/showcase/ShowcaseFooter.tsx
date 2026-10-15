import React from 'react';
import { ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { SHOWCASE_CONTACT } from './showcaseData';

interface ShowcaseFooterProps {
  onNavigate: (page: string) => void;
  onOpenEnquiryModal: () => void;
  onOpenAdmin: () => void;
}

export const ShowcaseFooter: React.FC<ShowcaseFooterProps> = ({
  onNavigate,
  onOpenEnquiryModal,
  onOpenAdmin,
}) => {
  return (
    <footer className="bg-[#3d2117] text-[#fff8f0] border-t border-[#2b150a]">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-16 lg:py-20 space-y-14">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <button
              onClick={() => onNavigate('home')}
              className="text-left cursor-pointer group"
            >
              <span className="font-serif text-3xl font-normal tracking-tight text-white block">
                Savouré
              </span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-[#d89368] font-semibold block mt-1">
                — A Taste of Tradition —
              </span>
            </button>

            <p className="text-xs sm:text-sm text-[#dfc4ae] leading-relaxed max-w-sm">
              Bringing the warmth of tradition to your table. Handcrafted roti, tortilla wraps, samosa pastry, and spring roll sheets made fresh daily with nationwide delivery across South Africa.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onOpenEnquiryModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#b86643] hover:bg-[#a55635] text-white text-[10px] font-bold uppercase tracking-[0.16em] transition-all cursor-pointer shadow-xs"
              >
                <span>Enquire now</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <a
                href={SHOWCASE_CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-[0.16em] transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp Desk</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#d89368] block">
              Navigation
            </span>
            <ul className="space-y-2 text-xs text-[#dfc4ae]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('products')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Our products
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  About us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('wholesale')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Wholesale & partnerships
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Contact & enquiries
                </button>
              </li>
            </ul>
          </div>

          {/* Stay in Touch & Contact info (No physical street address) */}
          <div className="md:col-span-4 space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#d89368] block">
              Wholesale desk
            </span>
            <div className="space-y-2 text-xs text-[#dfc4ae]">
              <div>
                <span className="text-stone-400 block text-[10px]">Direct Phone:</span>
                <a href={SHOWCASE_CONTACT.phoneHref} className="text-white hover:text-[#d89368] font-medium">
                  {SHOWCASE_CONTACT.phone}
                </a>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Email:</span>
                <a href={SHOWCASE_CONTACT.emailHref} className="text-white hover:text-[#d89368] font-medium">
                  {SHOWCASE_CONTACT.email}
                </a>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Distribution:</span>
                <span className="text-white font-medium">Nationwide Delivery Across South Africa</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Dispatch Hours:</span>
                <span>{SHOWCASE_CONTACT.operatingHours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Admin ERP button prominently in the footer */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <div className="flex items-center gap-3">
            <span>© 2026 Savouré. All rights reserved.</span>
            <span>·</span>
            <span className="italic font-serif text-[#d89368]">A taste of tradition.</span>
          </div>

          {/* Dedicated Administration Button in Footer */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-[#b86643] text-stone-200 hover:text-white border border-white/20 text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
              title="Access Enterprise ERP Administration"
            >
              <ShieldCheck className="w-4 h-4 text-[#d89368]" />
              <span>Admin ERP System</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
