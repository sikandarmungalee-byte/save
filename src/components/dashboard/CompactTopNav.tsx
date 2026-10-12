import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ERPModule, ModuleSubcategory, ERP_MODULES } from './moduleRegistry';
import {
  ArrowLeft,
  ChevronRight,
  LayoutGrid,
  Search,
  Bell,
  User as UserIcon,
  ChevronDown,
  Lock,
  LogOut,
  Smartphone,
  Globe,
  RefreshCw,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';

interface CompactTopNavProps {
  currentModule: ERPModule;
  currentSubcategory: ModuleSubcategory | null;
  onBackToDashboard: () => void;
  onBackToSubcategoriesGrid: () => void;
  onSelectModule: (moduleId: string) => void;
  onSelectSubcategory: (moduleId: string, subcategoryId: string) => void;
  onOpenLoginModal: () => void;
  onGoToWebsite?: () => void;
}

export const CompactTopNav: React.FC<CompactTopNavProps> = ({
  currentModule,
  currentSubcategory,
  onBackToDashboard,
  onBackToSubcategoriesGrid,
  onSelectModule,
  onSelectSubcategory,
  onOpenLoginModal,
  onGoToWebsite,
}) => {
  const erp = useERP();
  const { currentUser, lockApp, logout, refreshData, syncStatus } = erp;

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showModuleSwitcher, setShowModuleSwitcher] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userName = currentUser?.name || 'Master Admin';

  const ModuleIcon = currentModule.icon;

  // Search filtered modules & subcategories
  const searchResults = searchQuery
    ? ERP_MODULES.flatMap((mod) =>
        mod.subcategories
          .filter(
            (sub) =>
              sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              sub.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
              mod.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((sub) => ({ module: mod, subcategory: sub }))
      ).slice(0, 8)
    : [];

  return (
    <nav className="sticky top-0 z-30 bg-[#2B150A]/95 backdrop-blur-md border-b border-[#CC8468]/20 px-3 sm:px-6 py-2.5 shadow-md shrink-0">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Zone: Back-to-Dashboard + Breadcrumbs */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Back to Dashboard Button */}
          <button
            onClick={onBackToDashboard}
            title="Return to Square Tile Home Dashboard"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#391E0F] hover:bg-[#58341D] text-[#E0A282] hover:text-[#F8EFE3] border border-[#CC8468]/30 transition-all text-xs font-semibold shrink-0 group"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#CC8468] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-[#CC8468]/40 shrink-0" />

          {/* Module Selector / Breadcrumb */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowModuleSwitcher(!showModuleSwitcher)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[#391E0F] text-xs font-serif font-bold text-[#F8EFE3] transition-colors truncate max-w-[180px] sm:max-w-[240px]"
            >
              <ModuleIcon className="w-3.5 h-3.5 text-[#E0A282] shrink-0" />
              <span className="truncate">{currentModule.title}</span>
              <ChevronDown className="w-3 h-3 text-[#CC8468] shrink-0" />
            </button>

            {/* Quick Module Switcher Dropdown */}
            {showModuleSwitcher && (
              <div className="absolute left-0 mt-2 w-72 bg-[#2B150A] border border-[#CC8468]/40 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-96 overflow-y-auto">
                <div className="px-3 py-2 text-[11px] font-sans uppercase font-bold text-[#CC8468] border-b border-[#CC8468]/20">
                  Switch Module
                </div>
                <div className="space-y-0.5 mt-1">
                  {ERP_MODULES.map((mod) => {
                    const Icon = mod.icon;
                    const isActive = mod.id === currentModule.id;
                    return (
                      <button
                        key={mod.id}
                        onClick={() => {
                          setShowModuleSwitcher(false);
                          onSelectModule(mod.id);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          isActive
                            ? 'bg-[#58341D] text-[#F8EFE3] font-bold border border-[#CC8468]/40'
                            : 'text-[#F3E7DA] hover:bg-[#391E0F]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className="w-3.5 h-3.5 text-[#E0A282]" />
                          <span className="truncate">{mod.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#CC8468]/60">
                          {String(mod.number).padStart(2, '0')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Subcategory Breadcrumb (if active) */}
          {currentSubcategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#CC8468]/40 shrink-0 hidden sm:inline" />
              <button
                onClick={onBackToSubcategoriesGrid}
                className="hidden sm:flex items-center gap-1 text-xs text-[#E0A282] hover:text-[#F8EFE3] truncate max-w-[200px]"
                title="Click to view all subcategories in this module"
              >
                <span className="truncate">{currentSubcategory.title}</span>
              </button>
            </>
          )}
        </div>

        {/* Right Zone: Search, Notifications, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Search Button / Popover */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#391E0F] hover:bg-[#58341D] text-[#E0A282] border border-[#CC8468]/30 text-xs flex items-center gap-1.5 transition-colors"
              title="Search modules and subcategories"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Search</span>
            </button>

            {searchOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#2B150A] border border-[#CC8468]/40 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#E0A282]/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search anything in ERP..."
                    autoFocus
                    className="w-full bg-[#1A0C05] border border-[#CC8468]/30 rounded-xl pl-9 pr-8 py-1.5 text-xs text-[#F8EFE3] placeholder-[#E0A282]/40 outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#CC8468]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {searchResults.map(({ module: mod, subcategory: sub }) => (
                    <button
                      key={`${mod.id}-${sub.id}`}
                      onClick={() => {
                        onSelectSubcategory(mod.id, sub.id);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-[#391E0F] text-xs flex items-center justify-between text-[#F8EFE3]"
                    >
                      <div>
                        <div className="font-semibold text-[#E0A282]">{sub.title}</div>
                        <div className="text-[10px] text-[#F3E7DA]/60">{mod.title}</div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-[#CC8468]" />
                    </button>
                  ))}
                  {searchQuery && searchResults.length === 0 && (
                    <div className="p-3 text-center text-xs text-[#E0A282]/60">
                      No matching records found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sync Button */}
          <button
            onClick={() => refreshData()}
            className="p-1.5 rounded-xl bg-[#391E0F] hover:bg-[#58341D] text-[#E0A282] border border-[#CC8468]/30 transition-colors hidden sm:flex"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </button>

          {/* Public Website Button */}
          {onGoToWebsite && (
            <button
              onClick={onGoToWebsite}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#391E0F] hover:bg-[#58341D] text-[#E0A282] border border-[#CC8468]/30 text-xs hidden md:flex items-center gap-1.5 transition-colors"
              title="Public Savouré Website"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Website</span>
            </button>
          )}

          {/* Profile Button */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-[#391E0F] hover:bg-[#58341D] border border-[#CC8468]/30 transition-all text-xs"
            >
              <div className="w-6 h-6 rounded-lg bg-[#58341D] text-[#E0A282] flex items-center justify-center font-serif font-bold text-xs uppercase overflow-hidden shrink-0">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  userName.charAt(0)
                )}
              </div>
              <span className="hidden sm:inline font-semibold text-[#F8EFE3] truncate max-w-[90px]">
                {userName}
              </span>
              <ChevronDown className="w-3 h-3 text-[#CC8468]" />
            </button>

            {/* Profile Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-[#2B150A] border border-[#CC8468]/40 rounded-2xl shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-[#CC8468]/20">
                  <div className="text-xs font-serif font-bold text-[#F8EFE3] truncate">{userName}</div>
                  <div className="text-[10px] text-[#E0A282] uppercase">{currentUser?.role || 'Admin'}</div>
                </div>

                <div className="space-y-0.5 mt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onBackToDashboard();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#F3E7DA] hover:bg-[#391E0F] rounded-lg flex items-center gap-2"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-[#E0A282]" />
                    <span>Home Dashboard Tiles</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (window.confirm('Lock ERP screen with PIN? (Default PIN: 1234)')) {
                        lockApp();
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#F3E7DA] hover:bg-[#391E0F] rounded-lg flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#E0A282]" />
                    <span>Lock Screen PIN</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenLoginModal();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#F3E7DA] hover:bg-[#391E0F] rounded-lg flex items-center gap-2"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#E0A282]" />
                    <span>Switch Account</span>
                  </button>

                  <div className="border-t border-[#CC8468]/20 pt-1 mt-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                        onOpenLoginModal();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-300 hover:bg-[#391E0F] rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
