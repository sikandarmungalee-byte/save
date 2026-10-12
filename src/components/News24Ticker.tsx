import React, { useState, useEffect } from 'react';
import { Newspaper, Pause, Play, ChevronUp, ChevronDown, ExternalLink, RefreshCw, X, Radio } from 'lucide-react';

interface NewsItem {
  id: string;
  category: 'TOP STORY' | 'BUSINESS' | 'MARKETS' | 'FOOD & RETAIL' | 'SOUTH AFRICA';
  title: string;
  summary: string;
  source: string;
  timeAgo: string;
  accent: string;
}

const NEWS24_HEADLINES: NewsItem[] = [
  {
    id: 'n1',
    category: 'MARKETS',
    title: 'Rand strengthens against USD to R17.32 as local manufacturing and retail sales rebound',
    summary: 'The South African Rand traded firmer against major global peers on Monday, bolstered by steady mining outputs and improved wholesale retail activity across Gauteng and Western Cape commercial hubs.',
    source: 'News24 Business',
    timeAgo: '12m ago',
    accent: '#DE9E74',
  },
  {
    id: 'n2',
    category: 'BUSINESS',
    title: 'South African consumer inflation eases to 4.4%, boosting food manufacturing & retail confidence',
    summary: 'Stats SA reports moderation in headline CPI, providing relief for bakery, confectionery, and hospitality input costs as wheat and energy import costs stabilize.',
    source: 'News24 Economy',
    timeAgo: '24m ago',
    accent: '#C98A5B',
  },
  {
    id: 'n3',
    category: 'TOP STORY',
    title: 'Transnet rail and port modernization drives accelerated supply chain velocity for agri-processors',
    summary: 'Logistics corridors between Durban and Gauteng report a 18% improvement in turn-around times, easing raw material dispatch for commercial food and grain producers.',
    source: 'News24 National',
    timeAgo: '41m ago',
    accent: '#EF4444',
  },
  {
    id: 'n4',
    category: 'FOOD & RETAIL',
    title: 'Artisanal bakeries and specialty food brands see 28% surge in wholesale corporate catering demand',
    summary: 'Enterprise procurement trends in Johannesburg and Cape Town show significant preference for premium artisanal sourdough, viennoiserie, and handcrafted patisserie in high-end corporate accounts.',
    source: 'News24 Enterprise',
    timeAgo: '1h ago',
    accent: '#10B981',
  },
  {
    id: 'n5',
    category: 'MARKETS',
    title: 'JSE All Share Index touches fresh record highs as local food, beverage & hospitality stocks rally',
    summary: 'Johannesburg Stock Exchange logged robust trading volumes led by industrial consumer producers, retailers, and commercial distribution networks.',
    source: 'News24 Markets',
    timeAgo: '1h ago',
    accent: '#DE9E74',
  },
  {
    id: 'n6',
    category: 'SOUTH AFRICA',
    title: 'Eskom energy availability factor holds above 65% with zero load shedding in consecutive quarters',
    summary: 'Sustained generation stability across Mpumalanga thermal fleet powers industrial bakeries, refrigeration cold chains, and commercial manufacturing plants without operational downtime.',
    source: 'News24 Power Watch',
    timeAgo: '2h ago',
    accent: '#3B82F6',
  },
  {
    id: 'n7',
    category: 'BUSINESS',
    title: 'Reserve Bank MPC signals potential further interest rate cuts as core inflation settles within target band',
    summary: 'Governor Lesetja Kganyago highlights improved macroeconomic outlook and prudent fiscal consolidation supporting business investment and consumer purchasing power.',
    source: 'News24 Central Bank',
    timeAgo: '2h ago',
    accent: '#C98A5B',
  },
];

export const News24Ticker: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedStory, setSelectedStory] = useState<NewsItem | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState('Just now');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsRefreshing(false);
    }, 600);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-2 right-4 z-30 no-print">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF4EF] border border-[#E8DDD5] text-xs text-[#58341D] shadow-md transition-all font-medium"
        >
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <Newspaper className="w-3.5 h-3.5 text-[#CC8468]" />
          <span className="font-serif font-bold">News24 Live Ticker</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#A8988D]" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Running Headline Ticker Bar (Fixed at the bottom of the viewport) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-md no-print text-xs">
        <div className="flex items-center h-10 px-2 sm:px-4">
          {/* Badge & Branding */}
          <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-stone-200 bg-white z-10">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-600 font-bold font-mono text-[10px] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              News24
            </span>
            <span className="text-[#391E0F] font-serif font-semibold hidden md:inline text-[11px]">
              Latest Headlines
            </span>
          </div>

          {/* Scrolling Ticker Track */}
          <div
            className="flex-1 overflow-hidden relative mx-2 h-full flex items-center"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className={`flex items-center gap-8 whitespace-nowrap will-change-transform ${
                isPaused ? 'animation-paused' : ''
              }`}
              style={{
                display: 'inline-flex',
                animation: isPaused ? 'none' : 'tickerSlide 55s linear infinite',
              }}
            >
              {/* Double array for seamless loop */}
              {[...NEWS24_HEADLINES, ...NEWS24_HEADLINES].map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => setSelectedStory(item)}
                  className="flex items-center gap-2.5 cursor-pointer text-[#443832] hover:text-[#2B150A] transition-colors group"
                >
                  <span
                    className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded tracking-wider border shrink-0"
                    style={{
                      borderColor: `${item.accent}40`,
                      color: item.accent,
                      backgroundColor: `${item.accent}15`,
                    }}
                  >
                    {item.category}
                  </span>
                  <span className="text-xs group-hover:underline group-hover:text-[#391E0F] font-medium">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">{item.timeAgo}</span>
                  <span className="text-[#CC8468] ml-2" aria-hidden="true">
                    ✦
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls: Pause, Refresh, Minimize */}
          <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-stone-200 bg-white z-10 text-stone-500">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-md hover:text-[#2B150A] hover:bg-stone-50 transition-colors"
              title={isPaused ? 'Resume Ticker' : 'Pause Ticker'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-[#391E0F]" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="p-1.5 rounded-md hover:text-[#2B150A] hover:bg-stone-50 transition-colors"
              title={`Updated: ${lastRefreshed} (Click to refresh)`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#CC8468]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-md hover:text-[#2B150A] hover:bg-stone-50 transition-colors"
              title="Minimize News Ticker"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Story Detail Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-[#E8DDD5] rounded-2xl p-6 shadow-2xl relative space-y-4 text-[#2B150A]">
            <button
              type="button"
              onClick={() => setSelectedStory(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#7A685D] hover:text-[#2B150A] hover:bg-[#FAF5F0]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded tracking-wider border"
                style={{
                  borderColor: `${selectedStory.accent}50`,
                  color: selectedStory.accent,
                  backgroundColor: `${selectedStory.accent}15`,
                }}
              >
                {selectedStory.category}
              </span>
              <span className="text-xs text-[#A8988D]">· {selectedStory.source}</span>
              <span className="text-xs text-[#A8988D]">· {selectedStory.timeAgo}</span>
            </div>

            <h3 className="font-serif text-lg font-bold text-[#2B150A] leading-snug">
              {selectedStory.title}
            </h3>

            <p className="text-xs text-[#58341D] leading-relaxed">
              {selectedStory.summary}
            </p>

            <div className="pt-3 border-t border-[#E8DDD5] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#A8988D]">News24 Live South African Wire</span>
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                className="px-4 py-1.5 rounded-lg bg-[#58341D] hover:bg-[#391E0F] text-white font-medium shadow-xs"
              >
                Close Story
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Keyframes for Ticker Animation */}
      <style>{`
        @keyframes tickerSlide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </>
  );
};
