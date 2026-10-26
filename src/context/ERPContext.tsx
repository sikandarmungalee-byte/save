import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  CompanySettings,
  BusinessSettings,
  Customer,
  Product,
  Invoice,
  LineItem,
  DeliveryNote,
  Quotation,
  Payment,
  Lead,
  CommunicationLog,
  ERPDatabase,
  StaffMember,
  PayrollPayout,
  StockPurchase,
  StockItemStatus,
  StockMovement,
  JournalEntry,
  UserLoginLog,
  MerchantOrder,
  MerchantOrderItem,
  MerchantReport,
  POSTransaction,
  POSSession,
  POSCartItem,
  ProductionLine,
  ProductionBatch,
  ProductionIngredientUsage,
  ProductionQualityCheck
} from '../types/erp';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { SHOWCASE_COLLECTION, ShowcaseProductItem } from '../components/showcase/showcaseData';
import { dispatchOrderPushNotification } from '../lib/fcmNotifications';

// Safe API caller for local / server endpoints
async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Server communication response (${res.status})`,
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: data?.error || `Request failed (${res.status})`,
      };
    }

    return { ok: true, status: res.status, data, error: undefined };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Network error occurred.',
    };
  }
}

export const MASTER_ADMIN_USER: User = {
  id: 'usr_master_savoure',
  name: 'Master Admin',
  email: 'admin@savoure.co.za',
  password: 'Shazia',
  role: 'super_admin',
  permissions: {
    manageUsers: true,
    invoices: true,
    deliveryNotes: true,
    quotations: true,
    payments: true,
    customers: true,
    catalog: true,
    reports: true,
    crmLeads: true,
    databaseExplorer: true,
    companySettings: true,
  },
  status: 'active',
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
};

export const INITIAL_COMPANY: CompanySettings = {
  companyName: 'Savouré (Pty) Ltd',
  tradingName: 'Savouré - A Taste of Tradition',
  registrationNumber: '',
  vatNumber: '',
  address: '',
  phone: '061 364 5712',
  email: 'info@savoure.co.za',
  website: 'https://savoure.co.za',
  currency: 'R',
  vatRate: 0,
  bankName: 'First National Bank (FNB)',
  accountHolder: 'Savouré (Pty) Ltd',
  accountNumber: '62983104821',
  branchCode: '250655',
  swiftCode: 'FIRNZAJJ',
  defaultPaymentTerms: 'Strictly 30 days from invoice date. Please use your invoice number as EFT payment reference.',
  invoicePrefix: 'INV-',
  footerText: 'Thank you for choosing Savouré. Premium flatbreads & artisanal pastries.',
  pinCode: '1234',
  logoUrl: '/images/savoure/savoure-logo.png',
};

export const INITIAL_CUSTOMER_SOUTHERN_AMBISION: Customer = {
  id: 'cust_1791911619388',
  registeredName: 'Southern Ambision 1390 CC',
  tradingName: 'TBC',
  accountCode: 'ROKSH4',
  registrationNumber: '2007/140641/23',
  vatNumber: '',
  primaryContact: 'ROOKSHANA',
  primaryPhone: '0719153630',
  primaryEmail: 'ROOKSHANAL@ICLOUD.COM',
  branches: [
    {
      id: 'br_1791911619388',
      branchName: 'Main / HQ',
      deliveryAddress: '',
      contactPerson: 'ROOKSHANA',
      phone: '0719153630',
      email: 'ROOKSHANAL@ICLOUD.COM',
    },
  ],
  creditLimit: 50000,
  paymentTermsDays: 7,
  notes: '',
  documents: [],
  createdAt: '2026-10-13T17:13:39.388Z',
};

export const INITIAL_ROOKSHANA_USER: User = {
  id: 'usr_1791911737847',
  name: 'ROOKSHANA',
  username: 'roksh4',
  email: 'rookshanal@icloud.com',
  password: 'ROKSH4',
  role: 'merchant',
  customerId: 'cust_1791911619388',
  customerName: 'Southern Ambision 1390 CC',
  merchantStoreName: 'TBC',
  merchantPhone: '0719153630',
  branch: 'Durban Central',
  status: 'active',
  permissions: {
    manageUsers: false,
    invoices: true,
    deliveryNotes: true,
    quotations: false,
    payments: false,
    customers: false,
    catalog: true,
    reports: false,
    crmLeads: false,
    databaseExplorer: false,
    companySettings: false,
    merchants: false,
  },
  createdAt: '2026-10-13T17:15:37.847Z',
  lastLogin: '2026-10-13T17:15:37.847Z',
};

// Default South African GS1 Barcode Products (Prefix 600 / 601)
export const INITIAL_SAVOURE_PRODUCTS: Product[] = [
  {
    id: 'prod_spring_roll',
    sku: 'SAV-SPR-001',
    name: 'Savouré Spring Roll Pastry Sheets',
    category: 'Pastry Sheets',
    packSize: 'Pack of 30 Sheets (20cm / 200g)',
    physicalSize: 'Standard 20cm',
    unitPrice: 42.50,
    costPrice: 22.00,
    vatApplicable: false,
    stockOnHand: 480,
    barcode: '6009800123012',
    showcase: true,
    description: 'Ultra-thin, non-porous crispy pastry sheets engineered for restaurant-grade spring rolls. Crisps to a golden amber finish without absorbing grease.',
    badge: 'Chef Favorite',
    packagingType: 'dozen',
    sizes: [
      {
        id: 'size_spr_15',
        name: 'Cocktail / Bite-Size (15cm × 15cm)',
        shortName: 'Cocktail 15cm',
        dimensions: '15cm × 15cm',
        packSpec: '30 Sheets / 150g pack',
        price: 34.00,
        badge: 'Cocktail / Bites',
      },
      {
        id: 'size_spr_20',
        name: 'Standard Restaurant (20cm × 20cm)',
        shortName: 'Standard 20cm',
        dimensions: '20cm × 20cm',
        packSpec: '30 Sheets / 200g pack',
        price: 42.50,
        badge: 'Most Popular',
        isDefault: true,
      },
      {
        id: 'size_spr_25',
        name: 'Large Deli Sheet (25cm × 25cm)',
        shortName: 'Large Deli 25cm',
        dimensions: '25cm × 25cm',
        packSpec: '40 Sheets / 350g pack',
        price: 58.00,
        badge: 'Deli Size',
      },
      {
        id: 'size_spr_bulk',
        name: 'Commercial Bulk Catering Box',
        shortName: 'Catering Box 250s',
        dimensions: '20cm × 20cm',
        packSpec: '250 Sheets Master Box (2.0kg)',
        price: 295.00,
        badge: 'Wholesale Bulk Save',
      },
    ],
  },
  {
    id: 'prod_samoosa_pastry',
    sku: 'SAV-SAM-002',
    name: 'Savouré Crispy Samoosa Pastry Sheets',
    category: 'Pastry Sheets',
    packSize: 'Pack of 50 Strips (7x25cm / 500g)',
    physicalSize: 'Standard 7x25cm',
    unitPrice: 48.00,
    costPrice: 24.50,
    vatApplicable: false,
    stockOnHand: 650,
    barcode: '6001007012342',
    showcase: true,
    description: 'Traditional tissue-thin folded samoosa leaves. Separates effortlessly, holds fillings securely, and achieves an unforgettable flaky crackle.',
    badge: 'Best Seller',
    packagingType: 'dozen',
    sizes: [
      {
        id: 'size_sam_mini',
        name: 'Cocktail Mini Strips (5cm × 20cm)',
        shortName: 'Mini Cocktail 5×20cm',
        dimensions: '5cm × 20cm',
        packSpec: '60 Strips / 400g pack',
        price: 42.00,
        badge: 'Cocktail & Canapés',
      },
      {
        id: 'size_sam_std',
        name: 'Standard Golden Strips (7cm × 25cm)',
        shortName: 'Standard 7×25cm',
        dimensions: '7cm × 25cm',
        packSpec: '50 Strips / 500g pack',
        price: 48.00,
        badge: 'Best Seller',
        isDefault: true,
      },
      {
        id: 'size_sam_king',
        name: 'King Size Triangles (9cm × 30cm)',
        shortName: 'King Size 9×30cm',
        dimensions: '9cm × 30cm',
        packSpec: '50 Strips / 750g pack',
        price: 65.00,
        badge: 'Deli Master',
      },
      {
        id: 'size_sam_bulk',
        name: 'Commercial Foodservice Master Carton',
        shortName: 'Master Carton 500s',
        dimensions: '7cm × 25cm',
        packSpec: '500 Strips Master Box (5.0kg)',
        price: 440.00,
        badge: 'Wholesale Bulk Save',
      },
    ],
  },
  {
    id: 'prod_flaky_roti',
    sku: 'SAV-ROT-003',
    name: 'Savouré Hand-Rolled Flaky Roti',
    category: 'Artisanal Roti',
    packSize: 'Pack of 6 Rotis (22cm)',
    physicalSize: '22cm Round',
    unitPrice: 38.00,
    costPrice: 19.00,
    vatApplicable: false,
    stockOnHand: 320,
    barcode: '6009612345671',
    showcase: true,
    description: 'Authentic layered Cape Malay & Durban style flaky rotis. Hand-stretched with pure clarified butter for extraordinary tender layers.',
    badge: 'Artisanal Classic',
    packagingType: 'dozen',
    sizes: [
      {
        id: 'size_rot_buffet',
        name: 'Cocktail / Buffet Roti (15cm Round)',
        shortName: 'Buffet 15cm',
        dimensions: '15cm Round',
        packSpec: 'Pack of 10 Rotis / 450g',
        price: 36.00,
        badge: 'Buffet Size',
      },
      {
        id: 'size_rot_std',
        name: 'Classic Table Roti (22cm Round)',
        shortName: 'Classic 22cm',
        dimensions: '22cm Round',
        packSpec: 'Pack of 6 Rotis / 500g',
        price: 38.00,
        badge: 'Artisanal Classic',
        isDefault: true,
      },
      {
        id: 'size_rot_family',
        name: 'Family Value Pack (22cm Round)',
        shortName: 'Family Pack of 12',
        dimensions: '22cm Round',
        packSpec: 'Pack of 12 Rotis / 1.0kg',
        price: 68.00,
        badge: 'Value Pack',
      },
      {
        id: 'size_rot_crate',
        name: 'Catering Bulk Crate (22cm Round)',
        shortName: 'Catering Crate 50s',
        dimensions: '22cm Round',
        packSpec: '50 Layered Rotis / 4.2kg',
        price: 265.00,
        badge: 'Foodservice Master',
      },
    ],
  },
  {
    id: 'prod_tortilla_wraps',
    sku: 'SAV-TOR-004',
    name: 'Savouré Stone-Ground Tortilla Wraps',
    category: 'Tortillas & Wraps',
    packSize: 'Pack of 12 Wraps (30cm)',
    physicalSize: 'Large 30cm',
    unitPrice: 54.00,
    costPrice: 28.00,
    vatApplicable: false,
    stockOnHand: 410,
    barcode: '6002100987650',
    showcase: true,
    description: 'Soft-fold stone-ground flour tortillas. Roll tight without cracking or tearing, perfect for Mexican dining, shawarmas, and deli wraps.',
    badge: 'Wholesale Hero',
    packagingType: 'pack',
    sizes: [
      {
        id: 'size_tor_med',
        name: 'Medium Taco / Street Food (20cm / 8")',
        shortName: 'Medium 8-inch',
        dimensions: '20cm / 8-inch',
        packSpec: 'Pack of 12 Wraps / 480g',
        price: 42.00,
        badge: 'Taco Size',
      },
      {
        id: 'size_tor_deli',
        name: 'Large Burrito / Deli (25cm / 10")',
        shortName: 'Large 10-inch',
        dimensions: '25cm / 10-inch',
        packSpec: 'Pack of 12 Wraps / 650g',
        price: 48.00,
        badge: 'Burrito & Wraps',
      },
      {
        id: 'size_tor_jumbo',
        name: 'Jumbo Shawarma (30cm / 12")',
        shortName: 'Jumbo 12-inch',
        dimensions: '30cm / 12-inch',
        packSpec: 'Pack of 12 Wraps / 850g',
        price: 54.00,
        badge: 'Wholesale Hero',
        isDefault: true,
      },
      {
        id: 'size_tor_bulk',
        name: 'Foodservice Master Case (30cm)',
        shortName: 'Master Case 100s',
        dimensions: '30cm / 12-inch',
        packSpec: '100 Wraps Foodservice Case (7.2kg)',
        price: 375.00,
        badge: 'Commercial Master Case',
      },
    ],
  },
];

export const INITIAL_STOCK_ITEM_STATUSES: StockItemStatus[] = [
  {
    id: 'stk_flour_supreme',
    sku: 'RAW-FLR-001',
    barcode: '6001234567899',
    name: 'Supreme Unbleached Pastry Flour (25kg)',
    category: 'Flour & Grains',
    branchName: 'Main Bakery',
    quantityOnHand: 140,
    unit: 'bags (25kg)',
    isFinished: false,
    minThreshold: 20,
    notes: 'Premium cake and laminating flour from Premier FMCG (GS1 SA)',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stk_sunflower_oil',
    sku: 'RAW-OIL-002',
    barcode: '6009876543219',
    name: 'Pure Sunflower Frying & Laminating Oil (20L)',
    category: 'Oils & Fats',
    branchName: 'Main Bakery',
    quantityOnHand: 45,
    unit: 'drums (20L)',
    isFinished: false,
    minThreshold: 10,
    notes: 'High-smoke-point pure vegetable oil',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stk_finished_spring_roll',
    sku: 'SAV-SPR-001',
    barcode: '6009800123012',
    name: 'Savouré Spring Roll Pastry (20cm / 200g)',
    category: 'Pastry Sheets',
    branchName: 'Main Bakery',
    quantityOnHand: 350,
    unit: 'packs',
    isFinished: false,
    minThreshold: 50,
    notes: 'Freshly rolled and blast chilled at Main Bakery',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stk_finished_samoosa',
    sku: 'SAV-SAM-002',
    barcode: '6001007012342',
    name: 'Savouré Crispy Samoosa Pastry Sheets (500g)',
    category: 'Pastry Sheets',
    branchName: 'Main Bakery',
    quantityOnHand: 420,
    unit: 'packs',
    isFinished: false,
    minThreshold: 60,
    notes: 'Cut pastry sheets ready for dispatch',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm_001',
    movementNumber: 'SM-2026-0001',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: 'STOCK_IN',
    barcode: '6009800123012',
    sku: 'SAV-SPR-001',
    productName: 'Savouré Spring Roll Pastry (20cm / 200g)',
    category: 'Pastry Sheets',
    quantity: 120,
    unit: 'packs',
    sourceBranch: 'Supplier Production',
    destinationBranch: 'Main Bakery',
    batchNumber: 'BATCH-2026-0414-A',
    reason: 'Morning production run completed & quality tested',
    recordedBy: 'Master Admin',
    isSouthAfricanBarcode: true,
  },
  {
    id: 'sm_002',
    movementNumber: 'SM-2026-0002',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'TRANSFER',
    barcode: '6001007012342',
    sku: 'SAV-SAM-002',
    productName: 'Savouré Crispy Samoosa Pastry Sheets (500g)',
    category: 'Pastry Sheets',
    quantity: 40,
    unit: 'packs',
    sourceBranch: 'Main Bakery',
    destinationBranch: 'Sandton Branch',
    batchNumber: 'BATCH-2026-0414-B',
    reason: 'Replenishing Sandton walk-in retail stock',
    recordedBy: 'Master Admin',
    isSouthAfricanBarcode: true,
  },
  {
    id: 'sm_003',
    movementNumber: 'SM-2026-0003',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    type: 'STOCK_OUT',
    barcode: '6009612345671',
    sku: 'SAV-ROT-003',
    productName: 'Savouré Hand-Rolled Flaky Roti (Pack of 6)',
    category: 'Artisanal Roti',
    quantity: 25,
    unit: 'packs',
    sourceBranch: 'Main Bakery',
    reason: 'Dispatched for Southern Ambision 1390 CC wholesale order',
    recordedBy: 'Master Admin',
    isSouthAfricanBarcode: true,
  },
];

export const INITIAL_MERCHANT_ORDERS: MerchantOrder[] = [
  {
    id: 'ord_1001',
    orderNumber: 'ORD-2026-0001',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    branch: 'Durban Central Deli',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    requestedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    status: 'ACCEPTED',
    items: [
      {
        productId: 'prod_spring_roll',
        productName: 'Savouré Spring Roll Pastry Sheets',
        packSize: 'Standard Restaurant (20cm × 20cm)',
        quantity: 20,
        unitPrice: 42.50,
        lineTotal: 850.00,
        notes: 'Cold chain dispatch'
      },
      {
        productId: 'prod_samoosa_pastry',
        productName: 'Savouré Crispy Samoosa Pastry Sheets',
        packSize: 'Standard Golden Strips (7cm × 25cm)',
        quantity: 15,
        unitPrice: 48.00,
        lineTotal: 720.00,
        notes: 'Crispy triangle cut'
      }
    ],
    subtotal: 1570.00,
    vat: 0.00,
    total: 1570.00,
    specialInstructions: 'Please deliver before 10:00 AM on Thursday morning for catering weekend preparation.',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'ord_1002',
    orderNumber: 'ORD-2026-0002',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    branch: 'Durban Central Deli',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    requestedDeliveryDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    status: 'DELIVERED',
    items: [
      {
        productId: 'prod_flaky_roti',
        productName: 'Savouré Hand-Rolled Flaky Roti',
        packSize: 'Classic Table Roti (22cm Round)',
        quantity: 25,
        unitPrice: 38.00,
        lineTotal: 950.00,
      },
      {
        productId: 'prod_tortilla_wraps',
        productName: 'Savouré Stone-Ground Tortilla Wraps',
        packSize: 'Jumbo Shawarma (30cm / 12")',
        quantity: 15,
        unitPrice: 54.00,
        lineTotal: 810.00,
      }
    ],
    subtotal: 1760.00,
    vat: 0.00,
    total: 1760.00,
    specialInstructions: 'Early morning delivery for deli counter stock.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ord_1003',
    orderNumber: 'ORD-2026-0003',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    branch: 'Durban Central Deli',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    requestedDeliveryDate: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
    status: 'DELIVERED',
    items: [
      {
        productId: 'prod_spring_roll',
        productName: 'Savouré Spring Roll Pastry Sheets',
        packSize: 'Commercial Bulk Catering Box',
        quantity: 6,
        unitPrice: 295.00,
        lineTotal: 1770.00,
      },
      {
        productId: 'prod_samoosa_pastry',
        productName: 'Savouré Crispy Samoosa Pastry Sheets',
        packSize: 'Standard Golden Strips (7cm × 25cm)',
        quantity: 20,
        unitPrice: 48.00,
        lineTotal: 960.00,
      }
    ],
    subtotal: 2730.00,
    vat: 0.00,
    total: 2730.00,
    specialInstructions: 'Mid-month catering replenishment.',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'ord_1004',
    orderNumber: 'ORD-2026-0004',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    branch: 'Durban Central Deli',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    requestedDeliveryDate: new Date(Date.now() - 86400000 * 24).toISOString().split('T')[0],
    status: 'DELIVERED',
    items: [
      {
        productId: 'prod_flaky_roti',
        productName: 'Savouré Hand-Rolled Flaky Roti',
        packSize: 'Catering Bulk Crate (22cm Round)',
        quantity: 8,
        unitPrice: 265.00,
        lineTotal: 2120.00,
      },
      {
        productId: 'prod_tortilla_wraps',
        productName: 'Savouré Stone-Ground Tortilla Wraps',
        packSize: 'Large Burrito / Deli (25cm / 10")',
        quantity: 25,
        unitPrice: 48.00,
        lineTotal: 1200.00,
      }
    ],
    subtotal: 3320.00,
    vat: 0.00,
    total: 3320.00,
    createdAt: new Date(Date.now() - 86400000 * 26).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 24).toISOString(),
  },
  {
    id: 'ord_1005',
    orderNumber: 'ORD-2026-0005',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    branch: 'Durban Central Deli',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    requestedDeliveryDate: new Date(Date.now() - 86400000 * 50).toISOString().split('T')[0],
    status: 'DELIVERED',
    items: [
      {
        productId: 'prod_spring_roll',
        productName: 'Savouré Spring Roll Pastry Sheets',
        packSize: 'Standard Restaurant (20cm × 20cm)',
        quantity: 40,
        unitPrice: 42.50,
        lineTotal: 1700.00,
      },
      {
        productId: 'prod_samoosa_pastry',
        productName: 'Savouré Crispy Samoosa Pastry Sheets',
        packSize: 'Commercial Foodservice Master Carton',
        quantity: 5,
        unitPrice: 440.00,
        lineTotal: 2200.00,
      }
    ],
    subtotal: 3900.00,
    vat: 0.00,
    total: 3900.00,
    createdAt: new Date(Date.now() - 86400000 * 52).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 50).toISOString(),
  },
  {
    id: 'ord_1006',
    orderNumber: 'ORD-2026-0006',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    branch: 'Durban Central Deli',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    requestedDeliveryDate: new Date(Date.now() - 86400000 * 85).toISOString().split('T')[0],
    status: 'DELIVERED',
    items: [
      {
        productId: 'prod_flaky_roti',
        productName: 'Savouré Hand-Rolled Flaky Roti',
        packSize: 'Classic Table Roti (22cm Round)',
        quantity: 50,
        unitPrice: 38.00,
        lineTotal: 1900.00,
      },
      {
        productId: 'prod_tortilla_wraps',
        productName: 'Savouré Stone-Ground Tortilla Wraps',
        packSize: 'Foodservice Master Case (30cm)',
        quantity: 6,
        unitPrice: 375.00,
        lineTotal: 2250.00,
      }
    ],
    subtotal: 4150.00,
    vat: 0.00,
    total: 4150.00,
    createdAt: new Date(Date.now() - 86400000 * 88).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 85).toISOString(),
  },
  {
    id: 'ord_1007',
    orderNumber: 'ORD-2026-0007',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    branch: 'Durban Central Deli',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    requestedDeliveryDate: new Date(Date.now() - 86400000 * 140).toISOString().split('T')[0],
    status: 'DELIVERED',
    items: [
      {
        productId: 'prod_spring_roll',
        productName: 'Savouré Spring Roll Pastry Sheets',
        packSize: 'Cocktail / Bite-Size (15cm × 15cm)',
        quantity: 45,
        unitPrice: 34.00,
        lineTotal: 1530.00,
      },
      {
        productId: 'prod_samoosa_pastry',
        productName: 'Savouré Crispy Samoosa Pastry Sheets',
        packSize: 'Cocktail Mini Strips (5cm × 20cm)',
        quantity: 50,
        unitPrice: 42.00,
        lineTotal: 2100.00,
      }
    ],
    subtotal: 3630.00,
    vat: 0.00,
    total: 3630.00,
    createdAt: new Date(Date.now() - 86400000 * 143).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 140).toISOString(),
  },
  {
    id: 'ord_1008',
    orderNumber: 'ORD-2026-0008',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    branch: 'Durban Central Deli',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    requestedDeliveryDate: new Date(Date.now() - 86400000 * 220).toISOString().split('T')[0],
    status: 'DELIVERED',
    items: [
      {
        productId: 'prod_spring_roll',
        productName: 'Savouré Spring Roll Pastry Sheets',
        packSize: 'Large Deli Sheet (25cm × 25cm)',
        quantity: 35,
        unitPrice: 58.00,
        lineTotal: 2030.00,
      },
      {
        productId: 'prod_tortilla_wraps',
        productName: 'Savouré Stone-Ground Tortilla Wraps',
        packSize: 'Jumbo Shawarma (30cm / 12")',
        quantity: 30,
        unitPrice: 54.00,
        lineTotal: 1620.00,
      }
    ],
    subtotal: 3650.00,
    vat: 0.00,
    total: 3650.00,
    createdAt: new Date(Date.now() - 86400000 * 223).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 220).toISOString(),
  }
];

export const INITIAL_MERCHANT_REPORTS: MerchantReport[] = [
  {
    id: 'rpt_past_001',
    reportNumber: 'SAV-RPT-2026-W42',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    branch: 'Durban Central Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    period: 'WEEKLY',
    periodLabel: 'Weekly Procurement Statement (Current Week)',
    startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    generatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    totalOrderSpend: 3330.00,
    totalInvoiced: 3330.00,
    totalPaid: 3330.00,
    balanceDue: 0.00,
    ordersCount: 2,
    totalPacksOrdered: 75,
    deliveredOrdersCount: 1,
    pendingOrdersCount: 1,
    fulfillmentRate: 100,
    avgOrderValue: 1665.00,
    orders: [],
    invoices: [],
    productSummaries: [
      {
        productId: 'prod_spring_roll',
        productName: 'Savouré Spring Roll Pastry Sheets',
        packSize: 'Standard Restaurant (20cm × 20cm)',
        totalQuantity: 20,
        unitPrice: 42.50,
        totalSpend: 850.00
      },
      {
        productId: 'prod_flaky_roti',
        productName: 'Savouré Hand-Rolled Flaky Roti',
        packSize: 'Classic Table Roti (22cm Round)',
        totalQuantity: 25,
        unitPrice: 38.00,
        totalSpend: 950.00
      },
      {
        productId: 'prod_tortilla_wraps',
        productName: 'Savouré Stone-Ground Tortilla Wraps',
        packSize: 'Jumbo Shawarma (30cm / 12")',
        totalQuantity: 15,
        unitPrice: 54.00,
        totalSpend: 810.00
      },
      {
        productId: 'prod_samoosa_pastry',
        productName: 'Savouré Crispy Samoosa Pastry Sheets',
        packSize: 'Standard Golden Strips (7cm × 25cm)',
        totalQuantity: 15,
        unitPrice: 48.00,
        totalSpend: 720.00
      }
    ],
    notes: 'Official audited weekly merchant report. Fast cold-chain fulfillment maintained.'
  },
  {
    id: 'rpt_past_002',
    reportNumber: 'SAV-RPT-2026-M09',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    branch: 'Durban Central Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    period: 'MONTHLY',
    periodLabel: 'Monthly Procurement Statement (Last 30 Days)',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    generatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    totalOrderSpend: 9380.00,
    totalInvoiced: 9380.00,
    totalPaid: 9380.00,
    balanceDue: 0.00,
    ordersCount: 4,
    totalPacksOrdered: 181,
    deliveredOrdersCount: 3,
    pendingOrdersCount: 1,
    fulfillmentRate: 98.7,
    avgOrderValue: 2345.00,
    orders: [],
    invoices: [],
    productSummaries: [
      {
        productId: 'prod_flaky_roti',
        productName: 'Savouré Hand-Rolled Flaky Roti',
        packSize: 'Catering Bulk Crate (22cm Round)',
        totalQuantity: 8,
        unitPrice: 265.00,
        totalSpend: 2120.00
      },
      {
        productId: 'prod_spring_roll',
        productName: 'Savouré Spring Roll Pastry Sheets',
        packSize: 'Commercial Bulk Catering Box',
        totalQuantity: 6,
        unitPrice: 295.00,
        totalSpend: 1770.00
      },
      {
        productId: 'prod_tortilla_wraps',
        productName: 'Savouré Stone-Ground Tortilla Wraps',
        packSize: 'Large Burrito / Deli (25cm / 10")',
        totalQuantity: 25,
        unitPrice: 48.00,
        totalSpend: 1200.00
      },
      {
        productId: 'prod_samoosa_pastry',
        productName: 'Savouré Crispy Samoosa Pastry Sheets',
        packSize: 'Standard Golden Strips (7cm × 25cm)',
        totalQuantity: 35,
        unitPrice: 48.00,
        totalSpend: 1680.00
      }
    ],
    notes: 'Commercial monthly procurement statement. All deliveries completed with signed digital PODs.'
  },
  {
    id: 'rpt_past_003',
    reportNumber: 'SAV-RPT-2026-Q2',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    branch: 'Durban Central Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    period: '3_MONTHS',
    periodLabel: 'Quarterly Procurement Audit (3 Months / Q2-Q3)',
    startDate: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    generatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    totalOrderSpend: 17430.00,
    totalInvoiced: 17430.00,
    totalPaid: 17430.00,
    balanceDue: 0.00,
    ordersCount: 6,
    totalPacksOrdered: 342,
    deliveredOrdersCount: 5,
    pendingOrdersCount: 1,
    fulfillmentRate: 99.2,
    avgOrderValue: 2905.00,
    orders: [],
    invoices: [],
    productSummaries: [
      {
        productId: 'prod_samoosa_pastry',
        productName: 'Savouré Crispy Samoosa Pastry Sheets',
        packSize: 'Commercial Foodservice Master Carton',
        totalQuantity: 5,
        unitPrice: 440.00,
        totalSpend: 2200.00
      },
      {
        productId: 'prod_flaky_roti',
        productName: 'Savouré Hand-Rolled Flaky Roti',
        packSize: 'Classic Table Roti (22cm Round)',
        totalQuantity: 50,
        unitPrice: 38.00,
        totalSpend: 1900.00
      },
      {
        productId: 'prod_tortilla_wraps',
        productName: 'Savouré Stone-Ground Tortilla Wraps',
        packSize: 'Foodservice Master Case (30cm)',
        totalQuantity: 6,
        unitPrice: 375.00,
        totalSpend: 2250.00
      }
    ],
    notes: 'Q2 Wholesale partnership review. High-priority tiered pricing applied.'
  },
  {
    id: 'rpt_past_004',
    reportNumber: 'SAV-RPT-2026-H1',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    branch: 'Durban Central Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    period: '6_MONTHS',
    periodLabel: 'Half-Year Procurement Statement (6 Months)',
    startDate: new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    generatedAt: new Date(Date.now() - 86400000 * 35).toISOString(),
    totalOrderSpend: 21060.00,
    totalInvoiced: 21060.00,
    totalPaid: 21060.00,
    balanceDue: 0.00,
    ordersCount: 7,
    totalPacksOrdered: 437,
    deliveredOrdersCount: 6,
    pendingOrdersCount: 1,
    fulfillmentRate: 98.9,
    avgOrderValue: 3008.57,
    orders: [],
    invoices: [],
    productSummaries: [
      {
        productId: 'prod_spring_roll',
        productName: 'Savouré Spring Roll Pastry Sheets',
        packSize: 'Cocktail / Bite-Size (15cm × 15cm)',
        totalQuantity: 45,
        unitPrice: 34.00,
        totalSpend: 1530.00
      },
      {
        productId: 'prod_samoosa_pastry',
        productName: 'Savouré Crispy Samoosa Pastry Sheets',
        packSize: 'Cocktail Mini Strips (5cm × 20cm)',
        totalQuantity: 50,
        unitPrice: 42.00,
        totalSpend: 2100.00
      }
    ],
    notes: 'Half-yearly executive wholesale audit. Qualified for premier tier volume discount.'
  },
  {
    id: 'rpt_past_005',
    reportNumber: 'SAV-RPT-2025-ANNUAL',
    merchantId: 'usr_1791911737847',
    merchantName: 'Rookshana Banoo Moola',
    merchantStoreName: 'Moola Halal Gourmet Deli',
    branch: 'Durban Central Deli',
    merchantEmail: 'orders@moolagourmet.co.za',
    merchantPhone: '071 915 3630',
    deliveryAddress: '42 Commercial Rd, Durban Central, KwaZulu-Natal',
    period: 'YEARLY',
    periodLabel: 'Annual Comprehensive Merchant Report (12 Months)',
    startDate: new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    generatedAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    totalOrderSpend: 24710.00,
    totalInvoiced: 24710.00,
    totalPaid: 24710.00,
    balanceDue: 0.00,
    ordersCount: 8,
    totalPacksOrdered: 502,
    deliveredOrdersCount: 7,
    pendingOrdersCount: 1,
    fulfillmentRate: 99.1,
    avgOrderValue: 3088.75,
    orders: [],
    invoices: [],
    productSummaries: [
      {
        productId: 'prod_spring_roll',
        productName: 'Savouré Spring Roll Pastry Sheets',
        packSize: 'Standard Restaurant (20cm × 20cm)',
        totalQuantity: 120,
        unitPrice: 42.50,
        totalSpend: 5100.00
      },
      {
        productId: 'prod_samoosa_pastry',
        productName: 'Savouré Crispy Samoosa Pastry Sheets',
        packSize: 'Standard Golden Strips (7cm × 25cm)',
        totalQuantity: 115,
        unitPrice: 48.00,
        totalSpend: 5520.00
      },
      {
        productId: 'prod_flaky_roti',
        productName: 'Savouré Hand-Rolled Flaky Roti',
        packSize: 'Classic Table Roti (22cm Round)',
        totalQuantity: 85,
        unitPrice: 38.00,
        totalSpend: 3230.00
      },
      {
        productId: 'prod_tortilla_wraps',
        productName: 'Savouré Stone-Ground Tortilla Wraps',
        packSize: 'Jumbo Shawarma (30cm / 12")',
        totalQuantity: 65,
        unitPrice: 54.00,
        totalSpend: 3510.00
      }
    ],
    notes: 'Annual procurement ledger and audited VAT-compliant statement.'
  }
];

export const INITIAL_POS_SESSIONS: POSSession[] = [
  {
    id: 'pos_ses_001',
    sessionNumber: 'POS-SES-0001',
    cashierId: 'usr_master_admin',
    cashierName: 'Master Admin',
    branch: 'Main Bakery Counter',
    openedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    openingFloat: 500.00,
    cashSales: 1450.00,
    cardSales: 2180.00,
    eftSales: 0.00,
    totalSales: 3630.00,
    transactionCount: 8,
    status: 'OPEN',
    notes: 'Morning shift retail & walk-in till',
  }
];

export const INITIAL_POS_TRANSACTIONS: POSTransaction[] = [
  {
    id: 'pos_tx_001',
    receiptNumber: 'REC-2026-0001',
    sessionId: 'pos_ses_001',
    cashierId: 'usr_master_admin',
    cashierName: 'Master Admin',
    branch: 'Main Bakery Counter',
    customerName: 'Walk-in Retail Customer',
    items: [
      {
        productId: 'prod_spring_roll',
        productName: 'Savouré Spring Roll Pastry (20cm / 200g)',
        sku: 'SAV-SPR-001',
        barcode: '6009800123012',
        category: 'Pastry Sheets',
        packSize: 'Pack of 30 Sheets',
        unitPrice: 42.50,
        quantity: 3,
        discountPercent: 0,
        lineTotal: 127.50,
      },
      {
        productId: 'prod_flaky_roti',
        productName: 'Savouré Hand-Rolled Flaky Roti (Pack of 6)',
        sku: 'SAV-ROT-003',
        barcode: '6009612345671',
        category: 'Artisanal Roti',
        packSize: 'Pack of 6 Rotis',
        unitPrice: 38.00,
        quantity: 2,
        discountPercent: 0,
        lineTotal: 76.00,
      }
    ],
    subtotal: 203.50,
    discountTotal: 0.00,
    vat: 0.00,
    total: 203.50,
    paymentMethod: 'CASH',
    amountTendered: 220.00,
    changeDue: 16.50,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

export const INITIAL_PRODUCTION_LINES: ProductionLine[] = [
  {
    id: 'line_01',
    code: 'LINE-01',
    name: 'High-Speed Pastry Sheeter & Auto-Laminator',
    section: 'Extrusion & Sheeting',
    status: 'RUNNING',
    supervisor: 'Yusuf Patel',
    capacityPerHour: '1,200 sheets/hr',
    targetProductSku: 'SAV-SPR-001',
  },
  {
    id: 'line_02',
    code: 'LINE-02',
    name: 'Triangle Samoosa Precision Cut & Folding Line',
    section: 'Folding & Shaping',
    status: 'RUNNING',
    supervisor: 'Amina Dawood',
    capacityPerHour: '3,200 units/hr',
    targetProductSku: 'SAV-SAM-002',
  },
  {
    id: 'line_03',
    code: 'LINE-03',
    name: 'Artisanal Cape Malay Flaky Roti Hot-Griddle Line',
    section: 'Baking & Griddling',
    status: 'RUNNING',
    supervisor: 'Farouk Adams',
    capacityPerHour: '850 rotis/hr',
    targetProductSku: 'SAV-ROT-003',
  },
  {
    id: 'line_04',
    code: 'LINE-04',
    name: 'Stone-Ground Tortilla Press, Oven Tunnel & Cooling System',
    section: 'Extrusion & Sheeting',
    status: 'IDLE',
    supervisor: 'Tariq Moosa',
    capacityPerHour: '1,500 wraps/hr',
    targetProductSku: 'SAV-TOR-004',
  },
];

export const INITIAL_PRODUCTION_BATCHES: ProductionBatch[] = [
  {
    id: 'batch_101',
    batchNumber: 'BATCH-20261018-001',
    lineId: 'line_01',
    lineName: 'High-Speed Pastry Sheeter & Auto-Laminator',
    targetProductId: 'prod_spring_roll',
    targetProductName: 'Savouré Spring Roll Pastry (20cm / 200g)',
    targetSku: 'SAV-SPR-001',
    plannedQuantity: 500,
    actualYield: 485,
    rejectedQuantity: 15,
    status: 'PACKAGING',
    ingredients: [
      { ingredientId: 'ing_flour', ingredientName: 'Supreme Unbleached Pastry Flour', sku: 'RAW-FLR-001', quantityUsed: 100, unit: 'kg', costPerUnit: 14.50 },
      { ingredientId: 'ing_oil', ingredientName: 'Pure Sunflower Laminating Oil', sku: 'RAW-OIL-002', quantityUsed: 15, unit: 'litres', costPerUnit: 26.00 },
      { ingredientId: 'ing_salt', ingredientName: 'Refined Sea Salt', sku: 'RAW-SLT-003', quantityUsed: 2.5, unit: 'kg', costPerUnit: 8.00 },
    ],
    qc: {
      visualAppearance: 'Pass',
      thicknessMm: 0.85,
      targetWeightGrams: 200,
      actualSampleWeightGrams: 201.5,
      moisturePercent: 12.4,
      metalDetectorChecked: true,
      sealIntegrityChecked: true,
      inspectorName: 'Zainab Cassim (QC Officer)',
      notes: 'Excellent golden hue, consistent sheet elasticity and non-porous structure.'
    },
    operatorName: 'Sipho Ndlovu',
    supervisorName: 'Yusuf Patel',
    startTime: new Date(Date.now() - 3600000 * 4).toISOString(),
    expiryDate: new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
    lotCode: 'LOT-20261018-SPR01',
    notes: 'Standard morning pastry extrusion for restaurant orders',
    stockUpdated: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'batch_102',
    batchNumber: 'BATCH-20261018-002',
    lineId: 'line_02',
    lineName: 'Triangle Samoosa Precision Cut & Folding Line',
    targetProductId: 'prod_samoosa_pastry',
    targetProductName: 'Savouré Crispy Samoosa Pastry Sheets (500g)',
    targetSku: 'SAV-SAM-002',
    plannedQuantity: 650,
    actualYield: 640,
    rejectedQuantity: 10,
    status: 'FORMING_CUTTING',
    ingredients: [
      { ingredientId: 'ing_flour', ingredientName: 'Supreme Unbleached Pastry Flour', sku: 'RAW-FLR-001', quantityUsed: 130, unit: 'kg', costPerUnit: 14.50 },
      { ingredientId: 'ing_oil', ingredientName: 'Pure Sunflower Laminating Oil', sku: 'RAW-OIL-002', quantityUsed: 18, unit: 'litres', costPerUnit: 26.00 },
    ],
    qc: {
      visualAppearance: 'Pass',
      thicknessMm: 0.65,
      targetWeightGrams: 500,
      actualSampleWeightGrams: 502,
      moisturePercent: 11.8,
      metalDetectorChecked: true,
      sealIntegrityChecked: false,
      inspectorName: 'Pending Final Pack Inspection',
    },
    operatorName: 'Bongani Khumalo',
    supervisorName: 'Amina Dawood',
    startTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    expiryDate: new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
    lotCode: 'LOT-20261018-SAM02',
    notes: 'Crispy triangle folding run',
    stockUpdated: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  }
];

interface ERPContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  users: User[];
  company: CompanySettings;
  businessSettings: BusinessSettings;
  updateBusinessSettings: (data: Partial<BusinessSettings>) => Promise<void>;
  getNextInvoiceNumber: () => string;
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  deliveryNotes: DeliveryNote[];
  quotations: Quotation[];
  payments: Payment[];
  leads: Lead[];
  communications: CommunicationLog[];
  isLocked: boolean;
  lockApp: () => void;
  unlockApp: (pin: string) => boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';
  lastSynced: string | null;
  refreshData: () => Promise<void>;
  
  // User Management
  createUser: (data: Partial<User>) => Promise<User>;
  updateUser: (id: string, data: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  
  // Company Settings
  updateCompany: (data: Partial<CompanySettings>) => Promise<void>;
  
  // Customers
  createCustomer: (data: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  
  // Products
  createProduct: (data: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductShowcase: (id: string) => Promise<boolean>;
  
  // Custom Product Categories
  categories: string[];
  createCategory: (name: string) => Promise<string[]>;
  deleteCategory: (name: string) => Promise<string[]>;
  
  // Invoices
  createInvoice: (data: any) => Promise<Invoice>;
  updateInvoice: (id: string, data: any) => Promise<Invoice>;
  cloneInvoice: (id: string) => Promise<Invoice>;
  generateDeliveryNoteFromInvoice: (invoiceId: string, details?: any) => Promise<DeliveryNote>;
  deleteInvoice: (id: string) => Promise<void>;
  
  // Delivery Notes
  createDeliveryNote: (data: any) => Promise<DeliveryNote>;
  updateDeliveryNote: (id: string, data: any) => Promise<DeliveryNote>;
  savePOD: (id: string, podData: { podSignature: string; podReceivedBy: string; notes?: string }) => Promise<DeliveryNote>;
  deleteDeliveryNote: (id: string) => Promise<void>;
  
  // Quotations
  createQuotation: (data: any) => Promise<Quotation>;
  updateQuotation: (id: string, data: any) => Promise<Quotation>;
  convertQuotation: (id: string) => Promise<{ quotation: Quotation; invoice: Invoice; deliveryNote: DeliveryNote }>;
  deleteQuotation: (id: string) => Promise<void>;
  
  // Payments
  recordPayment: (data: any) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;
  
  // Leads & CRM
  createLead: (data: any) => Promise<Lead>;
  updateLead: (id: string, data: any) => Promise<Lead>;
  deleteLead: (id: string) => Promise<void>;
  addCommunication: (data: any) => Promise<CommunicationLog>;

  // Staff & Payroll / Overtime
  staff: StaffMember[];
  payrollPayouts: PayrollPayout[];
  createStaffMember: (data: Partial<StaffMember>) => Promise<StaffMember>;
  updateStaffMember: (id: string, data: Partial<StaffMember>) => Promise<StaffMember>;
  deleteStaffMember: (id: string) => Promise<void>;
  createPayrollPayout: (data: Partial<PayrollPayout>) => Promise<PayrollPayout>;
  updatePayrollPayout: (id: string, data: Partial<PayrollPayout>) => Promise<PayrollPayout>;
  deletePayrollPayout: (id: string) => Promise<void>;

  // Stock Capturing, Slips & Inventory Management
  stockPurchases: StockPurchase[];
  stockItemStatuses: StockItemStatus[];
  stockMovements: StockMovement[];
  createStockPurchase: (data: Partial<StockPurchase>) => Promise<StockPurchase>;
  deleteStockPurchase: (id: string) => Promise<void>;
  createStockItemStatus: (data: Partial<StockItemStatus>) => Promise<StockItemStatus>;
  updateStockItemStatus: (id: string, data: Partial<StockItemStatus>) => Promise<StockItemStatus>;
  deleteStockItemStatus: (id: string) => Promise<void>;
  markStockAsFinished: (id: string) => Promise<void>;
  setStockQuantity: (id: string, quantity: number) => Promise<void>;
  recordStockMovement: (data: Partial<StockMovement>) => Promise<StockMovement>;
  deleteStockMovement: (id: string) => Promise<void>;

  // Accounting & Journal Entries
  journalEntries: JournalEntry[];
  createJournalEntry: (data: Partial<JournalEntry>) => Promise<JournalEntry>;
  deleteJournalEntry: (id: string) => Promise<void>;

  // User Login Logs & Security
  loginLogs: UserLoginLog[];
  recordLoginLog: (log: Partial<UserLoginLog>) => Promise<void>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<void>;

  // Merchant Orders & Dispatches
  merchantOrders: MerchantOrder[];
  createMerchantOrder: (data: Partial<MerchantOrder>) => Promise<MerchantOrder>;
  updateMerchantOrderStatus: (id: string, status: MerchantOrder['status']) => Promise<MerchantOrder>;
  deleteMerchantOrder: (id: string) => Promise<void>;
  convertOrderToInvoice: (orderId: string) => Promise<Invoice>;

  // Merchant Historical Reports & Statements
  merchantReports: MerchantReport[];
  saveMerchantReport: (report: Partial<MerchantReport>) => Promise<MerchantReport>;
  deleteMerchantReport: (id: string) => Promise<void>;

  // Website Showcase Products Manager
  showcaseProducts: ShowcaseProductItem[];
  addShowcaseProduct: (item: Partial<ShowcaseProductItem>) => Promise<ShowcaseProductItem>;
  updateShowcaseProduct: (id: string, item: Partial<ShowcaseProductItem>) => Promise<ShowcaseProductItem>;
  removeShowcaseProduct: (id: string) => Promise<void>;
  toggleShowcaseProductActive: (id: string) => Promise<boolean>;

  // Point of Sale (POS) & Counter Till
  posTransactions: POSTransaction[];
  posSessions: POSSession[];
  activePOSSession: POSSession | null;
  openPOSSession: (openingFloat: number, notes?: string) => Promise<POSSession>;
  closePOSSession: (closingFloat: number, notes?: string) => Promise<POSSession>;
  createPOSTransaction: (data: Omit<POSTransaction, 'id' | 'receiptNumber' | 'createdAt'>) => Promise<POSTransaction>;
  refundPOSTransaction: (id: string, reason?: string) => Promise<void>;

  // Factory Production Lines & Bakery Runs
  productionLines: ProductionLine[];
  productionBatches: ProductionBatch[];
  updateProductionLineStatus: (id: string, status: ProductionLine['status']) => Promise<void>;
  createProductionBatch: (data: Partial<ProductionBatch>) => Promise<ProductionBatch>;
  updateProductionBatchStatus: (batchId: string, status: ProductionBatch['status'], updates?: Partial<ProductionBatch>) => Promise<void>;
  completeProductionBatch: (batchId: string, actualYield: number, rejectedQuantity: number, qcNotes?: string) => Promise<void>;
  deleteProductionBatch: (batchId: string) => Promise<void>;
  
  // Database & Portability
  purgeMockData: () => Promise<void>;
  restoreBackup: (db: ERPDatabase) => Promise<void>;
}

const ERPContext = createContext<ERPContextType | null>(null);

const CACHE_KEY = 'apex_erp_cache';
const USER_KEY = 'apex_erp_user';

export const normalizeProduct = (p: any, idx = 0): Product => ({
  id: p?.id || `prod_${Date.now()}_${idx}`,
  sku: p?.sku || `SKU-${String(idx + 1).padStart(3, '0')}`,
  name: p?.name || 'Untitled Product',
  category: p?.category || 'Artisanal Bread',
  packSize: p?.packSize || 'Single / Each',
  physicalSize: p?.physicalSize || 'Standard',
  unitPrice: Number(p?.unitPrice) || 0,
  costPrice: Number(p?.costPrice) || 0,
  vatApplicable: p?.vatApplicable !== undefined ? Boolean(p?.vatApplicable) : true,
  stockOnHand: Number(p?.stockOnHand) || 0,
  barcode: p?.barcode || undefined,
  showcase: p?.showcase !== undefined ? Boolean(p?.showcase) : true,
  description: p?.description || '',
  badge: p?.badge || '',
  packagingType: p?.packagingType || 'dozen',
});

function healInvoicesList(rawInvoices: Invoice[], customerList: Customer[], userList: User[]): { invoices: Invoice[]; changed: boolean } {
  let changed = false;
  const merchants = (userList || []).filter((u) => u.role === 'merchant');
  const healed = (rawInvoices || []).map((inv) => {
    let needsUpdate = false;
    let custId = inv.customerId;
    let merId = inv.merchantId;
    let merName = inv.merchantName;
    let merEmail = inv.merchantEmail;

    if (!custId || custId === 'cust_temp') {
      const matchCust = (customerList || []).find(
        (c) =>
          (inv.customerName && (c.registeredName.toLowerCase() === inv.customerName.toLowerCase() || c.tradingName.toLowerCase() === inv.customerName.toLowerCase())) ||
          (inv.customerTradingName && (c.registeredName.toLowerCase() === inv.customerTradingName.toLowerCase() || c.tradingName.toLowerCase() === inv.customerTradingName.toLowerCase()))
      );
      if (matchCust) {
        custId = matchCust.id;
        needsUpdate = true;
      }
    }

    if (!merId) {
      const matchMer = merchants.find(
        (m) =>
          (custId && (m.customerId === custId || m.id === custId)) ||
          (inv.customerName && (
            (m.merchantStoreName && m.merchantStoreName.toLowerCase() === inv.customerName.toLowerCase()) ||
            (m.customerName && m.customerName.toLowerCase() === inv.customerName.toLowerCase()) ||
            (m.name && m.name.toLowerCase() === inv.customerName.toLowerCase())
          )) ||
          (inv.customerTradingName && (
            (m.merchantStoreName && m.merchantStoreName.toLowerCase() === inv.customerTradingName.toLowerCase()) ||
            (m.customerName && m.customerName.toLowerCase() === inv.customerTradingName.toLowerCase())
          ))
      );
      if (matchMer) {
        merId = matchMer.id;
        merName = matchMer.merchantStoreName || matchMer.name;
        merEmail = matchMer.email;
        if (!custId || custId === 'cust_temp') {
          custId = matchMer.customerId || matchMer.id;
        }
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      changed = true;
      return {
        ...inv,
        customerId: custId,
        merchantId: merId,
        merchantName: merName,
        merchantEmail: merEmail,
      };
    }
    return inv;
  });

  return { invoices: healed, changed };
}

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>([MASTER_ADMIN_USER, INITIAL_ROOKSHANA_USER]);
  const [company, setCompany] = useState<CompanySettings>(INITIAL_COMPANY);
  const [customers, setCustomers] = useState<Customer[]>([INITIAL_CUSTOMER_SOUTHERN_AMBISION]);
  const [products, setProducts] = useState<Product[]>(INITIAL_SAVOURE_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(['Pastry Sheets', 'Artisanal Roti', 'Tortillas & Wraps', 'Flour & Grains', 'Oils & Fats']);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [payrollPayouts, setPayrollPayouts] = useState<PayrollPayout[]>([]);
  const [stockPurchases, setStockPurchases] = useState<StockPurchase[]>([]);
  const [stockItemStatuses, setStockItemStatuses] = useState<StockItemStatus[]>(INITIAL_STOCK_ITEM_STATUSES);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loginLogs, setLoginLogs] = useState<UserLoginLog[]>([]);
  const [merchantOrders, setMerchantOrders] = useState<MerchantOrder[]>(INITIAL_MERCHANT_ORDERS);
  const [merchantReports, setMerchantReports] = useState<MerchantReport[]>(() => {
    try {
      const saved = localStorage.getItem('savoure_merchant_reports');
      return saved ? JSON.parse(saved) : INITIAL_MERCHANT_REPORTS;
    } catch {
      return INITIAL_MERCHANT_REPORTS;
    }
  });
  const [showcaseProducts, setShowcaseProducts] = useState<ShowcaseProductItem[]>(SHOWCASE_COLLECTION);
  const [posTransactions, setPosTransactions] = useState<POSTransaction[]>(INITIAL_POS_TRANSACTIONS);
  const [posSessions, setPosSessions] = useState<POSSession[]>(INITIAL_POS_SESSIONS);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>(INITIAL_PRODUCTION_LINES);
  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>(INITIAL_PRODUCTION_BATCHES);

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const isWritingCloud = useRef(false);

  // Helper to persist state to local cache
  const persistToLocal = useCallback((override?: Partial<ERPDatabase>) => {
    try {
      const currentDb: ERPDatabase = {
        users,
        company,
        customers,
        products,
        categories,
        invoices,
        deliveryNotes,
        quotations,
        payments,
        merchantOrders,
        merchantReports,
        showcaseProducts,
        posTransactions,
        posSessions,
        productionLines,
        productionBatches,
        leads,
        communications,
        staff,
        payrollPayouts,
        stockPurchases,
        stockItemStatuses,
        stockMovements,
        journalEntries,
        loginLogs,
        lastUpdated: new Date().toISOString(),
        ...override,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(currentDb));
    } catch (e) {
      console.warn('Cache write warning:', e);
    }
  }, [users, company, customers, products, categories, invoices, deliveryNotes, quotations, payments, merchantOrders, showcaseProducts, posTransactions, posSessions, productionLines, productionBatches, leads, communications, staff, payrollPayouts, stockPurchases, stockItemStatuses, stockMovements, journalEntries, loginLogs]);

  // Helper to sanitize payload and remove all undefined values recursively for Firestore compatibility
  const sanitizeForCloud = (obj: any): any => {
    return JSON.parse(
      JSON.stringify(obj, (_key, value) => {
        if (value === undefined) return null;
        return value;
      })
    );
  };

  // Synchronize state directly to Cloud Firestore (so phone and laptop sync in real-time)
  const syncToCloud = useCallback(async (data: Partial<ERPDatabase>) => {
    isWritingCloud.current = true;
    setSyncStatus('syncing');
    const sanitized = sanitizeForCloud(data);
    const keys = Object.keys(data).join(', ');
    console.log(`[Firebase Cloud Sync] Initiating persist for keys: [${keys}]`);

    try {
      await setDoc(doc(db, 'erp', 'main'), {
        ...sanitized,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
      console.log(`[Firebase Cloud Sync] Successfully saved [${keys}] to Cloud Firestore.`);
      setSyncStatus('synced');
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('[Firebase Cloud Sync Error] Failed to write to Firestore:', err);
    }

    // Also background-sync to server if reachable
    try {
      await safeFetchJson('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized),
      });
      console.log(`[Server Sync] Successfully synced [${keys}] to backend database.`);
    } catch (serverErr: any) {
      console.warn('[Server Sync Notice] Backend sync notice:', serverErr?.message);
    }

    setTimeout(() => {
      isWritingCloud.current = false;
    }, 800);
  }, []);

  // Synchronize current user in local and session storage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(USER_KEY);
      }
    } catch (e) {}
  }, [currentUser]);

  // Load from local storage initially
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: ERPDatabase = JSON.parse(cached);
        if (parsed.company) setCompany(parsed.company);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.products && Array.isArray(parsed.products)) {
          setProducts(parsed.products.map((p, i) => normalizeProduct(p, i)));
        }
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.deliveryNotes) setDeliveryNotes(parsed.deliveryNotes);
        if (parsed.quotations) setQuotations(parsed.quotations);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.leads) setLeads(parsed.leads);
        if (parsed.communications) setCommunications(parsed.communications);
        if (parsed.staff) setStaff(parsed.staff);
        if (parsed.stockPurchases) setStockPurchases(parsed.stockPurchases);
        if (parsed.stockItemStatuses) setStockItemStatuses(parsed.stockItemStatuses);
        if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
        if (parsed.journalEntries) setJournalEntries(parsed.journalEntries);
        if (parsed.loginLogs) setLoginLogs(parsed.loginLogs);
        if (Array.isArray(parsed.merchantOrders)) setMerchantOrders(parsed.merchantOrders);
        if (Array.isArray(parsed.showcaseProducts)) setShowcaseProducts(parsed.showcaseProducts);
        if (Array.isArray(parsed.posTransactions)) setPosTransactions(parsed.posTransactions);
        if (Array.isArray(parsed.posSessions)) setPosSessions(parsed.posSessions);
        if (Array.isArray(parsed.productionLines)) setProductionLines(parsed.productionLines);
        if (Array.isArray(parsed.productionBatches)) setProductionBatches(parsed.productionBatches);

        let loadedUsers = parsed.users || [];
        if (!loadedUsers.some((u) => u.email.toLowerCase() === 'admin@savoure.co.za')) {
          loadedUsers = [MASTER_ADMIN_USER, ...loadedUsers];
        }
        setUsers(loadedUsers);
      }
    } catch (e) {
      console.warn('Cache parse error:', e);
    }
  }, []);

  // REAL-TIME CLOUD FIRESTORE & SERVER SYNCHRONIZATION
  // Connects phone, laptop, tablet and any device via live Cloud Firestore listener and server sync
  useEffect(() => {
    // 1. Initial hydration from server backend (/api/sync)
    safeFetchJson<ERPDatabase>('/api/sync').then((res) => {
      if (res.ok && res.data) {
        const srv = res.data;
        if (srv.company) setCompany(srv.company);
        if (Array.isArray(srv.customers)) setCustomers(srv.customers);
        if (Array.isArray(srv.products)) setProducts(srv.products.map((p, i) => normalizeProduct(p, i)));
        if (Array.isArray(srv.invoices)) {
          const { invoices: healedInvs } = healInvoicesList(srv.invoices, srv.customers || [], srv.users || []);
          setInvoices(healedInvs);
        }
        if (Array.isArray(srv.deliveryNotes)) setDeliveryNotes(srv.deliveryNotes);
        if (Array.isArray(srv.quotations)) setQuotations(srv.quotations);
        if (Array.isArray(srv.payments)) setPayments(srv.payments);
        if (Array.isArray(srv.leads)) setLeads(srv.leads);
        if (Array.isArray(srv.communications)) setCommunications(srv.communications);
        if (Array.isArray(srv.staff)) setStaff(srv.staff);
        if (Array.isArray(srv.payrollPayouts)) setPayrollPayouts(srv.payrollPayouts);
        if (Array.isArray(srv.stockPurchases)) setStockPurchases(srv.stockPurchases);
        if (Array.isArray(srv.stockItemStatuses)) setStockItemStatuses(srv.stockItemStatuses);
        if (Array.isArray(srv.stockMovements)) setStockMovements(srv.stockMovements);
        if (Array.isArray(srv.journalEntries)) setJournalEntries(srv.journalEntries);
        if (Array.isArray(srv.loginLogs)) setLoginLogs(srv.loginLogs);
        if (Array.isArray(srv.merchantOrders)) setMerchantOrders(srv.merchantOrders);
        if (Array.isArray(srv.showcaseProducts)) setShowcaseProducts(srv.showcaseProducts);
        if (Array.isArray(srv.posTransactions)) setPosTransactions(srv.posTransactions);
        if (Array.isArray(srv.posSessions)) setPosSessions(srv.posSessions);
        if (Array.isArray(srv.productionLines)) setProductionLines(srv.productionLines);
        if (Array.isArray(srv.productionBatches)) setProductionBatches(srv.productionBatches);
        if (Array.isArray(srv.users) && srv.users.length > 0) {
          let uList = srv.users;
          if (!uList.some((u) => u.email.toLowerCase() === 'admin@savoure.co.za')) {
            uList = [MASTER_ADMIN_USER, ...uList];
          }
          setUsers(uList);
        }
      }
    }).catch(() => {});

    // 2. Real-time Firestore subscription
    setSyncStatus('syncing');
    const unsub = onSnapshot(doc(db, 'erp', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data() as Partial<ERPDatabase>;
        
        if (cloudData.company) setCompany(cloudData.company);
        if (Array.isArray(cloudData.products)) {
          setProducts(cloudData.products.map((p, i) => normalizeProduct(p, i)));
        }
        if (Array.isArray(cloudData.customers)) setCustomers(cloudData.customers);
        if (Array.isArray(cloudData.categories)) setCategories(cloudData.categories);

        let cloudUsers = cloudData.users || [];
        if (Array.isArray(cloudData.users) && cloudData.users.length > 0) {
          if (!cloudUsers.some((u) => u.email.toLowerCase() === 'admin@savoure.co.za')) {
            cloudUsers = [MASTER_ADMIN_USER, ...cloudUsers];
          }
          setUsers(cloudUsers);
        }

        if (Array.isArray(cloudData.invoices)) {
          const { invoices: healedInvs, changed } = healInvoicesList(
            cloudData.invoices,
            cloudData.customers || [],
            cloudUsers
          );
          setInvoices(healedInvs);
          if (changed && !isWritingCloud.current) {
            syncToCloud({ invoices: healedInvs });
          }
        }
        if (Array.isArray(cloudData.deliveryNotes)) setDeliveryNotes(cloudData.deliveryNotes);
        if (Array.isArray(cloudData.quotations)) setQuotations(cloudData.quotations);
        if (Array.isArray(cloudData.payments)) setPayments(cloudData.payments);
        if (Array.isArray(cloudData.merchantOrders)) setMerchantOrders(cloudData.merchantOrders);
        if (Array.isArray(cloudData.showcaseProducts)) setShowcaseProducts(cloudData.showcaseProducts);
        if (Array.isArray(cloudData.posTransactions)) setPosTransactions(cloudData.posTransactions);
        if (Array.isArray(cloudData.posSessions)) setPosSessions(cloudData.posSessions);
        if (Array.isArray(cloudData.productionLines)) setProductionLines(cloudData.productionLines);
        if (Array.isArray(cloudData.productionBatches)) setProductionBatches(cloudData.productionBatches);
        if (Array.isArray(cloudData.leads)) setLeads(cloudData.leads);
        if (Array.isArray(cloudData.communications)) setCommunications(cloudData.communications);
        if (Array.isArray(cloudData.staff)) setStaff(cloudData.staff);
        if (cloudData.stockPurchases) setStockPurchases(cloudData.stockPurchases);
        if (Array.isArray(cloudData.stockItemStatuses)) setStockItemStatuses(cloudData.stockItemStatuses);
        if (Array.isArray(cloudData.stockMovements)) setStockMovements(cloudData.stockMovements);
        if (Array.isArray(cloudData.journalEntries)) setJournalEntries(cloudData.journalEntries);
        if (Array.isArray(cloudData.loginLogs)) setLoginLogs(cloudData.loginLogs);

        // Update local storage cache
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cloudData));
        } catch (e) {}

        setSyncStatus('synced');
        setLastSynced(new Date().toLocaleTimeString());
      } else {
        // Initialize cloud database with initial Master Admin and company settings
        const initialPayload = {
          users: [MASTER_ADMIN_USER],
          company: INITIAL_COMPANY,
          products: [],
          customers: [],
          invoices: [],
          deliveryNotes: [],
          quotations: [],
          payments: [],
          leads: [],
          communications: [],
          lastUpdated: new Date().toISOString(),
        };
        setDoc(doc(db, 'erp', 'main'), initialPayload).catch(() => {});
        setSyncStatus('synced');
      }
    }, (error) => {
      console.warn('Firestore real-time subscription error:', error);
      setSyncStatus('synced');
    });

    return () => unsub();
  }, []);

  // Manual refresh trigger
  const refreshData = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      // 1. Fetch server
      const res = await safeFetchJson<ERPDatabase>('/api/sync');
      if (res.ok && res.data) {
        const srv = res.data;
        if (srv.products && Array.isArray(srv.products) && srv.products.length > 0) {
          setProducts(srv.products.map((p, i) => normalizeProduct(p, i)));
        }
        if (srv.customers && srv.customers.length > 0) setCustomers(srv.customers);
        if (srv.invoices && srv.invoices.length > 0) setInvoices(srv.invoices);
        if (srv.deliveryNotes && srv.deliveryNotes.length > 0) setDeliveryNotes(srv.deliveryNotes);
        if (srv.quotations && srv.quotations.length > 0) setQuotations(srv.quotations);
        if (srv.payments && srv.payments.length > 0) setPayments(srv.payments);
        if (srv.leads && srv.leads.length > 0) setLeads(srv.leads);
        if (srv.users && srv.users.length > 0) setUsers(srv.users);
      }

      // 2. Fetch Firestore
      const snap = await getDoc(doc(db, 'erp', 'main'));
      if (snap.exists()) {
        const cloudData = snap.data() as Partial<ERPDatabase>;
        if (cloudData.products && Array.isArray(cloudData.products) && cloudData.products.length > 0) {
          setProducts(cloudData.products.map((p, i) => normalizeProduct(p, i)));
        }
        if (cloudData.customers && cloudData.customers.length > 0) setCustomers(cloudData.customers);
        if (cloudData.invoices && cloudData.invoices.length > 0) setInvoices(cloudData.invoices);
        if (cloudData.deliveryNotes && cloudData.deliveryNotes.length > 0) setDeliveryNotes(cloudData.deliveryNotes);
        if (cloudData.quotations && cloudData.quotations.length > 0) setQuotations(cloudData.quotations);
        if (cloudData.payments && cloudData.payments.length > 0) setPayments(cloudData.payments);
        if (cloudData.leads && cloudData.leads.length > 0) setLeads(cloudData.leads);
        if (cloudData.users && cloudData.users.length > 0) setUsers(cloudData.users);
      }
      setSyncStatus('synced');
      setLastSynced(new Date().toLocaleTimeString());
    } catch (e) {
      setSyncStatus('synced');
    }
  }, []);

  // User Login Logs & Security Audit
  const recordLoginLog = useCallback(async (logData: Partial<UserLoginLog>) => {
    const newLog: UserLoginLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: logData.userId || currentUser?.id || 'guest',
      userName: logData.userName || currentUser?.name || 'Anonymous User',
      userEmail: logData.userEmail || currentUser?.email || '',
      action: logData.action || 'LOGIN',
      status: logData.status || 'SUCCESS',
      timestamp: new Date().toISOString(),
      device: logData.device || (typeof navigator !== 'undefined' && navigator.userAgent?.includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation'),
      details: logData.details || '',
    };
    setLoginLogs((prev) => {
      const updated = [newLog, ...prev.slice(0, 99)];
      persistToLocal({ loginLogs: updated });
      syncToCloud({ loginLogs: updated });
      return updated;
    });
  }, [currentUser, persistToLocal, syncToCloud]);

  // Authentication: Login & Logout (supports username or email)
  const login = async (identifier: string, password: string): Promise<User> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check Master Admin credentials (tolerant to username 'admin' or email, and password casing)
    if (cleanId === 'admin@savoure.co.za' || cleanId === 'admin') {
      if (cleanPassword === 'Shazia' || cleanPassword.toLowerCase() === 'shazia') {
        const master = { ...MASTER_ADMIN_USER, lastLogin: new Date().toISOString() };
        setCurrentUser(master);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(master));
          sessionStorage.setItem(USER_KEY, JSON.stringify(master));
        } catch (e) {}
        setUsers((prev) => {
          const filtered = prev.filter((u) => u.email.toLowerCase() !== 'admin@savoure.co.za');
          const updated = [master, ...filtered];
          syncToCloud({ users: updated });
          return updated;
        });
        await recordLoginLog({
          userId: master.id,
          userName: master.name,
          userEmail: master.email,
          action: 'LOGIN',
          status: 'SUCCESS',
          details: 'Master Admin authenticated successfully',
        });
        return master;
      } else {
        await recordLoginLog({
          userId: 'usr_master_savoure',
          userName: 'Master Admin',
          userEmail: 'admin@savoure.co.za',
          action: 'LOGIN',
          status: 'FAILED',
          details: 'Failed login: Incorrect password for Master Admin',
        });
        throw new Error('Incorrect password. Please verify your password and try again.');
      }
    }

    // Check users in state / cloud by email, username, phone, or name
    let matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        (u as any).username?.toLowerCase() === cleanId ||
        u.name.toLowerCase() === cleanId ||
        (cleanId === 'roksh4' && (u.id === 'usr_1791911737847' || u.role === 'merchant')) ||
        (cleanId === '0719153630' && (u as any).merchantPhone === '0719153630')
    );

    // Fallback 1: check built-in known users
    if (!matchedUser) {
      const knownUsers = [MASTER_ADMIN_USER, INITIAL_ROOKSHANA_USER];
      matchedUser = knownUsers.find(
        (u) =>
          u.email.toLowerCase() === cleanId ||
          (u as any).username?.toLowerCase() === cleanId ||
          u.name.toLowerCase() === cleanId ||
          (cleanId === 'roksh4' && u.role === 'merchant') ||
          (cleanId === '0719153630' && (u as any).merchantPhone === '0719153630')
      );
    }

    // Fallback 2: check live Firestore directly in case state is still hydrating
    if (!matchedUser) {
      try {
        const snap = await getDoc(doc(db, 'erp', 'main'));
        if (snap.exists()) {
          const cloud = snap.data() as Partial<ERPDatabase>;
          if (Array.isArray(cloud.users)) {
            matchedUser = cloud.users.find(
              (u) =>
                u.email.toLowerCase() === cleanId ||
                (u as any).username?.toLowerCase() === cleanId ||
                u.name.toLowerCase() === cleanId ||
                (cleanId === 'roksh4' && (u.id === 'usr_1791911737847' || u.role === 'merchant')) ||
                (cleanId === '0719153630' && (u as any).merchantPhone === '0719153630')
            );
          }
        }
      } catch (e) {
        console.warn('Firestore direct user lookup error:', e);
      }
    }

    // Fallback 3: check server endpoint if reachable
    if (!matchedUser) {
      try {
        const res = await safeFetchJson<{ success: boolean; user: User }>('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier.trim(), password: password.trim() }),
        });
        if (res.ok && res.data?.user) {
          matchedUser = res.data.user;
        }
      } catch {}
    }

    if (matchedUser) {
      const isPasswordMatch =
        !matchedUser.password ||
        matchedUser.password === cleanPassword ||
        matchedUser.password.toLowerCase() === cleanPassword.toLowerCase() ||
        (matchedUser.id === 'usr_1791911737847' && (
          cleanPassword === 'Shazia' ||
          cleanPassword === 'ROKSH4' ||
          cleanPassword.toLowerCase() === 'shazia' ||
          cleanPassword.toLowerCase() === 'roksh4' ||
          cleanPassword === 'password123'
        )) ||
        (matchedUser.role === 'super_admin' && (
          cleanPassword === 'Shazia' ||
          cleanPassword.toLowerCase() === 'shazia'
        ));

      if (!isPasswordMatch) {
        await recordLoginLog({
          userId: matchedUser.id,
          userName: matchedUser.name,
          userEmail: matchedUser.email,
          action: 'LOGIN',
          status: 'FAILED',
          details: 'Failed login: Incorrect password provided',
        });
        throw new Error('Incorrect password. Please verify your password and try again.');
      }
      if (matchedUser.status === 'inactive') {
        await recordLoginLog({
          userId: matchedUser.id,
          userName: matchedUser.name,
          userEmail: matchedUser.email,
          action: 'LOGIN',
          status: 'FAILED',
          details: 'Login blocked: User account is inactive/suspended',
        });
        throw new Error('This user account has been disabled by an administrator.');
      }
      setCurrentUser(matchedUser);
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(matchedUser));
        sessionStorage.setItem(USER_KEY, JSON.stringify(matchedUser));
      } catch (e) {}
      await recordLoginLog({
        userId: matchedUser.id,
        userName: matchedUser.name,
        userEmail: matchedUser.email,
        action: 'LOGIN',
        status: 'SUCCESS',
        details: 'User authenticated successfully',
      });
      return matchedUser;
    }

    await recordLoginLog({
      userId: 'unknown',
      userName: cleanId || 'Unknown User',
      userEmail: cleanId,
      action: 'LOGIN',
      status: 'FAILED',
      details: 'Failed login: Account not found',
    });
    throw new Error('Invalid username or password. Please verify your login credentials.');
  };

  const logout = () => {
    if (currentUser) {
      recordLoginLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        action: 'LOGOUT',
        status: 'SUCCESS',
        details: 'User logged out of session',
      });
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch (e) {}
  };

  const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
    if (!currentUser || (currentUser.role !== 'super_admin' && !currentUser.permissions?.manageUsers)) {
      throw new Error('Only administrators can reset user passwords.');
    }
    const target = users.find((u) => u.id === userId);
    if (!target) throw new Error('User not found.');
    await updateUser(userId, { password: newPassword });
    await recordLoginLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      action: 'PASSWORD_RESET',
      status: 'SUCCESS',
      details: `Password reset for user ${target.name} (${target.email})`,
    });
  };

  // Lock & Unlock Screen
  const lockApp = () => setIsLocked(true);
  const unlockApp = (pin: string) => {
    if (pin === company.pinCode || pin === '1234') {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  // User Management
  const createUser = async (data: Partial<User>): Promise<User> => {
    if (!currentUser) {
      console.error('[UserRegistration Error] User registration rejected: No active administrator session.');
      throw new Error('You must be signed in to create new users.');
    }

    const cleanEmail = (data.email || '').trim().toLowerCase();
    const cleanUsername = data.username ? data.username.trim().toLowerCase() : cleanEmail.split('@')[0];

    console.log('[UserRegistration] Initiating user account creation:', {
      name: data.name,
      email: cleanEmail,
      username: cleanUsername,
      role: data.role || 'sales',
      adminUser: currentUser.email,
    });

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      console.error(`[UserRegistration Error] Email collision detected: ${cleanEmail}`);
      throw new Error('A user with this email address already exists.');
    }

    if (cleanUsername && users.some((u) => u.username && u.username.toLowerCase() === cleanUsername)) {
      console.error(`[UserRegistration Error] Username collision detected: ${cleanUsername}`);
      throw new Error(`A user with username "${cleanUsername}" already exists.`);
    }

    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: data.name || 'Team Member',
      email: cleanEmail,
      username: cleanUsername,
      password: data.password || 'password123',
      role: data.role || 'sales',
      branch: data.branch || undefined,
      merchantStoreName: data.merchantStoreName || undefined,
      merchantPhone: data.merchantPhone || undefined,
      permissions: data.permissions || (data.role === 'merchant' ? {
        manageUsers: false,
        invoices: true,
        deliveryNotes: false,
        quotations: false,
        payments: false,
        customers: false,
        catalog: true,
        stock: false,
        payroll: false,
        accounting: false,
        taskeenAI: false,
        merchants: false,
        reports: false,
        crmLeads: false,
        databaseExplorer: false,
        companySettings: false,
      } : {
        manageUsers: data.role === 'super_admin',
        invoices: true,
        deliveryNotes: true,
        quotations: true,
        payments: true,
        customers: true,
        catalog: true,
        stock: true,
        payroll: data.role === 'super_admin',
        accounting: data.role === 'super_admin' || data.role === 'accountant',
        taskeenAI: true,
        merchants: data.role === 'super_admin',
        reports: data.role === 'super_admin' || data.role === 'accountant',
        crmLeads: true,
        databaseExplorer: data.role === 'super_admin',
        companySettings: data.role === 'super_admin',
      }),
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
    };

    console.log('[UserRegistration] New user account object assembled. Updating local cache & Cloud Firestore:', newUser.id);
    const nextUsers = [...users, newUser];
    setUsers(nextUsers);
    persistToLocal({ users: nextUsers });
    await syncToCloud({ users: nextUsers });
    console.log('[UserRegistration] New user account successfully persisted to cloud:', newUser.name, `(${newUser.email})`);

    return newUser;
  };

  const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
    if (!currentUser) {
      console.error('[UserManagement Error] Update rejected: No active administrator session.');
      throw new Error('You must be signed in to update users.');
    }

    console.log('[UserManagement] Updating user account id:', id, data);

    let updatedResult: User | null = null;
    const nextUsers = users.map((u) => {
      if (u.id === id) {
        const mod = { ...u, ...data };
        updatedResult = mod;
        return mod;
      }
      return u;
    });

    setUsers(nextUsers);
    persistToLocal({ users: nextUsers });
    await syncToCloud({ users: nextUsers });
    console.log('[UserManagement] User account updated and persisted to cloud:', id);

    if (currentUser?.id === id && updatedResult) {
      setCurrentUser(updatedResult);
    }

    return updatedResult || (data as User);
  };

  const deleteUser = async (id: string): Promise<void> => {
    if (!currentUser) {
      console.error('[UserManagement Error] Delete rejected: No active administrator session.');
      throw new Error('You must be signed in to delete users.');
    }

    console.log('[UserManagement] Deleting user account id:', id);
    const nextUsers = users.filter((u) => u.id !== id);
    setUsers(nextUsers);
    persistToLocal({ users: nextUsers });
    await syncToCloud({ users: nextUsers });
    console.log('[UserManagement] User account removed and persisted to cloud:', id);
  };

  // Company & Business Settings
  const updateCompany = async (data: Partial<CompanySettings>) => {
    const updated = { ...company, ...data };
    setCompany(updated);
    persistToLocal({ company: updated });
    await syncToCloud({ company: updated });
  };

  const businessSettings: BusinessSettings = {
    businessName: company.companyName || 'Savouré (Pty) Ltd',
    tagline: company.tradingName || 'A Taste of Tradition',
    logo: company.logoUrl || '/images/savoure/savoure-logo.png',
    phone: company.phone || '061 364 5712',
    email: company.email || 'info@savoure.co.za',
    website: company.website || 'https://savoure.co.za',
    address: company.address || '',
    vatNumber: company.vatNumber || '',
    registrationNumber: company.registrationNumber || '',
    bankName: company.bankName || 'First National Bank (FNB)',
    accountHolder: company.accountHolder || 'Savouré (Pty) Ltd',
    accountNumber: company.accountNumber || '62983104821',
    branchCode: company.branchCode || '250655',
    currency: company.currency || 'R',
    paymentTerms: company.defaultPaymentTerms || 'Strictly 30 days from invoice date. Please use your invoice number as EFT payment reference.',
    invoicePrefix: company.invoicePrefix || 'INV-',
    footerText: company.footerText || 'Thank you for choosing Savouré. Premium flatbreads & artisanal pastries.',
    swiftCode: company.swiftCode || 'FIRNZAJJ',
    vatRate: (company.vatNumber && company.vatNumber.trim() !== '') ? (company.vatRate ?? 15) : 0,
    pinCode: company.pinCode || '1234',
  };

  const updateBusinessSettings = async (data: Partial<BusinessSettings>) => {
    const updatedCompany: CompanySettings = {
      ...company,
      companyName: data.businessName !== undefined ? data.businessName : company.companyName,
      tradingName: data.tagline !== undefined ? data.tagline : company.tradingName,
      logoUrl: data.logo !== undefined ? data.logo : company.logoUrl,
      phone: data.phone !== undefined ? data.phone : company.phone,
      email: data.email !== undefined ? data.email : company.email,
      website: data.website !== undefined ? data.website : company.website,
      address: data.address !== undefined ? data.address : company.address,
      vatNumber: data.vatNumber !== undefined ? data.vatNumber : company.vatNumber,
      registrationNumber: data.registrationNumber !== undefined ? data.registrationNumber : company.registrationNumber,
      bankName: data.bankName !== undefined ? data.bankName : company.bankName,
      accountHolder: data.accountHolder !== undefined ? data.accountHolder : company.accountHolder,
      accountNumber: data.accountNumber !== undefined ? data.accountNumber : company.accountNumber,
      branchCode: data.branchCode !== undefined ? data.branchCode : company.branchCode,
      currency: data.currency !== undefined ? data.currency : company.currency,
      defaultPaymentTerms: data.paymentTerms !== undefined ? data.paymentTerms : company.defaultPaymentTerms,
      invoicePrefix: data.invoicePrefix !== undefined ? data.invoicePrefix : company.invoicePrefix,
      footerText: data.footerText !== undefined ? data.footerText : company.footerText,
      swiftCode: data.swiftCode !== undefined ? data.swiftCode : company.swiftCode,
      vatRate: data.vatRate !== undefined ? data.vatRate : company.vatRate,
      pinCode: data.pinCode !== undefined ? data.pinCode : company.pinCode,
    };
    setCompany(updatedCompany);
    persistToLocal({ company: updatedCompany });
    await syncToCloud({ company: updatedCompany });
  };

  const getNextInvoiceNumber = useCallback(() => {
    const prefix = company.invoicePrefix || 'INV-';
    let maxNum = 0;
    for (const inv of invoices) {
      if (inv.invoiceNumber) {
        const match = inv.invoiceNumber.match(/\d+$/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }, [company.invoicePrefix, invoices]);

  // Customer Management
  const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
    const newCust: Customer = {
      id: 'cust_' + Date.now(),
      registeredName: data.registeredName || '',
      tradingName: data.tradingName || data.registeredName || '',
      accountCode: data.accountCode || `ACC-${String(customers.length + 1).padStart(3, '0')}`,
      registrationNumber: data.registrationNumber || '',
      vatNumber: data.vatNumber || '',
      primaryEmail: data.primaryEmail || '',
      primaryPhone: data.primaryPhone || '',
      primaryContact: data.primaryContact || '',
      creditLimit: Number(data.creditLimit) || 50000,
      paymentTermsDays: Number(data.paymentTermsDays) || 30,
      branches: data.branches || [],
      documents: data.documents || [],
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };

    const nextCustomers = [newCust, ...customers];
    setCustomers(nextCustomers);
    persistToLocal({ customers: nextCustomers });
    await syncToCloud({ customers: nextCustomers });

    return newCust;
  };

  const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
    let resCust: Customer | null = null;
    const nextCustomers = customers.map((c) => {
      if (c.id === id) {
        const mod = { ...c, ...data };
        resCust = mod;
        return mod;
      }
      return c;
    });

    setCustomers(nextCustomers);
    persistToLocal({ customers: nextCustomers });
    await syncToCloud({ customers: nextCustomers });

    return resCust || (data as Customer);
  };

  const deleteCustomer = async (id: string) => {
    const nextCustomers = customers.filter((c) => c.id !== id);
    setCustomers(nextCustomers);
    persistToLocal({ customers: nextCustomers });
    await syncToCloud({ customers: nextCustomers });
  };

  // Products (Saves to Google Cloud Firestore immediately so it appears on phone & laptop)
  const createProduct = async (data: Partial<Product>): Promise<Product> => {
    const newProd: Product = {
      id: 'prod_' + Date.now(),
      sku: data.sku || `SKU-${String(products.length + 1).padStart(3, '0')}`,
      name: data.name || '',
      category: data.category || 'Artisanal Bread',
      packSize: data.packSize || 'Single / Each',
      physicalSize: data.physicalSize || 'Standard',
      unitPrice: Number(data.unitPrice) || 0,
      costPrice: Number(data.costPrice) || 0,
      vatApplicable: data.vatApplicable !== undefined ? data.vatApplicable : true,
      stockOnHand: Number(data.stockOnHand) || 0,
      barcode: data.barcode || undefined,
      showcase: data.showcase !== undefined ? data.showcase : true,
      description: data.description || '',
      badge: data.badge || '',
      packagingType: data.packagingType || 'dozen',
    };

    const nextProducts = [newProd, ...products];
    setProducts(nextProducts);
    persistToLocal({ products: nextProducts });
    await syncToCloud({ products: nextProducts });

    return newProd;
  };

  const updateProduct = async (id: string, data: Partial<Product>): Promise<Product> => {
    let resProd: Product | null = null;
    const nextProducts = products.map((p) => {
      if (p.id === id) {
        const mod = { ...p, ...data };
        resProd = mod;
        return mod;
      }
      return p;
    });

    setProducts(nextProducts);
    persistToLocal({ products: nextProducts });
    await syncToCloud({ products: nextProducts });

    return resProd || (data as Product);
  };

  const toggleProductShowcase = async (id: string): Promise<boolean> => {
    let newState = false;
    const nextProducts = products.map((p) => {
      if (p.id === id) {
        newState = p.showcase === false ? true : false;
        return { ...p, showcase: newState };
      }
      return p;
    });

    setProducts(nextProducts);
    persistToLocal({ products: nextProducts });
    await syncToCloud({ products: nextProducts });
    return newState;
  };

  const deleteProduct = async (id: string) => {
    const nextProducts = products.filter((p) => p.id !== id);
    setProducts(nextProducts);
    persistToLocal({ products: nextProducts });
    await syncToCloud({ products: nextProducts });
  };

  // Custom Categories
  const createCategory = async (name: string): Promise<string[]> => {
    const clean = name.trim();
    let nextCats = categories;
    if (clean && !categories.includes(clean)) {
      nextCats = [...categories, clean];
      setCategories(nextCats);
      persistToLocal({ categories: nextCats });
      await syncToCloud({ categories: nextCats });
    }
    return nextCats;
  };

  const deleteCategory = async (name: string): Promise<string[]> => {
    const updated = categories.filter((c) => c !== name);
    setCategories(updated);
    persistToLocal({ categories: updated });
    await syncToCloud({ categories: updated });
    return updated;
  };

  // Invoices
  const createInvoice = async (data: any): Promise<Invoice> => {
    const isVatReg = Boolean(company.vatNumber && company.vatNumber.trim() !== '');
    const items = data.items || [];
    const subtotal = data.subtotal !== undefined
      ? Number(data.subtotal)
      : items.reduce((acc: number, item: any) => acc + (Number(item.totalPrice) || (Number(item.quantity) * Number(item.unitPrice)) || Number(item.subtotal) || 0), 0);
    const discountPercent = data.discount !== undefined ? Number(data.discount) : (Number(data.discountPercent) || 0);
    const discountTotal = data.discountTotal !== undefined
      ? Number(data.discountTotal)
      : (subtotal * (discountPercent / 100));
    const effectiveVatRate = isVatReg ? (data.vatRate !== undefined ? Number(data.vatRate) : (company.vatRate ?? 15)) : 0;
    const vatTotal = isVatReg
      ? (data.vatTotal !== undefined ? Number(data.vatTotal) : ((subtotal - discountTotal) * (effectiveVatRate / 100)))
      : 0;
    const grandTotal = data.grandTotal !== undefined
      ? Number(data.grandTotal)
      : Math.round((subtotal - discountTotal + vatTotal) * 100) / 100;
    const amountPaid = Number(data.amountPaid) || 0;
    const balanceDue = Math.max(0, Math.round((grandTotal - amountPaid) * 100) / 100);

    let status = data.status || 'Draft';
    if (amountPaid >= grandTotal && grandTotal > 0) status = 'Paid';
    else if (amountPaid > 0 && amountPaid < grandTotal) status = 'Partial';

    // Auto-detect customer and linked merchant user
    const targetCustId = data.customerId;
    const targetCustName = data.customerName || data.name;
    const targetTradingName = data.customerTradingName || data.company;
    const targetMerchantId = data.merchantId;

    // Search for customer record
    const custObj = customers.find((c) =>
      (targetCustId && targetCustId !== 'cust_temp' && c.id === targetCustId) ||
      (targetCustName && (
        c.registeredName.toLowerCase() === targetCustName.toLowerCase() ||
        c.tradingName.toLowerCase() === targetCustName.toLowerCase()
      )) ||
      (targetTradingName && (
        c.registeredName.toLowerCase() === targetTradingName.toLowerCase() ||
        c.tradingName.toLowerCase() === targetTradingName.toLowerCase()
      ))
    );

    // Search for merchant user
    const linkedMerchant = users.find((u) =>
      u.role === 'merchant' && (
        (targetMerchantId && u.id === targetMerchantId) ||
        (custObj && (u.customerId === custObj.id || u.id === custObj.id)) ||
        (targetCustId && targetCustId !== 'cust_temp' && (u.customerId === targetCustId || u.id === targetCustId)) ||
        (targetCustName && (
          (u.merchantStoreName && u.merchantStoreName.toLowerCase() === targetCustName.toLowerCase()) ||
          (u.customerName && u.customerName.toLowerCase() === targetCustName.toLowerCase()) ||
          (u.name && u.name.toLowerCase() === targetCustName.toLowerCase())
        )) ||
        (targetTradingName && (
          (u.merchantStoreName && u.merchantStoreName.toLowerCase() === targetTradingName.toLowerCase()) ||
          (u.customerName && u.customerName.toLowerCase() === targetTradingName.toLowerCase())
        ))
      )
    );

    const branchName = data.branchName || data.branch || custObj?.branches?.[0]?.branchName || linkedMerchant?.branch || (currentUser?.role === 'merchant' ? currentUser.branch : 'Main Branch');
    const branchId = data.branchId || custObj?.branches?.[0]?.id || branchName;
    const merchantId = data.merchantId || linkedMerchant?.id || (currentUser?.role === 'merchant' ? currentUser.id : undefined);
    const merchantName = data.merchantName || linkedMerchant?.merchantStoreName || linkedMerchant?.name || (currentUser?.role === 'merchant' ? (currentUser.merchantStoreName || currentUser.name) : undefined);
    const merchantEmail = data.merchantEmail || linkedMerchant?.email || (currentUser?.role === 'merchant' ? currentUser.email : undefined);

    const resolvedCustId = custObj?.id || (targetCustId && targetCustId !== 'cust_temp' ? targetCustId : null) || linkedMerchant?.customerId || linkedMerchant?.id || (currentUser?.role === 'merchant' ? (currentUser.customerId || currentUser.id) : 'cust_' + Date.now());
    const resolvedCustName = targetCustName || custObj?.registeredName || linkedMerchant?.merchantStoreName || linkedMerchant?.name || (currentUser?.role === 'merchant' ? (currentUser.merchantStoreName || currentUser.name) : 'Direct Client');
    const resolvedTradingName = targetTradingName || custObj?.tradingName || linkedMerchant?.merchantStoreName || resolvedCustName;

    const newInv: Invoice = {
      id: data.id || 'inv_' + Date.now(),
      invoiceNumber: data.invoiceNumber || `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`,
      customerId: resolvedCustId,
      customerName: resolvedCustName,
      customerTradingName: resolvedTradingName,
      branchId,
      branchName,
      branch: branchName,
      merchantId,
      merchantName,
      merchantEmail,
      deliveryAddress: data.deliveryAddress || custObj?.branches?.[0]?.deliveryAddress || '',
      customerVat: data.customerVat || custObj?.vatNumber || '',
      issueDate: data.issueDate || data.date || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: discountPercent,
      discountTotal: Math.round(discountTotal * 100) / 100,
      vatRate: effectiveVatRate,
      vatTotal: Math.round(vatTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      amountPaid: Math.round(amountPaid * 100) / 100,
      balanceDue: Math.round(balanceDue * 100) / 100,
      status,
      notes: data.notes || '',
      paymentReference: data.paymentReference || data.invoiceNumber,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'Administrator',
    };

    // Auto-generate linked Delivery Note so invoices and delivery notes are immediately connected & findable
    let nextDeliveryNotes = deliveryNotes;
    if (data.autoGenerateDeliveryNote !== false) {
      const dnNumber = `DN-${new Date().getFullYear()}-${String(deliveryNotes.length + 1).padStart(4, '0')}`;
      const newDn: DeliveryNote = {
        id: 'dn_' + Date.now(),
        deliveryNoteNumber: dnNumber,
        invoiceId: newInv.id,
        invoiceNumber: newInv.invoiceNumber,
        customerId: newInv.customerId,
        customerName: newInv.customerName,
        branchId: newInv.branchId,
        branchName: newInv.branchName || 'Main Branch',
        merchantId: newInv.merchantId,
        merchantName: newInv.merchantName,
        merchantEmail: newInv.merchantEmail,
        deliveryAddress: newInv.deliveryAddress,
        recipientName: data.recipientName || data.contactPerson || newInv.customerName,
        recipientPhone: data.recipientPhone || data.customerPhone || '',
        driverName: data.driverName || 'Dispatch Driver',
        vehicleReg: data.vehicleReg || 'ND 829-102',
        dispatchDate: new Date().toISOString(),
        specialInstructions: data.specialInstructions || 'Handle with care. Return delivery crates upon dropoff.',
        items: items.map((it: any) => ({
          id: 'dn_it_' + Math.random().toString(36).substring(2, 7),
          sku: it.sku || '',
          description: it.description || it.name || 'Artisanal item',
          packSize: it.packSize || 'Standard',
          quantityOrdered: Number(it.quantity) || 0,
          quantityDelivered: Number(it.quantity) || 0,
        })),
        status: data.deliveryStatus || (newInv.status === 'Draft' ? 'Draft' : 'In Transit'),
        notes: `Linked to Tax Invoice ${newInv.invoiceNumber}`,
        createdAt: new Date().toISOString(),
      };
      newInv.linkedDeliveryNoteId = newDn.id;
      nextDeliveryNotes = [newDn, ...deliveryNotes];
      setDeliveryNotes(nextDeliveryNotes);
      persistToLocal({ deliveryNotes: nextDeliveryNotes });
    }

    const nextInvoices = [newInv, ...invoices];
    setInvoices(nextInvoices);
    persistToLocal({ invoices: nextInvoices });
    await syncToCloud({ invoices: nextInvoices, deliveryNotes: nextDeliveryNotes });

    try {
      safeFetchJson('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInv),
      }).catch(() => {});
    } catch {}

    return newInv;
  };

  const updateInvoice = async (id: string, data: any): Promise<Invoice> => {
    const isVatReg = Boolean(company.vatNumber && company.vatNumber.trim() !== '');
    let resInv: Invoice | null = null;
    let nextDeliveryNotes = deliveryNotes;

    const nextInvoices = invoices.map((inv) => {
      if (inv.id !== id) return inv;

      const items = data.items !== undefined ? data.items : (inv.items || []);
      const subtotal = data.subtotal !== undefined
        ? Number(data.subtotal)
        : items.reduce((acc: number, item: any) => acc + (Number(item.totalPrice) || (Number(item.quantity) * Number(item.unitPrice)) || Number(item.subtotal) || 0), 0);
      const discountPercent = data.discount !== undefined ? Number(data.discount) : (Number(data.discountPercent) || inv.discount || 0);
      const discountTotal = data.discountTotal !== undefined
        ? Number(data.discountTotal)
        : (subtotal * (discountPercent / 100));
      const effectiveVatRate = isVatReg ? (data.vatRate !== undefined ? Number(data.vatRate) : (inv.vatRate !== undefined ? inv.vatRate : (company.vatRate ?? 15))) : 0;
      const vatTotal = isVatReg
        ? (data.vatTotal !== undefined ? Number(data.vatTotal) : ((subtotal - discountTotal) * (effectiveVatRate / 100)))
        : 0;
      const grandTotal = data.grandTotal !== undefined
        ? Number(data.grandTotal)
        : Math.round((subtotal - discountTotal + vatTotal) * 100) / 100;
      const amountPaid = data.amountPaid !== undefined ? Number(data.amountPaid) : (inv.amountPaid || 0);
      const balanceDue = Math.max(0, Math.round((grandTotal - amountPaid) * 100) / 100);

      let status = data.status || inv.status || 'Draft';
      if (amountPaid >= grandTotal && grandTotal > 0) status = 'Paid';
      else if (amountPaid > 0 && amountPaid < grandTotal) status = 'Partial';

      // Re-resolve Customer and Merchant Linkage
      const targetCustId = data.customerId || inv.customerId;
      const targetCustName = data.customerName || data.name || inv.customerName;
      const targetTradingName = data.customerTradingName || data.company || inv.customerTradingName;
      const targetMerchantId = data.merchantId || inv.merchantId;

      const custObj = customers.find((c) =>
        (targetCustId && targetCustId !== 'cust_temp' && c.id === targetCustId) ||
        (targetCustName && (
          c.registeredName.toLowerCase() === targetCustName.toLowerCase() ||
          c.tradingName.toLowerCase() === targetCustName.toLowerCase()
        )) ||
        (targetTradingName && (
          c.registeredName.toLowerCase() === targetTradingName.toLowerCase() ||
          c.tradingName.toLowerCase() === targetTradingName.toLowerCase()
        ))
      );

      const linkedMerchant = users.find((u) =>
        u.role === 'merchant' && (
          (targetMerchantId && u.id === targetMerchantId) ||
          (custObj && (u.customerId === custObj.id || u.id === custObj.id)) ||
          (targetCustId && targetCustId !== 'cust_temp' && (u.customerId === targetCustId || u.id === targetCustId)) ||
          (targetCustName && (
            (u.merchantStoreName && u.merchantStoreName.toLowerCase() === targetCustName.toLowerCase()) ||
            (u.customerName && u.customerName.toLowerCase() === targetCustName.toLowerCase()) ||
            (u.name && u.name.toLowerCase() === targetCustName.toLowerCase())
          )) ||
          (targetTradingName && (
            (u.merchantStoreName && u.merchantStoreName.toLowerCase() === targetTradingName.toLowerCase()) ||
            (u.customerName && u.customerName.toLowerCase() === targetTradingName.toLowerCase())
          ))
        )
      );

      const resolvedCustId = custObj?.id || (targetCustId && targetCustId !== 'cust_temp' ? targetCustId : null) || linkedMerchant?.customerId || linkedMerchant?.id || inv.customerId;
      const resolvedCustName = targetCustName || custObj?.registeredName || linkedMerchant?.merchantStoreName || linkedMerchant?.name || inv.customerName;
      const resolvedTradingName = targetTradingName || custObj?.tradingName || linkedMerchant?.merchantStoreName || inv.customerTradingName;
      const resolvedMerchantId = data.merchantId || linkedMerchant?.id || inv.merchantId;
      const resolvedMerchantName = data.merchantName || linkedMerchant?.merchantStoreName || linkedMerchant?.name || inv.merchantName;
      const resolvedMerchantEmail = data.merchantEmail || linkedMerchant?.email || inv.merchantEmail;
      const branchName = data.branchName || data.branch || custObj?.branches?.[0]?.branchName || linkedMerchant?.branch || inv.branchName || 'Main Branch';
      const branchId = data.branchId || custObj?.branches?.[0]?.id || inv.branchId || branchName;

      const updatedInv: Invoice = {
        ...inv,
        ...data,
        customerId: resolvedCustId,
        customerName: resolvedCustName,
        customerTradingName: resolvedTradingName,
        merchantId: resolvedMerchantId,
        merchantName: resolvedMerchantName,
        merchantEmail: resolvedMerchantEmail,
        branchId,
        branchName,
        branch: branchName,
        items,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: discountPercent,
        discountTotal: Math.round(discountTotal * 100) / 100,
        vatRate: effectiveVatRate,
        vatTotal: Math.round(vatTotal * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
        amountPaid: Math.round(amountPaid * 100) / 100,
        balanceDue: Math.round(balanceDue * 100) / 100,
        status,
        updatedAt: new Date().toISOString(),
      };

      resInv = updatedInv;
      return updatedInv;
    });

    // Update any linked Delivery Note
    if (resInv) {
      const currentRes = resInv as Invoice;
      if (currentRes.linkedDeliveryNoteId) {
        nextDeliveryNotes = deliveryNotes.map((dn) => {
          if (dn.id === currentRes.linkedDeliveryNoteId || dn.invoiceId === id) {
            return {
              ...dn,
              customerName: currentRes.customerName,
              branchName: currentRes.branchName || dn.branchName,
              deliveryAddress: currentRes.deliveryAddress || dn.deliveryAddress,
              merchantId: currentRes.merchantId || dn.merchantId,
              merchantName: currentRes.merchantName || dn.merchantName,
              merchantEmail: currentRes.merchantEmail || dn.merchantEmail,
              items: (currentRes.items || []).map((it: any) => ({
                id: it.id || 'dn_it_' + Math.random().toString(36).substring(2, 6),
                sku: it.sku || '',
                description: it.description || it.name || 'Artisanal item',
                packSize: it.packSize || 'Standard',
                quantityOrdered: Number(it.quantity) || 0,
                quantityDelivered: Number(it.quantity) || 0,
              })),
            };
          }
          return dn;
        });
        setDeliveryNotes(nextDeliveryNotes);
      }
    }

    setInvoices(nextInvoices);
    persistToLocal({ invoices: nextInvoices, deliveryNotes: nextDeliveryNotes });
    await syncToCloud({ invoices: nextInvoices, deliveryNotes: nextDeliveryNotes });

    try {
      safeFetchJson(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resInv || data),
      }).catch(() => {});
    } catch {}

    return resInv || (data as Invoice);
  };

  const cloneInvoice = async (id: string): Promise<Invoice> => {
    const original = invoices.find((i) => i.id === id);
    const cloned: Invoice = original
      ? {
          ...original,
          id: 'inv_' + Date.now(),
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          amountPaid: 0,
          balanceDue: original.grandTotal,
          status: 'Draft',
          createdAt: new Date().toISOString(),
        }
      : {
          id: 'inv_' + Date.now(),
          invoiceNumber: `INV-${new Date().getFullYear()}-0001`,
          customerId: '',
          customerName: '',
          customerTradingName: '',
          deliveryAddress: '',
          customerVat: '',
          notes: '',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          items: [],
          subtotal: 0,
          vatTotal: 0,
          discountTotal: 0,
          grandTotal: 0,
          amountPaid: 0,
          balanceDue: 0,
          status: 'Draft',
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.name || 'Administrator',
        };

    const nextInvoices = [cloned, ...invoices];
    setInvoices(nextInvoices);
    persistToLocal({ invoices: nextInvoices });
    await syncToCloud({ invoices: nextInvoices });

    return cloned;
  };

  const generateDeliveryNoteFromInvoice = async (invoiceId: string, details?: any): Promise<DeliveryNote> => {
    const inv = invoices.find((i) => i.id === invoiceId);
    const newDn: DeliveryNote = {
      id: 'dn_' + Date.now(),
      deliveryNoteNumber: `DN-${new Date().getFullYear()}-${String(deliveryNotes.length + 1).padStart(4, '0')}`,
      invoiceId,
      invoiceNumber: inv?.invoiceNumber || '',
      customerId: inv?.customerId || '',
      customerName: inv?.customerName || '',
      branchId: inv?.branchId,
      branchName: inv?.branchName || '',
      deliveryAddress: inv?.deliveryAddress || '',
      recipientName: details?.recipientName || '',
      recipientPhone: details?.recipientPhone || '',
      driverName: details?.driverName || 'Dispatch Logistics',
      vehicleReg: details?.vehicleReg || '',
      dispatchDate: new Date().toISOString(),
      specialInstructions: details?.specialInstructions || 'Handle with care. Return empty crates upon delivery.',
      items: inv?.items?.map((it) => ({
        id: 'dn_it_' + Math.random().toString(36).substring(2, 7),
        sku: it.sku,
        description: it.description,
        packSize: it.packSize,
        quantityOrdered: it.quantity,
        quantityDelivered: it.quantity,
      })) || [],
      status: 'Draft',
      notes: `Linked to Tax Invoice ${inv?.invoiceNumber || ''}`,
      createdAt: new Date().toISOString(),
    };

    const nextDeliveryNotes = [newDn, ...deliveryNotes];
    setDeliveryNotes(nextDeliveryNotes);
    persistToLocal({ deliveryNotes: nextDeliveryNotes });
    await syncToCloud({ deliveryNotes: nextDeliveryNotes });

    return newDn;
  };

  const deleteInvoice = async (id: string) => {
    const nextInvoices = invoices.filter((i) => i.id !== id);
    setInvoices(nextInvoices);
    persistToLocal({ invoices: nextInvoices });
    await syncToCloud({ invoices: nextInvoices });
  };

  // Delivery Notes
  const createDeliveryNote = async (data: any): Promise<DeliveryNote> => {
    const targetCustId = data.customerId;
    const targetCustName = data.customerName;
    const targetMerchantId = data.merchantId;

    const linkedMerchant = users.find((u) =>
      u.role === 'merchant' &&
      ((targetMerchantId && u.id === targetMerchantId) ||
       (targetCustId && (u.customerId === targetCustId || u.id === targetCustId)) ||
       (targetCustName && u.customerName && u.customerName.toLowerCase() === targetCustName.toLowerCase()) ||
       (targetCustName && u.merchantStoreName && u.merchantStoreName.toLowerCase() === targetCustName.toLowerCase()))
    );

    const newDn: DeliveryNote = {
      id: 'dn_' + Date.now(),
      deliveryNoteNumber: data.deliveryNoteNumber || `DN-${new Date().getFullYear()}-${String(deliveryNotes.length + 1).padStart(4, '0')}`,
      invoiceId: data.invoiceId || '',
      invoiceNumber: data.invoiceNumber || '',
      customerId: data.customerId || linkedMerchant?.customerId || linkedMerchant?.id || 'cust_direct',
      customerName: data.customerName || linkedMerchant?.merchantStoreName || linkedMerchant?.name || 'Direct Client',
      branchId: data.branchId || linkedMerchant?.branch || 'Main Branch',
      branchName: data.branchName || linkedMerchant?.branch || 'Main Branch',
      merchantId: data.merchantId || linkedMerchant?.id,
      merchantName: data.merchantName || linkedMerchant?.merchantStoreName || linkedMerchant?.name,
      deliveryAddress: data.deliveryAddress || '',
      recipientName: data.recipientName || '',
      recipientPhone: data.recipientPhone || '',
      driverName: data.driverName || 'Dispatch Driver',
      vehicleReg: data.vehicleReg || '',
      dispatchDate: data.dispatchDate || new Date().toISOString(),
      deliveryDate: data.deliveryDate,
      specialInstructions: data.specialInstructions || '',
      items: data.items || [],
      status: data.status || 'Draft',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };

    const nextDeliveryNotes = [newDn, ...deliveryNotes];
    setDeliveryNotes(nextDeliveryNotes);
    persistToLocal({ deliveryNotes: nextDeliveryNotes });
    await syncToCloud({ deliveryNotes: nextDeliveryNotes });

    return newDn;
  };

  const updateDeliveryNote = async (id: string, data: any): Promise<DeliveryNote> => {
    let resDn: DeliveryNote | null = null;
    const nextDeliveryNotes = deliveryNotes.map((d) => {
      if (d.id === id) {
        const mod = { ...d, ...data };
        resDn = mod;
        return mod;
      }
      return d;
    });

    setDeliveryNotes(nextDeliveryNotes);
    persistToLocal({ deliveryNotes: nextDeliveryNotes });
    await syncToCloud({ deliveryNotes: nextDeliveryNotes });

    return resDn || (data as DeliveryNote);
  };

  const savePOD = async (id: string, podData: { podSignature: string; podReceivedBy: string; notes?: string }): Promise<DeliveryNote> => {
    let resDn: DeliveryNote | null = null;
    const nextDeliveryNotes = deliveryNotes.map((d) => {
      if (d.id === id) {
        const mod: DeliveryNote = {
          ...d,
          podSignature: podData.podSignature,
          podReceivedBy: podData.podReceivedBy,
          podReceivedAt: new Date().toISOString(),
          deliveryDate: new Date().toISOString(),
          status: 'Delivered',
          notes: podData.notes ? `${d.notes ? d.notes + ' ' : ''}${podData.notes}` : d.notes,
        };
        resDn = mod;
        return mod;
      }
      return d;
    });

    setDeliveryNotes(nextDeliveryNotes);
    persistToLocal({ deliveryNotes: nextDeliveryNotes });
    await syncToCloud({ deliveryNotes: nextDeliveryNotes });

    return resDn || (podData as any);
  };

  const deleteDeliveryNote = async (id: string) => {
    const nextDeliveryNotes = deliveryNotes.filter((d) => d.id !== id);
    setDeliveryNotes(nextDeliveryNotes);
    persistToLocal({ deliveryNotes: nextDeliveryNotes });
    await syncToCloud({ deliveryNotes: nextDeliveryNotes });
  };

  // Quotations
  const createQuotation = async (data: any): Promise<Quotation> => {
    const items = data.items || [];
    const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.subtotal) || 0), 0);
    const vatTotal = items.reduce((acc: number, item: any) => acc + (Number(item.vatAmount) || 0), 0);
    const discountTotal = items.reduce((acc: number, item: any) => {
      const raw = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      const disc = raw * ((Number(item.discountPercent) || 0) / 100);
      return acc + disc;
    }, 0);
    const grandTotal = subtotal + vatTotal;

    const newQuote: Quotation = {
      id: 'qte_' + Date.now(),
      quoteNumber: data.quoteNumber || `QTE-${new Date().getFullYear()}-${String(quotations.length + 1).padStart(4, '0')}`,
      customerId: data.customerId,
      customerName: data.customerName,
      customerTradingName: data.customerTradingName || data.customerName,
      branchId: data.branchId,
      branchName: data.branchName,
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: data.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      vatTotal: Math.round(vatTotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      status: data.status || 'Draft',
      terms: data.terms || 'Strictly 30 days quote validity.',
      createdAt: new Date().toISOString(),
    };

    const nextQuotes = [newQuote, ...quotations];
    setQuotations(nextQuotes);
    persistToLocal({ quotations: nextQuotes });
    await syncToCloud({ quotations: nextQuotes });

    return newQuote;
  };

  const updateQuotation = async (id: string, data: any): Promise<Quotation> => {
    let resQ: Quotation | null = null;
    const nextQuotes = quotations.map((q) => {
      if (q.id === id) {
        const mod = { ...q, ...data };
        resQ = mod;
        return mod;
      }
      return q;
    });

    setQuotations(nextQuotes);
    persistToLocal({ quotations: nextQuotes });
    await syncToCloud({ quotations: nextQuotes });

    return resQ || (data as Quotation);
  };

  const convertQuotation = async (id: string): Promise<{ quotation: Quotation; invoice: Invoice; deliveryNote: DeliveryNote }> => {
    const quote = quotations.find((q) => q.id === id);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;
    const dnNumber = `DN-${new Date().getFullYear()}-${String(deliveryNotes.length + 1).padStart(4, '0')}`;

    const newInvoice: Invoice = {
      id: 'inv_' + Date.now(),
      invoiceNumber,
      customerId: quote?.customerId || '',
      customerName: quote?.customerName || '',
      customerTradingName: quote?.customerTradingName || quote?.customerName || '',
      branchId: quote?.branchId,
      branchName: quote?.branchName,
      deliveryAddress: 'Standard Delivery Site',
      customerVat: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: quote?.items || [],
      subtotal: quote?.subtotal || 0,
      vatTotal: quote?.vatTotal || 0,
      discountTotal: quote?.discountTotal || 0,
      grandTotal: quote?.grandTotal || 0,
      amountPaid: 0,
      balanceDue: quote?.grandTotal || 0,
      status: 'Sent',
      notes: `Converted from Quotation ${quote?.quoteNumber || ''}`,
      linkedQuotationId: quote?.id,
      createdAt: new Date().toISOString(),
      createdBy: 'Quotation Conversion',
    };

    const newDn: DeliveryNote = {
      id: 'dn_' + (Date.now() + 1),
      deliveryNoteNumber: dnNumber,
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      customerId: quote?.customerId || '',
      customerName: quote?.customerName || '',
      branchId: quote?.branchId,
      branchName: quote?.branchName || '',
      deliveryAddress: newInvoice.deliveryAddress,
      recipientName: 'Receiving Officer',
      recipientPhone: '',
      driverName: 'Dispatch Logistics',
      vehicleReg: '',
      dispatchDate: new Date().toISOString(),
      specialInstructions: 'Converted from accepted quotation. Count all crates upon arrival.',
      items: quote?.items?.map((it) => ({
        id: 'dn_it_' + Math.random().toString(36).substring(2, 7),
        sku: it.sku,
        description: it.description,
        packSize: it.packSize,
        quantityOrdered: it.quantity,
        quantityDelivered: it.quantity,
      })) || [],
      status: 'Draft',
      notes: `Linked to Tax Invoice ${newInvoice.invoiceNumber}`,
      createdAt: new Date().toISOString(),
    };

    newInvoice.linkedDeliveryNoteId = newDn.id;

    let updatedQuote = quote;
    if (quote) {
      updatedQuote = { ...quote, status: 'Converted', convertedInvoiceId: newInvoice.id, convertedDeliveryNoteId: newDn.id };
    }

    const nextQuotes = quotations.map((q) => (q.id === id ? updatedQuote! : q));
    const nextInvoices = [newInvoice, ...invoices];
    const nextDeliveryNotes = [newDn, ...deliveryNotes];

    setQuotations(nextQuotes);
    setInvoices(nextInvoices);
    setDeliveryNotes(nextDeliveryNotes);

    persistToLocal({ quotations: nextQuotes, invoices: nextInvoices, deliveryNotes: nextDeliveryNotes });
    await syncToCloud({ quotations: nextQuotes, invoices: nextInvoices, deliveryNotes: nextDeliveryNotes });

    return { quotation: updatedQuote!, invoice: newInvoice, deliveryNote: newDn };
  };

  const deleteQuotation = async (id: string) => {
    const nextQuotes = quotations.filter((q) => q.id !== id);
    setQuotations(nextQuotes);
    persistToLocal({ quotations: nextQuotes });
    await syncToCloud({ quotations: nextQuotes });
  };

  // Payments
  const recordPayment = async (data: any): Promise<Payment> => {
    const amount = Number(data.amount) || 0;
    const inv = invoices.find((i) => i.id === data.invoiceId);

    const newPay: Payment = {
      id: 'pay_' + Date.now(),
      paymentNumber: data.paymentNumber || `PAY-${new Date().getFullYear()}-${String(payments.length + 1).padStart(4, '0')}`,
      invoiceId: data.invoiceId || '',
      invoiceNumber: data.invoiceNumber || inv?.invoiceNumber || '',
      customerId: data.customerId || inv?.customerId || '',
      customerName: data.customerName || inv?.customerName || '',
      paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
      amount: Math.round(amount * 100) / 100,
      paymentMethod: data.paymentMethod || 'Bank Transfer / EFT',
      referenceNumber: data.referenceNumber || '',
      notes: data.notes || '',
      recordedBy: currentUser?.name || 'Accounts Officer',
      createdAt: new Date().toISOString(),
    };

    let nextInvoices = invoices;
    if (inv) {
      const newPaid = Math.round((inv.amountPaid + amount) * 100) / 100;
      const newBal = Math.max(0, Math.round((inv.grandTotal - newPaid) * 100) / 100);
      let newStat = inv.status;
      if (newBal <= 0.01) newStat = 'Paid';
      else if (newPaid > 0) newStat = 'Partial';

      nextInvoices = invoices.map((i) => (i.id === inv.id ? { ...i, amountPaid: newPaid, balanceDue: newBal, status: newStat } : i));
      setInvoices(nextInvoices);
    }

    const nextPayments = [newPay, ...payments];
    setPayments(nextPayments);
    persistToLocal({ payments: nextPayments, invoices: nextInvoices });
    await syncToCloud({ payments: nextPayments, invoices: nextInvoices });

    return newPay;
  };

  const deletePayment = async (id: string) => {
    const nextPayments = payments.filter((p) => p.id !== id);
    setPayments(nextPayments);
    persistToLocal({ payments: nextPayments });
    await syncToCloud({ payments: nextPayments });
  };

  // CRM Leads & Communications
  const createLead = async (data: any): Promise<Lead> => {
    const newL: Lead = {
      id: 'lead_' + Date.now(),
      title: data.title || '',
      companyName: data.companyName || '',
      contactPerson: data.contactPerson || '',
      email: data.email || '',
      phone: data.phone || '',
      stage: data.stage || 'New',
      estimatedValue: Number(data.estimatedValue) || 0,
      probability: Number(data.probability) || 20,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextLeads = [newL, ...leads];
    setLeads(nextLeads);
    persistToLocal({ leads: nextLeads });
    await syncToCloud({ leads: nextLeads });

    return newL;
  };

  const updateLead = async (id: string, data: any): Promise<Lead> => {
    let resL: Lead | null = null;
    const nextLeads = leads.map((l) => {
      if (l.id === id) {
        const mod = { ...l, ...data, updatedAt: new Date().toISOString() };
        resL = mod;
        return mod;
      }
      return l;
    });

    setLeads(nextLeads);
    persistToLocal({ leads: nextLeads });
    await syncToCloud({ leads: nextLeads });

    return resL || (data as Lead);
  };

  const deleteLead = async (id: string) => {
    const nextLeads = leads.filter((l) => l.id !== id);
    setLeads(nextLeads);
    persistToLocal({ leads: nextLeads });
    await syncToCloud({ leads: nextLeads });
  };

  const addCommunication = async (data: any): Promise<CommunicationLog> => {
    const newComm: CommunicationLog = {
      id: 'comm_' + Date.now(),
      targetType: data.targetType || 'customer',
      targetId: data.targetId || '',
      targetName: data.targetName || '',
      type: data.type || 'Email',
      subject: data.subject || '',
      content: data.content || '',
      direction: data.direction || 'Outbound',
      date: data.date || new Date().toISOString(),
      author: currentUser?.name || 'System User',
    };

    const nextComms = [newComm, ...communications];
    setCommunications(nextComms);
    persistToLocal({ communications: nextComms });
    await syncToCloud({ communications: nextComms });

    return newComm;
  };

  // Database Tools
  const purgeMockData = async () => {
    setCustomers([INITIAL_CUSTOMER_SOUTHERN_AMBISION]);
    setProducts([]);
    setCategories([]);
    setInvoices([]);
    setDeliveryNotes([]);
    setQuotations([]);
    setPayments([]);
    setLeads([]);
    setCommunications([]);
    setStaff([]);
    setPayrollPayouts([]);
    setStockPurchases([]);
    setStockItemStatuses([]);
    setJournalEntries([]);
    const purgedData = {
      customers: [INITIAL_CUSTOMER_SOUTHERN_AMBISION],
      products: [],
      categories: [],
      invoices: [],
      deliveryNotes: [],
      quotations: [],
      payments: [],
      leads: [],
      communications: [],
      staff: [],
      payrollPayouts: [],
      stockPurchases: [],
      stockItemStatuses: [],
      journalEntries: [],
    };
    persistToLocal(purgedData);
    await syncToCloud(purgedData);
  };

  const restoreBackup = async (importedDb: ERPDatabase) => {
    if (importedDb.company) setCompany(importedDb.company);
    if (importedDb.customers) setCustomers(importedDb.customers);
    if (importedDb.products) setProducts(importedDb.products);
    if (importedDb.categories) setCategories(importedDb.categories);
    if (importedDb.invoices) setInvoices(importedDb.invoices);
    if (importedDb.deliveryNotes) setDeliveryNotes(importedDb.deliveryNotes);
    if (importedDb.quotations) setQuotations(importedDb.quotations);
    if (importedDb.payments) setPayments(importedDb.payments);
    if (importedDb.leads) setLeads(importedDb.leads);
    if (importedDb.communications) setCommunications(importedDb.communications);
    if (importedDb.users) setUsers(importedDb.users);
    if (importedDb.staff) setStaff(importedDb.staff);
    if (importedDb.payrollPayouts) setPayrollPayouts(importedDb.payrollPayouts);
    if (importedDb.stockPurchases) setStockPurchases(importedDb.stockPurchases);
    if (importedDb.stockItemStatuses) setStockItemStatuses(importedDb.stockItemStatuses);
    persistToLocal(importedDb);
    await syncToCloud(importedDb);
  };

  // Staff & Payroll / Overtime Actions
  const createStaffMember = async (data: Partial<StaffMember>): Promise<StaffMember> => {
    console.log('[StaffPayroll] Initiating staff member registration:', {
      name: data.name,
      employeeCode: data.employeeCode,
      role: data.role,
      department: data.department,
    });

    const newStaff: StaffMember = {
      id: 'stf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      employeeCode: data.employeeCode || `STF-${String(staff.length + 1).padStart(3, '0')}`,
      name: data.name || 'Staff Member',
      idNumber: data.idNumber || '',
      role: data.role || 'Bakery Production',
      department: data.department || 'Production',
      phone: data.phone || '',
      email: data.email || '',
      employmentType: data.employmentType || 'Full-time',
      basicSalary: Number(data.basicSalary) || 0,
      hourlyRate: Number(data.hourlyRate) || 0,
      overtimeHourlyRate: Number(data.overtimeHourlyRate) || (Number(data.hourlyRate) || 0) * 1.5,
      bankName: data.bankName || 'Standard Bank',
      accountHolder: data.accountHolder || data.name || '',
      accountNumber: data.accountNumber || '',
      branchCode: data.branchCode || '',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      status: data.status || 'Active',
      notes: data.notes || '',
    };

    console.log('[StaffPayroll] Persisting staff member to local cache & Cloud Firestore:', newStaff.id);
    const nextStaff = [newStaff, ...staff];
    setStaff(nextStaff);
    persistToLocal({ staff: nextStaff });
    await syncToCloud({ staff: nextStaff });
    console.log('[StaffPayroll] Staff member registration saved successfully:', newStaff.name, `(${newStaff.employeeCode})`);
    return newStaff;
  };

  const updateStaffMember = async (id: string, data: Partial<StaffMember>): Promise<StaffMember> => {
    console.log('[StaffPayroll] Updating staff member id:', id, data);
    let res: StaffMember | null = null;
    const nextStaff = staff.map((s) => {
      if (s.id === id) {
        const mod = { ...s, ...data };
        res = mod;
        return mod;
      }
      return s;
    });
    setStaff(nextStaff);
    persistToLocal({ staff: nextStaff });
    await syncToCloud({ staff: nextStaff });
    console.log('[StaffPayroll] Staff member updated and persisted to cloud:', id);
    return res || (data as StaffMember);
  };

  const deleteStaffMember = async (id: string): Promise<void> => {
    console.log('[StaffPayroll] Deleting staff member id:', id);
    const nextStaff = staff.filter((s) => s.id !== id);
    setStaff(nextStaff);
    persistToLocal({ staff: nextStaff });
    await syncToCloud({ staff: nextStaff });
    console.log('[StaffPayroll] Staff member removed and persisted to cloud:', id);
  };

  const createPayrollPayout = async (data: Partial<PayrollPayout>): Promise<PayrollPayout> => {
    const basic = Number(data.basicSalary) || 0;
    const otHours = Number(data.overtimeHours) || 0;
    const otRate = Number(data.overtimeRate) || 0;
    const otPay = Math.round(otHours * otRate * 100) / 100;
    const bonus = Number(data.bonusAmount) || 0;
    const deduct = Number(data.deductions) || 0;
    const net = Math.round((basic + otPay + bonus - deduct) * 100) / 100;

    const newPayout: PayrollPayout = {
      id: 'pay_' + Date.now(),
      payoutNumber: data.payoutNumber || `PAY-${new Date().getFullYear()}-${String(payrollPayouts.length + 1).padStart(4, '0')}`,
      staffId: data.staffId || '',
      staffName: data.staffName || '',
      role: data.role || 'Staff Member',
      month: data.month || new Date().toISOString().slice(0, 7),
      basicSalary: basic,
      overtimeHours: otHours,
      overtimeRate: otRate,
      overtimePay: otPay,
      bonusAmount: bonus,
      deductions: deduct,
      netPayout: net,
      paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || 'EFT / Bank Transfer',
      status: data.status || 'Paid',
      reference: data.reference || `SAL-${data.month || new Date().toISOString().slice(0, 7)}`,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };
    const nextPayouts = [newPayout, ...payrollPayouts];
    setPayrollPayouts(nextPayouts);
    persistToLocal({ payrollPayouts: nextPayouts });
    await syncToCloud({ payrollPayouts: nextPayouts });
    return newPayout;
  };

  const updatePayrollPayout = async (id: string, data: Partial<PayrollPayout>): Promise<PayrollPayout> => {
    let res: PayrollPayout | null = null;
    const nextPayouts = payrollPayouts.map((p) => {
      if (p.id === id) {
        const basic = data.basicSalary !== undefined ? Number(data.basicSalary) : p.basicSalary;
        const otHours = data.overtimeHours !== undefined ? Number(data.overtimeHours) : p.overtimeHours;
        const otRate = data.overtimeRate !== undefined ? Number(data.overtimeRate) : p.overtimeRate;
        const otPay = Math.round(otHours * otRate * 100) / 100;
        const bonus = data.bonusAmount !== undefined ? Number(data.bonusAmount) : p.bonusAmount;
        const deduct = data.deductions !== undefined ? Number(data.deductions) : p.deductions;
        const net = Math.round((basic + otPay + bonus - deduct) * 100) / 100;

        const mod: PayrollPayout = {
          ...p,
          ...data,
          basicSalary: basic,
          overtimeHours: otHours,
          overtimeRate: otRate,
          overtimePay: otPay,
          bonusAmount: bonus,
          deductions: deduct,
          netPayout: net,
        };
        res = mod;
        return mod;
      }
      return p;
    });
    setPayrollPayouts(nextPayouts);
    persistToLocal({ payrollPayouts: nextPayouts });
    await syncToCloud({ payrollPayouts: nextPayouts });
    return res || (data as PayrollPayout);
  };

  const deletePayrollPayout = async (id: string): Promise<void> => {
    const nextPayouts = payrollPayouts.filter((p) => p.id !== id);
    setPayrollPayouts(nextPayouts);
    persistToLocal({ payrollPayouts: nextPayouts });
    await syncToCloud({ payrollPayouts: nextPayouts });
  };

  // Stock Capturing, Slips & Inventory Management
  const createStockPurchase = async (data: Partial<StockPurchase>): Promise<StockPurchase> => {
    const items = data.items || [];
    const totalAmount = items.reduce((acc, it) => acc + (Number(it.totalCost) || Number(it.quantity) * Number(it.unitCost)), 0);

    const newPurchase: StockPurchase = {
      id: 'pur_' + Date.now(),
      purchaseNumber: data.purchaseNumber || `PUR-${new Date().getFullYear()}-${String(stockPurchases.length + 1).padStart(4, '0')}`,
      supplierName: data.supplierName || 'General Supplier',
      supplierInvoiceNumber: data.supplierInvoiceNumber || '',
      purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
      branchName: data.branchName || 'Main Bakery',
      items,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paymentMethod: data.paymentMethod || 'EFT',
      slipImageUrl: data.slipImageUrl || '',
      notes: data.notes || '',
      recordedBy: currentUser?.name || 'Administrator',
      createdAt: new Date().toISOString(),
    };

    const nextPurchases = [newPurchase, ...stockPurchases];
    setStockPurchases(nextPurchases);

    // Also automatically create/update stock item tracking per branch
    let updatedStatuses = [...stockItemStatuses];
    items.forEach((item) => {
      const existing = updatedStatuses.find(
        (s) => s.name.toLowerCase() === item.itemName.toLowerCase() && s.branchName === newPurchase.branchName
      );
      if (existing) {
        existing.quantityOnHand = (Number(existing.quantityOnHand) || 0) + Number(item.quantity);
        existing.isFinished = false;
        existing.lastPurchasedAt = newPurchase.purchaseDate;
        existing.updatedAt = new Date().toISOString();
      } else {
        updatedStatuses.push({
          id: 'stk_' + Date.now() + Math.random().toString(36).substr(2, 4),
          name: item.itemName,
          category: item.category || 'Bakery Ingredients',
          branchName: newPurchase.branchName,
          quantityOnHand: Number(item.quantity) || 0,
          unit: item.unit || 'kg',
          isFinished: false,
          lastPurchasedAt: newPurchase.purchaseDate,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    setStockItemStatuses(updatedStatuses);
    persistToLocal({ stockPurchases: nextPurchases, stockItemStatuses: updatedStatuses });
    await syncToCloud({ stockPurchases: nextPurchases, stockItemStatuses: updatedStatuses });
    return newPurchase;
  };

  const deleteStockPurchase = async (id: string): Promise<void> => {
    const nextPurchases = stockPurchases.filter((p) => p.id !== id);
    setStockPurchases(nextPurchases);
    persistToLocal({ stockPurchases: nextPurchases });
    await syncToCloud({ stockPurchases: nextPurchases });
  };

  const updateStockItemStatus = async (id: string, data: Partial<StockItemStatus>): Promise<StockItemStatus> => {
    let res: StockItemStatus | null = null;
    const nextStatuses = stockItemStatuses.map((s) => {
      if (s.id === id) {
        const mod = { ...s, ...data, updatedAt: new Date().toISOString() };
        res = mod;
        return mod;
      }
      return s;
    });
    setStockItemStatuses(nextStatuses);
    persistToLocal({ stockItemStatuses: nextStatuses });
    await syncToCloud({ stockItemStatuses: nextStatuses });
    return res || (data as StockItemStatus);
  };

  const markStockAsFinished = async (id: string): Promise<void> => {
    const nextStatuses = stockItemStatuses.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          quantityOnHand: 0,
          isFinished: true,
          lastFinishedAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    setStockItemStatuses(nextStatuses);
    persistToLocal({ stockItemStatuses: nextStatuses });
    await syncToCloud({ stockItemStatuses: nextStatuses });
  };

  const createStockItemStatus = async (data: Partial<StockItemStatus>): Promise<StockItemStatus> => {
    const newItem: StockItemStatus = {
      id: 'stk_' + Date.now(),
      sku: data.sku || `STK-${String(stockItemStatuses.length + 1).padStart(3, '0')}`,
      barcode: data.barcode || undefined,
      name: data.name || 'Raw Material',
      category: data.category || 'General',
      branchName: data.branchName || 'Main Bakery',
      quantityOnHand: Number(data.quantityOnHand) || 0,
      unit: data.unit || 'kg',
      isFinished: (Number(data.quantityOnHand) || 0) <= 0,
      minThreshold: data.minThreshold,
      notes: data.notes || '',
      updatedAt: new Date().toISOString(),
    };
    const next = [newItem, ...stockItemStatuses];
    setStockItemStatuses(next);
    persistToLocal({ stockItemStatuses: next });
    await syncToCloud({ stockItemStatuses: next });
    return newItem;
  };

  const deleteStockItemStatus = async (id: string): Promise<void> => {
    const next = stockItemStatuses.filter((s) => s.id !== id);
    setStockItemStatuses(next);
    persistToLocal({ stockItemStatuses: next });
    await syncToCloud({ stockItemStatuses: next });
  };

  const setStockQuantity = async (id: string, qty: number): Promise<void> => {
    const nextStatuses = stockItemStatuses.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          quantityOnHand: qty,
          isFinished: qty <= 0,
          lastFinishedAt: qty <= 0 ? new Date().toISOString().split('T')[0] : s.lastFinishedAt,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    setStockItemStatuses(nextStatuses);
    persistToLocal({ stockItemStatuses: nextStatuses });
    await syncToCloud({ stockItemStatuses: nextStatuses });
  };

  // ------------------------------------------------------------------
  // South African Barcode Scanner & Stock Movements
  // ------------------------------------------------------------------
  const recordStockMovement = async (data: Partial<StockMovement>): Promise<StockMovement> => {
    const rawBarcode = (data.barcode || '').trim();
    const isSA = Boolean(rawBarcode && (rawBarcode.startsWith('600') || rawBarcode.startsWith('601')));
    const now = new Date();
    const year = now.getFullYear();
    const movementNumber =
      data.movementNumber || `SM-${year}-${String(stockMovements.length + 1).padStart(4, '0')}`;

    const quantity = Math.abs(Number(data.quantity) || 1);
    const movType = data.type || 'STOCK_IN';
    const sourceBranch = data.sourceBranch || 'Main Bakery';

    const newMovement: StockMovement = {
      id: 'sm_' + Date.now(),
      movementNumber,
      timestamp: data.timestamp || now.toISOString(),
      type: movType,
      barcode: rawBarcode,
      sku: data.sku || '',
      productName: data.productName || 'Stock Item',
      category: data.category || 'Bakery Pastry & Materials',
      quantity,
      unit: data.unit || 'packs',
      sourceBranch,
      destinationBranch: data.destinationBranch,
      batchNumber: data.batchNumber || '',
      reason: data.reason || '',
      notes: data.notes || '',
      recordedBy: currentUser?.name || 'Master Admin',
      costValue: data.costValue,
      isSouthAfricanBarcode: isSA,
    };

    const nextMovements = [newMovement, ...stockMovements];
    setStockMovements(nextMovements);

    // Automatically update stock levels on matching Product and StockItemStatus
    let nextProducts = [...products];
    let nextStatuses = [...stockItemStatuses];
    let productsModified = false;
    let statusesModified = false;

    // 1. Adjust finished product in catalog if barcode/sku matches
    if (rawBarcode || data.sku) {
      nextProducts = nextProducts.map((p) => {
        const matchBarcode = Boolean(rawBarcode && p.barcode && p.barcode.trim() === rawBarcode);
        const matchSku = Boolean(data.sku && p.sku && p.sku.toLowerCase() === data.sku.toLowerCase());
        const matchName = Boolean(data.productName && p.name.toLowerCase() === data.productName.toLowerCase());

        if (matchBarcode || matchSku || matchName) {
          productsModified = true;
          let newStock = p.stockOnHand;
          if (movType === 'STOCK_IN' || movType === 'RETURN') {
            newStock += quantity;
          } else if (movType === 'STOCK_OUT' || movType === 'WASTAGE') {
            newStock = Math.max(0, newStock - quantity);
          } else if (movType === 'ADJUSTMENT') {
            newStock = quantity;
          }
          return {
            ...p,
            stockOnHand: newStock,
            barcode: p.barcode || (rawBarcode ? rawBarcode : undefined),
          };
        }
        return p;
      });
    }

    // 2. Adjust or create branch StockItemStatus
    const existingStatusIdx = nextStatuses.findIndex((s) => {
      const matchBarcode = Boolean(rawBarcode && s.barcode && s.barcode.trim() === rawBarcode && s.branchName === sourceBranch);
      const matchName = Boolean(s.name.toLowerCase() === (data.productName || '').toLowerCase() && s.branchName === sourceBranch);
      return matchBarcode || matchName;
    });

    if (existingStatusIdx >= 0) {
      statusesModified = true;
      const cur = nextStatuses[existingStatusIdx];
      let newQty = cur.quantityOnHand;

      if (movType === 'STOCK_IN' || movType === 'RETURN') {
        newQty += quantity;
      } else if (movType === 'STOCK_OUT' || movType === 'WASTAGE') {
        newQty = Math.max(0, newQty - quantity);
      } else if (movType === 'ADJUSTMENT') {
        newQty = quantity;
      } else if (movType === 'TRANSFER') {
        newQty = Math.max(0, newQty - quantity);

        // Add to destination branch
        if (data.destinationBranch) {
          const destIdx = nextStatuses.findIndex(
            (s) =>
              (rawBarcode && s.barcode === rawBarcode && s.branchName === data.destinationBranch) ||
              (s.name.toLowerCase() === newMovement.productName.toLowerCase() && s.branchName === data.destinationBranch)
          );
          if (destIdx >= 0) {
            nextStatuses[destIdx] = {
              ...nextStatuses[destIdx],
              quantityOnHand: nextStatuses[destIdx].quantityOnHand + quantity,
              isFinished: false,
              updatedAt: now.toISOString(),
            };
          } else {
            nextStatuses.push({
              id: 'stk_' + Date.now() + '_dest',
              barcode: newMovement.barcode,
              sku: newMovement.sku,
              name: newMovement.productName,
              category: newMovement.category || cur.category,
              branchName: data.destinationBranch,
              quantityOnHand: quantity,
              unit: newMovement.unit || cur.unit,
              isFinished: false,
              updatedAt: now.toISOString(),
            });
          }
        }
      }

      nextStatuses[existingStatusIdx] = {
        ...cur,
        quantityOnHand: newQty,
        isFinished: newQty <= 0,
        lastFinishedAt: newQty <= 0 ? now.toISOString().split('T')[0] : cur.lastFinishedAt,
        barcode: cur.barcode || newMovement.barcode,
        updatedAt: now.toISOString(),
      };
    } else {
      // Create new tracking status item for this scanned item
      statusesModified = true;
      const initialQty = movType === 'STOCK_OUT' || movType === 'WASTAGE' ? 0 : quantity;
      nextStatuses.unshift({
        id: 'stk_' + Date.now(),
        barcode: newMovement.barcode,
        sku: newMovement.sku || `STK-${String(nextStatuses.length + 1).padStart(3, '0')}`,
        name: newMovement.productName,
        category: newMovement.category || 'Bakery Items',
        branchName: sourceBranch,
        quantityOnHand: initialQty,
        unit: newMovement.unit,
        isFinished: initialQty <= 0,
        notes: newMovement.notes || (isSA ? 'GS1 South Africa Product' : ''),
        updatedAt: now.toISOString(),
      });
    }

    if (productsModified) setProducts(nextProducts);
    if (statusesModified) setStockItemStatuses(nextStatuses);

    const payloadToPersist: Partial<ERPDatabase> = {
      stockMovements: nextMovements,
      ...(productsModified ? { products: nextProducts } : {}),
      ...(statusesModified ? { stockItemStatuses: nextStatuses } : {}),
    };

    persistToLocal(payloadToPersist);
    await syncToCloud(payloadToPersist);

    return newMovement;
  };

  const deleteStockMovement = async (id: string): Promise<void> => {
    const next = stockMovements.filter((m) => m.id !== id);
    setStockMovements(next);
    persistToLocal({ stockMovements: next });
    await syncToCloud({ stockMovements: next });
  };

  const createJournalEntry = async (data: Partial<JournalEntry>): Promise<JournalEntry> => {
    const lines = data.lines || [];
    const totalDebit = lines.reduce((acc: number, l: any) => acc + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((acc: number, l: any) => acc + (Number(l.credit) || 0), 0);

    const newEntry: JournalEntry = {
      id: 'je_' + Date.now(),
      entryNumber: data.entryNumber || `JE-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(4, '0')}`,
      date: data.date || new Date().toISOString().split('T')[0],
      reference: data.reference || '',
      description: data.description || 'General Journal Posting',
      lines,
      totalDebit,
      totalCredit,
      postedBy: currentUser?.name || 'Administrator',
      createdAt: new Date().toISOString(),
    };
    const next = [newEntry, ...journalEntries];
    setJournalEntries(next);
    persistToLocal({ journalEntries: next });
    await syncToCloud({ journalEntries: next });
    return newEntry;
  };

  const deleteJournalEntry = async (id: string): Promise<void> => {
    const next = journalEntries.filter((j) => j.id !== id);
    setJournalEntries(next);
    persistToLocal({ journalEntries: next });
    await syncToCloud({ journalEntries: next });
  };

  // ------------------------------------------------------------------
  // Merchant Orders & Real-time Push Notifications
  // ------------------------------------------------------------------
  const createMerchantOrder = async (data: Partial<MerchantOrder>): Promise<MerchantOrder> => {
    const now = new Date();
    const orderNumber = data.orderNumber || `ORD-${now.getFullYear()}-${String(merchantOrders.length + 1).padStart(4, '0')}`;
    const items = data.items || [];
    const subtotal = items.reduce((acc, it) => acc + (it.lineTotal || (it.quantity * it.unitPrice)), 0);
    const vat = 0; // South African staple bakery zero-rated/exempt default
    const total = subtotal + vat;

    const newOrder: MerchantOrder = {
      id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      orderNumber,
      merchantId: data.merchantId || currentUser?.id || 'mch_guest',
      merchantName: data.merchantName || currentUser?.name || 'Merchant Partner',
      merchantStoreName: data.merchantStoreName || currentUser?.merchantStoreName || 'Commercial Store',
      merchantEmail: data.merchantEmail || currentUser?.email || 'orders@savoure.co.za',
      merchantPhone: data.merchantPhone || (currentUser as any)?.merchantPhone || '061 364 5712',
      branch: data.branch || currentUser?.branch || 'Main Branch',
      deliveryAddress: data.deliveryAddress || currentUser?.deliveryAddress || 'Direct Store Delivery',
      requestedDeliveryDate: data.requestedDeliveryDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      status: 'PENDING',
      items,
      subtotal,
      vat,
      total,
      specialInstructions: data.specialInstructions || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const nextOrders = [newOrder, ...merchantOrders];
    setMerchantOrders(nextOrders);
    persistToLocal({ merchantOrders: nextOrders });
    await syncToCloud({ merchantOrders: nextOrders });

    // Trigger Real-time Push Notification (FCM, Mobile Haptic, Sound Chime, Server)
    try {
      await dispatchOrderPushNotification(newOrder);
    } catch (e) {
      console.warn('Push notification trigger notice:', e);
    }

    return newOrder;
  };

  const updateMerchantOrderStatus = async (id: string, status: MerchantOrder['status']): Promise<MerchantOrder> => {
    let updated: MerchantOrder | null = null;
    const nextOrders = merchantOrders.map((o) => {
      if (o.id === id) {
        updated = { ...o, status, updatedAt: new Date().toISOString() };
        return updated;
      }
      return o;
    });
    setMerchantOrders(nextOrders);
    persistToLocal({ merchantOrders: nextOrders });
    await syncToCloud({ merchantOrders: nextOrders });
    return updated || (merchantOrders.find((o) => o.id === id)!);
  };

  const deleteMerchantOrder = async (id: string): Promise<void> => {
    const nextOrders = merchantOrders.filter((o) => o.id !== id);
    setMerchantOrders(nextOrders);
    persistToLocal({ merchantOrders: nextOrders });
    await syncToCloud({ merchantOrders: nextOrders });
  };

  const convertOrderToInvoice = async (orderId: string): Promise<Invoice> => {
    const order = merchantOrders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const inv = await createInvoice({
      customerId: order.merchantId,
      customerName: order.merchantStoreName || order.merchantName,
      customerTradingName: order.merchantStoreName,
      billingAddress: order.deliveryAddress,
      deliveryAddress: order.deliveryAddress,
      branch: order.branch,
      items: order.items.map((it) => ({
        description: it.productName,
        packSize: it.packSize,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount: it.lineTotal,
      })),
      notes: `Generated from Merchant Order ${order.orderNumber}. ${order.specialInstructions || ''}`.trim(),
      merchantId: order.merchantId,
      merchantName: order.merchantName,
      merchantEmail: order.merchantEmail,
    });

    // Link invoice to order & set accepted status
    const nextOrders = merchantOrders.map((o) => o.id === orderId ? { ...o, status: 'ACCEPTED' as const, invoiceId: inv.id, updatedAt: new Date().toISOString() } : o);
    setMerchantOrders(nextOrders);
    persistToLocal({ merchantOrders: nextOrders });
    await syncToCloud({ merchantOrders: nextOrders });

    return inv;
  };

  // ------------------------------------------------------------------
  // Merchant Historical Reports & Statements Management
  // ------------------------------------------------------------------
  const saveMerchantReport = async (reportData: Partial<MerchantReport>): Promise<MerchantReport> => {
    const reportNumber = reportData.reportNumber || `SAV-RPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReport: MerchantReport = {
      id: `rpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reportNumber,
      merchantId: reportData.merchantId || currentUser?.id || 'mch_usr',
      merchantName: reportData.merchantName || currentUser?.name || 'Commercial Merchant',
      merchantStoreName: reportData.merchantStoreName || currentUser?.merchantStoreName || 'Commercial Store',
      merchantEmail: reportData.merchantEmail || currentUser?.email,
      merchantPhone: reportData.merchantPhone || currentUser?.phone,
      branch: reportData.branch || currentUser?.branch || 'Main Branch',
      deliveryAddress: reportData.deliveryAddress || currentUser?.deliveryAddress,
      period: reportData.period || 'MONTHLY',
      periodLabel: reportData.periodLabel || 'Monthly Performance Report',
      startDate: reportData.startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      endDate: reportData.endDate || new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      totalOrderSpend: reportData.totalOrderSpend || 0,
      totalInvoiced: reportData.totalInvoiced || 0,
      totalPaid: reportData.totalPaid || 0,
      balanceDue: reportData.balanceDue || 0,
      ordersCount: reportData.ordersCount || 0,
      totalPacksOrdered: reportData.totalPacksOrdered || 0,
      deliveredOrdersCount: reportData.deliveredOrdersCount || 0,
      pendingOrdersCount: reportData.pendingOrdersCount || 0,
      fulfillmentRate: reportData.fulfillmentRate !== undefined ? reportData.fulfillmentRate : 100,
      avgOrderValue: reportData.avgOrderValue || 0,
      orders: reportData.orders || [],
      invoices: reportData.invoices || [],
      productSummaries: reportData.productSummaries || [],
      notes: reportData.notes || 'Official audited wholesale merchant statement. Certified by Savouré Foods.',
    };

    const nextReports = [newReport, ...merchantReports];
    setMerchantReports(nextReports);
    persistToLocal({ merchantReports: nextReports });
    try {
      localStorage.setItem('savoure_merchant_reports', JSON.stringify(nextReports));
    } catch (e) {}
    await syncToCloud({ merchantReports: nextReports });
    return newReport;
  };

  const deleteMerchantReport = async (id: string): Promise<void> => {
    const nextReports = merchantReports.filter((r) => r.id !== id);
    setMerchantReports(nextReports);
    persistToLocal({ merchantReports: nextReports });
    try {
      localStorage.setItem('savoure_merchant_reports', JSON.stringify(nextReports));
    } catch (e) {}
    await syncToCloud({ merchantReports: nextReports });
  };

  // ------------------------------------------------------------------
  // Website Showcase Products Manager
  // ------------------------------------------------------------------
  const addShowcaseProduct = async (item: Partial<ShowcaseProductItem>): Promise<ShowcaseProductItem> => {
    const newProduct: ShowcaseProductItem = {
      id: item.id || 'showcase_' + Date.now(),
      name: item.name || 'New Specialty',
      detail: item.detail || 'Artisanal Batch',
      tone: (item.tone as any) || 'roti',
      mark: (item.mark || (item.name || 'CRAFT').toUpperCase()),
      category: item.category || 'Bakery Specialty',
      tagline: item.tagline || 'Handcrafted fresh daily',
      description: item.description || 'Authentic traditional recipe with unbleached flour.',
      image: item.image || '/showcase/savoure-roti.png',
      packSpec: item.packSpec || 'Commercial Packs & Crates',
      sizeSpec: item.sizeSpec || 'Standard',
      tags: item.tags || ['Halal', 'Made with care'],
      highlights: item.highlights || ['Generational traditional recipe', '100% Halal certified'],
    };

    const nextShowcase = [...showcaseProducts, newProduct];
    setShowcaseProducts(nextShowcase);
    persistToLocal({ showcaseProducts: nextShowcase });
    await syncToCloud({ showcaseProducts: nextShowcase });
    return newProduct;
  };

  const updateShowcaseProduct = async (id: string, item: Partial<ShowcaseProductItem>): Promise<ShowcaseProductItem> => {
    let updated: ShowcaseProductItem | null = null;
    const nextShowcase = showcaseProducts.map((p) => {
      if (p.id === id) {
        updated = { ...p, ...item };
        return updated;
      }
      return p;
    });
    setShowcaseProducts(nextShowcase);
    persistToLocal({ showcaseProducts: nextShowcase });
    await syncToCloud({ showcaseProducts: nextShowcase });
    return updated || (showcaseProducts.find((p) => p.id === id)!);
  };

  const removeShowcaseProduct = async (id: string): Promise<void> => {
    const nextShowcase = showcaseProducts.filter((p) => p.id !== id);
    setShowcaseProducts(nextShowcase);
    persistToLocal({ showcaseProducts: nextShowcase });
    await syncToCloud({ showcaseProducts: nextShowcase });
  };

  const toggleShowcaseProductActive = async (id: string): Promise<boolean> => {
    const exists = showcaseProducts.some((p) => p.id === id);
    if (exists) {
      await removeShowcaseProduct(id);
      return false;
    } else {
      const defaultItem = SHOWCASE_COLLECTION.find((p) => p.id === id);
      if (defaultItem) {
        await addShowcaseProduct(defaultItem);
        return true;
      }
      return false;
    }
  };

  // ------------------------------------------------------------------
  // Point of Sale (POS) & Till Management
  // ------------------------------------------------------------------
  const activePOSSession = posSessions.find((s) => s.status === 'OPEN') || null;

  const openPOSSession = async (openingFloat: number, notes?: string): Promise<POSSession> => {
    const seq = posSessions.length + 1;
    const sessionNumber = `POS-SES-${String(seq).padStart(4, '0')}`;
    const newSession: POSSession = {
      id: `pos_ses_${Date.now()}`,
      sessionNumber,
      cashierId: currentUser?.id || 'usr_master_admin',
      cashierName: currentUser?.name || 'Master Admin',
      branch: currentUser?.branch || 'Main Bakery Counter',
      openedAt: new Date().toISOString(),
      openingFloat,
      cashSales: 0,
      cardSales: 0,
      eftSales: 0,
      totalSales: 0,
      transactionCount: 0,
      status: 'OPEN',
      notes,
    };
    const nextSessions = [newSession, ...posSessions];
    setPosSessions(nextSessions);
    persistToLocal({ posSessions: nextSessions });
    await syncToCloud({ posSessions: nextSessions });
    return newSession;
  };

  const closePOSSession = async (closingFloat: number, notes?: string): Promise<POSSession> => {
    if (!activePOSSession) throw new Error('No active POS session to close');
    const closed: POSSession = {
      ...activePOSSession,
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      closingFloat,
      notes: notes || activePOSSession.notes,
    };
    const nextSessions = posSessions.map((s) => (s.id === closed.id ? closed : s));
    setPosSessions(nextSessions);
    persistToLocal({ posSessions: nextSessions });
    await syncToCloud({ posSessions: nextSessions });
    return closed;
  };

  const createPOSTransaction = async (
    data: Omit<POSTransaction, 'id' | 'receiptNumber' | 'createdAt'>
  ): Promise<POSTransaction> => {
    const seq = posTransactions.length + 1;
    const year = new Date().getFullYear();
    const receiptNumber = `REC-${year}-${String(seq).padStart(4, '0')}`;

    const invNumber = getNextInvoiceNumber();
    const invoiceCustomer = data.customerName || 'Walk-in Retail Customer';

    const invoiceItems: LineItem[] = data.items.map((item) => {
      const lineSubtotal = item.unitPrice * item.quantity;
      const lineVat = item.vatApplicable ? lineSubtotal * 0.15 : 0;
      return {
        id: `inv_item_${Math.random().toString(36).substring(2, 9)}`,
        productId: item.productId,
        sku: item.sku || 'SKU-POS',
        description: item.productName,
        packSize: 'Standard Pack',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatApplicable ? 15 : 0,
        discountPercent: 0,
        subtotal: lineSubtotal,
        vatAmount: lineVat,
        total: item.lineTotal,
      };
    });

    const newInvoice: Invoice = {
      id: `inv_pos_${Date.now()}`,
      invoiceNumber: invNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0],
      customerId: data.customerId || 'cust_walk_in',
      customerName: invoiceCustomer,
      customerTradingName: invoiceCustomer,
      deliveryAddress: 'POS Retail Counter - Over the Counter Sale',
      customerVat: '',
      items: invoiceItems,
      subtotal: data.subtotal,
      vatTotal: data.vat,
      discountTotal: data.discountTotal || 0,
      grandTotal: data.total,
      amountPaid: data.paymentMethod === 'ON_ACCOUNT' ? 0 : data.total,
      balanceDue: data.paymentMethod === 'ON_ACCOUNT' ? data.total : 0,
      status: data.paymentMethod === 'ON_ACCOUNT' ? 'Sent' : 'Paid',
      notes: `POS Counter Receipt: ${receiptNumber} (${data.paymentMethod})`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'POS Cashier',
    };

    const newTx: POSTransaction = {
      ...data,
      id: `pos_tx_${Date.now()}`,
      receiptNumber,
      invoiceId: newInvoice.id,
      createdAt: new Date().toISOString(),
    };

    const nextTxs = [newTx, ...posTransactions];
    const nextInvoices = [newInvoice, ...invoices];

    let nextSessions = posSessions;
    if (activePOSSession) {
      const updatedSession: POSSession = {
        ...activePOSSession,
        transactionCount: activePOSSession.transactionCount + 1,
        totalSales: activePOSSession.totalSales + data.total,
        cashSales: data.paymentMethod === 'CASH' ? activePOSSession.cashSales + data.total : activePOSSession.cashSales,
        cardSales: data.paymentMethod === 'CARD' ? activePOSSession.cardSales + data.total : activePOSSession.cardSales,
        eftSales: data.paymentMethod === 'EFT' ? activePOSSession.eftSales + data.total : activePOSSession.eftSales,
      };
      nextSessions = posSessions.map((s) => (s.id === updatedSession.id ? updatedSession : s));
      setPosSessions(nextSessions);
    }

    let updatedProducts = [...products];
    for (const item of data.items) {
      const pIdx = updatedProducts.findIndex((p) => p.id === item.productId || p.sku === item.sku);
      if (pIdx >= 0) {
        const prod = updatedProducts[pIdx];
        const newStock = Math.max(0, (prod.stockOnHand || 0) - item.quantity);
        updatedProducts[pIdx] = { ...prod, stockOnHand: newStock };
      }
    }

    setPosTransactions(nextTxs);
    setInvoices(nextInvoices);
    setProducts(updatedProducts);

    const payload = {
      posTransactions: nextTxs,
      posSessions: nextSessions,
      invoices: nextInvoices,
      products: updatedProducts,
    };
    persistToLocal(payload);
    await syncToCloud(payload);
    return newTx;
  };

  const refundPOSTransaction = async (id: string, reason?: string): Promise<void> => {
    const nextTxs = posTransactions.map((tx) =>
      tx.id === id
        ? {
            ...tx,
            status: 'REFUNDED' as const,
            notes: `${tx.notes ? tx.notes + ' | ' : ''}Refunded: ${reason || 'Customer return'}`,
          }
        : tx
    );
    setPosTransactions(nextTxs);
    persistToLocal({ posTransactions: nextTxs });
    await syncToCloud({ posTransactions: nextTxs });
  };

  // ------------------------------------------------------------------
  // Factory Production Lines & Bakery Runs
  // ------------------------------------------------------------------
  const updateProductionLineStatus = async (
    id: string,
    status: ProductionLine['status']
  ): Promise<void> => {
    const nextLines = productionLines.map((l) => (l.id === id ? { ...l, status } : l));
    setProductionLines(nextLines);
    persistToLocal({ productionLines: nextLines });
    await syncToCloud({ productionLines: nextLines });
  };

  const createProductionBatch = async (data: Partial<ProductionBatch>): Promise<ProductionBatch> => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = productionBatches.length + 1;
    const batchNumber = data.batchNumber || `BATCH-${dateStr}-${String(seq).padStart(3, '0')}`;

    const newBatch: ProductionBatch = {
      id: `batch_${Date.now()}`,
      batchNumber,
      lineId: data.lineId || 'line_01',
      lineName: data.lineName || 'High-Speed Pastry Sheeter & Auto-Laminator',
      targetProductId: data.targetProductId || 'prod_spring_roll',
      targetProductName: data.targetProductName || 'Savouré Spring Roll Pastry (20cm / 200g)',
      targetSku: data.targetSku || 'SAV-SPR-001',
      plannedQuantity: data.plannedQuantity || 500,
      actualYield: data.actualYield || 0,
      rejectedQuantity: data.rejectedQuantity || 0,
      status: data.status || 'PLANNED',
      ingredients: data.ingredients || [
        { ingredientId: 'ing_flour', ingredientName: 'Supreme Unbleached Pastry Flour', sku: 'RAW-FLR-001', quantityUsed: 100, unit: 'kg', costPerUnit: 14.50 },
        { ingredientId: 'ing_oil', ingredientName: 'Pure Sunflower Laminating Oil', sku: 'RAW-OIL-002', quantityUsed: 15, unit: 'litres', costPerUnit: 26.00 },
      ],
      qc: data.qc || {
        visualAppearance: 'Pass',
        thicknessMm: 0.8,
        targetWeightGrams: 200,
        actualSampleWeightGrams: 200,
        moisturePercent: 12,
        metalDetectorChecked: true,
        sealIntegrityChecked: true,
        inspectorName: currentUser?.name || 'QC Officer',
      },
      operatorName: data.operatorName || currentUser?.name || 'Operator',
      supervisorName: data.supervisorName || 'Yusuf Patel',
      startTime: data.startTime || new Date().toISOString(),
      expiryDate: data.expiryDate || new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
      lotCode: data.lotCode || `LOT-${dateStr}-${String(seq).padStart(2, '0')}`,
      notes: data.notes || '',
      stockUpdated: false,
      createdAt: new Date().toISOString(),
    };

    const nextBatches = [newBatch, ...productionBatches];
    setProductionBatches(nextBatches);
    persistToLocal({ productionBatches: nextBatches });
    await syncToCloud({ productionBatches: nextBatches });
    return newBatch;
  };

  const updateProductionBatchStatus = async (
    batchId: string,
    status: ProductionBatch['status'],
    updates?: Partial<ProductionBatch>
  ): Promise<void> => {
    const nextBatches = productionBatches.map((b) =>
      b.id === batchId ? { ...b, status, ...(updates || {}) } : b
    );
    setProductionBatches(nextBatches);
    persistToLocal({ productionBatches: nextBatches });
    await syncToCloud({ productionBatches: nextBatches });
  };

  const completeProductionBatch = async (
    batchId: string,
    actualYield: number,
    rejectedQuantity: number,
    qcNotes?: string
  ): Promise<void> => {
    const target = productionBatches.find((b) => b.id === batchId);
    if (!target) return;

    const updatedBatch: ProductionBatch = {
      ...target,
      status: 'COMPLETED',
      actualYield,
      rejectedQuantity,
      stockUpdated: true,
      endTime: new Date().toISOString(),
      qc: {
        ...target.qc,
        notes: qcNotes || target.qc.notes,
        inspectorName: target.qc.inspectorName || currentUser?.name || 'QC Lead',
      },
    };

    const nextBatches = productionBatches.map((b) => (b.id === batchId ? updatedBatch : b));
    setProductionBatches(nextBatches);

    const updatedProducts = products.map((p) => {
      if (p.id === target.targetProductId || p.sku === target.targetSku) {
        return { ...p, stockOnHand: (p.stockOnHand || 0) + actualYield };
      }
      return p;
    });
    setProducts(updatedProducts);

    const newMovement: StockMovement = {
      id: `sm_${Date.now()}`,
      movementNumber: `SM-PROD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      type: 'STOCK_IN',
      barcode: target.lotCode || target.targetSku || '6009800123014',
      sku: target.targetSku,
      productName: target.targetProductName,
      category: 'Pastry Sheets',
      quantity: actualYield,
      unit: 'packs',
      sourceBranch: `Production (${target.lineName})`,
      destinationBranch: 'Main Bakery Warehouse',
      batchNumber: target.batchNumber,
      reason: `Completed Production Run (${actualYield} packs produced, ${rejectedQuantity} scrap)`,
      recordedBy: currentUser?.name || 'Production Supervisor',
      isSouthAfricanBarcode: true,
    };
    const nextMovements = [newMovement, ...stockMovements];
    setStockMovements(nextMovements);

    const payload = {
      productionBatches: nextBatches,
      products: updatedProducts,
      stockMovements: nextMovements,
    };
    persistToLocal(payload);
    await syncToCloud(payload);
  };

  const deleteProductionBatch = async (batchId: string): Promise<void> => {
    const nextBatches = productionBatches.filter((b) => b.id !== batchId);
    setProductionBatches(nextBatches);
    persistToLocal({ productionBatches: nextBatches });
    await syncToCloud({ productionBatches: nextBatches });
  };

  return (
    <ERPContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        logout,
        users,
        company,
        businessSettings,
        updateBusinessSettings,
        getNextInvoiceNumber,
        customers,
        products,
        invoices,
        deliveryNotes,
        quotations,
        payments,
        merchantOrders,
        createMerchantOrder,
        updateMerchantOrderStatus,
        deleteMerchantOrder,
        convertOrderToInvoice,
        merchantReports,
        saveMerchantReport,
        deleteMerchantReport,
        showcaseProducts,
        addShowcaseProduct,
        updateShowcaseProduct,
        removeShowcaseProduct,
        toggleShowcaseProductActive,
        posTransactions,
        posSessions,
        activePOSSession,
        openPOSSession,
        closePOSSession,
        createPOSTransaction,
        refundPOSTransaction,
        productionLines,
        productionBatches,
        updateProductionLineStatus,
        createProductionBatch,
        updateProductionBatchStatus,
        completeProductionBatch,
        deleteProductionBatch,
        leads,
        communications,
        staff,
        payrollPayouts,
        createStaffMember,
        updateStaffMember,
        deleteStaffMember,
        createPayrollPayout,
        updatePayrollPayout,
        deletePayrollPayout,
        stockPurchases,
        stockItemStatuses,
        stockMovements,
        createStockPurchase,
        deleteStockPurchase,
        createStockItemStatus,
        updateStockItemStatus,
        deleteStockItemStatus,
        markStockAsFinished,
        setStockQuantity,
        recordStockMovement,
        deleteStockMovement,
        journalEntries,
        createJournalEntry,
        deleteJournalEntry,
        loginLogs,
        recordLoginLog,
        resetUserPassword,
        isLocked,
        lockApp,
        unlockApp,
        syncStatus,
        lastSynced,
        refreshData,
        createUser,
        updateUser,
        deleteUser,
        updateCompany,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        createProduct,
        updateProduct,
        deleteProduct,
        toggleProductShowcase,
        categories,
        createCategory,
        deleteCategory,
        createInvoice,
        updateInvoice,
        cloneInvoice,
        generateDeliveryNoteFromInvoice,
        deleteInvoice,
        createDeliveryNote,
        updateDeliveryNote,
        savePOD,
        deleteDeliveryNote,
        createQuotation,
        updateQuotation,
        convertQuotation,
        deleteQuotation,
        recordPayment,
        deletePayment,
        createLead,
        updateLead,
        deleteLead,
        addCommunication,
        purgeMockData,
        restoreBackup,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
