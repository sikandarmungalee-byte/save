import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { Invoice, LineItem, InvoiceCustomerData } from '../../types/erp';
import { Invoice as LuxuryInvoice } from './Invoice';
import { CustomerForm } from './CustomerForm';
import {
  Plus,
  Trash2,
  Printer,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Calendar,
  Hash,
  User,
  ShoppingBag,
  Percent,
  FileText,
  CreditCard,
  X
} from 'lucide-react';

interface InvoiceFormProps {
  initialInvoice?: Invoice | null;
  onSaveComplete?: (invoice: Invoice) => void;
  onCancel?: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  initialInvoice,
  onSaveComplete,
  onCancel,
}) => {
  const {
    businessSettings,
    getNextInvoiceNumber,
    createInvoice,
    updateInvoice,
    products,
  } = useERP();

  // Mode: edit form vs live preview
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    initialInvoice?.invoiceNumber || getNextInvoiceNumber()
  );
  const [date, setDate] = useState<string>(
    initialInvoice?.date || initialInvoice?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    initialInvoice?.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<Invoice['status']>(initialInvoice?.status || 'Draft');

  // Customer Data
  const [customer, setCustomer] = useState<InvoiceCustomerData>({
    name: initialInvoice?.customer?.name || initialInvoice?.customerName || '',
    company: initialInvoice?.customer?.company || initialInvoice?.customerTradingName || '',
    contactPerson: initialInvoice?.customer?.contactPerson || initialInvoice?.contactPerson || '',
    phone: initialInvoice?.customer?.phone || initialInvoice?.customerPhone || '',
    email: initialInvoice?.customer?.email || initialInvoice?.customerEmail || '',
    address: initialInvoice?.customer?.address || initialInvoice?.deliveryAddress || '',
  });

  // Line items
  const [items, setItems] = useState<LineItem[]>(
    initialInvoice?.items?.length
      ? initialInvoice.items
      : [
          {
            id: 'it_' + Date.now(),
            sku: 'BRD-001',
            description: 'Artisanal Sourdough Loaf (750g)',
            packSize: 'Single',
            quantity: 10,
            unitPrice: 45.0,
            vatRate: 15,
            discountPercent: 0,
            subtotal: 450.0,
            vatAmount: 67.5,
            total: 450.0,
          },
        ]
  );

  // Discount & VAT
  const [discountPercent, setDiscountPercent] = useState<number>(
    initialInvoice?.discount || 0
  );
  const [vatRate, setVatRate] = useState<number>(
    initialInvoice?.vatRate !== undefined ? initialInvoice.vatRate : (businessSettings.vatRate ?? 15)
  );
  const [notes, setNotes] = useState<string>(
    initialInvoice?.notes ||
      'Thank you for partnering with Savouré. Payment terms strictly 30 days from date of issue.'
  );
  const [paymentReference, setPaymentReference] = useState<string>(
    initialInvoice?.paymentReference || invoiceNumber
  );

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync payment reference when invoice number changes
  useEffect(() => {
    if (!initialInvoice?.paymentReference) {
      setPaymentReference(invoiceNumber);
    }
  }, [invoiceNumber, initialInvoice]);

  // Totals auto-calculation
  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const discountTotal = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const vatTotal = Math.round(taxableAmount * (vatRate / 100) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + vatTotal) * 100) / 100;

  // Add Item
  const handleAddItem = (product?: (typeof products)[0]) => {
    const newItem: LineItem = product
      ? {
          id: 'it_' + Date.now() + Math.random().toString(36).substr(2, 4),
          productId: product.id,
          sku: product.sku || 'SKU-001',
          description: product.name,
          packSize: product.packSize || 'Single',
          quantity: 1,
          unitPrice: Number(product.unitPrice) || 0,
          vatRate: vatRate,
          discountPercent: 0,
          subtotal: Number(product.unitPrice) || 0,
          vatAmount: (Number(product.unitPrice) || 0) * (vatRate / 100),
          total: Number(product.unitPrice) || 0,
        }
      : {
          id: 'it_' + Date.now() + Math.random().toString(36).substr(2, 4),
          sku: `SKU-${String(items.length + 1).padStart(3, '0')}`,
          description: 'New Product Line',
          packSize: 'Single',
          quantity: 1,
          unitPrice: 0,
          vatRate: vatRate,
          discountPercent: 0,
          subtotal: 0,
          vatAmount: 0,
          total: 0,
        };

    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, updated: Partial<LineItem>) => {
    setItems(
      items.map((it) => {
        if (it.id === id) {
          const mod = { ...it, ...updated };
          const qty = Number(mod.quantity) || 0;
          const price = Number(mod.unitPrice) || 0;
          const lineTotal = Math.round(qty * price * 100) / 100;
          return {
            ...mod,
            subtotal: lineTotal,
            total: lineTotal,
            vatAmount: Math.round(lineTotal * (vatRate / 100) * 100) / 100,
          };
        }
        return it;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setMsg({ type: 'error', text: 'Invoice must contain at least one line item.' });
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    setItems(items.filter((it) => it.id !== id));
  };

  // Build full Invoice object for preview & saving
  const previewInvoice: Invoice = {
    id: initialInvoice?.id || 'inv_' + Date.now(),
    invoiceNumber: invoiceNumber.trim() || 'INV-0001',
    date,
    issueDate: date,
    dueDate,
    customerId: initialInvoice?.customerId || 'cust_temp',
    customerName: customer.name || customer.company || 'Valued Client',
    customerTradingName: customer.company || customer.name || 'Valued Client',
    customer,
    contactPerson: customer.contactPerson,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    deliveryAddress: customer.address || '',
    customerVat: initialInvoice?.customerVat || '',
    items,
    subtotal,
    discount: discountPercent,
    discountTotal,
    vatRate,
    vatTotal,
    grandTotal,
    amountPaid: initialInvoice?.amountPaid || 0,
    balanceDue: grandTotal - (initialInvoice?.amountPaid || 0),
    status,
    notes,
    paymentReference: paymentReference || invoiceNumber,
    createdAt: initialInvoice?.createdAt || new Date().toISOString(),
    createdBy: initialInvoice?.createdBy || 'Master Admin',
  };

  const handleSave = async () => {
    if (!customer.name && !customer.company) {
      setMsg({ type: 'error', text: 'Please specify the customer or company name.' });
      return;
    }
    if (items.length === 0) {
      setMsg({ type: 'error', text: 'Invoice must have at least one line item.' });
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      if (initialInvoice) {
        await updateInvoice(initialInvoice.id, previewInvoice);
      } else {
        await createInvoice(previewInvoice);
      }
      setMsg({ type: 'success', text: `Invoice ${previewInvoice.invoiceNumber} saved to cloud database!` });
      setTimeout(() => {
        if (onSaveComplete) onSaveComplete(previewInvoice);
      }, 800);
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Failed to save invoice.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          {/* Tab Switcher: Editor vs Live Preview */}
          <div className="flex items-center p-1 bg-[#120F0D] rounded-xl border border-[#2C211B]">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'editor'
                  ? 'bg-[#C98A5B] text-[#120F0D] shadow-xs'
                  : 'text-[#A69385] hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-[#C98A5B] text-[#120F0D] shadow-xs'
                  : 'text-[#A69385] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Luxury Document</span>
            </button>
          </div>

          <span className="font-mono text-xs text-[#DE9E74] hidden sm:inline">
            {invoiceNumber}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#221B17] hover:bg-[#2C211B] text-white border border-[#3A2D25] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-[#C98A5B]" />
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Invoice'}</span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl text-[#8A776B] hover:text-white hover:bg-[#221B17]"
              title="Close / Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 no-print ${
            msg.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
              : 'bg-red-950/60 border border-red-800 text-red-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* VIEW 1: EDITOR FORM */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
          {/* Main Editing Area (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Meta Bar */}
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#C98A5B] flex items-center gap-2">
                <Hash className="w-4 h-4" />
                <span>Invoice Sequence & Dates</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#A69385] mb-1">
                    Invoice Number <span className="text-[#DE9E74]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono font-bold focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#A69385] mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#A69385] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#A69385] mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent / Issued</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Line Items Editor */}
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2C211B] pb-3">
                <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#C98A5B] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Invoice Line Items ({items.length})</span>
                </h3>

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="px-3 py-1.5 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-[#DE9E74] border border-[#3A2D25] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Blank Item</span>
                </button>
              </div>

              {/* Quick Pick from Bakery Catalog */}
              {products.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-[#8A776B] mb-1.5">
                    Quick-Add Product from Bakery Catalog:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {products.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddItem(p)}
                        className="px-2.5 py-1 rounded-md text-[11px] bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] border border-[#3A2D25] flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-[#C98A5B]" />
                        <span>{p.name} ({businessSettings.currency} {(Number(p.unitPrice) || 0).toFixed(2)})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                {items.map((it, idx) => {
                  const qty = Number(it.quantity) || 0;
                  const price = Number(it.unitPrice) || 0;
                  const lineTotal = qty * price;

                  return (
                    <div
                      key={it.id || idx}
                      className="p-3 rounded-xl bg-[#120F0D] border border-[#2C211B] grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                    >
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-[#8A776B] mb-0.5">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) =>
                            handleUpdateItem(it.id, {
                              quantity: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-[#171311] border border-[#2C211B] rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-[#C98A5B]"
                        />
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[10px] text-[#8A776B] mb-0.5">Description / Product</label>
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) =>
                            handleUpdateItem(it.id, { description: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-[#171311] border border-[#2C211B] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#C98A5B]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-[#8A776B] mb-0.5">Unit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={it.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(it.id, {
                              unitPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-[#171311] border border-[#2C211B] rounded-lg text-white font-mono text-xs text-right focus:outline-hidden focus:border-[#C98A5B]"
                        />
                      </div>

                      <div className="sm:col-span-2 text-right">
                        <label className="block text-[10px] text-[#8A776B] mb-0.5">Line Total</label>
                        <div className="font-mono font-bold text-xs text-white pt-1">
                          {businessSettings.currency} {lineTotal.toFixed(2)}
                        </div>
                      </div>

                      <div className="sm:col-span-1 text-center sm:text-right pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="p-1.5 text-[#8A776B] hover:text-rose-400 rounded-md hover:bg-[#221B17]"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes & Payment Reference */}
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#C98A5B] flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Invoice Notes & EFT Reference</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#A69385] mb-1">
                    EFT Payment Reference
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#A69385] mb-1">
                    Special Customer Notes / Terms
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer & Calculation Summary (1 Column) */}
          <div className="space-y-6">
            {/* Customer Box */}
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#2C211B] pb-2">
                <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#C98A5B] flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Bill To Customer</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(!showCustomerModal)}
                  className="text-xs text-[#DE9E74] hover:underline"
                >
                  {showCustomerModal ? 'Done' : 'Change Client'}
                </button>
              </div>

              {showCustomerModal ? (
                <CustomerForm
                  currentCustomer={customer}
                  onSelectCustomer={(cust) => {
                    setCustomer(cust);
                    setShowCustomerModal(false);
                  }}
                />
              ) : (
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-[#8A776B]">Client / Company Name</label>
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="Customer or Business Name"
                      className="w-full px-2.5 py-1.5 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-medium text-xs focus:outline-hidden focus:border-[#C98A5B] mt-0.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#8A776B]">Contact Person</label>
                    <input
                      type="text"
                      value={customer.contactPerson}
                      onChange={(e) => setCustomer({ ...customer, contactPerson: e.target.value })}
                      placeholder="Attn: Person Name"
                      className="w-full px-2.5 py-1.5 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#C98A5B] mt-0.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#8A776B]">Phone</label>
                      <input
                        type="text"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        placeholder="+27..."
                        className="w-full px-2.5 py-1.5 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-[#C98A5B] mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8A776B]">Email</label>
                      <input
                        type="email"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        placeholder="client@email.com"
                        className="w-full px-2.5 py-1.5 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#C98A5B] mt-0.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#8A776B]">Delivery / Billing Address</label>
                    <textarea
                      rows={2}
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      placeholder="Street, Suburb, City, Postal Code"
                      className="w-full px-2.5 py-1.5 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#C98A5B] mt-0.5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Calculations Card */}
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#C98A5B] flex items-center gap-2 border-b border-[#2C211B] pb-2">
                <CreditCard className="w-4 h-4" />
                <span>Totals & Discount Breakdown</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-[#EDE6DE]">
                  <span>Subtotal:</span>
                  <span className="font-mono tabular-nums font-semibold">
                    {businessSettings.currency} {subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Discount % Control */}
                <div className="flex items-center justify-between text-[#EDE6DE] pt-1 border-t border-[#2C211B]">
                  <div className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-[#DE9E74]" />
                    <span>Discount (%):</span>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      className="w-full text-right px-2 py-1 bg-[#120F0D] border border-[#2C211B] rounded text-white font-mono text-xs focus:outline-hidden focus:border-[#C98A5B]"
                    />
                  </div>
                </div>

                {discountTotal > 0 && (
                  <div className="flex items-center justify-between text-emerald-400 text-[11px]">
                    <span>Discount Subtracted:</span>
                    <span className="font-mono tabular-nums">
                      -{businessSettings.currency} {discountTotal.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* VAT Rate Control */}
                <div className="flex items-center justify-between text-[#EDE6DE] pt-1 border-t border-[#2C211B]">
                  <span>VAT Rate (%):</span>
                  <div className="w-20">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={vatRate}
                      onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                      className="w-full text-right px-2 py-1 bg-[#120F0D] border border-[#2C211B] rounded text-white font-mono text-xs focus:outline-hidden focus:border-[#C98A5B]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[#A69385] text-[11px]">
                  <span>VAT Calculated ({vatRate}%):</span>
                  <span className="font-mono tabular-nums">
                    {businessSettings.currency} {vatTotal.toFixed(2)}
                  </span>
                </div>

                {/* Grand Total Preview Box */}
                <div className="mt-4 p-3.5 rounded-xl bg-[#221B17] border border-[#3A2D25] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-serif uppercase tracking-widest text-[#DE9E74] font-bold">
                      Grand Total
                    </div>
                    <div className="text-[10px] text-[#8A776B]">Final Payable</div>
                  </div>
                  <div className="font-mono font-bold text-lg text-white tabular-nums">
                    {businessSettings.currency} {grandTotal.toFixed(2)}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors mt-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save & Publish Invoice'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: LIVE LUXURY DOCUMENT PREVIEW & PRINT VIEW */}
      <div className={activeTab === 'editor' ? 'hidden' : 'block'}>
        <LuxuryInvoice invoice={previewInvoice} />
      </div>

      {/* Print only container (always mounted for window.print()) */}
      <div className="print-only hidden">
        <LuxuryInvoice invoice={previewInvoice} />
      </div>
    </div>
  );
};
