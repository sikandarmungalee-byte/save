import React, { useState } from 'react';
import {
  ArrowLeft,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  ShieldCheck,
  Truck,
  Phone,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { SHOWCASE_CONTACT } from './showcaseData';

interface ShowcaseMerchantLoginPageProps {
  onNavigate: (tab: string) => void;
  onLoginSuccess: (user?: any) => void;
}

export const ShowcaseMerchantLoginPage: React.FC<ShowcaseMerchantLoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const { login } = useERP();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your merchant username or email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authenticatedUser = await login(identifier.trim(), password.trim());
      onLoginSuccess(authenticatedUser);
    } catch (err: any) {
      setError(
        err.message ||
          'Invalid merchant credentials. Please verify your username/password or contact our wholesale dispatch desk.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoMerchant = () => {
    setIdentifier('roksh4');
    setPassword('ROKSH4');
    setError(null);
  };

  return (
    <section className="min-h-[85vh] bg-gradient-to-b from-[#FBF7F1] via-[#F6EDE2] to-[#ECE1D3] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white border border-[#E8D9CD] shadow-2xl rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
        {/* Left Column: Brand Heritage & Trust Badges (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#2D160A] via-[#221007] to-[#170B05] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle warm ambient glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#CC8468]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E0A282]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Lockup */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/showcase/savoure-logo.png"
                alt="Savouré Artisanal Pastry"
                className="w-12 h-12 rounded-2xl object-contain bg-white/10 p-1.5 border border-[#CC8468]/40 shadow-sm"
              />
              <div>
                <span className="font-serif text-2xl font-black tracking-wider text-white block leading-none">
                  Savouré
                </span>
                <span className="text-[9px] uppercase tracking-[0.26em] text-[#DE9E74] font-semibold block mt-1">
                  A Taste of Tradition
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CC8468]/20 border border-[#CC8468]/40 text-[#E0A282] text-[11px] font-bold uppercase tracking-wider">
                <Store className="w-3.5 h-3.5" />
                <span>Commercial Merchant Desk</span>
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                Artisanal wholesale ordering made seamless.
              </h2>
              <p className="text-xs text-[#D8C7BC] leading-relaxed">
                Direct wholesale order placement, delivery tracking, statements, and digital proof of delivery (POD) for certified food retailers.
              </p>
            </div>
          </div>

          {/* Middle: Value & Quality Invariants */}
          <div className="relative z-10 py-8 space-y-3.5 border-y border-white/10 my-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 text-[#E0A282] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#DE9E74]" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">100% Halal Certified Kitchen</div>
                <div className="text-[11px] text-[#C5B7AC]">Pure vegetable shortenings & clarified butter recipe.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 text-[#E0A282] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-[#DE9E74]" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Nationwide Cold-Chain Fleet</div>
                <div className="text-[11px] text-[#C5B7AC]">Early morning store dispatch across South Africa.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 text-[#E0A282] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#DE9E74]" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Direct Live Oven Queue</div>
                <div className="text-[11px] text-[#C5B7AC]">Orders push live to head bakery production till.</div>
              </div>
            </div>
          </div>

          {/* Bottom Helpline */}
          <div className="relative z-10 pt-2 flex items-center justify-between text-xs text-[#D8C7BC]">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#DE9E74]" />
              <span className="font-mono">{SHOWCASE_CONTACT.phone}</span>
            </div>
            <a
              href={SHOWCASE_CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#DE9E74] hover:text-white flex items-center gap-1 font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>WhatsApp Desk</span>
            </a>
          </div>
        </div>

        {/* Right Column: Refined Authentication Form (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-widest text-[#8D5037]">
                  Merchant Sign-in
                </span>
                <span className="text-xs text-stone-400 font-mono">B2B Portal</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B150A] mt-1 tracking-tight">
                Welcome back to your wholesale desk
              </h1>
              <p className="text-xs text-[#66483B] mt-1">
                Enter your approved merchant credentials to place bakery orders and view account statements.
              </p>
            </div>

            {/* Quick Demo Pill Banner for Instant Login */}
            <div className="p-3.5 rounded-2xl bg-[#FBF7F1] border border-[#BD896E]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#CC8468]/20 text-[#8D5037] flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-[#8D5037]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2B150A]">Active Merchant Account Demo</div>
                  <div className="text-[11px] text-[#66483B]">Rookshana · Southern Ambision 1390 CC</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFillDemoMerchant}
                className="px-3 py-1.5 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] text-[#FFF9F0] text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
              >
                <Sparkles className="w-3 h-3 text-[#DE9E74]" />
                <span>Fill Demo Login</span>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 shadow-2xs animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#75412E] mb-1.5">
                  Merchant Username or Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. roksh4 or rookshanal@icloud.com"
                    autoComplete="username"
                    className="w-full h-12 px-4 rounded-xl bg-[#FBF7F1] border border-stone-200 focus:bg-white focus:border-[#CC8468] text-sm text-[#2B150A] placeholder-stone-400 outline-none transition-all shadow-2xs font-sans"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#75412E]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-[#8D5037] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your confidential merchant password"
                    autoComplete="current-password"
                    className="w-full h-12 px-4 rounded-xl bg-[#FBF7F1] border border-stone-200 focus:bg-white focus:border-[#CC8468] text-sm text-[#2B150A] placeholder-stone-400 outline-none transition-all shadow-2xs font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#66483B]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-[#391E0F] focus:ring-[#CC8468]"
                  />
                  <span>Keep me signed in on this device</span>
                </label>

                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="text-xs text-[#8D5037] hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#391E0F] via-[#2B150A] to-[#1C1008] hover:from-[#4C2814] hover:to-[#381B0C] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-98"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#DE9E74]" />
                    <span>Verifying Wholesale Account...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#DE9E74]" />
                    <span>Access Merchant Portal & Orders</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Assistance */}
          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7A6458]">
            <p>
              New wholesale account?{' '}
              <button
                onClick={() => onNavigate('wholesale')}
                className="font-bold text-[#8D5037] hover:underline"
              >
                Apply for wholesale terms
              </button>
            </p>

            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#2B150A] font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Savouré Website</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
