import React from 'react';
import { ShieldCheck, MessageCircle } from 'lucide-react';
import { SHOWCASE_CONTACT } from './showcaseData';

interface ShowcaseFooterProps {
  onNavigate: (tab: string) => void;
  onOpenAdmin: () => void;
}

export const ShowcaseFooter: React.FC<ShowcaseFooterProps> = ({
  onNavigate,
  onOpenAdmin,
}) => {
  return (
    <footer className="bg-[#201713] text-[#F9F6F0]">
      <div className="page-shell grid gap-10 py-12 md:grid-cols-2 md:py-16">
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-[0.22em] text-[#F9F6F0] uppercase">
              Savouré
            </span>
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#DE9E74] font-semibold mt-0.5">
              A Taste of Tradition · South Africa
            </span>
          </div>

          <p className="max-w-md text-sm leading-relaxed text-[#F9F6F0]/70">
            Quality products, authentic flavours and lasting partnerships. Artisanal bakery kitchens producing fresh rotis, tortilla wraps, samoosa pastries, and spring roll sheets daily.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href={SHOWCASE_CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold border border-emerald-700/50 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Direct: {SHOWCASE_CONTACT.phone}</span>
            </a>
          </div>
        </div>

        {/* Direct Contact & Wholesale Information */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-serif tracking-widest text-[#DE9E74] font-bold">
            Contact & Wholesale Inquiries
          </p>
          <div className="grid gap-2.5 text-sm text-[#F9F6F0]/80">
            <div>
              <span className="text-xs text-[#DE9E74] block font-medium">Telephone Direct:</span>
              <a href={SHOWCASE_CONTACT.phoneHref} className="hover:text-white font-semibold transition-colors">
                {SHOWCASE_CONTACT.phone}
              </a>
            </div>

            <div>
              <span className="text-xs text-[#DE9E74] block font-medium">Electronic Mail:</span>
              <a href={SHOWCASE_CONTACT.emailHref} className="hover:text-white transition-colors block">
                {SHOWCASE_CONTACT.email}
              </a>
              <a href={`mailto:${SHOWCASE_CONTACT.alternateEmail}`} className="text-xs text-[#F9F6F0]/60 hover:text-white transition-colors">
                Wholesale Desk: {SHOWCASE_CONTACT.alternateEmail}
              </a>
            </div>

            <div className="pt-2 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Vegan Options
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Halal Certified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar with Administration Entrypoint */}
      <div className="border-t border-[#F9F6F0]/15 bg-[#17110D]">
        <div className="page-shell flex flex-col gap-4 py-5 text-xs text-[#F9F6F0]/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span>© 2026 Savouré. All rights reserved.</span>
            <span className="hidden sm:inline text-[#F9F6F0]/30">·</span>
            <span className="italic">A taste of tradition.</span>
          </div>

          {/* Administration Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2E2017] hover:bg-[#3E2C20] text-[#DE9E74] hover:text-[#F3D2BF] font-semibold text-xs border border-[#C98A5B]/30 transition-all shadow-sm group"
              title="Access Savouré Enterprise Administration & Operations Portal"
            >
              <ShieldCheck className="w-4 h-4 text-[#C98A5B] group-hover:scale-110 transition-transform" />
              <span>Administration</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
