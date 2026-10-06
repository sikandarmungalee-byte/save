import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { Invoice, LineItem } from '../../types/erp';
import {
  Store,
  FileText,
  Plus,
  Printer,
  LogOut,
  Globe,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
  Building2,
  Trash2,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { InvoicePrintModal } from '../InvoicePrintModal';
import { SHOWCASE_PRODUCTS, SHOWCASE_CONTACT } from '../showcase/showcaseData';

interface MerchantPortalProps {
  onBackToWebsite: () => void;
}

export const MerchantPortal: React.FC<MerchantPortalProps> = ({ onBackToWebsite }) => {
  const { currentUser, invoices, createInvoice, logout, company, products } = useERP();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Pending' | 'Draft'>('ALL');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);

  // New Invoice Modal State
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState(currentUser?.merchantStoreName || currentUser?.name || 'Wholesale Client');
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser?.branch ? `${currentUser.branch} Distribution Hub` : 'Main Branch');
  const [notes, setNotes] = useState('Standard merchant branch order dispatch.');
  const [newItems, setNewItems] = useState<LineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Merchant branch identification
  const currentBranch = currentUser?.branch || 'Main Branch';
  const isVatRegistered = Boolean(company.vatNumber && company.vatNumber.trim() !== '');

  // STRICT FILTERING: Only show invoices belonging to THIS merchant or THIS merchant's branch
  const merchantInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchMerchantId = inv.merchantId === currentUser?.id;
      const matchBranch = Boolean(
        currentBranch &&
        (inv.branch === currentBranch || inv.branchName === currentBranch || inv.branchId === currentBranch)
      );
      return matchMerchantId || matchBranch;
    });
  }, [invoices, currentUser, currentBranch]);

  // Filtered by search and status
  const filteredInvoices = useMemo(() => {
    return merchantInvoices.filter((inv) => {
      const matchesSearch =
        (inv.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.issueDate || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Paid' && inv.status === 'Paid') ||
        (statusFilter === 'Pending' && (inv.status === 'Sent' || inv.status === 'Partial' || inv.status === 'Overdue')) ||
        (statusFilter === 'Draft' && inv.status === 'Draft');

      return matchesSearch && matchesStatus;
    });
  }, [merchantInvoices, search, statusFilter]);

  // Metrics
  const totalInvoiced = useMemo(() => {
    return merchantInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
  }, [merchantInvoices]);

  const totalOutstanding = useMemo(() => {
    return merchantInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
  }, [merchantInvoices]);

  const paidCount = useMemo(() => {
    return merchantInvoices.filter((inv) => inv.status === 'Paid').length;
  }, [merchantInvoices]);

  // Handle open create invoice
  const openCreateModal = () => {
    // Start with 1 clean item from default products
    const initialItem: LineItem = {
      id: 'it_' + Date.now(),
      productId: 'prod_roti',
      sku: 'SAV-ROTI',
      description: 'Savouré Roti (10 per pack)',
      packSize: 'Medium 10 per pack',
      quantity: 10,
      unitPrice: 42.0,
      vatRate: isVatRegistered ? (company.vatRate || 15) : 0,
      discountPercent: 0,
      subtotal: 420.0,
      vatAmount: isVatRegistered ? 420.0 * 0.15 : 0,
      total: isVatRegistered ? 420.0 * 1.15 : 420.0,
    };
    setNewItems([initialItem]);
    setCustomerName(currentUser?.merchantStoreName || currentUser?.name || 'Wholesale Client');
    setDeliveryAddress(currentUser?.branch ? `${currentUser.branch} Distribution Hub` : 'Branch Address');
    setNotes(`Direct branch invoicing for ${currentBranch}.`);
    setFormError(null);
    setIsNewInvoiceModalOpen(true);
  };

  const handleAddItemRow = (presetProduct?: typeof SHOWCASE_PRODUCTS[0]) => {
    const vatRate = isVatRegistered ? (company.vatRate || 15) : 0;
    const item: LineItem = presetProduct
      ? {
          id: 'it_' + Date.now() + Math.random().toString(36).substring(2, 5),
          sku: `SAV-${presetProduct.name.substring(0, 4).toUpperCase()}`,
          description: `Savouré ${presetProduct.name}`,
          packSize: presetProduct.detail,
          quantity: 10,
          unitPrice: presetProduct.name === 'Roti' ? 42 : presetProduct.name === 'Tortilla Wraps' ? 38 : 55,
          vatRate,
          discountPercent: 0,
          subtotal: presetProduct.name === 'Roti' ? 420 : presetProduct.name === 'Tortilla Wraps' ? 380 : 550,
          vatAmount: isVatRegistered ? (presetProduct.name === 'Roti' ? 420 : 380) * (vatRate / 100) : 0,
          total: presetProduct.name === 'Roti' ? 420 : 380,
        }
      : {
          id: 'it_' + Date.now() + Math.random().toString(36).substring(2, 5),
          sku: 'SAV-ITEM',
          description: 'Product Description',
          packSize: 'Pack',
          quantity: 10,
          unitPrice: 40.0,
          vatRate,
          discountPercent: 0,
          subtotal: 400.0,
          vatAmount: 0,
          total: 400.0,
        };

    setNewItems((prev) => [...prev, item]);
  };

  const handleUpdateItemRow = (index: number, field: string, val: any) => {
    setNewItems((prev) => {
      const next = [...prev];
      const cur = { ...next[index], [field]: val };
      const qty = Number(cur.quantity) || 0;
      const price = Number(cur.unitPrice) || 0;
      const disc = Number(cur.discountPercent) || 0;
      const vatRate = isVatRegistered ? (company.vatRate || 15) : 0;

      const raw = qty * price;
      const subtotal = raw * (1 - disc / 100);
      const vat = isVatRegistered ? subtotal * (vatRate / 100) : 0;

      cur.subtotal = Math.round(subtotal * 100) / 100;
      cur.vatRate = vatRate;
      cur.vatAmount = Math.round(vat * 100) / 100;
      cur.total = Math.round((subtotal + vat) * 100) / 100;

      next[index] = cur;
      return next;
    });
  };

  const handleRemoveItemRow = (index: number) => {
    if (newItems.length <= 1) return;
    setNewItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate modal totals
  const modalSubtotal = newItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const modalVat = isVatRegistered ? newItems.reduce((acc, it) => acc + (it.vatAmount || 0), 0) : 0;
  const modalGrandTotal = modalSubtotal + modalVat;

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItems.length === 0) {
      setFormError('Please add at least one line item to this invoice.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const created = await createInvoice({
        customerName: customerName.trim(),
        customerTradingName: customerName.trim(),
        deliveryAddress: deliveryAddress.trim(),
        branch: currentBranch,
        branchName: currentBranch,
        branchId: currentBranch,
        merchantId: currentUser?.id,
        merchantName: currentUser?.name,
        merchantEmail: currentUser?.email,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        items: newItems,
        notes: notes.trim(),
        status: 'Sent',
        amountPaid: 0,
      });

      setIsNewInvoiceModalOpen(false);
      setSelectedInvoiceForPrint(created);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save merchant invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#14100D] text-[#EDE6DE] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[#2C211B] bg-[#1A1411] sticky top-0 z-30">
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
              <img
                src="/images/savoure/savoure-logo.png"
                alt="Savouré"
                className="h-10 w-28 object-contain bg-white/5 p-1 rounded"
              />
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
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold border border-emerald-700/50"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Help</span>
            </a>

            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{currentUser?.name}</div>
              <div className="text-[10px] text-[#A69385]">{currentUser?.email}</div>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C211B] hover:bg-[#3A2D25] text-xs font-semibold text-[#EDE6DE] transition-colors"
              title="Sign out of merchant account"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Branch Info Banner */}
        <div className="bg-gradient-to-r from-[#201713] via-[#2A1E18] to-[#1C1410] border border-[#C98A5B]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C98A5B]/20 text-[#DE9E74] text-xs font-bold uppercase tracking-wider mb-2">
                <Store className="w-3.5 h-3.5" />
                <span>Authorized Merchant · {currentBranch}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                {currentUser?.merchantStoreName || `${currentBranch} Wholesale Depot`}
              </h1>
              <p className="mt-1 text-xs text-[#A69385]">
                You have exclusive access to generate and review invoices for your branch location only.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#C98A5B] to-[#DE9E74] hover:from-[#B87A4D] hover:to-[#CD8E66] text-[#14100D] font-bold text-sm shadow-lg transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Invoice</span>
              </button>

              <button
                onClick={onBackToWebsite}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#221B17] hover:bg-[#2C211B] text-xs font-semibold text-[#EDE6DE] border border-[#3A2D25] transition-colors"
              >
                <Globe className="w-4 h-4 text-[#C98A5B]" />
                <span>Browse Website</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1A1411] border border-[#2C211B] rounded-xl p-5">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#A69385]">Branch Invoices</span>
            <div className="mt-2 text-2xl font-bold font-mono text-white">{merchantInvoices.length}</div>
            <span className="text-[10px] text-[#8A776B]">{currentBranch} exclusive</span>
          </div>

          <div className="bg-[#1A1411] border border-[#2C211B] rounded-xl p-5">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#A69385]">Total Invoiced</span>
            <div className="mt-2 text-2xl font-bold font-mono text-[#DE9E74]">
              R {totalInvoiced.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#8A776B]">All-time branch volume</span>
          </div>

          <div className="bg-[#1A1411] border border-[#2C211B] rounded-xl p-5">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#A69385]">Paid Invoices</span>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">{paidCount}</div>
            <span className="text-[10px] text-emerald-600">Settled receipts</span>
          </div>

          <div className="bg-[#1A1411] border border-[#2C211B] rounded-xl p-5">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#A69385]">Balance Due</span>
            <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
              R {totalOutstanding.toFixed(2)}
            </div>
            <span className="text-[10px] text-amber-600">Pending payment</span>
          </div>
        </div>

        {/* Invoices List Section */}
        <div className="bg-[#1A1411] border border-[#2C211B] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C98A5B]" />
                <span>My Branch Invoices ({filteredInvoices.length})</span>
              </h2>
              <p className="text-xs text-[#A69385]">
                Only invoices issued under branch <strong>{currentBranch}</strong> are shown.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#A69385] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search invoice #..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#8A776B] outline-none focus:border-[#C98A5B] w-48"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1 bg-[#120F0D] border border-[#2C211B] p-1 rounded-lg text-xs">
                {(['ALL', 'Paid', 'Pending', 'Draft'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      statusFilter === st
                        ? 'bg-[#C98A5B] text-[#14100D] font-bold'
                        : 'text-[#A69385] hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#2C211B] rounded-xl bg-[#14100D]">
              <FileText className="w-12 h-12 text-[#8A776B]/40 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No Invoices Found</h3>
              <p className="text-xs text-[#A69385] max-w-sm mx-auto mt-1">
                {search
                  ? 'No invoices match your current search query.'
                  : `You have not generated any invoices for ${currentBranch} yet.`}
              </p>
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#B87A4D] text-[#14100D] font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Your First Invoice</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#2C211B]">
              <table className="w-full text-left text-xs text-[#EDE6DE]">
                <thead className="bg-[#221B17] text-[#A69385] uppercase text-[10px] font-serif tracking-wider border-b border-[#2C211B]">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Client / Store</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C211B]">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#221B17]/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#A69385]">
                        {inv.issueDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{inv.customerName}</div>
                        <div className="text-[10px] text-[#8A776B]">{inv.deliveryAddress}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#C98A5B]/15 text-[#DE9E74] border border-[#C98A5B]/30">
                          {inv.branch || inv.branchName || currentBranch}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#A69385]">
                        {inv.items?.length || 0} items
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#DE9E74]">
                        R {(inv.grandTotal || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : inv.status === 'Overdue'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {inv.status === 'Paid' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{inv.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#2C211B] hover:bg-[#3A2D25] text-xs font-semibold text-[#DE9E74] border border-[#3A2D25] transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View & Print</span>
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

      {/* Create Invoice Modal for Merchant */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#1A1411] border border-[#C98A5B]/40 rounded-2xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-[#2C211B] pb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-white">Create Branch Invoice</h3>
                <p className="text-xs text-[#A69385]">
                  Issuing under branch: <strong className="text-[#DE9E74]">{currentBranch}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsNewInvoiceModalOpen(false)}
                className="text-[#8A776B] hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveInvoice} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A69385] mb-1">
                    Client / Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white outline-none focus:border-[#C98A5B]"
                    placeholder="Client or Store Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A69385] mb-1">
                    Delivery / Branch Location
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white outline-none focus:border-[#C98A5B]"
                    placeholder="Branch Delivery Address"
                  />
                </div>
              </div>

              {/* Line Items Picker */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif uppercase tracking-wider text-[#DE9E74] font-bold">
                    Line Items
                  </span>
                  
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-[#8A776B] mr-1">Quick Add:</span>
                    {SHOWCASE_PRODUCTS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleAddItemRow(p)}
                        className="px-2 py-0.5 rounded text-[10px] bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] border border-[#3A2D25]"
                      >
                        + {p.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddItemRow()}
                      className="px-2 py-0.5 rounded text-[10px] bg-[#C98A5B] text-[#14100D] font-bold"
                    >
                      + Custom Item
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {newItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 items-center bg-[#120F0D] p-2.5 rounded-lg border border-[#2C211B]"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItemRow(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1 bg-[#1A1411] border border-[#2C211B] rounded text-xs text-white"
                          placeholder="Description"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemRow(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1 bg-[#1A1411] border border-[#2C211B] rounded text-xs text-white text-right font-mono"
                          placeholder="Qty"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItemRow(idx, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1 bg-[#1A1411] border border-[#2C211B] rounded text-xs text-white text-right font-mono"
                          placeholder="Price"
                        />
                      </div>
                      <div className="col-span-2 text-right font-mono text-xs text-[#DE9E74] font-bold">
                        R {(item.total || 0).toFixed(2)}
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-4 rounded-xl bg-[#201713] border border-[#3A2D25] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#A69385]">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">R {modalSubtotal.toFixed(2)}</span>
                </div>
                {isVatRegistered && (
                  <div className="flex justify-between text-[#A69385]">
                    <span>VAT ({company.vatRate || 15}%):</span>
                    <span className="font-mono text-white">R {modalVat.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-[#DE9E74] pt-2 border-t border-[#3A2D25]">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base text-white">R {modalGrandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A69385] mb-1">
                  Invoice Notes & Delivery Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white outline-none focus:border-[#C98A5B]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2C211B]">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-[#A69385] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#C98A5B] to-[#DE9E74] text-[#14100D] font-bold text-xs shadow-md disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Saving invoice...</span>
                  ) : (
                    <>
                      <span>Save & Generate Invoice</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print / Preview Modal */}
      {selectedInvoiceForPrint && (
        <InvoicePrintModal
          isOpen={true}
          invoice={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}
    </div>
  );
};
