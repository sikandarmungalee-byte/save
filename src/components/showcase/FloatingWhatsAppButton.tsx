import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { SHOWCASE_CONTACT } from './showcaseData';

export const FloatingWhatsAppButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Tooltip message */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-white text-[#2B150A] px-4 py-2 rounded-xl shadow-xl border border-stone-200 text-xs font-medium">
          <span>Enquire via WhatsApp: <strong className="text-emerald-700 font-bold">{SHOWCASE_CONTACT.phone}</strong></span>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-stone-400 hover:text-stone-700 ml-1 cursor-pointer"
            aria-label="Dismiss tooltip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating button */}
      <a
        href={SHOWCASE_CONTACT.whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Enquire on WhatsApp"
        className="flex items-center justify-center w-13 h-13 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-4 focus:ring-[#25D366]/30"
      >
        <MessageCircle className="w-6 h-6 fill-white stroke-none" />
      </a>
    </div>
  );
};
