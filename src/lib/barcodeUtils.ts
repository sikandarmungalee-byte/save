/**
 * South African Barcode Utility & GS1 EAN-13 Standards Engine
 * Handles GS1 South Africa prefix validation (600 - 601), modulo-10 checksum,
 * scanner audio feedback, and bakery catalog barcode mapping.
 */

export interface BarcodeParseResult {
  raw: string;
  clean: string;
  isSouthAfrican: boolean;
  isValidCheckDigit: boolean;
  format: 'EAN-13' | 'EAN-8' | 'CODE-128' | 'CODE-39' | 'UPC-A' | 'QR-CODE' | 'INTERNAL-SKU';
  country: string;
  prefix: string;
  description: string;
}

/**
 * Checks whether the barcode has the official GS1 South Africa country prefix (600 or 601).
 */
export function isSouthAfricanBarcode(barcode: string): boolean {
  if (!barcode) return false;
  const clean = barcode.trim().replace(/[-\s]/g, '');
  return clean.startsWith('600') || clean.startsWith('601');
}

/**
 * Verifies standard GS1 modulo-10 check digit for 13-digit EAN barcodes.
 */
export function validateEan13CheckDigit(barcode: string): boolean {
  const clean = barcode.trim().replace(/[-\s]/g, '');
  if (!/^\d{13}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(clean[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  const actualCheckDigit = parseInt(clean[12], 10);

  return expectedCheckDigit === actualCheckDigit;
}

/**
 * Formats 13-digit EAN code into readable GS1 grouping: 600-XXXX-XXXXX-X
 */
export function formatBarcodeDisplay(barcode: string): string {
  if (!barcode) return '';
  const clean = barcode.trim().replace(/[-\s]/g, '');
  if (clean.length === 13 && /^\d+$/.test(clean)) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 12)}-${clean.slice(12)}`;
  }
  return barcode;
}

/**
 * Parse and diagnose any scanned barcode with detailed South African GS1 intelligence.
 */
export function parseBarcode(barcode: string): BarcodeParseResult {
  const raw = barcode || '';
  const clean = raw.trim().replace(/[-\s]/g, '');
  const isDigitsOnly = /^\d+$/.test(clean);
  const isSA = clean.startsWith('600') || clean.startsWith('601');

  let format: BarcodeParseResult['format'] = 'INTERNAL-SKU';
  let isValidCheckDigit = false;

  if (isDigitsOnly && clean.length === 13) {
    format = 'EAN-13';
    isValidCheckDigit = validateEan13CheckDigit(clean);
  } else if (isDigitsOnly && clean.length === 8) {
    format = 'EAN-8';
    isValidCheckDigit = true;
  } else if (isDigitsOnly && clean.length === 12) {
    format = 'UPC-A';
    isValidCheckDigit = true;
  } else if (clean.length > 3 && (clean.includes('-') || clean.startsWith('ROT') || clean.startsWith('SAV') || clean.startsWith('STK'))) {
    format = 'INTERNAL-SKU';
    isValidCheckDigit = true;
  } else {
    format = 'CODE-128';
    isValidCheckDigit = true;
  }

  let country = 'International / Internal';
  let description = 'Standard Barcode Format';

  if (isSA) {
    country = 'South Africa';
    description = isValidCheckDigit
      ? 'Verified South African Retail Barcode (Prefix 600/601)'
      : 'South African prefix detected';
  } else if (clean.startsWith('00') || clean.startsWith('01') || clean.startsWith('02')) {
    country = 'United States / Canada';
  } else if (clean.startsWith('50')) {
    country = 'United Kingdom';
  }

  return {
    raw,
    clean,
    isSouthAfrican: isSA,
    isValidCheckDigit,
    format,
    country,
    prefix: clean.slice(0, 3),
    description,
  };
}

/**
 * High-precision auditory feedback for warehouse scanner confirmation (Web Audio API)
 */
export function playBarcodeBeep(success: boolean = true) {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      // Crisp 1850Hz POS scanner confirmation chirp
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } else {
      // Low dual warning buzz for scan exception
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

/**
 * Standard Savouré Artisanal Bakery product line with official GS1 South Africa 600 barcodes
 */
export const SA_BAKERY_BARCODES = [
  {
    barcode: '6009800123012',
    sku: 'ROT-001',
    name: 'Traditional Roti (Pack of 5)',
    category: 'Rotis',
    unit: 'Packs',
    unitPrice: 28.50,
    costPrice: 16.00,
    defaultBranch: 'Main Bakery',
  },
  {
    barcode: '6009800123029',
    sku: 'ROT-002',
    name: 'Large Family Roti (Pack of 5)',
    category: 'Rotis',
    unit: 'Packs',
    unitPrice: 38.00,
    costPrice: 22.50,
    defaultBranch: 'Main Bakery',
  },
  {
    barcode: '6009800123036',
    sku: 'WRP-001',
    name: 'Artisanal Tortilla Wraps (Pack of 6)',
    category: 'Tortilla Wraps',
    unit: 'Packs',
    unitPrice: 32.00,
    costPrice: 18.00,
    defaultBranch: 'Sandton Branch',
  },
  {
    barcode: '6009800123043',
    sku: 'SAM-001',
    name: 'Crispy Samoosa Pur Sheets (500g)',
    category: 'Samoosa Pastry',
    unit: 'Packs',
    unitPrice: 42.50,
    costPrice: 24.00,
    defaultBranch: 'Main Bakery',
  },
  {
    barcode: '6009800123050',
    sku: 'SPR-001',
    name: 'Spring Roll Pastry Sheets (Pack of 20)',
    category: 'Spring Roll Pastry',
    unit: 'Packs',
    unitPrice: 36.00,
    costPrice: 20.00,
    defaultBranch: 'Main Bakery',
  },
  {
    barcode: '6009800123067',
    sku: 'ROT-003',
    name: 'Cocktail Bite-Size Roti (Pack of 10)',
    category: 'Rotis',
    unit: 'Packs',
    unitPrice: 24.00,
    costPrice: 13.50,
    defaultBranch: 'Rosebank Branch',
  },
  {
    barcode: '6009800123074',
    sku: 'WRP-002',
    name: 'Roti Roll Wraps (Pack of 10)',
    category: 'Rotis',
    unit: 'Packs',
    unitPrice: 45.00,
    costPrice: 26.00,
    defaultBranch: 'Wholesale Distribution Hub',
  },
  {
    barcode: '6009800123081',
    sku: 'RAW-001',
    name: 'Stoneground Bread Flour Extra Fine (25kg)',
    category: 'Flour & Grains',
    unit: 'kg',
    unitPrice: 285.00,
    costPrice: 210.00,
    defaultBranch: 'Main Bakery',
  },
  {
    barcode: '6009800123098',
    sku: 'RAW-002',
    name: 'Pure Ghee Butter Blend (5L Tub)',
    category: 'Oils & Fats',
    unit: 'L',
    unitPrice: 340.00,
    costPrice: 265.00,
    defaultBranch: 'Main Bakery',
  },
];
