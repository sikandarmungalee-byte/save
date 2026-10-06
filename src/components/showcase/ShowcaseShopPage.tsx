import React from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { SHOWCASE_PRODUCTS } from './showcaseData';

interface ShowcaseShopPageProps {
  onNavigate: (tab: string) => void;
}

export const ShowcaseShopPage: React.FC<ShowcaseShopPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#F9F6F0]">
      <section className="overflow-hidden">
        <div className="page-shell grid min-h-[75svh] items-center gap-10 py-16 md:grid-cols-2">
          <div>
            <ShoppingBag className="size-8 text-[#9E582E]" />
            <p className="eyebrow mt-8">Online shop</p>
            <h1 className="mt-4 font-display text-6xl text-[#261C14] md:text-8xl">Coming soon.</h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#736254]">
              We’re preparing a beautiful new direct ordering experience for your Savouré favourites. Until our consumer shop goes live, our team is ready to assist with direct enquiries and wholesale orders.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide text-white bg-[#9E582E] hover:bg-[#854722] transition-colors"
              >
                <span>Contact us</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('products')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide text-[#261C14] border border-[#D5C8B9] hover:bg-[#EEE6DC] transition-colors"
              >
                <span>Browse the range</span>
              </button>
            </div>
          </div>

          <div className="relative min-h-[420px] flex items-center justify-center">
            <img
              src={SHOWCASE_PRODUCTS[2].image}
              alt="Savouré Samoosa Pastry"
              className="absolute right-0 top-6 w-[68%] rotate-6 object-contain drop-shadow-2xl"
            />
            <img
              src={SHOWCASE_PRODUCTS[3].image}
              alt="Savouré Spring Roll Pastry"
              className="absolute bottom-6 left-0 w-[70%] -rotate-6 object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
