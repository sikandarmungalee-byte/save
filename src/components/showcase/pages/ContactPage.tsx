import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { SHOWCASE_CONTACT, SHOWCASE_COLLECTION } from '../showcaseData';
import { useERP } from '../../../context/ERPContext';

interface ContactPageProps {
  onNavigate: (page: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = () => {
  const { createLead } = useERP();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [subject, setSubject] = useState(SHOWCASE_COLLECTION[0].name);
  const [enquiryType, setEnquiryType] = useState('Wholesale Supply');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWhatsAppSend = async () => {
    const lines = [
      `*Savouré Artisanal Bakery — Direct Enquiry*`,
      ``,
      `Hello Savouré team, I would like to get in touch:`,
      ``,
      `*Subject / Specialty:* ${subject}`,
      `*Enquiry Type:* ${enquiryType}`,
      name.trim() ? `*Name:* ${name.trim()}` : '',
      phone.trim() ? `*Phone / WhatsApp:* ${phone.trim()}` : '',
      businessName.trim() ? `*Business / Venue:* ${businessName.trim()}` : '',
      message.trim() ? `*Message:* ${message.trim()}` : '',
      ``,
      `Please let me know how we can proceed. Thank you!`,
    ].filter(Boolean);

    const text = lines.join('\n');
    const whatsappUrl = `https://wa.me/${SHOWCASE_CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;

    try {
      await createLead({
        name: name.trim() || 'WhatsApp Contact Page Enquiry',
        companyName: businessName.trim() || 'Direct Client',
        email: email.trim(),
        phone: phone.trim(),
        status: 'NEW',
        source: 'WEBSITE',
        notes: `Contact Page: ${subject} (${enquiryType}). Notes: ${message}`,
      });
    } catch (e) {
      console.warn('CRM notice:', e);
    }

    window.open(whatsappUrl, '_blank');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !phone.trim() && !email.trim()) {
      alert('Please provide your name and contact phone or email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createLead({
        name: name.trim() || 'Direct Contact Form',
        companyName: businessName.trim() || 'Direct Client',
        email: email.trim(),
        phone: phone.trim(),
        status: 'NEW',
        source: 'WEBSITE',
        notes: `Contact Submission: ${subject} (${enquiryType}). Message: ${message}`,
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f5eee5] text-[#3d2117] px-6 sm:px-12 lg:px-20 py-20 lg:py-28 min-h-[700px]">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Heading */}
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-[0.28em] text-[#8d5037]">
            <span className="w-6 h-px bg-[#bd7657] inline-block" />
            <span>Get in touch</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-normal text-[#3d2117] leading-tight">
            We would love<br />
            to hear <em className="italic text-[#a95d3f]">from you.</em>
          </h1>

          <p className="text-sm sm:text-base text-[#66483b] leading-relaxed">
            Have a question, catering enquiry, or want to stock Savouré? Our door is always open.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Contact Channels */}
          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 rounded-3xl bg-white border border-[#bd896e]/30 space-y-6 shadow-2xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8d5037]">
                  Email us
                </span>
                <div>
                  <a
                    href={SHOWCASE_CONTACT.emailHref}
                    className="font-serif text-lg text-[#3d2117] hover:text-[#b86643] transition-colors"
                  >
                    {SHOWCASE_CONTACT.email}
                  </a>
                </div>
                <p className="text-xs text-[#66483b]">For commercial accounts & catering specs</p>
              </div>

              <div className="space-y-1 pt-4 border-t border-[#bd896e]/20">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8d5037]">
                  Call or WhatsApp
                </span>
                <div>
                  <a
                    href={SHOWCASE_CONTACT.phoneHref}
                    className="font-serif text-lg text-[#3d2117] hover:text-[#b86643] transition-colors"
                  >
                    {SHOWCASE_CONTACT.phone}
                  </a>
                </div>
                <p className="text-xs text-[#66483b]">Direct connection to bakery dispatch desk</p>
              </div>

              <div className="space-y-1 pt-4 border-t border-[#bd896e]/20">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8d5037]">
                  Distribution Coverage
                </span>
                <p className="text-sm text-[#3d2117] font-medium leading-relaxed">
                  Nationwide Delivery Across South Africa
                </p>
                <p className="text-xs text-[#66483b]">Daily refrigerated dispatch to all provinces</p>
              </div>

              <div className="space-y-1 pt-4 border-t border-[#bd896e]/20">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8d5037]">
                  Dispatch Hours
                </span>
                <p className="text-xs text-[#66483b] leading-relaxed">
                  {SHOWCASE_CONTACT.operatingHours}
                </p>
              </div>
            </div>

            {/* WhatsApp Fast Trigger */}
            <div className="p-6 rounded-3xl bg-[#ead8c6] border border-[#bd896e]/40 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-serif text-base font-normal text-[#3d2117]">Need immediate answers?</h4>
                <p className="text-xs text-[#66483b]">Chat directly with our dispatch team on WhatsApp</p>
              </div>
              <a
                href={SHOWCASE_CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xs transition-transform hover:scale-105 active:scale-95"
                aria-label="Open WhatsApp"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
              </a>
            </div>
          </div>

          {/* Right: Enquiry Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-[#bd896e]/30 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-normal text-[#3d2117]">
                  Enquiry Received
                </h3>
                <p className="text-sm text-[#66483b] max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out! Our wholesale manager will review your request and get back to you shortly.
                </p>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleWhatsAppSend}
                    className="px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Open in WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-3 rounded-full bg-[#f5eee5] hover:bg-[#ead8c6] text-[#3d2117] text-xs font-medium cursor-pointer"
                  >
                    Send another note
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitForm} className="space-y-5">
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#3d2117]">
                  Send an enquiry
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#75412e] mb-1">Your Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Fatima Patel"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f5eee5]/60 border border-[#bd896e]/30 text-xs text-[#3d2117] focus:outline-hidden focus:border-[#b86643]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#75412e] mb-1">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 082 123 4567"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f5eee5]/60 border border-[#bd896e]/30 text-xs text-[#3d2117] focus:outline-hidden focus:border-[#b86643]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#75412e] mb-1">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. fatima@example.co.za"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f5eee5]/60 border border-[#bd896e]/30 text-xs text-[#3d2117] focus:outline-hidden focus:border-[#b86643]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#75412e] mb-1">Business / Venue</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Moola Catering / Home Baker"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f5eee5]/60 border border-[#bd896e]/30 text-xs text-[#3d2117] focus:outline-hidden focus:border-[#b86643]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#75412e] mb-1">Product / Range</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f5eee5]/60 border border-[#bd896e]/30 text-xs text-[#3d2117] focus:outline-hidden focus:border-[#b86643]"
                    >
                      {SHOWCASE_COLLECTION.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.detail})
                        </option>
                      ))}
                      <option value="Complete Pastry Range">Complete Pastry Range</option>
                      <option value="Chef Tasting Samples">Chef Tasting Samples</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#75412e] mb-1">Enquiry Type</label>
                    <select
                      value={enquiryType}
                      onChange={(e) => setEnquiryType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f5eee5]/60 border border-[#bd896e]/30 text-xs text-[#3d2117] focus:outline-hidden focus:border-[#b86643]"
                    >
                      <option value="Wholesale Supply">Wholesale Supply</option>
                      <option value="Event Catering">Event Catering</option>
                      <option value="Retail Shelving">Retail Shelving</option>
                      <option value="Sample Tasting Pack">Sample Tasting Pack</option>
                      <option value="General Question">General Question</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#75412e] mb-1">Your message or volume requirements</label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your event date, required dozens/packs, or delivery location across South Africa..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f5eee5]/60 border border-[#bd896e]/30 text-xs text-[#3d2117] focus:outline-hidden focus:border-[#b86643]"
                  />
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#3d2117] hover:bg-[#2b150a] text-white text-[10px] font-bold uppercase tracking-[0.16em] transition-all cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5 text-[#d89368]" />
                    <span>Submit Enquiry</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppSend}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-[10px] font-bold uppercase tracking-[0.16em] transition-all cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Send on WhatsApp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
