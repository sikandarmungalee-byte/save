import React from 'react';
import { useERP } from '../context/ERPContext';
import {
  LayoutDashboard,
  FileText,
  Truck,
  FileSpreadsheet,
  Receipt,
  Users2,
  Package,
  BarChart3,
  Flame,
  ShieldCheck,
  Database,
  Building2,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sparkles,
  Wallet,
  ShoppingBag,
  Landmark,
  Store,
  Globe,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onGoToWebsite?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileOpen,
  setMobileOpen,
  onGoToWebsite,
}) => {
  const {
    currentUser,
    logout,
    company,
    invoices,
    deliveryNotes,
    quotations,
    leads,
    users,
    stockItemStatuses,
    staff,
  } = useERP();

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const perms = currentUser?.permissions;

  // Unpaid invoices count
  const unpaidCount = invoices.filter((i) => i.status === 'Sent' || i.status === 'Partial' || i.status === 'Overdue').length;
  // In transit delivery notes
  const inTransitCount = deliveryNotes.filter((d) => d.status === 'In Transit').length;
  // Pending quotes
  const pendingQuotesCount = quotations.filter((q) => q.status === 'Sent' || q.status === 'Accepted').length;
  // Out of stock items
  const finishedStockCount = (stockItemStatuses || []).filter((s) => s.isFinished || s.quantityOnHand <= 0).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Financial Overview',
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      id: 'invoices',
      label: 'Tax Invoices & Credit',
      icon: FileText,
      allowed: perms?.invoices ?? true,
      badge: unpaidCount > 0 ? `${unpaidCount} due` : undefined,
    },
    {
      id: 'invoice-studio',
      label: 'Luxury Invoice Studio',
      icon: Sparkles,
      allowed: perms?.invoices ?? true,
      highlight: true,
      badge: 'Design',
    },
    {
      id: 'delivery-notes',
      label: 'Delivery Notes & POD',
      icon: Truck,
      allowed: perms?.deliveryNotes ?? true,
      badge: inTransitCount > 0 ? `${inTransitCount} transit` : undefined,
    },
    {
      id: 'quotations',
      label: 'Quotations & Estimates',
      icon: FileSpreadsheet,
      allowed: perms?.quotations ?? true,
      badge: pendingQuotesCount > 0 ? `${pendingQuotesCount} active` : undefined,
    },
    {
      id: 'payments',
      label: 'Accounts Receivable',
      icon: Receipt,
      allowed: perms?.payments ?? true,
    },
    {
      id: 'customers',
      label: 'Customer & Branches',
      icon: Users2,
      allowed: perms?.customers ?? true,
    },
    {
      id: 'catalog',
      label: 'Bakery & Catalog',
      icon: Package,
      allowed: perms?.catalog ?? true,
    },
    {
      id: 'stock',
      label: 'Stock Capturing & Slips',
      icon: ShoppingBag,
      allowed: true,
      highlight: true,
      badge: finishedStockCount > 0 ? `${finishedStockCount} out` : undefined,
    },
    {
      id: 'payroll',
      label: 'Staff & Monthly Payroll',
      icon: Wallet,
      allowed: true,
      badge: staff.length > 0 ? `${staff.length} staff` : undefined,
    },
    {
      id: 'accounting',
      label: 'Accounting & Ledgers',
      icon: Landmark,
      allowed: perms?.accounting ?? true,
      highlight: true,
    },
    {
      id: 'taskeen',
      label: 'Ask Taskeen AI',
      icon: Sparkles,
      allowed: true,
      highlight: true,
      badge: 'Advisor',
    },
    {
      id: 'reports',
      label: '52-Week Reports',
      icon: BarChart3,
      allowed: perms?.reports ?? true,
    },
    {
      id: 'crm',
      label: 'Sales Leads & CRM',
      icon: Flame,
      allowed: perms?.crmLeads ?? true,
      badge: leads.length > 0 ? `${leads.length}` : undefined,
    },
    {
      id: 'users',
      label: 'User Management',
      icon: ShieldCheck,
      allowed: perms?.manageUsers ?? isSuperAdmin,
      highlight: true,
      badge: `${users.length} users`,
    },
    {
      id: 'merchants',
      label: 'Merchants & Branches',
      icon: Store,
      allowed: perms?.manageUsers ?? isSuperAdmin,
      highlight: true,
      badge: `${users.filter((u) => u.role === 'merchant').length} hubs`,
    },
    {
      id: 'database',
      label: 'Database Explorer',
      icon: Database,
      allowed: perms?.databaseExplorer ?? isSuperAdmin,
    },
    {
      id: 'settings',
      label: 'Company & Banking',
      icon: Building2,
      allowed: perms?.companySettings ?? isSuperAdmin,
    },
  ];

  const handleSelect = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Lockup */}
        <div className="h-16 px-5 border-b border-[#2C211B] flex items-center justify-between shrink-0 bg-[#171311]">
          <div className="flex items-center gap-2.5">
            <img
              src={company?.logoUrl || "/src/assets/images/savoure_master_logo_1790775722136.jpg"}
              alt="Savouré Logo"
              className="w-10 h-10 rounded-full object-cover border border-[#C98A5B] shadow-xs"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="font-serif font-bold text-base tracking-wide text-white leading-tight flex items-center gap-1.5">
                <span>Savouré</span>
                <span className="text-[9px] tracking-widest font-sans font-bold uppercase px-1.5 py-0.5 rounded bg-[#C98A5B]/20 text-[#DE9E74] border border-[#C98A5B]/30">ERP</span>
              </div>
              <div className="text-[9px] text-[#A69385] tracking-wider uppercase font-medium leading-tight">
                A Taste of Tradition
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded text-[#A69385] hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 bg-[#171311]">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8A776B]">
            Enterprise Operations
          </div>
          {navItems.map((item) => {
            if (!item.allowed) return null;
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#C98A5B] text-[#171311] font-bold shadow-sm'
                    : 'text-[#C5B7AC] hover:bg-[#221B17] hover:text-white'
                } ${item.highlight && !isActive ? 'border border-[#C98A5B]/30 text-[#DE9E74]' : ''}`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#171311]' : item.highlight ? 'text-[#DE9E74]' : 'text-[#8A776B]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono tabular-nums ${
                      isActive
                        ? 'bg-[#171311]/20 text-[#171311] font-bold'
                        : 'bg-[#221B17] text-[#DE9E74] border border-[#3A2D25]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* System status footer */}
        <div className="p-3 border-t border-[#2C211B] shrink-0 bg-[#171311] space-y-2">
          <div className="p-2.5 rounded-lg bg-[#221B17] border border-[#3A2D25] text-[11px] text-[#A69385]">
            <div className="flex items-center justify-between font-medium text-[#EDE6DE] mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C98A5B]" />
                System Active
              </span>
              <span className="text-[10px] text-[#DE9E74] font-serif">Savouré</span>
            </div>
            <div className="text-[10px] text-[#A69385] leading-relaxed truncate">
              User: <span className="text-[#DE9E74] font-medium">{currentUser?.name || 'Administrator'}</span>
            </div>
          </div>

          {onGoToWebsite && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onGoToWebsite();
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-[#2C211B] hover:bg-[#3A2D25] text-[#DE9E74] hover:text-[#F3D2BF] border border-[#C98A5B]/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Back to Showcase Website</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Do you want to sign out of this device?')) {
                setMobileOpen(false);
                logout();
              }
            }}
            className="w-full py-1.5 px-3 rounded-lg bg-[#221B17] hover:bg-rose-950/40 text-neutral-400 hover:text-rose-300 border border-[#3A2D25] hover:border-rose-800/50 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
