import React, { useMemo } from 'react';
import { ArrowRight, Package } from 'lucide-react';
import { buildLiveWebsiteProducts } from '../showcaseData';
import { useERP } from '../../../context/ERPContext';

interface ProductsPageProps {
  onNavigate: (page: string) => void;
  onOpenEnquiryModal: (productId?: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onNavigate, onOpenEnquiryModal }) => {
  const { products, showcaseProducts } = useERP();
  const productList = useMemo(
    () => buildLiveWebsiteProducts(products, showcaseProducts),
    [products, showcaseProducts]
  );
  // Tone-specific soft ambient backdrops to blend products seamlessly into the site
  const toneBackdrops: Record<string, string> = {
    roti: 'from-[#fcf6f0] via-[#faebd9] to-[#ebd0ba]',
    wrap: 'from-[#fcf8f0] via-[#faeed4] to-[#ebd7b4]',
    samosa: 'from-[#fcf5ef] via-[#fae6d3] to-[#eacdb4]',
    springroll: 'from-[#fcf6f0] via-[#fae8d8] to-[#ebceb9]',
  };

  return (
    <div className="bg-[#f5eee5] text-[#3d2117] px-6 sm:px-12 lg:px-20 py-20 lg:py-28 min-h-[700px]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Page Heading */}
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-[0.28em] text-[#8d5037]">
            <span className="w-6 h-px bg-[#bd7657] inline-block" />
            <span>The Savouré collection</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-normal text-[#3d2117] leading-tight">
            Good things,<br />
            made <em className="italic text-[#a95d3f]">simply.</em>
          </h1>

          <p className="text-sm sm:text-base text-[#66483b] leading-relaxed">
            Traditional staples for modern tables. Formulated fresh each morning for high-output catering kitchens, delis, and fine retail grocers.
          </p>

          <div className="pt-2">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#ead8c6] text-[#75412e] text-xs font-medium border border-[#bd896e]/30">
              Direct factory enquiry · Nationwide cold-chain delivery
            </span>
          </div>
        </div>

        {/* Products Grid or Clean Empty State */}
        {productList.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[#bd896e]/30 p-10 sm:p-16 text-center max-w-3xl mx-auto space-y-5 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#ead8c6] text-[#8d5037] border border-[#bd896e]/40 flex items-center justify-center mx-auto">
              <Package className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.22em] text-[#8d5037] block">
                0 products live
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#3d2117]">
                No products published yet.
              </h2>
              <p className="text-sm text-[#66483b] max-w-lg mx-auto leading-relaxed">
                This showcase stays synchronized with your live Savouré ERP Bakery Catalogue. Add a product in Admin ERP to display it here immediately.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => onOpenEnquiryModal()}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#b86643] hover:bg-[#a55635] text-[#fff8f0] text-[10px] font-bold uppercase tracking-[0.16em] transition-all cursor-pointer shadow-sm"
              >
                <span>Send general enquiry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#75412e] hover:text-[#3d2117] border-b border-[#c79176] py-1 transition-colors cursor-pointer"
              >
                <span>Contact wholesale desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 lg:gap-10">
            {productList.map((product, idx) => (
              <article
                key={product.id}
                className="bg-white rounded-3xl border border-[#bd896e]/30 overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-all"
              >
                {/* Product Art Canvas with Grounded Pedestal & Ambient Lighting */}
                <div className={`h-80 sm:h-96 bg-gradient-to-b ${toneBackdrops[product.tone] || 'from-[#fcf6f0] via-[#faebd9] to-[#ebd0ba]'} relative flex flex-col items-center justify-center overflow-hidden border-b border-[#bd896e]/30 transition-all duration-500`}>
                  {/* Concentric hairline circle and soft ambient glow */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[130%] h-[130%] rounded-full border border-[#bd896e]/25 transform -rotate-15" />
                    <div className="w-72 h-72 rounded-full bg-white/40 blur-xl pointer-events-none" />
                  </div>

                  {/* Stamp */}
                  <div className="absolute top-5 right-5 w-14 h-14 rounded-full border border-[#ae7057] text-[#9d5a40] text-[10px] flex flex-col items-center justify-center font-serif rotate-12 bg-[#f5eee5]/70 backdrop-blur-xs z-10">
                    <span className="font-bold leading-none">100%</span>
                    <span className="text-[7px] uppercase tracking-wider mt-0.5">Halal</span>
                  </div>

                  {/* Packaging Artwork */}
                  <div className="relative z-1 w-60 h-60 sm:w-72 sm:h-72 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain drop-shadow-xl"
                    />
                  </div>

                  {/* Grounding physical shadow below pack */}
                  <div className="relative z-1 w-48 sm:w-56 h-4 rounded-full bg-[#522919]/20 blur-md -mt-4 pointer-events-none group-hover:scale-95 transition-transform duration-500" />

                  <div className="absolute bottom-4 left-6 font-mono text-xs uppercase tracking-widest text-[#75412e] z-10">
                    {String(idx + 1).padStart(2, '0')} · {product.mark}
                  </div>
                </div>

                {/* Product Tile Info */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <span className="text-xs uppercase tracking-widest text-[#a95d3f] font-semibold block">
                      {product.detail}
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#3d2117] group-hover:text-[#a95d3f] transition-colors">
                      {product.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#66483b] leading-relaxed">
                      {product.description}
                    </p>

                    {/* Highlights */}
                    <div className="pt-2 space-y-1">
                      {product.highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-[#75412e]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#b86643]" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Enquire Now action */}
                  <div className="pt-4 border-t border-[#bd896e]/20 flex items-center justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => onOpenEnquiryModal(product.id)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#b86643] hover:bg-[#a55635] text-[#fff8f0] text-[10px] font-bold uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <span>Enquire now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Custom bulk orders callout */}
        <div className="p-8 rounded-3xl bg-[#ead8c6] border border-[#bd896e]/40 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1 max-w-xl">
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#3d2117]">
              Need custom pallet quantities or proprietary sizing?
            </h3>
            <p className="text-xs sm:text-sm text-[#66483b]">
              We work with commercial catering groups, airline kitchens, and retail chains to produce custom sheet thicknesses, roll widths, and private label packaging.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="shrink-0 px-6 py-3.5 rounded-full bg-[#3d2117] hover:bg-[#2b150a] text-white text-[10px] font-bold uppercase tracking-[0.16em] transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Start a trade conversation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
