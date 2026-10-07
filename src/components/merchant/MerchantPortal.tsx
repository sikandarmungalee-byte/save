import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { Invoice } from '../../types/erp';
import {
  Store,
  FileText,
  Printer,
  LogOut,
  Globe,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
  Building2,
  Phone,
  MessageCircle,
  ShieldCheck,
  AlertCircle,
  Receipt,
  Download,
  Calendar,
} from 'lucide-react';
import { InvoicePrintModal } from '../InvoicePrintModal';
import { SHOWCASE_CONTACT } from '../showcase/showcaseData';

interface MerchantPortalProps {
  onBackToWebsite: () => void;
}

export const MerchantPortal: React.FC<MerchantPortalProps> = ({ onBackToWebsite }) => {
  const { currentUser, invoices, logout, customers, company } = useERP();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Pending' | 'Overdue'>('ALL');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);

  // Find linked customer record from ERP database if available
  const linkedCustomer = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.customerId) {
      return customers.find((c) => c.id === currentUser.customerId) || null;
    }
    if (currentUser.merchantStoreName) {
      return (
        customers.find(
          (c) =>
            c.registeredName.toLowerCase() === currentUser.merchantStoreName?.toLowerCase() ||
            c.tradingName.toLowerCase() === currentUser.merchantStoreName?.toLowerCase()
        ) || null
      );
    }
    return null;
  }, [customers, currentUser]);

  const currentBranch = currentUser?.branch || linkedCustomer?.branches?.[0]?.branchName || 'Main Branch';
  const customerDisplayName =
    currentUser?.customerName ||
    linkedCustomer?.registeredName ||
    currentUser?.merchantStoreName ||
    currentUser?.name ||
    'Merchant Store';

  // STRICT AUTOMATIC FILTERING:
  // Shows only invoices created by administration for THIS merchant's linked customer account or branch
  const merchantInvoices = useMemo(() => {
    if (!currentUser) return [];

    return invoices.filter((inv) => {
      // 1. Direct match on linked Customer ID
      if (currentUser.customerId && inv.customerId === currentUser.customerId) {
        return true;
      }
      if (linkedCustomer?.id && inv.customerId === linkedCustomer.id) {
        return true;
      }

      // 2. Direct match on Merchant ID (if tagged upon creation)
      if (inv.merchantId && inv.merchantId === currentUser.id) {
        return true;
      }

      // 3. Match on Customer Name / Trading Name (case-insensitive)
      const targetCustomerNames = [
        currentUser.customerName?.toLowerCase(),
        currentUser.merchantStoreName?.toLowerCase(),
        linkedCustomer?.registeredName.toLowerCase(),
        linkedCustomer?.tradingName.toLowerCase(),
      ].filter(Boolean);

      const invCustomerName = (inv.customerName || '').toLowerCase();
      const invTradingName = (inv.customerTradingName || '').toLowerCase();

      if (targetCustomerNames.some((name) => name && (invCustomerName.includes(name) || invTradingName.includes(name) || name.includes(invCustomerName)))) {
        return true;
      }

      // 4. Branch match if assigned to a specific branch
      if (
        currentUser.branch &&
        currentUser.branch !== 'All Branches' &&
        currentUser.branch !== 'Unassigned'
      ) {
        const matchBranch =
          inv.branch === currentUser.branch ||
          inv.branchName === currentUser.branch ||
          inv.branchId === currentUser.branch;
        if (matchBranch) return true;
      }

      return false;
    });
  }, [invoices, currentUser, linkedCustomer]);

  // Filtered by search & status
  const filteredInvoices = useMemo(() => {
    return merchantInvoices.filter((inv) => {
      const matchesSearch =
        (inv.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.issueDate || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Paid' && inv.status === 'Paid') ||
        (statusFilter === 'Pending' && (inv.status === 'Sent' || inv.status === 'Partial' || inv.status === 'Draft')) ||
        (statusFilter === 'Overdue' && inv.status === 'Overdue');

      return matchesSearch && matchesStatus;
    });
  }, [merchantInvoices, search, statusFilter]);

  // Summary Metrics
  const totalInvoiced = useMemo(() => {
    return merchantInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
  }, [merchantInvoices]);

  const totalOutstanding = useMemo(() => {
    return merchantInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
  }, [merchantInvoices]);

  const totalPaid = useMemo(() => {
    return merchantInvoices.reduce((acc, inv) => acc + (inv.amountPaid || (inv.status === 'Paid' ? inv.grandTotal : 0)), 0);
  }, [merchantInvoices]);

  const paidCount = useMemo(() => {
    return merchantInvoices.filter((inv) => inv.status === 'Paid').length;
  }, [merchantInvoices]);

  return (
    <div className="min-h-screen bg-[#14100D] text-[#EDE6DE] flex flex-col font-sans selection:bg-[#C98A5B] selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-[#2C211B] bg-[#1A1411] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToWebsite}
              className="p-2 -ml-2 rounded-lg text-[#A69385] hover:text-white hover:bg-[#2C211B] transition-colors"
              title="Return to Savouré website"
            >
              <Globe className="w-5 h-5 text-[#C98A5B]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-[0.2em] text-[#EDE6DE] uppercase leading-none">
                  Savouré
                </span>
                <span className="text-[8px] uppercase tracking-[0.22em] text-[#DE9E74] font-semibold mt-0.5">
                  A Taste of Tradition
                </span>
              </div>
              <div className="hidden sm:block border-l border-[#3A2D25] pl-3">
                <span className="text-xs uppercase font-serif tracking-widest text-[#DE9E74] font-bold block">
                  Merchant Portal
                </span>
                <span className="text-[11px] text-[#A69385] flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3 h-3 text-[#C98A5B]" />
                  <span>Branch: <strong className="text-white">{currentBranch}</strong></span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={SHOWCASE_CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold border border-emerald-700/50 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Wholesale Desk</span>
            </a>

            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-white">{currentUser?.name}</div>
              <div className="text-[10px] text-[#DE9E74]">{customerDisplayName}</div>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C211B] hover:bg-rose-950/40 text-xs font-semibold text-[#EDE6DE] hover:text-rose-300 border border-[#3A2D25] hover:border-rose-800/60 transition-colors"
              title="Sign out of merchant account"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Customer Account & Branch Identification Banner */}
        <div className="bg-gradient-to-r from-[#201713] via-[#2A1E18] to-[#1C1410] border border-[#C98A5B]/40 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C98A5B]/20 border border-[#C98A5B]/40 text-[#DE9E74] text-xs font-serif font-bold uppercase tracking-wider">
                  <Store className="w-3.5 h-3.5" />
                  <span>Authorized Merchant Account</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-mono">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Live Cloud Sync Active</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight">
                {customerDisplayName}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#A69385]">
                {linkedCustomer?.accountCode && (
                  <span>Account Code: <strong className="text-[#EDE6DE] font-mono">{linkedCustomer.accountCode}</strong></span>
                )}
                <span>Branch: <strong className="text-[#EDE6DE]">{currentBranch}</strong></span>
                {currentUser?.email && (
                  <span>Login: <strong className="text-[#EDE6DE]">{currentUser.email}</strong></span>
                )}
              </div>

              <p className="text-xs text-[#A69385]/80 pt-1 max-w-2xl leading-relaxed">
                Welcome to your merchant portal. Official tax invoices, delivery records, and payment receipts generated by Savouré Administration automatically appear below in real time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <a
                href={SHOWCASE_CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-700/60 text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Enquire via WhatsApp</span>
              </a>

              <button
                onClick={onBackToWebsite}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#221B17] hover:bg-[#2C211B] text-xs font-semibold text-[#EDE6DE] border border-[#3A2D25] transition-colors"
              >
                <Globe className="w-4 h-4 text-[#C98A5B]" />
                <span>Showcase Website</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Financial Statement Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1A1411] border border-[#2C211B] rounded-xl p-5 shadow-xs">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#A69385] block">
              Total Invoiced
            </span>
            <div className="mt-2 text-2xl font-bold font-mono text-white">
              {company.currency || 'R'} {totalInvoiced.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#8A776B] block mt-1">
              All official statements issued
            </span>
          </div>

          <div className="bg-[#1A1411] border border-[#2C211B] rounded-xl p-5 shadow-xs">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#A69385] block">
              Total Settled
            </span>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
              {company.currency || 'R'} {totalPaid.toFixed(2)}
            </div>
            <span className="text-[10px] text-emerald-600 block mt-1">
              {paidCount} paid invoice{paidCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="bg-[#1A1411] border border-[#2C211B] rounded-xl p-5 shadow-xs">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#A69385] block">
              Balance Due
            </span>
            <div className={`mt-2 text-2xl font-bold font-mono ${totalOutstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {company.currency || 'R'} {totalOutstanding.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#8A776B] block mt-1">
              {totalOutstanding > 0 ? 'Outstanding balance' : 'Account fully settled'}
            </span>
          </div>

          <div className="bg-[#1A1411] border border-[#2C211B] rounded-xl p-5 shadow-xs">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#A69385] block">
              Invoices Available
            </span>
            <div className="mt-2 text-2xl font-bold font-mono text-[#DE9E74]">
              {merchantInvoices.length}
            </div>
            <span className="text-[10px] text-[#8A776B] block mt-1">
              Ready to view and print
            </span>
          </div>
        </div>

        {/* Invoices List Section */}
        <div className="bg-[#1A1411] border border-[#2C211B] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C98A5B]" />
                <span>Your Invoices & Delivery Statements</span>
              </h2>
              <p className="text-xs text-[#A69385] mt-0.5">
                Click any invoice below to view or print the official Tax Invoice.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#120F0D] p-1 rounded-xl border border-[#2C211B]">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                    : 'text-[#A69385] hover:text-white'
                }`}
              >
                All ({merchantInvoices.length})
              </button>
              <button
                onClick={() => setStatusFilter('Paid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'Paid'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-[#A69385] hover:text-white'
                }`}
              >
                Paid ({merchantInvoices.filter((i) => i.status === 'Paid').length})
              </button>
              <button
                onClick={() => setStatusFilter('Pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'Pending'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-[#A69385] hover:text-white'
                }`}
              >
                Pending ({merchantInvoices.filter((i) => i.status === 'Sent' || i.status === 'Partial' || i.status === 'Draft').length})
              </button>
              <button
                onClick={() => setStatusFilter('Overdue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'Overdue'
                    ? 'bg-rose-700 text-white font-bold shadow-xs'
                    : 'text-[#A69385] hover:text-white'
                }`}
              >
                Overdue ({merchantInvoices.filter((i) => i.status === 'Overdue').length})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A776B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice number (e.g. INV-2026-0001) or issue date..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#120F0D] border border-[#2C211B] rounded-xl text-white placeholder-[#8A776B] focus:outline-none focus:border-[#C98A5B]"
            />
          </div>

          {/* Invoices Table */}
          {filteredInvoices.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#2C211B] rounded-xl p-8 space-y-3">
              <Receipt className="w-12 h-12 text-[#8A776B]/40 mx-auto" />
              <h3 className="text-base font-serif font-bold text-white">
                {search ? 'No matching invoices found' : 'No Invoices Issued Yet'}
              </h3>
              <p className="text-xs text-[#A69385] max-w-md mx-auto leading-relaxed">
                {search
                  ? 'Try searching with a different invoice number or clearing your filter.'
                  : `Invoices created for ${customerDisplayName} will automatically synchronize and appear here once posted by Savouré Administration.`}
              </p>
              <div className="pt-2">
                <a
                  href={SHOWCASE_CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold hover:bg-emerald-900 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Enquire with Bakery Finance Desk</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#2C211B] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#120F0D] text-[#A69385] uppercase font-serif tracking-wider text-[10px] border-b border-[#2C211B]">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C211B]">
                  {filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-[#221B17]/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedInvoiceForPrint(inv)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-3.5 h-3.5 text-[#C98A5B]" />
                          <span>{inv.invoiceNumber}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#EDE6DE]">
                        {inv.issueDate}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#A69385]">
                        {inv.dueDate}
                      </td>

                      <td className="py-3.5 px-4 text-[#EDE6DE] max-w-xs truncate">
                        {inv.items && inv.items.length > 0 ? (
                          <span>
                            {inv.items.map((it) => it.description || it.sku).join(', ')}
                          </span>
                        ) : (
                          <span className="text-[#8A776B] italic">Standard order</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {company.currency || 'R'} {(inv.grandTotal || 0).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {(inv.balanceDue || 0) > 0 ? (
                          <span className="text-amber-400">
                            {company.currency || 'R'} {(inv.balanceDue || 0).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-emerald-400">R 0.00</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : inv.status === 'Partial'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {inv.status === 'Paid' && <CheckCircle className="w-3 h-3" />}
                          {inv.status === 'Overdue' && <AlertCircle className="w-3 h-3" />}
                          {inv.status !== 'Paid' && inv.status !== 'Overdue' && <Clock className="w-3 h-3" />}
                          <span>{inv.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoiceForPrint(inv);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C211B] hover:bg-[#3E2C20] text-[#DE9E74] hover:text-[#F3D2BF] font-semibold text-xs border border-[#C98A5B]/40 transition-colors shadow-xs"
                          title="View and print official Tax Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Printable Invoice Modal with Luxury Template */}
      {selectedInvoiceForPrint && (
        <InvoicePrintModal
          invoice={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}
    </div>
  );
};
