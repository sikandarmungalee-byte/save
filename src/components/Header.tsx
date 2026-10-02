import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import {
  Lock,
  RefreshCw,
  User as UserIcon,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onOpenLoginModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenLoginModal }) => {
  const {
    currentUser,
    logout,
    company,
    syncStatus,
    lastSynced,
    refreshData,
    lockApp,
    users
  } = useERP();

  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const getBreadcrumbTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Financial Overview & KPIs';
      case 'invoices': return 'Tax Invoices & Credit Control';
      case 'delivery-notes': return 'Delivery Notes & Proof of Delivery (POD)';
      case 'quotations': return 'Quotations & Cost Estimations';
      case 'payments': return 'Accounts Receivable Ledger';
      case 'customers': return 'Customer & Multi-Branch Directory';
      case 'catalog': return 'Bakery & Merchandise Catalog';
      case 'reports': return 'Consolidated Reports & 52-Week Analytics';
      case 'crm': return 'Sales Pipeline & CRM Hub';
      case 'users': return 'User Management & Permissions (Super Admin)';
      case 'database': return 'Database Explorer & Data Portability';
      case 'settings': return 'Company Profile & Banking Configuration';
      default: return 'Enterprise Resource Planning';
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'accountant': return 'Financial Controller';
      case 'sales': return 'Sales Executive';
      case 'logistics': return 'Logistics & Dispatch';
      case 'auditor': return 'Auditor (Read-Only)';
      default: return 'User';
    }
  };

  return (
    <header className="h-16 bg-neutral-900 border-b border-neutral-800 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Zone 1: Brand & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5">
          <img
            src={company.logoUrl || "/src/assets/images/savoure_master_logo_1790775722136.jpg"}
            alt="Savouré Logo"
            className="w-10 h-10 rounded-full object-cover border border-[#C98A5B] shadow-xs"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <div className="font-serif text-lg tracking-wide text-white leading-none font-semibold flex items-center gap-1.5">
              <span>Savouré</span>
              <span className="text-[9px] tracking-widest font-sans font-bold uppercase px-1.5 py-0.5 rounded bg-[#C98A5B]/20 text-[#DE9E74] border border-[#C98A5B]/30">ERP</span>
            </div>
            <div className="text-[9px] text-[#A69385] tracking-wider uppercase font-medium leading-tight">
              A Taste of Tradition
            </div>
          </div>
        </div>
        <span className="text-neutral-700 hidden sm:inline" aria-hidden="true">/</span>
        <div className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm text-neutral-300 font-medium truncate">
          <span>{getBreadcrumbTitle(currentTab)}</span>
        </div>
      </div>

      {/* Zone 2 & 3: System Status & User Actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Real-time System status */}
        <div
          onClick={() => refreshData()}
          title="Click to refresh system data"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#171311] border border-[#2C211B] text-xs text-[#C5B7AC] cursor-pointer hover:bg-[#221B17] transition-colors"
        >
          {syncStatus === 'synced' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#C98A5B]" />
              <span className="hidden md:inline text-[#A69385]">System Active</span>
              <span className="text-[#8A776B] tabular-nums hidden lg:inline">({lastSynced || 'Live'})</span>
            </>
          ) : syncStatus === 'syncing' ? (
            <>
              <RefreshCw className="w-3 h-3 text-[#DE9E74] animate-spin" />
              <span className="text-[#DE9E74] hidden sm:inline">Updating...</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 text-[#DE9E74]" />
              <span className="text-[#DE9E74] hidden sm:inline">Offline Mode</span>
            </>
          )}
        </div>

        {/* Security PIN Lock button */}
        <button
          onClick={lockApp}
          title="Lock Screen (Requires Security PIN)"
          className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#171311] hover:bg-[#221B17] border border-[#2C211B] text-[#C5B7AC] text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Lock className="w-3.5 h-3.5 text-[#DE9E74]" />
          <span className="hidden md:inline">Lock PIN</span>
        </button>

        {/* Current User & Device Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-lg bg-[#171311] hover:bg-[#221B17] border border-[#2C211B] text-xs text-left transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#2C211B] text-[#DE9E74] border border-[#C98A5B]/40 flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : currentUser ? (
                currentUser.name.charAt(0)
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold text-white truncate max-w-[120px]">
                {currentUser?.name || 'Sign In'}
              </div>
              <div className="text-[10px] text-[#DE9E74] leading-none">
                {getRoleBadge(currentUser?.role)}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8A776B] ml-0.5" />
          </button>

          {/* User Menu Dropdown */}
          {showUserDropdown && (
            <div
              className="absolute right-0 mt-2 w-64 bg-[#171311] border border-[#2C211B] rounded-xl shadow-2xl py-2 z-50"
              onMouseLeave={() => setShowUserDropdown(false)}
            >
              <div className="px-3.5 py-2.5 border-b border-[#2C211B]">
                <div className="text-xs font-serif font-bold text-white truncate">{currentUser?.name}</div>
                <div className="text-[11px] text-[#A69385] truncate">{currentUser?.email}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C98A5B]/20 text-[#DE9E74] font-medium border border-[#C98A5B]/30">
                    {getRoleBadge(currentUser?.role)}
                  </span>
                  <span className="text-[10px] text-[#8A776B]">· Active Device</span>
                </div>
              </div>

              <div className="border-t border-[#2C211B] pt-1 mt-1">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onOpenLoginModal();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-[#C5B7AC] hover:bg-[#221B17] flex items-center gap-2"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#A69385]" />
                  <span>Switch Account / Sign In</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                    onOpenLoginModal();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:bg-[#221B17] flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of this Device</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
