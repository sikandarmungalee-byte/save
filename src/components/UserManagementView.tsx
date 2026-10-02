import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { User, UserRole, UserPermissions } from '../types/erp';
import {
  ShieldCheck,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Key,
  Smartphone,
  Lock,
  FileText,
  Truck,
  FileSpreadsheet,
  Receipt,
  Users2,
  Package,
  BarChart3,
  Flame,
  Database,
  Building2
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { users, currentUser, createUser, updateUser, deleteUser } = useERP();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales' as UserRole,
    status: 'active' as 'active' | 'inactive',
    permissions: {
      manageUsers: false,
      invoices: true,
      deliveryNotes: false,
      quotations: true,
      payments: false,
      customers: true,
      catalog: true,
      reports: false,
      crmLeads: true,
      databaseExplorer: false,
      companySettings: false,
    } as UserPermissions,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const canManageUsers = isSuperAdmin || !!currentUser?.permissions?.manageUsers;

  const openCreateModal = () => {
    if (!currentUser) {
      alert('You must be signed in to create users.');
      return;
    }
    if (!canManageUsers) {
      alert('Administrator permissions required to create users.');
      return;
    }
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      role: 'sales',
      status: 'active',
      permissions: {
        manageUsers: false,
        invoices: true,
        deliveryNotes: false,
        quotations: true,
        payments: false,
        customers: true,
        catalog: true,
        reports: false,
        crmLeads: true,
        databaseExplorer: false,
        companySettings: false,
      },
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      status: u.status,
      permissions: { ...u.permissions },
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    let perms: UserPermissions;
    if (newRole === 'super_admin') {
      perms = {
        manageUsers: true,
        invoices: true,
        deliveryNotes: true,
        quotations: true,
        payments: true,
        customers: true,
        catalog: true,
        reports: true,
        crmLeads: true,
        databaseExplorer: true,
        companySettings: true,
      };
    } else if (newRole === 'accountant') {
      perms = {
        manageUsers: false,
        invoices: true,
        deliveryNotes: true,
        quotations: true,
        payments: true,
        customers: true,
        catalog: true,
        reports: true,
        crmLeads: false,
        databaseExplorer: false,
        companySettings: false,
      };
    } else if (newRole === 'logistics') {
      perms = {
        manageUsers: false,
        invoices: false,
        deliveryNotes: true,
        quotations: false,
        payments: false,
        customers: true,
        catalog: false,
        reports: false,
        crmLeads: false,
        databaseExplorer: false,
        companySettings: false,
      };
    } else if (newRole === 'sales') {
      perms = {
        manageUsers: false,
        invoices: true,
        deliveryNotes: false,
        quotations: true,
        payments: false,
        customers: true,
        catalog: true,
        reports: false,
        crmLeads: true,
        databaseExplorer: false,
        companySettings: false,
      };
    } else {
      // auditor
      perms = {
        manageUsers: false,
        invoices: true,
        deliveryNotes: true,
        quotations: true,
        payments: true,
        customers: true,
        catalog: true,
        reports: true,
        crmLeads: true,
        databaseExplorer: false,
        companySettings: false,
      };
    }

    setFormData((prev) => ({
      ...prev,
      role: newRole,
      permissions: perms,
    }));
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setFormError('Name and email are mandatory.');
      return;
    }
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          permissions: formData.permissions,
          ...(formData.password ? { password: formData.password } : {}),
        });
      } else {
        await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password || 'password123',
          role: formData.role,
          status: formData.status,
          permissions: formData.permissions,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (confirm(`Are you sure you want to remove user "${u.name}" (${u.email})?`)) {
      try {
        await deleteUser(u.id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const permissionItems: { key: keyof UserPermissions; label: string; desc: string; icon: any }[] = [
    { key: 'manageUsers', label: 'User & Role Administration', desc: 'Create users, grant/revoke permissions and reset passwords', icon: ShieldCheck },
    { key: 'invoices', label: 'Tax Invoices & Credit Notes', desc: 'Create, edit, duplicate, and issue South African tax invoices', icon: FileText },
    { key: 'deliveryNotes', label: 'Delivery Notes & POD Signatures', desc: 'Generate delivery slips and record driver/customer POD signatures', icon: Truck },
    { key: 'quotations', label: 'Quotations & Cost Estimates', desc: 'Draft quotes and perform 1-click conversion to active invoices', icon: FileSpreadsheet },
    { key: 'payments', label: 'Payments & AR Ledger', desc: 'Log full/partial EFT payments and reconcile accounts receivable', icon: Receipt },
    { key: 'customers', label: 'Customer Directory & Branches', desc: 'Manage legal entities, multi-branch shipping sites, and compliance docs', icon: Users2 },
    { key: 'catalog', label: 'Bakery & Product Catalog', desc: 'Maintain SKU codes, pack counts, unit prices, and margins', icon: Package },
    { key: 'reports', label: 'Financial Reports & Analytics', desc: 'Access 52-week ISO performance, collections, and audit spreadsheets', icon: BarChart3 },
    { key: 'crmLeads', label: 'Sales Leads Pipeline & CRM', desc: 'Track sales contract deals and log client correspondence history', icon: Flame },
    { key: 'databaseExplorer', label: 'Database Explorer & Backups', desc: 'Inspect live JSON documents, download backups, and restore data', icon: Database },
    { key: 'companySettings', label: 'Company Profile & Banking', desc: 'Configure company tax registration, banking details, and PIN lock', icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/src/assets/images/savoure_master_logo_1790775722136.jpg"
              alt="Savouré Logo"
              className="w-14 h-14 rounded-full object-cover border border-[#C98A5B] shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
                  Savouré Super Admin Console
                </span>
                <span className="text-[#3A2D25]">·</span>
                <span className="text-xs text-[#A69385] font-mono tabular-nums">{users.length} Active System Users</span>
              </div>
              <h1 className="text-xl font-serif font-bold text-white tracking-tight">
                User Management & Access Permissions
              </h1>
              <p className="text-xs text-[#C5B7AC] mt-1 max-w-2xl">
                Super Admin control: Provision users, configure role-based permissions matrix, and control access across phones, tablets, and desktop workstations.
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#C98A5B]"
          />
        </div>

        {/* Role Segmented Filter */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Roles' },
            { id: 'super_admin', label: 'Super Admin' },
            { id: 'accountant', label: 'Accountants' },
            { id: 'sales', label: 'Sales' },
            { id: 'logistics', label: 'Logistics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                roleFilter === tab.id
                  ? 'bg-[#C98A5B] text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table / Grid */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">User / Email</th>
                <th className="py-3 px-4 font-semibold">Role Tier</th>
                <th className="py-3 px-4 font-semibold">Granted Permissions</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Last Device Login</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const permCount = Object.values(u.permissions || {}).filter(Boolean).length;
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-[#DE9E74] text-xs shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#C98A5B]/20 text-[#F3D2BF] font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                            u.role === 'super_admin'
                              ? 'bg-[#C98A5B]/15 text-[#F3D2BF] border border-[#C98A5B]/30'
                              : u.role === 'accountant'
                              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                              : u.role === 'logistics'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <span className="font-mono font-semibold tabular-nums text-[#DE9E74]">
                            {permCount} / 11
                          </span>
                          <span className="text-neutral-500 text-[11px]">modules active</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                            u.status === 'active' ? 'text-emerald-400' : 'text-neutral-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-500' : 'bg-neutral-600'
                            }`}
                          />
                          <span className="capitalize">{u.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-neutral-400 text-[11px] font-mono tabular-nums">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Not yet logged in'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                            title="Edit Permissions"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!(u.role === 'super_admin' && users.filter((x) => x.role === 'super_admin').length <= 1) && (
                            <button
                              onClick={() => handleDelete(u)}
                              className="p-1.5 rounded bg-neutral-800 hover:bg-red-950/80 text-neutral-400 hover:text-red-300 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create / Edit Modal with Granular Permission Toggles */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {editingUser ? `Edit User: ${editingUser.name}` : 'Create New Team User'}
                </h3>
                <p className="text-xs text-neutral-400">
                  Configure identity credentials, role assignment, and granular functional permissions.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
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
              {/* Row 1: Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Full Name <span className="text-[#C98A5B]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. David Nkosi"
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Email Address <span className="text-[#C98A5B]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. david@company.co.za"
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>

              {/* Row 2: Role and Password */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Role Archetype
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    <option value="super_admin">Super Admin (Unrestricted)</option>
                    <option value="accountant">Financial Controller / Accountant</option>
                    <option value="sales">Sales Executive</option>
                    <option value="logistics">Logistics & Receiving Bay</option>
                    <option value="auditor">Auditor (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-md text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    <option value="active">Active (Access Allowed)</option>
                    <option value="inactive">Inactive (Suspended)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    {editingUser ? 'New Password (Optional)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Leave blank to keep current' : 'e.g. password123'}
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>

              {/* Granular Permissions Matrix */}
              <div className="pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#DE9E74]">
                      Granular Permission Controls
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Toggle specific module authorizations individually for this user account.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allOn: UserPermissions = {
                          manageUsers: true,
                          invoices: true,
                          deliveryNotes: true,
                          quotations: true,
                          payments: true,
                          customers: true,
                          catalog: true,
                          reports: true,
                          crmLeads: true,
                          databaseExplorer: true,
                          companySettings: true,
                        };
                        setFormData({ ...formData, permissions: allOn });
                      }}
                      className="text-[10px] text-[#DE9E74] hover:underline"
                    >
                      Grant All
                    </button>
                    <span className="text-neutral-600">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allOff: UserPermissions = {
                          manageUsers: false,
                          invoices: false,
                          deliveryNotes: false,
                          quotations: false,
                          payments: false,
                          customers: false,
                          catalog: false,
                          reports: false,
                          crmLeads: false,
                          databaseExplorer: false,
                          companySettings: false,
                        };
                        setFormData({ ...formData, permissions: allOff });
                      }}
                      className="text-[10px] text-neutral-400 hover:underline"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {permissionItems.map((item) => {
                    const isChecked = !!formData.permissions[item.key];
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.key}
                        onClick={() => togglePermission(item.key)}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-[#C98A5B]/10 border-[#C98A5B]/30 text-neutral-200'
                            : 'bg-neutral-800/40 border-neutral-800 text-neutral-400 hover:bg-neutral-800/70'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                            isChecked
                              ? 'bg-[#C98A5B] border-[#C98A5B] text-neutral-950'
                              : 'border-neutral-600 bg-neutral-800'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-white leading-tight flex items-center gap-1.5">
                            <Icon className="w-3 h-3 text-[#DE9E74]" />
                            <span>{item.label}</span>
                          </div>
                          <div className="text-[10px] text-neutral-400 leading-tight mt-0.5 line-clamp-1">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{formLoading ? 'Saving...' : editingUser ? 'Update Permissions' : 'Create User Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
