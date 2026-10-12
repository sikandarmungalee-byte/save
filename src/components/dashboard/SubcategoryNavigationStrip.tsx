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
    <div className="bg-[#2B150A]/80 border-b border-[#CC8468]/20 px-3 sm:px-6 py-2 overflow-x-auto no-scrollbar">
      <div className="max-w-[1600px] mx-auto flex items-center gap-1.5 sm:gap-2">
        {/* Back to Module Subcategory Tiles Button */}
        <button
          onClick={onOpenSubcategoriesGrid}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#391E0F] hover:bg-[#58341D] text-[#E0A282] border border-[#CC8468]/30 hover:border-[#E0A282] text-xs font-semibold shrink-0 transition-colors"
          title={`Browse all square tiles for ${module.title}`}
        >
          <LayoutGrid className="w-3 h-3 text-[#CC8468]" />
          <span>All Subcategory Tiles</span>
        </button>

        <span className="text-[#CC8468]/40 shrink-0">|</span>

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
                    ? 'bg-[#58341D] text-[#F8EFE3] font-bold border border-[#E0A282] shadow-xs'
                    : 'text-[#F3E7DA]/75 hover:text-[#F8EFE3] hover:bg-[#391E0F] border border-transparent'
                }`}
              >
                <SubIcon className={`w-3 h-3 ${isActive ? 'text-[#E0A282]' : 'text-[#CC8468]/70'}`} />
                <span>{sub.title}</span>
                {badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#CC8468]/25 text-[#E0A282] font-mono">
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
