import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { LogIn, Key, X, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, login, logout, users } = useERP();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      setSuccessMsg(`Welcome, ${user.name}!`);
      setTimeout(() => {
        setEmail('');
        setPassword('');
        setError(null);
        setSuccessMsg(null);
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E8DDD5] rounded-2xl p-6 sm:p-7 shadow-2xl relative text-[#2B150A]">
        {currentUser && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#7A685D] hover:text-[#2B150A] hover:bg-[#FAF5F0] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-xl bg-[#391E0F] border border-[#CC8468]/50 shadow-sm flex items-center justify-center text-[#E0A282] font-serif font-black text-2xl shrink-0">
            S
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-[#2B150A] tracking-wide flex items-center gap-2">
              <span>Savouré ERP</span>
              <span className="text-[10px] font-sans font-semibold uppercase px-1.5 py-0.5 rounded bg-stone-100 text-[#391E0F] border border-stone-200">
                Multi-Device
              </span>
            </h2>
            <p className="text-xs text-stone-500">
              {currentUser
                ? `Currently signed in as ${currentUser.name}`
                : 'Sign in with your enterprise credentials to access your business'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#391E0F] mb-1">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter username"
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-[#2B150A] placeholder-stone-400 focus:outline-none focus:border-[#CC8468] focus:bg-white shadow-2xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#391E0F]">Password</label>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-[#2B150A] placeholder-stone-400 focus:outline-none focus:border-[#CC8468] focus:bg-white shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-[#E0A282]" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {currentUser && (
          <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
            <span className="text-[11px] text-[#7A685D]">Signed in on this device</span>
            <button
              type="button"
              onClick={() => {
                logout();
                setError(null);
                setSuccessMsg('You have been signed out.');
              }}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
            >
              Sign Out of this Device
            </button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#E8DDD5] text-[11px] text-[#7A685D] text-center leading-relaxed">
          <span>Enterprise database synchronized across multiple devices in real-time.</span>
          <div className="mt-0.5 text-[10px] text-[#A8988D]">Only signed-in Super Admins can manage and create users.</div>
        </div>
      </div>
    </div>
  );
};
