import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Laptop,
  CheckCircle2,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  Apple,
  Monitor,
  ExternalLink
} from 'lucide-react';

// Helper to trigger modal from any navigation bar or menu
export const openUniversalInstallModal = () => {
  window.dispatchEvent(new CustomEvent('open-savoure-install-modal'));
};

interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMac: boolean;
  isWindows: boolean;
  isStandalone: boolean;
}

export const UniversalInstallModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState<PlatformInfo>({
    isIOS: false,
    isAndroid: false,
    isMac: false,
    isWindows: false,
    isStandalone: false,
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'detected' | 'all'>('detected');

  useEffect(() => {
    // 1. Detect platform
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

    const handleOpenModal = () => setIsOpen(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('open-savoure-install-modal', handleOpenModal);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-savoure-install-modal', handleOpenModal);
    };
  }, []);

  const handleNativeTrigger = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        sessionStorage.setItem('savoure_pwa_installed', 'true');
        setPlatform((prev) => ({ ...prev, isStandalone: true }));
      }
      setDeferredPrompt(null);
    } else {
      setActiveTab('all');
    }
  };

  if (!isOpen) return null;

  let osBadge = 'Windows PC';
  let osButtonText = '📥 Install Desktop App';

  if (platform.isIOS) {
    osBadge = 'Apple iOS (iPhone / iPad)';
    osButtonText = '📲 View iOS Installation Steps';
  } else if (platform.isAndroid) {
    osBadge = 'Android Mobile & Tablet';
    osButtonText = '📱 Install Android App';
  } else if (platform.isMac) {
    osBadge = 'macOS (Desktop Window)';
    osButtonText = '📥 Install macOS Desktop App';
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#1C1613] border border-[#3A2D25] rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#3A2D25]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DE9E74] to-[#B86643] text-[#1E0F07] flex items-center justify-center font-bold shadow-md">
              <Download className="w-5 h-5 text-[#1E0F07]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Download & Install Savouré ERP</h3>
              <p className="text-xs text-[#A69385]">Install as a native standalone application on your device</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Standalone status if already installed */}
        {platform.isStandalone && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-300">Savouré ERP Native Mode Active</div>
                <div className="text-[11px] text-emerald-400/80">Already installed in standalone app window with hardware scanner access.</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
              Installed
            </span>
          </div>
        )}

        {/* Detected OS Hero Card */}
        <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-[#261E1A] to-[#1A1412] border border-[#3A2D25] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#DE9E74]/20 text-[#DE9E74] border border-[#DE9E74]/30">
              Detected: {osBadge}
            </span>
            <span className="text-xs text-[#8A776B] font-mono">PWA Gateway</span>
          </div>

          <p className="text-xs text-[#C5B7AC] leading-relaxed">
            Savouré ERP installs directly through your browser engine. It launches from your desktop, dock, or home screen in a dedicated distraction-free window with offline sync support.
          </p>

          {/* Action based on platform */}
          {platform.isIOS ? (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-[#DE9E74] uppercase tracking-wider">
                Apple Safari Installation (3 Easy Steps):
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-[#3A2D25]">
                  <span className="w-6 h-6 rounded-lg bg-[#C98A5B] text-[#120F0D] font-bold text-xs flex items-center justify-center shrink-0">1</span>
                  <span className="text-stone-200">Tap the Safari <strong>Share</strong> button (<Share2 className="w-3.5 h-3.5 inline text-[#DE9E74]" />) in the bottom toolbar.</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-[#3A2D25]">
                  <span className="w-6 h-6 rounded-lg bg-[#C98A5B] text-[#120F0D] font-bold text-xs flex items-center justify-center shrink-0">2</span>
                  <span className="text-stone-200">Scroll down and tap <strong>"Add to Home Screen"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />).</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-[#3A2D25]">
                  <span className="w-6 h-6 rounded-lg bg-[#C98A5B] text-[#120F0D] font-bold text-xs flex items-center justify-center shrink-0">3</span>
                  <span className="text-stone-200">Tap <strong>"Add"</strong> in the top right corner. Launches fullscreen with camera scanner!</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleNativeTrigger}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#C98A5B] to-[#995834] hover:from-[#DE9E74] hover:to-[#B86643] text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{osButtonText}</span>
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'all' ? 'detected' : 'all')}
                className="text-xs text-[#DE9E74] hover:underline cursor-pointer py-2"
              >
                {activeTab === 'all' ? 'Hide other platforms' : 'View instructions for other devices ▾'}
              </button>
            </div>
          )}
        </div>

        {/* All Platforms Accordion */}
        {activeTab === 'all' && (
          <div className="mt-5 pt-5 border-t border-[#3A2D25] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Universal Cross-Platform Installation Guide
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-[#3A2D25] space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <Apple className="w-4 h-4 text-[#DE9E74]" /> macOS (Apple Silicon / Intel)
                </div>
                <p className="text-[11px] text-[#A69385] leading-relaxed">
                  In Chrome or Safari, click the <strong>Install</strong> icon in the address bar (or File &rarr; Add to Dock). Packages into a standalone application window in your Dock and Applications folder.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-[#3A2D25] space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-[#DE9E74]" /> Windows 10 & 11
                </div>
                <p className="text-[11px] text-[#A69385] leading-relaxed">
                  In Microsoft Edge or Google Chrome, click the <strong>App Install icon</strong> on the right side of the address bar. Pin to Start Menu and Taskbar.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-[#3A2D25] space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" /> Android
                </div>
                <p className="text-[11px] text-[#A69385] leading-relaxed">
                  In Chrome, tap the 3-dot menu (⋮) &rarr; tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>. Provides fullscreen till layout with fast camera scanner.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-[#3A2D25] space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <Apple className="w-4 h-4 text-[#DE9E74]" /> Apple iOS (Safari)
                </div>
                <p className="text-[11px] text-[#A69385] leading-relaxed">
                  Tap Share icon (&uarr;) &rarr; scroll down &rarr; <strong>"Add to Home Screen"</strong> &rarr; tap Add.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer info & Embed gateway link */}
        <div className="mt-6 pt-4 border-t border-[#3A2D25] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8A776B]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Enterprise PWA Gateway Active</span>
          </div>
          <a
            href="/install-module.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#DE9E74] hover:text-white flex items-center gap-1 font-semibold transition-colors"
          >
            <span>Open Standalone Installer Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
