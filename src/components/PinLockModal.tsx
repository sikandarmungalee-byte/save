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
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#C98A5B] mx-auto mb-4 shadow-lg">
          <img
            src="/src/assets/images/savoure_master_logo_1790775722136.jpg"
            alt="Savouré Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <h2 className="text-2xl font-serif font-bold text-white tracking-wide mb-1">
          Savouré Confidential
        </h2>
        <p className="text-xs text-[#A69385] mb-6">
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
                    ? 'bg-red-500 scale-110 animate-shake'
                    : hasDigit
                    ? 'bg-[#DE9E74] scale-110 shadow-xs shadow-[#C98A5B]/50'
                    : 'bg-neutral-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 mb-4 animate-fadeIn">
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
              className="h-12 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white font-mono text-lg font-semibold border border-neutral-700/60 transition-colors flex items-center justify-center select-none"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-medium border border-neutral-800 transition-colors flex items-center justify-center select-none"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white font-mono text-lg font-semibold border border-neutral-700/60 transition-colors flex items-center justify-center select-none"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-medium border border-neutral-800 transition-colors flex items-center justify-center select-none"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-800">
          Default Master PIN: <span className="font-mono text-neutral-400 font-semibold">{company.pinCode || '1234'}</span> (Update in Company Settings)
        </div>
      </div>
    </div>
  );
};
