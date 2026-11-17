import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  X,
  Check,
  Building2,
  MapPin,
  User,
  Phone,
  Copy,
  CheckCircle2,
  ArrowRight,
  Send,
  Calendar
} from 'lucide-react';
import { SHOWCASE_CONTACT, buildLiveWebsiteProducts } from './showcaseData';
import { useERP } from '../../context/ERPContext';

interface WhatsAppEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpecialtyId?: string | null;
}

export const WhatsAppEnquiryModal: React.FC<WhatsAppEnquiryModalProps> = ({
  isOpen,
  onClose,
  selectedSpecialtyId,
}) => {
  const { createLead, products, showcaseProducts } = useERP();
  const productList = useMemo(
    () => buildLiveWebsiteProducts(products, showcaseProducts),
    [products, showcaseProducts]
  );

  const [specialtyId, setSpecialtyId] = useState<string>(
    selectedSpecialtyId || productList[0]?.id || 'general'
  );
  const [enquiryType, setEnquiryType] = useState<string>('Wholesale Supply');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (selectedSpecialtyId && productList.some((p) => p.id === selectedSpecialtyId)) {
      setSpecialtyId(selectedSpecialtyId);
    } else if (!productList.some((p) => p.id === specialtyId)) {
      setSpecialtyId(productList[0]?.id || 'general');
    }
  }, [selectedSpecialtyId, productList, specialtyId]);

  if (!isOpen) return null;

  const currentSpecialty =
    productList.find((s) => s.id === specialtyId) ||
    productList[0] || {
      id: 'general',
      name: 'General Wholesale & Catering Enquiry',
      detail: 'Custom bakery & catering supply',
    };

  // Format professional WhatsApp message text (Zero prices!)
  const generateWhatsAppMessage = () => {
    const lines = [
      `*Savouré Artisanal Bakery — Enquiry Desk*`,
      ``,
      `Hello Savouré team, I would like to enquire about placing an order:`,
      ``,
      `*Product / Specialty:* ${currentSpecialty.name}`,
      `*Enquiry Type:* ${enquiryType}`,
      ``,
      `*Delivery Area / City:* ${deliveryArea.trim() || 'South Africa (Nationwide Delivery)'}`,
      requiredDate.trim() ? `*Required Date:* ${requiredDate.trim()}` : '',
      `*Contact Person:* ${clientName.trim() || 'Prospective Client'}`,
      clientPhone.trim() ? `*Phone / WhatsApp:* ${clientPhone.trim()}` : '',
      businessName.trim() ? `*Business / Venue:* ${businessName.trim()}` : '',
      specialNotes.trim() ? `*Special Notes:* ${specialNotes.trim()}` : '',
      ``,
      `Please let me know availability, lead time, and delivery arrangements. Thank you!`,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleLaunchWhatsApp = async () => {
    setIsSending(true);
    const message = generateWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${SHOWCASE_CONTACT.whatsappNumber}?text=${encoded}`;

    // Record lead in CRM
    try {
      await createLead({
        name: clientName.trim() || 'WhatsApp Enquiry',
        companyName: businessName.trim() || 'Direct Enquiry',
        email: '',
        phone: clientPhone.trim(),
        status: 'NEW',
        source: 'WEBSITE',
        notes: `Enquiry: ${currentSpecialty.name} (${enquiryType}). Area: ${deliveryArea || 'Gauteng'}. Date: ${requiredDate}. Notes: ${specialNotes}`,
      });
    } catch (e) {
      console.warn('CRM notice:', e);
    }

    setIsSending(false);
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const handleSubmitDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() && !clientPhone.trim()) {
      alert('Please enter your name or phone number so our team can reach you.');
      return;
    }

    setIsSending(true);
    try {
      await createLead({
        name: clientName.trim(),
        companyName: businessName.trim() || 'Direct Customer',
        email: '',
        phone: clientPhone.trim(),
        status: 'NEW',
        source: 'WEBSITE',
        notes: `Website Enquiry: ${currentSpecialty.name} (${enquiryType}). Suburb: ${deliveryArea}. Required Date: ${requiredDate}. Notes: ${specialNotes}`,
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = () => {
    const msg = generateWhatsAppMessage();
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#3d2117]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#f5eee5] rounded-3xl shadow-2xl border border-[#bd896e]/40 overflow-hidden my-auto flex flex-col max-h-[92vh] text-[#3d2117]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#bd896e]/30 flex items-center justify-between bg-[#ead8c6] shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8d5037] block">
              Savouré Wholesale & Catering Desk
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#3d2117] leading-tight mt-0.5">
              Enquire now
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#75412e] hover:text-[#3d2117] hover:bg-[#dfc4ae] transition-colors cursor-pointer"
            aria-label="Close enquiry modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSubmitted ? (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#3d2117]">
              Enquiry Received
            </h3>
            <p className="text-sm text-[#66483b] max-w-md mx-auto leading-relaxed">
              Thank you! Our bakery dispatch manager will review your request for <strong>{currentSpecialty.name}</strong> and contact you promptly via WhatsApp or phone.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleLaunchWhatsApp}
                className="px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Message on WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-full bg-white hover:bg-[#ead8c6] text-[#3d2117] text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#3d2117]">
            {/* 1. Select Specialty Range (only when products exist) */}
            {productList.length > 0 ? (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8d5037] mb-2">
                  1. Select Product <span className="text-[#b86643]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {productList.map((spec) => {
                    const isSelected = spec.id === currentSpecialty.id;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => setSpecialtyId(spec.id)}
                        className={`p-3.5 rounded-2xl text-left border transition-all flex items-start justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#dfc4ae] border-[#b86643] shadow-xs'
                            : 'bg-white border-[#bd896e]/30 hover:border-[#bd896e]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-serif font-normal text-base text-[#3d2117] truncate">
                            {spec.name}
                          </div>
                          <div className="text-xs text-[#66483b] mt-0.5 truncate">
                            {spec.detail}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#b86643] text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white border border-[#bd896e]/30 text-xs text-[#66483b]">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#8d5037] mb-1">
                  1. Enquiry Subject
                </span>
                General Wholesale & Catering Enquiry — share your requirements below.
              </div>
            )}

            {/* 2. Enquiry Purpose */}
            <div className="p-4 rounded-2xl bg-white border border-[#bd896e]/30">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8d5037] mb-2">
                2. Purpose of Enquiry
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  'Wholesale Supply',
                  'Event Catering',
                  'Retail Shelving',
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEnquiryType(type)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                      enquiryType === type
                        ? 'bg-[#3d2117] text-white shadow-xs'
                        : 'bg-[#f5eee5] text-[#75412e] border border-[#bd896e]/30 hover:border-[#bd896e]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Details & Location */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8d5037]">
                3. Your Details & Location <span className="text-[#b86643]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#75412e] mb-1">Your Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Fatima Patel"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white border border-[#bd896e]/30 text-[#3d2117] focus:outline-hidden focus:border-[#b86643]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#75412e] mb-1">Phone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="e.g. 082 123 4567"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white border border-[#bd896e]/30 text-[#3d2117] focus:outline-hidden focus:border-[#b86643]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#75412e] mb-1">Business / Venue (if applicable)</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Catering Co. / Store Name"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white border border-[#bd896e]/30 text-[#3d2117] focus:outline-hidden focus:border-[#b86643]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#75412e] mb-1">Delivery Suburb / City</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={deliveryArea}
                      onChange={(e) => setDeliveryArea(e.target.value)}
                      placeholder="e.g. Cape Town, Durban, Johannesburg, Pretoria, Port Elizabeth..."
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white border border-[#bd896e]/30 text-[#3d2117] focus:outline-hidden focus:border-[#b86643]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#75412e] mb-1">Special Notes / Required Delivery Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    placeholder="e.g. Next Thursday morning / Regular weekly delivery"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white border border-[#bd896e]/30 text-[#3d2117] focus:outline-hidden focus:border-[#b86643]"
                  />
                </div>
              </div>
            </div>

            {/* Live Message Preview */}
            <div className="p-4 rounded-2xl bg-white border border-[#bd896e]/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#3d2117] flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  Preview of Enquiry Message
                </span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-xs text-[#8d5037] hover:text-[#3d2117] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="text-xs font-sans whitespace-pre-wrap text-[#66483b] leading-relaxed bg-[#f5eee5] p-3 rounded-xl border border-[#bd896e]/20">
                {generateWhatsAppMessage()}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        {!isSubmitted && (
          <div className="px-6 py-4 border-t border-[#bd896e]/30 bg-[#ead8c6] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-[#66483b] text-center sm:text-left">
              Direct desk: <strong className="text-[#3d2117]">+27 61 364 5712</strong>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSubmitDirect}
                disabled={isSending}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-[#f5eee5] text-[#3d2117] border border-[#bd896e]/40 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3 h-3 text-[#b86643]" />
                <span>Submit Form</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchWhatsApp}
                disabled={isSending}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-[10px] uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>WhatsApp Desk</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
