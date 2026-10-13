import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { InvoiceCustomerData } from '../../types/erp';
import { UserCheck, Plus, Check, Store } from 'lucide-react';

interface CustomerFormProps {
  currentCustomer?: InvoiceCustomerData;
  onSelectCustomer: (cust: InvoiceCustomerData) => void;
  onClose?: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  currentCustomer,
  onSelectCustomer,
  onClose,
}) => {
  const { customers, createCustomer, users } = useERP();

  const merchants = users.filter((u) => u.role === 'merchant');
  const [mode, setMode] = useState<'pick' | 'new'>(
    customers.length > 0 || merchants.length > 0 ? 'pick' : 'new'
  );
  const [selectedId, setSelectedId] = useState<string>('');

  const [newCust, setNewCust] = useState<InvoiceCustomerData>({
    name: currentCustomer?.name || '',
    company: currentCustomer?.company || '',
    contactPerson: currentCustomer?.contactPerson || '',
    phone: currentCustomer?.phone || '',
    email: currentCustomer?.email || '',
    address: currentCustomer?.address || '',
  });

  const handleCreateAndSelect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name && !newCust.company) return;

    let createdId = 'cust_' + Date.now();
    try {
      const created = await createCustomer({
        registeredName: newCust.company || newCust.name,
        tradingName: newCust.name || newCust.company,
        primaryContact: newCust.contactPerson || newCust.name,
        primaryPhone: newCust.phone,
        primaryEmail: newCust.email,
        branches: [
          {
            id: 'br_' + Date.now(),
            branchName: 'Main / HQ',
            deliveryAddress: newCust.address || '',
            contactPerson: newCust.contactPerson || newCust.name,
            phone: newCust.phone || '',
            email: newCust.email || '',
          },
        ],
      });
      if (created?.id) createdId = created.id;
    } catch {}

    const fullCust: InvoiceCustomerData = {
      ...newCust,
      id: createdId,
      customerId: createdId,
      branchName: 'Main / HQ',
    };

    onSelectCustomer(fullCust);
    if (onClose) onClose();
  };

  const handleExistingSelect = (selectVal: string) => {
    setSelectedId(selectVal);
    if (!selectVal) return;

    if (selectVal.startsWith('merchant:')) {
      const merchantId = selectVal.replace('merchant:', '');
      const m = merchants.find((u) => u.id === merchantId);
      if (m) {
        const selectedData: InvoiceCustomerData = {
          id: m.customerId || m.id,
          customerId: m.customerId || m.id,
          name: m.merchantStoreName || m.customerName || m.name,
          company: m.merchantStoreName || m.customerName || m.name,
          contactPerson: m.name,
          phone: m.phone || m.merchantPhone || '',
          email: m.email || '',
          address: m.deliveryAddress || m.merchantAddress || '',
          branchId: m.branch,
          branchName: m.branch || 'Main Branch',
          merchantId: m.id,
          merchantName: m.name,
        };
        onSelectCustomer(selectedData);
        if (onClose) onClose();
        return;
      }
    }

    const custId = selectVal.replace('cust:', '');
    const found = customers.find((c) => c.id === custId);
    if (found) {
      // Check if this customer is linked to any registered merchant
      const linkedMerchant = merchants.find(
        (m) =>
          m.customerId === found.id ||
          (m.customerName && m.customerName.toLowerCase() === found.registeredName.toLowerCase()) ||
          (m.merchantStoreName && m.merchantStoreName.toLowerCase() === (found.tradingName || found.registeredName).toLowerCase())
      );

      const selectedData: InvoiceCustomerData = {
        id: found.id,
        customerId: found.id,
        name: found.tradingName || found.registeredName,
        company: found.registeredName,
        contactPerson: found.primaryContact || found.tradingName,
        phone: found.primaryPhone,
        email: found.primaryEmail,
        address: found.branches?.[0]?.deliveryAddress || '',
        branchId: found.branches?.[0]?.id,
        branchName: found.branches?.[0]?.branchName || 'Main / HQ',
        vatNumber: found.vatNumber,
        merchantId: linkedMerchant?.id,
        merchantName: linkedMerchant?.name,
      };
      onSelectCustomer(selectedData);
      if (onClose) onClose();
    }
  };

  return (
    <div className="space-y-4 text-xs bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
      {/* Mode Switcher */}
      {(customers.length > 0 || merchants.length > 0) && (
        <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-lg border border-stone-200">
          <button
            type="button"
            onClick={() => setMode('pick')}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'pick'
                ? 'bg-white text-[#2B150A] font-bold shadow-2xs border border-stone-200'
                : 'text-stone-600 hover:text-[#2B150A]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#CC8468]" />
            <span>Select Customer / Merchant ({customers.length + merchants.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'new'
                ? 'bg-white text-[#2B150A] font-bold shadow-2xs border border-stone-200'
                : 'text-stone-600 hover:text-[#2B150A]'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#CC8468]" />
            <span>Create New Client</span>
          </button>
        </div>
      )}

      {/* Mode 1: Pick Existing Customer / Merchant */}
      {mode === 'pick' && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#2B150A]">
            Choose Registered Customer or Merchant Branch
          </label>
          <select
            value={selectedId}
            onChange={(e) => handleExistingSelect(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-[#2B150A] text-xs focus:outline-hidden focus:border-[#CC8468] focus:bg-white transition-colors"
          >
            <option value="">-- Choose registered customer or merchant --</option>
            {merchants.length > 0 && (
              <optgroup label="Registered Merchants & Branches">
                {merchants.map((m) => (
                  <option key={m.id} value={`merchant:${m.id}`}>
                    [Merchant] {m.merchantStoreName || m.name} ({m.branch || 'Branch'}) - {m.email}
                  </option>
                ))}
              </optgroup>
            )}
            {customers.length > 0 && (
              <optgroup label="Enterprise Customers Directory">
                {customers.map((c) => (
                  <option key={c.id} value={`cust:${c.id}`}>
                    [Customer] {c.tradingName || c.registeredName} {c.primaryContact ? `(${c.primaryContact})` : ''} - {c.primaryPhone || c.primaryEmail}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {currentCustomer && (
            <div className="p-3 mt-2 rounded-lg bg-stone-50 border border-stone-200 text-xs space-y-1">
              <div className="font-semibold text-[#2B150A] flex items-center gap-2">
                <span>{currentCustomer.name}</span>
                {currentCustomer.merchantId && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#CC8468]/15 text-[#391E0F] font-medium border border-[#CC8468]/30 inline-flex items-center gap-1">
                    <Store className="w-2.5 h-2.5" />
                    Linked Merchant
                  </span>
                )}
              </div>
              <div className="text-stone-600 text-[11px]">{currentCustomer.phone} · {currentCustomer.email}</div>
              <div className="text-stone-500 text-[11px]">{currentCustomer.address}</div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Create New Customer Form */}
      {mode === 'new' && (
        <form onSubmit={handleCreateAndSelect} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Company / Business Name
              </label>
              <input
                type="text"
                value={newCust.company}
                onChange={(e) => setNewCust({ ...newCust, company: e.target.value })}
                placeholder="e.g. Four Seasons Hospitality"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[#2B150A] text-xs focus:outline-hidden focus:border-[#CC8468] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Contact Person Name <span className="text-[#CC8468]">*</span>
              </label>
              <input
                type="text"
                required
                value={newCust.name}
                onChange={(e) =>
                  setNewCust({
                    ...newCust,
                    name: e.target.value,
                    contactPerson: e.target.value,
                  })
                }
                placeholder="e.g. Chef Marco / Sarah Jenkins"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[#2B150A] text-xs focus:outline-hidden focus:border-[#CC8468] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Telephone / Mobile
              </label>
              <input
                type="text"
                value={newCust.phone}
                onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                placeholder="+27 (0)11 987 6543"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[#2B150A] text-xs font-mono focus:outline-hidden focus:border-[#CC8468] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={newCust.email}
                onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                placeholder="procurement@fourseasons.co.za"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[#2B150A] text-xs focus:outline-hidden focus:border-[#CC8468] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Billing / Delivery Address
            </label>
            <textarea
              rows={2}
              value={newCust.address}
              onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
              placeholder="e.g. 67 West Street, Sandton, Johannesburg, 2196"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[#2B150A] text-xs focus:outline-hidden focus:border-[#CC8468] focus:bg-white"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#391E0F] hover:bg-[#2B150A] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-[#CC8468]" />
              <span>Apply Customer to Invoice</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

