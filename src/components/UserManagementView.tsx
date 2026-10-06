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
  Building2,
  ShoppingBag,
  Wallet,
  Landmark,
  Sparkles,
  History,
  AlertCircle,
  CheckCircle2,
  Filter,
  Eye,
  EyeOff,
  Store,
} from 'lucide-react';
import { MerchantsManagementView } from './MerchantsManagementView';

export const UserManagementView: React.FC = () => {
  const {
    users,
    currentUser,
    createUser,
    updateUser,
    deleteUser,
    loginLogs,
    resetUserPassword
  } = useERP();

  const [activeMainTab, setActiveMainTab] = useState<'users' | 'logs' | 'merchants'>('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [logFilter, setLogFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
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
      stock: true,
      payroll: false,
      accounting: false,
      taskeenAI: true,
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
      username: '',
      email: '',
      password: '',
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
        stock: true,
        payroll: false,
        accounting: false,
        taskeenAI: true,
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
      username: u.username || u.email.split('@')[0],
      email: u.email,
      password: '',
      role: u.role,
      status: u.status,
      permissions: {
        manageUsers: u.permissions?.manageUsers ?? (u.role === 'super_admin'),
        invoices: u.permissions?.invoices ?? true,
        deliveryNotes: u.permissions?.deliveryNotes ?? false,
        quotations: u.permissions?.quotations ?? true,
        payments: u.permissions?.payments ?? false,
        customers: u.permissions?.customers ?? true,
        catalog: u.permissions?.catalog ?? true,
        stock: u.permissions?.stock ?? true,
        payroll: u.permissions?.payroll ?? (u.role === 'super_admin' || u.role === 'accountant'),
        accounting: u.permissions?.accounting ?? (u.role === 'super_admin' || u.role === 'accountant'),
        taskeenAI: u.permissions?.taskeenAI ?? true,
        reports: u.permissions?.reports ?? (u.role === 'super_admin' || u.role === 'accountant'),
        crmLeads: u.permissions?.crmLeads ?? true,
        databaseExplorer: u.permissions?.databaseExplorer ?? (u.role === 'super_admin'),
        companySettings: u.permissions?.companySettings ?? (u.role === 'super_admin'),
      },
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openResetPasswordModal = (u: User) => {
    setPasswordTargetUser(u);
    setNewPasswordValue('');
    setIsPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser || !newPasswordValue.trim()) {
      alert('Please enter a new password.');
      return;
    }
    try {
      await resetUserPassword(passwordTargetUser.id, newPasswordValue.trim());
      setIsPasswordModalOpen(false);
      alert(`Password for ${passwordTargetUser.name} has been updated successfully.`);
    } catch (err: any) {
      alert(err?.message || 'Failed to reset password.');
    }
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
        stock: true,
        payroll: true,
        accounting: true,
        taskeenAI: true,
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
        stock: true,
        payroll: true,
        accounting: true,
        taskeenAI: true,
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
        stock: true,
        payroll: false,
        accounting: false,
        taskeenAI: true,
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
        stock: true,
        payroll: false,
        accounting: false,
        taskeenAI: true,
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
        stock: true,
        payroll: true,
        accounting: true,
        taskeenAI: true,
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
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Full name and email are mandatory.');
      return;
    }
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: formData.name.trim(),
          username: formData.username.trim() || formData.email.trim().split('@')[0],
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          status: formData.status,
          permissions: formData.permissions,
          ...(formData.password ? { password: formData.password } : {}),
        });
      } else {
        if (!formData.password) {
          setFormError('Password is required when creating a new user.');
          setFormLoading(false);
          return;
        }
        await createUser({
          name: formData.name.trim(),
          username: formData.username.trim() || formData.email.trim().split('@')[0],
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
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
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredLogs = (loginLogs || []).filter((l) => {
    const matchesSearch =
      l.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.userEmail.toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(logSearch.toLowerCase()));
    const matchesAction = logFilter === 'ALL' || l.action === logFilter;
    return matchesSearch && matchesAction;
  });

  const permissionItems: { key: keyof UserPermissions; label: string; desc: string; icon: any }[] = [
    { key: 'manageUsers', label: 'User & Role Administration', desc: 'Create users, grant/revoke permissions and reset passwords', icon: ShieldCheck },
    { key: 'invoices', label: 'Tax Invoices & Credit Notes', desc: 'Issue, duplicate, and manage South African tax invoices', icon: FileText },
    { key: 'deliveryNotes', label: 'Delivery Notes & POD Signatures', desc: 'Generate delivery slips and record driver/customer POD signatures', icon: Truck },
    { key: 'quotations', label: 'Quotations & Cost Estimates', desc: 'Draft quotes and perform 1-click conversion to active invoices', icon: FileSpreadsheet },
    { key: 'payments', label: 'Payments & AR Ledger', desc: 'Log EFT payments and reconcile customer accounts receivable', icon: Receipt },
    { key: 'customers', label: 'Customer Directory & Branches', desc: 'Manage legal entities, multi-branch shipping sites, and compliance docs', icon: Users2 },
    { key: 'catalog', label: 'Bakery & Product Catalog', desc: 'Maintain SKU codes, pack counts, unit prices, and margins', icon: Package },
    { key: 'stock', label: 'Stock Capturing & Purchase Slips', desc: 'Capture raw ingredient slips, photograph receipts, and track finished stock', icon: ShoppingBag },
    { key: 'payroll', label: 'Staff & Monthly Payroll', desc: 'Calculate basic pay, overtime rates, allowances, and generate payslips', icon: Wallet },
    { key: 'accounting', label: 'Accounting & General Ledgers', desc: 'General ledger, Trial Balance, P&L, Balance Sheet, and SARS VAT 201', icon: Landmark },
    { key: 'taskeenAI', label: 'Taskeen Executive AI Advisor', desc: 'Consult Taskeen on daily sales, stock reordering, and business strategy', icon: Sparkles },
    { key: 'reports', label: '52-Week Reports & Analytics', desc: 'Access 52-week ISO performance, collections, and audit spreadsheets', icon: BarChart3 },
    { key: 'crmLeads', label: 'Sales Leads Pipeline & CRM', desc: 'Track sales contract deals and log client correspondence history', icon: Flame },
    { key: 'databaseExplorer', label: 'Database Explorer & Backups', desc: 'Inspect live JSON documents, download backups, and restore data', icon: Database },
    { key: 'companySettings', label: 'Company Profile & Banking', desc: 'Configure company tax registration, banking details, and PIN lock', icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
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
                <span className="text-xs text-[#A69385] font-mono tabular-nums">{users.length} Registered Accounts</span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
                User Management, Permissions & Login Logs
              </h1>
              <p className="text-xs text-[#C5B7AC] mt-1 max-w-2xl leading-relaxed">
                Super Admin control: Provision users, customize granular functional permissions, monitor login audit logs, and manage passwords across all devices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New User</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Users vs Login Logs */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-[#2C211B]">
          <button
            onClick={() => setActiveMainTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeMainTab === 'users'
                ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-sm'
                : 'text-[#A69385] hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <Users2 className="w-4 h-4" />
            <span>Active Enterprise Users ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('logs')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeMainTab === 'logs'
                ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-sm'
                : 'text-[#A69385] hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Login History & Security Audit Logs ({(loginLogs || []).length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('merchants')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeMainTab === 'merchants'
                ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-sm'
                : 'text-[#A69385] hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Branch Merchants ({users.filter((u) => u.role === 'merchant').length})</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: USERS & PERMISSIONS DIRECTORY             */}
      {/* ---------------------------------------------------- */}
      {activeMainTab === 'users' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8A776B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, username, or email..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#171311] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            {/* Role Segmented Filter */}
            <div className="flex items-center gap-1 p-1 bg-[#171311] border border-[#2C211B] rounded-lg overflow-x-auto">
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
                      ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                      : 'text-[#A69385] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#171311] border border-[#2C211B] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#120F0D] border-b border-[#2C211B] text-[#A69385] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User Identity</th>
                    <th className="py-3 px-4 font-semibold">Role Tier</th>
                    <th className="py-3 px-4 font-semibold">Granted Permissions</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Last Device Login</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#221B17]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#8A776B]">
                        No users matching criteria found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const permCount = Object.values(u.permissions || {}).filter(Boolean).length;
                      const isCurrent = currentUser?.id === u.id;
                      return (
                        <tr key={u.id} className="hover:bg-[#221B17]/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#221B17] border border-[#3A2D25] flex items-center justify-center font-bold text-[#DE9E74] text-xs shrink-0 shadow-inner">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isCurrent && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#C98A5B]/20 text-[#DE9E74] font-medium border border-[#C98A5B]/30">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#A69385] font-mono">
                                  {u.username ? `@${u.username} · ` : ''}{u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-medium capitalize ${
                                u.role === 'super_admin'
                                  ? 'bg-[#C98A5B]/15 text-[#DE9E74] border border-[#C98A5B]/30'
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
                            <div className="flex items-center gap-1.5 text-white">
                              <span className="font-mono font-semibold tabular-nums text-[#DE9E74]">
                                {permCount} / {permissionItems.length}
                              </span>
                              <span className="text-[#8A776B] text-[11px]">modules active</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
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

                          <td className="py-3.5 px-4 text-[#A69385] text-[11px] font-mono tabular-nums">
                            {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Not yet logged in'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openResetPasswordModal(u)}
                                className="p-1.5 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-[#DE9E74] hover:text-white transition-colors"
                                title="Reset User Password"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-[#A69385] hover:text-white transition-colors"
                                title="Edit Permissions"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!(u.role === 'super_admin' && users.filter((x) => x.role === 'super_admin').length <= 1) && (
                                <button
                                  onClick={() => handleDelete(u)}
                                  className="p-1.5 rounded-lg bg-[#221B17] hover:bg-rose-950 text-rose-400 hover:text-rose-200 transition-colors"
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
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: LOGIN HISTORY & AUDIT SECURITY LOGS       */}
      {/* ---------------------------------------------------- */}
      {activeMainTab === 'logs' && (
        <div className="space-y-6">
          {/* Log Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8A776B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search by user name, email, or activity details..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#171311] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#171311] border border-[#2C211B] rounded-lg overflow-x-auto">
              {[
                { id: 'ALL', label: 'All Events' },
                { id: 'LOGIN', label: 'Logins' },
                { id: 'LOGOUT', label: 'Sign Outs' },
                { id: 'PASSWORD_RESET', label: 'Password Resets' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLogFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    logFilter === tab.id
                      ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                      : 'text-[#A69385] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-[#171311] border border-[#2C211B] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#120F0D] border-b border-[#2C211B] text-[#A69385] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">User Identity</th>
                    <th className="py-3 px-4 font-semibold">Activity Action</th>
                    <th className="py-3 px-4 font-semibold">Result Status</th>
                    <th className="py-3 px-4 font-semibold">Client Device / Browser</th>
                    <th className="py-3 px-4 font-semibold">Event Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#221B17]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#8A776B]">
                        No activity audit logs recorded matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#221B17]/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-[#A69385] tabular-nums whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>

                        <td className="py-3 px-4 font-medium text-white">
                          <div>{log.userName}</div>
                          <div className="text-[10px] text-[#8A776B] font-mono">{log.userEmail}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.action === 'LOGIN'
                                ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                                : log.action === 'PASSWORD_RESET'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                                : log.action === 'LOGOUT'
                                ? 'bg-neutral-800 text-neutral-300'
                                : 'bg-[#C98A5B]/20 text-[#DE9E74] border border-[#C98A5B]/30'
                            }`}
                          >
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                              log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {log.status === 'SUCCESS' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5" />
                            )}
                            <span>{log.status}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[#A69385] text-[11px] truncate max-w-xs">
                          {log.device || 'Web Browser'}
                        </td>

                        <td className="py-3 px-4 text-[#EDE6DE] text-xs">
                          {log.details || 'System event recorded'}
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

      {/* ---------------------------------------------------- */}
      {/* SECTION 3: MERCHANTS & BRANCHES MANAGEMENT           */}
      {/* ---------------------------------------------------- */}
      {activeMainTab === 'merchants' && (
        <MerchantsManagementView />
      )}

      {/* ---------------------------------------------------- */}
      {/* CREATE / EDIT USER MODAL                             */}
      {/* ---------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 shadow-2xl my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#2C211B] mb-5">
              <div>
                <h3 className="text-lg font-serif font-bold text-white tracking-wide">
                  {editingUser ? `Edit User: ${editingUser.name}` : 'Create New Team Member Account'}
                </h3>
                <p className="text-xs text-[#A69385]">
                  Configure credentials, role tier, and granular system module permissions.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8A776B] hover:text-white hover:bg-[#221B17]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Row 1: Name, Username, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Full Name <span className="text-[#C98A5B]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Fatima Adams"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. fatima_sales"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Work Email <span className="text-[#C98A5B]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. fatima@savoure.co.za"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>

              {/* Row 2: Role, Status, Password */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">Role Archetype</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    <option value="super_admin">Super Admin (Unrestricted)</option>
                    <option value="accountant">Financial Controller / Accountant</option>
                    <option value="sales">Sales Executive</option>
                    <option value="logistics">Logistics & Receiving Bay</option>
                    <option value="auditor">Auditor (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    <option value="active">Active (Access Permitted)</option>
                    <option value="inactive">Inactive (Suspended)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    {editingUser ? 'New Password (Optional)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Leave blank to retain current' : 'Enter password'}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>

              {/* Granular Permissions Matrix */}
              <div className="pt-4 border-t border-[#2C211B]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#DE9E74]">
                      Granular Permission Controls
                    </h4>
                    <p className="text-[11px] text-[#A69385]">
                      Enable or disable access to specific enterprise modules for this user.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allOn: any = {};
                        permissionItems.forEach((p) => {
                          allOn[p.key] = true;
                        });
                        setFormData({ ...formData, permissions: allOn });
                      }}
                      className="text-[11px] text-[#DE9E74] hover:underline"
                    >
                      Grant All
                    </button>
                    <span className="text-[#3A2D25]">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allOff: any = {};
                        permissionItems.forEach((p) => {
                          allOff[p.key] = false;
                        });
                        setFormData({ ...formData, permissions: allOff });
                      }}
                      className="text-[11px] text-[#8A776B] hover:text-white"
                    >
                      Revoke All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {permissionItems.map((perm) => {
                    const Icon = perm.icon;
                    const isGranted = Boolean((formData.permissions as any)[perm.key]);
                    return (
                      <div
                        key={perm.key}
                        onClick={() => togglePermission(perm.key)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isGranted
                            ? 'bg-[#221B17] border-[#C98A5B]/40'
                            : 'bg-[#120F0D] border-[#2C211B] hover:border-[#3A2D25] opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={`p-1.5 rounded-lg ${isGranted ? 'bg-[#C98A5B]/20 text-[#DE9E74]' : 'bg-[#171311] text-[#6E5B4F]'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white text-xs truncate">{perm.label}</div>
                            <div className="text-[10px] text-[#8A776B] truncate">{perm.desc}</div>
                          </div>
                        </div>

                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isGranted ? 'bg-[#C98A5B] border-[#C98A5B] text-[#120F0D]' : 'border-[#3A2D25]'
                        }`}>
                          {isGranted && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#2C211B] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold"
                >
                  {formLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* QUICK PASSWORD RESET MODAL                           */}
      {/* ---------------------------------------------------- */}
      {isPasswordModalOpen && passwordTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8A776B] hover:text-white hover:bg-[#221B17]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#C98A5B]/15 border border-[#C98A5B]/30 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5 text-[#DE9E74]" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white">Reset User Password</h3>
                <p className="text-xs text-[#A69385]">For {passwordTargetUser.name} ({passwordTargetUser.email})</p>
              </div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                  New Password <span className="text-[#C98A5B]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Enter new confidential password"
                    className="w-full pl-3 pr-10 py-2.5 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A776B] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#2C211B] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold"
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
