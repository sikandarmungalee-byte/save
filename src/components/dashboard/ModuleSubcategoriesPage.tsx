import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { ERPModule, ModuleSubcategory } from './moduleRegistry';
import {
  ArrowLeft,
  ChevronRight,
  Search,
  ArrowRight,
  Sparkles,
  Home,
  CheckCircle2
} from 'lucide-react';

interface ModuleSubcategoriesPageProps {
  module: ERPModule;
  onSelectSubcategory: (subcategoryId: string) => void;
  onBackToDashboard: () => void;
}

export const ModuleSubcategoriesPage: React.FC<ModuleSubcategoriesPageProps> = ({
  module,
  onSelectSubcategory,
  onBackToDashboard,
}) => {
  const erp = useERP();
  const [subSearch, setSubSearch] = useState('');

  const filteredSubcategories = useMemo(() => {
    const q = subSearch.toLowerCase().trim();
    if (!q) return module.subcategories;
    return module.subcategories.filter(
      (s) => s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)
    );
  }, [module, subSearch]);

  const IconComponent = module.icon;
  const moduleBadge = module.badge ? module.badge(erp) : undefined;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 bg-white">
      {/* ============================================================ */}
      {/* 1. TOP BREADCRUMB & BACK-TO-DASHBOARD BAR                    */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {/* Back to Dashboard Button */}
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-[#391E0F] hover:text-[#2B150A] border border-stone-200 hover:border-[#CC8468] shadow-xs transition-all font-semibold group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#CC8468] group-hover:-translate-x-0.5 transition-transform" />
            <span>Dashboard</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-[#CC8468]/50" />

          {/* Breadcrumb Module Title */}
          <span className="font-serif font-bold text-[#2B150A] truncate">
            {module.title}
          </span>
        </div>

        {/* Subcategory Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#CC8468]" />
          <input
            type="text"
            value={subSearch}
            onChange={(e) => setSubSearch(e.target.value)}
            placeholder={`Filter ${module.title}...`}
            className="w-full bg-white border border-stone-200 focus:border-[#CC8468] focus:ring-1 focus:ring-[#CC8468] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#2B150A] placeholder-stone-400 outline-none shadow-xs transition-all"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DEDICATED MODULE HERO BANNER (CLEAN WHITE & LUXURY)       */}
      {/* ============================================================ */}
      <div className="rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative copper glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CC8468]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Module Icon Emblem */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#391E0F] border-2 border-[#CC8468]/60 flex items-center justify-center text-[#E0A282] shadow-md shrink-0">
              <IconComponent className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#391E0F] bg-stone-100 px-2 py-0.5 rounded border border-[#CC8468]/30">
                  Module {String(module.number).padStart(2, '0')}
                </span>
                {moduleBadge && (
                  <span className="text-[10px] font-sans font-semibold text-[#391E0F] bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    {moduleBadge}
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2B150A] tracking-tight">
                {module.title}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
                {module.description}
              </p>
            </div>
          </div>

          {/* Quick Action: Open Primary Subcategory */}
          {module.subcategories.length > 0 && (
            <div className="shrink-0">
              <button
                onClick={() => onSelectSubcategory(module.subcategories[0].id)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all"
              >
                <span>Open {module.subcategories[0].title}</span>
                <ArrowRight className="w-4 h-4 text-[#E0A282]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. SUBCATEGORIES SQUARE TILES GRID (WHITE CARDS)             */}
      {/* ============================================================ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-wider text-[#CC8468] font-bold">
            Choose a Subcategory Tile ({filteredSubcategories.length})
          </div>
          <span className="text-xs text-stone-500 hidden sm:inline">
            Each tile opens its dedicated feature and data records
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
          {filteredSubcategories.map((sub) => {
            const SubIcon = sub.icon;
            const subBadge = sub.badge ? sub.badge(erp) : undefined;

            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubcategory(sub.id)}
                className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 hover:border-[#CC8468] shadow-xs hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer text-left aspect-square overflow-hidden select-none"
              >
                {/* Subtle top indicator */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CC8468] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Subcategory Top: Icon & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-stone-50 border border-stone-200 group-hover:border-[#CC8468] group-hover:bg-[#391E0F] flex items-center justify-center text-[#391E0F] group-hover:text-white group-hover:scale-110 transition-all shadow-2xs shrink-0">
                    <SubIcon className="w-5 h-5" />
                  </div>

                  {subBadge && (
                    <span className="text-[9px] sm:text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[#391E0F] whitespace-nowrap shadow-2xs">
                      {subBadge}
                    </span>
                  )}
                </div>

                {/* Subcategory Bottom: Title & Subtitle */}
                <div className="mt-auto pt-2">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-[#2B150A] group-hover:text-[#391E0F] leading-tight tracking-tight line-clamp-2 transition-colors">
                    {sub.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 group-hover:text-[#391E0F] leading-tight mt-1 line-clamp-2 transition-colors">
                    {sub.subtitle}
                  </p>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-100 text-[10px] text-stone-400 group-hover:text-[#CC8468]">
                    <span className="font-medium">Launch View</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state when filtering */}
        {filteredSubcategories.length === 0 && (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-[#E8DDD5] shadow-xs">
            <p className="text-xs text-[#7A685D]">
              No subcategory matches "{subSearch}" in this module.
            </p>
            <button
              onClick={() => setSubSearch('')}
              className="mt-2 text-xs text-[#CC8468] hover:text-[#58341D] underline font-semibold"
            >
              Show all subcategories
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
