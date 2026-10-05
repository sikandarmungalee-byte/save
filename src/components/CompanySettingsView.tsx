import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { CompanySettings } from '../types/erp';
import {
  Building2,
  Save,
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

export const CompanySettingsView: React.FC = () => {
  const { company, updateCompany } = useERP();

  const [form, setForm] = useState<CompanySettings>({ ...company });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const brandLogos = [
    { name: 'Savouré Master Emblem', url: '/src/assets/images/savoure_master_logo_1790775722136.jpg' },
    { name: 'Savouré Brand Crest', url: '/src/assets/images/savoure_brand_logo_1790775476411.jpg' },
    { name: 'Savouré Script Logo', url: '/src/assets/images/savoure_logo_1790774642893.jpg' },
    { name: 'Apex Artisanal Logo', url: '/src/assets/images/apex_bakery_logo_1790773495656.jpg' },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, SVG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm(prev => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateCompany(form);
      setStatusMsg('Company profile and banking configuration successfully updated.');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={form.logoUrl || "/src/assets/images/savoure_master_logo_1790775722136.jpg"}
              alt="Savouré Logo"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#C98A5B]/60 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
                  Savouré Enterprise Configuration
                </span>
                <span className="text-[#3A2D25]">·</span>
                <span className="text-xs text-[#A69385] font-serif italic">A Taste of Tradition</span>
              </div>
              <h1 className="text-xl font-serif font-bold text-white tracking-tight">
                Company Profile & Banking Settings
              </h1>
              <p className="text-xs text-[#A69385] mt-1">
                Configure legal registration credentials, banking EFT settlement accounts, tax rates, and master PIN lock security.
              </p>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 0: Brand Logo & Emblem Management */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-[#DE9E74]">
              <ImageIcon className="w-4 h-4" />
              <span>Official Business Logo & Emblem</span>
            </h2>
            <span className="text-[11px] text-[#A69385]">Applied to all invoices & headers</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div className="relative group shrink-0">
              <img
                src={form.logoUrl || "/src/assets/images/savoure_master_logo_1790775722136.jpg"}
                alt="Current Logo"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-[#C98A5B] shadow-lg"
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#C98A5B] text-[#120F0D] text-[9px] font-bold uppercase">
                Active
              </span>
            </div>

            <div className="flex-1 space-y-3 text-left">
              <div>
                <div className="text-xs font-semibold text-white mb-1">Upload Custom Brand Logo</div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="company-logo-file-input"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="company-logo-file-input"
                    className="cursor-pointer px-3.5 py-1.5 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-xs font-semibold text-[#DE9E74] border border-[#3A2D25] flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo Image</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logoUrl: '/src/assets/images/savoure_master_logo_1790775722136.jpg' })}
                    className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white"
                  >
                    Reset to Default Emblem
                  </button>
                </div>
              </div>

              {/* Ready Brand Logo Presets */}
              <div>
                <span className="text-[10px] text-[#8A776B] uppercase font-mono block mb-1.5">
                  Or Select Official Brand Presets:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {brandLogos.map((logo) => (
                    <button
                      key={logo.name}
                      type="button"
                      onClick={() => setForm({ ...form, logoUrl: logo.url })}
                      className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs border transition-all ${
                        form.logoUrl === logo.url
                          ? 'bg-[#C98A5B]/20 border-[#C98A5B] text-white font-medium'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                      }`}
                    >
                      <img src={logo.url} alt={logo.name} className="w-5 h-5 rounded-full object-cover" />
                      <span>{logo.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 1: Legal Registration & Branding */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-[#DE9E74]">
            <Building2 className="w-4 h-4" />
            <span>Company Legal Registration & Address</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Registered Company Legal Name
              </label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Trading Name (Display on Invoices)
              </label>
              <input
                type="text"
                value={form.tradingName}
                onChange={(e) => setForm({ ...form, tradingName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Company Registration No.
              </label>
              <input
                type="text"
                value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                SARS VAT Registration No.
              </label>
              <input
                type="text"
                value={form.vatNumber}
                onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Standard VAT Rate (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={form.vatRate}
                onChange={(e) => setForm({ ...form, vatRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Physical Business / Factory Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Contact Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Accounts Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                placeholder="R"
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Banking Details for EFT Payments */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-[#DE9E74]">
            <CreditCard className="w-4 h-4" />
            <span>Bank Account Details for Direct EFT Settlements</span>
          </h2>
          <p className="text-xs text-neutral-400">
            These banking credentials appear prominently on all generated Tax Invoices so customers can settle via electronic funds transfer without delay.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Bank Name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="e.g. First National Bank (FNB)"
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Account Holder</label>
              <input
                type="text"
                value={form.accountHolder}
                onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Account Number</label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Branch Code</label>
              <input
                type="text"
                value={form.branchCode}
                onChange={(e) => setForm({ ...form, branchCode: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">SWIFT Code</label>
              <input
                type="text"
                value={form.swiftCode}
                onChange={(e) => setForm({ ...form, swiftCode: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Standard Payment Terms & Statement Instructions
            </label>
            <textarea
              rows={2}
              value={form.defaultPaymentTerms}
              onChange={(e) => setForm({ ...form, defaultPaymentTerms: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white"
            />
          </div>
        </div>

        {/* Card 3: Security PIN Lock Settings */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-[#DE9E74]">
            <Lock className="w-4 h-4" />
            <span>Confidential Access Security PIN</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Set your master 4-digit PIN for screen lock protection against shoulder-surfing on floor terminals and shared devices.
          </p>

          <div className="max-w-xs">
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              4-Digit Security Master PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={form.pinCode}
              onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
              placeholder="1234"
              className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono tracking-widest text-center text-base"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Changes...' : 'Save Company Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
