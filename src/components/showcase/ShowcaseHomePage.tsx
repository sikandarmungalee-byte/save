import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { SHOWCASE_PRODUCTS } from './showcaseData';

interface ShowcaseHomePageProps {
  onNavigate: (tab: string) => void;
}

export const ShowcaseHomePage: React.FC<ShowcaseHomePageProps> = ({ onNavigate }) => {
  return (
    <>
      {/* Hero Section */}
      <section className="overflow-hidden bg-[#F9F6F0]">
        <div className="page-shell grid min-h-[calc(100svh-5rem)] items-center gap-10 py-10 lg:min-h-[calc(100svh-6rem)] lg:grid-cols-[0.84fr_1.16fr] lg:py-14">
          {/* Left Column: Hero Copy */}
          <div className="relative z-10 animate-rise">
            <p className="eyebrow">A taste of tradition</p>
            <h1 className="mt-5 max-w-xl text-balance font-display text-6xl leading-[0.95] text-[#261C14] sm:text-7xl lg:text-8xl">
              Made for the moments that bring us together.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#736254] sm:text-lg">
              Premium pastry and flatbreads, thoughtfully made for authentic flavour, effortless preparation and tables worth sharing.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('products')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide text-white bg-[#9E582E] hover:bg-[#854722] transition-colors shadow-sm"
              >
                <span>Explore our range</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('wholesale')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide text-[#261C14] border border-[#D5C8B9] bg-transparent hover:bg-[#EEE6DC] transition-colors"
              >
                <span>Wholesale enquiries</span>
              </button>
            </div>

            <div className="mt-10 flex items-center gap-6 border-t border-[#D5C8B9] pt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#261C14]">
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                  ✓
                </span>
                <span>Vegan</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                  ✓
                </span>
                <span>Halal</span>
              </span>
            </div>
          </div>

          {/* Right Column: Hero Visual Product Stage */}
          <div className="hero-product-stage animate-rise [animation-delay:140ms]">
            <div className="hero-ring" />
            <img
              src={SHOWCASE_PRODUCTS[0].image}
              alt="Savouré Roti packaging"
              className="hero-pack hero-pack-back"
            />
            <img
              src={SHOWCASE_PRODUCTS[1].image}
              alt="Savouré Tortilla Wraps packaging"
              className="hero-pack hero-pack-front"
            />
            <p className="hero-caption">Soft. Flexible. Delicious.</p>
          </div>
        </div>
      </section>

      {/* Our Range Grid Section */}
      <section className="section-space bg-[#F9F6F0]">
        <div className="page-shell">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="eyebrow">Our range</p>
              <h2 className="mt-4 font-display text-4xl text-[#261C14] md:text-6xl">
                Everyday favourites,<br />beautifully made.
              </h2>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#9E582E] hover:underline"
            >
              <span>View all products</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden border border-[#D5C8B9] bg-[#D5C8B9] md:grid-cols-2 lg:grid-cols-4">
            {SHOWCASE_PRODUCTS.map((prod) => (
              <article key={prod.name} className="group bg-[#F9F6F0] p-5 transition-colors hover:bg-white">
                <div className="aspect-square overflow-hidden bg-[#EEE6DC] p-3 flex items-center justify-center">
                  <img
                    src={prod.image}
                    alt={`Savouré ${prod.name}`}
                    className={`size-full transition-transform duration-500 group-hover:scale-[1.04] ${prod.imageClass}`}
                  />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#9E582E]">
                  {prod.note}
                </p>
                <h3 className="mt-2 font-display text-2xl text-[#261C14]">{prod.name}</h3>
                <p className="mt-2 text-xs text-[#736254] leading-relaxed line-clamp-2">{prod.description}</p>
                <p className="mt-3 text-[11px] font-semibold text-[#261C14]">{prod.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* The Savouré Promise (Dark Section) */}
      <section className="bg-[#201713] text-[#F9F6F0]">
        <div className="page-shell grid gap-10 py-20 md:grid-cols-[1fr_1.1fr] md:py-28">
          <p className="eyebrow !text-[#DE9E74]">The Savouré promise</p>
          <div>
            <h2 className="text-balance font-display text-4xl leading-tight md:text-6xl">
              Tradition at heart.<br />Quality in every pack.
            </h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-[#F9F6F0]/70 md:text-lg">
              From family meals to busy professional kitchens, our range is created to deliver consistency without losing the honest taste of tradition.
            </p>
            <button
              onClick={() => onNavigate('about')}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide text-white bg-[#9E582E] hover:bg-[#854722] transition-colors shadow-sm"
            >
              <span>Discover our story</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Wholesale Banner Section */}
      <section className="section-space bg-[#F9F6F0]">
        <div className="page-shell grid items-end gap-10 md:grid-cols-2">
          <div>
            <p className="eyebrow">Wholesale</p>
            <h2 className="mt-4 font-display text-4xl text-[#261C14] md:text-6xl">
              Made to move with your business.
            </h2>
          </div>
          <div className="border-l-2 border-[#9E582E] pl-7">
            <p className="text-lg leading-8 text-[#736254]">
              Reliable supply, wholesale pricing and a range customers already know and love.
            </p>
            <p className="mt-5 font-semibold text-[#261C14]">
              Minimum order: 10 dozen / 10 packs
            </p>
            <button
              onClick={() => onNavigate('wholesale')}
              className="mt-7 inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide text-white bg-[#261C14] hover:bg-[#3D2C20] transition-colors"
            >
              <span>View wholesale details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
};
