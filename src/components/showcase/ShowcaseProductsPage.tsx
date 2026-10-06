import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { SHOWCASE_PRODUCTS } from './showcaseData';

interface ShowcaseProductsPageProps {
  onNavigate: (tab: string) => void;
}

export const ShowcaseProductsPage: React.FC<ShowcaseProductsPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#F9F6F0]">
      {/* Intro Header */}
      <section className="page-intro">
        <div className="page-shell">
          <p className="eyebrow">Product range</p>
          <h1 className="mt-5 max-w-4xl text-balance font-display text-5xl text-[#261C14] md:text-7xl">
            The essentials behind memorable meals.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#736254]">
            Four versatile favourites, made for reliable results at home and in professional kitchens.
          </p>
        </div>
      </section>

      {/* Products Showcase */}
      <section className="section-space">
        <div className="page-shell space-y-24">
          {SHOWCASE_PRODUCTS.map((prod, index) => (
            <article
              key={prod.name}
              className="grid items-center gap-10 md:grid-cols-2 md:gap-16 border-b border-[#D5C8B9]/60 pb-20 last:border-b-0"
            >
              <div className={`bg-[#EEE6DC] p-8 rounded-lg flex items-center justify-center ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                <img
                  src={prod.image}
                  alt={`Savouré ${prod.name} packaging`}
                  className={`aspect-square w-full max-w-md object-contain drop-shadow-xl ${prod.imageClass}`}
                />
              </div>

              <div>
                <p className="eyebrow">{prod.note}</p>
                <h2 className="mt-4 font-display text-4xl text-[#261C14] md:text-6xl">{prod.name}</h2>
                <p className="mt-6 max-w-lg text-lg leading-8 text-[#736254]">
                  {prod.description}
                </p>
                
                <div className="mt-7 border-l-2 border-[#9E582E] pl-5">
                  <span className="text-xs uppercase tracking-wider text-[#A85A2A] font-bold block mb-1">Packaging Specifications:</span>
                  <p className="text-sm font-semibold text-[#261C14]">{prod.detail}</p>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => onNavigate('contact')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold tracking-wide text-white bg-[#9E582E] hover:bg-[#854722] transition-colors"
                  >
                    <span>Enquire</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onNavigate('wholesale')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold tracking-wide text-[#261C14] border border-[#D5C8B9] hover:bg-[#EEE6DC] transition-colors"
                  >
                    <span>Wholesale details</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
