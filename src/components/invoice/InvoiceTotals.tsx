import React from 'react';
import { BusinessSettings } from '../../types/erp';

interface InvoiceTotalsProps {
  subtotal: number;
  discountTotal?: number;
  discountPercent?: number;
  vatTotal: number;
  vatRate?: number;
  grandTotal: number;
  business: BusinessSettings;
}

export const InvoiceTotals: React.FC<InvoiceTotalsProps> = ({
  subtotal,
  discountTotal = 0,
  discountPercent = 0,
  vatTotal,
  vatRate = 15,
  grandTotal,
  business,
}) => {
  const currency = business.currency || 'R';

  const hasVat = Boolean(business.vatNumber && business.vatNumber.trim() !== '' && vatRate > 0 && vatTotal > 0);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 my-6 pt-2">
      {/* Left side: Luxury botanical decorative watermark or seal */}
      <div className="hidden sm:flex items-center gap-3 text-[#8C5329]/60">
        <svg
          className="w-10 h-10 text-[#C98A5B]/50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2C6.5 2 2 6.5 2 12c4 0 7 2 9 5 2-3 5-5 9-5 0-5.5-4.5-10-10-10z" />
          <path d="M12 22V12" />
        </svg>
        <div className="font-serif italic text-xs text-[#8C5329]/80 leading-relaxed max-w-[200px]">
          Artisanal excellence verified with authentic South African heritage.
        </div>
      </div>

      {/* Right side: Calculation totals with prominent espresso & copper Grand Total */}
      <div className="w-full sm:w-80 space-y-2 text-xs">
        {/* Subtotal */}
        <div className="flex items-center justify-between py-1 px-3 text-[#3E2C22] border-b border-[#C98A5B]/20">
          <span className="font-serif uppercase tracking-wider text-[11px] text-[#8C5329]">
            Subtotal:
          </span>
          <span className="font-mono text-sm text-[#23170F] tabular-nums">
            {currency} {subtotal.toFixed(2)}
          </span>
        </div>

        {/* Discount (if applicable) */}
        {discountTotal > 0 && (
          <div className="flex items-center justify-between py-1 px-3 text-emerald-800 border-b border-[#C98A5B]/20">
            <span className="font-serif uppercase tracking-wider text-[11px]">
              Discount {discountPercent > 0 ? `(${discountPercent}%)` : ''}:
            </span>
            <span className="font-mono text-sm tabular-nums">
              -{currency} {discountTotal.toFixed(2)}
            </span>
          </div>
        )}

        {/* VAT (Only displayed if business is strictly VAT registered with a VAT number) */}
        {hasVat && (
          <div className="flex items-center justify-between py-1 px-3 text-[#3E2C22] border-b border-[#C98A5B]/20">
            <span className="font-serif uppercase tracking-wider text-[11px] text-[#8C5329]">
              VAT ({vatRate}%):
            </span>
            <span className="font-mono text-sm text-[#23170F] tabular-nums">
              {currency} {vatTotal.toFixed(2)}
            </span>
          </div>
        )}

        {/* Grand Total: Prominent Luxury Espresso & Copper Styling */}
        <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-[#23170F] via-[#2C1E16] to-[#1E140E] text-[#FAF6F0] border-2 border-[#C98A5B] shadow-md flex items-center justify-between gap-4">
          <div>
            <div className="font-serif text-[10px] sm:text-xs uppercase tracking-widest text-[#DE9E74] font-bold">
              Grand Total
            </div>
            <div className="text-[10px] text-[#A69385] font-sans">
              {hasVat ? 'VAT Inclusive' : 'Total Amount Due'}
            </div>
          </div>
          <div className="font-mono font-bold text-xl sm:text-2xl text-white tabular-nums tracking-tight">
            {currency} {grandTotal.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};
