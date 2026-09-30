import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Customer, CustomerBranch, CustomerDocument } from '../types/erp';
import {
  Users2,
  Plus,
  Search,
  Building,
  MapPin,
  FileText,
  Phone,
  Mail,
  ShieldCheck,
  Upload,
  Download,
  Trash2,
  Edit2,
  ChevronRight,
  X,
  FileCheck2
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, company, createCustomer, updateCustomer, deleteCustomer, invoices } = useERP();

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState({
    registeredName: '',
    tradingName: '',
    accountCode: '',
    registrationNumber: '',
    vatNumber: '',
    primaryEmail: '',
    primaryPhone: '',
    primaryContact: '',
    creditLimit: 100000,
    paymentTermsDays: 30,
    notes: '',
  });

  // Branch Modal
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({
    branchName: '',
    deliveryAddress: '',
    contactPerson: '',
    phone: '',
    email: '',
    notes: '',
  });

  // Document Upload Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    name: '',
    type: 'VAT Certificate' as CustomerDocument['type'],
    fileSize: '450 KB',
  });

  const openCreateCustomerModal = () => {
    setEditingCustomerId(null);
    setCustomerForm({
      registeredName: '',
      tradingName: '',
      accountCode: `ACC-${String(customers.length + 1).padStart(3, '0')}`,
      registrationNumber: '',
      vatNumber: '',
      primaryEmail: '',
      primaryPhone: '',
      primaryContact: '',
      creditLimit: 100000,
      paymentTermsDays: 30,
      notes: '',
    });
    setIsCustomerModalOpen(true);
  };

  const openEditCustomerModal = (c: Customer) => {
    setEditingCustomerId(c.id);
    setCustomerForm({
      registeredName: c.registeredName,
      tradingName: c.tradingName,
      accountCode: c.accountCode,
      registrationNumber: c.registrationNumber,
      vatNumber: c.vatNumber,
      primaryEmail: c.primaryEmail,
      primaryPhone: c.primaryPhone,
      primaryContact: c.primaryContact,
      creditLimit: c.creditLimit,
      paymentTermsDays: c.paymentTermsDays,
      notes: c.notes || '',
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.registeredName) return;

    if (editingCustomerId) {
      const updated = await updateCustomer(editingCustomerId, {
        registeredName: customerForm.registeredName,
        tradingName: customerForm.tradingName || customerForm.registeredName,
        accountCode: customerForm.accountCode,
        registrationNumber: customerForm.registrationNumber,
        vatNumber: customerForm.vatNumber,
        primaryEmail: customerForm.primaryEmail,
        primaryPhone: customerForm.primaryPhone,
        primaryContact: customerForm.primaryContact,
        creditLimit: Number(customerForm.creditLimit),
        paymentTermsDays: Number(customerForm.paymentTermsDays),
        notes: customerForm.notes,
      });
      if (selectedCustomer?.id === editingCustomerId) {
        setSelectedCustomer(updated);
      }
    } else {
      const created = await createCustomer({
        registeredName: customerForm.registeredName,
        tradingName: customerForm.tradingName || customerForm.registeredName,
        accountCode: customerForm.accountCode,
        registrationNumber: customerForm.registrationNumber,
        vatNumber: customerForm.vatNumber,
        primaryEmail: customerForm.primaryEmail,
        primaryPhone: customerForm.primaryPhone,
        primaryContact: customerForm.primaryContact,
        creditLimit: Number(customerForm.creditLimit),
        paymentTermsDays: Number(customerForm.paymentTermsDays),
        notes: customerForm.notes,
        branches: [],
        documents: [],
      });
      setSelectedCustomer(created);
    }
    setIsCustomerModalOpen(false);
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !branchForm.branchName) return;

    const newBranch: CustomerBranch = {
      id: 'br_' + Date.now(),
      branchName: branchForm.branchName,
      deliveryAddress: branchForm.deliveryAddress,
      contactPerson: branchForm.contactPerson,
      phone: branchForm.phone,
      email: branchForm.email,
      notes: branchForm.notes,
    };

    const nextBranches = [...(selectedCustomer.branches || []), newBranch];
    const updated = await updateCustomer(selectedCustomer.id, { branches: nextBranches });
    setSelectedCustomer(updated);
    setIsBranchModalOpen(false);
    setBranchForm({
      branchName: '',
      deliveryAddress: '',
      contactPerson: '',
      phone: '',
      email: '',
      notes: '',
    });
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!selectedCustomer) return;
    const nextBranches = selectedCustomer.branches.filter((b) => b.id !== branchId);
    const updated = await updateCustomer(selectedCustomer.id, { branches: nextBranches });
    setSelectedCustomer(updated);
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !docForm.name) return;

    const newDoc: CustomerDocument = {
      id: 'doc_' + Date.now(),
      name: docForm.name,
      type: docForm.type,
      uploadDate: new Date().toISOString(),
      fileSize: docForm.fileSize || '380 KB',
    };

    const nextDocs = [...(selectedCustomer.documents || []), newDoc];
    const updated = await updateCustomer(selectedCustomer.id, { documents: nextDocs });
    setSelectedCustomer(updated);
    setIsDocModalOpen(false);
    setDocForm({ name: '', type: 'VAT Certificate', fileSize: '450 KB' });
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!selectedCustomer) return;
    const nextDocs = selectedCustomer.documents.filter((d) => d.id !== docId);
    const updated = await updateCustomer(selectedCustomer.id, { documents: nextDocs });
    setSelectedCustomer(updated);
  };

  const filteredCustomers = customers.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.registeredName.toLowerCase().includes(term) ||
      c.tradingName.toLowerCase().includes(term) ||
      c.accountCode.toLowerCase().includes(term) ||
      c.vatNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
                Client Accounts & Branches
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400 font-mono tabular-nums">{customers.length} Corporate Clients</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Customer & Multi-Branch Directory
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Maintain legal and trading identities for retail supermarket chains, franchise branches, VAT records, credit limits, and secure compliance document vaults.
            </p>
          </div>

          <button
            onClick={openCreateCustomerModal}
            className="px-4 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Corporate Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by registered name, trading name, VAT #, code..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#C98A5B]"
        />
      </div>

      {/* Main Customers Grid & Drill-Down Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customers List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1">
            Accounts ({filteredCustomers.length})
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredCustomers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              const customerInvoices = invoices.filter((i) => i.customerId === c.id);
              const totalBilled = customerInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
              const balanceDue = customerInvoices.reduce((acc, i) => acc + i.balanceDue, 0);

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#C98A5B]/10 border-[#C98A5B]/40 shadow-xs'
                      : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-xs leading-tight">
                        {c.registeredName}
                      </div>
                      {c.tradingName !== c.registeredName && (
                        <div className="text-[11px] text-[#DE9E74] font-medium">
                          Trade: {c.tradingName}
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      {c.accountCode}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-neutral-400 space-y-0.5">
                    <div className="flex items-center gap-1 font-mono">
                      <span>VAT:</span>
                      <span className="text-neutral-300">{c.vatNumber || 'Not provided'}</span>
                    </div>
                    <div>
                      <span>Branches:</span>{' '}
                      <span className="text-neutral-200 font-medium">{c.branches?.length || 0} locations</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Unsettled:</span>
                    <span className={`font-mono font-bold ${balanceDue > 0 ? 'text-[#DE9E74]' : 'text-emerald-400'}`}>
                      {company.currency} {balanceDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Customer Details, Branches & Document Vault */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
              {/* Customer Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-neutral-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {selectedCustomer.registeredName}
                    </h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#C98A5B]/20 text-[#F3D2BF] font-semibold">
                      {selectedCustomer.accountCode}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Trading Name: <span className="text-white font-medium">{selectedCustomer.tradingName}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1 font-mono space-x-3">
                    <span>Reg No: {selectedCustomer.registrationNumber || 'N/A'}</span>
                    <span>·</span>
                    <span>SARS VAT: {selectedCustomer.vatNumber || 'Exempt'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditCustomerModal(selectedCustomer)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete customer ${selectedCustomer.registeredName}?`)) {
                        deleteCustomer(selectedCustomer.id);
                        setSelectedCustomer(null);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/80 text-neutral-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Contact & Credit Terms Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-neutral-950/50 rounded-lg border border-neutral-800 text-xs">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-mono">Primary Contact</span>
                  <span className="text-white font-medium">{selectedCustomer.primaryContact || 'Not specified'}</span>
                  <div className="text-neutral-400 text-[11px]">{selectedCustomer.primaryPhone}</div>
                  <div className="text-neutral-400 text-[11px]">{selectedCustomer.primaryEmail}</div>
                </div>

                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-mono">Approved Credit Limit</span>
                  <span className="text-white font-bold font-mono text-sm">
                    {company.currency} {selectedCustomer.creditLimit.toLocaleString('en-ZA')}
                  </span>
                  <div className="text-neutral-400 text-[11px]">Strict verification standard</div>
                </div>

                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-mono">Payment Terms</span>
                  <span className="text-[#DE9E74] font-bold font-mono text-sm">
                    {selectedCustomer.paymentTermsDays} Days
                  </span>
                  <div className="text-neutral-400 text-[11px]">From statement issue</div>
                </div>
              </div>

              {/* Multi-Branch Hierarchy */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#DE9E74]">
                      Store Outlets & Delivery Bays ({selectedCustomer.branches?.length || 0})
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Individual store outlets, destination ramps, and branch receiving managers.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsBranchModalOpen(true)}
                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[#DE9E74] text-xs font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Branch</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(selectedCustomer.branches || []).length === 0 ? (
                    <div className="p-4 rounded-lg bg-neutral-950/40 border border-neutral-800 text-center text-xs text-neutral-500">
                      No shipping branches added yet. Invoices will default to head office.
                    </div>
                  ) : (
                    selectedCustomer.branches.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-lg bg-neutral-800/40 border border-neutral-800 flex items-start justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#DE9E74] shrink-0" />
                            <span>{b.branchName}</span>
                          </div>
                          <div className="text-neutral-400 text-[11px] pl-5">{b.deliveryAddress}</div>
                          <div className="text-neutral-500 text-[10px] pl-5">
                            Contact: {b.contactPerson} · Tel: {b.phone}
                          </div>
                          {b.notes && (
                            <div className="text-[#F3D2BF]/80 text-[10px] pl-5 italic">
                              Instructions: {b.notes}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteBranch(b.id)}
                          className="text-neutral-500 hover:text-red-400 p-1"
                          title="Remove branch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Document Attachment Vault */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#DE9E74]">
                      Compliance Document Vault ({selectedCustomer.documents?.length || 0})
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      SARS VAT notices, signed credit agreements, HACCP and B-BBEE affidavits.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDocModalOpen(true)}
                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[#DE9E74] text-xs font-medium flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Document</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(selectedCustomer.documents || []).length === 0 ? (
                    <div className="col-span-2 p-4 rounded-lg bg-neutral-950/40 border border-neutral-800 text-center text-xs text-neutral-500">
                      No compliance documents attached. Upload signed SLAs or VAT certificates above.
                    </div>
                  ) : (
                    selectedCustomer.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-lg bg-neutral-800/40 border border-neutral-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold text-white truncate">{doc.name}</div>
                            <div className="text-[10px] text-neutral-400">
                              {doc.type} · <span className="font-mono">{doc.fileSize}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => alert(`Opening simulated attachment preview: ${doc.name}`)}
                            className="p-1 rounded text-neutral-400 hover:text-white"
                            title="Preview / Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="p-1 rounded text-neutral-400 hover:text-red-400"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-500">
              <Users2 className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
              <div className="font-bold text-white text-sm mb-1">Select a Customer Account</div>
              <div className="text-xs text-neutral-400 max-w-sm mx-auto">
                Click any corporate customer from the directory list on the left to inspect branch destinations and compliance documents.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Create / Edit Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {editingCustomerId ? 'Edit Customer Profile' : 'Register Corporate Customer'}
                </h3>
                <p className="text-xs text-neutral-400">Master client profile, corporate tax codes, and credit terms.</p>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Registered Legal Entity Name <span className="text-[#C98A5B]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerForm.registeredName}
                    onChange={(e) => setCustomerForm({ ...customerForm, registeredName: e.target.value })}
                    placeholder="e.g. The SPAR Group Limited"
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Trading Name (Trade As)
                  </label>
                  <input
                    type="text"
                    value={customerForm.tradingName}
                    onChange={(e) => setCustomerForm({ ...customerForm, tradingName: e.target.value })}
                    placeholder="e.g. SPAR Supermarket Distribution"
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Account Code</label>
                  <input
                    type="text"
                    value={customerForm.accountCode}
                    onChange={(e) => setCustomerForm({ ...customerForm, accountCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Company Reg Number</label>
                  <input
                    type="text"
                    value={customerForm.registrationNumber}
                    onChange={(e) => setCustomerForm({ ...customerForm, registrationNumber: e.target.value })}
                    placeholder="e.g. 1967/001572/06"
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">SARS VAT Number</label>
                  <input
                    type="text"
                    value={customerForm.vatNumber}
                    onChange={(e) => setCustomerForm({ ...customerForm, vatNumber: e.target.value })}
                    placeholder="e.g. 4010103445"
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={customerForm.primaryContact}
                    onChange={(e) => setCustomerForm({ ...customerForm, primaryContact: e.target.value })}
                    placeholder="Buyer / Manager name"
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={customerForm.primaryEmail}
                    onChange={(e) => setCustomerForm({ ...customerForm, primaryEmail: e.target.value })}
                    placeholder="accounts@client.co.za"
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={customerForm.primaryPhone}
                    onChange={(e) => setCustomerForm({ ...customerForm, primaryPhone: e.target.value })}
                    placeholder="+27 11 000 0000"
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Credit Limit ({company.currency})
                  </label>
                  <input
                    type="number"
                    value={customerForm.creditLimit}
                    onChange={(e) => setCustomerForm({ ...customerForm, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Payment Terms (Days)
                  </label>
                  <input
                    type="number"
                    value={customerForm.paymentTermsDays}
                    onChange={(e) => setCustomerForm({ ...customerForm, paymentTermsDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors"
                >
                  Save Customer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <h3 className="text-base font-bold text-white tracking-tight">Add Delivery Branch Outlet</h3>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBranch} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Branch / Outlet Name <span className="text-[#C98A5B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={branchForm.branchName}
                  onChange={(e) => setBranchForm({ ...branchForm, branchName: e.target.value })}
                  placeholder="e.g. SPAR Sunward Park (Boksburg)"
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Street Delivery Address <span className="text-[#C98A5B]">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={branchForm.deliveryAddress}
                  onChange={(e) => setBranchForm({ ...branchForm, deliveryAddress: e.target.value })}
                  placeholder="Delivery receiving bay street address..."
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Bay Manager</label>
                  <input
                    type="text"
                    value={branchForm.contactPerson}
                    onChange={(e) => setBranchForm({ ...branchForm, contactPerson: e.target.value })}
                    placeholder="Name"
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    placeholder="+27..."
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Driver Instructions / Dock Window
                </label>
                <input
                  type="text"
                  value={branchForm.notes}
                  onChange={(e) => setBranchForm({ ...branchForm, notes: e.target.value })}
                  placeholder="e.g. Receiving open 06:00 - 08:00 AM only."
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors"
                >
                  Add Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Doc Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <h3 className="text-base font-bold text-white tracking-tight">Upload Compliance Document</h3>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDoc} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Document File Name</label>
                <input
                  type="text"
                  required
                  value={docForm.name}
                  onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                  placeholder="e.g. SPAR_Signed_Credit_Agreement_2026.pdf"
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Document Category</label>
                <select
                  value={docForm.type}
                  onChange={(e) => setDocForm({ ...docForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                >
                  <option value="VAT Certificate">SARS VAT Certificate</option>
                  <option value="Credit Application">Credit Application Form</option>
                  <option value="Tax Clearance">SARS Tax Clearance PIN</option>
                  <option value="Signed SLA / Contract">Signed SLA / Supply Contract</option>
                  <option value="B-BBEE Certificate">B-BBEE Verification Certificate</option>
                  <option value="Other">Other Regulatory Record</option>
                </select>
              </div>

              <div className="p-4 border-2 border-dashed border-neutral-700 rounded-lg text-center bg-neutral-950/40">
                <Upload className="w-6 h-6 text-neutral-500 mx-auto mb-1" />
                <div className="text-xs text-neutral-300 font-medium">Compliance Document Attached</div>
                <div className="text-[10px] text-neutral-500 font-mono">Simulated PDF upload · Ready to store in vault</div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition-colors"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
