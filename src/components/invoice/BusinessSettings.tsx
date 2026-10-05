import React, { useState, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { BusinessSettings as BusinessSettingsType } from '../../types/erp';
import {
  Building2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  Image as ImageIcon,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Landmark,
  FileText,
  RotateCcw
} from 'lucide-react';

export const BusinessSettings: React.FC = () => {
  const { businessSettings, updateBusinessSettings, syncStatus } = useERP();

  const [form, setForm] = useState<BusinessSettingsType>({ ...businessSettings });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('Image file is too large. Please select an image under 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setForm((prev) => ({ ...prev, logo: result }));
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await updateBusinessSettings(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update business settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const presetLogos = [
    { name: 'Savouré Master Emblem', url: '/src/assets/images/savoure_master_logo_1790775722136.jpg' },
    { name: 'Savouré Brand Badge', url: '/src/assets/images/savoure_brand_logo_1790775476411.jpg' },
    { name: 'Savouré Circular Stamp', url: '/src/assets/images/savoure_logo_1790774642893.jpg' },
    { name: 'Apex Heritage Seal', url: '/src/assets/images/apex_bakery_logo_1790773495656.jpg' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-serif text-[#C98A5B] font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Central Business Configuration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            Brand Identity & Invoicing Profile
          </h2>
          <p className="text-xs text-[#A69385] mt-1 max-w-2xl leading-relaxed">
            Configure your registered business credentials, bank details, logo, and invoice defaults.
            All invoices, delivery slips, and quotations dynamically reflect these settings in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving to Cloud...' : 'Save Settings'}</span>
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Business settings saved and synchronized to cloud successfully! All documents updated.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Logo & Brand Identity */}
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 space-y-6">
          <h3 className="text-sm font-serif font-bold text-white tracking-wide border-b border-[#2C211B] pb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#C98A5B]" />
            <span>Company Logo & Brand Visuals</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo Preview */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-br from-[#DE9E74] via-[#C98A5B] to-[#8C5329] shadow-md">
                <div className="w-full h-full rounded-xl overflow-hidden bg-[#FAF6F0] flex items-center justify-center">
                  {form.logo ? (
                    <img
                      src={form.logo}
                      alt="Brand Logo Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-serif text-3xl font-bold text-[#8C5329]">
                      {form.businessName?.charAt(0) || 'S'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] border border-[#3A2D25] text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4 text-[#C98A5B]" />
                  <span>Upload Custom Logo Image</span>
                </button>

                {form.logo !== businessSettings.logo && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, logo: businessSettings.logo }))}
                    className="px-3 py-2 rounded-lg text-xs text-[#A69385] hover:text-white flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Logo</span>
                  </button>
                )}
              </div>

              {/* Preset Logos */}
              <div className="pt-2">
                <label className="block text-[11px] font-medium text-[#8A776B] mb-1.5">
                  Or select from authenticated Savouré brand assets:
                </label>
                <div className="flex flex-wrap gap-2">
                  {presetLogos.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, logo: preset.url }))}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                        form.logo === preset.url
                          ? 'bg-[#C98A5B]/20 text-[#DE9E74] border-[#C98A5B]'
                          : 'bg-[#221B17] text-[#A69385] border-[#2C211B] hover:text-white'
                      }`}
                    >
                      <img src={preset.url} alt="" className="w-4 h-4 rounded-full object-cover" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Business Name, Tagline & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Business Name <span className="text-[#DE9E74]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-medium focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="e.g. A Taste of Tradition"
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Official Website
              </label>
              <input
                type="text"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://savoure.co.za"
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Official Registration */}
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 space-y-4">
          <h3 className="text-sm font-serif font-bold text-white tracking-wide border-b border-[#2C211B] pb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#C98A5B]" />
            <span>Contact & Tax Registration Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Telephone / Mobile <span className="text-[#DE9E74]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Primary Business Email <span className="text-[#DE9E74]">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                VAT Registration No
              </label>
              <input
                type="text"
                value={form.vatNumber}
                onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Company Registration No
              </label>
              <input
                type="text"
                value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
              Physical / Registered Business Address
            </label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B] leading-relaxed"
            />
          </div>
        </div>

        {/* Section 3: Banking & EFT Details */}
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 space-y-4">
          <h3 className="text-sm font-serif font-bold text-white tracking-wide border-b border-[#2C211B] pb-3 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#C98A5B]" />
            <span>Banking & Payment Instruction Configuration</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Bank Name <span className="text-[#DE9E74]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Account Holder Name <span className="text-[#DE9E74]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.accountHolder}
                onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Account Number <span className="text-[#DE9E74]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono font-semibold focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Branch Code <span className="text-[#DE9E74]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.branchCode}
                onChange={(e) => setForm({ ...form, branchCode: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                SWIFT Code (International)
              </label>
              <input
                type="text"
                value={form.swiftCode || ''}
                onChange={(e) => setForm({ ...form, swiftCode: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono font-bold focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Invoicing Defaults & Terms */}
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 space-y-4">
          <h3 className="text-sm font-serif font-bold text-white tracking-wide border-b border-[#2C211B] pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#C98A5B]" />
            <span>Document Formatting & Invoicing Defaults</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Invoice Number Prefix <span className="text-[#DE9E74]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.invoicePrefix}
                onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                placeholder="INV-"
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
              />
              <span className="text-[10px] text-[#8A776B] mt-1 block">
                Generates sequential numbers: {form.invoicePrefix}0001, {form.invoicePrefix}0002
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Default Standard VAT Rate (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={form.vatRate ?? 15}
                onChange={(e) => setForm({ ...form, vatRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Default Payment Terms Text
              </label>
              <input
                type="text"
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
              Invoice Footer & Appreciation Message
            </label>
            <input
              type="text"
              value={form.footerText}
              onChange={(e) => setForm({ ...form, footerText: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating Business Settings...' : 'Save & Propagate to All Invoices'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
