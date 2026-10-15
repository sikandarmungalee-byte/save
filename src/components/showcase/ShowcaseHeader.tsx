import React from 'react';
import { MessageCircle, Lock, ShieldCheck } from 'lucide-react';
import { SHOWCASE_CONTACT } from './showcaseData';
import { useERP } from '../../context/ERPContext';

interface ShowcaseHeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenMerchantLogin: () => void;
  onOpenAdmin?: () => void;
}

export const ShowcaseHeader: React.FC<ShowcaseHeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenMerchantLogin,
  onOpenAdmin,
}) => {
  const { currentUser } = useERP();

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="page-shell flex h-20 items-center justify-between gap-4 lg:h-22">
        {/* Brand Wordmark (Clean, luxury typography, zero photos) */}
        <button
          onClick={() => onNavigate('home')}
          aria-label="Savouré home"
          className="shrink-0 text-left transition-opacity hover:opacity-90 flex items-center gap-3 group"
        >
          <div className="flex flex-col">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-[0.22em] text-[#2B150A] uppercase">
              Savouré
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.28em] text-[#CC8468] font-semibold -mt-0.5">
              A Taste of Tradition
            </span>
          </div>
        </button>

        {/* Action Buttons: Direct WhatsApp, ERP Administration & Merchant Login */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Admin / ERP Operations Button */}
          {currentUser && currentUser.role !== 'merchant' ? (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs font-bold text-white bg-[#391E0F] hover:bg-[#2B150A] transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Open Savouré ERP System"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#E0A282]" />
              <span>ERP Portal</span>
            </button>
          ) : (
            onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-[#2B150A] hover:bg-stone-50 transition-colors cursor-pointer"
                title="Savouré ERP Administration"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#CC8468]" />
                <span>Admin</span>
              </button>
            )
          )}

          {/* WhatsApp Direct Action */}
          <a
            href={SHOWCASE_CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-all border border-emerald-200 shadow-2xs active:scale-95"
            title="Chat directly on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
            <span className="hidden md:inline">WhatsApp</span>
          </a>

          {/* Merchant Login Button */}
          <button
            onClick={onOpenMerchantLogin}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-xs active:scale-95 cursor-pointer ${
              currentTab === 'merchant-login'
                ? 'bg-[#391E0F] text-white shadow-md'
                : 'text-[#391E0F] bg-white hover:bg-stone-50 border border-stone-200 hover:border-[#CC8468]'
            }`}
            title="Access Authorized Merchant Wholesale Portal"
          >
            <Lock className="w-3.5 h-3.5 text-[#CC8468]" />
            <span>Merchant Login</span>
          </button>
        </div>
      </div>
    </header>
  );
};
