import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Invoice as InvoiceType } from '../../types/erp';
import { Invoice } from './Invoice';
import { InvoiceForm } from './InvoiceForm';
import { BusinessSettings } from './BusinessSettings';
import {
  FileText,
  Plus,
  Printer,
  Edit2,
  Trash2,
  Copy,
  Search,
  CheckCircle2,
  Building2,
  X,
  ExternalLink,
  Sparkles,
  Download
} from 'lucide-react';

export const InvoiceStudioView: React.FC = () => {
  const { invoices, businessSettings, deleteInvoice, cloneInvoice } = useERP();

  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'settings'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceType | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceType | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase().trim();
    const invNum = (inv.invoiceNumber || '').toLowerCase();
    const cust = (inv.customerName || inv.customerTradingName || '').toLowerCase();
    const matchesSearch = !term || invNum.includes(term) || cust.includes(term);
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenPreview = (inv: InvoiceType) => {
    setSelectedInvoice(inv);
    setPreviewModalOpen(true);
  };

  const handleEdit = (inv: InvoiceType) => {
    setEditingInvoice(inv);
    setActiveTab('create');
  };

  const handleClone = async (id: string) => {
    try {
      const cloned = await cloneInvoice(id);
      setSelectedInvoice(cloned);
      setPreviewModalOpen(true);
    } catch {}
  };

  const handleDelete = async (id: string, num: string) => {
    if (window.confirm(`Are you sure you want to delete invoice ${num}?`)) {
      await deleteInvoice(id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Bar */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-serif text-[#C98A5B] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-[#DE9E74]" />
            <span>Luxury Invoice System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Artisanal Invoicing & Document Studio
          </h1>
          <p className="text-xs text-[#A69385] mt-1 max-w-2xl leading-relaxed">
            Crafted for premium food and confectionery businesses. Print-ready A4 portrait documents
            with warm ivory backgrounds, espresso typography, and flowing copper accents.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setEditingInvoice(null);
              setActiveTab('create');
            }}
            className="px-4 py-2.5 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'settings'
                ? 'bg-[#221B17] text-[#DE9E74] border-[#C98A5B]'
                : 'bg-[#171311] text-[#A69385] border-[#2C211B] hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#C98A5B]" />
            <span>Business Settings</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2C211B] pb-3 no-print">
        <button
          type="button"
          onClick={() => {
            setActiveTab('list');
            setEditingInvoice(null);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'list'
              ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
              : 'text-[#A69385] hover:text-white hover:bg-[#221B17]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Tax Invoices ({invoices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEditingInvoice(null);
            setActiveTab('create');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'create' && !editingInvoice
              ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
              : 'text-[#A69385] hover:text-white hover:bg-[#221B17]'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice Builder</span>
        </button>

        {editingInvoice && activeTab === 'create' && (
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#C98A5B]/20 text-[#DE9E74] border border-[#C98A5B]/40 flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editing {editingInvoice.invoiceNumber}</span>
          </button>
        )}
      </div>

      {/* TAB 1: ALL INVOICES LIST */}
      {activeTab === 'list' && (
        <div className="space-y-4 no-print">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#171311] border border-[#2C211B] rounded-xl p-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8A776B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search invoice number, client name..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['ALL', 'Draft', 'Sent', 'Partial', 'Paid', 'Overdue'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                      : 'text-[#A69385] hover:text-white hover:bg-[#221B17]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-[#171311] border border-[#2C211B] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#120F0D] border-b border-[#2C211B] text-[#8A776B] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer / Client</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#2C211B] text-[#EDE6DE]">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-[#8A776B]">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#DE9E74]" />
                        <p className="font-serif text-base text-white font-semibold">No Invoices Found</p>
                        <p className="text-xs text-[#A69385] mt-1">
                          Click "+ Create Invoice" to generate your first luxury document.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#221B17]/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#DE9E74]">
                          {inv.invoiceNumber}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">
                            {inv.customerName || inv.customerTradingName || 'Client'}
                          </div>
                          {inv.contactPerson && (
                            <div className="text-[11px] text-[#8A776B]">{inv.contactPerson}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#A69385]">
                          {inv.date || inv.issueDate}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#A69385]">
                          {inv.dueDate}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white tabular-nums">
                          {businessSettings.currency} {(Number(inv.grandTotal) || 0).toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                                : inv.status === 'Partial'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                                : 'bg-[#221B17] text-[#DE9E74] border border-[#3A2D25]'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(inv)}
                              className="px-2.5 py-1 rounded bg-[#221B17] hover:bg-[#2C211B] text-[#DE9E74] font-medium text-xs flex items-center gap-1 transition-colors"
                              title="Preview Luxury Document"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEdit(inv)}
                              className="p-1 rounded bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] transition-colors"
                              title="Edit Invoice"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleClone(inv.id)}
                              className="p-1 rounded bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] transition-colors"
                              title="Duplicate / Clone"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                              className="p-1 rounded hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 transition-colors"
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
        </div>
      )}

      {/* TAB 2: CREATE / EDIT INVOICE FORM */}
      {activeTab === 'create' && (
        <InvoiceForm
          initialInvoice={editingInvoice}
          onSaveComplete={(saved) => {
            setSelectedInvoice(saved);
            setPreviewModalOpen(true);
            setActiveTab('list');
            setEditingInvoice(null);
          }}
          onCancel={() => {
            setActiveTab('list');
            setEditingInvoice(null);
          }}
        />
      )}

      {/* TAB 3: BUSINESS SETTINGS */}
      {activeTab === 'settings' && <BusinessSettings />}

      {/* FULL LUXURY INVOICE MODAL / PRINT PREVIEW */}
      {previewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#171311] border border-[#2C211B] rounded-2xl shadow-2xl flex flex-col my-auto max-h-[95vh] overflow-hidden">
            {/* Modal Header (no-print) */}
            <div className="px-6 py-4 border-b border-[#2C211B] flex items-center justify-between no-print shrink-0 bg-[#171311]">
              <div className="flex items-center gap-3">
                <span className="font-serif font-bold text-white text-base">
                  Luxury Invoice: <span className="font-mono text-[#DE9E74]">{selectedInvoice.invoiceNumber}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-[#C98A5B]/20 text-[#DE9E74] border border-[#C98A5B]/30">
                  {selectedInvoice.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-2 rounded-xl text-[#8A776B] hover:text-white hover:bg-[#221B17]"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Luxury Document Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#120F0D]">
              <Invoice invoice={selectedInvoice} />
            </div>
          </div>
        </div>
      )}

      {/* Print only container */}
      {selectedInvoice && (
        <div className="print-only hidden">
          <Invoice invoice={selectedInvoice} />
        </div>
      )}
    </div>
  );
};
