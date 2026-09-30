import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { invoices, payments, customers, company } = useERP();

  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'annual'>('weekly');
  const [currentWeek, setCurrentWeek] = useState<number>(12); // Week 12 of 2026
  const currentYear = 2026;

  // KPIs
  const grossInvoiced = invoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const netPaid = invoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const balanceDue = invoices.reduce((acc, i) => acc + i.balanceDue, 0);
  const collectionRate = grossInvoiced > 0 ? ((netPaid / grossInvoiced) * 100).toFixed(1) : '0';

  // Customer & Branch breakdown
  const customerBreakdown = customers.map((c) => {
    const custInvoices = invoices.filter((i) => i.customerId === c.id);
    const billed = custInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
    const paid = custInvoices.reduce((acc, i) => acc + i.amountPaid, 0);
    const due = custInvoices.reduce((acc, i) => acc + i.balanceDue, 0);
    return {
      customer: c,
      invoicesCount: custInvoices.length,
      billed,
      paid,
      due,
      rate: billed > 0 ? ((paid / billed) * 100).toFixed(0) : '100',
    };
  });

  const exportCSV = () => {
    const headers = ['Customer Registered Name', 'Trading Name', 'Account Code', 'Invoices Count', 'Gross Invoiced (ZAR)', 'Total Paid (ZAR)', 'Balance Due (ZAR)', 'Collection Rate %'];
    const rows = customerBreakdown.map((b) => [
      `"${b.customer.registeredName}"`,
      `"${b.customer.tradingName}"`,
      b.customer.accountCode,
      b.invoicesCount,
      b.billed.toFixed(2),
      b.paid.toFixed(2),
      b.due.toFixed(2),
      `${b.rate}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ApexERP_Executive_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
                Executive Financial Intelligence
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400 font-mono">52-Week Distribution Cycle</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Consolidated Reports & Analytics
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Real-time audit performance metrics, ISO week navigation, corporate client and branch receivables breakdown, and exportable financial summaries.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs transition-colors flex items-center gap-1.5 border border-neutral-700"
            >
              <Download className="w-4 h-4 text-neutral-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Time Period Filter & 52-Week ISO Navigator */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between no-print">
        {/* Period Selector */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
          {(['weekly', 'monthly', 'quarterly', 'annual'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                period === p
                  ? 'bg-[#C98A5B] text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* 52-Week ISO Week Navigator */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs">
          <Calendar className="w-4 h-4 text-[#DE9E74]" />
          <span className="text-neutral-400">ISO Batch Week:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentWeek((w) => Math.max(1, w - 1))}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-neutral-800">
              Week {currentWeek} of 52 ({currentYear})
            </span>
            <button
              onClick={() => setCurrentWeek((w) => Math.min(52, w + 1))}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Gross Billed Volume
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {company.currency} {grossInvoiced.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            {invoices.length} invoices generated
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Net Paid & Liquidated
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {company.currency} {netPaid.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-500/90 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Reconciled into FNB Corporate Account</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Total AR Balance Due
          </div>
          <div className="text-2xl font-bold font-mono text-[#DE9E74] tabular-nums">
            {company.currency} {balanceDue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Awaiting 30-day payment run batches
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Collection Realization Rate
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums flex items-baseline gap-1">
            <span>{collectionRate}%</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Target benchmark: &gt;85%
          </div>
        </div>
      </div>

      {/* Customer & Branch Drill-Down Performance Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Customer Account & Store Branch Receivables Drill-Down
            </h2>
            <p className="text-xs text-neutral-400">
              Breakdown of total invoiced volume, received payments, and current balance per client.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Customer Account</th>
                <th className="py-3 px-4 font-semibold">Store Outlets</th>
                <th className="py-3 px-4 font-semibold text-right">Invoices</th>
                <th className="py-3 px-4 font-semibold text-right">Total Billed</th>
                <th className="py-3 px-4 font-semibold text-right">Total Collected</th>
                <th className="py-3 px-4 font-semibold text-right">Balance Due</th>
                <th className="py-3 px-4 font-semibold text-right">Collection Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {customerBreakdown.map((b) => (
                <tr key={b.customer.id} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{b.customer.registeredName}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {b.customer.accountCode} · Trade: {b.customer.tradingName}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-neutral-300">
                    <div className="font-medium">{b.customer.branches?.length || 0} branches</div>
                    <div className="text-[10px] text-neutral-500 truncate max-w-[200px]">
                      {b.customer.branches?.map((br) => br.branchName).join(', ') || 'Head Office'}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-300">
                    {b.invoicesCount}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-white tabular-nums">
                    {company.currency} {b.billed.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-right font-mono text-emerald-400 tabular-nums">
                    {company.currency} {b.paid.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                    <span className={b.due > 0 ? 'text-[#DE9E74]' : 'text-emerald-400'}>
                      {company.currency} {b.due.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        Number(b.rate) >= 80
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : Number(b.rate) >= 50
                          ? 'bg-[#C98A5B]/15 text-[#DE9E74]'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {b.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
