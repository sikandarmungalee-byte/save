import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Quotation, LineItem } from '../types/erp';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Printer,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  X,
  FileCheck
} from 'lucide-react';

interface QuotationsViewProps {
  onNavigateToInvoices?: () => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({ onNavigateToInvoices }) => {
  const {
    quotations,
    customers,
    products,
    company,
    createQuotation,
    updateQuotation,
    convertQuotation,
    deleteQuotation,
  } = useERP();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Print Quote Modal
  const [printQuote, setPrintQuote] = useState<Quotation | null>(null);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    branchId: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    terms: 'Pricing valid for 30 calendar days from issue date. Subject to standard supply agreement.',
    items: [] as LineItem[],
  });

  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    const defaultCust = customers[0];
    const defaultBranch = defaultCust?.branches?.[0];

    setFormData({
      customerId: defaultCust?.id || '',
      branchId: defaultBranch?.id || '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      terms: 'Pricing valid for 30 calendar days from issue date. Free delivery for orders exceeding R1,500.',
      items: [],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setFormData((prev) => {
      const nextItems = [...prev.items];
      const cur = nextItems[index];
      const qty = cur.quantity || 10;
      const sub = qty * prod.unitPrice * (1 - cur.discountPercent / 100);
      const vat = sub * 0.15;

      nextItems[index] = {
        ...cur,
        productId: prod.id,
        sku: prod.sku,
        description: prod.name,
        packSize: prod.packSize,
        unitPrice: prod.unitPrice,
        vatRate: 15,
        subtotal: Math.round(sub * 100) / 100,
        vatAmount: Math.round(vat * 100) / 100,
        total: Math.round((sub + vat) * 100) / 100,
      };
      return { ...prev, items: nextItems };
    });
  };

  const handleItemFieldChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      const cur = { ...nextItems[index], [field]: value };
      const qty = Number(cur.quantity) || 0;
      const price = Number(cur.unitPrice) || 0;
      const disc = Number(cur.discountPercent) || 0;

      const raw = qty * price;
      const subtotal = raw * (1 - disc / 100);
      const vat = subtotal * 0.15;

      cur.subtotal = Math.round(subtotal * 100) / 100;
      cur.vatAmount = Math.round(vat * 100) / 100;
      cur.total = Math.round((subtotal + vat) * 100) / 100;

      nextItems[index] = cur;
      return { ...prev, items: nextItems };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setFormError('Select a customer');
      return;
    }
    const cust = customers.find((c) => c.id === formData.customerId);
    const branch = cust?.branches.find((b) => b.id === formData.branchId);

    try {
      await createQuotation({
        customerId: cust?.id,
        customerName: cust?.registeredName,
        customerTradingName: cust?.tradingName,
        branchId: branch?.id,
        branchName: branch?.branchName,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
        terms: formData.terms,
        items: formData.items,
        status: 'Sent',
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save quotation');
    }
  };

  const handleConvert = async (quote: Quotation) => {
    if (confirm(`Convert quotation ${quote.quoteNumber} into an active Tax Invoice and Delivery Note?`)) {
      try {
        const res = await convertQuotation(quote.id);
        alert(`Success! Created Tax Invoice ${res.invoice.invoiceNumber} and Delivery Note ${res.deliveryNote.deliveryNoteNumber}!`);
        if (onNavigateToInvoices) onNavigateToInvoices();
      } catch (err: any) {
        alert(err.message || 'Conversion failed');
      }
    }
  };

  const filteredQuotes = quotations.filter((q) => {
    const term = search.toLowerCase();
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(term) ||
      q.customerName.toLowerCase().includes(term) ||
      (q.customerTradingName && q.customerTradingName.toLowerCase().includes(term));
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
                Commercial Estimations
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400 font-mono tabular-nums">{quotations.length} Quotations</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Quotations & Cost Estimations
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Create formal price estimates with expiry dates. Instant 1-click conversion generates both the active Tax Invoice and Delivery Note without re-keying items.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Formal Quotation</span>
          </button>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quote #, customer name, items..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#C98A5B]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
          {['ALL', 'Draft', 'Sent', 'Accepted', 'Converted', 'Declined'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-[#C98A5B] text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Quote Reference</th>
                <th className="py-3 px-4 font-semibold">Customer / Branch</th>
                <th className="py-3 px-4 font-semibold">Validity Dates</th>
                <th className="py-3 px-4 font-semibold text-right">Quoted Value</th>
                <th className="py-3 px-4 font-semibold text-center">Lifecycle Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-neutral-500">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-neutral-800/40 transition-colors">
                    {/* Reference */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#DE9E74] text-xs">
                        {q.quoteNumber}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {q.items.length} line items
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white truncate max-w-[200px]">
                        {q.customerName}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                        {q.customerTradingName}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-400 tabular-nums">
                      <div>Issued: {q.issueDate}</div>
                      <div className="text-[10px] text-neutral-500">Expires: {q.expiryDate}</div>
                    </td>

                    {/* Value */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-white tabular-nums">
                      {company.currency} {q.grandTotal.toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          q.status === 'Converted'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : q.status === 'Accepted'
                            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            : q.status === 'Sent'
                            ? 'bg-[#C98A5B]/15 text-[#F3D2BF] border border-[#C98A5B]/30'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1-Click Convert to Invoice & Delivery Note */}
                        {q.status !== 'Converted' && (
                          <button
                            onClick={() => handleConvert(q)}
                            className="px-2.5 py-1 rounded bg-[#C98A5B]/20 hover:bg-[#C98A5B]/30 text-[#F3D2BF] font-medium text-xs flex items-center gap-1 transition-colors"
                            title="1-Click Convert to Tax Invoice & Delivery Note"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>1-Click Convert</span>
                          </button>
                        )}

                        {/* Print */}
                        <button
                          onClick={() => setPrintQuote(q)}
                          className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                          title="Print Quotation"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Accept button shortcut */}
                        {q.status === 'Sent' && (
                          <button
                            onClick={() => updateQuotation(q.id, { status: 'Accepted' })}
                            className="p-1.5 rounded bg-neutral-800 hover:bg-blue-900/60 text-blue-400 transition-colors"
                            title="Mark Accepted by Customer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (confirm(`Delete quote ${q.quoteNumber}?`)) {
                              deleteQuotation(q.id);
                            }
                          }}
                          className="p-1.5 rounded bg-neutral-800 hover:bg-red-950/80 text-neutral-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Create Commercial Quotation</h3>
                <p className="text-xs text-neutral-400">Formal price estimation with itemized catalogue breakdown.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Customer</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.registeredName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="border border-neutral-800 rounded-lg p-3">
                <div className="text-xs font-bold text-[#DE9E74] uppercase mb-2">Itemized Estimate</div>
                <div className="space-y-2">
                  {formData.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-5">
                        <select
                          value={it.productId || ''}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full p-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-xs"
                        >
                          <option value="">Choose Product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleItemFieldChange(idx, 'quantity', Number(e.target.value))}
                          placeholder="Qty"
                          className="w-full p-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-right font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          value={it.unitPrice}
                          onChange={(e) => handleItemFieldChange(idx, 'unitPrice', Number(e.target.value))}
                          placeholder="Price"
                          className="w-full p-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-right font-mono"
                        />
                      </div>
                      <div className="col-span-3 text-right font-mono font-bold text-[#DE9E74]">
                        {company.currency} {it.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors"
                >
                  Generate Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Formal Quotation Modal */}
      {printQuote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl my-auto">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between no-print bg-neutral-900/90 rounded-t-xl">
              <span className="font-bold text-white text-sm">
                Quotation: <span className="font-mono text-[#DE9E74]">{printQuote.quoteNumber}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Quotation</span>
                </button>
                <button
                  onClick={() => setPrintQuote(null)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 bg-neutral-950/40">
              <div className="print-container bg-white text-neutral-900 rounded-lg p-8 shadow-lg text-xs font-sans border border-neutral-200">
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-4 mb-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={company.logoUrl || "/src/assets/images/savoure_master_logo_1790775722136.jpg"}
                      alt="Savouré Logo"
                      className="w-12 h-12 rounded-full object-cover border border-[#C98A5B] shrink-0"
                    />
                    <div>
                      <h2 className="text-xl font-serif font-bold text-neutral-950">{company.companyName}</h2>
                      <div className="text-[11px] text-[#9B5D34] font-serif font-semibold italic">{company.tradingName}</div>
                      <div className="text-[11px] text-neutral-600">{company.address}</div>
                      <div className="text-[11px] text-neutral-600">Tel: {company.phone} · Email: {company.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block bg-[#201713] text-white font-extrabold text-xs uppercase px-2.5 py-0.5 tracking-wider mb-1 border-b border-[#C98A5B]">
                      FORMAL QUOTATION
                    </div>
                    <div className="font-mono font-bold text-sm text-neutral-950">{printQuote.quoteNumber}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">Date: {printQuote.issueDate}</div>
                    <div className="text-[10px] text-[#9B5D34] font-mono font-medium">Valid Until: {printQuote.expiryDate}</div>
                  </div>
                </div>

                <div className="mb-4 pb-4 border-b border-neutral-200">
                  <div className="text-[10px] font-bold uppercase text-neutral-500">Prepared For:</div>
                  <div className="font-bold text-neutral-900 text-sm">{printQuote.customerName}</div>
                  <div className="text-neutral-600">{printQuote.customerTradingName}</div>
                </div>

                <table className="w-full text-left border-collapse text-[11px] mb-6">
                  <thead>
                    <tr className="border-b-2 border-neutral-900 text-[10px] font-bold uppercase text-neutral-700">
                      <th className="py-1 px-1">SKU</th>
                      <th className="py-1 px-2">Description</th>
                      <th className="py-1 px-2 text-right">Qty</th>
                      <th className="py-1 px-2 text-right">Unit Price</th>
                      <th className="py-1 px-2 text-right">Disc %</th>
                      <th className="py-1 px-2 text-right">Total ({company.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {printQuote.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="py-2 px-1 font-mono text-[10px] text-neutral-600">{it.sku}</td>
                        <td className="py-2 px-2 font-medium">{it.description}</td>
                        <td className="py-2 px-2 text-right font-mono">{it.quantity}</td>
                        <td className="py-2 px-2 text-right font-mono">{company.currency} {it.unitPrice.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-mono">{it.discountPercent}%</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">{company.currency} {it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end mb-6">
                  <div className="w-60 space-y-1 text-xs">
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal Excl. VAT:</span>
                      <span className="font-mono">{company.currency} {printQuote.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>VAT (15%):</span>
                      <span className="font-mono">{company.currency} {printQuote.vatTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-neutral-950 text-sm border-t border-neutral-900 pt-1">
                      <span>Grand Total:</span>
                      <span className="font-mono">{company.currency} {printQuote.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-3 text-[10px] text-neutral-600">
                  <span className="font-bold">Quotation Terms:</span> {printQuote.terms}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
