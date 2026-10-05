import React from 'react';
import { Invoice, BusinessSettings } from '../../types/erp';

interface BillingSectionProps {
  invoice: Invoice;
  business: BusinessSettings;
}

export const BillingSection: React.FC<BillingSectionProps> = ({ invoice, business }) => {
  const customerName = invoice.customer?.company || invoice.customer?.name || invoice.customerTradingName || invoice.customerName || 'Valued Client';
  const contactPerson = invoice.customer?.contactPerson || invoice.contactPerson || invoice.customerName || '';
  const customerPhone = invoice.customer?.phone || invoice.customerPhone || '';
  const customerEmail = invoice.customer?.email || invoice.customerEmail || '';
  const customerAddress = invoice.customer?.address || invoice.deliveryAddress || '';

  return (
    <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-4 pb-6 border-b border-[#C98A5B]/30">
      {/* Column 1: BILL TO */}
      <div className="relative pl-3 border-l-2 border-[#C98A5B]">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#8C5329]">
            BILL TO
          </span>
          <div className="h-[1px] flex-1 bg-[#C98A5B]/30" />
        </div>

        <div className="space-y-1 text-xs text-[#2C1E16]">
          <div className="font-serif font-bold text-base text-[#23170F] tracking-tight">
            {customerName}
          </div>

          {contactPerson && contactPerson !== customerName && (
            <div className="text-[#4A382C] font-medium">
              Attn: <span className="text-[#23170F]">{contactPerson}</span>
            </div>
          )}

          {customerPhone && (
            <div className="text-[#5C483A]">
              Phone: <span className="font-mono text-[#23170F]">{customerPhone}</span>
            </div>
          )}

          {customerEmail && (
            <div className="text-[#5C483A]">
              Email: <span className="text-[#23170F]">{customerEmail}</span>
            </div>
          )}

          {customerAddress && (
            <div className="text-[#5C483A] leading-relaxed whitespace-pre-line pt-0.5">
              {customerAddress}
            </div>
          )}

          {invoice.customerVat && (
            <div className="text-[11px] font-mono text-[#8C5329] pt-1">
              VAT ID: {invoice.customerVat}
            </div>
          )}
        </div>
      </div>

      {/* Column 2: FROM */}
      <div className="relative pl-3 border-l-2 border-[#DE9E74]/70">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#8C5329]">
            FROM
          </span>
          <div className="h-[1px] flex-1 bg-[#C98A5B]/30" />
        </div>

        <div className="space-y-1 text-xs text-[#2C1E16]">
          <div className="font-serif font-bold text-base text-[#23170F] tracking-tight">
            {business.businessName || 'Savouré'}
          </div>

          {business.tagline && (
            <div className="font-serif italic text-xs text-[#8C5329] font-medium">
              {business.tagline}
            </div>
          )}

          {business.phone && (
            <div className="text-[#5C483A]">
              Phone: <span className="font-mono text-[#23170F]">{business.phone}</span>
            </div>
          )}

          {business.email && (
            <div className="text-[#5C483A]">
              Email: <span className="text-[#23170F]">{business.email}</span>
            </div>
          )}

          {business.address && (
            <div className="text-[#5C483A] leading-relaxed whitespace-pre-line pt-0.5">
              {business.address}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
