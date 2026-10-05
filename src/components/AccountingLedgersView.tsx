import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { JournalEntry, JournalEntryLine } from '../types/erp';
import {
  Calculator,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building,
  Printer,
  FileText,
  CreditCard,
  Layers,
  ArrowRight,
  BookOpen,
  PieChart,
  Scale,
  Clock,
  Sparkles,
  Download,
  Trash2,
  X
} from 'lucide-react';

export const AccountingLedgersView: React.FC = () => {
  const {
    invoices,
    payments,
    stockPurchases,
    payrollPayouts,
    company,
    journalEntries,
    createJournalEntry,
    deleteJournalEntry,
    currentUser,
  } = useERP();

  const [activeTab, setActiveTab] = useState<
    'statements' | 'general-ledger' | 'journal-entries' | 'vat-201' | 'ar-aging'
  >('statements');

  // Filter periods
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');

  // Journal Entry Modal State
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
  });

  // Journal Entry Lines (starts clean, no zero defaults)
  const [journalLines, setJournalLines] = useState<
    Array<{
      accountCode: string;
      accountName: string;
      debit: string;
      credit: string;
      description: string;
    }>
  >([
    { accountCode: '1000', accountName: 'FNB Business Operating Account', debit: '', credit: '', description: '' },
    { accountCode: '4000', accountName: 'Wholesale Bakery Sales Revenue', debit: '', credit: '', description: '' },
  ]);

  // Selected Ledger Account in GL view
  const [selectedGlAccount, setSelectedGlAccount] = useState<string>('1000');
  const [glSearch, setGlSearch] = useState('');

  // ----------------------------------------------------
  // FINANCIAL CALCULATIONS & ENGINE
  // ----------------------------------------------------
  // Gross Revenue from Tax Invoices (excluding Draft)
  const validInvoices = invoices.filter((i) => i.status !== 'Draft');
  const grossRevenue = validInvoices.reduce((acc, i) => acc + (Number(i.grandTotal) || 0), 0);
  const revenueExVat = validInvoices.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);
  const outputVatTotal = validInvoices.reduce((acc, i) => acc + (Number(i.vatTotal) || 0), 0);

  // Cost of Goods Sold from Stock Purchases
  const totalStockPurchases = stockPurchases.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);
  // Estimated 15% input VAT on purchases
  const inputVatOnStock = totalStockPurchases * (15 / 115);
  const costOfGoodsSoldExVat = totalStockPurchases - inputVatOnStock;

  // Operating Expenses (Staff Payroll)
  const totalPayrollPaid = payrollPayouts
    .filter((p) => p.status === 'Paid')
    .reduce((acc, p) => acc + (Number(p.netPayout) || 0), 0);

  // Manual Journal adjustments
  const manualDebits = journalEntries.reduce((acc, je) => acc + je.totalDebit, 0);
  const manualCredits = journalEntries.reduce((acc, je) => acc + je.totalCredit, 0);

  // Gross Profit & Net Profit
  const grossProfit = revenueExVat - costOfGoodsSoldExVat;
  const grossMarginPercent = revenueExVat > 0 ? (grossProfit / revenueExVat) * 100 : 0;
  const netOperatingProfit = grossProfit - totalPayrollPaid;
  const netMarginPercent = revenueExVat > 0 ? (netOperatingProfit / revenueExVat) * 100 : 0;

  // Accounts Receivable (Unpaid Invoices)
  const totalAccountsReceivable = validInvoices.reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0);

  // Cash / Bank Position: payments received minus payroll paid minus cash/EFT stock purchases
  const totalCollections = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const estimatedBankBalance = totalCollections - totalPayrollPaid - totalStockPurchases;

  // SARS Net VAT Calculation
  const netVatPayable = outputVatTotal - inputVatOnStock;

  // ----------------------------------------------------
  // CHART OF ACCOUNTS DEFINITIONS
  // ----------------------------------------------------
  const chartOfAccounts = [
    { code: '1000', name: 'FNB Business Operating Account', type: 'Asset', normalBalance: 'Debit', balance: estimatedBankBalance },
    { code: '1100', name: 'Accounts Receivable (Trade Debtors)', type: 'Asset', normalBalance: 'Debit', balance: totalAccountsReceivable },
    { code: '1200', name: 'Raw Material Inventory & Stock on Hand', type: 'Asset', normalBalance: 'Debit', balance: totalStockPurchases },
    { code: '1500', name: 'Bakery Production Equipment & Ovens', type: 'Non-Current Asset', normalBalance: 'Debit', balance: 350000 },
    { code: '1600', name: 'Commercial Dispatch Vehicles', type: 'Non-Current Asset', normalBalance: 'Debit', balance: 280000 },
    { code: '2000', name: 'Accounts Payable (Trade Creditors)', type: 'Liability', normalBalance: 'Credit', balance: totalStockPurchases * 0.2 },
    { code: '2100', name: 'SARS VAT 201 Output Liability', type: 'Liability', normalBalance: 'Credit', balance: Math.max(0, netVatPayable) },
    { code: '2200', name: 'Accrued Payroll & PAYE Clearing', type: 'Liability', normalBalance: 'Credit', balance: totalPayrollPaid * 0.1 },
    { code: '3000', name: "Shareholder Capital & Owner's Equity", type: 'Equity', normalBalance: 'Credit', balance: 500000 },
    { code: '3100', name: 'Retained Earnings / Operating Surplus', type: 'Equity', normalBalance: 'Credit', balance: netOperatingProfit },
    { code: '4000', name: 'Wholesale Bakery Sales Revenue', type: 'Revenue', normalBalance: 'Credit', balance: revenueExVat },
    { code: '5000', name: 'Cost of Goods Sold (Flour, Butter, Ingredients)', type: 'Expense', normalBalance: 'Debit', balance: costOfGoodsSoldExVat },
    { code: '6000', name: 'Staff Salaries, Wages & Overtime', type: 'Expense', normalBalance: 'Debit', balance: totalPayrollPaid },
    { code: '6100', name: 'Bakery Energy, Water & Municipal Utilities', type: 'Expense', normalBalance: 'Debit', balance: 24500 },
    { code: '6200', name: 'Fleet Delivery Fuel & Vehicle Maintenance', type: 'Expense', normalBalance: 'Debit', balance: 18200 },
    { code: '6300', name: 'Packaging, Cartons & Label Supplies', type: 'Expense', normalBalance: 'Debit', balance: 12400 },
  ];

  // Journal Line Handlers
  const addJournalLine = () => {
    setJournalLines([
      ...journalLines,
      { accountCode: '1000', accountName: 'FNB Business Operating Account', debit: '', credit: '', description: '' },
    ]);
  };

  const removeJournalLine = (index: number) => {
    if (journalLines.length <= 2) return;
    setJournalLines(journalLines.filter((_, idx) => idx !== index));
  };

  const updateJournalLine = (index: number, field: string, value: string) => {
    const updated = [...journalLines];
    (updated[index] as any)[field] = value;
    if (field === 'accountCode') {
      const matched = chartOfAccounts.find((a) => a.code === value);
      if (matched) {
        updated[index].accountName = matched.name;
      }
    }
    setJournalLines(updated);
  };

  const totalJournalDebit = journalLines.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0);
  const totalJournalCredit = journalLines.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0);
  const isJournalBalanced = Math.abs(totalJournalDebit - totalJournalCredit) < 0.01 && totalJournalDebit > 0;

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isJournalBalanced) {
      alert(`Journal entry is not balanced! Total Debits (${totalJournalDebit.toFixed(2)}) must equal Total Credits (${totalJournalCredit.toFixed(2)}).`);
      return;
    }

    const lines: JournalEntryLine[] = journalLines.map((l, idx) => ({
      id: `jl_${Date.now()}_${idx}`,
      accountCode: l.accountCode,
      accountName: l.accountName,
      debit: parseFloat(l.debit) || 0,
      credit: parseFloat(l.credit) || 0,
      description: l.description.trim() || journalForm.description.trim(),
    }));

    try {
      await createJournalEntry({
        date: journalForm.date,
        reference: journalForm.reference.trim(),
        description: journalForm.description.trim() || 'General Journal Posting',
        lines,
        totalDebit: totalJournalDebit,
        totalCredit: totalJournalCredit,
        postedBy: currentUser?.name || 'Administrator',
      });

      setIsJournalModalOpen(false);
      setJournalForm({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
      });
      setJournalLines([
        { accountCode: '1000', accountName: 'FNB Business Operating Account', debit: '', credit: '', description: '' },
        { accountCode: '4000', accountName: 'Wholesale Bakery Sales Revenue', debit: '', credit: '', description: '' },
      ]);
    } catch (err: any) {
      alert('Failed to post journal entry: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C98A5B]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74] flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                Double-Entry Accounting & Financial Control
              </span>
              <span className="text-[#3A2D25]">·</span>
              <span className="text-xs text-[#A69385] font-serif italic">SARS Standard Compliant</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
              <span>Accounting & General Ledgers</span>
            </h1>
            <p className="text-xs text-[#A69385] mt-1 max-w-2xl leading-relaxed">
              Comprehensive double-entry general ledger, automated Profit & Loss statements, Balance Sheet, SARS VAT 201 filing summary, and manual journal postings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsJournalModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Journal Entry</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] border border-[#3A2D25] font-medium text-xs transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-[#DE9E74]" />
              <span>Print Financial Statements</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#A69385]">Gross Sales Revenue</span>
            <div className="p-2 rounded-lg bg-[#C98A5B]/10 text-[#DE9E74]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {company.currency} {grossRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#8A776B] mt-1">
            Excl. VAT: {company.currency} {revenueExVat.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#A69385]">Net Operating Profit</span>
            <div className={`p-2 rounded-lg ${netOperatingProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-bold font-mono ${netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {company.currency} {netOperatingProfit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#8A776B] mt-1">
            Net Margin: <strong className="text-white">{netMarginPercent.toFixed(1)}%</strong>
          </div>
        </div>

        <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#A69385]">SARS VAT 201 Net Position</span>
            <div className="p-2 rounded-lg bg-[#C98A5B]/10 text-[#DE9E74]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-[#DE9E74]">
            {company.currency} {Math.abs(netVatPayable).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#8A776B] mt-1">
            {netVatPayable >= 0 ? 'Payable to SARS' : 'SARS Refund Due'}
          </div>
        </div>

        <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#A69385]">Accounts Receivable (Debtors)</span>
            <div className="p-2 rounded-lg bg-[#C98A5B]/10 text-[#DE9E74]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {company.currency} {totalAccountsReceivable.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#8A776B] mt-1">
            Unsettled customer invoices
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2C211B] pb-1 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('statements')}
          className={`px-4 py-2.5 rounded-t-xl font-medium transition-colors flex items-center gap-2 border-b-2 shrink-0 ${
            activeTab === 'statements'
              ? 'border-[#C98A5B] text-white bg-[#171311]'
              : 'border-transparent text-[#8A776B] hover:text-[#EDE6DE]'
          }`}
        >
          <Scale className="w-4 h-4 text-[#DE9E74]" />
          <span>Financial Statements (P&L & Balance Sheet)</span>
        </button>

        <button
          onClick={() => setActiveTab('general-ledger')}
          className={`px-4 py-2.5 rounded-t-xl font-medium transition-colors flex items-center gap-2 border-b-2 shrink-0 ${
            activeTab === 'general-ledger'
              ? 'border-[#C98A5B] text-white bg-[#171311]'
              : 'border-transparent text-[#8A776B] hover:text-[#EDE6DE]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#DE9E74]" />
          <span>General Ledger & Chart of Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab('journal-entries')}
          className={`px-4 py-2.5 rounded-t-xl font-medium transition-colors flex items-center gap-2 border-b-2 shrink-0 ${
            activeTab === 'journal-entries'
              ? 'border-[#C98A5B] text-white bg-[#171311]'
              : 'border-transparent text-[#8A776B] hover:text-[#EDE6DE]'
          }`}
        >
          <Calculator className="w-4 h-4 text-[#DE9E74]" />
          <span>Journal Entries ({journalEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vat-201')}
          className={`px-4 py-2.5 rounded-t-xl font-medium transition-colors flex items-center gap-2 border-b-2 shrink-0 ${
            activeTab === 'vat-201'
              ? 'border-[#C98A5B] text-white bg-[#171311]'
              : 'border-transparent text-[#8A776B] hover:text-[#EDE6DE]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-[#DE9E74]" />
          <span>SARS VAT 201 Return</span>
        </button>

        <button
          onClick={() => setActiveTab('ar-aging')}
          className={`px-4 py-2.5 rounded-t-xl font-medium transition-colors flex items-center gap-2 border-b-2 shrink-0 ${
            activeTab === 'ar-aging'
              ? 'border-[#C98A5B] text-white bg-[#171311]'
              : 'border-transparent text-[#8A776B] hover:text-[#EDE6DE]'
          }`}
        >
          <Clock className="w-4 h-4 text-[#DE9E74]" />
          <span>A/R Aging Analysis</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: FINANCIAL STATEMENTS (P&L & BALANCE SHEET)     */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'statements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statement of Comprehensive Income (Profit & Loss) */}
          <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C211B] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white tracking-wide">
                  Profit & Loss Statement (Income Statement)
                </h3>
                <p className="text-xs text-[#A69385]">
                  Revenue, cost of sales, gross profit, and operating expenditures
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#221B17] text-[#DE9E74] border border-[#2C211B]">
                ZAR IFRS
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Revenue */}
              <div className="space-y-1">
                <div className="font-bold text-[#DE9E74] uppercase tracking-wider text-[11px]">
                  Operating Revenue (Turnover)
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>Wholesale Tax Invoices (Excl. VAT)</span>
                  <span className="font-mono">{company.currency} {revenueExVat.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1 font-semibold text-white border-t border-[#2C211B]/60 pl-3">
                  <span>Total Net Revenue</span>
                  <span className="font-mono">{company.currency} {revenueExVat.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Cost of Sales */}
              <div className="space-y-1 pt-2">
                <div className="font-bold text-rose-300 uppercase tracking-wider text-[11px]">
                  Cost of Sales (COGS)
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>Raw Materials & Ingredients Purchased</span>
                  <span className="font-mono text-rose-300">({company.currency} {costOfGoodsSoldExVat.toLocaleString('en-ZA', { minimumFractionDigits: 2 })})</span>
                </div>
                <div className="flex justify-between py-1 font-semibold text-white border-t border-[#2C211B]/60 pl-3">
                  <span>Total Cost of Sales</span>
                  <span className="font-mono text-rose-300">({company.currency} {costOfGoodsSoldExVat.toLocaleString('en-ZA', { minimumFractionDigits: 2 })})</span>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="p-3 rounded-xl bg-[#120F0D] border border-[#2C211B] flex justify-between items-center font-bold text-sm">
                <span className="text-white">Gross Operating Profit</span>
                <div className="text-right">
                  <div className="font-mono text-[#DE9E74]">{company.currency} {grossProfit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
                  <div className="text-[10px] text-[#A69385] font-normal">Gross Margin: {grossMarginPercent.toFixed(1)}%</div>
                </div>
              </div>

              {/* Operating Expenses */}
              <div className="space-y-1 pt-2">
                <div className="font-bold text-[#A69385] uppercase tracking-wider text-[11px]">
                  Operating Expenditures (OPEX)
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>Staff Salaries, Wages & Overtime</span>
                  <span className="font-mono text-rose-300">({company.currency} {totalPayrollPaid.toLocaleString('en-ZA', { minimumFractionDigits: 2 })})</span>
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>Bakery Utilities, Gas & Energy</span>
                  <span className="font-mono text-rose-300">({company.currency} 24,500.00)</span>
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>Delivery Logistics & Fleet Fuel</span>
                  <span className="font-mono text-rose-300">({company.currency} 18,200.00)</span>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div className="p-4 rounded-xl bg-[#C98A5B]/15 border border-[#C98A5B]/40 flex justify-between items-center font-bold text-base">
                <div>
                  <div className="text-white font-serif">Net Operating Income (EBITDA)</div>
                  <div className="text-xs text-[#DE9E74] font-normal font-sans">Net Margin: {netMarginPercent.toFixed(1)}%</div>
                </div>
                <span className="font-mono text-emerald-400">
                  {company.currency} {netOperatingProfit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Statement of Financial Position (Balance Sheet) */}
          <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C211B] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white tracking-wide">
                  Statement of Financial Position (Balance Sheet)
                </h3>
                <p className="text-xs text-[#A69385]">
                  Assets, liabilities, and owner's equity accounting equation
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                Balanced
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Assets */}
              <div className="space-y-1">
                <div className="font-bold text-[#DE9E74] uppercase tracking-wider text-[11px]">
                  Current & Non-Current Assets
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>Operating Bank Account (Cash)</span>
                  <span className="font-mono">{company.currency} {Math.max(0, estimatedBankBalance).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>Accounts Receivable (Customer Balances)</span>
                  <span className="font-mono">{company.currency} {totalAccountsReceivable.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>Inventory & Stock on Hand</span>
                  <span className="font-mono">{company.currency} {totalStockPurchases.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>Bakery Production Plant & Equipment</span>
                  <span className="font-mono">{company.currency} 350,000.00</span>
                </div>
                <div className="flex justify-between py-1 font-semibold text-white border-t border-[#2C211B]/60 pl-3">
                  <span>Total Enterprise Assets</span>
                  <span className="font-mono text-[#DE9E74]">
                    {company.currency} {(Math.max(0, estimatedBankBalance) + totalAccountsReceivable + totalStockPurchases + 350000).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Liabilities */}
              <div className="space-y-1 pt-2">
                <div className="font-bold text-rose-300 uppercase tracking-wider text-[11px]">
                  Current Liabilities
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>SARS VAT 201 Output Liability</span>
                  <span className="font-mono">{company.currency} {Math.max(0, netVatPayable).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>Trade Creditors (Accounts Payable)</span>
                  <span className="font-mono">{company.currency} {(totalStockPurchases * 0.2).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1 font-semibold text-white border-t border-[#2C211B]/60 pl-3">
                  <span>Total Liabilities</span>
                  <span className="font-mono text-rose-300">
                    {company.currency} {(Math.max(0, netVatPayable) + totalStockPurchases * 0.2).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Equity */}
              <div className="space-y-1 pt-2">
                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Owner's Equity & Retained Earnings
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>Contributed Capital</span>
                  <span className="font-mono">{company.currency} 500,000.00</span>
                </div>
                <div className="flex justify-between py-1 text-neutral-300 pl-3">
                  <span>Retained Operating Surplus</span>
                  <span className="font-mono">{company.currency} {netOperatingProfit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Total Liabilities & Equity Check */}
              <div className="p-3 rounded-xl bg-[#120F0D] border border-emerald-800/40 flex justify-between items-center font-bold text-xs">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accounting Equation Balanced (Assets = Liabilities + Equity)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: GENERAL LEDGER & CHART OF ACCOUNTS            */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'general-ledger' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chart of Accounts Directory */}
          <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2C211B]">
              <h3 className="font-serif text-base font-bold text-white">Chart of Accounts</h3>
              <span className="text-[10px] text-[#A69385] font-mono">{chartOfAccounts.length} Accounts</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A776B]" />
              <input
                type="text"
                value={glSearch}
                onChange={(e) => setGlSearch(e.target.value)}
                placeholder="Search account code or name..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F]"
              />
            </div>

            <div className="space-y-1 max-h-[550px] overflow-y-auto pr-1">
              {chartOfAccounts
                .filter(
                  (a) =>
                    !glSearch ||
                    a.code.includes(glSearch) ||
                    a.name.toLowerCase().includes(glSearch.toLowerCase())
                )
                .map((acc) => {
                  const isSelected = selectedGlAccount === acc.code;
                  return (
                    <button
                      key={acc.code}
                      onClick={() => setSelectedGlAccount(acc.code)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-[#C98A5B]/15 border-[#C98A5B] text-white shadow-xs'
                          : 'bg-[#120F0D]/60 border-[#2C211B]/60 text-neutral-300 hover:bg-[#221B17]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#DE9E74]">{acc.code}</span>
                          <span className="font-medium truncate">{acc.name}</span>
                        </div>
                        <div className="text-[10px] text-[#8A776B]">{acc.type} · Normal: {acc.normalBalance}</div>
                      </div>
                      <span className="font-mono text-[11px] text-right shrink-0 font-semibold text-white">
                        {company.currency} {(Math.abs(acc.balance) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right: Selected Account Ledger Details */}
          <div className="lg:col-span-2 bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-xl space-y-4">
            {(() => {
              const currentAcc = chartOfAccounts.find((a) => a.code === selectedGlAccount) || chartOfAccounts[0];

              // Gather journal postings for this account
              const relatedPostings: Array<{
                date: string;
                reference: string;
                description: string;
                debit: number;
                credit: number;
              }> = [];

              journalEntries.forEach((je) => {
                je.lines.forEach((l: any) => {
                  if (l.accountCode === currentAcc.code) {
                    relatedPostings.push({
                      date: je.date,
                      reference: je.entryNumber,
                      description: l.description || je.description,
                      debit: l.debit,
                      credit: l.credit,
                    });
                  }
                });
              });

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#2C211B] gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold px-2 py-0.5 rounded bg-[#C98A5B]/20 text-[#DE9E74]">
                          {currentAcc.code}
                        </span>
                        <h3 className="font-serif text-lg font-bold text-white">
                          {currentAcc.name}
                        </h3>
                      </div>
                      <div className="text-xs text-[#A69385] mt-0.5">
                        Category: <strong className="text-white">{currentAcc.type}</strong> · Normal Balance: {currentAcc.normalBalance}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#8A776B] uppercase font-mono block">Current Balance</span>
                      <span className="text-xl font-mono font-bold text-white">
                        {company.currency} {(Math.abs(currentAcc.balance) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Ledger Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#120F0D] text-[#A69385] border-b border-[#2C211B] font-serif">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Reference</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-right">Debit</th>
                          <th className="py-2.5 px-3 text-right">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2C211B]/60 text-neutral-300">
                        {relatedPostings.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-[#8A776B] italic">
                              Opening balance established. No additional manual journal entries posted to this account yet.
                            </td>
                          </tr>
                        ) : (
                          relatedPostings.map((p, idx) => (
                            <tr key={idx} className="hover:bg-[#221B17]/40">
                              <td className="py-2.5 px-3 font-mono">{p.date}</td>
                              <td className="py-2.5 px-3 font-mono text-[#DE9E74]">{p.reference}</td>
                              <td className="py-2.5 px-3">{p.description}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                                {p.debit > 0 ? `${company.currency} ${p.debit.toFixed(2)}` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                                {p.credit > 0 ? `${company.currency} ${p.credit.toFixed(2)}` : '—'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: JOURNAL ENTRIES & POSTINGS                    */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'journal-entries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-white">
              Double-Entry General Journal Entries
            </h3>
            <button
              onClick={() => setIsJournalModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Journal Entry</span>
            </button>
          </div>

          {journalEntries.length === 0 ? (
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-12 text-center">
              <Calculator className="w-12 h-12 text-[#DE9E74]/40 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-white mb-1">No Journal Entries Posted Yet</h3>
              <p className="text-xs text-[#A69385] max-w-md mx-auto mb-5 leading-relaxed">
                Post adjusting entries, depreciation allocations, or custom inter-account transfers to the general ledger.
              </p>
              <button
                onClick={() => setIsJournalModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs"
              >
                Post First Journal Entry
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {journalEntries.map((entry) => (
                <div key={entry.id} className="bg-[#171311] border border-[#2C211B] rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#2C211B] gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-xs text-[#DE9E74] px-2 py-0.5 rounded bg-[#221B17] border border-[#2C211B]">
                        {entry.entryNumber}
                      </span>
                      <span className="text-xs font-semibold text-white">{entry.description}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-[#A69385]">{entry.date}</span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete journal entry ${entry.entryNumber}?`)) {
                            deleteJournalEntry(entry.id);
                          }
                        }}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[#8A776B] text-[10px] font-mono uppercase">
                        <tr>
                          <th className="py-1 px-2">Account</th>
                          <th className="py-1 px-2">Line Description</th>
                          <th className="py-1 px-2 text-right">Debit</th>
                          <th className="py-1 px-2 text-right">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2C211B]/40">
                        {entry.lines.map((line: any) => (
                          <tr key={line.id} className="text-neutral-300">
                            <td className="py-1.5 px-2 font-mono">
                              <span className="text-[#DE9E74]">{line.accountCode}</span> · {line.accountName}
                            </td>
                            <td className="py-1.5 px-2 text-[11px] text-[#A69385]">{line.description || '—'}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-semibold text-white">
                              {line.debit > 0 ? `${company.currency} ${line.debit.toFixed(2)}` : '—'}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-semibold text-white">
                              {line.credit > 0 ? `${company.currency} ${line.credit.toFixed(2)}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: SARS VAT 201 RETURN SUMMARY                   */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'vat-201' && (
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#2C211B] gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-rose-600/20 text-rose-400 font-bold font-mono text-[10px] uppercase">
                  SARS VAT 201
                </span>
                <span className="text-xs text-[#A69385] font-mono">VAT No: {company.vatNumber}</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-white">
                South African Revenue Service VAT Return Summary
              </h3>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] border border-[#3A2D25] text-xs font-semibold flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-[#DE9E74]" />
              <span>Print VAT 201 Schedule</span>
            </button>
          </div>

          {/* SARS Return Form Simulation */}
          <div className="space-y-4 text-xs">
            {/* Box 1: Output Tax */}
            <div className="p-4 rounded-xl bg-[#120F0D] border border-[#2C211B] space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-mono text-[#DE9E74] font-bold text-xs mr-2">[Box 1]</span>
                  <span className="font-semibold text-white">Standard Rated Supplies (Tax Invoices Issued)</span>
                </div>
                <span className="font-mono text-sm font-bold text-white">
                  {company.currency} {grossRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-neutral-400 text-[11px] pt-1 border-t border-[#2C211B]/60">
                <span>Output Tax Calculated @ {company.vatRate}%</span>
                <span className="font-mono text-[#DE9E74] font-bold">
                  {company.currency} {outputVatTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Box 2: Input Tax */}
            <div className="p-4 rounded-xl bg-[#120F0D] border border-[#2C211B] space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-mono text-rose-300 font-bold text-xs mr-2">[Box 2]</span>
                  <span className="font-semibold text-white">Input Tax (Stock Purchases & Raw Material Slips)</span>
                </div>
                <span className="font-mono text-sm font-bold text-white">
                  {company.currency} {totalStockPurchases.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-neutral-400 text-[11px] pt-1 border-t border-[#2C211B]/60">
                <span>Input Tax Claimable @ {company.vatRate}%</span>
                <span className="font-mono text-rose-300 font-bold">
                  ({company.currency} {inputVatOnStock.toLocaleString('en-ZA', { minimumFractionDigits: 2 })})
                </span>
              </div>
            </div>

            {/* Net Settlement */}
            <div className="p-5 rounded-2xl bg-[#C98A5B]/15 border border-[#C98A5B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#DE9E74] font-bold block">[Box 3 - Net Assessment]</span>
                <div className="text-base font-serif font-bold text-white">
                  {netVatPayable >= 0 ? 'Total Net VAT Payable to SARS' : 'Total Net VAT Refund Due from SARS'}
                </div>
                <div className="text-xs text-[#A69385]">
                  Payable electronically before the 25th of the tax period via SARS eFiling.
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-[#DE9E74]">
                  {company.currency} {Math.abs(netVatPayable).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-neutral-400">Electronic EFT Reference: {company.vatNumber}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 5: ACCOUNTS RECEIVABLE AGING ANALYSIS            */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'ar-aging' && (
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2C211B]">
            <div>
              <h3 className="font-serif text-lg font-bold text-white">
                Accounts Receivable (A/R) Age Analysis
              </h3>
              <p className="text-xs text-[#A69385]">
                Breakdown of outstanding invoices by aging brackets (Current, 30 days, 60 days, 90+ days)
              </p>
            </div>
            <div className="font-mono text-sm font-bold text-white">
              Total Outstanding: <span className="text-[#DE9E74]">{company.currency} {totalAccountsReceivable.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120F0D] text-[#A69385] border-b border-[#2C211B] font-serif">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Invoice Total</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Aging Bracket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C211B]/60 text-neutral-300">
                {validInvoices
                  .filter((i) => (Number(i.balanceDue) || 0) > 0)
                  .map((inv) => {
                    const due = new Date(inv.dueDate);
                    const now = new Date();
                    const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));

                    let bracket = 'Current (0-30)';
                    let bracketColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                    if (diffDays > 90) {
                      bracket = '90+ Days Overdue';
                      bracketColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
                    } else if (diffDays > 60) {
                      bracket = '61-90 Days';
                      bracketColor = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
                    } else if (diffDays > 30) {
                      bracket = '31-60 Days';
                      bracketColor = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
                    }

                    return (
                      <tr key={inv.id} className="hover:bg-[#221B17]/40">
                        <td className="py-3 px-4 font-mono font-bold text-[#DE9E74]">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 font-semibold text-white">{inv.customerName}</td>
                        <td className="py-3 px-4 font-mono">{inv.dueDate}</td>
                        <td className="py-3 px-4 text-right font-mono">
                          {company.currency} {(Number(inv.grandTotal) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          {company.currency} {(Number(inv.balanceDue) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${bracketColor}`}>
                            {bracket}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREATE JOURNAL ENTRY                          */}
      {/* ---------------------------------------------------- */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-2xl my-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C211B]">
              <div>
                <h3 className="text-lg font-serif font-bold text-white tracking-tight flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#DE9E74]" />
                  <span>Post Double-Entry Journal Entry</span>
                </h3>
                <p className="text-xs text-[#A69385]">
                  Debit and Credit amounts must balance to zero before posting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsJournalModalOpen(false)}
                className="p-1 rounded text-[#8A776B] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJournal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={journalForm.date}
                    onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">Reference / Doc #</label>
                  <input
                    type="text"
                    value={journalForm.reference}
                    onChange={(e) => setJournalForm({ ...journalForm, reference: e.target.value })}
                    placeholder="e.g. ADJ-OCT-01"
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">Description / Memo</label>
                  <input
                    type="text"
                    required
                    value={journalForm.description}
                    onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                    placeholder="e.g. Month-end depreciation adjustment"
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>

              {/* Journal Line Items */}
              <div className="p-3 rounded-xl bg-[#120F0D] border border-[#2C211B] space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#2C211B]/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#DE9E74]">
                    Debit / Credit Line Allocations
                  </span>
                  <button
                    type="button"
                    onClick={addJournalLine}
                    className="px-2.5 py-1 rounded bg-[#221B17] hover:bg-[#2C211B] text-[#DE9E74] text-xs font-medium flex items-center gap-1 border border-[#2C211B]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {journalLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-12 sm:col-span-5">
                        <select
                          value={line.accountCode}
                          onChange={(e) => updateJournalLine(idx, 'accountCode', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-[#171311] border border-[#2C211B] rounded-lg text-white"
                        >
                          {chartOfAccounts.map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <input
                          type="number"
                          step="any"
                          placeholder="Debit Amount"
                          value={line.debit}
                          onChange={(e) => {
                            updateJournalLine(idx, 'debit', e.target.value);
                            if (e.target.value) updateJournalLine(idx, 'credit', '');
                          }}
                          className="w-full px-2 py-1.5 text-xs bg-[#171311] border border-[#2C211B] rounded-lg text-white font-mono placeholder-[#6E5B4F]"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-3">
                        <input
                          type="number"
                          step="any"
                          placeholder="Credit Amount"
                          value={line.credit}
                          onChange={(e) => {
                            updateJournalLine(idx, 'credit', e.target.value);
                            if (e.target.value) updateJournalLine(idx, 'debit', '');
                          }}
                          className="w-full px-2 py-1.5 text-xs bg-[#171311] border border-[#2C211B] rounded-lg text-white font-mono placeholder-[#6E5B4F]"
                        />
                      </div>

                      <div className="col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          disabled={journalLines.length <= 2}
                          onClick={() => removeJournalLine(idx)}
                          className="p-1 rounded text-neutral-500 hover:text-rose-400 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Balance Check Bar */}
                <div className="pt-2 border-t border-[#2C211B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-4">
                    <span>Total Debits: <strong className="font-mono text-white">{company.currency} {totalJournalDebit.toFixed(2)}</strong></span>
                    <span>Total Credits: <strong className="font-mono text-white">{company.currency} {totalJournalCredit.toFixed(2)}</strong></span>
                  </div>

                  <div>
                    {isJournalBalanced ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Entry is Balanced</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Difference: {company.currency} {Math.abs(totalJournalDebit - totalJournalCredit).toFixed(2)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#2C211B] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJournalModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#A69385] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isJournalBalanced}
                  className="px-5 py-2 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] disabled:opacity-40 text-[#120F0D] font-bold text-xs shadow-md transition-colors"
                >
                  Post Journal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
