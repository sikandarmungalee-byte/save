import React from 'react';
import { ArrowRight, Mail, Phone, MessageCircle } from 'lucide-react';
import { SHOWCASE_CONTACT } from './showcaseData';

interface ShowcaseContactPageProps {
  onNavigate: (tab: string) => void;
}

export const ShowcaseContactPage: React.FC<ShowcaseContactPageProps> = () => {
  return (
    <div className="bg-[#F9F6F0]">
      {/* Page Intro */}
      <section className="page-intro">
        <div className="page-shell">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-5 max-w-4xl text-balance font-display text-5xl text-[#261C14] md:text-7xl">
            Let’s talk food, orders and possibilities.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#736254]">
            Whether you’re looking for products, wholesale supply or merchant support, we’d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Cards Grid */}
      <section className="section-space">
        <div className="page-shell grid gap-8 md:grid-cols-3">
          {/* Card 1: Call us */}
          <a
            href={SHOWCASE_CONTACT.phoneHref}
            className="group border border-[#D5C8B9] p-8 transition-all hover:bg-[#EEE6DC] hover:border-[#9E582E] md:p-10 rounded-lg flex flex-col justify-between"
          >
            <div>
              <Phone className="size-6 text-[#9E582E]" />
              <p className="eyebrow mt-8">Call us</p>
              <h2 className="mt-3 font-display text-2xl text-[#261C14] md:text-3xl font-semibold">
                {SHOWCASE_CONTACT.phone}
              </h2>
            </div>
            <span className="mt-7 flex items-center gap-2 text-sm font-semibold text-[#9E582E] group-hover:translate-x-1 transition-transform">
              <span>Start a conversation</span>
              <ArrowRight className="size-4" />
            </span>
          </a>

          {/* Card 2: WhatsApp us (Direct requested feature!) */}
          <a
            href={SHOWCASE_CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group border-2 border-emerald-500/40 bg-emerald-50/40 p-8 transition-all hover:bg-emerald-100/50 hover:border-emerald-600 md:p-10 rounded-lg flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="inline-flex p-2.5 rounded-full bg-[#25D366] text-white">
                <MessageCircle className="size-6 fill-white" />
              </div>
              <p className="eyebrow mt-6 !text-emerald-800">WhatsApp direct</p>
              <h2 className="mt-3 font-display text-2xl text-[#1E3A2F] md:text-3xl font-semibold">
                {SHOWCASE_CONTACT.phone}
              </h2>
            </div>
            <span className="mt-7 flex items-center gap-2 text-sm font-semibold text-emerald-800 group-hover:translate-x-1 transition-transform">
              <span>Chat on WhatsApp</span>
              <ArrowRight className="size-4 text-emerald-700" />
            </span>
          </a>

          {/* Card 3: Email us */}
          <a
            href={SHOWCASE_CONTACT.emailHref}
            className="group border border-[#D5C8B9] p-8 transition-all hover:bg-[#EEE6DC] hover:border-[#9E582E] md:p-10 rounded-lg flex flex-col justify-between"
          >
            <div>
              <Mail className="size-6 text-[#9E582E]" />
              <p className="eyebrow mt-8">Email us</p>
              <h2 className="mt-3 break-all font-display text-2xl text-[#261C14] md:text-3xl font-semibold">
                {SHOWCASE_CONTACT.email}
              </h2>
            </div>
            <span className="mt-7 flex items-center gap-2 text-sm font-semibold text-[#9E582E] group-hover:translate-x-1 transition-transform">
              <span>Send an enquiry</span>
              <ArrowRight className="size-4" />
            </span>
          </a>
        </div>

        {/* Alternate wholesale email notice */}
        <div className="page-shell mt-10 border-l-2 border-[#9E582E] py-2 pl-6">
          <p className="text-sm text-[#736254]">
            Wholesale orders and dispatch documents can also be sent directly to{' '}
            <a
              href={`mailto:${SHOWCASE_CONTACT.alternateEmail}`}
              className="font-semibold text-[#261C14] underline hover:text-[#9E582E]"
            >
              {SHOWCASE_CONTACT.alternateEmail}
            </a>
            .
          </p>
        </div>
      </section>

      {/* Dark Footer Banner */}
      <section className="bg-[#201713] text-[#F9F6F0]">
        <div className="page-shell flex flex-col justify-between gap-8 py-16 md:flex-row md:items-center">
          <div>
            <p className="eyebrow !text-[#DE9E74]">Wholesale partners</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl font-normal">
              Minimum order: 10 dozen / 10 packs
            </h2>
          </div>
          <a
            href={SHOWCASE_CONTACT.emailHref}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold tracking-wide text-white bg-[#9E582E] hover:bg-[#854722] transition-colors"
          >
            <span>Request wholesale details</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
};
