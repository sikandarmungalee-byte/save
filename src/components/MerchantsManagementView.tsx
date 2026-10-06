import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { User } from '../types/erp';
import {
  Store,
  Building2,
  UserPlus,
  Edit2,
  Trash2,
  Key,
  ShieldCheck,
  Check,
  X,
  Search,
  FileText,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Lock,
} from 'lucide-react';

export const MerchantsManagementView: React.FC = () => {
  const { users, createUser, updateUser, deleteUser, invoices, currentUser } = useERP();

  const [search, setSearch] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');

  // Modal State for Add / Edit Merchant
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('Durban Central');
  const [customBranch, setCustomBranch] = useState('');
  const [merchantStoreName, setMerchantStoreName] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('061 364 5712');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Password reset modal state
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [targetUserForReset, setTargetUserForReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Default suggested branches
  const PRESET_BRANCHES = [
    'Durban Central',
    'Johannesburg North - Sandton',
    'Johannesburg South',
    'Cape Town Metro',
    'Pretoria East',
    'Gqeberha (Port Elizabeth)',
    'Bloemfontein',
  ];

  // Filter only merchant users
  const merchantUsers = useMemo(() => {
    return users.filter((u) => u.role === 'merchant');
  }, [users]);

  // Aggregate branch statistics
  const branchStats = useMemo(() => {
    const stats: Record<string, { merchantCount: number; invoiceCount: number; totalVolume: number }> = {};
    
    // Group merchants
    merchantUsers.forEach((m) => {
      const b = m.branch || 'Unassigned';
      if (!stats[b]) stats[b] = { merchantCount: 0, invoiceCount: 0, totalVolume: 0 };
      stats[b].merchantCount += 1;
    });

    // Group invoices
    invoices.forEach((inv) => {
      const b = inv.branch || inv.branchName || 'Main Branch';
      if (!stats[b]) stats[b] = { merchantCount: 0, invoiceCount: 0, totalVolume: 0 };
      stats[b].invoiceCount += 1;
      stats[b].totalVolume += inv.grandTotal || 0;
    });

    return stats;
  }, [merchantUsers, invoices]);

  // Filtered merchants
  const filteredMerchants = useMemo(() => {
    return merchantUsers.filter((m) => {
      const matchesSearch =
        (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.username || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.branch || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.merchantStoreName || '').toLowerCase().includes(search.toLowerCase());

      const matchesBranch =
        selectedBranchFilter === 'ALL' || m.branch === selectedBranchFilter;

      return matchesSearch && matchesBranch;
    });
  }, [merchantUsers, search, selectedBranchFilter]);

  const openAddModal = () => {
    setEditingMerchant(null);
    setName('');
    setEmail('');
    setUsername('');
    setPassword('password123');
    setBranch('Durban Central');
    setCustomBranch('');
    setMerchantStoreName('');
    setMerchantPhone('061 364 5712');
    setStatus('active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (m: User) => {
    setEditingMerchant(m);
    setName(m.name || '');
    setEmail(m.email || '');
    setUsername(m.username || '');
    setPassword('');
    const isPreset = PRESET_BRANCHES.includes(m.branch || '');
    if (isPreset) {
      setBranch(m.branch || 'Durban Central');
      setCustomBranch('');
    } else {
      setBranch('CUSTOM');
      setCustomBranch(m.branch || '');
    }
    setMerchantStoreName(m.merchantStoreName || '');
    setMerchantPhone(m.merchantPhone || '061 364 5712');
    setStatus(m.status || 'active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError('Name and Email are required.');
      return;
    }

    const assignedBranch = branch === 'CUSTOM' ? customBranch.trim() : branch;
    if (!assignedBranch) {
      setFormError('Please specify the merchant branch name.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      if (editingMerchant) {
        await updateUser(editingMerchant.id, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase() || undefined,
          branch: assignedBranch,
          merchantStoreName: merchantStoreName.trim() || undefined,
          merchantPhone: merchantPhone.trim() || undefined,
          status,
          ...(password.trim() ? { password: password.trim() } : {}),
        });
      } else {
        await createUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase() || undefined,
          password: password.trim() || 'password123',
          role: 'merchant',
          branch: assignedBranch,
          merchantStoreName: merchantStoreName.trim() || `${assignedBranch} Wholesale Depot`,
          merchantPhone: merchantPhone.trim() || undefined,
          status,
          permissions: {
            manageUsers: false,
            invoices: true,
            deliveryNotes: false,
            quotations: false,
            payments: false,
            customers: false,
            catalog: true,
            reports: false,
            crmLeads: false,
            databaseExplorer: false,
            companySettings: false,
          },
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save merchant.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMerchant = async (id: string, merchantName: string) => {
    if (!confirm(`Are you sure you want to remove merchant "${merchantName}"? They will lose access to the portal.`)) {
      return;
    }
    try {
      await deleteUser(id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete merchant.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForReset || !newPassword.trim()) return;
    try {
      await updateUser(targetUserForReset.id, { password: newPassword.trim() });
      setIsResetPasswordModalOpen(false);
      alert(`Password successfully updated for ${targetUserForReset.name}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update password.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Header */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C98A5B]/15 text-[#DE9E74] text-xs font-bold uppercase tracking-wider mb-2">
              <Store className="w-3.5 h-3.5" />
              <span>Multi-Branch Access Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Merchant & Branch Management
            </h1>
            <p className="mt-1 text-xs text-[#A69385]">
              Configure merchant accounts and assign them to specific branches. When a merchant logs in, they can only view and create invoices for their designated branch.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C98A5B] to-[#DE9E74] text-[#120F0D] font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Merchant</span>
          </button>
        </div>
      </div>

      {/* Branch Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-5">
          <span className="text-[11px] font-serif uppercase tracking-wider text-[#A69385]">Total Merchants</span>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{merchantUsers.length}</div>
          <span className="text-[10px] text-[#8A776B]">Approved wholesale portals</span>
        </div>

        <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-5">
          <span className="text-[11px] font-serif uppercase tracking-wider text-[#A69385]">Active Branches</span>
          <div className="mt-2 text-2xl font-bold font-mono text-[#DE9E74]">
            {Object.keys(branchStats).length}
          </div>
          <span className="text-[10px] text-[#8A776B]">Operational distribution hubs</span>
        </div>

        <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-5">
          <span className="text-[11px] font-serif uppercase tracking-wider text-[#A69385]">Branch Invoices</span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {invoices.filter((i) => i.branch || i.merchantId).length}
          </div>
          <span className="text-[10px] text-emerald-600">Tagged per branch location</span>
        </div>

        <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-5">
          <span className="text-[11px] font-serif uppercase tracking-wider text-[#A69385]">Isolation Security</span>
          <div className="mt-2 text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-3">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Strict Branch Isolation Active</span>
          </div>
          <span className="text-[10px] text-[#8A776B]">Merchants only see own invoices</span>
        </div>
      </div>

      {/* Merchants Directory */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#C98A5B]" />
              <span>Registered Branch Merchants ({filteredMerchants.length})</span>
            </h2>
            <p className="text-xs text-[#A69385]">
              Manage login credentials, branch assignment, and store names for each partner.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#A69385] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search merchant or branch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#8A776B] outline-none focus:border-[#C98A5B] w-56"
              />
            </div>

            {/* Branch Filter Dropdown */}
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white outline-none focus:border-[#C98A5B]"
            >
              <option value="ALL">All Branches</option>
              {Object.keys(branchStats).map((b) => (
                <option key={b} value={b}>
                  {b} ({branchStats[b]?.merchantCount || 0} merchants)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Merchants Table */}
        {filteredMerchants.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#2C211B] rounded-xl bg-[#120F0D]">
            <Store className="w-12 h-12 text-[#8A776B]/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No Merchants Configured</h3>
            <p className="text-xs text-[#A69385] max-w-sm mx-auto mt-1">
              Add your branch wholesale partners so they can log in via the Merchant Login button on the website.
            </p>
            <button
              onClick={openAddModal}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#B87A4D] text-[#120F0D] font-bold text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add First Merchant</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#2C211B]">
            <table className="w-full text-left text-xs text-[#EDE6DE]">
              <thead className="bg-[#221B17] text-[#A69385] uppercase text-[10px] font-serif tracking-wider border-b border-[#2C211B]">
                <tr>
                  <th className="py-3 px-4">Merchant Name</th>
                  <th className="py-3 px-4">Branch Location</th>
                  <th className="py-3 px-4">Username / Email</th>
                  <th className="py-3 px-4">Store Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C211B]">
                {filteredMerchants.map((m) => (
                  <tr key={m.id} className="hover:bg-[#221B17]/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#C98A5B]/20 text-[#DE9E74] flex items-center justify-center font-bold text-xs">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span>{m.name}</span>
                          <span className="block text-[10px] text-[#8A776B]">Merchant User</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#C98A5B]/15 text-[#DE9E74] border border-[#C98A5B]/30">
                        <MapPin className="w-3 h-3" />
                        <span>{m.branch || 'Unassigned'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#A69385]">
                      <div>{m.email}</div>
                      {m.username && (
                        <div className="text-[10px] text-[#C98A5B]">User: {m.username}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-white">
                      {m.merchantStoreName || `${m.branch} Depot`}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#A69385]">
                      {m.merchantPhone || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {m.status === 'active' ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setTargetUserForReset(m);
                            setNewPassword('');
                            setIsResetPasswordModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-[#2C211B] text-[#A69385] hover:text-[#DE9E74]"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 rounded hover:bg-[#2C211B] text-[#A69385] hover:text-white"
                          title="Edit Merchant & Branch"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteMerchant(m.id, m.name)}
                          className="p-1.5 rounded hover:bg-[#2C211B] text-red-400 hover:text-red-300"
                          title="Delete Merchant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Merchant */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#1A1411] border border-[#C98A5B]/40 rounded-2xl w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-[#2C211B] pb-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-white">
                  {editingMerchant ? 'Edit Branch Merchant' : 'Register New Branch Merchant'}
                </h3>
                <p className="text-xs text-[#A69385]">
                  Assign branch location and configure invoice access rights.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A776B] hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMerchant} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A69385] mb-1">
                    Merchant Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white outline-none focus:border-[#C98A5B]"
                    placeholder="e.g. Fatima Patel"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A69385] mb-1">
                    Store / Company Trading Name
                  </label>
                  <input
                    type="text"
                    value={merchantStoreName}
                    onChange={(e) => setMerchantStoreName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white outline-none focus:border-[#C98A5B]"
                    placeholder="e.g. Durban North Wholesale Depot"
                  />
                </div>
              </div>

              {/* Branch Assignment */}
              <div className="p-4 rounded-xl bg-[#221B17] border border-[#3A2D25] space-y-3">
                <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#DE9E74]">
                  Designated Branch Assignment *
                </label>
                <p className="text-[11px] text-[#A69385]">
                  Crucial: The merchant will strictly only have access to view and create invoices for this specific branch.
                </p>

                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white outline-none focus:border-[#C98A5B]"
                >
                  {PRESET_BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Enter Custom Branch Name...</option>
                </select>

                {branch === 'CUSTOM' && (
                  <input
                    type="text"
                    required
                    value={customBranch}
                    onChange={(e) => setCustomBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#C98A5B] rounded-lg text-xs text-white outline-none"
                    placeholder="Enter Custom Branch Name (e.g. Durban Central - Umhlanga)"
                  />
                )}
              </div>

              {/* Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A69385] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white outline-none focus:border-[#C98A5B]"
                    placeholder="merchant@savoure.co.za"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A69385] mb-1">
                    Username (Optional)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white outline-none focus:border-[#C98A5B]"
                    placeholder="e.g. merchant_durban"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A69385] mb-1">
                    {editingMerchant ? 'Change Password (Leave blank to keep)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingMerchant}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white outline-none focus:border-[#C98A5B]"
                    placeholder={editingMerchant ? 'Leave blank to preserve' : 'Enter password'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A69385] mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={merchantPhone}
                    onChange={(e) => setMerchantPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white outline-none focus:border-[#C98A5B]"
                    placeholder="e.g. 061 364 5712"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A69385] mb-1">
                  Account Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'active'}
                      onChange={() => setStatus('active')}
                      className="accent-[#C98A5B]"
                    />
                    <span>Active (Permit Portal Login)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#A69385] cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'inactive'}
                      onChange={() => setStatus('inactive')}
                      className="accent-[#C98A5B]"
                    />
                    <span>Disabled / Suspended</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2C211B]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-[#A69385] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#C98A5B] to-[#DE9E74] text-[#120F0D] font-bold text-xs shadow-md disabled:opacity-60"
                >
                  {formLoading ? 'Saving...' : editingMerchant ? 'Save Changes' : 'Create Merchant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {isResetPasswordModalOpen && targetUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1411] border border-[#C98A5B]/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-serif font-bold text-white">
              Reset Password for {targetUserForReset.name}
            </h3>
            <p className="text-xs text-[#A69385]">
              Assign a new password for branch merchant account ({targetUserForReset.email}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A69385] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white outline-none focus:border-[#C98A5B]"
                  placeholder="Enter new password"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2C211B]">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-[#A69385] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C98A5B] text-[#120F0D] font-bold text-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
