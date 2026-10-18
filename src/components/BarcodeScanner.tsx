import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  Flashlight,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Volume2,
  VolumeX,
  Keyboard,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export interface BarcodeMetadata {
  barcode: string;
  isSouthAfrican: boolean;
  prefix: string;
  format: string;
  description: string;
  isValidCheckDigit: boolean;
}

// GS1 Country & South African Barcode Parser
export function parseBarcodeMetadata(rawBarcode: string): BarcodeMetadata {
  const barcode = (rawBarcode || '').trim();
  const isDigitsOnly = /^\d+$/.test(barcode);
  const isEan13 = barcode.length === 13 && isDigitsOnly;
  const isEan8 = barcode.length === 8 && isDigitsOnly;
  const isUpcA = barcode.length === 12 && isDigitsOnly;

  let isValidCheckDigit = true;
  if (isEan13) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const d = parseInt(barcode[i], 10);
      sum += i % 2 === 0 ? d : d * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    isValidCheckDigit = check === parseInt(barcode[12], 10);
  }

  // South African GS1 prefixes: 600 and 601
  const isSA = barcode.startsWith('600') || barcode.startsWith('601');
  const prefix = barcode.length >= 3 ? barcode.slice(0, 3) : '';

  let format = 'Barcode / SKU';
  if (isEan13) format = 'EAN-13';
  else if (isEan8) format = 'EAN-8';
  else if (isUpcA) format = 'UPC-A';
  else if (barcode.length > 18) format = 'QR / 2D Code';
  else if (barcode.length > 0) format = 'Code 128 / Custom';

  let description = 'Standard Product Code';
  if (isSA) {
    description = `GS1 South Africa Official Barcode (Prefix ${prefix})`;
  } else if (barcode.startsWith('0') || barcode.startsWith('1')) {
    description = 'GS1 North America (UPC-A)';
  } else if (barcode.startsWith('50')) {
    description = 'GS1 United Kingdom';
  } else if (barcode.startsWith('40') || barcode.startsWith('44')) {
    description = 'GS1 Germany';
  } else if (barcode.startsWith('20') || barcode.startsWith('29')) {
    description = 'In-Store Restrictive / Weight Embedded Barcode';
  }

  return {
    barcode,
    isSouthAfrican: isSA,
    prefix,
    format,
    description,
    isValidCheckDigit,
  };
}

// Preset South African Barcodes for Instant One-Click Testing
export const SAMPLE_SOUTH_AFRICAN_BARCODES = [
  {
    barcode: '6009800123012',
    name: 'Savouré Spring Roll Pastry (20cm / 200g)',
    category: 'Pastry Sheets',
    unit: 'packs',
    description: 'GS1 SA EAN-13 Registered Pastry',
  },
  {
    barcode: '6001007012342',
    name: 'Savouré Samoosa Pastry Sheets (500g)',
    category: 'Pastry Sheets',
    unit: 'packs',
    description: 'GS1 SA Crispy Triangle Cut Sheets',
  },
  {
    barcode: '6009612345671',
    name: 'Savouré Hand-Rolled Flaky Roti (Pack of 6)',
    category: 'Artisanal Roti',
    unit: 'packs',
    description: 'GS1 SA Layered Traditional Roti',
  },
  {
    barcode: '6002100987650',
    name: 'Savouré Tortilla Wraps 30cm (Pack of 12)',
    category: 'Tortillas & Wraps',
    unit: 'packs',
    description: 'GS1 SA Soft-Rolled Tortillas',
  },
  {
    barcode: '6001234567899',
    name: 'Supreme Unbleached Pastry Flour (25kg)',
    category: 'Flour & Grains',
    unit: 'kg',
    description: 'Bulk Ingredient Raw Material',
  },
  {
    barcode: '6009876543219',
    name: 'Pure Sunflower Frying & Laminating Oil (20L)',
    category: 'Oils & Fats',
    unit: 'litres',
    description: 'Bakery Batch Raw Material',
  },
];

interface BarcodeScannerProps {
  onScan: (barcode: string, metadata: BarcodeMetadata) => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  autoCloseOnScan?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onClose,
  title = 'Barcode Scanner & Stock Movement',
  subtitle = 'Scan South African GS1 (600/601) or standard EAN/UPC product barcodes using your phone camera',
  autoCloseOnScan = false,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = useRef(`barcode-reader-${Math.random().toString(36).substring(2, 9)}`).current;
  const lastScannedBarcodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const barcodeDetectorIntervalRef = useRef<any>(null);

  // Camera & Device State
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);

  // Manual & Fallback Input State
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState<string>('');
  const [lastScannedResult, setLastScannedResult] = useState<BarcodeMetadata | null>(null);
  const [scanCount, setScanCount] = useState<number>(0);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Synthesize modern audio chime for barcode detection
  const playScanBeep = useCallback((isSouthAfrican: boolean) => {
    if (!audioFeedback) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5

      if (isSouthAfrican) {
        // Uplifting South African chime: 880Hz -> 1320Hz
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
      }

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio context may be restricted before user gesture
    }
  }, [audioFeedback]);

  // Handle successful barcode scan with cooldown
  const handleBarcodeDetected = useCallback(
    (decodedText: string) => {
      const trimmed = decodedText.trim();
      if (!trimmed) return;

      const now = Date.now();
      // Cooldown for identical barcode: prevent 10 fires in 1 second
      if (
        trimmed === lastScannedBarcodeRef.current.code &&
        now - lastScannedBarcodeRef.current.time < 1400
      ) {
        return;
      }
      lastScannedBarcodeRef.current = { code: trimmed, time: now };

      const metadata = parseBarcodeMetadata(trimmed);
      setLastScannedResult(metadata);
      setScanCount((prev) => prev + 1);

      // Play sound & haptic vibration
      playScanBeep(metadata.isSouthAfrican);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(metadata.isSouthAfrican ? [80, 50, 120] : 100);
        } catch {
          // Ignore vibration errors
        }
      }

      onScan(trimmed, metadata);

      if (autoCloseOnScan && onClose) {
        setTimeout(() => {
          onClose();
        }, 500);
      }
    },
    [onScan, onClose, autoCloseOnScan, playScanBeep]
  );

  // Global USB / Bluetooth Handheld Barcode Scanner Wedge Listener
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is actively typing in a standard text input
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (keyBuffer.length >= 6 && /^\d+$/.test(keyBuffer)) {
          handleBarcodeDetected(keyBuffer);
          keyBuffer = '';
          if (!isInput) e.preventDefault();
        } else {
          keyBuffer = '';
        }
        return;
      }

      // Barcode scanners output characters very rapidly (< 35ms between keys)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (diff > 120) {
          keyBuffer = e.key;
        } else {
          keyBuffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBarcodeDetected]);

  // Initialize and list available cameras
  useEffect(() => {
    let mounted = true;

    async function detectCameras() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (mounted && devices && devices.length > 0) {
          setCameras(devices);
          // Prefer environment / back camera for phone barcode scanning
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      } catch (err: any) {
        console.warn('Camera detection note:', err);
      }
    }

    detectCameras();

    return () => {
      mounted = false;
    };
  }, []);

  // Start scanning when camera is ready
  const startCamera = useCallback(
    async (cameraId?: string) => {
      setCameraError(null);

      // Ensure container element exists
      const container = document.getElementById(containerId);
      if (!container) return;

      try {
        if (scannerRef.current) {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        }

        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });

        scannerRef.current = html5QrCode;

        // Camera config with resilient fallbacks
        const scanConfig = {
          fps: 25,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
            width: Math.min(Math.floor(viewfinderWidth * 0.98), 800),
            height: Math.min(Math.floor(viewfinderHeight * 0.95), 600),
          }),
          aspectRatio: 1.333333,
        };

        const onScanSuccess = (decodedText: string) => {
          handleBarcodeDetected(decodedText);
        };

        const onScanFailure = () => {
          // ignore normal non-detection frames
        };

        // Try environment camera first, then user camera if environment fails
        try {
          const primaryConfig = cameraId || { facingMode: { ideal: 'environment' } };
          await html5QrCode.start(primaryConfig, scanConfig, onScanSuccess, onScanFailure);
        } catch (initialErr) {
          console.warn('Primary camera config failed, attempting fallback:', initialErr);
          try {
            await html5QrCode.start({ facingMode: 'user' }, scanConfig, onScanSuccess, onScanFailure);
          } catch (secondaryErr) {
            // Last resort: any video device
            await html5QrCode.start(true as any, scanConfig, onScanSuccess, onScanFailure);
          }
        }

        setIsScanning(true);
        setHasPermission(true);

        // Hardware-accelerated native BarcodeDetector loop on raw video element with dual-orientation support
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            let formatsToUse = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];
            if (typeof (window as any).BarcodeDetector.getSupportedFormats === 'function') {
              try {
                const supported: string[] = await (window as any).BarcodeDetector.getSupportedFormats();
                formatsToUse = formatsToUse.filter((f) => supported.includes(f));
              } catch {
                // Keep default formats
              }
            }

            const detector = new (window as any).BarcodeDetector(
              formatsToUse.length > 0 ? { formats: formatsToUse } : undefined
            );

            // Offscreen rotation canvas for barcodes held vertically
            const rotCanvas = document.createElement('canvas');
            const rotCtx = rotCanvas.getContext('2d');

            const attachNativeScanner = () => {
              const containerEl = document.getElementById(containerId);
              const videoEl = containerEl?.querySelector('video');
              if (videoEl && videoEl.readyState >= 2) {
                if (barcodeDetectorIntervalRef.current) {
                  clearInterval(barcodeDetectorIntervalRef.current);
                }
                let tick = 0;
                barcodeDetectorIntervalRef.current = setInterval(async () => {
                  if (!videoEl || videoEl.paused || videoEl.ended || videoEl.readyState < 2) return;
                  tick++;
                  try {
                    // Direct frame detection
                    const detected = await detector.detect(videoEl);
                    if (detected && detected.length > 0) {
                      const code = detected[0].rawValue;
                      if (code) {
                        handleBarcodeDetected(code);
                        return;
                      }
                    }

                    // Every 2nd tick (~120ms), test 90-degree rotated frame for vertical barcodes
                    if (tick % 2 === 0 && rotCtx && videoEl.videoWidth > 0) {
                      const vw = videoEl.videoWidth;
                      const vh = videoEl.videoHeight;
                      rotCanvas.width = vh;
                      rotCanvas.height = vw;
                      rotCtx.save();
                      rotCtx.translate(vh / 2, vw / 2);
                      rotCtx.rotate((90 * Math.PI) / 180);
                      rotCtx.drawImage(videoEl, -vw / 2, -vh / 2);
                      rotCtx.restore();

                      const rotDetected = await detector.detect(rotCanvas);
                      if (rotDetected && rotDetected.length > 0) {
                        const code = rotDetected[0].rawValue;
                        if (code) {
                          handleBarcodeDetected(code);
                          return;
                        }
                      }
                    }
                  } catch {
                    // Ignore non-barcode frames
                  }
                }, 60);
              } else if (containerEl) {
                setTimeout(attachNativeScanner, 150);
              }
            };
            setTimeout(attachNativeScanner, 200);
          } catch (e) {
            console.warn('Native BarcodeDetector setup note:', e);
          }
        }

        // Check torch capability
        try {
          const track = (html5QrCode as any).getRunningTrackCameraCapabilities?.();
          if (track && 'torch' in track) {
            setTorchSupported(true);
          }
        } catch {
          setTorchSupported(false);
        }
      } catch (err: any) {
        console.error('Failed to start barcode camera:', err);
        setIsScanning(false);
        setHasPermission(false);
        setCameraError(
          err?.message ||
            'Camera permission was denied or device camera is currently in use. You can use manual entry or upload a photo below.'
        );
      }
    },
    [containerId, handleBarcodeDetected]
  );

  // Stop scanning
  const stopCamera = useCallback(async () => {
    if (barcodeDetectorIntervalRef.current) {
      clearInterval(barcodeDetectorIntervalRef.current);
      barcodeDetectorIntervalRef.current = null;
    }
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Camera stop cleanup warning:', err);
      }
    }
    setIsScanning(false);
    setTorchOn(false);
  }, []);

  // Effect to manage camera lifecycle
  useEffect(() => {
    if (activeMode === 'camera') {
      const timer = setTimeout(() => {
        startCamera(selectedCameraId);
      }, 200);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [activeMode, selectedCameraId, startCamera, stopCamera]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!scannerRef.current || !isScanning) return;
    try {
      const nextTorch = !torchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle not supported on this track:', err);
    }
  };

  // Switch camera
  const handleCameraChange = (camId: string) => {
    setSelectedCameraId(camId);
    if (activeMode === 'camera') {
      stopCamera().then(() => {
        startCamera(camId);
      });
    }
  };

  // Process barcode image upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setCameraError(null);

    try {
      let fileScanner = scannerRef.current;
      if (!fileScanner) {
        fileScanner = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        scannerRef.current = fileScanner;
      }

      const decodedText = await fileScanner.scanFile(file, true);
      handleBarcodeDetected(decodedText);
    } catch (err: any) {
      setCameraError('No valid barcode detected in this image. Please ensure the barcode is clear, flat, and well-lit.');
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  // Manual entry submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleBarcodeDetected(manualInput.trim());
    setManualInput('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-w-2xl w-full mx-auto animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="bg-[#301610] text-[#FFF9F0] px-5 py-4 flex items-center justify-between border-b border-[#B96F48]/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B96F48]/20 border border-[#B96F48]/50 flex items-center justify-center text-[#F5E8D5]">
            <Camera className="w-5 h-5 text-[#D7A77C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-white tracking-wide">{title}</h3>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                🇿🇦 South Africa (600/601)
              </span>
            </div>
            <p className="text-xs text-[#F5E8D5]/70 line-clamp-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            type="button"
            onClick={() => setAudioFeedback(!audioFeedback)}
            title={audioFeedback ? 'Mute scan beep' : 'Enable scan beep'}
            className="p-2 rounded-lg text-[#F5E8D5]/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            {audioFeedback ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 opacity-50" />}
          </button>

          {/* Close button if provided */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#F5E8D5]/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center border-b border-stone-200 bg-stone-50 px-4 py-2 gap-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveMode('camera')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeMode === 'camera'
              ? 'bg-[#301610] text-[#FFF9F0] shadow-sm font-semibold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          Live Phone Camera
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeMode === 'upload'
              ? 'bg-[#301610] text-[#FFF9F0] shadow-sm font-semibold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Photo / Gallery Scan
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('manual')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeMode === 'manual'
              ? 'bg-[#301610] text-[#FFF9F0] shadow-sm font-semibold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          Manual Barcode Entry
        </button>
      </div>

      {/* Main Scanner Viewport Area */}
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        {/* CAMERA MODE */}
        {activeMode === 'camera' && (
          <div className="flex flex-col gap-3">
            {/* Viewfinder Wrapper */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] w-full max-h-[380px] shadow-inner flex items-center justify-center border-2 border-stone-800">
              {/* HTML5 QR Container */}
              <div id={containerId} className="w-full h-full object-cover" />

              {/* Laser Scanning Line Animation overlay */}
              {isScanning && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  {/* Viewfinder Target Frame */}
                  <div className="w-[90%] h-[72%] border-2 border-[#B96F48] rounded-xl relative shadow-[0_0_20px_rgba(185,111,72,0.4)]">
                    {/* Corner accent markers */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />

                    {/* Animated horizontal red/copper laser line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_#ef4444] animate-pulse top-1/2 transform -translate-y-1/2" />

                    <div className="absolute bottom-2 inset-x-0 text-center">
                      <span className="text-[10px] tracking-wider font-mono text-emerald-300 bg-black/75 px-3 py-1 rounded-full border border-emerald-500/30">
                        HOLD BARCODE 10-25 CM FROM LENS
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Viewport Top Overlay Controls */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Scanner
                </span>

                <div className="flex items-center gap-1.5">
                  {torchSupported && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`p-2 rounded-full backdrop-blur-md transition-all ${
                        torchOn
                          ? 'bg-amber-400 text-stone-900 shadow-lg'
                          : 'bg-black/60 text-white/90 hover:bg-black/80'
                      }`}
                      title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                    >
                      <Flashlight className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => startCamera(selectedCameraId)}
                    className="p-2 rounded-full bg-black/60 text-white/90 hover:bg-black/80 backdrop-blur-md transition-all"
                    title="Restart / Refocus Camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Camera Error or Permission Request State */}
              {!isScanning && (
                <div className="absolute inset-0 bg-stone-900/95 flex flex-col items-center justify-center p-6 text-center text-white gap-3 z-10">
                  {cameraError ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center">
                        <CameraOff className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-red-200 max-w-sm">{cameraError}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startCamera(selectedCameraId)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                        >
                          Retry Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMode('manual')}
                          className="px-4 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-white text-xs font-bold transition-colors"
                        >
                          Use Manual Input
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 border-2 border-[#B96F48] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-stone-300">Initializing camera sensor & GS1 barcode engine...</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Camera Selector Dropdown */}
            {cameras.length > 1 && (
              <div className="flex items-center justify-between text-xs text-stone-600 bg-stone-100 px-3 py-2 rounded-xl border border-stone-200">
                <span className="font-medium flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-stone-500" /> Switch Camera:
                </span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-medium text-stone-800 focus:ring-2 focus:ring-[#B96F48] outline-none"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Camera ${c.id.substring(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* UPLOAD / GALLERY SCAN MODE */}
        {activeMode === 'upload' && (
          <div className="flex flex-col gap-3">
            <div className="border-2 border-dashed border-stone-300 rounded-2xl p-6 text-center bg-stone-50 hover:bg-stone-100/80 transition-all flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#B96F48]/10 text-[#B96F48] flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-800">Upload Barcode Photo or Receipt</h4>
                <p className="text-xs text-stone-500 max-w-sm mt-0.5">
                  Snap a picture of the product box or barcode sticker on your phone and select it here to scan.
                </p>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#301610] hover:bg-[#4a241b] text-white text-xs font-bold transition-all shadow-md">
                <Camera className="w-4 h-4 text-[#D7A77C]" />
                <span>{isProcessingFile ? 'Analyzing Barcode...' : 'Take Photo or Choose File'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isProcessingFile}
                />
              </label>

              {cameraError && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl mt-2 text-left">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MANUAL ENTRY MODE */}
        {activeMode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                Type or Paste Barcode Number / EAN-13
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. 6009800123012 or SKU"
                  className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-[#B96F48] focus:border-[#B96F48] outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#301610] hover:bg-[#4a241b] text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify & Enter
                </button>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">
                Tip: South African retail goods use 13-digit EAN-13 barcodes starting with <strong>600</strong> or <strong>601</strong>.
              </p>
            </div>
          </form>
        )}

        {/* LAST DETECTED BARCODE RESULT BANNER */}
        {lastScannedResult && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-base text-stone-900 tracking-wider">
                    {lastScannedResult.barcode}
                  </span>
                  {lastScannedResult.isSouthAfrican ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                      🇿🇦 GS1 South Africa (Prefix {lastScannedResult.prefix})
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                      {lastScannedResult.format}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 mt-0.5">{lastScannedResult.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                Scanned #{scanCount}
              </span>
            </div>
          </div>
        )}

        {/* QUICK TEST SOUTH AFRICAN BARCODES SELECTOR */}
        <div className="border-t border-stone-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#B96F48]" />
              Tap to Test South African Barcodes (GS1 600/601)
            </span>
            <span className="text-[11px] text-stone-400">Instant Demo Barcodes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {SAMPLE_SOUTH_AFRICAN_BARCODES.map((sample) => (
              <button
                key={sample.barcode}
                type="button"
                onClick={() => handleBarcodeDetected(sample.barcode)}
                className="text-left p-2.5 rounded-xl border border-stone-200 hover:border-[#B96F48] bg-white hover:bg-[#F5E8D5]/30 transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-stone-900 group-hover:text-[#301610]">
                      {sample.barcode}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      🇿🇦 SA
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 truncate mt-0.5">{sample.name}</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-stone-100 group-hover:bg-[#B96F48] group-hover:text-white flex items-center justify-center text-stone-400 transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
