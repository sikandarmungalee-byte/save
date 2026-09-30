import React from 'react';
import { Invoice } from '../types/erp';
import { useERP } from '../context/ERPContext';
import { Printer, X, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, onClose }) => {
  const { company } = useERP();

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Bar (hidden during print) */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between no-print shrink-0 bg-neutral-900/90 rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">
              Tax Invoice Preview: <span className="font-mono text-[#DE9E74]">{invoice.invoiceNumber}</span>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                invoice.status === 'Paid'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : invoice.status === 'Partial'
                  ? 'bg-[#C98A5B]/20 text-[#F3D2BF]'
                  : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container (Rendered in high-contrast crisp white for printout) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-950/40">
          <div className="print-container bg-white text-neutral-900 rounded-lg p-8 sm:p-10 shadow-lg mx-auto max-w-3xl text-xs font-sans border border-neutral-200">
            {/* Header: Company and TAX INVOICE banner */}
            <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-6">
              <div className="flex items-start gap-4">
                <img
                  src={company.logoUrl || "/src/assets/images/savoure_master_logo_1790775722136.jpg"}
                  alt="Savouré Logo"
                  className="w-16 h-16 rounded-full object-cover border border-[#C98A5B] shrink-0"
                />
                <div>
                  <h1 className="text-2xl font-serif font-bold text-neutral-950 tracking-tight">
                    {company.companyName}
                  </h1>
                  {company.tradingName && (
                    <div className="text-xs text-[#9B5D34] font-serif font-semibold italic">
                      {company.tradingName}
                    </div>
                  )}
                  <div className="mt-2 text-neutral-600 text-[11px] leading-relaxed space-y-0.5">
                    <div>{company.address}</div>
                    <div>Phone: {company.phone} · Email: {company.email}</div>
                    <div className="font-mono text-neutral-800">
                      Company Reg No: <span className="font-semibold">{company.registrationNumber}</span>
                    </div>
                    <div className="font-mono text-neutral-900">
                      SARS VAT Registration No: <span className="font-bold">{company.vatNumber}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block bg-[#201713] text-white font-extrabold text-sm uppercase px-3 py-1 tracking-wider mb-2 border-b-2 border-[#C98A5B]">
                  TAX INVOICE
                </div>
                <div className="text-xs text-neutral-500 font-medium">South African Revenue Compliant</div>
                <div className="mt-2 font-mono font-bold text-base text-neutral-950 tabular-nums">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-[11px] text-neutral-600 font-mono mt-1">
                  Issue Date: <span className="font-semibold text-neutral-900">{invoice.issueDate}</span>
                </div>
                <div className="text-[11px] text-neutral-600 font-mono">
                  Payment Due: <span className="font-semibold text-neutral-900">{invoice.dueDate}</span>
                </div>
              </div>
            </div>

            {/* Bill To & Deliver To Details */}
            <div className="grid grid-cols-2 gap-8 mb-6 pb-6 border-b border-neutral-200">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Billed To (Customer Legal Entity)
                </div>
                <div className="font-bold text-neutral-950 text-sm">
                  {invoice.customerName}
                </div>
                {invoice.customerTradingName && invoice.customerTradingName !== invoice.customerName && (
                  <div className="text-xs text-neutral-600">Trading as: {invoice.customerTradingName}</div>
                )}
                <div className="mt-1 text-neutral-700 text-[11px] space-y-0.5">
                  <div className="font-mono">
                    Customer VAT No: <span className="font-bold">{invoice.customerVat || 'Not Provided / Exempt'}</span>
                  </div>
                  {invoice.branchName && (
                    <div className="font-medium text-neutral-800">Branch: {invoice.branchName}</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Delivery Destination (Receiving Bay)
                </div>
                <div className="text-neutral-800 text-[11px] leading-relaxed">
                  <div className="font-semibold">{invoice.branchName || invoice.customerTradingName}</div>
                  <div>{invoice.deliveryAddress || 'Standard Distribution Hub'}</div>
                  {invoice.linkedDeliveryNoteId && (
                    <div className="mt-1 text-[#9B5D34] font-medium">
                      Linked Delivery Slip Ref: {invoice.linkedDeliveryNoteId}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Itemized Products Table */}
            <div className="mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-900 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                    <th className="py-2 px-1">SKU</th>
                    <th className="py-2 px-2">Description</th>
                    <th className="py-2 px-2">Pack Size</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Unit Price</th>
                    <th className="py-2 px-2 text-right">Disc %</th>
                    <th className="py-2 px-2 text-right">VAT (15%)</th>
                    <th className="py-2 px-1 text-right">Total ({company.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="text-neutral-800 text-[11px]">
                      <td className="py-2 px-1 font-mono text-[10px] text-neutral-600">{item.sku}</td>
                      <td className="py-2 px-2 font-medium">{item.description}</td>
                      <td className="py-2 px-2 text-neutral-600 text-[10px]">{item.packSize}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums">{item.quantity}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums">
                        {company.currency} {Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-neutral-500">
                        {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-neutral-600">
                        {company.currency} {Number(item.vatAmount).toFixed(2)}
                      </td>
                      <td className="py-2 px-1 text-right font-mono font-semibold tabular-nums text-neutral-950">
                        {company.currency} {Number(item.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal, VAT Calculation & Grand Total Block */}
            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600 py-1 border-b border-neutral-100">
                  <span>Subtotal Excl. VAT</span>
                  <span className="font-mono tabular-nums font-medium text-neutral-900">
                    {company.currency} {invoice.subtotal.toFixed(2)}
                  </span>
                </div>
                {invoice.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700 py-1 border-b border-neutral-100">
                    <span>Total Discount Saved</span>
                    <span className="font-mono tabular-nums font-medium">
                      -{company.currency} {invoice.discountTotal.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-600 py-1 border-b border-neutral-100">
                  <span>Value Added Tax (15% Standard)</span>
                  <span className="font-mono tabular-nums font-medium text-neutral-900">
                    {company.currency} {invoice.vatTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-neutral-950 text-sm py-2 border-b-2 border-neutral-900">
                  <span>Grand Total Incl. VAT</span>
                  <span className="font-mono tabular-nums">
                    {company.currency} {invoice.grandTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600 pt-1">
                  <span>Total Payments Settled</span>
                  <span className="font-mono tabular-nums text-emerald-700 font-semibold">
                    {company.currency} {invoice.amountPaid.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-neutral-950 text-sm bg-neutral-100 p-2 rounded">
                  <span>Balance Due</span>
                  <span className={`font-mono tabular-nums ${invoice.balanceDue > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {company.currency} {invoice.balanceDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Banking Details for EFT Payments (SARS Mandated EFT Notice) */}
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 mb-6 text-[11px] text-neutral-700">
              <div className="font-bold text-neutral-950 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#9B5D34]" />
                <span>Banking Credentials for Electronic Funds Transfer (EFT)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[10px]">
                <div>
                  <span className="text-neutral-500 block">Bank Name:</span>
                  <span className="font-bold text-neutral-900">{company.bankName}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Account Holder:</span>
                  <span className="font-bold text-neutral-900 truncate block">{company.accountHolder}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Account Number:</span>
                  <span className="font-bold text-neutral-900">{company.accountNumber}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Branch Code / SWIFT:</span>
                  <span className="font-bold text-neutral-900">{company.branchCode} ({company.swiftCode})</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-[#7D4825] font-medium">
                Mandatory Payment Reference: <span className="font-bold underline">{invoice.invoiceNumber}</span>. Please forward POP to {company.email}.
              </div>
            </div>

            {/* Standard Terms & Conditions Footer */}
            <div className="border-t border-neutral-200 pt-3 text-[10px] text-neutral-500 leading-relaxed">
              <div className="font-semibold text-neutral-700">Terms of Business:</div>
              <div>{company.defaultPaymentTerms} All goods remain the property of {company.companyName} until fully liquidated. Queries must be notified within 24 hours of delivery slip signature.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
