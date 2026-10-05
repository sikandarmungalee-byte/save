import React from 'react';
import { BusinessSettings } from '../../types/erp';

interface PaymentDetailsProps {
  business: BusinessSettings;
  invoiceNumber: string;
  paymentReference?: string;
  notes?: string;
}

export const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  business,
  invoiceNumber,
  paymentReference,
  notes,
}) => {
  const reference = paymentReference || invoiceNumber;

  return (
    <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-[#C98A5B]/30">
      {/* Payment Details Block */}
      <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#C98A5B]/40 shadow-2xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#C98A5B]/30">
          <svg
            className="w-4 h-4 text-[#8C5329]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
          <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#8C5329]">
            Banking & EFT Payment Details
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-[#2C1E16]">
          <div className="flex items-center justify-between">
            <span className="text-[#6E5B4F] text-[11px]">Bank:</span>
            <span className="font-semibold text-[#23170F]">{business.bankName || 'First National Bank (FNB)'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#6E5B4F] text-[11px]">Account Name:</span>
            <span className="font-semibold text-[#23170F]">{business.accountHolder || business.businessName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#6E5B4F] text-[11px]">Account Number:</span>
            <span className="font-mono font-bold text-[#23170F] tracking-wider">
              {business.accountNumber || '62983104821'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#6E5B4F] text-[11px]">Branch Code:</span>
            <span className="font-mono text-[#23170F]">{business.branchCode || '250655'}</span>
          </div>

          {business.swiftCode && (
            <div className="flex items-center justify-between">
              <span className="text-[#6E5B4F] text-[11px]">SWIFT Code:</span>
              <span className="font-mono text-[#23170F]">{business.swiftCode}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#C98A5B]/20">
            <span className="font-serif text-[11px] text-[#8C5329] font-bold">Payment Reference:</span>
            <span className="font-mono font-bold text-xs text-[#8C5329] bg-[#EFE7DE] px-2 py-0.5 rounded border border-[#C98A5B]/30">
              {reference}
            </span>
          </div>
        </div>
      </div>

      {/* Notes & Terms Block */}
      <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#C98A5B]/40 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#C98A5B]/30">
            <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#8C5329]">
              Special Instructions & Notes
            </span>
          </div>

          <p className="text-xs text-[#4A382C] leading-relaxed whitespace-pre-line italic font-serif">
            {notes ||
              'Thank you for your business. Please ensure EFT payments reflect invoice number as payment reference. Interest of 2% per month charged on overdue accounts.'}
          </p>
        </div>

        <div className="mt-3 pt-2 border-t border-[#C98A5B]/20 text-[11px] text-[#6E5B4F]">
          Goods remain property of {business.businessName} until paid in full.
        </div>
      </div>
    </div>
  );
};
