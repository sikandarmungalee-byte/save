import React, { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  Laptop,
  CheckCircle2,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Apple,
} from 'lucide-react';

interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMac: boolean;
  isWindows: boolean;
  isStandalone: boolean;
}

export const InstallAppBanner: React.FC = () => {
  const [platform, setPlatform] = useState<PlatformInfo>({
    isIOS: false,
    isAndroid: false,
    isMac: false,
    isWindows: false,
    isStandalone: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Detect Operating System
    const ua = navigator.userAgent || '';
    const plat = navigator.platform || '';

    const isIOS =
      (/iPad|iPhone|iPod/.test(ua) || (plat === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
      !(window as any).MSStream;
    const isAndroid = /android/i.test(ua);
    const isMac = /macintosh|mac os x/i.test(ua) && !isIOS;
    const isWindows = /windows|win32/i.test(ua);

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true ||
      sessionStorage.getItem('savoure_pwa_installed') === 'true';

    setPlatform({
      isIOS,
      isAndroid,
      isMac,
      isWindows,
      isStandalone,
    });

    // 2. Listen for BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      sessionStorage.setItem('savoure_pwa_installed', 'true');
      setPlatform((prev) => ({ ...prev, isStandalone: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (platform.isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        sessionStorage.setItem('savoure_pwa_installed', 'true');
        setPlatform((prev) => ({ ...prev, isStandalone: true }));
      }
      setDeferredPrompt(null);
    } else {
      // Browser already suppressed or standalone, show manual platform walkthrough
      setShowAllPlatforms(true);
    }
  };

  // If dismissed or already installed in standalone mode, show clean status pill
  if (platform.isStandalone) {
    return (
      <div className="bg-[#1C1613] border border-emerald-900/40 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
            ✓
          </div>
          <span className="font-semibold text-white">Savouré ERP Native Mode Active</span>
          <span className="text-[#A69385] hidden sm:inline">· Running standalone with offline sync</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold">
          ✔ ERP Installed
        </span>
      </div>
    );
  }

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2C211B] hover:bg-[#3A2D25] text-[#DE9E74] text-xs font-semibold border border-[#3A2D25] transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // Determine platform title & badge
  let badgeLabel = 'Desktop App';
  let buttonLabel = '📥 Install Desktop ERP App';

  if (platform.isIOS) {
    badgeLabel = '🍎 Apple iOS';
    buttonLabel = '📲 Install on iPhone / iPad';
  } else if (platform.isAndroid) {
    badgeLabel = '🤖 Android';
    buttonLabel = '📱 Install Android App';
  } else if (platform.isMac) {
    badgeLabel = '🍏 macOS App';
    buttonLabel = '📥 Install Desktop ERP App';
  } else if (platform.isWindows) {
    badgeLabel = '🪟 Windows PC';
    buttonLabel = '📥 Install Desktop ERP App';
  }

  return (
    <div className="bg-gradient-to-r from-[#241A15] via-[#1E1511] to-[#17120F] border border-[#3E291D] rounded-2xl p-4 sm:p-5 text-white shadow-xl relative overflow-hidden animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DE9E74] to-[#B86643] text-[#1E0F07] flex items-center justify-center font-bold shadow-md shrink-0">
            {platform.isIOS || platform.isAndroid ? (
              <Smartphone className="w-5 h-5 text-[#1E0F07]" />
            ) : (
              <Laptop className="w-5 h-5 text-[#1E0F07]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#DE9E74]/20 text-[#DE9E74] border border-[#DE9E74]/30">
                {badgeLabel}
              </span>
              <span className="text-xs font-mono text-[#A69385]">PWA v1.2</span>
            </div>
            <h4 className="font-serif font-bold text-sm sm:text-base text-white tracking-wide mt-0.5">
              Install Savouré ERP on this device
            </h4>
            <p className="text-xs text-[#C5B7AC] line-clamp-1">
              One-click install directly from browser — works offline with camera scanner & fast POS till.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C98A5B] to-[#995834] hover:from-[#DE9E74] hover:to-[#B86643] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{buttonLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAllPlatforms(!showAllPlatforms)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-colors"
            title="View all operating systems"
          >
            {showAllPlatforms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-2 rounded-xl text-stone-400 hover:text-white transition-colors"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cross-Platform Matrix Accordion */}
      {showAllPlatforms && (
        <div className="mt-4 pt-4 border-t border-[#3E291D] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-black/40 border border-[#3E291D] space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Apple className="w-3.5 h-3.5 text-[#DE9E74]" /> macOS (Dock App)
            </div>
            <p className="text-[11px] text-[#A69385]">
              Click the install icon in your Chrome or Safari address bar to add Savouré ERP to your Dock & Applications folder.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-[#3E291D] space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-[#DE9E74]" /> Windows 10 / 11
            </div>
            <p className="text-[11px] text-[#A69385]">
              Click the App Install icon on the right side of Microsoft Edge or Chrome address bar. Adds directly to Start Menu & Taskbar.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-[#3E291D] space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Android
            </div>
            <p className="text-[11px] text-[#A69385]">
              Tap Chrome menu (⋮) &rarr; "Install app" or "Add to Home screen". Launches in standalone full screen.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-[#3E291D] space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#DE9E74]" /> iPhone / iPad
            </div>
            <p className="text-[11px] text-[#A69385]">
              In Safari, tap the Share icon (<Share2 className="w-3 h-3 inline" />) and tap "Add to Home Screen".
            </p>
          </div>
        </div>
      )}

      {/* iOS Walkthrough Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1C1613] border border-[#3A2D25] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#3A2D25]">
              <div className="flex items-center gap-2">
                <span className="text-xl">📲</span>
                <h4 className="font-serif font-bold text-base text-white">Install on iPhone / iPad</h4>
              </div>
              <button onClick={() => setShowIOSModal(false)} className="text-stone-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#261E1A] border border-[#3A2D25]">
                <div className="w-7 h-7 rounded-xl bg-[#C98A5B] text-[#120F0D] font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <span className="font-bold text-white flex items-center gap-1">
                    Tap the Safari Share Button <Share2 className="w-3.5 h-3.5 text-[#DE9E74]" />
                  </span>
                  <span className="text-[#C5B7AC]">Located at the bottom toolbar on iPhone (or top right on iPad).</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#261E1A] border border-[#3A2D25]">
                <div className="w-7 h-7 rounded-xl bg-[#C98A5B] text-[#120F0D] font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <span className="font-bold text-white flex items-center gap-1">
                    Tap "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                  <span className="text-[#C5B7AC]">Scroll down the share sheet until you see the square plus icon.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#261E1A] border border-[#3A2D25]">
                <div className="w-7 h-7 rounded-xl bg-[#C98A5B] text-[#120F0D] font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <span className="font-bold text-white block">Tap "Add" in Top Right Corner</span>
                  <span className="text-[#C5B7AC]">Savouré ERP will launch as a standalone app with camera permissions.</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
