import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Check } from 'lucide-react';
import { SHOWCASE_COLLECTION, ShowcaseProductItem } from '../showcaseData';
import { useERP } from '../../../context/ERPContext';

interface HomePageProps {
  onNavigate: (page: string) => void;
  onOpenEnquiryModal: (productId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenEnquiryModal }) => {
  const { showcaseProducts } = useERP();
  const productList = (showcaseProducts && showcaseProducts.length > 0) ? showcaseProducts : SHOWCASE_COLLECTION;
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = activeIndex >= productList.length ? 0 : activeIndex;
  const currentProduct = productList[safeIndex] || productList[0] || SHOWCASE_COLLECTION[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev + productList.length - 1) % productList.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % productList.length);
  };

  // Tone-specific soft ambient backdrops to blend products seamlessly into the site
  const toneBackdrops: Record<string, string> = {
    roti: 'from-[#fcf6f0] via-[#faebd9] to-[#ebd0ba]',
    wrap: 'from-[#fcf8f0] via-[#faeed4] to-[#ebd7b4]',
    samosa: 'from-[#fcf5ef] via-[#fae6d3] to-[#eacdb4]',
    springroll: 'from-[#fcf6f0] via-[#fae8d8] to-[#ebceb9]',
  };

  return (
    <div className="bg-[#f5eee5] text-[#3d2117]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#ead8c6] border-b border-[#bd896e]/30 px-6 sm:px-12 lg:px-20 py-16 lg:py-24">
        {/* Subtle radial ambient illumination */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_20%_30%,#fffaf3_0,transparent_45%),radial-gradient(ellipse_at_80%_20%,#d5ab8c_0,transparent_40%)]" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-1">
          {/* Hero Copy (Left) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-[0.28em] text-[#8d5037]">
              <span className="w-6 h-px bg-[#bd7657] inline-block" />
              <span>A taste of tradition</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-[#3d2117] leading-[1.04]">
              Made with care.<br />
              Shared with <em className="italic text-[#a95d3f]">love.</em>
            </h1>

            <p className="text-sm sm:text-base text-[#66483b] leading-relaxed max-w-xl font-normal">
              Bringing the warmth of tradition to your table. Honest ingredients, authentic recipes, and a little bit of magic in every bite. Handcrafted daily with prompt nationwide delivery across South Africa.
            </p>

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#b86643] hover:bg-[#a55635] text-[#fff8f0] text-[10px] font-bold uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5 cursor-pointer shadow-sm"
              >
                <span>Explore our range</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#75412e] hover:text-[#3d2117] border-b border-[#c79176] py-1 transition-colors cursor-pointer group"
              >
                <span>Our story</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="pt-6 border-t border-[#bd896e]/30 flex flex-wrap items-center gap-3 text-xs text-[#75412e]">
              <span>Vegan friendly</span>
              <span className="text-[#bd896e]">·</span>
              <span>Halal certified</span>
              <span className="text-[#bd896e]">·</span>
              <span>Nationwide Delivery</span>
            </div>
          </div>

          {/* Hero Art Card (Right) — Features Savouré Brand Logo as requested */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md h-[440px] sm:h-[480px] bg-gradient-to-b from-[#fbf7f1] via-[#f1e5d7] to-[#dfc4ae] rounded-3xl p-8 flex flex-col items-center justify-center border border-[#bd896e]/50 shadow-xl overflow-hidden group">
              {/* Decorative concentric circular hairline & halo */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[125%] h-[125%] rounded-full border border-[#bd896e]/25 transform -rotate-12" />
                <div className="w-[85%] h-[85%] rounded-full border border-dashed border-[#bd896e]/35 transform rotate-45" />
                <div className="w-72 h-72 rounded-full bg-radial from-white/80 via-[#f7efe6]/50 to-transparent blur-md" />
              </div>

              {/* Card stamp badge */}
              <div className="absolute top-6 right-6 w-14 h-14 rounded-full border border-[#ae7057] text-[#9d5a40] text-[10px] flex flex-col items-center justify-center font-serif rotate-12 shadow-2xs bg-[#f5eee5]/70 backdrop-blur-xs z-10">
                <span className="font-bold leading-none">100%</span>
                <span className="text-[7px] uppercase tracking-wider mt-0.5">Halal</span>
              </div>

              {/* Savouré Master Logo Mark Container */}
              <div className="relative z-1 w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-white p-4 shadow-lg border border-[#bd896e]/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                <img
                  src="/showcase/savoure-logo.png"
                  alt="Savouré — A Taste of Tradition"
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>

              {/* Soft grounding pedestal shadow */}
              <div className="w-48 h-3.5 rounded-full bg-[#522919]/15 blur-sm mx-auto mt-3 pointer-events-none" />

              {/* Sparkles */}
              <div className="absolute top-10 left-10 text-[#bd7657] text-lg select-none">✦</div>
              <div className="absolute bottom-12 right-12 text-[#bd7657] text-base select-none">✦</div>

              {/* Art Caption */}
              <div className="absolute bottom-5 left-8 flex items-center gap-2 text-xs font-mono font-medium text-[#75412e] z-10">
                <span className="font-bold text-[#b86643]">01</span>
                <span className="text-[#bd896e]">/</span>
                <span className="text-[11px] font-sans uppercase tracking-widest text-[#75412e]">
                  Artisanal Heritage
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-12 text-center text-[10px] uppercase font-bold tracking-[0.2em] text-[#8d5037] flex flex-col items-center gap-2 opacity-80">
          <span>Scroll to discover</span>
          <div className="w-px h-8 bg-[#bd7657]" />
        </div>
      </section>

      {/* 2. VALUES STRIP */}
      <div className="bg-[#f5eee5] border-b border-[#bd896e]/20 py-8 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <h4 className="font-serif text-lg font-normal text-[#3d2117]">Honest recipes</h4>
            <p className="text-xs text-[#66483b]">Nothing unnecessary. Pure unbleached flour & natural vegetable shortenings.</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-serif text-lg font-normal text-[#3d2117]">Time-tested tradition</h4>
            <p className="text-xs text-[#66483b]">Recipes crafted with generational heritage, hand-stretched daily.</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-serif text-lg font-normal text-[#3d2117]">Thoughtfully sourced</h4>
            <p className="text-xs text-[#66483b]">100% Halal certified, non-GMO, and nationwide cold-chain delivery.</p>
          </div>
        </div>
      </div>

      {/* 3. FEATURED PRODUCTS SWITCHER (Integrated product presentation, zero prices) */}
      <section className="py-20 lg:py-28 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-14">
          <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-[0.28em] text-[#8d5037] mb-3">
            <span className="w-6 h-px bg-[#bd7657] inline-block" />
            <span>Featured products</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#3d2117] leading-tight">
            Good food starts<br />
            with the <em className="italic text-[#a95d3f]">basics.</em>
          </h2>
          <p className="text-sm text-[#66483b] mt-4 leading-relaxed">
            Simple, honest staples made for the meals that matter. From our kitchen to yours.
          </p>
        </div>

        {/* Product Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left: Product Art Card + Prev/Next Controls */}
          <div className="lg:col-span-6 space-y-4">
            <div className={`relative h-[400px] sm:h-[460px] bg-gradient-to-b ${toneBackdrops[currentProduct.tone] || 'from-[#fcf6f0] via-[#faebd9] to-[#ebd0ba]'} rounded-3xl p-8 flex flex-col items-center justify-center border border-[#bd896e]/40 overflow-hidden shadow-md group transition-all duration-500`}>
              {/* Architectural concentric curves */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[130%] h-[130%] rounded-full border border-[#bd896e]/25 transform -rotate-25" />
                <div className="w-80 h-80 rounded-full bg-white/40 blur-xl pointer-events-none" />
              </div>

              {/* Stamp Badge */}
              <div className="absolute top-6 right-6 w-14 h-14 rounded-full border border-[#ae7057] text-[#9d5a40] text-[10px] flex flex-col items-center justify-center font-serif rotate-12 bg-[#f5eee5]/70 backdrop-blur-xs z-10">
                <span className="font-bold leading-none">100%</span>
                <span className="text-[7px] uppercase tracking-wider mt-0.5">Halal</span>
              </div>

              {/* Product Pack Mockup with Integrated Lighting & Pedestal Shadow */}
              <div className="relative z-1 w-64 h-64 sm:w-76 sm:h-76 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                <img
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  className="w-full h-full object-contain drop-shadow-xl"
                />
              </div>

              {/* Grounding physical shadow below pack to integrate it into the surface */}
              <div className="relative z-1 w-52 sm:w-60 h-4 rounded-full bg-[#522919]/20 blur-md -mt-4 pointer-events-none group-hover:scale-95 transition-transform duration-500" />

              {/* Category mark */}
              <div className="absolute bottom-6 left-8 font-mono text-xs uppercase tracking-widest text-[#75412e] z-10">
                {currentProduct.mark}
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous product"
                  className="w-10 h-10 rounded-full bg-white hover:bg-[#ead8c6] border border-[#bd896e]/40 text-[#75412e] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next product"
                  className="w-10 h-10 rounded-full bg-white hover:bg-[#ead8c6] border border-[#bd896e]/40 text-[#75412e] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Numbered indicators */}
              <div className="flex items-center gap-2 font-mono text-xs text-[#75412e]">
                {productList.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      activeIndex === idx
                        ? 'bg-[#b86643] text-white font-bold'
                        : 'text-[#75412e] hover:bg-[#dfc4ae]/50'
                    }`}
                  >
                    0{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-6 space-y-6">
            <div className="font-mono text-xs uppercase tracking-wider text-[#8d5037]">
              0{activeIndex + 1} <span className="text-[#bd896e]">/ 04</span>
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-[#a95d3f] font-semibold block mb-1">
                {currentProduct.detail}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl font-normal text-[#3d2117]">
                {currentProduct.name}
              </h3>
            </div>

            <p className="text-sm sm:text-base text-[#66483b] leading-relaxed">
              {currentProduct.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#75412e]">
              {currentProduct.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-white/70 border border-[#bd896e]/30 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Spec details */}
            <div className="p-4 rounded-2xl bg-[#ead8c6]/60 border border-[#bd896e]/30 space-y-1 text-xs text-[#66483b]">
              <div><strong>Packaging Spec:</strong> {currentProduct.packSpec}</div>
              <div><strong>Size Spec:</strong> {currentProduct.sizeSpec}</div>
            </div>

            {/* Primary Action Button: ENQUIRE NOW (NO PRICES!) */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onOpenEnquiryModal(currentProduct.id)}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#b86643] hover:bg-[#a55635] text-[#fff8f0] text-[10px] font-bold uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5 cursor-pointer shadow-sm"
              >
                <span>Enquire now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#75412e] hover:text-[#3d2117] border-b border-[#c79176] py-1 transition-colors cursor-pointer"
              >
                <span>Wholesale & catering desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* View all products link */}
        <div className="mt-16 text-center">
          <button
            type="button"
            onClick={() => onNavigate('products')}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#75412e] hover:text-[#3d2117] border-b border-[#c79176] py-1 transition-colors cursor-pointer"
          >
            <span>View full collection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 4. STORY TEASE SECTION */}
      <section className="bg-[#ead8c6] border-t border-[#bd896e]/30 py-20 lg:py-28 px-6 sm:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto space-y-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 text-[10px] uppercase font-bold tracking-[0.28em] text-[#8d5037]">
            <span className="w-6 h-px bg-[#bd7657] inline-block" />
            <span>Our story</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#3d2117] leading-tight">
            A little taste<br />
            of <em className="italic text-[#a95d3f]">home.</em>
          </h2>

          <p className="text-sm sm:text-base text-[#66483b] leading-relaxed max-w-2xl">
            Some things are more than food. They are memories, shared tables, and the comforting feeling of home. Savouré began with a family recipe and a simple belief: everyday food should still feel special.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#75412e] hover:text-[#3d2117] border-b border-[#c79176] py-1 transition-colors cursor-pointer"
            >
              <span>Read our story</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
