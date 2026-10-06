import React from 'react';
import { ArrowRight, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { SHOWCASE_PRODUCTS } from './showcaseData';

interface ShowcaseAboutPageProps {
  onNavigate: (tab: string) => void;
}

export const ShowcaseAboutPage: React.FC<ShowcaseAboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#F9F6F0]">
      {/* Page Intro */}
      <section className="page-intro">
        <div className="page-shell">
          <p className="eyebrow">Our story</p>
          <h1 className="mt-5 max-w-4xl text-balance font-display text-5xl text-[#261C14] md:text-7xl">
            Food has always been our way of bringing people together.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#736254]">
            Savouré is rooted in the familiar flavours, generous tables and shared moments that make food meaningful.
          </p>
        </div>
      </section>

      {/* Purpose Section */}
      <section className="section-space">
        <div className="page-shell grid items-center gap-14 md:grid-cols-2">
          <div className="relative bg-[#EEE6DC] p-6 rounded-lg">
            <img
              src={SHOWCASE_PRODUCTS[0].image}
              alt="Savouré Roti"
              className="aspect-square size-full object-cover rounded"
            />
            <span className="absolute bottom-8 right-8 bg-[#F9F6F0] px-5 py-3 font-display text-xl text-[#9E582E] shadow-sm">
              A taste of tradition
            </span>
          </div>

          <div>
            <p className="eyebrow">Made with purpose</p>
            <h2 className="mt-4 font-display text-4xl text-[#261C14] md:text-6xl">
              Honest quality for modern kitchens.
            </h2>
            <div className="mt-7 space-y-5 text-base leading-8 text-[#736254]">
              <p>
                We believe everyday staples deserve the same care as the meals they help create. That means dependable quality, practical preparation and authentic flavour in every pack.
              </p>
              <p>
                Our products are made for home cooks, caterers, retailers and food businesses who value consistency without compromising on taste.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Values Cards */}
      <section className="bg-[#EEE6DC]/60 border-y border-[#D5C8B9]">
        <div className="page-shell grid gap-px py-20 md:grid-cols-3">
          <div className="border-b border-[#D5C8B9] p-8 md:border-b-0 md:border-r">
            <HeartHandshake className="size-7 text-[#9E582E]" />
            <h3 className="mt-6 font-display text-2xl text-[#261C14]">Care in every pack</h3>
            <p className="mt-3 text-sm leading-7 text-[#736254]">
              Thoughtful products made to earn a place in your kitchen with consistency and passion.
            </p>
          </div>

          <div className="border-b border-[#D5C8B9] p-8 md:border-b-0 md:border-r">
            <CheckCircle2 className="size-7 text-[#9E582E]" />
            <h3 className="mt-6 font-display text-2xl text-[#261C14]">Halal certified</h3>
            <p className="mt-3 text-sm leading-7 text-[#736254]">
              A pure range created with strict adherence to authentic dietary requirements and trust.
            </p>
          </div>

          <div className="p-8">
            <CheckCircle2 className="size-7 text-[#9E582E]" />
            <h3 className="mt-6 font-display text-2xl text-[#261C14]">100% Plant-based / Vegan</h3>
            <p className="mt-3 text-sm leading-7 text-[#736254]">
              Versatile essentials suited to a wide variety of culinary traditions, events and menus.
            </p>
          </div>
        </div>
      </section>

      {/* Range CTA */}
      <section className="section-space">
        <div className="page-shell flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">From our range to your table</p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl text-[#261C14] md:text-6xl">
              Discover the Savouré collection.
            </h2>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide text-white bg-[#9E582E] hover:bg-[#854722] transition-colors"
          >
            <span>Explore products</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
