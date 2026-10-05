import React from 'react';
import { Invoice as InvoiceType } from '../types/erp';
import { Invoice as LuxuryInvoice } from './invoice/Invoice';
import { Printer, X, Download } from 'lucide-react';

interface InvoicePrintModalProps {
  invoice: InvoiceType | null;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#171311] border border-[#2C211B] rounded-2xl shadow-2xl flex flex-col my-auto max-h-[95vh] overflow-hidden">
        {/* Modal Top Bar (hidden during print) */}
        <div className="px-6 py-4 border-b border-[#2C211B] flex items-center justify-between no-print shrink-0 bg-[#171311]">
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold text-white text-base">
              Luxury Tax Invoice: <span className="font-mono text-[#DE9E74]">{invoice.invoiceNumber}</span>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                invoice.status === 'Paid'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                  : invoice.status === 'Partial'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                  : 'bg-[#221B17] text-[#DE9E74] border border-[#3A2D25]'
              }`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8A776B] hover:text-white hover:bg-[#221B17] transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#120F0D]">
          <div className="print-container max-w-3xl mx-auto">
            <LuxuryInvoice invoice={invoice} />
          </div>
        </div>
      </div>
    </div>
  );
};
