import React from 'react';
import { ArrowRight, Heart, Sparkles, Utensils } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#f5eee5] text-[#3d2117] px-6 sm:px-12 lg:px-20 py-20 lg:py-28 min-h-[700px]">
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-[0.28em] text-[#8d5037]">
              <span className="w-6 h-px bg-[#bd7657] inline-block" />
              <span>The Savouré story</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-normal text-[#3d2117] leading-tight">
              A little taste<br />
              of <em className="italic text-[#a95d3f]">home.</em>
            </h1>
          </div>

          <div className="lg:col-span-5 text-sm sm:text-base text-[#66483b] leading-relaxed pt-2 lg:pt-10">
            Food has a way of bringing us back to the people and places we love. Savouré is our celebration of those everyday moments — made with care, shared with love. From our family kitchen to commercial banquet halls and neighborhood dining tables nationwide across South Africa.
          </div>
        </div>

        {/* Feature Medallion Card */}
        <div className="bg-[#ead8c6] rounded-3xl p-8 sm:p-14 border border-[#bd896e]/40 grid grid-cols-1 md:grid-cols-12 gap-8 items-center shadow-sm">
          <div className="md:col-span-4 flex justify-center">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-[#bd896e] bg-[#dfc4ae] flex flex-col items-center justify-center text-center p-4 relative shadow-md">
              <span className="text-[#a95d3f] text-2xl mb-1">✦</span>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-[#3d2117] uppercase">
                Savouré
              </span>
              <span className="text-[8px] uppercase tracking-[0.25em] text-[#8d5037] mt-0.5 font-semibold">
                South Africa
              </span>
              <div className="absolute inset-2 rounded-full border border-dashed border-[#bd896e]/60 pointer-events-none" />
            </div>
          </div>

          <div className="md:col-span-8 space-y-4 text-center md:text-left">
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#3d2117]">
              Gathering around the table at the heart of everything.
            </h3>
            <p className="text-sm text-[#66483b] leading-relaxed">
              We started with a simple observation: modern commercial pastry had lost its texture. Industrial dough improvers, heavy preservatives, and machine-stretched shortcuts had replaced the delicate flaky layers of traditional baking. We set out to bring genuine craftsmanship back to wholesale food manufacturing.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#75412e] hover:text-[#3d2117] border-b border-[#c79176] py-1 transition-colors cursor-pointer"
              >
                <span>Come and say hello</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3 Values / Pillars */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-[0.28em] text-[#8d5037]">
            <span className="w-6 h-px bg-[#bd7657] inline-block" />
            <span>What we stand for</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white border border-[#bd896e]/30 space-y-3 shadow-2xs">
              <div className="font-mono text-xs font-bold text-[#a95d3f]">01</div>
              <h3 className="font-serif text-xl font-normal text-[#3d2117]">
                Honest ingredients
              </h3>
              <p className="text-xs sm:text-sm text-[#66483b] leading-relaxed">
                Nothing unnecessary. Only simple, recognizable staples. Select unbleached stone-ground flour, pure filtered water, certified vegetable shortenings, and sea salt.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-[#bd896e]/30 space-y-3 shadow-2xs">
              <div className="font-mono text-xs font-bold text-[#a95d3f]">02</div>
              <h3 className="font-serif text-xl font-normal text-[#3d2117]">
                Time-honoured recipes
              </h3>
              <p className="text-xs sm:text-sm text-[#66483b] leading-relaxed">
                Recipes handed down through generations, made with patience and hand-stretched care. The delicate lachha layers of our rotis and the acoustic crunch of our spring rolls cannot be rushed.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-[#bd896e]/30 space-y-3 shadow-2xs">
              <div className="font-mono text-xs font-bold text-[#a95d3f]">03</div>
              <h3 className="font-serif text-xl font-normal text-[#3d2117]">
                Shared around the table
              </h3>
              <p className="text-xs sm:text-sm text-[#66483b] leading-relaxed">
                Food made to be passed, shared, and enjoyed together. Whether it is a Sunday family lunch or a 500-guest wedding banquet, our pastries bring people closer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
