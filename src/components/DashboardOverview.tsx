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
      <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={company.logoUrl || "/src/assets/images/savoure_master_logo_1790775722136.jpg"}
              alt="Savouré Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#C98A5B]/60 shadow-lg shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
                  Savouré Enterprise Portal
                </span>
                <span className="text-[#3A2D25]">·</span>
                <span className="text-xs text-[#A69385] font-serif italic">A Taste of Tradition</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Welcome back, {currentUser?.name || 'Administrator'}
              </h1>
              <p className="text-xs text-[#C5B7AC] mt-1 max-w-2xl leading-relaxed">
                {company.companyName} ERP is operating across {customers.length} commercial partner accounts and {invoices.length} compliant tax invoices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('invoices')}
              className="px-4 py-2.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>+ New Tax Invoice</span>
            </button>
            <button
              onClick={() => onNavigate('quotations')}
              className="px-4 py-2.5 rounded-lg bg-[#221B17] hover:bg-[#2C211B] border border-[#3A2D25] text-[#EDE6DE] font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#DE9E74]" />
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
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 cursor-pointer hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Billed Volume</span>
            <FileText className="w-4 h-4 text-[#DE9E74]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {company.currency} {grossInvoiced.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            {invoices.length} Tax Invoices issued
          </div>
        </div>

        {/* Liquidated Collections */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 cursor-pointer hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Net Liquidated Paid</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {company.currency} {netPaid.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {grossInvoiced > 0 ? `${((netPaid / grossInvoiced) * 100).toFixed(1)}% recovery rate` : '100%'}
          </div>
        </div>

        {/* Outstanding AR */}
        <div
          onClick={() => onNavigate('invoices')}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 cursor-pointer hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Receivables Due</span>
            <AlertCircle className="w-4 h-4 text-[#DE9E74]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#DE9E74] tabular-nums">
            {company.currency} {balanceDue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Awaiting 30-day EFT payment batches
          </div>
        </div>

        {/* Active Logistics & Dispatch */}
        <div
          onClick={() => onNavigate('delivery-notes')}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 cursor-pointer hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Logistics In Transit</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {inTransitCount} Runs En Route
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {pendingQuotes} pending formal quotes
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Tax Invoices & Active Logistics Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tax Invoices */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Recent Tax Invoices</h2>
              <p className="text-[11px] text-neutral-400">Sequential South African compliant tax invoices</p>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-[#DE9E74] hover:underline flex items-center gap-1"
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
                className="p-3 rounded-lg bg-neutral-800/40 border border-neutral-800 hover:bg-neutral-800/80 transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div className="font-mono font-bold text-[#DE9E74]">{inv.invoiceNumber}</div>
                  <div className="text-white font-medium truncate max-w-[180px]">{inv.customerName}</div>
                  <div className="text-[10px] text-neutral-500 font-mono">Due: {inv.dueDate}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-white tabular-nums">
                    {company.currency} {inv.grandTotal.toFixed(2)}
                  </div>
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold uppercase mt-0.5 ${
                      inv.status === 'Paid'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : inv.status === 'Partial'
                        ? 'bg-[#C98A5B]/15 text-[#F3D2BF]'
                        : 'bg-neutral-700 text-neutral-300'
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
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Active Delivery Runs & POD</h2>
              <p className="text-[11px] text-neutral-400">Linked to customer branch receiving docks</p>
            </div>
            <button
              onClick={() => onNavigate('delivery-notes')}
              className="text-xs text-[#DE9E74] hover:underline flex items-center gap-1"
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
                className="p-3 rounded-lg bg-neutral-800/40 border border-neutral-800 hover:bg-neutral-800/80 transition-colors flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div className="font-mono font-bold text-[#DE9E74]">{dn.deliveryNoteNumber}</div>
                  <div className="text-white font-medium truncate max-w-[180px]">{dn.branchName}</div>
                  <div className="text-[10px] text-neutral-400">Driver: {dn.driverName}</div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                      dn.status === 'Delivered'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-[#C98A5B]/15 text-[#F3D2BF]'
                    }`}
                  >
                    {dn.status}
                  </span>
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
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
