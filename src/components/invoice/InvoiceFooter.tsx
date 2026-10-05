import React from 'react';
import { BusinessSettings } from '../../types/erp';

interface InvoiceFooterProps {
  business: BusinessSettings;
}

export const InvoiceFooter: React.FC<InvoiceFooterProps> = ({ business }) => {
  return (
    <div className="mt-8 pt-6 border-t border-[#C98A5B]/40 text-center relative">
      {/* Elegant Flowing Copper Decorative Curves (SVG Ribbon) */}
      <div className="flex items-center justify-center mb-4">
        <svg
          className="w-48 sm:w-64 h-6 text-[#C98A5B] opacity-80"
          viewBox="0 0 300 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 12C50 3 80 21 150 12C220 3 250 21 295 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="150" cy="12" r="3" fill="currentColor" />
          <path
            d="M135 12C140 7 146 5 150 5C154 5 160 7 165 12"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Footer Text / Tagline */}
      <div className="font-serif italic text-sm text-[#23170F] font-semibold tracking-wide mb-2">
        {business.footerText || business.tagline || 'A Taste of Authentic Tradition & Culinary Mastery.'}
      </div>

      {/* Contact Line */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#5C483A]">
        {business.phone && (
          <span className="flex items-center gap-1">
            <span className="text-[#8C5329] font-serif font-bold">Tel:</span>
            <span className="font-mono text-[11px]">{business.phone}</span>
          </span>
        )}

        {business.phone && business.email && (
          <span className="text-[#C98A5B]" aria-hidden="true">·</span>
        )}

        {business.email && (
          <span className="flex items-center gap-1">
            <span className="text-[#8C5329] font-serif font-bold">Email:</span>
            <span>{business.email}</span>
          </span>
        )}

        {business.email && business.address && (
          <span className="text-[#C98A5B]" aria-hidden="true">·</span>
        )}

        {business.address && (
          <span>{business.address}</span>
        )}
      </div>

      <div className="mt-3 text-[10px] text-[#8C5329]/70 font-mono tracking-widest uppercase">
        {business.businessName} · All Rights Reserved
      </div>
    </div>
  );
};
