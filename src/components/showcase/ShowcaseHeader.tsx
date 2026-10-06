import React, { useState } from 'react';
import { ArrowRight, Menu, X, MessageCircle, Lock } from 'lucide-react';
import { SHOWCASE_NAV_ITEMS, SHOWCASE_CONTACT } from './showcaseData';

interface ShowcaseHeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenMerchantLogin: () => void;
}

export const ShowcaseHeader: React.FC<ShowcaseHeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenMerchantLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#D5C8B9]/70 bg-[#F9F6F0]/95 backdrop-blur-md">
      <div className="page-shell flex h-20 items-center justify-between gap-5 lg:h-24">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('home')}
          aria-label="Savouré home"
          className="shrink-0 text-left transition-opacity hover:opacity-90"
        >
          <img
            src="/images/savoure/savoure-logo.png"
            alt="Savouré — A Taste of Tradition"
            className="h-14 w-32 object-contain lg:h-16 lg:w-40"
          />
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {SHOWCASE_NAV_ITEMS.map((item) => (
            <button
              key={item.to}
              onClick={() => onNavigate(item.to)}
              className={`nav-link text-sm font-semibold transition-colors ${
                currentTab === item.to
                  ? 'text-[#261C14] font-bold after:!right-0'
                  : 'text-[#736254] hover:text-[#261C14]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* WhatsApp Quick Button */}
          <a
            href={SHOWCASE_CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200"
            title="Chat directly on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
            <span>WhatsApp</span>
          </a>

          {/* Merchant Login Button on Top */}
          <button
            onClick={onOpenMerchantLogin}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold tracking-wide text-[#736254] hover:text-[#261C14] hover:bg-[#EEE6DC] transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-[#A85A2A]" />
            <span>Merchant login</span>
          </button>

          {/* Contact Button */}
          <button
            onClick={() => onNavigate('contact')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-semibold tracking-wide text-white bg-[#9E582E] hover:bg-[#854722] active:bg-[#703b1c] transition-all shadow-sm"
          >
            <span>Contact</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={onOpenMerchantLogin}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#A85A2A] bg-[#EEE6DC]"
          >
            <Lock className="w-3 h-3" />
            <span>Merchant</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="p-2 text-[#261C14] hover:bg-[#EEE6DC] rounded-md transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <nav className="border-t border-[#D5C8B9] bg-[#F9F6F0] px-5 py-5 lg:hidden animate-rise" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-lg flex-col divide-y divide-[#D5C8B9]/60">
            {SHOWCASE_NAV_ITEMS.map((item) => (
              <button
                key={item.to}
                onClick={() => {
                  onNavigate(item.to);
                  setMobileMenuOpen(false);
                }}
                className={`text-left py-3.5 text-base font-medium transition-colors ${
                  currentTab === item.to ? 'text-[#9E582E] font-bold' : 'text-[#261C14]'
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="pt-4 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  onOpenMerchantLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold text-[#261C14] bg-[#EEE6DC] hover:bg-[#E5DACE]"
              >
                <Lock className="w-4 h-4 text-[#A85A2A]" />
                <span>Merchant portal login</span>
              </button>

              <a
                href={SHOWCASE_CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp ({SHOWCASE_CONTACT.phone})</span>
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};
