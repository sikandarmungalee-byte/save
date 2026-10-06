import React from 'react';
import { BusinessSettings } from '../../types/erp';

interface InvoiceHeaderProps {
  business: BusinessSettings;
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ business }) => {
  return (
    <div className="relative pb-6 border-b border-[#C98A5B]/40">
      {/* Top subtle decorative copper line with central botanical accent */}
      <div className="flex items-center justify-between mb-6 opacity-75">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C98A5B]/40 to-[#C98A5B]" />
        <svg
          className="w-5 h-5 mx-3 text-[#C98A5B] shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2C6.5 2 2 6.5 2 12c4 0 7 2 9 5 2-3 5-5 9-5 0-5.5-4.5-10-10-10z" />
          <path d="M12 22V12" />
        </svg>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-[#C98A5B] via-[#C98A5B]/40 to-transparent" />
      </div>

      <div className="flex items-start gap-4 sm:gap-5">
        {/* Business Logo */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2px] bg-gradient-to-br from-[#DE9E74] via-[#C98A5B] to-[#8C5329] shadow-sm">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#FAF6F0] flex items-center justify-center">
              {business.logo ? (
                <img
                  src={business.logo}
                  alt={business.businessName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="font-serif text-2xl font-bold text-[#8C5329]">
                  {business.businessName?.charAt(0) || 'S'}
                </span>
              )}
            </div>
          </div>
          {/* Subtle botanical flourish under logo */}
          <div className="absolute -bottom-1 -right-1 text-[#C98A5B] pointer-events-none">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 4.03-9 9 3.5 0 6 1.8 7.5 4.5 1.5-2.7 4-4.5 7.5-4.5 0-4.97-4.03-9-9-9z" opacity="0.6" />
            </svg>
          </div>
        </div>

        {/* Brand Typography */}
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#23170F] tracking-wide leading-tight">
            {business.businessName || 'Savouré'}
          </h1>
          {business.tagline && (
            <p className="font-serif italic text-xs sm:text-sm text-[#8C5329] font-medium tracking-wide mt-0.5">
              {business.tagline}
            </p>
          )}

          <div className="mt-2 text-[11px] text-[#4A382C] leading-relaxed">
            {business.website && (
              <span className="font-mono text-[10px] text-[#8C5329] tracking-wider block sm:inline">
                {business.website.replace(/^https?:\/\//, '')}
              </span>
            )}
            {business.vatNumber && business.vatNumber.trim() !== '' && (
              <span className="text-[#6E5B4F] sm:ml-2 block sm:inline">
                VAT: <span className="font-mono font-medium text-[#23170F]">{business.vatNumber}</span>
              </span>
            )}
            {business.registrationNumber && business.registrationNumber.trim() !== '' && (
              <span className="text-[#6E5B4F] sm:ml-2 block sm:inline">
                Reg: <span className="font-mono text-[#23170F]">{business.registrationNumber}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
