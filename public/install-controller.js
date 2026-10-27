/**
 * Savouré ERP — Cross-Platform PWA & Desktop/Mobile Install Controller
 * Detects Windows, macOS, Android, iOS and handles native prompts & walk-through modals.
 */

(function () {
  'use strict';

  // 1. Detect Host Operating System & Browser Environment
  function detectClientPlatform() {
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const platform = navigator.platform || '';

    const isIOS =
      (/iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
      !window.MSStream;

    const isAndroid = /android/i.test(ua);
    const isMac = /macintosh|mac os x/i.test(ua) && !isIOS;
    const isWindows = /windows|win32/i.test(ua);

    // Standalone check (PWA already installed and running as native window)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.navigator['standalone'] === true;

    return {
      isIOS,
      isAndroid,
      isMac,
      isWindows,
      isDesktop: isMac || isWindows,
      isStandalone,
    };
  }

  // 2. Global State for BeforeInstallPrompt
  let deferredInstallPrompt = null;
  const platform = detectClientPlatform();

  // Register native install prompt listener (Chromium / Edge / Chrome on Windows, macOS, Android)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    renderInstallWidget();
  });

  // Track successful appinstalled event
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    sessionStorage.setItem('savoure_pwa_installed', 'true');
    renderInstallWidget();
  });

  // 3. Render and Bind the Widget
  function renderInstallWidget() {
    const container = document.getElementById('savoure-install-module');
    if (!container) return;

    // A. If already running as standalone application
    if (platform.isStandalone || sessionStorage.getItem('savoure_pwa_installed') === 'true') {
      container.innerHTML = `
        <div class="bg-[#1C1613] border border-[#3A2D25] rounded-2xl p-5 text-white shadow-xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div class="font-bold text-sm text-white">Savouré ERP Native Mode</div>
              <div class="text-xs text-[#A69385]">Running standalone with hardware scanner & offline support</div>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono">
            ✔ ERP Installed in App Mode
          </span>
        </div>
      `;
      return;
    }

    // B. Build UI based on detected OS
    let installActionHTML = '';
    let platformBadge = '';
    let platformDesc = '';

    if (platform.isIOS) {
      platformBadge = '🍎 Apple iOS (iPhone / iPad)';
      platformDesc = 'Run full-screen from your Home Screen with camera scanner permissions.';
      installActionHTML = `
        <button id="btn-trigger-ios" class="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#D7A77C] to-[#C98A5B] hover:from-[#E2B792] hover:to-[#DE9E74] text-[#1E0F07] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer">
          <span>📲 Install on iPhone / iPad</span>
        </button>
      `;
    } else if (platform.isAndroid) {
      platformBadge = '🤖 Android (Mobile & Tablet)';
      platformDesc = 'Install Savouré counter app for instant barcode scanning and till receipts.';
      installActionHTML = `
        <button id="btn-trigger-native" class="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer">
          <span>📱 Install Android App</span>
        </button>
      `;
    } else if (platform.isMac) {
      platformBadge = '🍏 macOS (Apple Silicon & Intel)';
      platformDesc = 'Installs into your Applications folder & macOS Dock as a dedicated window.';
      installActionHTML = `
        <button id="btn-trigger-native" class="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#C98A5B] to-[#995834] hover:from-[#DE9E74] hover:to-[#B86643] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer">
          <span>📥 Install Desktop ERP App</span>
        </button>
      `;
    } else {
      // Windows / PC default
      platformBadge = '🪟 Windows (10 / 11 Desktop)';
      platformDesc = 'Installs to Windows Start Menu & Taskbar without administrator rights.';
      installActionHTML = `
        <button id="btn-trigger-native" class="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#C98A5B] to-[#995834] hover:from-[#DE9E74] hover:to-[#B86643] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer">
          <span>📥 Install Desktop ERP App</span>
        </button>
      `;
    }

    container.innerHTML = `
      <div class="bg-gradient-to-br from-[#221B17] via-[#1A1412] to-[#120F0D] border border-[#3A2D25] rounded-3xl p-6 sm:p-7 text-white shadow-2xl relative overflow-hidden">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div class="space-y-2 max-w-xl">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-[#DE9E74]/20 text-[#DE9E74] border border-[#DE9E74]/30 text-[10px] font-bold uppercase tracking-wider">
                ${platformBadge}
              </span>
              <span class="text-xs text-[#8A776B]">· Offline Capable PWA</span>
            </div>
            <h3 class="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              Download & Install Savouré ERP
            </h3>
            <p class="text-xs sm:text-sm text-[#C5B7AC] leading-relaxed">
              ${platformDesc} No app store downloads required — installs directly from your web browser with offline data sync.
            </p>
          </div>

          <div class="shrink-0 flex flex-col sm:flex-row items-center gap-3">
            ${installActionHTML}
            <button id="btn-show-all-platforms" class="px-4 py-2 text-xs font-semibold text-[#C5B7AC] hover:text-white transition-colors cursor-pointer">
              Other Operating Systems ▾
            </button>
          </div>
        </div>

        <!-- Universal Cross-Platform Matrix Modal / Accordion -->
        <div id="all-platforms-drawer" class="hidden mt-6 pt-5 border-t border-[#3A2D25] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div class="p-3.5 rounded-2xl bg-black/40 border border-[#3A2D25] space-y-1">
            <div class="font-bold text-white flex items-center gap-1.5">🍏 macOS</div>
            <div class="text-[#A69385] text-[11px]">Click install in Safari or Chrome URL bar &rarr; "Install Savouré ERP".</div>
          </div>
          <div class="p-3.5 rounded-2xl bg-black/40 border border-[#3A2D25] space-y-1">
            <div class="font-bold text-white flex items-center gap-1.5">🪟 Windows</div>
            <div class="text-[#A69385] text-[11px]">Click the App Install icon (right side of address bar in Edge or Chrome).</div>
          </div>
          <div class="p-3.5 rounded-2xl bg-black/40 border border-[#3A2D25] space-y-1">
            <div class="font-bold text-white flex items-center gap-1.5">🤖 Android</div>
            <div class="text-[#A69385] text-[11px]">Chrome menu (&vellip;) &rarr; "Install app" or "Add to Home screen".</div>
          </div>
          <div class="p-3.5 rounded-2xl bg-black/40 border border-[#3A2D25] space-y-1">
            <div class="font-bold text-white flex items-center gap-1.5">🍎 iOS (Safari)</div>
            <div class="text-[#A69385] text-[11px]">Tap Share icon (<span class="font-mono">&uarr;</span>) &rarr; "Add to Home Screen".</div>
          </div>
        </div>
      </div>

      <!-- iOS Walkthrough Modal -->
      <div id="ios-guide-modal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-[#1C1613] border border-[#3A2D25] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white animate-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between pb-3 border-b border-[#3A2D25]">
            <div class="flex items-center gap-2">
              <span class="text-xl">📲</span>
              <h4 class="font-serif font-bold text-base text-white">Install on iPhone / iPad</h4>
            </div>
            <button id="close-ios-modal" class="text-stone-400 hover:text-white p-1">✕</button>
          </div>

          <div class="space-y-4 text-xs">
            <div class="flex items-start gap-3 p-3 rounded-2xl bg-[#261E1A] border border-[#3A2D25]">
              <div class="w-7 h-7 rounded-xl bg-[#C98A5B] text-[#120F0D] font-bold flex items-center justify-center shrink-0">1</div>
              <div>
                <span class="font-bold text-white block">Tap the Safari Share Button</span>
                <span class="text-[#C5B7AC]">Located at the bottom of your iPhone screen (or top right on iPad).</span>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 rounded-2xl bg-[#261E1A] border border-[#3A2D25]">
              <div class="w-7 h-7 rounded-xl bg-[#C98A5B] text-[#120F0D] font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <span class="font-bold text-white block">Scroll and tap "Add to Home Screen"</span>
                <span class="text-[#C5B7AC]">Look for the square icon with a plus (<span class="font-mono">+</span>) symbol.</span>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 rounded-2xl bg-[#261E1A] border border-[#3A2D25]">
              <div class="w-7 h-7 rounded-xl bg-[#C98A5B] text-[#120F0D] font-bold flex items-center justify-center shrink-0">3</div>
              <div>
                <span class="font-bold text-white block">Tap "Add" in Top Right</span>
                <span class="text-[#C5B7AC]">The Savouré ERP icon will appear on your home screen ready for offline use.</span>
              </div>
            </div>
          </div>

          <button id="done-ios-modal" class="w-full py-3 rounded-xl bg-[#C98A5B] text-[#120F0D] font-bold text-xs uppercase tracking-wider">
            Understood
          </button>
        </div>
      </div>
    `;

    // 4. Attach Event Listeners
    const btnNative = document.getElementById('btn-trigger-native');
    if (btnNative) {
      btnNative.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          const { outcome } = await deferredInstallPrompt.userChoice;
          if (outcome === 'accepted') {
            sessionStorage.setItem('savoure_pwa_installed', 'true');
            renderInstallWidget();
          }
          deferredInstallPrompt = null;
        } else {
          // If browser has already handled or blocked prompt, show manual instructions
          const drawer = document.getElementById('all-platforms-drawer');
          if (drawer) drawer.classList.toggle('hidden');
        }
      });
    }

    const btnIOS = document.getElementById('btn-trigger-ios');
    const iosModal = document.getElementById('ios-guide-modal');
    const closeIosModal = document.getElementById('close-ios-modal');
    const doneIosModal = document.getElementById('done-ios-modal');

    if (btnIOS && iosModal) {
      btnIOS.addEventListener('click', () => iosModal.classList.remove('hidden'));
    }
    if (closeIosModal && iosModal) {
      closeIosModal.addEventListener('click', () => iosModal.classList.add('hidden'));
    }
    if (doneIosModal && iosModal) {
      doneIosModal.addEventListener('click', () => iosModal.classList.add('hidden'));
    }

    const btnDrawer = document.getElementById('btn-show-all-platforms');
    const drawer = document.getElementById('all-platforms-drawer');
    if (btnDrawer && drawer) {
      btnDrawer.addEventListener('click', () => {
        drawer.classList.toggle('hidden');
      });
    }
  }

  // 5. Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderInstallWidget);
  } else {
    renderInstallWidget();
  }

  // Register service worker if supported
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[PWA] Service Worker active with scope:', reg.scope))
        .catch((err) => console.warn('[PWA] Service Worker registration note:', err));
    });
  }
})();
