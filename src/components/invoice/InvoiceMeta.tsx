import React from 'react';
import { Invoice, BusinessSettings } from '../../types/erp';

interface InvoiceMetaProps {
  invoice: Invoice;
  business: BusinessSettings;
}

export const InvoiceMeta: React.FC<InvoiceMetaProps> = ({ invoice, business }) => {
  const displayDate = invoice.date || invoice.issueDate || new Date().toISOString().split('T')[0];
  const displayDueDate = invoice.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const paymentTerms = business.paymentTerms || 'Strictly 30 days from invoice date.';

  return (
    <div className="text-right flex flex-col items-end">
      {/* Large Luxury INVOICE Title */}
      <div className="relative inline-block mb-3">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#23170F] tracking-widest uppercase">
          INVOICE
        </h2>
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C98A5B] to-[#8C5329] mt-1" />
      </div>

      {/* Meta Grid */}
      <div className="space-y-1.5 text-xs text-[#3E2C22] max-w-xs">
        <div className="flex items-center justify-end gap-3">
          <span className="font-serif text-[11px] uppercase tracking-wider text-[#8C5329] font-medium">
            Invoice No:
          </span>
          <span className="font-mono font-bold text-sm sm:text-base text-[#23170F] tabular-nums">
            {invoice.invoiceNumber || 'INV-0001'}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3">
          <span className="font-serif text-[11px] uppercase tracking-wider text-[#8C5329]">
            Invoice Date:
          </span>
          <span className="font-mono text-xs text-[#23170F] tabular-nums">
            {displayDate}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3">
          <span className="font-serif text-[11px] uppercase tracking-wider text-[#8C5329]">
            Due Date:
          </span>
          <span className="font-mono text-xs text-[#23170F] font-semibold tabular-nums">
            {displayDueDate}
          </span>
        </div>

        <div className="pt-1 border-t border-[#C98A5B]/30 flex flex-col items-end text-[11px] text-[#6E5B4F]">
          <span className="font-serif text-[10px] uppercase tracking-wider text-[#8C5329]">
            Payment Terms:
          </span>
          <span className="text-[11px] text-[#3E2C22] text-right font-medium max-w-[220px] leading-tight mt-0.5">
            {paymentTerms}
          </span>
        </div>

        {/* Status Badge */}
        {invoice.status && (
          <div className="pt-2">
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider border ${
                invoice.status === 'Paid'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : invoice.status === 'Partial'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-[#FAF6F0] text-[#8C5329] border-[#C98A5B]/50'
              }`}
            >
              Status: {invoice.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
