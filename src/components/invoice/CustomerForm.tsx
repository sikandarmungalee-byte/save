import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { InvoiceCustomerData } from '../../types/erp';
import { UserCheck, Plus, Check } from 'lucide-react';

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
  const { customers, createCustomer } = useERP();

  const [mode, setMode] = useState<'pick' | 'new'>(customers.length > 0 ? 'pick' : 'new');
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

    try {
      await createCustomer({
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
    } catch {}

    onSelectCustomer(newCust);
    if (onClose) onClose();
  };

  const handleExistingSelect = (custId: string) => {
    setSelectedId(custId);
    const found = customers.find((c) => c.id === custId);
    if (found) {
      const selectedData: InvoiceCustomerData = {
        name: found.tradingName || found.registeredName,
        company: found.registeredName,
        contactPerson: found.primaryContact || found.tradingName,
        phone: found.primaryPhone,
        email: found.primaryEmail,
        address: found.branches?.[0]?.deliveryAddress || '',
      };
      onSelectCustomer(selectedData);
      if (onClose) onClose();
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Mode Switcher */}
      {customers.length > 0 && (
        <div className="flex items-center gap-2 p-1 bg-[#120F0D] rounded-lg border border-[#2C211B]">
          <button
            type="button"
            onClick={() => setMode('pick')}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'pick'
                ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                : 'text-[#A69385] hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Select Existing Client ({customers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'new'
                ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                : 'text-[#A69385] hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Client</span>
          </button>
        </div>
      )}

      {/* Mode 1: Pick Existing Customer */}
      {mode === 'pick' && customers.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#EDE6DE]">
            Choose Client from Enterprise Directory
          </label>
          <select
            value={selectedId}
            onChange={(e) => handleExistingSelect(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#C98A5B]"
          >
            <option value="">-- Choose registered customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tradingName || c.registeredName} {c.primaryContact ? `(${c.primaryContact})` : ''} - {c.primaryPhone || c.primaryEmail}
              </option>
            ))}
          </select>

          {currentCustomer && (
            <div className="p-3 mt-2 rounded-lg bg-[#221B17] border border-[#3A2D25] text-xs space-y-1">
              <div className="font-semibold text-white">{currentCustomer.name}</div>
              <div className="text-[#A69385] text-[11px]">{currentCustomer.phone} · {currentCustomer.email}</div>
              <div className="text-[#8A776B] text-[11px]">{currentCustomer.address}</div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Create New Customer Form */}
      {mode === 'new' && (
        <form onSubmit={handleCreateAndSelect} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#A69385] mb-1">
                Company / Business Name
              </label>
              <input
                type="text"
                value={newCust.company}
                onChange={(e) => setNewCust({ ...newCust, company: e.target.value })}
                placeholder="e.g. Four Seasons Hospitality"
                className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#A69385] mb-1">
                Contact Person Name <span className="text-[#DE9E74]">*</span>
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
                className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#A69385] mb-1">
                Telephone / Mobile
              </label>
              <input
                type="text"
                value={newCust.phone}
                onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                placeholder="+27 (0)11 987 6543"
                className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white text-xs font-mono focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#A69385] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={newCust.email}
                onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                placeholder="procurement@fourseasons.co.za"
                className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#A69385] mb-1">
              Billing / Delivery Address
            </label>
            <textarea
              rows={2}
              value={newCust.address}
              onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
              placeholder="e.g. 67 West Street, Sandton, Johannesburg, 2196"
              className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#C98A5B]"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Customer to Invoice</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
