import React from 'react';
import { ArrowRight, Clock3, Handshake, PackageCheck, MessageCircle } from 'lucide-react';
import { SHOWCASE_CONTACT } from './showcaseData';

interface ShowcaseWholesalePageProps {
  onNavigate: (tab: string) => void;
}

export const ShowcaseWholesalePage: React.FC<ShowcaseWholesalePageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#F9F6F0]">
      {/* Page Intro */}
      <section className="page-intro">
        <div className="page-shell">
          <p className="eyebrow">Wholesale partnerships</p>
          <h1 className="mt-5 max-w-4xl text-balance font-display text-5xl text-[#261C14] md:text-7xl">
            Quality products your customers will return for.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#736254]">
            Flexible staples, reliable supply and thoughtful service for retailers, caterers and food businesses.
          </p>
        </div>
      </section>

      {/* Main Wholesale Grid */}
      <section className="section-space">
        <div className="page-shell grid gap-14 lg:grid-cols-[1.05fr_.95fr]">
          {/* Order Requirements Column */}
          <div>
            <p className="eyebrow">Order requirements</p>
            <h2 className="mt-4 font-display text-4xl text-[#261C14] md:text-6xl">
              Start with 10 dozen<br />or 10 packs.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#736254]">
              Our minimum wholesale order applies per product line. Speak to us about larger volumes and special rate options suited to your business.
            </p>

            <div className="mt-10 grid gap-px bg-[#D5C8B9] sm:grid-cols-3 border border-[#D5C8B9]">
              <div className="bg-[#F9F6F0] p-6">
                <PackageCheck className="size-6 text-[#9E582E]" />
                <p className="mt-6 text-xs font-bold uppercase tracking-[.15em] text-[#261C14]">MOQ</p>
                <p className="mt-2 text-sm text-[#736254]">10 dozen / 10 packs</p>
              </div>

              <div className="bg-[#F9F6F0] p-6">
                <Clock3 className="size-6 text-[#9E582E]" />
                <p className="mt-6 text-xs font-bold uppercase tracking-[.15em] text-[#261C14]">Fresh production</p>
                <p className="mt-2 text-sm text-[#736254]">Lead time is required</p>
              </div>

              <div className="bg-[#F9F6F0] p-6">
                <Handshake className="size-6 text-[#9E582E]" />
                <p className="mt-6 text-xs font-bold uppercase tracking-[.15em] text-[#261C14]">Volume orders</p>
                <p className="mt-2 text-sm text-[#736254]">Special rates available</p>
              </div>
            </div>
          </div>

          {/* Wholesale Enquiry Box */}
          <aside className="bg-[#201713] p-8 text-[#F9F6F0] md:p-11 rounded-lg">
            <p className="eyebrow !text-[#DE9E74]">Wholesale enquiry</p>
            <h3 className="mt-5 font-display text-4xl">Let’s grow together.</h3>
            <p className="mt-5 text-base leading-7 text-[#F9F6F0]/70">
              Tell us what you need, your expected quantities and preferred delivery timing. Our team will help you with availability and current pricing.
            </p>

            <div className="mt-9 grid gap-3">
              <a
                href={SHOWCASE_CONTACT.emailHref}
                className="inline-flex items-center justify-between px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide text-white bg-[#9E582E] hover:bg-[#854722] transition-colors"
              >
                <span>Email our team ({SHOWCASE_CONTACT.email})</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={SHOWCASE_CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide text-white bg-[#25D366] hover:bg-[#20bd5a] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Enquiry ({SHOWCASE_CONTACT.phone})</span>
                </span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={SHOWCASE_CONTACT.phoneHref}
                className="inline-flex items-center justify-between px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide text-[#F9F6F0] border border-[#F9F6F0]/30 hover:bg-[#F9F6F0]/10 transition-colors"
              >
                <span>Call {SHOWCASE_CONTACT.phone}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <p className="mt-7 text-xs leading-5 text-[#F9F6F0]/50">
              Prices are subject to change without notice. Products are made fresh per order, so lead time is required.
            </p>
          </aside>
        </div>
      </section>

      {/* Bottom Range Banner */}
      <section className="border-y border-[#D5C8B9] bg-[#EEE6DC]">
        <div className="page-shell flex flex-col justify-between gap-6 py-12 md:flex-row md:items-center">
          <div>
            <p className="font-display text-2xl text-[#261C14]">Want to see the full range first?</p>
            <p className="mt-1 text-sm text-[#736254]">Explore all four Savouré product lines.</p>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide text-white bg-[#261C14] hover:bg-[#3D2C20] transition-colors"
          >
            <span>View product range</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
