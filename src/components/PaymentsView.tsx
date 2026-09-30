import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Payment, PaymentMethod } from '../types/erp';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  Calendar,
  CheckCircle2,
  Trash2,
  X,
  CreditCard,
  Building,
  FileText
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const { payments, invoices, company, recordPayment, deletePayment } = useERP();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer / EFT');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  const openCreateModal = () => {
    // pick first unpaid invoice
    const unpaid = invoices.find((i) => i.balanceDue > 0) || invoices[0];
    setSelectedInvoiceId(unpaid?.id || '');
    setAmount(unpaid ? String(unpaid.balanceDue) : '');
    setReferenceNumber(unpaid ? `EFT-${unpaid.invoiceNumber.replace('INV-', '')}` : '');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleInvoiceSelect = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(String(inv.balanceDue));
      setReferenceNumber(`EFT-${inv.invoiceNumber.replace('INV-', '')}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setFormError('Please enter a valid payment amount.');
      return;
    }
    const inv = invoices.find((i) => i.id === selectedInvoiceId);

    try {
      await recordPayment({
        invoiceId: selectedInvoiceId,
        invoiceNumber: inv?.invoiceNumber || '',
        customerId: inv?.customerId || '',
        customerName: inv?.customerName || 'General Customer',
        paymentDate,
        amount: Number(amount),
        paymentMethod,
        referenceNumber,
        notes,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to record payment');
    }
  };

  const filteredPayments = payments.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      p.paymentNumber.toLowerCase().includes(term) ||
      p.invoiceNumber.toLowerCase().includes(term) ||
      p.customerName.toLowerCase().includes(term) ||
      p.referenceNumber.toLowerCase().includes(term);

    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
                Accounts Receivable Ledger
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400 font-mono tabular-nums">{payments.length} Transactions</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Payments & AR Collections
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Record full and partial EFT deposits, bank settlements, and cash collections against tax invoices with instant ledger balance reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-neutral-400 uppercase font-mono">Total Liquidated Collections</div>
              <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                {company.currency} {totalCollected.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Method Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payment #, invoice #, client, reference..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#C98A5B]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
          {['ALL', 'Bank Transfer / EFT', 'Cash', 'Credit/Debit Card', 'Cheque'].map((method) => (
            <button
              key={method}
              onClick={() => setMethodFilter(method)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                methodFilter === method
                  ? 'bg-[#C98A5B] text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Payment Receipt #</th>
                <th className="py-3 px-4 font-semibold">Invoice Settled</th>
                <th className="py-3 px-4 font-semibold">Customer Account</th>
                <th className="py-3 px-4 font-semibold">Method & Deposit Ref</th>
                <th className="py-3 px-4 font-semibold text-right">Amount Settled</th>
                <th className="py-3 px-4 font-semibold">Audit Recorded By</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-500">
                    No payment ledger transactions found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-neutral-800/40 transition-colors">
                    {/* Payment Receipt */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-emerald-400 text-xs">
                        {pay.paymentNumber}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {pay.paymentDate}
                      </div>
                    </td>

                    {/* Invoice */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-white font-semibold">
                        {pay.invoiceNumber || 'Account Deposit'}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white truncate max-w-[200px]">
                        {pay.customerName}
                      </div>
                    </td>

                    {/* Method & Ref */}
                    <td className="py-3 px-4">
                      <div className="text-neutral-300 font-medium">{pay.paymentMethod}</div>
                      <div className="text-[10px] text-neutral-500 font-mono truncate max-w-[180px]">
                        Ref: {pay.referenceNumber || 'N/A'}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-xs tabular-nums">
                      +{company.currency} {pay.amount.toFixed(2)}
                    </td>

                    {/* Audit */}
                    <td className="py-3 px-4 text-neutral-400 text-[11px]">
                      <div>{pay.recordedBy}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {new Date(pay.createdAt).toLocaleTimeString()}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Reverse payment ${pay.paymentNumber} and restore invoice balance?`)) {
                            deletePayment(pay.id);
                          }
                        }}
                        className="p-1.5 rounded bg-neutral-800 hover:bg-red-950/80 text-neutral-400 hover:text-red-300 transition-colors"
                        title="Reverse Payment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Record Accounts Receivable Payment</h3>
                <p className="text-xs text-neutral-400">Reconciles against invoice and deducts balance due.</p>
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

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Select Tax Invoice to Liquidate <span className="text-[#C98A5B]">*</span>
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                >
                  <option value="">Select Invoice...</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.customerName} (Bal: {company.currency} {inv.balanceDue.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Settlement Amount ({company.currency}) <span className="text-[#C98A5B]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                  >
                    <option value="Bank Transfer / EFT">Bank Transfer / EFT</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit/Debit Card">Credit/Debit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Date Received
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Bank Reference / Deposit Slip #
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. FNB-EFT-991823"
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Internal Ledger Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional audit remarks..."
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition-colors"
                >
                  Record & Update Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
