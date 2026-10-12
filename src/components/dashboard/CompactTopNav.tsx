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
    <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-3 sm:px-6 py-2.5 shadow-xs shrink-0">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Zone: Back-to-Dashboard + Breadcrumbs */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Back to Dashboard Button */}
          <button
            onClick={onBackToDashboard}
            title="Return to Square Tile Home Dashboard"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-[#391E0F] hover:text-[#2B150A] border border-stone-200 hover:border-[#CC8468] transition-all text-xs font-semibold shrink-0 group shadow-2xs"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#CC8468] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-[#CC8468]/40 shrink-0" />

          {/* Module Selector / Breadcrumb */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowModuleSwitcher(!showModuleSwitcher)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-stone-50 text-xs font-serif font-bold text-[#2B150A] transition-colors truncate max-w-[180px] sm:max-w-[240px]"
            >
              <ModuleIcon className="w-3.5 h-3.5 text-[#CC8468] shrink-0" />
              <span className="truncate">{currentModule.title}</span>
              <ChevronDown className="w-3 h-3 text-[#CC8468] shrink-0" />
            </button>

            {/* Quick Module Switcher Dropdown */}
            {showModuleSwitcher && (
              <div className="absolute left-0 mt-2 w-72 bg-white border border-stone-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-96 overflow-y-auto">
                <div className="px-3 py-2 text-[11px] font-sans uppercase font-bold text-[#391E0F] border-b border-stone-100">
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
                            ? 'bg-stone-100 text-[#391E0F] font-bold border border-stone-200'
                            : 'text-[#2B150A] hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className="w-3.5 h-3.5 text-[#CC8468]" />
                          <span className="truncate">{mod.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-stone-400">
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
                className="hidden sm:flex items-center gap-1 text-xs text-[#CC8468] hover:text-[#391E0F] font-semibold truncate max-w-[200px]"
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
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white hover:bg-stone-50 text-[#391E0F] border border-stone-200 text-xs flex items-center gap-1.5 transition-colors shadow-2xs font-medium"
              title="Search modules and subcategories"
            >
              <Search className="w-3.5 h-3.5 text-[#CC8468]" />
              <span className="hidden md:inline text-[11px]">Search</span>
            </button>

            {searchOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-stone-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#CC8468]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search anything in ERP..."
                    autoFocus
                    className="w-full bg-stone-50 border border-stone-200 focus:bg-white focus:border-[#CC8468] rounded-xl pl-9 pr-8 py-1.5 text-xs text-[#2B150A] placeholder-stone-400 outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#2B150A]"
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
                      className="w-full text-left p-2 rounded-xl hover:bg-stone-50 text-xs flex items-center justify-between text-[#2B150A]"
                    >
                      <div>
                        <div className="font-semibold text-[#391E0F]">{sub.title}</div>
                        <div className="text-[10px] text-stone-500">{mod.title}</div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-[#CC8468]" />
                    </button>
                  ))}
                  {searchQuery && searchResults.length === 0 && (
                    <div className="p-3 text-center text-xs text-stone-500">
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
            className="p-1.5 rounded-xl bg-white hover:bg-stone-50 text-[#391E0F] border border-stone-200 transition-colors hidden sm:flex shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#CC8468] ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </button>

          {/* Public Website Button */}
          {onGoToWebsite && (
            <button
              onClick={onGoToWebsite}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white hover:bg-stone-50 text-[#391E0F] border border-stone-200 text-xs hidden md:flex items-center gap-1.5 transition-colors font-medium shadow-2xs"
              title="Public Savouré Website"
            >
              <Globe className="w-3.5 h-3.5 text-[#CC8468]" />
              <span>Website</span>
            </button>
          )}

          {/* Profile Button */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 transition-all text-xs shadow-2xs"
            >
              <div className="w-6 h-6 rounded-lg bg-[#391E0F] text-[#E0A282] flex items-center justify-center font-serif font-bold text-xs uppercase overflow-hidden shrink-0">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  userName.charAt(0)
                )}
              </div>
              <span className="hidden sm:inline font-semibold text-[#2B150A] truncate max-w-[90px]">
                {userName}
              </span>
              <ChevronDown className="w-3 h-3 text-[#CC8468]" />
            </button>

            {/* Profile Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-stone-200 rounded-2xl shadow-xl p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-stone-100">
                  <div className="text-xs font-serif font-bold text-[#2B150A] truncate">{userName}</div>
                  <div className="text-[10px] text-stone-500 uppercase">{currentUser?.role || 'Admin'}</div>
                </div>

                <div className="space-y-0.5 mt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onBackToDashboard();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#2B150A] hover:bg-stone-50 rounded-lg flex items-center gap-2 font-medium"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-[#CC8468]" />
                    <span>Home Dashboard Tiles</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (window.confirm('Lock ERP screen with PIN? (Default PIN: 1234)')) {
                        lockApp();
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#2B150A] hover:bg-stone-50 rounded-lg flex items-center gap-2 font-medium"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#CC8468]" />
                    <span>Lock Screen PIN</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenLoginModal();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#2B150A] hover:bg-stone-50 rounded-lg flex items-center gap-2 font-medium"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#CC8468]" />
                    <span>Switch Account</span>
                  </button>

                  <div className="border-t border-stone-100 pt-1 mt-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                        onOpenLoginModal();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
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
