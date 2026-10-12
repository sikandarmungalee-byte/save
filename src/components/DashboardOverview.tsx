import React from 'react';
import { useERP } from '../context/ERPContext';
import {
  FileText,
  Truck,
  Receipt,
  FileSpreadsheet,
  Users2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Package
} from 'lucide-react';

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const {
    invoices,
    deliveryNotes,
    quotations,
    payments,
    customers,
    products,
    company,
    currentUser,
  } = useERP();

  const grossInvoiced = invoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const netPaid = invoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const balanceDue = invoices.reduce((acc, i) => acc + i.balanceDue, 0);
  const inTransitCount = deliveryNotes.filter((d) => d.status === 'In Transit').length;
  const pendingQuotes = quotations.filter((q) => q.status === 'Sent' || q.status === 'Accepted').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#391E0F] border-2 border-[#CC8468]/60 shadow-md flex items-center justify-center text-[#E0A282] font-serif font-black text-3xl shrink-0">
              S
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#391E0F]">
                  Savouré Enterprise Portal
                </span>
                <span className="text-[#CC8468]/50">·</span>
                <span className="text-xs text-stone-500 font-serif italic">A Taste of Tradition</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B150A] tracking-tight">
                Welcome back, {currentUser?.name || 'Administrator'}
              </h1>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
                {company.companyName} ERP is operating across {customers.length} commercial partner accounts and {invoices.length} compliant tax invoices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('invoices')}
              className="px-4 py-2.5 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-4 h-4 text-[#E0A282]" />
              <span>+ New Tax Invoice</span>
            </button>
            <button
              onClick={() => onNavigate('quotations')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 hover:border-[#CC8468] text-[#391E0F] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#CC8468]" />
              <span>+ New Quotation</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Invoiced */}
        <div
          onClick={() => onNavigate('invoices')}
          className="bg-white border border-stone-200 hover:border-[#CC8468] rounded-2xl p-5 cursor-pointer transition-all shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Billed Volume</span>
            <FileText className="w-4 h-4 text-[#CC8468]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#2B150A] tabular-nums">
            {company.currency} {grossInvoiced.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 font-mono">
            {invoices.length} Tax Invoices issued
          </div>
        </div>

        {/* Liquidated Collections */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-white border border-stone-200 hover:border-[#CC8468] rounded-2xl p-5 cursor-pointer transition-all shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Net Liquidated Paid</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {company.currency} {netPaid.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {grossInvoiced > 0 ? `${((netPaid / grossInvoiced) * 100).toFixed(1)}% recovery rate` : '100%'}
          </div>
        </div>

        {/* Outstanding AR */}
        <div
          onClick={() => onNavigate('invoices')}
          className="bg-white border border-stone-200 hover:border-[#CC8468] rounded-2xl p-5 cursor-pointer transition-all shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Receivables Due</span>
            <AlertCircle className="w-4 h-4 text-[#CC8468]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#8C4B2E] tabular-nums">
            {company.currency} {balanceDue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Awaiting 30-day EFT payment batches
          </div>
        </div>

        {/* Active Logistics & Dispatch */}
        <div
          onClick={() => onNavigate('delivery-notes')}
          className="bg-white border border-stone-200 hover:border-[#CC8468] rounded-2xl p-5 cursor-pointer transition-all shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Logistics In Transit</span>
            <Truck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#2B150A] tabular-nums">
            {inTransitCount} Runs En Route
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {pendingQuotes} pending formal quotes
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Tax Invoices & Active Logistics Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tax Invoices */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#2B150A] tracking-tight">Recent Tax Invoices</h2>
              <p className="text-[11px] text-stone-500">Sequential South African compliant tax invoices</p>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-[#391E0F] hover:text-[#CC8468] font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 flex-1">
            {invoices.slice(0, 4).map((inv) => (
              <div
                key={inv.id}
                onClick={() => onNavigate('invoices')}
                className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 hover:bg-stone-100 transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div className="font-mono font-bold text-[#391E0F]">{inv.invoiceNumber}</div>
                  <div className="text-[#2B150A] font-semibold truncate max-w-[180px]">{inv.customerName}</div>
                  <div className="text-[10px] text-stone-400 font-mono">Due: {inv.dueDate}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-[#2B150A] tabular-nums">
                    {company.currency} {inv.grandTotal.toFixed(2)}
                  </div>
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold uppercase mt-0.5 ${
                      inv.status === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : inv.status === 'Partial'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-stone-100 text-[#391E0F] border border-stone-200'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Logistics & POD Status */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#2B150A] tracking-tight">Active Delivery Runs & POD</h2>
              <p className="text-[11px] text-stone-500">Linked to customer branch receiving docks</p>
            </div>
            <button
              onClick={() => onNavigate('delivery-notes')}
              className="text-xs text-[#391E0F] hover:text-[#CC8468] font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View Slips</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 flex-1">
            {deliveryNotes.slice(0, 4).map((dn) => (
              <div
                key={dn.id}
                onClick={() => onNavigate('delivery-notes')}
                className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 hover:bg-stone-100 transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div className="font-mono font-bold text-[#391E0F]">{dn.deliveryNoteNumber}</div>
                  <div className="text-[#2B150A] font-semibold truncate max-w-[180px]">{dn.branchName}</div>
                  <div className="text-[10px] text-stone-500">Driver: {dn.driverName}</div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                      dn.status === 'Delivered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {dn.status}
                  </span>
                  <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                    {dn.podSignature ? '✓ Signed POD' : 'Awaiting Stamp'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
