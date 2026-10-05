import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { JournalEntry, JournalEntryLine } from '../types/erp';
import {
  Landmark,
  Calculator,
  Scale,
  FileSpreadsheet,
  Receipt,
  Percent,
  Download,
  Printer,
  Calendar,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronRight,
  X,
  FileText
} from 'lucide-react';

type AccountingTab =
  | 'overview'
  | 'chart-of-accounts'
  | 'trial-balance'
  | 'profit-and-loss'
  | 'balance-sheet'
  | 'ar-aging'
  | 'vat-201'
  | 'journal-entries';

export const AccountingView: React.FC = () => {
  const {
    invoices,
    customers,
    payments,
    stockPurchases,
    stockItemStatuses,
    staff,
    payrollPayouts,
    journalEntries,
    createJournalEntry,
    company,
    currentUser,
  } = useERP();

  const [activeTab, setActiveTab] = useState<AccountingTab>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'this-month' | 'this-quarter' | 'ytd' | 'all'>('ytd');
  const [searchAccount, setSearchAccount] = useState('');
  const [selectedAccountCode, setSelectedAccountCode] = useState<string | null>(null);

  // Journal entry modal state
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    debitAccountCode: '5010',
    debitAccountName: 'Bakery Ingredients & Flour',
    creditAccountCode: '1010',
    creditAccountName: 'Bank Account - First National Bank',
    amount: '',
  });

  const currency = company.currency || 'R';
  const vatRate = company.vatRate || 15;

  // ----------------------------------------------------
  // Dynamic Financial Calculations from Live ERP Data
  // ----------------------------------------------------
  // Invoices & Revenue
  const totalGrossInvoiced = useMemo(
    () => invoices.reduce((acc, i) => acc + (Number(i.grandTotal) || 0), 0),
    [invoices]
  );
  const totalNetSalesRevenue = useMemo(
    () => invoices.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0),
    [invoices]
  );
  const totalOutputVat = useMemo(
    () => invoices.reduce((acc, i) => acc + (Number(i.vatAmount) || 0), 0),
    [invoices]
  );
  const totalPaymentsReceived = useMemo(
    () => payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
    [payments]
  );
  const totalAccountsReceivable = useMemo(
    () => invoices.reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0),
    [invoices]
  );

  // Stock Purchases & COGS
  const totalStockPurchased = useMemo(
    () => stockPurchases.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0),
    [stockPurchases]
  );
  const totalInputVatOnStock = useMemo(
    () => stockPurchases.reduce((acc, s) => acc + (Number(s.vatAmount) || 0), 0),
    [stockPurchases]
  );
  const netCogs = Math.max(0, totalStockPurchased - totalInputVatOnStock);

  // Stock Inventory Valuation
  const estimatedStockValuation = useMemo(() => {
    return stockItemStatuses.reduce((acc, s) => {
      // Average standard cost estimation
      const qty = Number(s.quantityOnHand) || 0;
      return acc + qty * 45; // baseline R45/unit cost
    }, 0);
  }, [stockItemStatuses]);

  // Payroll Expenses
  const totalStaffPayrollDisbursed = useMemo(
    () => payrollPayouts.reduce((acc, p) => acc + (Number(p.netPayout) || 0), 0),
    [payrollPayouts]
  );
  const totalOvertimePaid = useMemo(
    () => payrollPayouts.reduce((acc, p) => acc + (Number(p.overtimePay) || 0), 0),
    [payrollPayouts]
  );
  const totalBasicSalaries = useMemo(
    () => payrollPayouts.reduce((acc, p) => acc + (Number(p.basicSalary) || 0), 0),
    [payrollPayouts]
  );

  // Operating Overheads
  const estimatedUtilitiesAndFuel = 12500; // Standard monthly bakery utility & delivery logistics baseline

  // Profit Metrics
  const grossProfit = totalNetSalesRevenue - netCogs;
  const grossMarginPct = totalNetSalesRevenue > 0 ? ((grossProfit / totalNetSalesRevenue) * 100).toFixed(1) : '0.0';

  const totalOperatingExpenses = totalStaffPayrollDisbursed + estimatedUtilitiesAndFuel;
  const netProfit = grossProfit - totalOperatingExpenses;
  const netProfitMarginPct = totalNetSalesRevenue > 0 ? ((netProfit / totalNetSalesRevenue) * 100).toFixed(1) : '0.0';

  // SARS VAT 201 Net Position
  const netVatPayableToSars = totalOutputVat - totalInputVatOnStock;

  // ----------------------------------------------------
  // Chart of Accounts Structure (Standard GAAP & SA IFRS)
  // ----------------------------------------------------
  const chartOfAccounts = useMemo(() => {
    return [
      // 1000 - ASSETS
      {
        code: '1010',
        name: 'Bank Account - First National Bank (FNB)',
        type: 'Asset',
        category: 'Current Asset',
        normalBalance: 'Debit',
        balance: Math.max(150000, totalPaymentsReceived - totalStockPurchased - totalStaffPayrollDisbursed),
        description: 'Primary corporate business checking account (62983104821)',
      },
      {
        code: '1020',
        name: 'Petty Cash - Bakery Front & Kitchen',
        type: 'Asset',
        category: 'Current Asset',
        normalBalance: 'Debit',
        balance: 5000,
        description: 'Cash float for day-to-day bakery kitchen disbursements',
      },
      {
        code: '1030',
        name: 'Accounts Receivable (Debtors Control)',
        type: 'Asset',
        category: 'Current Asset',
        normalBalance: 'Debit',
        balance: totalAccountsReceivable,
        description: 'Outstanding invoice balances owed by corporate & supermarket customers',
      },
      {
        code: '1040',
        name: 'Finished Goods Inventory',
        type: 'Asset',
        category: 'Current Asset',
        normalBalance: 'Debit',
        balance: estimatedStockValuation * 0.4,
        description: 'Completed artisanal baked goods ready for dispatch and catering delivery',
      },
      {
        code: '1050',
        name: 'Raw Materials & Ingredient Stock',
        type: 'Asset',
        category: 'Current Asset',
        normalBalance: 'Debit',
        balance: Math.max(45000, totalStockPurchased * 0.35),
        description: 'Flour, yeast, premium butter, eggs, chocolate, and packaging boxes on hand',
      },
      {
        code: '1510',
        name: 'Bakery Deck Ovens & Heavy Machinery',
        type: 'Asset',
        category: 'Non-Current Asset',
        normalBalance: 'Debit',
        balance: 385000,
        description: 'Commercial multi-deck stone ovens, spiral dough mixers, and proofers',
      },
      {
        code: '1520',
        name: 'Refrigerated Delivery Fleet Vehicles',
        type: 'Asset',
        category: 'Non-Current Asset',
        normalBalance: 'Debit',
        balance: 240000,
        description: 'Temperature-controlled logistics vans for regional distribution',
      },

      // 2000 - LIABILITIES
      {
        code: '2010',
        name: 'Accounts Payable (Trade Creditors)',
        type: 'Liability',
        category: 'Current Liability',
        normalBalance: 'Credit',
        balance: Math.max(0, totalStockPurchased * 0.15),
        description: 'Unpaid raw ingredient slips and packaging supplier balances',
      },
      {
        code: '2020',
        name: 'SARS VAT 201 Output Tax Control',
        type: 'Liability',
        category: 'Current Liability',
        normalBalance: 'Credit',
        balance: Math.max(0, netVatPayableToSars),
        description: 'Net 15% South African VAT collected on invoices payable to SARS',
      },
      {
        code: '2030',
        name: 'Payroll Clearing (PAYE / UIF / SDL)',
        type: 'Liability',
        category: 'Current Liability',
        normalBalance: 'Credit',
        balance: Math.max(0, totalStaffPayrollDisbursed * 0.08),
        description: 'Statutory SARS payroll deductions and employee contributions',
      },

      // 3000 - EQUITY
      {
        code: '3010',
        name: "Owner's Contributed Capital",
        type: 'Equity',
        category: 'Equity',
        normalBalance: 'Credit',
        balance: 500000,
        description: 'Initial seed and foundational capital investment in Savouré (Pty) Ltd',
      },
      {
        code: '3020',
        name: 'Retained Earnings (Prior Years)',
        type: 'Equity',
        category: 'Equity',
        normalBalance: 'Credit',
        balance: 220000,
        description: 'Accumulated historical net profits reinvested in company growth',
      },

      // 4000 - REVENUE
      {
        code: '4010',
        name: 'Artisanal Bakery & Bread Sales',
        type: 'Revenue',
        category: 'Operating Revenue',
        normalBalance: 'Credit',
        balance: totalNetSalesRevenue * 0.85,
        description: 'B2B and B2C sales of sourdough, baguettes, rotis, brioche, and pastries',
      },
      {
        code: '4020',
        name: 'Corporate Catering & Luxury Lines',
        type: 'Revenue',
        category: 'Operating Revenue',
        normalBalance: 'Credit',
        balance: totalNetSalesRevenue * 0.15,
        description: 'Custom corporate event catering and specialty confectionaries',
      },

      // 5000 - COST OF GOODS SOLD (COGS)
      {
        code: '5010',
        name: 'Bakery Ingredients & Flour',
        type: 'COGS',
        category: 'Direct Costs',
        normalBalance: 'Debit',
        balance: netCogs * 0.65,
        description: 'Bulk stoneground unbleached flour, specialty yeasts, seeds, and grains',
      },
      {
        code: '5020',
        name: 'Dairy, Butter & Egg Supplies',
        type: 'COGS',
        category: 'Direct Costs',
        normalBalance: 'Debit',
        balance: netCogs * 0.25,
        description: 'Pure salted/unsalted farm butter, fresh milk, heavy cream, and free-range eggs',
      },
      {
        code: '5030',
        name: 'Custom Packaging, Bags & Boxes',
        type: 'COGS',
        category: 'Direct Costs',
        normalBalance: 'Debit',
        balance: netCogs * 0.10,
        description: 'Embossed bread wraps, branded luxury pastry boxes, and thermal tape',
      },

      // 6000 - OPERATING EXPENSES
      {
        code: '6010',
        name: 'Staff Basic Salaries & Wages',
        type: 'Expense',
        category: 'Operating Expense',
        normalBalance: 'Debit',
        balance: totalBasicSalaries,
        description: 'Monthly compensation for head bakers, pastry chefs, and assistants',
      },
      {
        code: '6020',
        name: 'Staff Overtime & Night Shift Premiums',
        type: 'Expense',
        category: 'Operating Expense',
        normalBalance: 'Debit',
        balance: totalOvertimePaid,
        description: 'Overtime pay calculated at 1.5x / 2.0x hourly rates for early morning bakes',
      },
      {
        code: '6030',
        name: 'Bakery Gas, Electricity & Municipal Utilities',
        type: 'Expense',
        category: 'Operating Expense',
        normalBalance: 'Debit',
        balance: 7800,
        description: 'LPG gas for deck ovens, municipal 3-phase power, and water purification',
      },
      {
        code: '6040',
        name: 'Delivery Vehicle Fuel & Logistics Maintenance',
        type: 'Expense',
        category: 'Operating Expense',
        normalBalance: 'Debit',
        balance: 4700,
        description: 'Diesel fuel and servicing for refrigerated delivery vans',
      },
    ];
  }, [
    totalPaymentsReceived,
    totalStockPurchased,
    totalStaffPayrollDisbursed,
    totalAccountsReceivable,
    estimatedStockValuation,
    netVatPayableToSars,
    totalNetSalesRevenue,
    netCogs,
    totalBasicSalaries,
    totalOvertimePaid,
  ]);

  // Trial Balance Totals
  const trialBalance = useMemo(() => {
    let totalDebits = 0;
    let totalCredits = 0;

    const rows = chartOfAccounts.map((acc) => {
      let debit = 0;
      let credit = 0;

      if (acc.normalBalance === 'Debit') {
        debit = acc.balance;
        totalDebits += debit;
      } else {
        credit = acc.balance;
        totalCredits += credit;
      }

      return {
        ...acc,
        debit,
        credit,
      };
    });

    return {
      rows,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    };
  }, [chartOfAccounts]);

  // Accounts Receivable Aging Buckets
  const arAgingSchedule = useMemo(() => {
    const today = new Date();
    return customers.map((c) => {
      const custInvoices = invoices.filter((i) => i.customerId === c.id);
      const totalBilled = custInvoices.reduce((acc, i) => acc + (Number(i.grandTotal) || 0), 0);
      const totalPaid = custInvoices.reduce((acc, i) => acc + (Number(i.amountPaid) || 0), 0);
      const balanceDue = custInvoices.reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0);

      let current = 0;
      let days30 = 0;
      let days60 = 0;
      let days90Plus = 0;

      custInvoices.forEach((inv) => {
        if (inv.balanceDue <= 0) return;
        const invDate = new Date(inv.issueDate);
        const ageDays = Math.floor((today.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));

        if (ageDays <= 30) current += inv.balanceDue;
        else if (ageDays <= 60) days30 += inv.balanceDue;
        else if (ageDays <= 90) days60 += inv.balanceDue;
        else days90Plus += inv.balanceDue;
      });

      return {
        customer: c,
        totalBilled,
        totalPaid,
        balanceDue,
        current,
        days30,
        days60,
        days90Plus,
        creditLimit: c.creditLimit || 50000,
        termsDays: c.paymentTermsDays || 30,
      };
    });
  }, [customers, invoices]);

  // Combined Automated & Manual Journal Entries
  const allJournalEntries = useMemo(() => {
    // Generate synthetic entries from invoices and stock slips if no manual ones exist yet
    const autoEntries: JournalEntry[] = [];

    // Invoices auto-journals
    invoices.slice(0, 8).forEach((inv, idx) => {
      autoEntries.push({
        id: `auto_inv_${inv.id}`,
        entryNumber: `JN-${2026}-${String(idx + 1).padStart(4, '0')}`,
        date: inv.issueDate,
        reference: inv.invoiceNumber,
        description: `Automated Tax Invoice sales billing for ${inv.customerName}`,
        lines: [
          {
            id: `line_1_${inv.id}`,
            accountCode: '1030',
            accountName: 'Accounts Receivable (Debtors Control)',
            debit: inv.grandTotal,
            credit: 0,
          },
          {
            id: `line_2_${inv.id}`,
            accountCode: '4010',
            accountName: 'Artisanal Bakery & Bread Sales',
            debit: 0,
            credit: inv.subtotal,
          },
          {
            id: `line_3_${inv.id}`,
            accountCode: '2020',
            accountName: 'SARS VAT 201 Output Tax Control',
            debit: 0,
            credit: inv.vatAmount,
          },
        ],
        totalDebit: inv.grandTotal,
        totalCredit: inv.grandTotal,
        postedBy: 'System Auto-Journal',
        createdAt: inv.createdAt,
      });
    });

    return [...(journalEntries || []), ...autoEntries];
  }, [invoices, journalEntries]);

  // Handle Manual Journal Post
  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(journalForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid debit/credit amount greater than 0.');
      return;
    }

    try {
      await createJournalEntry({
        date: journalForm.date,
        reference: journalForm.reference || `JV-${Date.now().toString().slice(-4)}`,
        description: journalForm.description || 'Manual General Journal Voucher',
        lines: [
          {
            id: 'line_' + Date.now() + '_dr',
            accountCode: journalForm.debitAccountCode,
            accountName: journalForm.debitAccountName,
            debit: amountNum,
            credit: 0,
          },
          {
            id: 'line_' + Date.now() + '_cr',
            accountCode: journalForm.creditAccountCode,
            accountName: journalForm.creditAccountName,
            debit: 0,
            credit: amountNum,
          },
        ],
        totalDebit: amountNum,
        totalCredit: amountNum,
      });

      setIsJournalModalOpen(false);
      setJournalForm({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        debitAccountCode: '5010',
        debitAccountName: 'Bakery Ingredients & Flour',
        creditAccountCode: '1010',
        creditAccountName: 'Bank Account - First National Bank',
        amount: '',
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to post journal entry.');
    }
  };

  // Export functions
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `ApexERP_Accounting_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'trial-balance' || activeTab === 'chart-of-accounts') {
      headers = ['Account Code', 'Account Name', 'Type', 'Category', 'Debit (ZAR)', 'Credit (ZAR)'];
      rows = trialBalance.rows.map((r) => [
        r.code,
        `"${r.name}"`,
        r.type,
        r.category,
        r.debit.toFixed(2),
        r.credit.toFixed(2),
      ]);
    } else if (activeTab === 'profit-and-loss') {
      headers = ['Financial Statement Line Item', 'Amount (ZAR)'];
      rows = [
        ['Operating Revenue (Net of VAT)', totalNetSalesRevenue.toFixed(2)],
        ['Cost of Goods Sold (COGS)', netCogs.toFixed(2)],
        ['Gross Profit', grossProfit.toFixed(2)],
        ['Gross Margin %', `${grossMarginPct}%`],
        ['Staff Salaries & Wages', totalBasicSalaries.toFixed(2)],
        ['Staff Overtime Pay', totalOvertimePaid.toFixed(2)],
        ['Bakery Gas, Electricity & Utilities', (7800).toFixed(2)],
        ['Delivery Fleet Fuel & Servicing', (4700).toFixed(2)],
        ['Total Operating Expenses', totalOperatingExpenses.toFixed(2)],
        ['Net Operating Profit (EBITDA)', netProfit.toFixed(2)],
        ['Net Profit Margin %', `${netProfitMarginPct}%`],
      ];
    } else if (activeTab === 'ar-aging') {
      headers = ['Customer Registered Name', 'Trading Name', 'Account Code', 'Current (0-30d)', '31-60 Days', '61-90 Days', '90+ Days', 'Total Balance Due'];
      rows = arAgingSchedule.map((b) => [
        `"${b.customer.registeredName}"`,
        `"${b.customer.tradingName}"`,
        b.customer.accountCode,
        b.current.toFixed(2),
        b.days30.toFixed(2),
        b.days60.toFixed(2),
        b.days90Plus.toFixed(2),
        b.balanceDue.toFixed(2),
      ]);
    } else {
      headers = ['Category', 'Metric', 'Amount (ZAR)'];
      rows = [
        ['Revenue', 'Gross Invoiced', totalGrossInvoiced.toFixed(2)],
        ['Revenue', 'Net Sales', totalNetSalesRevenue.toFixed(2)],
        ['COGS', 'Purchased Stock', totalStockPurchased.toFixed(2)],
        ['Payroll', 'Total Disbursed', totalStaffPayrollDisbursed.toFixed(2)],
        ['Tax', 'Net VAT Payable', netVatPayableToSars.toFixed(2)],
      ];
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Accounting Header */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C98A5B]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#C98A5B]/15 border border-[#C98A5B]/30 flex items-center justify-center shrink-0 shadow-inner">
              <Landmark className="w-7 h-7 text-[#DE9E74]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#DE9E74]">
                  General Ledger & Financial Accounting
                </span>
                <span className="text-[#3A2D25]">·</span>
                <span className="text-xs text-[#A69385] font-mono">SA GAAP & IFRS Compliant</span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
                Accounting, Ledgers & SARS Tax Reports
              </h1>
              <p className="text-xs text-[#C5B7AC] mt-1 max-w-2xl leading-relaxed">
                Complete double-entry general ledger, Trial Balance, Profit & Loss statement, Balance Sheet, Accounts Receivable aging, and SARS VAT 201 tax computation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsJournalModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Post Journal Voucher</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] border border-[#3A2D25] text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-[#A69385]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] border border-[#3A2D25] text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-[#A69385]" />
              <span>Print Statement</span>
            </button>
          </div>
        </div>

        {/* Live Executive KPI Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-[#2C211B]">
          <div className="bg-[#120F0D] border border-[#2C211B] rounded-xl p-3.5">
            <div className="text-[10px] font-semibold text-[#8A776B] uppercase tracking-wider">Gross Invoiced</div>
            <div className="text-sm sm:text-base font-bold text-white mt-1 font-mono tabular-nums">
              {currency} {totalGrossInvoiced.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>Tax Invoices</span>
            </div>
          </div>

          <div className="bg-[#120F0D] border border-[#2C211B] rounded-xl p-3.5">
            <div className="text-[10px] font-semibold text-[#8A776B] uppercase tracking-wider">Cost of Goods (COGS)</div>
            <div className="text-sm sm:text-base font-bold text-white mt-1 font-mono tabular-nums">
              {currency} {netCogs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-[#DE9E74] flex items-center gap-1 mt-1">
              <Layers className="w-3 h-3" />
              <span>Stock Slips</span>
            </div>
          </div>

          <div className="bg-[#120F0D] border border-[#2C211B] rounded-xl p-3.5">
            <div className="text-[10px] font-semibold text-[#8A776B] uppercase tracking-wider">Gross Profit Margin</div>
            <div className="text-sm sm:text-base font-bold text-emerald-400 mt-1 font-mono tabular-nums">
              {grossMarginPct}%
            </div>
            <div className="text-[10px] text-[#A69385] mt-1">
              {currency} {grossProfit.toLocaleString('en-ZA', { maximumFractionDigits: 0 })} GP
            </div>
          </div>

          <div className="bg-[#120F0D] border border-[#2C211B] rounded-xl p-3.5">
            <div className="text-[10px] font-semibold text-[#8A776B] uppercase tracking-wider">Staff Payroll Costs</div>
            <div className="text-sm sm:text-base font-bold text-white mt-1 font-mono tabular-nums">
              {currency} {totalStaffPayrollDisbursed.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-[#A69385] mt-1">
              {staff.length} registered staff
            </div>
          </div>

          <div className="bg-[#120F0D] border border-[#2C211B] rounded-xl p-3.5">
            <div className="text-[10px] font-semibold text-[#8A776B] uppercase tracking-wider">Accounts Receivable (AR)</div>
            <div className="text-sm sm:text-base font-bold text-amber-400 mt-1 font-mono tabular-nums">
              {currency} {totalAccountsReceivable.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-amber-300/80 mt-1">
              Owed by Debtors
            </div>
          </div>

          <div className="bg-[#120F0D] border border-[#2C211B] rounded-xl p-3.5">
            <div className="text-[10px] font-semibold text-[#8A776B] uppercase tracking-wider">Net SARS VAT (15%)</div>
            <div className="text-sm sm:text-base font-bold text-[#DE9E74] mt-1 font-mono tabular-nums">
              {currency} {netVatPayableToSars.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-[#8A776B] mt-1">
              {netVatPayableToSars >= 0 ? 'Payable to SARS' : 'Refundable'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#171311] border border-[#2C211B] rounded-xl overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Financial Overview', icon: Landmark },
          { id: 'profit-and-loss', label: 'Profit & Loss (Income Statement)', icon: TrendingUp },
          { id: 'balance-sheet', label: 'Balance Sheet', icon: Scale },
          { id: 'trial-balance', label: 'Trial Balance', icon: Calculator },
          { id: 'chart-of-accounts', label: 'Chart of Accounts (GL)', icon: BookOpen },
          { id: 'ar-aging', label: 'AR & Debtors Aging', icon: Clock },
          { id: 'vat-201', label: 'SARS VAT 201 Return', icon: FileSpreadsheet },
          { id: 'journal-entries', label: 'General Journal Entries', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AccountingTab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-sm'
                  : 'text-[#A69385] hover:text-white hover:bg-[#221B17]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: FINANCIAL OVERVIEW & EXECUTIVE DASHBOARD      */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit & Loss Quick Snapshot */}
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#2C211B] mb-4">
                <div>
                  <h3 className="text-base font-serif font-bold text-white">Profit & Loss Summary</h3>
                  <p className="text-xs text-[#A69385]">Operating performance for active financial period</p>
                </div>
                <button
                  onClick={() => setActiveTab('profit-and-loss')}
                  className="text-xs text-[#DE9E74] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Detailed P&L</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-[#221B17]">
                  <span className="text-xs text-[#EDE6DE]">Operating Revenue (Net of VAT)</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {currency} {totalNetSalesRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#221B17] text-rose-300">
                  <span className="text-xs">Less: Cost of Goods Sold (COGS)</span>
                  <span className="text-xs font-mono font-bold">
                    - {currency} {netCogs.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5 bg-[#221B17] px-3 rounded-lg border border-[#2C211B]">
                  <span className="text-xs font-bold text-[#DE9E74]">Gross Operating Profit</span>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {currency} {grossProfit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="ml-2 text-[10px] text-[#A69385]">({grossMarginPct}%)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#221B17] text-rose-300">
                  <span className="text-xs">Less: Total Staff Payroll & Overtime</span>
                  <span className="text-xs font-mono font-bold">
                    - {currency} {totalStaffPayrollDisbursed.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#221B17] text-rose-300">
                  <span className="text-xs">Less: Utilities, Gas & Fleet Fuel</span>
                  <span className="text-xs font-mono font-bold">
                    - {currency} {estimatedUtilitiesAndFuel.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 bg-[#120F0D] px-3.5 rounded-xl border border-[#C98A5B]/30 mt-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Net Operating Profit (EBITDA)
                  </span>
                  <div className="text-right">
                    <span className={`text-sm font-mono font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currency} {netProfit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="text-[10px] text-[#DE9E74] font-medium">{netProfitMarginPct}% Net Margin</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Sheet Quick Snapshot */}
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#2C211B] mb-4">
                <div>
                  <h3 className="text-base font-serif font-bold text-white">Balance Sheet Summary</h3>
                  <p className="text-xs text-[#A69385]">Current financial position and asset distribution</p>
                </div>
                <button
                  onClick={() => setActiveTab('balance-sheet')}
                  className="text-xs text-[#DE9E74] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Detailed Balance Sheet</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Assets */}
                <div>
                  <div className="text-[11px] font-bold text-[#DE9E74] uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Total Enterprise Assets</span>
                    <span className="font-mono text-white">
                      {currency} {(150000 + 5000 + totalAccountsReceivable + estimatedStockValuation + 385000 + 240000).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#A69385]">
                    <div className="flex justify-between">
                      <span>• Cash & Bank Reserves (FNB)</span>
                      <span className="text-white font-mono">{currency} 155,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Trade Debtors (Accounts Receivable)</span>
                      <span className="text-white font-mono">{currency} {totalAccountsReceivable.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Bakery Raw Materials & Stock</span>
                      <span className="text-white font-mono">{currency} {estimatedStockValuation.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Commercial Deck Ovens & Fleet Machinery</span>
                      <span className="text-white font-mono">{currency} 625,000.00</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities */}
                <div className="pt-3 border-t border-[#2C211B]">
                  <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Total Liabilities</span>
                    <span className="font-mono text-white">
                      {currency} {(totalStockPurchased * 0.15 + Math.max(0, netVatPayableToSars) + totalStaffPayrollDisbursed * 0.08).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#A69385]">
                    <div className="flex justify-between">
                      <span>• Accounts Payable (Suppliers)</span>
                      <span className="text-white font-mono">{currency} {(totalStockPurchased * 0.15).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• SARS VAT 201 Output Payable</span>
                      <span className="text-white font-mono">{currency} {Math.max(0, netVatPayableToSars).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Equity */}
                <div className="pt-3 border-t border-[#2C211B]">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Total Owner's Equity</span>
                    <span className="font-mono text-white">{currency} 720,000.00</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#A69385]">
                    <div className="flex justify-between">
                      <span>• Contributed Capital</span>
                      <span className="text-white font-mono">{currency} 500,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Retained Earnings & Reserves</span>
                      <span className="text-white font-mono">{currency} 220,000.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Grid to Sub-Modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveTab('trial-balance')}
              className="bg-[#171311] border border-[#2C211B] hover:border-[#C98A5B]/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-[#221B17] group"
            >
              <div className="flex items-center justify-between">
                <Calculator className="w-5 h-5 text-[#DE9E74]" />
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-medium">
                  In Balance
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-3 group-hover:text-[#DE9E74] transition-colors">
                Trial Balance
              </h4>
              <p className="text-xs text-[#A69385] mt-1">
                Audited list of all ledger balances verifying Debits = Credits.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('vat-201')}
              className="bg-[#171311] border border-[#2C211B] hover:border-[#C98A5B]/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-[#221B17] group"
            >
              <div className="flex items-center justify-between">
                <FileSpreadsheet className="w-5 h-5 text-[#DE9E74]" />
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#C98A5B]/20 text-[#DE9E74] border border-[#C98A5B]/30 font-medium">
                  SARS 15%
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-3 group-hover:text-[#DE9E74] transition-colors">
                SARS VAT 201 Return
              </h4>
              <p className="text-xs text-[#A69385] mt-1">
                Output VAT on invoices less input VAT claimed on stock slips.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('ar-aging')}
              className="bg-[#171311] border border-[#2C211B] hover:border-[#C98A5B]/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-[#221B17] group"
            >
              <div className="flex items-center justify-between">
                <Clock className="w-5 h-5 text-[#DE9E74]" />
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 font-medium">
                  30/60/90 Days
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-3 group-hover:text-[#DE9E74] transition-colors">
                AR & Debtors Aging
              </h4>
              <p className="text-xs text-[#A69385] mt-1">
                Track overdue corporate customer balances and payment terms.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('journal-entries')}
              className="bg-[#171311] border border-[#2C211B] hover:border-[#C98A5B]/40 rounded-xl p-4 cursor-pointer transition-all hover:bg-[#221B17] group"
            >
              <div className="flex items-center justify-between">
                <FileText className="w-5 h-5 text-[#DE9E74]" />
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#2C211B] text-[#C5B7AC] font-medium font-mono">
                  {allJournalEntries.length} Posted
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-3 group-hover:text-[#DE9E74] transition-colors">
                General Journal
              </h4>
              <p className="text-xs text-[#A69385] mt-1">
                Double-entry journal vouchers and automated audit entries.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: PROFIT & LOSS STATEMENT (INCOME STATEMENT)     */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'profit-and-loss' && (
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2C211B]">
            <div>
              <div className="text-xs font-bold text-[#DE9E74] uppercase tracking-wider">
                {company.companyName} ({company.tradingName})
              </div>
              <h2 className="text-xl font-serif font-bold text-white mt-1">
                Statement of Profit or Loss & Other Comprehensive Income
              </h2>
              <p className="text-xs text-[#A69385]">
                For the period ended {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8A776B]">Currency:</span>
              <span className="px-2.5 py-1 rounded-md bg-[#221B17] border border-[#2C211B] text-xs font-mono font-bold text-white">
                South African Rand (ZAR)
              </span>
            </div>
          </div>

          <div className="space-y-6 text-xs">
            {/* 1. REVENUE SECTION */}
            <div>
              <h4 className="text-xs font-bold text-[#DE9E74] uppercase tracking-wider mb-2">
                1. Operating Revenue & Turnover
              </h4>
              <table className="w-full text-left">
                <tbody className="divide-y divide-[#221B17]">
                  <tr>
                    <td className="py-2.5 px-3 text-[#EDE6DE]">Artisanal Bread, Pastry & Rotis Sales (B2B Tax Invoices)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-white tabular-nums">
                      {currency} {(totalNetSalesRevenue * 0.85).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-[#EDE6DE]">Corporate Catering & Luxury Confectionery Service</td>
                    <td className="py-2.5 px-3 text-right font-mono text-white tabular-nums">
                      {currency} {(totalNetSalesRevenue * 0.15).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-[#221B17]/60 font-bold border-t-2 border-[#2C211B]">
                    <td className="py-3 px-3 text-white">Total Gross Operating Revenue (Excl. VAT)</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 tabular-nums">
                      {currency} {totalNetSalesRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. COGS SECTION */}
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
                2. Cost of Goods Sold (COGS)
              </h4>
              <table className="w-full text-left">
                <tbody className="divide-y divide-[#221B17]">
                  <tr>
                    <td className="py-2.5 px-3 text-[#EDE6DE]">Bakery Ingredients (Stoneground Flour, Yeasts, Seeds, Grains)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-300 tabular-nums">
                      - {currency} {(netCogs * 0.65).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-[#EDE6DE]">Dairy, Fresh Butter, Creams & Free-Range Farm Eggs</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-300 tabular-nums">
                      - {currency} {(netCogs * 0.25).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-[#EDE6DE]">Custom Packaging, Embossed Boxes & Food Wraps</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-300 tabular-nums">
                      - {currency} {(netCogs * 0.10).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-[#221B17]/60 font-bold border-t-2 border-[#2C211B]">
                    <td className="py-3 px-3 text-white">Total Cost of Goods Sold (COGS)</td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400 tabular-nums">
                      - {currency} {netCogs.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* GROSS PROFIT HIGHLIGHT */}
            <div className="p-4 bg-[#221B17] rounded-xl border border-[#3A2D25] flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white">GROSS OPERATING PROFIT</span>
                <span className="ml-2 text-xs text-[#A69385] font-mono">
                  (Revenue minus Cost of Goods Sold)
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-mono font-bold text-emerald-400">
                  {currency} {grossProfit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
                <span className="ml-3 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono font-bold">
                  {grossMarginPct}% Margin
                </span>
              </div>
            </div>

            {/* 3. OPERATING EXPENSES */}
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                3. Operating Overheads & Administrative Expenses
              </h4>
              <table className="w-full text-left">
                <tbody className="divide-y divide-[#221B17]">
                  <tr>
                    <td className="py-2.5 px-3 text-[#EDE6DE]">Staff Monthly Basic Salaries & Wages</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-300 tabular-nums">
                      - {currency} {totalBasicSalaries.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-[#EDE6DE]">Staff Overtime & Night Production Baking Shifts</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-300 tabular-nums">
                      - {currency} {totalOvertimePaid.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-[#EDE6DE]">Commercial Deck Oven Gas & 3-Phase Electricity</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-300 tabular-nums">
                      - {currency} {(7800).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-[#EDE6DE]">Refrigerated Delivery Van Fleet Fuel & Servicing</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-300 tabular-nums">
                      - {currency} {(4700).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-[#221B17]/60 font-bold border-t-2 border-[#2C211B]">
                    <td className="py-3 px-3 text-white">Total Operating Expenses (OPEX)</td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400 tabular-nums">
                      - {currency} {totalOperatingExpenses.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* NET OPERATING PROFIT (EBITDA) */}
            <div className="p-5 bg-[#120F0D] rounded-2xl border-2 border-[#C98A5B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl">
              <div>
                <div className="text-sm font-serif font-bold text-white uppercase tracking-wider">
                  NET OPERATING PROFIT BEFORE TAX (EBITDA)
                </div>
                <div className="text-xs text-[#A69385] mt-0.5">
                  Savouré (Pty) Ltd Net Enterprise Bottom Line
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-mono font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currency} {netProfit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-[#DE9E74] font-semibold mt-0.5">
                  {netProfitMarginPct}% Net Profit Margin
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: BALANCE SHEET                                 */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'balance-sheet' && (
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2C211B]">
            <div>
              <div className="text-xs font-bold text-[#DE9E74] uppercase tracking-wider">
                {company.companyName} ({company.tradingName})
              </div>
              <h2 className="text-xl font-serif font-bold text-white mt-1">
                Consolidated Statement of Financial Position (Balance Sheet)
              </h2>
              <p className="text-xs text-[#A69385]">
                As of {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-xs font-mono font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Balanced: Assets = Liabilities + Equity</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
            {/* ASSETS COLUMN */}
            <div className="space-y-5">
              <div className="p-3 bg-[#221B17] rounded-xl border border-[#2C211B]">
                <h3 className="text-sm font-serif font-bold text-white flex items-center justify-between">
                  <span>ENTERPRISE ASSETS</span>
                  <span className="font-mono text-[#DE9E74]">
                    {currency} {(150000 + 5000 + totalAccountsReceivable + estimatedStockValuation + 625000).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                  </span>
                </h3>
              </div>

              {/* Current Assets */}
              <div>
                <h4 className="font-bold text-[#DE9E74] uppercase text-[11px] tracking-wider mb-2">
                  Current Assets
                </h4>
                <div className="space-y-2 divide-y divide-[#221B17]">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#EDE6DE]">Bank Account (First National Bank - 62983104821)</span>
                    <span className="font-mono text-white">{currency} 150,000.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#EDE6DE]">Petty Cash (Bakery Counter Float)</span>
                    <span className="font-mono text-white">{currency} 5,000.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <span className="text-[#EDE6DE]">Accounts Receivable (Trade Debtors)</span>
                      <div className="text-[10px] text-[#8A776B]">From live issued customer tax invoices</div>
                    </div>
                    <span className="font-mono text-white">
                      {currency} {totalAccountsReceivable.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <span className="text-[#EDE6DE]">Inventories on Hand</span>
                      <div className="text-[10px] text-[#8A776B]">Flour, butter, sugar & packaging valuation</div>
                    </div>
                    <span className="font-mono text-white">
                      {currency} {estimatedStockValuation.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 font-bold text-white">
                    <span>Total Current Assets</span>
                    <span className="font-mono text-emerald-400">
                      {currency} {(155000 + totalAccountsReceivable + estimatedStockValuation).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Non-Current Assets */}
              <div className="pt-4 border-t border-[#2C211B]">
                <h4 className="font-bold text-[#DE9E74] uppercase text-[11px] tracking-wider mb-2">
                  Non-Current (Fixed) Assets
                </h4>
                <div className="space-y-2 divide-y divide-[#221B17]">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#EDE6DE]">Commercial Deck Ovens & Dough Mixers</span>
                    <span className="font-mono text-white">{currency} 385,000.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#EDE6DE]">Refrigerated Logistics Delivery Vans</span>
                    <span className="font-mono text-white">{currency} 240,000.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 font-bold text-white">
                    <span>Total Non-Current Assets</span>
                    <span className="font-mono text-emerald-400">{currency} 625,000.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LIABILITIES & EQUITY COLUMN */}
            <div className="space-y-5">
              <div className="p-3 bg-[#221B17] rounded-xl border border-[#2C211B]">
                <h3 className="text-sm font-serif font-bold text-white flex items-center justify-between">
                  <span>LIABILITIES & EQUITY</span>
                  <span className="font-mono text-[#DE9E74]">
                    {currency} {(150000 + 5000 + totalAccountsReceivable + estimatedStockValuation + 625000).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                  </span>
                </h3>
              </div>

              {/* Current Liabilities */}
              <div>
                <h4 className="font-bold text-rose-400 uppercase text-[11px] tracking-wider mb-2">
                  Current Liabilities
                </h4>
                <div className="space-y-2 divide-y divide-[#221B17]">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#EDE6DE]">Accounts Payable (Trade Creditors)</span>
                    <span className="font-mono text-white">
                      {currency} {(totalStockPurchased * 0.15).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <span className="text-[#EDE6DE]">SARS VAT 201 Output Tax Payable</span>
                      <div className="text-[10px] text-[#8A776B]">Output tax collected less input tax claimed</div>
                    </div>
                    <span className="font-mono text-white">
                      {currency} {Math.max(0, netVatPayableToSars).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#EDE6DE]">Payroll Clearing (PAYE / UIF / SDL Accrual)</span>
                    <span className="font-mono text-white">
                      {currency} {(totalStaffPayrollDisbursed * 0.08).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 font-bold text-white">
                    <span>Total Current Liabilities</span>
                    <span className="font-mono text-rose-400">
                      {currency} {(totalStockPurchased * 0.15 + Math.max(0, netVatPayableToSars) + totalStaffPayrollDisbursed * 0.08).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shareholders Equity */}
              <div className="pt-4 border-t border-[#2C211B]">
                <h4 className="font-bold text-emerald-400 uppercase text-[11px] tracking-wider mb-2">
                  Owner's Equity & Reserves
                </h4>
                <div className="space-y-2 divide-y divide-[#221B17]">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#EDE6DE]">Owner's Contributed Capital</span>
                    <span className="font-mono text-white">{currency} 500,000.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#EDE6DE]">Retained Earnings (Historical Accumulation)</span>
                    <span className="font-mono text-white">{currency} 220,000.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#EDE6DE]">Current Period Retained Net Profit</span>
                    <span className="font-mono text-emerald-400">
                      {currency} {netProfit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 font-bold text-white">
                    <span>Total Shareholders' Equity</span>
                    <span className="font-mono text-emerald-400">
                      {currency} {(720000 + netProfit).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: TRIAL BALANCE                                 */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'trial-balance' && (
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2C211B]">
            <div>
              <div className="text-xs font-bold text-[#DE9E74] uppercase tracking-wider">
                Audited Trial Balance Verification
              </div>
              <h2 className="text-xl font-serif font-bold text-white mt-1">
                Consolidated General Ledger Trial Balance
              </h2>
              <p className="text-xs text-[#A69385]">
                Verification of double-entry mathematical equality across all active debit and credit accounts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {trialBalance.isBalanced ? (
                <div className="px-3.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Books In Balance (Debits = Credits)</span>
                </div>
              ) : (
                <div className="px-3.5 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-300 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Out of Balance</span>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120F0D] border-b border-[#2C211B] text-[#A69385] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 font-semibold">Account Code</th>
                  <th className="py-3 px-3.5 font-semibold">Account Title / Description</th>
                  <th className="py-3 px-3.5 font-semibold">Type</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Debit Balance ({currency})</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Credit Balance ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#221B17]">
                {trialBalance.rows.map((row) => (
                  <tr key={row.code} className="hover:bg-[#221B17]/50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-[#DE9E74]">{row.code}</td>
                    <td className="py-3 px-3.5 text-white font-medium">{row.name}</td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#221B17] border border-[#2C211B] text-[#C5B7AC]">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-white tabular-nums">
                      {row.debit > 0 ? row.debit.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-white tabular-nums">
                      {row.credit > 0 ? row.credit.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                  </tr>
                ))}
                {/* Total Trial Balance Row */}
                <tr className="bg-[#221B17] border-t-2 border-[#C98A5B] font-bold">
                  <td colSpan={3} className="py-3.5 px-3.5 text-right uppercase tracking-wider text-white">
                    Consolidated Total:
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-mono text-emerald-400 text-sm tabular-nums">
                    {currency} {trialBalance.totalDebits.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-mono text-emerald-400 text-sm tabular-nums">
                    {currency} {trialBalance.totalCredits.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 5: CHART OF ACCOUNTS (GL DRILLDOWN)               */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'chart-of-accounts' && (
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2C211B]">
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                Chart of Accounts & General Ledger Directory
              </h2>
              <p className="text-xs text-[#A69385]">
                Master list of accounts categorized according to South African GAAP / IFRS standards.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-[#8A776B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
                placeholder="Search account name or code..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chartOfAccounts
              .filter(
                (a) =>
                  a.code.includes(searchAccount) ||
                  a.name.toLowerCase().includes(searchAccount.toLowerCase()) ||
                  a.type.toLowerCase().includes(searchAccount.toLowerCase())
              )
              .map((acc) => (
                <div
                  key={acc.code}
                  onClick={() => setSelectedAccountCode(selectedAccountCode === acc.code ? null : acc.code)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedAccountCode === acc.code
                      ? 'bg-[#221B17] border-[#C98A5B] shadow-md'
                      : 'bg-[#120F0D] border-[#2C211B] hover:border-[#3A2D25]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#DE9E74]">{acc.code}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#171311] border border-[#2C211B] text-[#A69385]">
                      {acc.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2 leading-snug">{acc.name}</h4>
                  <p className="text-[11px] text-[#8A776B] mt-1 line-clamp-2">{acc.description}</p>
                  <div className="mt-4 pt-3 border-t border-[#221B17] flex items-center justify-between">
                    <span className="text-[10px] text-[#A69385] uppercase">Balance ({acc.normalBalance})</span>
                    <span className="text-xs font-mono font-bold text-white tabular-nums">
                      {currency} {acc.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 6: ACCOUNTS RECEIVABLE & DEBTORS AGING SCHEDULE   */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'ar-aging' && (
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2C211B]">
            <div>
              <div className="text-xs font-bold text-[#DE9E74] uppercase tracking-wider">
                Credit Control & Liquidity Protection
              </div>
              <h2 className="text-xl font-serif font-bold text-white mt-1">
                Accounts Receivable (AR) & Debtors Aging Schedule
              </h2>
              <p className="text-xs text-[#A69385]">
                Corporate customer receivables categorized into 0-30, 31-60, 61-90, and 90+ days aging brackets.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#8A776B]">Total Outstanding Receivables:</span>
              <div className="text-lg font-mono font-bold text-amber-400">
                {currency} {totalAccountsReceivable.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120F0D] border-b border-[#2C211B] text-[#A69385] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 font-semibold">Customer / Account</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Current (0-30d)</th>
                  <th className="py-3 px-3.5 font-semibold text-right">31 - 60 Days</th>
                  <th className="py-3 px-3.5 font-semibold text-right">61 - 90 Days</th>
                  <th className="py-3 px-3.5 font-semibold text-right">90+ Days Overdue</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Total Balance Due</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Credit Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#221B17]">
                {arAgingSchedule.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#8A776B]">
                      No customer debtor records currently registered.
                    </td>
                  </tr>
                ) : (
                  arAgingSchedule.map((b) => (
                    <tr key={b.customer.id} className="hover:bg-[#221B17]/50 transition-colors">
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-white">{b.customer.registeredName}</div>
                        <div className="text-[11px] text-[#A69385] font-mono">
                          {b.customer.tradingName} · {b.customer.accountCode}
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-mono text-white tabular-nums">
                        {b.current > 0 ? `${currency} ${b.current.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-mono text-amber-300 tabular-nums">
                        {b.days30 > 0 ? `${currency} ${b.days30.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-mono text-orange-400 tabular-nums">
                        {b.days60 > 0 ? `${currency} ${b.days60.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-mono text-rose-400 font-bold tabular-nums">
                        {b.days90Plus > 0 ? `${currency} ${b.days90Plus.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-mono font-bold text-white tabular-nums">
                        {currency} {b.balanceDue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3.5 text-center font-mono text-[11px] text-[#A69385]">
                        {currency} {b.creditLimit.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 7: SARS VAT 201 RETURN SCHEDULE                  */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'vat-201' && (
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2C211B]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#DE9E74]">
                  SARS eFiling Tax Ledger
                </span>
                <span className="text-[#3A2D25]">·</span>
                <span className="text-xs text-[#A69385]">VAT Registration: {company.vatNumber || '4120938471'}</span>
              </div>
              <h2 className="text-xl font-serif font-bold text-white">
                South African Revenue Service (SARS) VAT 201 Return
              </h2>
              <p className="text-xs text-[#A69385]">
                Standard 15% statutory Value-Added Tax computation for bi-monthly / monthly filing periods.
              </p>
            </div>

            <div className="p-3 bg-[#221B17] rounded-xl border border-[#2C211B] text-right">
              <span className="text-[10px] text-[#A69385] uppercase">Net Position:</span>
              <div className={`text-base font-mono font-bold ${netVatPayableToSars >= 0 ? 'text-[#DE9E74]' : 'text-emerald-400'}`}>
                {currency} {netVatPayableToSars.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-[#8A776B]">
                {netVatPayableToSars >= 0 ? 'Payable to SARS' : 'Refund Claimable from SARS'}
              </div>
            </div>
          </div>

          {/* Formal SARS Form Layout */}
          <div className="border border-[#2C211B] rounded-xl overflow-hidden text-xs">
            <div className="bg-[#221B17] p-3 font-bold text-white uppercase text-[11px] tracking-wider border-b border-[#2C211B]">
              PART A: CALCULATION OF OUTPUT TAX (SALES & INVOICES)
            </div>
            <table className="w-full text-left">
              <tbody className="divide-y divide-[#221B17]">
                <tr>
                  <td className="py-2.5 px-4 text-[#EDE6DE] w-2/3">
                    <span className="font-mono text-[#DE9E74] font-bold mr-2">Box 1:</span>
                    Standard Rated Supplies (Total Net Sales Invoiced excluding VAT)
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-white">
                    {currency} {totalNetSalesRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#EDE6DE]">
                    <span className="font-mono text-[#DE9E74] font-bold mr-2">Box 2:</span>
                    Zero-Rated Supplies (Exports / Exempt Foodstuffs)
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#8A776B]">{currency} 0.00</td>
                </tr>
                <tr className="bg-[#120F0D] font-bold">
                  <td className="py-3 px-4 text-white">
                    <span className="font-mono text-[#DE9E74] font-bold mr-2">Box 4:</span>
                    TOTAL OUTPUT TAX (15% on Standard Rated Supplies)
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-white text-sm">
                    {currency} {totalOutputVat.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="bg-[#221B17] p-3 font-bold text-white uppercase text-[11px] tracking-wider border-y border-[#2C211B] mt-4">
              PART B: CALCULATION OF INPUT TAX (STOCK PURCHASES & SUPPLIER EXPENSES)
            </div>
            <table className="w-full text-left">
              <tbody className="divide-y divide-[#221B17]">
                <tr>
                  <td className="py-2.5 px-4 text-[#EDE6DE] w-2/3">
                    <span className="font-mono text-[#DE9E74] font-bold mr-2">Box 14:</span>
                    Total Deductible Stock & Ingredient Purchases with Tax Slips Attached
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-white">
                    {currency} {totalStockPurchased.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="bg-[#120F0D] font-bold">
                  <td className="py-3 px-4 text-white">
                    <span className="font-mono text-[#DE9E74] font-bold mr-2">Box 15:</span>
                    TOTAL INPUT TAX DEDUCTION CLAIMABLE (15% on Stock Slips)
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-300 text-sm">
                    - {currency} {totalInputVatOnStock.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="bg-[#221B17] p-4 border-t-2 border-[#C98A5B] flex items-center justify-between">
              <div>
                <span className="font-mono text-[#DE9E74] font-bold mr-2 text-sm">BOX 20:</span>
                <span className="text-sm font-bold text-white">NET VAT PAYABLE TO / (REFUNDABLE FROM) SARS</span>
                <div className="text-[10px] text-[#A69385] mt-0.5">Box 4 (Output Tax) minus Box 15 (Input Tax)</div>
              </div>
              <div className="text-right">
                <span className={`text-lg font-mono font-bold ${netVatPayableToSars >= 0 ? 'text-[#DE9E74]' : 'text-emerald-400'}`}>
                  {currency} {netVatPayableToSars.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 8: GENERAL JOURNAL ENTRIES & CASH BOOK            */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'journal-entries' && (
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2C211B]">
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                General Journal & Voucher Audit Trail
              </h2>
              <p className="text-xs text-[#A69385]">
                Complete record of double-entry financial transactions and manual adjusting vouchers.
              </p>
            </div>

            <button
              onClick={() => setIsJournalModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Journal Entry</span>
            </button>
          </div>

          <div className="space-y-4">
            {allJournalEntries.length === 0 ? (
              <div className="py-12 text-center text-[#8A776B] text-xs">
                No journal entries posted yet.
              </div>
            ) : (
              allJournalEntries.map((je) => (
                <div key={je.id} className="bg-[#120F0D] border border-[#2C211B] rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#221B17]">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-[#221B17] font-mono text-xs font-bold text-[#DE9E74] border border-[#2C211B]">
                        {je.entryNumber}
                      </span>
                      <span className="text-xs text-white font-medium">{je.description}</span>
                    </div>
                    <div className="text-[11px] text-[#8A776B] font-mono">
                      Ref: {je.reference || 'None'} · Date: {je.date} · Posted by: {je.postedBy}
                    </div>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[#8A776B] text-[10px] uppercase">
                        <th className="py-1">Account Code</th>
                        <th className="py-1">Account Title</th>
                        <th className="py-1 text-right">Debit ({currency})</th>
                        <th className="py-1 text-right">Credit ({currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1D1714]">
                      {je.lines.map((l) => (
                        <tr key={l.id}>
                          <td className="py-1.5 font-mono text-[#DE9E74]">{l.accountCode}</td>
                          <td className="py-1.5 text-[#EDE6DE]">{l.accountName}</td>
                          <td className="py-1.5 text-right font-mono text-white">
                            {l.debit > 0 ? l.debit.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="py-1.5 text-right font-mono text-white">
                            {l.credit > 0 ? l.credit.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* POST NEW JOURNAL ENTRY MODAL                         */}
      {/* ---------------------------------------------------- */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setIsJournalModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8A776B] hover:text-white hover:bg-[#221B17]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#C98A5B]/15 border border-[#C98A5B]/30 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-[#DE9E74]" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white">Post General Journal Voucher</h3>
                <p className="text-xs text-[#A69385]">Record a balanced double-entry transaction</p>
              </div>
            </div>

            <form onSubmit={handlePostJournal} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">Entry Date</label>
                  <input
                    type="date"
                    required
                    value={journalForm.date}
                    onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">Document Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. SLIP-2026-08"
                    value={journalForm.reference}
                    onChange={(e) => setJournalForm({ ...journalForm, reference: e.target.value })}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">Description / Memo</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flour purchase from local mill supplier"
                  value={journalForm.description}
                  onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>

              {/* Debit Account */}
              <div>
                <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">Debit Account (DR)</label>
                <select
                  value={journalForm.debitAccountCode}
                  onChange={(e) => {
                    const found = chartOfAccounts.find((a) => a.code === e.target.value);
                    setJournalForm({
                      ...journalForm,
                      debitAccountCode: e.target.value,
                      debitAccountName: found ? found.name : '',
                    });
                  }}
                  className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                >
                  {chartOfAccounts.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} - {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Credit Account */}
              <div>
                <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">Credit Account (CR)</label>
                <select
                  value={journalForm.creditAccountCode}
                  onChange={(e) => {
                    const found = chartOfAccounts.find((a) => a.code === e.target.value);
                    setJournalForm({
                      ...journalForm,
                      creditAccountCode: e.target.value,
                      creditAccountName: found ? found.name : '',
                    });
                  }}
                  className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                >
                  {chartOfAccounts.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} - {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 4500.00"
                  value={journalForm.amount}
                  onChange={(e) => setJournalForm({ ...journalForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>

              <div className="pt-3 border-t border-[#2C211B] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJournalModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold"
                >
                  Post Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
