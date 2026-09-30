import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Smartphone, LogIn, UserPlus, CheckCircle2, AlertCircle, X, Shield, Lock, Sparkles } from 'lucide-react';
import { User } from '../types/erp';

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, setCurrentUser, refreshData } = useERP();
  
  // Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(users.length === 0 ? 'register' : 'login');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address or username.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setCurrentUser(data.user);
      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setError('Please provide your name and email address.');
      return;
    }
    if (!regPassword) {
      setError('Please create a password for your account.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register-initial-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccessMsg('Account created successfully! Logging you in as Super Admin...');
      setCurrentUser(data.user);
      await refreshData();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Could not register user. Please try another email.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (u: User) => {
    setCurrentUser(u);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 shadow-2xl relative">
        {currentUser && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8A776B] hover:text-white hover:bg-[#221B17] transition-colors"
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
              {users.length === 0 ? 'Initial System Setup & Master Admin Account' : 'Sign in from any smartphone, tablet, or desktop'}
            </p>
          </div>
        </div>

        {/* Tab Toggle: Sign In vs Create New Account */}
        <div className="grid grid-cols-2 p-1 bg-[#120F0D] border border-[#2C211B] rounded-lg mb-5 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`py-2 rounded-md font-medium transition-colors ${
              activeTab === 'login'
                ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                : 'text-[#A69385] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                : 'text-[#A69385] hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create New Admin</span>
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: Sign In */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                Your Email Address or Username
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@savoure.co.za or custom username"
                className="w-full px-3.5 py-2.5 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#EDE6DE]">Account Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to this Device'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: Register New Admin From Scratch */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSuperAdmin} className="space-y-3">
            <div className="p-2.5 rounded-lg bg-[#221B17] border border-[#3A2D25] text-[11px] text-[#C5B7AC] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#DE9E74] shrink-0" />
              <span>Set up your personal Master Admin account from scratch with full system permissions.</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">Full Name / Display Name</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Master Administrator"
                className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#EDE6DE] mb-1">Email Address</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. yourname@savoure.co.za"
                className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#EDE6DE] mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#EDE6DE] mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating Master Admin...' : 'Create Master Account & Launch'}</span>
            </button>
          </form>
        )}

        {/* Existing Accounts Quick Switch if any users exist */}
        {users.length > 0 && (
          <div className="border-t border-[#2C211B] pt-4 mt-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A776B] mb-2 flex items-center justify-between">
              <span>Existing Team Accounts on Database</span>
              <span className="font-mono">{users.length} active</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                      isCurrent
                        ? 'bg-[#C98A5B]/15 border-[#C98A5B]/40 text-[#DE9E74] font-medium'
                        : 'bg-[#120F0D] border-[#2C211B] text-[#C5B7AC] hover:bg-[#221B17]'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold text-white truncate">{u.name}</div>
                      <div className="text-[10px] text-[#8A776B] truncate">
                        {u.email} · <span className="capitalize text-[#DE9E74]">{u.role.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-[#C98A5B]/20 text-[#DE9E74] font-semibold shrink-0">
                        Active
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#8A776B] hover:text-white shrink-0">
                        Select
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#2C211B] text-[11px] text-[#8A776B] text-center leading-relaxed">
          Secure enterprise session active across phones, tablets, and POS terminals.
        </div>
      </div>
    </div>
  );
};
