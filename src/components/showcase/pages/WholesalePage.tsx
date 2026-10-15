import React from 'react';
import { ArrowRight, Truck, Package, ShieldCheck, PhoneCall, Sparkles } from 'lucide-react';
import { SHOWCASE_CONTACT } from '../showcaseData';

interface WholesalePageProps {
  onNavigate: (page: string) => void;
  onOpenEnquiryModal: (productId?: string) => void;
}

export const WholesalePage: React.FC<WholesalePageProps> = ({ onNavigate, onOpenEnquiryModal }) => {
  return (
    <div className="bg-[#ead8c6] text-[#3d2117] px-6 sm:px-12 lg:px-20 py-20 lg:py-28 min-h-[700px]">
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Intro */}
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-[0.28em] text-[#8d5037]">
            <span className="w-6 h-px bg-[#bd7657] inline-block" />
            <span>For retailers & partners</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-normal text-[#3d2117] leading-tight">
            Bring a taste<br />
            of <em className="italic text-[#a95d3f]">tradition</em> to your shelves.
          </h1>

          <p className="text-sm sm:text-base text-[#66483b] leading-relaxed">
            We work with thoughtful retailers, banquet caterers, cafés, restaurants, and foodservice distributors who believe good food should be made to be shared.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#b86643] hover:bg-[#a55635] text-[#fff8f0] text-[10px] font-bold uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5 cursor-pointer shadow-sm"
            >
              <span>Start a conversation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Wholesale Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-[#bd896e]/30 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-[#f5eee5] text-[#b86643] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-normal text-[#3d2117]">
              Prompt Nationwide Cold-Chain Delivery
            </h3>
            <p className="text-xs sm:text-sm text-[#66483b] leading-relaxed">
              We run scheduled temperature-controlled delivery routes nationwide across South Africa. From Gauteng to the Western Cape, KwaZulu-Natal, and all provinces, your pastry reaches your kitchen bakery-fresh.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-[#bd896e]/30 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-[#f5eee5] text-[#b86643] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-normal text-[#3d2117]">
              Custom Dozens & Retail Cartons
            </h3>
            <p className="text-xs sm:text-sm text-[#66483b] leading-relaxed">
              Order in catering dozens (calculated in 12s for easy portioning) or sealed barcoded retail packs ready for grocery and deli shelves. Flexible minimum order quantities.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-[#bd896e]/30 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-[#f5eee5] text-[#b86643] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-normal text-[#3d2117]">
              100% Halal Certified Kitchen
            </h3>
            <p className="text-xs sm:text-sm text-[#66483b] leading-relaxed">
              Operating under strict non-meat, vegetarian pastry sanitation guidelines. Pure vegetable shortenings, zero animal enzymes, and full SANHA compliance documentation.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-[#bd896e]/30 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-[#f5eee5] text-[#b86643] flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-normal text-[#3d2117]">
              Dedicated Trade Account Desk
            </h3>
            <p className="text-xs sm:text-sm text-[#66483b] leading-relaxed">
              Direct WhatsApp ordering desk with live bakery dispatch staff. Flexible weekly billing schedules and standing delivery slots for repeat commercial accounts.
            </p>
          </div>
        </div>

        {/* Chef Tasting Sample Box Callout */}
        <div className="bg-[#dfc4ae] rounded-3xl p-8 sm:p-12 border border-[#bd896e]/50 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8d5037]">
              Complimentary Chef Evaluation
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#3d2117]">
              Request a Tasting Sample Kit
            </h3>
            <p className="text-xs sm:text-sm text-[#66483b] leading-relaxed">
              Are you an executive chef, banquet director, or procurement manager? We gladly provide tasting sample packs so you can test our folding strength, frying blister, and taste in your kitchen.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenEnquiryModal()}
            className="shrink-0 px-6 py-3.5 rounded-full bg-[#b86643] hover:bg-[#a55635] text-[#fff8f0] text-[10px] font-bold uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5 cursor-pointer shadow-sm whitespace-nowrap"
          >
            <span>Request Sample Pack</span>
          </button>
        </div>
      </div>
    </div>
  );
};
