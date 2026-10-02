import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { LogIn, AlertCircle, CheckCircle2, X, Lock, KeyRound, ShieldCheck, Smartphone } from 'lucide-react';

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, login, logout, users } = useERP();

  // Login form state
  const [email, setEmail] = useState('admin@savoure.co.za');
  const [password, setPassword] = useState('Shazia');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuickFillMaster = () => {
    setEmail('admin@savoure.co.za');
    setPassword('Shazia');
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      setSuccessMsg(`Welcome back, ${user.name}!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 shadow-2xl relative">
        {currentUser && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8A776B] hover:text-white hover:bg-[#221B17] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <img
            src="/src/assets/images/savoure_master_logo_1790775722136.jpg"
            alt="Savouré Logo"
            className="w-12 h-12 rounded-full object-cover border border-[#C98A5B] shadow-md shrink-0"
          />
          <div>
            <h2 className="text-lg font-serif font-bold text-white tracking-wide flex items-center gap-2">
              <span>Savouré ERP</span>
              <span className="text-[10px] font-sans font-semibold uppercase px-1.5 py-0.5 rounded bg-[#C98A5B]/20 text-[#DE9E74] border border-[#C98A5B]/30">
                Multi-Device
              </span>
            </h2>
            <p className="text-xs text-[#A69385]">
              {currentUser
                ? `Currently signed in as ${currentUser.name}`
                : 'Sign in to access your business on any phone, tablet, or PC'}
            </p>
          </div>
        </div>

        {/* Quick Fill Master Credentials Banner */}
        <div className="p-3 mb-4 rounded-xl bg-[#221B17] border border-[#3A2D25] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C98A5B]/20 border border-[#C98A5B]/30 flex items-center justify-center text-[#DE9E74] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Master Admin Login</div>
              <div className="text-[11px] text-[#A69385] font-mono">admin@savoure.co.za · Pass: Shazia</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickFillMaster}
            className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-[#C98A5B]/20 hover:bg-[#C98A5B]/30 text-[#DE9E74] border border-[#C98A5B]/40 transition-colors shrink-0"
          >
            Auto-Fill
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-950/50 border border-red-800/70 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-lg bg-emerald-950/50 border border-emerald-800/70 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@savoure.co.za"
                className="w-full px-3.5 py-2.5 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[#EDE6DE]">Password</label>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {currentUser && (
          <div className="mt-4 pt-3 border-t border-[#2C211B] flex items-center justify-between">
            <span className="text-[11px] text-[#8A776B]">Signed in on this device</span>
            <button
              type="button"
              onClick={() => {
                logout();
                setError(null);
                setSuccessMsg('You have been signed out.');
              }}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
            >
              Sign Out of this Device
            </button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#2C211B] text-[11px] text-[#8A776B] text-center leading-relaxed">
          <span>Enterprise database synchronized across multiple devices in real-time.</span>
          <div className="mt-0.5 text-[10px] text-[#6E5B4F]">Only signed-in Super Admins can manage and create users.</div>
        </div>
      </div>
    </div>
  );
};
