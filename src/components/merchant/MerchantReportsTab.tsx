import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Clock,
  TrendingUp,
  Package,
  ShoppingBag,
  Truck,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Check,
  X,
  Trash2,
  Eye,
  RefreshCw,
  Sparkles,
  BarChart3,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  MerchantOrder,
  Invoice,
  MerchantReport,
  MerchantReportPeriod,
  MerchantReportProductSummary,
  CompanySettings
} from '../../types/erp';

interface MerchantReportsTabProps {
  currentUser: any;
  customerDisplayName: string;
  currentBranch: string;
  company: CompanySettings;
  myOrdersList: MerchantOrder[];
  merchantInvoices: Invoice[];
  merchantReports: MerchantReport[];
  saveMerchantReport: (report: Partial<MerchantReport>) => Promise<MerchantReport>;
  deleteMerchantReport: (id: string) => Promise<void>;
}

export const MerchantReportsTab: React.FC<MerchantReportsTabProps> = ({
  currentUser,
  customerDisplayName,
  currentBranch,
  company,
  myOrdersList,
  merchantInvoices,
  merchantReports,
  saveMerchantReport,
  deleteMerchantReport,
}) => {
  // Period selection state
  const [selectedPeriod, setSelectedPeriod] = useState<MerchantReportPeriod>('MONTHLY');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Current active report being viewed (either newly generated or from past archive)
  const [activeReport, setActiveReport] = useState<MerchantReport | null>(null);
  const [reportsSubTab, setReportsSubTab] = useState<'generator' | 'past-archive'>('generator');
  const [searchPastQuery, setSearchPastQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Compute date range for a given period
  const getDateRangeForPeriod = (period: MerchantReportPeriod): { start: string; end: string; label: string } => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];

    let start = '';
    let label = '';

    switch (period) {
      case 'WEEKLY': {
        const d = new Date(now.getTime() - 7 * 86400000);
        start = d.toISOString().split('T')[0];
        label = `Weekly Performance Statement (${start} – ${end})`;
        break;
      }
      case 'MONTHLY': {
        const d = new Date(now.getTime() - 30 * 86400000);
        start = d.toISOString().split('T')[0];
        label = `Monthly Procurement Statement (${start} – ${end})`;
        break;
      }
      case '3_MONTHS': {
        const d = new Date(now.getTime() - 90 * 86400000);
        start = d.toISOString().split('T')[0];
        label = `Quarterly Procurement Statement (3 Months: ${start} – ${end})`;
        break;
      }
      case '6_MONTHS': {
        const d = new Date(now.getTime() - 180 * 86400000);
        start = d.toISOString().split('T')[0];
        label = `Half-Year Procurement Statement (6 Months: ${start} – ${end})`;
        break;
      }
      case 'YEARLY': {
        const d = new Date(now.getTime() - 365 * 86400000);
        start = d.toISOString().split('T')[0];
        label = `Annual Procurement Ledger (12 Months: ${start} – ${end})`;
        break;
      }
      case 'CUSTOM':
      default: {
        start = customStartDate;
        label = `Custom Period Procurement Statement (${customStartDate} – ${customEndDate})`;
        break;
      }
    }

    return { start, end: period === 'CUSTOM' ? customEndDate : end, label };
  };

  // Generate report for a given period
  const handleGenerateReport = (period: MerchantReportPeriod = selectedPeriod) => {
    setIsGenerating(true);
    const { start, end, label } = getDateRangeForPeriod(period);
    const startTime = new Date(start + 'T00:00:00').getTime();
    const endTime = new Date(end + 'T23:59:59').getTime();

    // Filter merchant orders within this window
    const periodOrders = myOrdersList.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();
      return orderTime >= startTime && orderTime <= endTime;
    });

    // Filter merchant invoices within this window
    const periodInvoices = merchantInvoices.filter((inv) => {
      const invDate = new Date(inv.date || inv.issueDate || '').getTime();
      return invDate >= startTime && invDate <= endTime;
    });

    // Calculate aggregated metrics
    const totalOrderSpend = periodOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const totalInvoiced = periodInvoices.reduce((acc, i) => acc + (Number(i.grandTotal) || 0), 0);
    const totalPaid = periodInvoices.reduce((acc, i) => acc + (Number(i.amountPaid) || 0), 0);
    const balanceDue = periodInvoices.reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0);

    const ordersCount = periodOrders.length;
    let totalPacksOrdered = 0;
    const productSummaryMap: Record<string, MerchantReportProductSummary> = {};

    periodOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        totalPacksOrdered += item.quantity || 0;
        const key = `${item.productId || item.productName}___${item.packSize || 'Standard'}`;
        if (!productSummaryMap[key]) {
          productSummaryMap[key] = {
            productId: item.productId || key,
            productName: item.productName,
            packSize: item.packSize || 'Standard Pack',
            totalQuantity: 0,
            unitPrice: item.unitPrice || 0,
            totalSpend: 0,
          };
        }
        productSummaryMap[key].totalQuantity += item.quantity || 0;
        productSummaryMap[key].totalSpend += item.lineTotal || (item.quantity * item.unitPrice) || 0;
      });
    });

    const productSummaries = Object.values(productSummaryMap).sort((a, b) => b.totalSpend - a.totalSpend);
    const deliveredOrdersCount = periodOrders.filter((o) => o.status === 'DELIVERED').length;
    const pendingOrdersCount = periodOrders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
    const fulfillmentRate = ordersCount > 0 ? Math.round((deliveredOrdersCount / ordersCount) * 1000) / 10 : 100;
    const avgOrderValue = ordersCount > 0 ? Math.round((totalOrderSpend / ordersCount) * 100) / 100 : 0;

    const prefix = period === 'WEEKLY' ? 'W' : period === 'MONTHLY' ? 'M' : period === '3_MONTHS' ? 'Q' : period === '6_MONTHS' ? 'H' : period === 'YEARLY' ? 'A' : 'C';
    const reportNumber = `SAV-RPT-${new Date().getFullYear()}-${prefix}${Math.floor(100 + Math.random() * 900)}`;

    const report: MerchantReport = {
      id: `rpt_gen_${Date.now()}`,
      reportNumber,
      merchantId: currentUser?.id || 'mch_001',
      merchantName: currentUser?.name || customerDisplayName,
      merchantStoreName: customerDisplayName,
      merchantEmail: currentUser?.email || 'orders@savoure.co.za',
      merchantPhone: currentUser?.merchantPhone || currentUser?.phone || '061 364 5712',
      branch: currentBranch,
      deliveryAddress: currentUser?.deliveryAddress || currentUser?.merchantAddress || 'Store Commercial Dispatch Address',
      period,
      periodLabel: label,
      startDate: start,
      endDate: end,
      generatedAt: new Date().toISOString(),
      totalOrderSpend,
      totalInvoiced,
      totalPaid,
      balanceDue,
      ordersCount,
      totalPacksOrdered,
      deliveredOrdersCount,
      pendingOrdersCount,
      fulfillmentRate,
      avgOrderValue,
      orders: periodOrders,
      invoices: periodInvoices,
      productSummaries,
      notes: `Official audited commercial merchant procurement statement. Verified against Savouré ERP centralized ledger for ${customerDisplayName}.`,
    };

    setActiveReport(report);
    setIsGenerating(false);
  };

  // Save the currently generated report to past archive
  const handleSaveToPastArchive = async () => {
    if (!activeReport) return;
    try {
      await saveMerchantReport(activeReport);
      setSaveSuccessNotice(`✅ Report #${activeReport.reportNumber} archived successfully! You can view it anytime in Past Reports.`);
      setTimeout(() => setSaveSuccessNotice(null), 5000);
    } catch (e: any) {
      alert('Failed to archive report: ' + (e?.message || 'Unknown error'));
    }
  };

  // Print current report
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = (report: MerchantReport) => {
    let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
    csv += `SAVOURÉ ARTISANAL BAKERY — WHOLESALE PROCUREMENT REPORT\n`;
    csv += `Report Number,${report.reportNumber}\n`;
    csv += `Merchant Store,${report.merchantStoreName}\n`;
    csv += `Merchant Contact,${report.merchantName}\n`;
    csv += `Branch,${report.branch}\n`;
    csv += `Period,${report.periodLabel}\n`;
    csv += `Generated Date,${new Date(report.generatedAt).toLocaleString()}\n`;
    csv += `Total Wholesale Spend (ZAR),R ${report.totalOrderSpend.toFixed(2)}\n`;
    csv += `Total Invoiced (ZAR),R ${report.totalInvoiced.toFixed(2)}\n`;
    csv += `Total Paid (ZAR),R ${report.totalPaid.toFixed(2)}\n`;
    csv += `Balance Due (ZAR),R ${report.balanceDue.toFixed(2)}\n`;
    csv += `Total Orders Count,${report.ordersCount}\n`;
    csv += `Total Packs Ordered,${report.totalPacksOrdered}\n`;
    csv += `Fulfillment Rate,${report.fulfillmentRate}%\n\n`;

    csv += `PRODUCT PURCHASING BREAKDOWN\n`;
    csv += `Product Name,Packaging / Size Spec,Quantity Ordered,Unit Price (ZAR),Total Spend (ZAR)\n`;
    report.productSummaries.forEach((p) => {
      csv += `"${p.productName}","${p.packSize}",${p.totalQuantity},${p.unitPrice.toFixed(2)},${p.totalSpend.toFixed(2)}\n`;
    });

    csv += `\nORDERS LOG IN PERIOD\n`;
    csv += `Order Number,Date,Requested Delivery,Branch,Status,Total (ZAR)\n`;
    report.orders.forEach((o) => {
      csv += `"${o.orderNumber}","${new Date(o.createdAt).toLocaleDateString()}","${o.requestedDeliveryDate}","${o.branch}","${o.status}",${o.total.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${report.reportNumber}_${report.period}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter past reports
  const filteredPastReports = useMemo(() => {
    return (merchantReports || []).filter((r) => {
      const matchPeriod = periodFilter === 'ALL' || r.period === periodFilter;
      const q = searchPastQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.reportNumber.toLowerCase().includes(q) ||
        r.periodLabel.toLowerCase().includes(q) ||
        (r.startDate && r.startDate.includes(q)) ||
        (r.endDate && r.endDate.includes(q));
      return matchPeriod && matchSearch;
    });
  }, [merchantReports, periodFilter, searchPastQuery]);

  // Auto-generate initial monthly report if none active yet
  React.useEffect(() => {
    if (!activeReport) {
      handleGenerateReport('MONTHLY');
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Print Styles for Executive Cleanliness */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #merchant-print-report, #merchant-print-report * {
            visibility: visible;
          }
          #merchant-print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: #1E0F07 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Controls Bar: Sub-Tabs & Actions */}
      <div className="bg-white rounded-3xl border border-[#E8D9CD] p-6 shadow-sm no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E8D9CD]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-bold text-[#2B150A] flex items-center gap-2.5">
                <BarChart3 className="w-6 h-6 text-[#CC8468]" />
                <span>Commercial Merchant Reports & Procurement Audits</span>
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#EAD8C6] text-[#75412E]">
                Official Records
              </span>
            </div>
            <p className="text-xs text-[#66483B] mt-1">
              Generate audit-grade weekly, monthly, 3-month, 6-month, and yearly procurement statements with product breakdowns, invoice settlements, and past historical archives.
            </p>
          </div>

          {/* Sub-tab navigation */}
          <div className="flex items-center bg-[#FBF7F1] p-1.5 rounded-2xl border border-[#BD896E]/30 shrink-0">
            <button
              onClick={() => setReportsSubTab('generator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                reportsSubTab === 'generator'
                  ? 'bg-[#1E0F07] text-white shadow-xs'
                  : 'text-[#66483B] hover:text-[#1E0F07]'
              }`}
            >
              <FileText className="w-4 h-4 text-[#CC8468]" />
              <span>Report Generator</span>
            </button>
            <button
              onClick={() => setReportsSubTab('past-archive')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                reportsSubTab === 'past-archive'
                  ? 'bg-[#1E0F07] text-white shadow-xs'
                  : 'text-[#66483B] hover:text-[#1E0F07]'
              }`}
            >
              <Clock className="w-4 h-4 text-[#CC8468]" />
              <span>Past Reports Archive</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-[#CC8468]/30 text-[#E0A282]">
                {merchantReports.length}
              </span>
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        {saveSuccessNotice && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessNotice}</span>
            </div>
            <button onClick={() => setSaveSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Generator Controls */}
        {reportsSubTab === 'generator' && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#75412E] mb-2">
                  Select Reporting Frequency / Horizon
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'WEEKLY', label: 'Weekly (Last 7 Days)' },
                    { id: 'MONTHLY', label: 'Monthly (Last 30 Days)' },
                    { id: '3_MONTHS', label: '3 Months (Quarterly)' },
                    { id: '6_MONTHS', label: '6 Months (Half-Year)' },
                    { id: 'YEARLY', label: 'Yearly (Annual / 12 Mo)' },
                    { id: 'CUSTOM', label: 'Custom Date Range' },
                  ].map((p) => {
                    const isSelected = selectedPeriod === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPeriod(p.id as MerchantReportPeriod);
                          if (p.id !== 'CUSTOM') {
                            handleGenerateReport(p.id as MerchantReportPeriod);
                          }
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#CC8468] text-[#1E0F07] border-[#CC8468] shadow-xs'
                            : 'bg-[#FBF7F1] text-[#66483B] border-[#BD896E]/30 hover:border-[#CC8468] hover:text-[#1E0F07]'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Date Pickers (if Custom selected) */}
              {selectedPeriod === 'CUSTOM' && (
                <div className="flex items-center gap-3 bg-[#FBF7F1] p-3 rounded-2xl border border-[#BD896E]/30">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#75412E] mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-[#BD896E]/40 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                    />
                  </div>
                  <span className="text-[#66483B] font-bold pt-4">to</span>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#75412E] mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-[#BD896E]/40 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateReport('CUSTOM')}
                    className="self-end px-3.5 py-2 rounded-xl bg-[#1E0F07] text-white text-xs font-bold hover:bg-[#3A2215] cursor-pointer transition-colors"
                  >
                    Apply Range
                  </button>
                </div>
              )}

              {/* Action Buttons for Current Report */}
              <div className="flex items-center gap-2.5 self-start lg:self-end">
                <button
                  type="button"
                  onClick={() => handleGenerateReport(selectedPeriod)}
                  disabled={isGenerating}
                  className="px-4 py-2.5 rounded-xl bg-[#CC8468] hover:bg-[#B86643] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Generate Report</span>
                </button>

                {activeReport && (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveToPastArchive}
                      className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FBF7F1] text-[#2B150A] border border-[#BD896E]/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Save this statement to your past reports archive"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Save to Past Reports</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-3.5 py-2.5 rounded-xl bg-[#1E0F07] hover:bg-[#3A2215] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Print or Save PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportCSV(activeReport)}
                      className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FBF7F1] text-[#2B150A] border border-[#BD896E]/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Download CSV Spreadsheets"
                    >
                      <Download className="w-3.5 h-3.5 text-[#8D5037]" />
                      <span>CSV</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Past Archive Controls */}
        {reportsSubTab === 'past-archive' && (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#8D5037] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search report #, date, period..."
                value={searchPastQuery}
                onChange={(e) => setSearchPastQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
              <span className="text-[11px] font-bold uppercase text-[#75412E] whitespace-nowrap">Filter:</span>
              {['ALL', 'WEEKLY', 'MONTHLY', '3_MONTHS', '6_MONTHS', 'YEARLY'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodFilter(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    periodFilter === p
                      ? 'bg-[#CC8468] text-[#1E0F07]'
                      : 'bg-[#FBF7F1] text-[#66483B] hover:text-[#1E0F07]'
                  }`}
                >
                  {p === 'ALL' ? 'All Periods' : p.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. REPORT GENERATOR VIEW: THE EXECUTIVE AUDIT STATEMENT       */}
      {/* ------------------------------------------------------------- */}
      {reportsSubTab === 'generator' && activeReport && (
        <div id="merchant-print-report" className="bg-white rounded-3xl border border-[#E8D9CD] p-6 sm:p-10 shadow-sm space-y-8">
          {/* Savouré Official Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-[#1E0F07]">
            <div className="flex items-start gap-4">
              <img
                src="/showcase/savoure-logo.png"
                alt="Savouré Logo"
                className="w-16 h-16 rounded-2xl object-contain bg-[#1E0F07] p-2 border border-[#CC8468]/40 shrink-0"
              />
              <div>
                <div className="font-serif text-2xl font-bold tracking-tight text-[#1E0F07]">
                  SAVOURÉ ARTISANAL BAKERY & FOOD SERVICES
                </div>
                <div className="text-xs text-[#66483B] font-medium mt-0.5">
                  Commercial Wholesale Division · South Africa
                </div>
                <div className="text-[11px] text-[#7A6458] mt-1 space-x-2">
                  <span>VAT No: {company?.vatNumber || '4920294819'}</span>
                  <span>·</span>
                  <span>SANHA Halal Cert: H-98214</span>
                  <span>·</span>
                  <span>Reg: {company?.registrationNumber || '2021/847291/07'}</span>
                </div>
                <div className="text-[11px] text-[#7A6458] mt-0.5">
                  14 Industria Ring Rd, Parow Industrial, Cape Town · Dispatch Desk: 061 364 5712
                </div>
              </div>
            </div>

            {/* Statement Header Meta */}
            <div className="sm:text-right space-y-1 shrink-0 bg-[#FBF7F1] sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-[#E8D9CD]">
              <span className="inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#1E0F07] text-[#E0A282]">
                Official Procurement Statement
              </span>
              <div className="font-mono text-base font-bold text-[#1E0F07]">
                Ref: {activeReport.reportNumber}
              </div>
              <div className="text-xs text-[#66483B]">
                Period: <strong className="text-[#1E0F07]">{activeReport.startDate}</strong> to <strong className="text-[#1E0F07]">{activeReport.endDate}</strong>
              </div>
              <div className="text-[11px] text-[#7A6458]">
                Generated: {new Date(activeReport.generatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Merchant Profile Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FBF7F1] p-5 rounded-2xl border border-[#BD896E]/30">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#75412E]">
                Billed Commercial Merchant Partner
              </div>
              <div className="font-serif text-lg font-bold text-[#1E0F07] mt-0.5">
                {activeReport.merchantStoreName}
              </div>
              <div className="text-xs text-[#66483B] mt-1 space-y-0.5">
                <div>Authorized Contact: <strong className="text-[#1E0F07]">{activeReport.merchantName}</strong></div>
                <div>Designated Dispatch Branch: <strong className="text-[#1E0F07]">{activeReport.branch}</strong></div>
                <div>Delivery Location: {activeReport.deliveryAddress || 'Commercial Store Front'}</div>
              </div>
            </div>

            <div className="md:text-right flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#75412E]">
                Procurement Terms & Verification
              </div>
              <div className="text-xs text-[#66483B] mt-1 space-y-0.5">
                <div>Account Standing: <span className="text-emerald-700 font-bold">Good Standing · Tier 1 Wholesale</span></div>
                <div>Payment Terms: <span className="font-semibold text-[#1E0F07]">Direct EFT / 30-Day Commercial Account</span></div>
                <div>Cold Chain Delivery: <span className="font-semibold text-[#1E0F07]">100% Refrigerated Transport</span></div>
              </div>
              <div className="text-[11px] text-emerald-800 font-bold flex items-center md:justify-end gap-1.5 mt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audited Bakery Procurement Record</span>
              </div>
            </div>
          </div>

          {/* 4 Executive KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#E8D9CD] shadow-2xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#75412E]">
                Total Wholesale Spend
              </div>
              <div className="font-serif text-xl sm:text-2xl font-bold text-[#1E0F07] mt-1">
                R {activeReport.totalOrderSpend.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#7A6458] mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Across {activeReport.ordersCount} total orders</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8D9CD] shadow-2xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#75412E]">
                Total Packs Ordered
              </div>
              <div className="font-serif text-xl sm:text-2xl font-bold text-[#1E0F07] mt-1">
                {activeReport.totalPacksOrdered} <span className="text-xs font-normal text-[#66483B]">packs</span>
              </div>
              <div className="text-[11px] text-[#7A6458] mt-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-[#8D5037]" />
                <span>Avg: {activeReport.ordersCount > 0 ? Math.round(activeReport.totalPacksOrdered / activeReport.ordersCount) : 0} packs/order</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8D9CD] shadow-2xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#75412E]">
                Fulfillment & Delivery Rate
              </div>
              <div className="font-serif text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
                {activeReport.fulfillmentRate}%
              </div>
              <div className="text-[11px] text-[#7A6458] mt-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{activeReport.deliveredOrdersCount} delivered · {activeReport.pendingOrdersCount} active</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8D9CD] shadow-2xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#75412E]">
                Outstanding Balance Due
              </div>
              <div className={`font-serif text-xl sm:text-2xl font-bold mt-1 ${
                activeReport.balanceDue > 0 ? 'text-amber-800' : 'text-emerald-700'
              }`}>
                R {activeReport.balanceDue.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#7A6458] mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Invoiced: R {activeReport.totalInvoiced.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Section: Product & Size Purchasing Distribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8D9CD]">
              <h3 className="font-serif text-lg font-bold text-[#1E0F07] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#CC8468]" />
                <span>Product & Size Purchasing Distribution</span>
              </h3>
              <span className="text-xs text-[#7A6458]">
                {activeReport.productSummaries.length} distinctive size lines
              </span>
            </div>

            {activeReport.productSummaries.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7A6458]">
                No product items were ordered within this reporting timeframe.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E8D9CD] bg-[#FBF7F1] text-[#75412E] uppercase font-bold tracking-wider text-[10px]">
                      <th className="py-3 px-3">Product Name</th>
                      <th className="py-3 px-3">Size / Pack Specification</th>
                      <th className="py-3 px-3 text-right">Units Ordered</th>
                      <th className="py-3 px-3 text-right">Unit Price</th>
                      <th className="py-3 px-3 text-right">Total Spend</th>
                      <th className="py-3 px-3 text-right">% Spend Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D9CD]/60">
                    {activeReport.productSummaries.map((prod, idx) => {
                      const share = activeReport.totalOrderSpend > 0 ? Math.round((prod.totalSpend / activeReport.totalOrderSpend) * 1000) / 10 : 0;
                      return (
                        <tr key={idx} className="hover:bg-[#FBF7F1]/50">
                          <td className="py-3 px-3 font-semibold text-[#1E0F07]">
                            {prod.productName}
                          </td>
                          <td className="py-3 px-3 text-[#66483B]">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#EAD8C6]/60 text-[#75412E]">
                              {prod.packSize}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#1E0F07]">
                            {prod.totalQuantity} packs
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-[#66483B]">
                            R {prod.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#1E0F07]">
                            R {prod.totalSpend.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-[#E8D9CD] overflow-hidden">
                                <div
                                  className="h-full bg-[#CC8468] rounded-full"
                                  style={{ width: `${Math.min(100, share)}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] text-[#7A6458] w-10 text-right">{share}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#1E0F07] font-bold text-[#1E0F07] bg-[#FBF7F1]/80">
                      <td className="py-3 px-3" colSpan={2}>Total Procurement Output</td>
                      <td className="py-3 px-3 text-right font-mono">{activeReport.totalPacksOrdered} packs</td>
                      <td className="py-3 px-3"></td>
                      <td className="py-3 px-3 text-right font-mono">R {activeReport.totalOrderSpend.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono">100.0%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Section: Orders Breakdown Ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8D9CD]">
              <h3 className="font-serif text-lg font-bold text-[#1E0F07] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#CC8468]" />
                <span>Orders Ledger in this Reporting Period</span>
              </h3>
              <span className="text-xs text-[#7A6458] font-mono">
                {activeReport.orders.length} orders
              </span>
            </div>

            {activeReport.orders.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#7A6458]">
                No orders recorded for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E8D9CD] bg-[#FBF7F1] text-[#75412E] uppercase font-bold tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Order #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Delivery Date</th>
                      <th className="py-2.5 px-3">Branch</th>
                      <th className="py-2.5 px-3">Items & Selected Sizes</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Order Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D9CD]/60">
                    {activeReport.orders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#FBF7F1]/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1E0F07]">
                          {o.orderNumber}
                        </td>
                        <td className="py-2.5 px-3 text-[#66483B]">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 text-[#66483B]">
                          {o.requestedDeliveryDate}
                        </td>
                        <td className="py-2.5 px-3 text-[#1E0F07]">
                          {o.branch}
                        </td>
                        <td className="py-2.5 px-3 text-[#66483B]">
                          <div className="space-y-0.5">
                            {o.items.map((it, i) => (
                              <div key={i} className="text-[11px]">
                                <span className="font-semibold text-[#1E0F07]">{it.quantity}×</span> {it.productName}{' '}
                                <span className="text-[#8D5037] font-mono font-medium">({it.packSize})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            o.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'DISPATCHED'
                              ? 'bg-blue-100 text-blue-800'
                              : o.status === 'PREPARING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1E0F07]">
                          R {o.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Official Verification Sign-off & Bank Details */}
          <div className="pt-6 border-t-2 border-[#1E0F07] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1 text-xs text-[#66483B]">
              <div className="font-bold text-[#1E0F07] uppercase tracking-wider text-[11px]">
                Electronic Banking Settlement Details (EFT)
              </div>
              <div>Bank: <strong className="text-[#1E0F07]">{company?.bankName || 'First National Bank (FNB)'}</strong></div>
              <div>Account Holder: <strong className="text-[#1E0F07]">{company?.accountHolder || 'Savouré Foods (Pty) Ltd'}</strong></div>
              <div>Account Number: <strong className="text-[#1E0F07]">{company?.accountNumber || '62849102941'}</strong> · Branch: <strong className="text-[#1E0F07]">{company?.branchCode || '250655'}</strong></div>
              <div>Reference: <span className="font-mono font-bold text-[#8D5037]">{currentUser?.customerId || activeReport.merchantStoreName.substring(0, 8).toUpperCase()}</span></div>
            </div>

            {/* Verification Stamp */}
            <div className="border-2 border-dashed border-[#CC8468] p-4 rounded-2xl bg-[#FBF7F1] flex items-center gap-3 shrink-0">
              <ShieldCheck className="w-10 h-10 text-[#CC8468] shrink-0" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#75412E] font-bold">
                  Savouré Audited Seal
                </div>
                <div className="font-serif text-sm font-bold text-[#1E0F07]">
                  CERTIFIED COMMERCIAL RECORD
                </div>
                <div className="text-[10px] text-[#7A6458]">
                  Verified Digital Hash: {activeReport.reportNumber.replace(/[^A-Z0-9]/g, '')}-OK
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. PAST REPORTS ARCHIVE VIEW                                  */}
      {/* ------------------------------------------------------------- */}
      {reportsSubTab === 'past-archive' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-[#2B150A]">
              Historical Reports Archive ({filteredPastReports.length})
            </h3>
            <span className="text-xs text-[#7A6458]">
              Permanent audit records for {customerDisplayName}
            </span>
          </div>

          {filteredPastReports.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E8D9CD] p-12 text-center text-[#66483B] space-y-3 shadow-sm">
              <FileText className="w-12 h-12 text-stone-300 mx-auto" />
              <div className="font-serif text-lg font-bold text-[#2B150A]">No Past Reports Found</div>
              <p className="text-xs text-[#7A6458] max-w-sm mx-auto">
                No archived reports match your search criteria. Generate a report in the Report Generator tab and click "Save to Past Reports".
              </p>
              <button
                onClick={() => setReportsSubTab('generator')}
                className="mt-2 px-4 py-2 rounded-xl bg-[#CC8468] text-white font-bold text-xs hover:bg-[#B86643] cursor-pointer transition-colors"
              >
                Go to Report Generator
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPastReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-[#E8D9CD] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        report.period === 'WEEKLY'
                          ? 'bg-blue-100 text-blue-800'
                          : report.period === 'MONTHLY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : report.period === '3_MONTHS'
                          ? 'bg-purple-100 text-purple-800'
                          : report.period === '6_MONTHS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {report.period.replace('_', ' ')}
                      </span>

                      <span className="font-mono text-xs font-bold text-[#8D5037]">
                        {report.reportNumber}
                      </span>
                    </div>

                    <h4 className="font-serif text-base font-bold text-[#1E0F07] mt-2">
                      {report.periodLabel}
                    </h4>

                    <div className="text-xs text-[#66483B] mt-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#7A6458]">
                        <Calendar className="w-3.5 h-3.5 text-[#8D5037]" />
                        <span>{report.startDate} to {report.endDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#7A6458]">
                        <Clock className="w-3.5 h-3.5 text-[#8D5037]" />
                        <span>Archived: {new Date(report.generatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E8D9CD] grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#75412E]">Total Spend</div>
                        <div className="font-mono font-bold text-sm text-[#1E0F07]">
                          R {report.totalOrderSpend.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#75412E]">Volume</div>
                        <div className="font-mono text-sm text-[#1E0F07]">
                          {report.ordersCount} orders ({report.totalPacksOrdered} packs)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E8D9CD]">
                    <button
                      onClick={() => {
                        setActiveReport(report);
                        setReportsSubTab('generator');
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#1E0F07] hover:bg-[#3A2215] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#CC8468]" />
                      <span>View Report</span>
                    </button>

                    <button
                      onClick={() => handleExportCSV(report)}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#FBF7F1] text-[#2B150A] border border-[#BD896E]/40 text-xs font-bold transition-colors cursor-pointer"
                      title="Download CSV"
                    >
                      <Download className="w-4 h-4 text-[#8D5037]" />
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete report ${report.reportNumber}?`)) {
                          await deleteMerchantReport(report.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
