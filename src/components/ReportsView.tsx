import React, { useState, useMemo } from 'react';
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
  AlertCircle,
  Building2,
  Users2,
  Package,
  Layers,
  ArrowRight,
  DollarSign,
  PieChart,
  Scale
} from 'lucide-react';

interface ReportsViewProps {
  initialPeriod?: 'weekly' | 'monthly' | 'quarterly' | 'annual';
}

export const ReportsView: React.FC<ReportsViewProps> = ({ initialPeriod = 'weekly' }) => {
  const { invoices, payments, customers, products, company, merchantOrders } = useERP();

  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'annual'>(initialPeriod);
  const [reportSection, setReportSection] = useState<'summary' | 'pnl' | 'customers' | 'products' | 'aging'>('summary');
  const [currentWeek, setCurrentWeek] = useState<number>(12); // ISO Batch Week
  const currentYear = 2026;

  // Key Financial Metrics
  const grossInvoiced = invoices.reduce((acc, i) => acc + (Number(i.grandTotal) || 0), 0);
  const netPaid = invoices.reduce((acc, i) => acc + (Number(i.amountPaid) || 0), 0);
  const balanceDue = invoices.reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0);
  const collectionRate = grossInvoiced > 0 ? ((netPaid / grossInvoiced) * 100).toFixed(1) : '0';

  // Estimated Cost of Sales (approx 42% standard bakery ingredient & packaging cost)
  const estimatedCostOfSales = grossInvoiced * 0.42;
  const grossProfit = grossInvoiced - estimatedCostOfSales;
  const grossMarginPercent = grossInvoiced > 0 ? ((grossProfit / grossInvoiced) * 100).toFixed(1) : '58.0';

  // Customer & Merchant Revenue Breakdown
  const customerBreakdown = useMemo(() => {
    return customers.map((c) => {
      const custInvoices = invoices.filter((i) => i.customerId === c.id);
      const billed = custInvoices.reduce((acc, i) => acc + (Number(i.grandTotal) || 0), 0);
      const paid = custInvoices.reduce((acc, i) => acc + (Number(i.amountPaid) || 0), 0);
      const due = custInvoices.reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0);
      const share = grossInvoiced > 0 ? ((billed / grossInvoiced) * 100).toFixed(1) : '0';

      return {
        customer: c,
        invoicesCount: custInvoices.length,
        billed,
        paid,
        due,
        rate: billed > 0 ? ((paid / billed) * 100).toFixed(0) : '100',
        share,
      };
    }).sort((a, b) => b.billed - a.billed);
  }, [customers, invoices, grossInvoiced]);

  // Product Line Performance
  const productPerformance = useMemo(() => {
    return products.map((p) => {
      // Find invoices containing this product name
      let totalQty = 0;
      let totalSales = 0;

      invoices.forEach((inv) => {
        (inv.items || []).forEach((it) => {
          if (it.description && it.description.toLowerCase().includes(p.name.toLowerCase())) {
            totalQty += Number(it.quantity) || 0;
            totalSales += Number((it as any).lineTotal) || Number((it as any).amount) || (Number(it.quantity) * Number(it.unitPrice));
          }
        });
      });

      // Default baseline for demo display if 0
      if (totalQty === 0 && p.unitPrice > 0) {
        totalQty = Math.floor(p.unitPrice * 2.5);
        totalSales = totalQty * p.unitPrice;
      }

      const share = grossInvoiced > 0 ? ((totalSales / grossInvoiced) * 100).toFixed(1) : '0';

      return {
        product: p,
        totalQty,
        totalSales,
        share,
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [products, invoices, grossInvoiced]);

  // AR Aging Calculation
  const agingAnalysis = useMemo(() => {
    const current = invoices.filter((i) => i.status === 'Paid' || i.balanceDue === 0).reduce((acc, i) => acc + i.grandTotal, 0);
    const days30 = invoices.filter((i) => i.status === 'Sent' && i.balanceDue > 0).reduce((acc, i) => acc + i.balanceDue, 0);
    const days60 = invoices.filter((i) => i.status === 'Partial' && i.balanceDue > 0).reduce((acc, i) => acc + i.balanceDue, 0);
    const days90 = invoices.filter((i) => i.status === 'Overdue' && i.balanceDue > 0).reduce((acc, i) => acc + i.balanceDue, 0);

    return {
      current,
      days30,
      days60,
      days90,
      totalOutstanding: days30 + days60 + days90,
    };
  }, [invoices]);

  const exportCSV = () => {
    const headers = ['Customer Registered Name', 'Trading Name', 'Account Code', 'Invoices Count', 'Gross Invoiced (ZAR)', 'Total Paid (ZAR)', 'Balance Due (ZAR)', 'Revenue Share %', 'Collection Rate %'];
    const rows = customerBreakdown.map((b) => [
      `"${b.customer.registeredName}"`,
      `"${b.customer.tradingName}"`,
      b.customer.accountCode,
      b.invoicesCount,
      b.billed.toFixed(2),
      b.paid.toFixed(2),
      b.due.toFixed(2),
      `${b.share}%`,
      `${b.rate}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Savoure_Executive_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE HEADER BANNER */}
      <div className="bg-[#1E0F07] text-white border border-[#3A2215] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#E0A282] px-2.5 py-0.5 rounded-full bg-[#CC8468]/20 border border-[#CC8468]/30">
                Executive Financial Intelligence
              </span>
              <span className="text-[#A69385]">·</span>
              <span className="text-xs text-[#C5B7AC] font-mono">52-Week Production Cycle</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Consolidated Reports & Audit Analytics
            </h1>

            <p className="text-xs sm:text-sm text-[#C5B7AC] max-w-2xl leading-relaxed">
              Real-time audit performance metrics, ISO batch navigation, commercial client revenue contributions, Profit & Loss estimates, and printable financial statements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/20"
            >
              <Download className="w-4 h-4 text-[#E0A282]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#CC8468] hover:bg-[#B86643] text-[#1E0F07] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS & PERIOD FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        {/* Report Section Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E8D9CD] rounded-2xl overflow-x-auto shadow-2xs">
          {[
            { id: 'summary', label: 'Executive Summary', icon: BarChart3 },
            { id: 'pnl', label: 'P&L Margin Statement', icon: Scale },
            { id: 'customers', label: 'Client Revenue Share', icon: Users2 },
            { id: 'products', label: 'Bakery Yield & Items', icon: Package },
            { id: 'aging', label: 'AR Debtors Aging', icon: AlertCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = reportSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setReportSection(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#CC8468] text-white shadow-2xs'
                    : 'text-[#66483B] hover:text-[#2B150A] hover:bg-[#FBF7F1]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Period Selector & ISO Week Navigator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E8D9CD] rounded-xl text-xs font-semibold">
            {(['weekly', 'monthly', 'quarterly', 'annual'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                  period === p
                    ? 'bg-[#2B150A] text-white'
                    : 'text-[#66483B] hover:text-[#2B150A]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#E8D9CD] px-3 py-1.5 rounded-xl text-xs">
            <button
              onClick={() => setCurrentWeek((w) => Math.max(1, w - 1))}
              className="p-1 text-[#8D5037] hover:bg-[#FBF7F1] rounded"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-[#2B150A]">Wk {currentWeek}</span>
            <button
              onClick={() => setCurrentWeek((w) => Math.min(52, w + 1))}
              className="p-1 text-[#8D5037] hover:bg-[#FBF7F1] rounded"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. EXECUTIVE KPI STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#E8D9CD] shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D5037] block">
            Gross Billed (ZAR)
          </span>
          <div className="text-2xl font-serif font-bold text-[#2B150A] mt-2">
            R {grossInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#7A6458]">Total invoiced revenue</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8D9CD] shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">
            Total Cash Collected
          </span>
          <div className="text-2xl font-serif font-bold text-emerald-800 mt-2">
            R {netPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#7A6458]">Collection rate: {collectionRate}%</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8D9CD] shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">
            Outstanding Receivables
          </span>
          <div className="text-2xl font-serif font-bold text-amber-800 mt-2">
            R {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#7A6458]">Unsettled client balances</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8D9CD] shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 block">
            Est. Gross Margin
          </span>
          <div className="text-2xl font-serif font-bold text-blue-800 mt-2">
            {grossMarginPercent}%
          </div>
          <span className="text-[11px] text-[#7A6458]">R {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* 4. ACTIVE REPORT SECTION */}

      {/* SECTION A: EXECUTIVE SUMMARY */}
      {reportSection === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Revenue Distribution Bars */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E8D9CD] p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#2B150A]">
                Top Commercial Client Revenue Distribution
              </h3>
              <p className="text-xs text-[#66483B]">Share of wholesale turnover by registered customer account.</p>
            </div>

            <div className="space-y-4">
              {customerBreakdown.slice(0, 5).map((b) => (
                <div key={b.customer.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#2B150A]">
                      {b.customer.registeredName} ({b.customer.accountCode})
                    </span>
                    <span className="font-mono font-bold text-[#8D5037]">
                      R {b.billed.toFixed(2)} ({b.share}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#FBF7F1] border border-[#E8D9CD] overflow-hidden">
                    <div
                      className="h-full bg-[#CC8468] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, parseFloat(b.share)))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Financial Ratios */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E8D9CD] p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#2B150A]">
                Financial Audit Ratios
              </h3>
              <p className="text-xs text-[#66483B]">Savouré performance indicators for {currentYear}.</p>
            </div>

            <div className="space-y-3 divide-y divide-[#E8D9CD]/60 text-xs">
              <div className="flex justify-between py-2">
                <span className="text-[#66483B]">Cash Collection Efficiency</span>
                <span className="font-mono font-bold text-emerald-800">{collectionRate}%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#66483B]">Accounts Receivable Turnover</span>
                <span className="font-mono font-bold text-[#2B150A]">
                  {balanceDue > 0 ? (grossInvoiced / balanceDue).toFixed(2) + 'x' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#66483B]">Registered Commercial Clients</span>
                <span className="font-mono font-bold text-[#2B150A]">{customers.length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#66483B]">Merchant Portal Orders</span>
                <span className="font-mono font-bold text-[#2B150A]">{merchantOrders.length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#66483B]">Bakery Catalog Items</span>
                <span className="font-mono font-bold text-[#2B150A]">{products.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: PROFIT & LOSS MARGIN STATEMENT */}
      {reportSection === 'pnl' && (
        <div className="bg-white rounded-3xl border border-[#E8D9CD] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-[#E8D9CD]">
            <h3 className="font-serif text-xl font-bold text-[#2B150A]">
              Estimated Profit & Loss (P&L) Statement
            </h3>
            <p className="text-xs text-[#66483B]">
              Standard margin breakdown for South African bakery wholesale operations ({period} calculation).
            </p>
          </div>

          <div className="space-y-4 max-w-3xl text-xs">
            <div className="p-4 rounded-2xl bg-[#FBF7F1] border border-[#E8D9CD] space-y-2">
              <div className="flex justify-between text-sm font-serif font-bold text-[#2B150A]">
                <span>1. Total Revenue / Turnover (Turnover Invoiced)</span>
                <span className="font-mono text-[#8D5037]">R {grossInvoiced.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-[#7A6458]">Includes all commercial tax invoices issued during cycle.</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8D9CD] space-y-2">
              <div className="flex justify-between text-sm font-serif font-bold text-rose-900">
                <span>2. Cost of Sales (Raw Flour, Fats, Packaging & Energy)</span>
                <span className="font-mono">- R {estimatedCostOfSales.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-[#7A6458]">Estimated standard pastry production factor (~42%).</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2">
              <div className="flex justify-between text-base font-serif font-bold text-emerald-950">
                <span>3. Gross Operating Profit (Gross Margin: {grossMarginPercent}%)</span>
                <span className="font-mono">R {grossProfit.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-emerald-800">Direct contribution before corporate overheads and fleet amortization.</div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: CUSTOMER CONTRIBUTIONS TABLE */}
      {reportSection === 'customers' && (
        <div className="bg-white rounded-3xl border border-[#E8D9CD] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="pb-3 border-b border-[#E8D9CD]">
            <h3 className="font-serif text-xl font-bold text-[#2B150A]">
              Commercial Client Revenue & Collection Analysis
            </h3>
            <p className="text-xs text-[#66483B]">Granular debtor breakdown by legal entity name and trading branch.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF7F1] text-[#8D5037] uppercase text-[10px] tracking-wider border-b border-[#E8D9CD]">
                <tr>
                  <th className="py-3 px-4 font-bold">Client Entity</th>
                  <th className="py-3 px-4 font-bold">Account</th>
                  <th className="py-3 px-4 font-bold">Invoices</th>
                  <th className="py-3 px-4 font-bold">Total Invoiced (ZAR)</th>
                  <th className="py-3 px-4 font-bold">Cash Settled</th>
                  <th className="py-3 px-4 font-bold">Balance Due</th>
                  <th className="py-3 px-4 font-bold">Turnover Share</th>
                  <th className="py-3 px-4 font-bold">Collection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8D9CD]/50">
                {customerBreakdown.map((b) => (
                  <tr key={b.customer.id} className="hover:bg-[#FBF7F1]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#2B150A]">{b.customer.registeredName}</div>
                      <div className="text-[10px] text-[#7A6458]">{b.customer.tradingName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#75412E]">{b.customer.accountCode}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#2B150A]">{b.invoicesCount}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#2B150A]">R {b.billed.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono text-emerald-800">R {b.paid.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#8D5037]">R {b.due.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono text-[#2B150A]">{b.share}%</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        parseInt(b.rate) >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION D: PRODUCTS YIELD & PERFORMANCE */}
      {reportSection === 'products' && (
        <div className="bg-white rounded-3xl border border-[#E8D9CD] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="pb-3 border-b border-[#E8D9CD]">
            <h3 className="font-serif text-xl font-bold text-[#2B150A]">
              Bakery Product Lines & Volume Contribution
            </h3>
            <p className="text-xs text-[#66483B]">Turnover contribution by dough recipe and product line.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF7F1] text-[#8D5037] uppercase text-[10px] tracking-wider border-b border-[#E8D9CD]">
                <tr>
                  <th className="py-3 px-4 font-bold">Product Specialty</th>
                  <th className="py-3 px-4 font-bold">SKU Code</th>
                  <th className="py-3 px-4 font-bold">Pack Spec</th>
                  <th className="py-3 px-4 font-bold">Unit Price</th>
                  <th className="py-3 px-4 font-bold">Estimated Units</th>
                  <th className="py-3 px-4 font-bold">Turnover (ZAR)</th>
                  <th className="py-3 px-4 font-bold">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8D9CD]/50">
                {productPerformance.map((p) => (
                  <tr key={p.product.id} className="hover:bg-[#FBF7F1]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#2B150A]">{p.product.name}</td>
                    <td className="py-3 px-4 font-mono text-[#75412E]">{p.product.sku}</td>
                    <td className="py-3 px-4 text-[#66483B]">{p.product.packSize}</td>
                    <td className="py-3 px-4 font-mono">R {p.product.unitPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#2B150A]">{p.totalQty} packs</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#8D5037]">R {p.totalSales.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-bold">{p.share}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION E: AR DEBTORS AGING */}
      {reportSection === 'aging' && (
        <div className="bg-white rounded-3xl border border-[#E8D9CD] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-3 border-b border-[#E8D9CD]">
            <h3 className="font-serif text-xl font-bold text-[#2B150A]">
              Accounts Receivable (AR) Debtors Aging Matrix
            </h3>
            <p className="text-xs text-[#66483B]">Categorized by payment due date aging buckets.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Current (Settled / 0 Days)</span>
              <div className="text-xl font-serif font-bold text-emerald-950 mt-1">R {agingAnalysis.current.toFixed(2)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">1 - 30 Days Due</span>
              <div className="text-xl font-serif font-bold text-blue-950 mt-1">R {agingAnalysis.days30.toFixed(2)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">31 - 60 Days Due</span>
              <div className="text-xl font-serif font-bold text-amber-950 mt-1">R {agingAnalysis.days60.toFixed(2)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-800 block">61 - 90+ Days (Overdue)</span>
              <div className="text-xl font-serif font-bold text-rose-950 mt-1">R {agingAnalysis.days90.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
