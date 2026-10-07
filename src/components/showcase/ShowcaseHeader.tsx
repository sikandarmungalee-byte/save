import React from 'react';
import { MessageCircle, Lock } from 'lucide-react';
import { SHOWCASE_CONTACT } from './showcaseData';

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
  return (
    <header className="sticky top-0 z-50 border-b border-[#D5C8B9]/70 bg-[#F9F6F0]/95 backdrop-blur-md">
      <div className="page-shell flex h-20 items-center justify-between gap-4 lg:h-22">
        {/* Brand Wordmark (Clean, luxury typography, zero photos) */}
        <button
          onClick={() => onNavigate('home')}
          aria-label="Savouré home"
          className="shrink-0 text-left transition-opacity hover:opacity-90 flex items-center gap-3 group"
        >
          <div className="flex flex-col">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-[0.22em] text-[#261C14] uppercase">
              Savouré
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.28em] text-[#9E582E] font-semibold -mt-0.5">
              A Taste of Tradition
            </span>
          </div>
        </button>

        {/* Action Buttons: Direct WhatsApp & Merchant Login */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* WhatsApp Direct Action */}
          <a
            href={SHOWCASE_CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-all border border-emerald-200 shadow-2xs active:scale-95"
            title="Chat directly on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
            <span className="hidden sm:inline">WhatsApp</span>
            <span className="sm:hidden">Chat</span>
          </a>

          {/* Merchant Login Button */}
          <button
            onClick={onOpenMerchantLogin}
            className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-xs active:scale-95 ${
              currentTab === 'merchant-login'
                ? 'bg-[#261C14] text-white shadow-md'
                : 'text-[#261C14] bg-[#EEE6DC] hover:bg-[#E4D7C8] border border-[#C98A5B]/40'
            }`}
            title="Access Authorized Merchant Wholesale Portal"
          >
            <Lock className="w-3.5 h-3.5 text-[#9E582E]" />
            <span>Merchant Login</span>
          </button>
        </div>
      </div>
    </header>
  );
};
