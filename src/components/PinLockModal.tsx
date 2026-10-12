import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Lock, Shield, AlertCircle, Delete } from 'lucide-react';

export const PinLockModal: React.FC = () => {
  const { isLocked, unlockApp, company } = useERP();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        // Attempt unlock
        const success = unlockApp(nextPin);
        if (!success) {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#CC8468] mx-auto mb-4 shadow-md bg-stone-50">
          <img
            src="/src/assets/images/savoure_master_logo_1790775722136.jpg"
            alt="Savouré Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <h2 className="text-2xl font-serif font-bold text-[#2B150A] tracking-wide mb-1">
          Savouré Confidential
        </h2>
        <p className="text-xs text-stone-500 mb-6">
          Enter 4-digit security PIN to unlock {company.tradingName || 'Savouré'}.
        </p>

        {/* Masked PIN Indicator */}
        <div className="flex justify-center items-center gap-4 mb-6">
          {[0, 1, 2, 3].map((index) => {
            const hasDigit = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 scale-110 animate-shake'
                    : hasDigit
                    ? 'bg-[#CC8468] scale-110 shadow-xs shadow-[#CC8468]/50'
                    : 'bg-stone-200'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 mb-4 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Incorrect PIN. Please re-enter.</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-[#2B150A] font-mono text-lg font-bold border border-stone-200 transition-colors flex items-center justify-center select-none shadow-2xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-[#2B150A] text-xs font-semibold border border-stone-200 transition-colors flex items-center justify-center select-none shadow-2xs"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-[#2B150A] font-mono text-lg font-bold border border-stone-200 transition-colors flex items-center justify-center select-none shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-[#2B150A] text-xs font-semibold border border-stone-200 transition-colors flex items-center justify-center select-none shadow-2xs"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] text-stone-400 pt-3 border-t border-stone-100">
          Default Master PIN: <span className="font-mono text-[#391E0F] font-bold">{company.pinCode || '1234'}</span> (Update in Company Settings)
        </div>
      </div>
    </div>
  );
};
