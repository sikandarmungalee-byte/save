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
      <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr] md:py-20">
        {/* Brand Column */}
        <div>
          <div className="bg-[#F9F6F0] p-3 inline-block rounded-md shadow-sm">
            <img
              src="/images/savoure/savoure-logo.png"
              alt="Savouré"
              className="h-16 w-44 object-contain"
            />
          </div>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#F9F6F0]/70">
            Quality products, authentic flavours and lasting partnerships. Premium flatbreads and artisanal pastries.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <a
              href={SHOWCASE_CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-semibold border border-emerald-700/50 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp: {SHOWCASE_CONTACT.phone}</span>
            </a>
          </div>
        </div>

        {/* Explore Links */}
        <div>
          <p className="eyebrow !text-[#DE9E74]">Explore</p>
          <div className="mt-5 grid gap-3 text-sm text-[#F9F6F0]/80">
            <button
              onClick={() => onNavigate('products')}
              className="text-left hover:text-white transition-colors"
            >
              Product range
            </button>
            <button
              onClick={() => onNavigate('wholesale')}
              className="text-left hover:text-white transition-colors"
            >
              Wholesale
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="text-left hover:text-white transition-colors"
            >
              Our story
            </button>
            <button
              onClick={() => onNavigate('shop')}
              className="text-left hover:text-white transition-colors"
            >
              Online shop
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="text-left hover:text-white transition-colors"
            >
              Contact
            </button>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <p className="eyebrow !text-[#DE9E74]">Contact</p>
          <div className="mt-5 grid gap-3 text-sm text-[#F9F6F0]/80">
            <a href={SHOWCASE_CONTACT.phoneHref} className="hover:text-white transition-colors">
              Tel: {SHOWCASE_CONTACT.phone}
            </a>
            <a href={SHOWCASE_CONTACT.emailHref} className="hover:text-white transition-colors">
              Email: {SHOWCASE_CONTACT.email}
            </a>
            <a href={`mailto:${SHOWCASE_CONTACT.alternateEmail}`} className="text-xs text-[#F9F6F0]/60 hover:text-white transition-colors">
              Wholesale: {SHOWCASE_CONTACT.alternateEmail}
            </a>
            
            <span className="mt-3 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Vegan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Halal
              </span>
            </span>
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

          {/* Requested Administration Button */}
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
