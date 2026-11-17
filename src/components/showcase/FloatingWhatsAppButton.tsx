import React from 'react';
import { MessageCircle } from 'lucide-react';
import { SHOWCASE_CONTACT } from './showcaseData';

export const FloatingWhatsAppButton: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center">
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
