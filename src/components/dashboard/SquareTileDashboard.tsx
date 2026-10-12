import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { ERP_MODULES, ERPModule, ModuleSubcategory } from './moduleRegistry';
import {
  Search,
  Bell,
  User as UserIcon,
  ChevronDown,
  Lock,
  LogOut,
  Smartphone,
  Globe,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';

interface SquareTileDashboardProps {
  onSelectModule: (moduleId: string) => void;
  onSelectSubcategory: (moduleId: string, subcategoryId: string) => void;
  onOpenLoginModal: () => void;
  onGoToWebsite?: () => void;
}

export const SquareTileDashboard: React.FC<SquareTileDashboardProps> = ({
  onSelectModule,
  onSelectSubcategory,
  onOpenLoginModal,
  onGoToWebsite,
}) => {
  const erp = useERP();
  const { currentUser, company, lockApp, logout, refreshData, syncStatus, lastSynced } = erp;

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Formatted current date
  const currentDateFormatted = useMemo(() => {
    try {
      const now = new Date();
      return new Intl.DateTimeFormat('en-ZA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);
    } catch {
      return 'Monday, 12 October 2026';
    }
  }, []);

  // Compute live actionable notifications
  const notificationsList = useMemo(() => {
    const list: { id: string; title: string; desc: string; type: 'alert' | 'info' | 'warning'; moduleId: string; subId?: string }[] = [];

    const overdueCount = erp.invoices.filter((i) => i.status === 'Overdue').length;
    if (overdueCount > 0) {
      list.push({
        id: 'overdue-inv',
        title: `${overdueCount} Overdue Tax Invoices`,
        desc: 'Review accounts receivable and initiate debtor recovery.',
        type: 'alert',
        moduleId: 'invoices',
        subId: 'overdue-invoices'
      });
    }

    const unpaidCount = erp.invoices.filter((i) => i.balanceDue > 0 && i.status !== 'Overdue').length;
    if (unpaidCount > 0) {
      list.push({
        id: 'unpaid-inv',
        title: `${unpaidCount} Invoices Due for Settlement`,
        desc: 'Outstanding client balances ready for payment capture.',
        type: 'warning',
        moduleId: 'invoices',
        subId: 'unpaid-invoices'
      });
    }

    const inTransit = erp.deliveryNotes.filter((d) => d.status === 'In Transit').length;
    if (inTransit > 0) {
      list.push({
        id: 'in-transit',
        title: `${inTransit} Active Deliveries in Transit`,
        desc: 'Fleet dispatches out for store delivery and POD signatures.',
        type: 'info',
        moduleId: 'delivery-notes',
        subId: 'in-transit-deliveries'
      });
    }

    const finishedStock = (erp.stockItemStatuses || []).filter((s) => s.isFinished || s.quantityOnHand <= 0).length;
    if (finishedStock > 0) {
      list.push({
        id: 'stock-out',
        title: `${finishedStock} Bakery Items Out of Stock`,
        desc: 'Depleted pastry products requiring fresh oven production.',
        type: 'alert',
        moduleId: 'stock',
        subId: 'finished-out-of-stock'
      });
    }

    const pendingQuotes = erp.quotations.filter((q) => q.status === 'Sent').length;
    if (pendingQuotes > 0) {
      list.push({
        id: 'quotes-pending',
        title: `${pendingQuotes} Commercial Quotations Pending`,
        desc: 'Awaiting retailer sign-off for tax invoice conversion.',
        type: 'info',
        moduleId: 'quotations',
        subId: 'pending-quotes'
      });
    }

    return list;
  }, [erp]);

  // Filter modules and subcategories
  const filteredModules = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return ERP_MODULES;

    return ERP_MODULES.filter((m) => {
      const matchModule =
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q);
      const matchSub = m.subcategories.some(
        (s) => s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)
      );
      return matchModule || matchSub;
    });
  }, [searchQuery]);

  // Matching subcategories for quick jump when search is active
  const matchingSubcategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const matches: { module: ERPModule; subcategory: ModuleSubcategory }[] = [];
    ERP_MODULES.forEach((mod) => {
      mod.subcategories.forEach((sub) => {
        if (
          sub.title.toLowerCase().includes(q) ||
          sub.subtitle.toLowerCase().includes(q) ||
          mod.title.toLowerCase().includes(q)
        ) {
          matches.push({ module: mod, subcategory: sub });
        }
      });
    });
    return matches.slice(0, 12);
  }, [searchQuery]);

  const userName = currentUser?.name || 'Master Admin';

  return (
    <div className="min-h-screen bg-[#1E0F07] text-[#F3E7DA] flex flex-col font-sans selection:bg-[#CC8468] selection:text-white">
      {/* ============================================================ */}
      {/* 1. LUXURY WELCOME HEADER                                     */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-30 bg-[#2B150A]/95 backdrop-blur-md border-b border-[#CC8468]/20 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xl transition-all">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Branding & Welcome Greeting */}
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
            {/* Savouré Crest / Emblem */}
            <div className="relative">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#58341D] to-[#391E0F] border border-[#CC8468]/50 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                <span className="font-serif font-black text-xl sm:text-2xl text-[#E0A282] tracking-wider">
                  S
                </span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#CC8468] border-2 border-[#2B150A]" />
            </div>

            {/* Welcome Typography */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#F8EFE3]">
                  Savouré
                </span>
                <span className="text-[10px] tracking-wider uppercase font-sans font-semibold text-[#E0A282] bg-[#58341D]/70 px-2 py-0.5 rounded border border-[#CC8468]/30">
                  Enterprise Operations
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#E0A282]/90">
                <span className="font-medium">Welcome back, {userName}</span>
                <span className="text-[#CC8468]/40">·</span>
                <span className="text-[#F3E7DA]/70 hidden sm:inline tabular-nums">
                  {currentDateFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-xl mx-auto w-full md:mx-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E0A282]/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all 18 modules and subcategories (e.g. Invoices, Tortillas, Payroll)..."
                className="w-full bg-[#1A0C05]/80 border border-[#CC8468]/30 focus:border-[#E0A282] focus:ring-1 focus:ring-[#E0A282] rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-[#F8EFE3] placeholder-[#E0A282]/40 outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E0A282]/60 hover:text-[#F8EFE3]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions, Notifications & User Profile */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
            {/* Real-time Sync Status */}
            <button
              onClick={() => refreshData()}
              title="Click to refresh cloud state"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#391E0F]/80 border border-[#CC8468]/30 text-xs text-[#E0A282] hover:bg-[#58341D] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span className="tabular-nums text-[11px] text-[#F3E7DA]/80">
                {syncStatus === 'synced' ? 'Live Cloud' : 'Syncing'}
              </span>
            </button>

            {/* Public Website Button */}
            {onGoToWebsite && (
              <button
                onClick={onGoToWebsite}
                title="View Public Savouré Website"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#391E0F] hover:bg-[#58341D] border border-[#CC8468]/40 text-[#E0A282] text-xs font-medium transition-all"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website</span>
              </button>
            )}

            {/* Notifications Icon Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className={`relative p-2 rounded-xl border transition-all ${
                  showNotifications
                    ? 'bg-[#58341D] border-[#E0A282] text-white'
                    : 'bg-[#391E0F] border-[#CC8468]/30 text-[#E0A282] hover:bg-[#58341D]'
                }`}
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                {notificationsList.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#CC8468] text-[#1E0F07] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#2B150A] tabular-nums">
                    {notificationsList.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#2B150A] border border-[#CC8468]/40 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#CC8468]/20 px-2">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#E0A282]" />
                      <span className="font-serif font-bold text-sm text-[#F8EFE3]">
                        Operational Alerts
                      </span>
                    </div>
                    <span className="text-[11px] font-sans text-[#E0A282] bg-[#58341D] px-2 py-0.5 rounded border border-[#CC8468]/30">
                      {notificationsList.length} Active
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {notificationsList.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#E0A282]/70">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#E0A282]" />
                        All operations, invoices, deliveries, and stock are nominal.
                      </div>
                    ) : (
                      notificationsList.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            setShowNotifications(false);
                            if (notif.subId) {
                              onSelectSubcategory(notif.moduleId, notif.subId);
                            } else {
                              onSelectModule(notif.moduleId);
                            }
                          }}
                          className="p-2.5 rounded-xl bg-[#391E0F] hover:bg-[#58341D] border border-[#CC8468]/25 cursor-pointer transition-all flex items-start gap-2.5 group"
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              notif.type === 'alert'
                                ? 'bg-rose-400'
                                : notif.type === 'warning'
                                ? 'bg-[#E0A282]'
                                : 'bg-[#CC8468]'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[#F8EFE3] group-hover:text-[#E0A282] flex items-center justify-between">
                              <span className="truncate">{notif.title}</span>
                              <ArrowRight className="w-3 h-3 text-[#CC8468] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                            </div>
                            <div className="text-[11px] text-[#F3E7DA]/70 leading-tight mt-0.5">
                              {notif.desc}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className={`flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all ${
                  showProfileMenu
                    ? 'bg-[#58341D] border-[#E0A282]'
                    : 'bg-[#391E0F] border-[#CC8468]/30 hover:bg-[#58341D]'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-[#58341D] border border-[#CC8468]/40 flex items-center justify-center font-serif font-bold text-xs text-[#E0A282] uppercase overflow-hidden shrink-0">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userName.charAt(0)
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-[#F8EFE3] leading-tight truncate max-w-[110px]">
                    {userName}
                  </div>
                  <div className="text-[10px] text-[#E0A282] leading-none uppercase tracking-wider">
                    {currentUser?.role === 'super_admin' ? 'Super Admin' : currentUser?.role || 'Admin'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#E0A282]/80 ml-0.5" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#2B150A] border border-[#CC8468]/40 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-[#CC8468]/20">
                    <div className="text-xs font-serif font-bold text-[#F8EFE3] truncate">{userName}</div>
                    <div className="text-[11px] text-[#E0A282]/70 truncate">{currentUser?.email || 'admin@savoure.co.za'}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#58341D] text-[#E0A282] font-semibold border border-[#CC8468]/30">
                        Enterprise Master
                      </span>
                    </div>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onSelectModule('settings');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[#F3E7DA] hover:bg-[#391E0F] rounded-lg flex items-center gap-2.5 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#E0A282]" />
                      <span>Company Profile & Banking</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (window.confirm('Lock ERP screen with PIN? (Default PIN: 1234)')) {
                          lockApp();
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[#F3E7DA] hover:bg-[#391E0F] rounded-lg flex items-center gap-2.5 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#E0A282]" />
                      <span>Lock Screen (Security PIN)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenLoginModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[#F3E7DA] hover:bg-[#391E0F] rounded-lg flex items-center gap-2.5 transition-colors"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#E0A282]" />
                      <span>Switch Account / Sign In</span>
                    </button>

                    <div className="pt-1 border-t border-[#CC8468]/20 mt-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                          onOpenLoginModal();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-[#391E0F] rounded-lg flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        <span>Sign Out of Device</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. SUB-RESULTS DRAWER (WHEN SEARCHING SPECIFIC SUBCATEGORIES) */}
      {/* ============================================================ */}
      {searchQuery && matchingSubcategories.length > 0 && (
        <div className="bg-[#2B150A] border-b border-[#CC8468]/30 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-[#E0A282] font-semibold">
                Direct Subcategory Matches ({matchingSubcategories.length})
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#CC8468] hover:text-[#F8EFE3]"
              >
                Clear Search
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {matchingSubcategories.map(({ module: mod, subcategory: sub }) => {
                const SubIcon = sub.icon;
                return (
                  <button
                    key={`${mod.id}-${sub.id}`}
                    onClick={() => {
                      onSelectSubcategory(mod.id, sub.id);
                      setSearchQuery('');
                    }}
                    className="p-3 rounded-xl bg-[#391E0F] hover:bg-[#58341D] border border-[#CC8468]/30 hover:border-[#E0A282] text-left transition-all group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-[#58341D] text-[#E0A282] group-hover:text-white flex items-center justify-center">
                        <SubIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] text-[#CC8468] font-medium truncate max-w-[80px]">
                        {mod.shortTitle}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#F8EFE3] group-hover:text-[#E0A282] leading-tight">
                        {sub.title}
                      </div>
                      <div className="text-[10px] text-[#F3E7DA]/60 truncate mt-0.5">
                        {sub.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MAIN DASHBOARD: 18 SQUARE MODULE CARDS GRID               */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Section Headline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 sm:mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#CC8468] font-bold font-sans">
              Core Enterprise Directory
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8EFE3] tracking-tight mt-0.5">
              Operations & Modules
            </h2>
          </div>
          <div className="text-xs text-[#E0A282]/80 flex items-center gap-2">
            <span>Tap any module to browse its subcategories</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#CC8468]" />
            <span className="tabular-nums font-mono text-[#F8EFE3]">{filteredModules.length} Modules Available</span>
          </div>
        </div>

        {/* 18 Square Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
          {filteredModules.map((module) => {
            const IconComponent = module.icon;
            const badgeText = module.badge ? module.badge(erp) : undefined;

            return (
              <div
                key={module.id}
                onClick={() => onSelectModule(module.id)}
                className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#58341D] via-[#391E0F] to-[#25130A] border border-[#CC8468]/30 hover:border-[#E0A282] shadow-lg hover:shadow-[0_16px_36px_rgba(204,132,104,0.22)] hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer text-left aspect-square overflow-hidden select-none"
              >
                {/* Top Subtle Sheen Gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E0A282]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Card Top: Icon + Number + Optional Badge */}
                <div className="flex items-start justify-between gap-2">
                  {/* Elegant Icon Badge */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#58341D]/90 border border-[#CC8468]/40 group-hover:border-[#E0A282] group-hover:bg-[#CC8468]/20 flex items-center justify-center text-[#E0A282] group-hover:text-[#F8EFE3] group-hover:scale-110 transition-all shadow-inner shrink-0">
                    <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  {/* Top Right: Number & Badge */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-[#CC8468]/50 group-hover:text-[#E0A282]/80 transition-colors">
                      {String(module.number).padStart(2, '0')}
                    </span>
                    {badgeText && (
                      <span className="text-[9px] sm:text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded-md bg-[#CC8468]/20 border border-[#CC8468]/40 text-[#E0A282] whitespace-nowrap">
                        {badgeText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Title & Subtitle */}
                <div className="mt-auto pt-2">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-[#F8EFE3] group-hover:text-white leading-tight tracking-tight line-clamp-2 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#F3E7DA]/70 group-hover:text-[#F3E7DA]/90 leading-tight mt-1 line-clamp-2 transition-colors">
                    {module.subtitle}
                  </p>

                  {/* Interactive Subcategory Count Hint */}
                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#CC8468]/15 text-[10px] text-[#E0A282]/70 group-hover:text-[#E0A282]">
                    <span className="font-medium">
                      {module.subcategories.length} Subcategories
                    </span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search State */}
        {filteredModules.length === 0 && (
          <div className="text-center py-16 px-4 bg-[#2B150A]/40 rounded-3xl border border-[#CC8468]/20 mt-4">
            <Search className="w-12 h-12 mx-auto text-[#CC8468]/40 mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#F8EFE3]">
              No ERP modules matching "{searchQuery}"
            </h3>
            <p className="text-xs text-[#E0A282]/70 mt-1 max-w-md mx-auto">
              Try searching by product name, invoice status, payroll terms, or reset your search.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 rounded-xl bg-[#58341D] hover:bg-[#CC8468] text-[#F8EFE3] hover:text-[#1E0F07] text-xs font-semibold border border-[#CC8468]/40 transition-colors"
            >
              Reset Search & Show All Modules
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
