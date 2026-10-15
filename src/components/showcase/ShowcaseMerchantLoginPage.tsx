import React, { useState } from 'react';
import { ArrowLeft, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your email or username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authenticatedUser = await login(identifier.trim(), password.trim());
      onLoginSuccess(authenticatedUser);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your details or contact your branch administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto w-[min(100%-2rem,31rem)] border border-stone-200 bg-white p-7 shadow-lg md:p-11 rounded-2xl">
        <div className="text-center">
          <span className="font-serif text-3xl font-extrabold tracking-[0.24em] text-[#2B150A] uppercase block">
            Savouré
          </span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-[#CC8468] font-semibold block mt-0.5">
            A Taste of Tradition
          </span>
        </div>

        <div className="mt-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#CC8468]/10 flex items-center justify-center">
            <Lock className="size-6 text-[#CC8468]" />
          </div>
          <h1 className="mt-5 font-display text-4xl text-[#2B150A]">Merchant login</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            Access for approved Savouré wholesale merchants & branch stores.
          </p>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-[#2B150A]">
            Username or Email address
            <input
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-2 h-12 w-full border border-stone-200 bg-stone-50 focus:bg-white px-4 font-normal text-[#2B150A] rounded-xl outline-none focus:ring-2 focus:ring-[#CC8468]"
              placeholder="e.g. merchant@savoure.co.za or merchant"
            />
          </label>

          <label className="block text-sm font-semibold text-[#2B150A]">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 w-full border border-stone-200 bg-stone-50 focus:bg-white px-4 font-normal text-[#2B150A] rounded-xl outline-none focus:ring-2 focus:ring-[#CC8468]"
              placeholder="Enter your merchant password"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] active:bg-black text-white font-semibold text-sm transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Log in to Merchant Portal</span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-stone-500">
          Need merchant account setup or branch credentials?{' '}
          <button
            onClick={() => onNavigate('contact')}
            className="font-semibold text-[#391E0F] hover:text-[#CC8468] hover:underline"
          >
            Contact our wholesale desk
          </button>
          .
        </p>

        <button
          onClick={() => onNavigate('wholesale')}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 text-xs font-semibold text-stone-500 hover:text-[#2B150A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to wholesale</span>
        </button>
      </div>
    </section>
  );
};
