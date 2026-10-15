import React, { useState } from 'react';
import {
  MessageCircle,
  Phone,
  Mail,
  ShieldCheck,
  Check,
  ChevronDown,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  Truck,
  CheckCircle2,
  Clock,
  Building2,
  Quote,
  HelpCircle,
  Send,
  MapPin,
  Calendar,
  User
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { SHOWCASE_CONTACT, SHOWCASE_FAQS, SHOWCASE_TESTIMONIALS, CRAFT_SPECIALTIES, CraftSpecialty } from './showcaseData';
import { WhatsAppEnquiryModal } from './WhatsAppEnquiryModal';

interface ShowcaseHomePageProps {
  onNavigate: (tab: string) => void;
  onOpenEnquiryModalWithSpecialty?: (specialtyId?: string) => void;
}

export const ShowcaseHomePage: React.FC<ShowcaseHomePageProps> = ({ onNavigate }) => {
  const { createLead } = useERP();

  // Enquiry modal state
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);

  // FAQ Accordion open states
  const [openFaqId, setOpenFaqId] = useState<string | null>('q1');

  // Inline Quick Enquiry Form State
  const [formSpecialty, setFormSpecialty] = useState(CRAFT_SPECIALTIES[0].name);
  const [formPurpose, setFormPurpose] = useState('Wholesale Supply');
  const [formVolume, setFormVolume] = useState('10 Dozens');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBusiness, setFormBusiness] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const handleOpenModal = (specId?: string) => {
    setSelectedSpecialtyId(specId || null);
    setIsEnquiryModalOpen(true);
  };

  const handleInlineWhatsApp = async () => {
    const lines = [
      `*Savouré Artisanal Bakery — Enquiry Desk*`,
      ``,
      `Hello Savouré team, I would like to enquire about placing an order:`,
      ``,
      `*Specialty Range:* ${formSpecialty}`,
      `*Purpose:* ${formPurpose}`,
      `*Estimated Volume:* ${formVolume}`,
      `*Delivery Area:* ${formArea.trim() || 'Gauteng'}`,
      `*Contact Name:* ${formName.trim() || 'Prospective Client'}`,
      formPhone.trim() ? `*Phone / WhatsApp:* ${formPhone.trim()}` : '',
      formBusiness.trim() ? `*Business / Venue:* ${formBusiness.trim()}` : '',
      formNotes.trim() ? `*Special Notes:* ${formNotes.trim()}` : '',
      ``,
      `Please let me know availability and lead time. Thank you!`,
    ].filter(Boolean);

    const message = lines.join('\n');
    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${SHOWCASE_CONTACT.whatsappNumber}?text=${encoded}`;

    // Record in CRM
    try {
      await createLead({
        name: formName.trim() || 'Website Inline Enquiry',
        companyName: formBusiness.trim() || 'Direct Enquiry',
        email: '',
        phone: formPhone.trim(),
        status: 'NEW',
        source: 'WEBSITE',
        notes: `Enquiry: ${formSpecialty} (${formPurpose}). Volume: ${formVolume}. Area: ${formArea}. Notes: ${formNotes}`,
      });
    } catch (e) {
      console.warn('CRM notice:', e);
    }

    window.open(whatsappUrl, '_blank');
  };

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() && !formPhone.trim()) {
      alert('Please enter your name or phone number so our team can reach you.');
      return;
    }

    setFormSubmitting(true);
    try {
      await createLead({
        name: formName.trim() || 'Website Form Enquiry',
        companyName: formBusiness.trim() || 'Direct Client',
        email: '',
        phone: formPhone.trim(),
        status: 'NEW',
        source: 'WEBSITE',
        notes: `Form Submission: ${formSpecialty} (${formPurpose}). Volume: ${formVolume}. Delivery Area: ${formArea}. Notes: ${formNotes}`,
      });
      setFormSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] text-[#2B150A] min-h-screen font-sans selection:bg-[#C67D5A] selection:text-white">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#1A0F0A] text-stone-200 py-2.5 px-4 text-xs border-b border-[#2B150A]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-200">🇿🇦 Handcrafted Daily in Johannesburg</span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-300">Prompt Gauteng Cold-Chain Delivery</span>
            <span className="text-stone-600 hidden md:inline">·</span>
            <span className="hidden md:inline text-emerald-400 font-medium">100% Halaal Certified</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-stone-400">
            <a
              href={SHOWCASE_CONTACT.phoneHref}
              className="hover:text-white transition-colors"
            >
              Wholesale Desk: <strong className="text-stone-200">{SHOWCASE_CONTACT.phone}</strong>
            </a>
          </div>
        </div>
      </div>

      {/* 2. GRAND EDITORIAL HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-stone-200/80 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & Call to Action */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 text-[#C67D5A] text-xs font-serif font-bold uppercase tracking-widest">
                <span>Artisanal Bakery & Culinary Craft · Gauteng</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#2B150A] leading-[1.08] text-balance">
                Handcrafted Pastry Sheets, Flaky Rotis & Artisanal Wraps.
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl font-normal">
                Dedicated wholesale pastry manufacturing for Gauteng’s premier banquet caterers, commercial kitchens, delis, and fine retail grocers. Prepared fresh daily using unbleached stone-ground flours.
              </p>

              {/* Primary Call to Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#2B150A] hover:bg-[#3D2012] text-white font-serif font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
                >
                  <span>Enquire Now</span>
                  <ArrowRight className="w-4 h-4 text-[#C67D5A]" />
                </button>

                <a
                  href={SHOWCASE_CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>WhatsApp Wholesale Desk</span>
                </a>
              </div>

              {/* Trust Credentials Bar */}
              <div className="pt-6 border-t border-stone-100 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="font-medium text-[#2B150A]">100% Halaal Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="font-medium text-[#2B150A]">Daily Gauteng Dispatch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-stone-100 text-[#C67D5A] flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <span className="font-medium text-[#2B150A]">Custom Dozens & Packs</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Artwork Presentation */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-gradient-to-b from-[#F7F2EC] to-[#EFE7DE] p-8 rounded-3xl border border-stone-200/90 shadow-lg text-center flex flex-col items-center">
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-white p-4 shadow-sm border border-stone-200/80 flex items-center justify-center overflow-hidden mb-6">
                  <img
                    src="/showcase/savoure-logo.png"
                    alt="Savouré A Taste of Tradition"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-bold text-[#2B150A]">
                    Savouré Food Manufacturing
                  </h3>
                  <p className="text-xs text-[#C67D5A] font-serif uppercase tracking-widest font-semibold">
                    Wholesale Bakery & Catering Supply
                  </p>
                </div>

                <p className="text-xs text-stone-600 mt-3 leading-relaxed">
                  Supplying Johannesburg, Sandton, Centurion, and Pretoria with consistent, chef-grade pastry sheets and artisanal flatbreads.
                </p>

                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="mt-6 w-full py-3 rounded-xl bg-white hover:bg-stone-50 text-[#2B150A] border border-stone-300 font-serif font-bold text-xs tracking-wider shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Request Product Samples or Quote</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C67D5A]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ARTISANAL SPECIALTY DISCIPLINES (NO PRODUCTS GRID, NO PRICES!) */}
      <section id="specialties" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-serif font-bold uppercase tracking-widest text-[#C67D5A]">
            Culinary Craftsmanship
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#2B150A]">
            Our Artisanal Specialties
          </h2>
          <p className="text-base text-stone-600 leading-relaxed font-normal">
            Every pastry line is formulated for high-output commercial banqueting and food service. Clean separation, zero tearing, and authentic textures.
          </p>
        </div>

        {/* 4 Deep Craft Specialty Spotlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {CRAFT_SPECIALTIES.map((spec, index) => (
            <div
              key={spec.id}
              className="bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
            >
              {/* Product Visual Container */}
              <div className="bg-gradient-to-b from-[#FBF8F4] to-[#F3ECE4] p-8 flex items-center justify-center relative border-b border-stone-100">
                <div className="w-60 h-60 sm:w-72 sm:h-72 relative flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                  <img
                    src={spec.image}
                    alt={spec.name}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
                <div className="absolute top-5 left-5 font-mono text-xs font-bold text-[#C67D5A]">
                  0{index + 1}
                </div>
                <div className="absolute top-5 right-5 text-[11px] font-serif uppercase tracking-wider text-stone-500">
                  {spec.category}
                </div>
              </div>

              {/* Specialty Details & Enquire Trigger */}
              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <h3 className="font-serif text-2xl font-bold text-[#2B150A] group-hover:text-[#C67D5A] transition-colors">
                    {spec.name}
                  </h3>
                  <div className="text-xs font-medium text-[#C67D5A] italic">
                    {spec.tagline}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {spec.description}
                  </p>

                  {/* Highlights list */}
                  <div className="pt-2 space-y-1.5">
                    {spec.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-stone-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C67D5A]" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-serif">
                      Packaging Spec
                    </span>
                    <span className="text-xs font-semibold text-[#2B150A] block">
                      {spec.packSpec}
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      {spec.sizeSpec}
                    </span>
                  </div>

                  {/* ENQUIRE NOW BUTTON (No prices) */}
                  <button
                    type="button"
                    onClick={() => handleOpenModal(spec.id)}
                    className="px-5 py-3 rounded-xl bg-[#2B150A] hover:bg-[#3D2012] active:scale-95 text-white font-serif font-bold text-xs tracking-wider shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>Enquire for This Range</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C67D5A]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. WHO WE SUPPLY / B2B FOODSERVICE CAPABILITIES */}
      <section id="wholesale" className="bg-white border-y border-stone-200/80 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-serif font-bold uppercase tracking-widest text-[#C67D5A]">
              Foodservice Partnerships
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#2B150A]">
              Who We Supply Across Gauteng
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Whether you need 50 dozen rotis every Tuesday or pallets of spring roll sheets for banquet wedding season, Savouré delivers reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-[#C67D5A] shadow-2xs">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#2B150A]">Banquet & Wedding Caterers</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                High-capacity folding resilience. Pastry sheets maintain elasticity without drying out, allowing rapid prep of thousands of portions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-[#C67D5A] shadow-2xs">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#2B150A]">Restaurants, Delis & Cafes</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Consistent portion control and quick plate turnaround. Flaky rotis and tortilla wraps heat on the flat-top in seconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-[#C67D5A] shadow-2xs">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#2B150A]">Supermarkets & Grocers</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Eye-catching retail packaging with verified barcodes, nutritional disclosures, and certified Halaal accreditation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-[#C67D5A] shadow-2xs">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#2B150A]">Custom & Private-Label</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Custom cut dimensions, specialized thicknesses, and branded packaging partnerships for food distributor networks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. QUALITY STANDARDS & CRAFTSMANSHIP */}
      <section id="standards" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-serif font-bold uppercase tracking-widest text-[#C67D5A]">
              Pristine Quality Control
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#2B150A] leading-tight">
              The Savouré Standard of Excellence
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              We uphold strict European confectionery sanitation practices blended with time-honoured South African recipes. No chemical bleaches, no dough improvisers, and no compromise.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#2B150A]">100% Halaal Certified Kitchen</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Strict SANHA-aligned standards, pure vegetarian shortenings, zero animal fats.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-[#C67D5A] flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#2B150A]">Stone-Ground High-Protein Flours</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Natural gluten development creates micro-thin sheets that resist tearing.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#2B150A]">Temperature-Controlled Gauteng Fleet</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Daily refrigerated morning dispatch ensures bakery-fresh delivery to your kitchen.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="px-6 py-3.5 rounded-xl bg-[#2B150A] hover:bg-[#3D2012] text-white font-serif font-bold text-xs tracking-wider shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Request Sample Pack for Your Kitchen</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C67D5A]" />
              </button>
            </div>
          </div>

          {/* Right Column: 4 Stat Panels */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-8 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
              <span className="font-mono text-3xl font-bold text-[#C67D5A] block">
                0%
              </span>
              <h4 className="font-serif text-base font-bold text-[#2B150A]">
                Artificial Bleaches & Improvers
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Only pure unbleached wheat flour, filtered water, sea salt, and clean shortening.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
              <span className="font-mono text-3xl font-bold text-[#C67D5A] block">
                100%
              </span>
              <h4 className="font-serif text-base font-bold text-[#2B150A]">
                Halaal Compliant Production
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Dedicated non-meat, vegetarian pastry manufacturing under rigorous daily sanitation.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
              <span className="font-mono text-3xl font-bold text-[#C67D5A] block">
                6 Mos
              </span>
              <h4 className="font-serif text-base font-bold text-[#2B150A]">
                Freezer Stability
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Freezes and thaws cleanly in original packaging without sheets fusing together.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
              <span className="font-mono text-3xl font-bold text-[#C67D5A] block">
                Daily
              </span>
              <h4 className="font-serif text-base font-bold text-[#2B150A]">
                Fresh Gauteng Deliveries
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Morning delivery slots across Johannesburg Central, Sandton, Rosebank, and Pretoria.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DEDICATED INLINE "ENQUIRE NOW" SECTION */}
      <section id="enquire" className="py-20 sm:py-28 bg-[#1F140D] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase font-serif tracking-[0.2em] text-[#E0A282] font-bold">
              Direct Factory Desk
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Enquire Now
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed">
              Tell us your catering or wholesale requirements below. Receive prompt pricing, delivery lead times, or tasting samples directly from our production desk.
            </p>
          </div>

          <div className="bg-white text-[#2B150A] rounded-3xl p-6 sm:p-10 shadow-2xl border border-stone-200">
            {formSubmitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#2B150A]">
                  Enquiry Successfully Sent!
                </h3>
                <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                  Thank you! Our wholesale manager will contact you promptly to discuss your order requirements and delivery schedule.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleInlineWhatsApp}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs tracking-wide shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Also Message on WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSubmitted(false)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-all cursor-pointer"
                  >
                    Send Another Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInlineSubmit} className="space-y-6">
                {/* 1. Range Selection */}
                <div>
                  <label className="block text-xs font-serif font-bold uppercase tracking-wider text-stone-700 mb-2">
                    1. Pastry Specialty of Interest <span className="text-[#C67D5A]">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {CRAFT_SPECIALTIES.map((spec) => {
                      const isSelected = formSpecialty === spec.name;
                      return (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => setFormSpecialty(spec.name)}
                          className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#2B150A] text-white border-[#2B150A] shadow-xs'
                              : 'bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="font-serif font-bold text-xs truncate">{spec.name}</div>
                          <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                            {spec.packSpec}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Purpose & Estimated Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-serif font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      2. Enquiry Purpose
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Wholesale Supply', 'Event Catering', 'Retail Stockist', 'Sample Tasting Pack'].map((purp) => (
                        <button
                          key={purp}
                          type="button"
                          onClick={() => setFormPurpose(purp)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                            formPurpose === purp
                              ? 'bg-[#2B150A] text-white shadow-xs'
                              : 'bg-stone-50 text-stone-700 border border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {purp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      3. Estimated Quantity
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['5 - 10 Dozens', '20 - 50 Dozens', '100+ Dozens', '10 Packs', '50 Packs', '100+ Packs'].map((vol) => (
                        <button
                          key={vol}
                          type="button"
                          onClick={() => setFormVolume(vol)}
                          className={`px-2 py-2 rounded-xl text-[11px] font-mono font-medium text-center transition-all cursor-pointer ${
                            formVolume === vol
                              ? 'bg-[#C67D5A] text-white shadow-xs'
                              : 'bg-stone-50 text-stone-700 border border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {vol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Contact & Delivery Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1 font-medium">Your Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Fatima / Chef Imran"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#C67D5A] text-[#2B150A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-stone-500 mb-1 font-medium">Contact Phone / WhatsApp</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="tel"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="e.g. 082 123 4567"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#C67D5A] text-[#2B150A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-stone-500 mb-1 font-medium">Business / Venue (if applicable)</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={formBusiness}
                        onChange={(e) => setFormBusiness(e.target.value)}
                        placeholder="e.g. Moola Banqueting / Home Baker"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#C67D5A] text-[#2B150A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-stone-500 mb-1 font-medium">Delivery Suburb / City</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={formArea}
                        onChange={(e) => setFormArea(e.target.value)}
                        placeholder="e.g. Sandton, Pretoria, Midrand..."
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#C67D5A] text-[#2B150A]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-stone-500 mb-1 font-medium">Notes / Required Event Date</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Weekly regular delivery required from Thursday."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-[#C67D5A] text-[#2B150A]"
                  />
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100">
                  <div className="text-xs text-stone-500 text-center sm:text-left">
                    Direct Bakery Enquiries: <strong className="text-[#2B150A]">{SHOWCASE_CONTACT.phone}</strong>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white hover:bg-stone-50 text-[#2B150A] border border-stone-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5 text-[#C67D5A]" />
                      <span>Submit Enquiry Form</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleInlineWhatsApp}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Send via WhatsApp</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS / CLIENT FEEDBACK */}
      <section className="py-16 sm:py-24 bg-white border-y border-stone-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-serif font-bold uppercase tracking-widest text-[#C67D5A]">
              Culinary Voices
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B150A]">
              Endorsed by Top Caterers & Artisans
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SHOWCASE_TESTIMONIALS.map((t) => (
              <div
                key={t.id}
                className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <Quote className="w-5 h-5 text-[#C67D5A]/40" />
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-200/60">
                  <div className="font-serif font-bold text-xs text-[#2B150A]">{t.author}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS SECTION */}
      <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-serif font-bold uppercase tracking-widest text-[#C67D5A]">
            Direct Answers
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B150A]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            Everything you need to know about placing wholesale enquiries and catering deliveries
          </p>
        </div>

        <div className="space-y-3">
          {SHOWCASE_FAQS.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
                >
                  <span className="font-serif text-sm sm:text-base font-bold text-[#2B150A]">
                    {faq.question}
                  </span>
                  <div className={`p-1 rounded-lg text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#C67D5A]' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick WhatsApp Callout */}
        <div className="mt-10 p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-center space-y-3">
          <h4 className="font-serif font-bold text-sm text-emerald-950">
            Have a specialized commercial requirement or urgent banquet order?
          </h4>
          <p className="text-xs text-emerald-900/80">
            Our bakery dispatch team is live on WhatsApp throughout production hours.
          </p>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Enquire on WhatsApp Now</span>
          </button>
        </div>
      </section>

      {/* 9. INTERACTIVE ENQUIRY MODAL */}
      <WhatsAppEnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        selectedSpecialtyId={selectedSpecialtyId}
      />
    </div>
  );
};
