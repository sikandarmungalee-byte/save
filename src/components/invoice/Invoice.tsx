import React from 'react';
import { Invoice as InvoiceType, BusinessSettings as BusinessSettingsType } from '../../types/erp';
import { useERP } from '../../context/ERPContext';
import { InvoiceHeader } from './InvoiceHeader';
import { InvoiceMeta } from './InvoiceMeta';
import { BillingSection } from './BillingSection';
import { InvoiceItems } from './InvoiceItems';
import { InvoiceTotals } from './InvoiceTotals';
import { PaymentDetails } from './PaymentDetails';
import { InvoiceFooter } from './InvoiceFooter';

interface InvoiceProps {
  invoice: InvoiceType;
  businessSettings?: BusinessSettingsType;
  className?: string;
  isEditable?: boolean;
  onUpdateItem?: (id: string, updated: any) => void;
  onRemoveItem?: (id: string) => void;
}

export const Invoice: React.FC<InvoiceProps> = ({
  invoice,
  businessSettings,
  className = '',
  isEditable = false,
  onUpdateItem,
  onRemoveItem,
}) => {
  const { businessSettings: contextSettings } = useERP();
  const business = businessSettings || contextSettings;

  // Calculate live values if needed
  const items = invoice.items || [];
  const subtotal =
    invoice.subtotal !== undefined
      ? invoice.subtotal
      : items.reduce((acc, it) => acc + (Number(it.total) || Number(it.quantity) * Number(it.unitPrice)), 0);

  const discountTotal = invoice.discountTotal || 0;
  const discountPercent = invoice.discount || 0;
  const vatRate = invoice.vatRate !== undefined ? invoice.vatRate : (business.vatRate || 15);
  const vatTotal =
    invoice.vatTotal !== undefined
      ? invoice.vatTotal
      : (subtotal - discountTotal) * (vatRate / 100);
  const grandTotal =
    invoice.grandTotal !== undefined ? invoice.grandTotal : subtotal - discountTotal + vatTotal;

  return (
    <div
      className={`invoice-root relative bg-[#FAF7F2] text-[#23170F] rounded-2xl p-6 sm:p-10 lg:p-12 shadow-xl border border-[#C98A5B]/30 max-w-[840px] mx-auto min-h-[1050px] font-sans overflow-hidden transition-all ${className}`}
      style={{
        backgroundColor: '#FAF7F2',
      }}
    >
      {/* Corner Botanical Flourishes (Copper Line Art) */}
      <div className="absolute top-2 left-2 text-[#C98A5B]/30 pointer-events-none" aria-hidden="true">
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M4 4C14 4 24 14 24 24M4 4V24M4 4H24" />
          <path d="M8 8C14 8 20 14 20 20" />
        </svg>
      </div>

      <div className="absolute top-2 right-2 text-[#C98A5B]/30 pointer-events-none" aria-hidden="true">
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M44 4C34 4 24 14 24 24M44 4V24M44 4H24" />
          <path d="M40 8C34 8 28 14 28 20" />
        </svg>
      </div>

      <div className="absolute bottom-2 left-2 text-[#C98A5B]/30 pointer-events-none" aria-hidden="true">
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M4 44C14 44 24 34 24 24M4 44V24M4 44H24" />
        </svg>
      </div>

      <div className="absolute bottom-2 right-2 text-[#C98A5B]/30 pointer-events-none" aria-hidden="true">
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M44 44C34 44 24 34 24 24M44 44V24M44 44H24" />
        </svg>
      </div>

      {/* Outer Thin Copper Border Frame */}
      <div className="border border-[#C98A5B]/40 p-4 sm:p-7 rounded-xl bg-gradient-to-b from-[#FAF7F2] via-[#FDFBF7] to-[#FAF7F2] relative z-10">
        {/* Header Block: Left (Logo & Brand) & Right (INVOICE & Meta) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pb-4">
          <InvoiceHeader business={business} />
          <InvoiceMeta invoice={invoice} business={business} />
        </div>

        {/* Billing Section (BILL TO & FROM) */}
        <BillingSection invoice={invoice} business={business} />

        {/* Item Table */}
        <InvoiceItems
          items={items}
          business={business}
          isEditable={isEditable}
          onUpdateItem={onUpdateItem}
          onRemoveItem={onRemoveItem}
        />

        {/* Totals Section */}
        <InvoiceTotals
          subtotal={subtotal}
          discountTotal={discountTotal}
          discountPercent={discountPercent}
          vatTotal={vatTotal}
          vatRate={vatRate}
          grandTotal={grandTotal}
          business={business}
        />

        {/* Payment & Banking Details + Notes */}
        <PaymentDetails
          business={business}
          invoiceNumber={invoice.invoiceNumber}
          paymentReference={invoice.paymentReference}
          notes={invoice.notes}
        />

        {/* Footer */}
        <InvoiceFooter business={business} />
      </div>
    </div>
  );
};
