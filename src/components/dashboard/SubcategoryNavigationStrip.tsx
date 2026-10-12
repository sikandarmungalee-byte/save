import React from 'react';
import { ERPModule, ModuleSubcategory } from './moduleRegistry';
import { LayoutGrid, ChevronRight } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface SubcategoryNavigationStripProps {
  module: ERPModule;
  activeSubcategoryId: string | null;
  onSelectSubcategory: (subcategoryId: string) => void;
  onOpenSubcategoriesGrid: () => void;
}

export const SubcategoryNavigationStrip: React.FC<SubcategoryNavigationStripProps> = ({
  module,
  activeSubcategoryId,
  onSelectSubcategory,
  onOpenSubcategoriesGrid,
}) => {
  const erp = useERP();

  return (
    <div className="bg-stone-50/70 border-b border-stone-200 px-3 sm:px-6 py-2 overflow-x-auto no-scrollbar">
      <div className="max-w-[1600px] mx-auto flex items-center gap-1.5 sm:gap-2">
        {/* Back to Module Subcategory Tiles Button */}
        <button
          onClick={onOpenSubcategoriesGrid}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-[#391E0F] border border-stone-200 hover:border-[#CC8468] text-xs font-semibold shrink-0 transition-colors shadow-2xs"
          title={`Browse all square tiles for ${module.title}`}
        >
          <LayoutGrid className="w-3 h-3 text-[#CC8468]" />
          <span>All Subcategory Tiles</span>
        </button>

        <span className="text-[#CC8468]/30 shrink-0">|</span>

        {/* Subcategories Horizontal Selector Strip */}
        <div className="flex items-center gap-1.5 shrink-0">
          {module.subcategories.map((sub) => {
            const isActive = sub.id === activeSubcategoryId;
            const SubIcon = sub.icon;
            const badge = sub.badge ? sub.badge(erp) : undefined;

            return (
              <button
                key={sub.id}
                onClick={() => onSelectSubcategory(sub.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#391E0F] text-white font-bold border border-[#391E0F] shadow-xs'
                    : 'bg-white text-[#391E0F] hover:text-[#2B150A] hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <SubIcon className={`w-3 h-3 ${isActive ? 'text-[#E0A282]' : 'text-[#CC8468]'}`} />
                <span>{sub.title}</span>
                {badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-white/20 text-[#F8EFE3]' : 'bg-stone-100 text-[#391E0F] border border-stone-200'}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
