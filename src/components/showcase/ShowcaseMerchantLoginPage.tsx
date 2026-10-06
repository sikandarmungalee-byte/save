import React, { useState } from 'react';
import { ArrowLeft, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface ShowcaseMerchantLoginPageProps {
  onNavigate: (tab: string) => void;
  onLoginSuccess: () => void;
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
      await login(identifier.trim(), password.trim());
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your details or contact your branch administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#EEE6DC] py-16 md:py-24">
      <div className="mx-auto w-[min(100%-2rem,31rem)] border border-[#D5C8B9] bg-[#F9F6F0] p-7 shadow-md md:p-11 rounded-xl">
        <img
          src="/images/savoure/savoure-logo.png"
          alt="Savouré"
          className="mx-auto h-20 w-44 object-contain"
        />

        <div className="mt-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#9E582E]/10 flex items-center justify-center">
            <Lock className="size-6 text-[#9E582E]" />
          </div>
          <h1 className="mt-5 font-display text-4xl text-[#261C14]">Merchant login</h1>
          <p className="mt-3 text-sm leading-6 text-[#736254]">
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
          <label className="block text-sm font-semibold text-[#261C14]">
            Username or Email address
            <input
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-2 h-12 w-full border border-[#D5C8B9] bg-white px-4 font-normal text-[#261C14] rounded-md outline-none focus:ring-2 focus:ring-[#9E582E]"
              placeholder="e.g. merchant@savoure.co.za or merchant"
            />
          </label>

          <label className="block text-sm font-semibold text-[#261C14]">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 w-full border border-[#D5C8B9] bg-white px-4 font-normal text-[#261C14] rounded-md outline-none focus:ring-2 focus:ring-[#9E582E]"
              placeholder="Enter your merchant password"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-md bg-[#261C14] hover:bg-[#3E2C20] active:bg-[#1A120D] text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-60"
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

        <p className="mt-6 text-center text-xs leading-5 text-[#736254]">
          Need merchant account setup or branch credentials?{' '}
          <button
            onClick={() => onNavigate('contact')}
            className="font-semibold text-[#9E582E] hover:underline"
          >
            Contact our wholesale desk
          </button>
          .
        </p>

        <button
          onClick={() => onNavigate('wholesale')}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 text-xs font-semibold text-[#736254] hover:text-[#261C14] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to wholesale</span>
        </button>
      </div>
    </section>
  );
};
