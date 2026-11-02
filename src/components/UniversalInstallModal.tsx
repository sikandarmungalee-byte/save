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
  isIframe: boolean;
  isSafari: boolean;
  isChromeOrEdge: boolean;
}

export const UniversalInstallModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState<PlatformInfo>({
    isIOS: false,
    isAndroid: false,
    isMac: false,
    isWindows: false,
    isStandalone: false,
    isIframe: false,
    isSafari: false,
    isChromeOrEdge: false,
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'detected' | 'all'>('detected');
  const [macBrowserTab, setMacBrowserTab] = useState<'safari' | 'chrome'>('safari');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // 1. Detect platform & browser details
    const ua = navigator.userAgent || '';
    const plat = navigator.platform || '';

    const isIOS =
      (/iPad|iPhone|iPod/.test(ua) || (plat === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
      !(window as any).MSStream;
    const isAndroid = /android/i.test(ua);
    const isMac = /macintosh|mac os x/i.test(ua) && !isIOS;
    const isWindows = /windows|win32/i.test(ua);
    const isIframe = window.self !== window.top;
    const isChromeOrEdge = /chrome|chromium|edg|crios/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

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
      isIframe,
      isSafari,
      isChromeOrEdge,
    });

    if (isMac) {
      setMacBrowserTab(isSafari ? 'safari' : 'chrome');
    }

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

  const handleOpenTopLevelTab = () => {
    const targetUrl = window.location.origin + '/?source=pwa';
    window.open(targetUrl, '_blank');
  };

  const handleCopyLink = () => {
    const targetUrl = window.location.origin + '/?source=pwa';
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
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
    osBadge = 'Apple Mac / MacBook (macOS)';
    osButtonText = '📥 Install macOS Desktop App';
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#1C1613] border border-[#3A2D25] rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#3A2D25]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#DE9E74] to-[#B86643] text-[#1E0F07] flex items-center justify-center font-bold shadow-md shrink-0">
              <Download className="w-5 h-5 text-[#1E0F07]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-white">Download & Install Savouré ERP</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#DE9E74]/20 text-[#DE9E74] border border-[#DE9E74]/30">
                  {osBadge}
                </span>
              </div>
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

        {/* ==================================================================== */}
        {/* MACBOOK / macOS SPECIALIZED ASSISTANT */}
        {/* ==================================================================== */}
        {platform.isMac ? (
          <div className="mt-5 space-y-4">
            {/* If in iframe banner */}
            {platform.isIframe && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <span>💡 Note for MacBook Users in Preview Mode</span>
                </div>
                <p className="text-amber-200/90 leading-relaxed">
                  Apple Safari & Google Chrome security forbids installing apps to the macOS Dock from inside an embedded preview frame. Open the direct link in your browser tab to activate 1-click installation to your Dock:
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenTopLevelTab}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#171311] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Full Browser Tab to Install</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-600/40 text-amber-200 text-xs transition-colors cursor-pointer"
                  >
                    {copiedLink ? '✓ URL Copied!' : 'Copy Direct URL'}
                  </button>
                </div>
              </div>
            )}

            {/* Mac Browser Choice Switcher */}
            <div className="flex items-center justify-between border-b border-[#3A2D25] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#DE9E74] flex items-center gap-1.5">
                <Apple className="w-4 h-4 text-[#DE9E74]" />
                <span>How to Install on your MacBook:</span>
              </span>
              <div className="flex items-center gap-1.5 bg-[#261E1A] p-1 rounded-xl border border-[#3A2D25]">
                <button
                  type="button"
                  onClick={() => setMacBrowserTab('safari')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    macBrowserTab === 'safari'
                      ? 'bg-[#C98A5B] text-[#120F0D] shadow-xs'
                      : 'text-[#A69385] hover:text-white'
                  }`}
                >
                  Apple Safari
                </button>
                <button
                  type="button"
                  onClick={() => setMacBrowserTab('chrome')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    macBrowserTab === 'chrome'
                      ? 'bg-[#C98A5B] text-[#120F0D] shadow-xs'
                      : 'text-[#A69385] hover:text-white'
                  }`}
                >
                  Chrome / Edge / Brave
                </button>
              </div>
            </div>

            {/* TAB 1: SAFARI ON MAC ("Add to Dock") */}
            {macBrowserTab === 'safari' && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#261E1A] to-[#1A1412] border border-[#3A2D25] space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>🧭 Safari on macOS (Sonoma 14+ & Sequoia 15+)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Native macOS Dock App
                  </span>
                </div>

                <p className="text-xs text-[#C5B7AC] leading-relaxed">
                  Safari lets you add any web app directly into your macOS Dock and Applications folder without App Store downloads:
                </p>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-[#3A2D25]">
                    <span className="w-6 h-6 rounded-lg bg-[#C98A5B] text-[#120F0D] font-bold text-xs flex items-center justify-center shrink-0">1</span>
                    <div className="text-stone-200">
                      In the top macOS menu bar, click <strong>File</strong> (or click the Safari <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-[#DE9E74]" /> in the top right).
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-[#3A2D25]">
                    <span className="w-6 h-6 rounded-lg bg-[#C98A5B] text-[#120F0D] font-bold text-xs flex items-center justify-center shrink-0">2</span>
                    <div className="text-stone-200">
                      Click <strong>"Add to Dock..."</strong> in the menu.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-[#3A2D25]">
                    <span className="w-6 h-6 rounded-lg bg-[#C98A5B] text-[#120F0D] font-bold text-xs flex items-center justify-center shrink-0">3</span>
                    <div className="text-stone-200">
                      Click <strong>"Add"</strong>. Savouré ERP is now placed directly in your <strong>MacBook Dock and Launchpad</strong>!
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenTopLevelTab}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C98A5B] to-[#995834] hover:from-[#DE9E74] hover:to-[#B86643] text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in Safari Window to Add to Dock</span>
                  </button>
                  <span className="text-[11px] text-[#8A776B]">
                    Runs in an isolated window with separate cookie jar and camera access.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: CHROME / EDGE ON MAC */}
            {macBrowserTab === 'chrome' && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#261E1A] to-[#1A1412] border border-[#3A2D25] space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>🌐 Google Chrome & Microsoft Edge on Mac</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Chrome App (.app bundle)
                  </span>
                </div>

                <p className="text-xs text-[#C5B7AC] leading-relaxed">
                  Chrome on macOS creates a dedicated standalone application in <code className="bg-black/50 px-1 py-0.5 rounded text-amber-200 font-mono text-[11px]">~/Applications/Chrome Apps/</code>:
                </p>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-[#3A2D25]">
                    <span className="w-6 h-6 rounded-lg bg-[#C98A5B] text-[#120F0D] font-bold text-xs flex items-center justify-center shrink-0">1</span>
                    <div className="text-stone-200">
                      Look at the <strong>right side of your Chrome URL address bar</strong> at the top of the browser.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-[#3A2D25]">
                    <span className="w-6 h-6 rounded-lg bg-[#C98A5B] text-[#120F0D] font-bold text-xs flex items-center justify-center shrink-0">2</span>
                    <div className="text-stone-200">
                      Click the <strong>Install App icon</strong> (🖥️ with a down arrow, or <em>"Install Savouré ERP"</em>).
                      <div className="text-[11px] text-[#A69385] mt-1">
                        Or click the 3-dot menu (⋮) ➔ <strong>Save and share</strong> ➔ <strong>Install Savouré ERP...</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-[#3A2D25]">
                    <span className="w-6 h-6 rounded-lg bg-[#C98A5B] text-[#120F0D] font-bold text-xs flex items-center justify-center shrink-0">3</span>
                    <div className="text-stone-200">
                      Click <strong>"Install"</strong> in the prompt. The app immediately opens in its own window and docks into your macOS Dock!
                    </div>
                  </div>
                </div>

                {deferredPrompt ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNativeTrigger}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>⚡ Install to Mac Applications Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenTopLevelTab}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C98A5B] to-[#995834] hover:from-[#DE9E74] hover:to-[#B86643] text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open in Clean Chrome Window to Install</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ==================================================================== */
          /* NON-MAC PLATFORMS (WINDOWS, ANDROID, iOS) */
          /* ==================================================================== */
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
        )}

        {/* All Platforms Accordion */}
        {(activeTab === 'all' || platform.isMac) && (
          <div className="mt-5 pt-4 border-t border-[#3A2D25] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                All Supported Operating Systems
              </h4>
              {!platform.isMac && (
                <button
                  onClick={() => setActiveTab('detected')}
                  className="text-[11px] text-[#A69385] hover:text-white"
                >
                  Close
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-[#3A2D25] space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <Apple className="w-4 h-4 text-[#DE9E74]" /> macOS (Apple Silicon / Intel)
                </div>
                <p className="text-[11px] text-[#A69385] leading-relaxed">
                  Safari: <strong>File ➔ Add to Dock...</strong>. Chrome: click <strong>Install icon</strong> in address bar. Creates a native desktop window in Dock.
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
            <span>Enterprise PWA Gateway Active (Multi-Device Sync)</span>
          </div>
          <button
            type="button"
            onClick={handleOpenTopLevelTab}
            className="text-[#DE9E74] hover:text-white flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <span>Launch Standalone Window</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

