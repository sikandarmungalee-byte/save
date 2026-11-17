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
  ProductionQualityCheck,
  MerchantPortalSettings
} from '../types/erp';
import { db, testFirebaseConnection, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { LEGACY_SHOWCASE_IDS, SHOWCASE_COLLECTION, ShowcaseProductItem } from '../components/showcase/showcaseData';
import { dispatchOrderPushNotification } from '../lib/fcmNotifications';
import {
  DEFAULT_MERCHANT_PORTAL_SETTINGS,
  normalizeMerchantSettings,
  checkMerchantPortalAccess,
  evaluateMerchantOrderMOQ,
} from '../utils/merchantRules';

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

// Exact legacy demo fixture IDs from earlier builds. Stripped cleanly on hydration
// so existing user-created ERP items are never touched while old cloud/local demo artifacts vanish.
const LEGACY_DEMO_IDS = {
  users: new Set(['usr_1791911737847']),
  emails: new Set(['rookshanal@icloud.com']),
  usernames: new Set(['roksh4']),
  customers: new Set(['cust_1791911619388']),
  products: new Set([
    'prod_spring_roll',
    'prod_samoosa_pastry',
    'prod_flaky_roti',
    'prod_tortilla_wraps',
    'prod_samoosa',
    'prod_tortilla',
    'prod_roti',
  ]),
  stockItemStatuses: new Set([
    'stk_flour_supreme',
    'stk_sunflower_oil',
    'stk_finished_spring_roll',
    'stk_finished_samoosa',
    'stk_finished_roti',
    'stk_finished_tortilla',
    'stk_01',
    'stk_02',
    'stk_03',
    'stk_04',
    'stk_05',
    'stk_06',
  ]),
  stockMovements: new Set(['sm_001', 'sm_002', 'sm_003', 'sm_initial_01', 'sm_initial_02', 'sm_init_1', 'sm_init_2']),
  merchantOrders: new Set(['ord_1001', 'ord_1002', 'ord_1003', 'ord_1004', 'ord_1005', 'ord_1006', 'ord_1007', 'ord_1008']),
  merchantReports: new Set(['rpt_past_001', 'rpt_past_002', 'rpt_past_003', 'rpt_past_004', 'rpt_past_005']),
  posSessions: new Set(['pos_ses_001']),
  posTransactions: new Set(['pos_tx_001']),
  productionLines: new Set(['line_01', 'line_02', 'line_03', 'line_04']),
  productionBatches: new Set(['batch_101', 'batch_102']),
  showcaseProducts: LEGACY_SHOWCASE_IDS,
  categories: new Set([
    'Pastry Sheets',
    'Artisanal Roti',
    'Tortillas & Wraps',
    'Flour & Grains',
    'Oils & Fats',
    'Ready Savouries',
  ]),
};

function isLegacyDemoUser(u: User | null | undefined): boolean {
  if (!u) return false;
  const email = (u.email || '').trim().toLowerCase();
  const username = ((u as any).username || '').trim().toLowerCase();
  return (
    LEGACY_DEMO_IDS.users.has(u.id) ||
    LEGACY_DEMO_IDS.emails.has(email) ||
    (Boolean(username) && LEGACY_DEMO_IDS.usernames.has(username))
  );
}

function stripLegacyDemoData(raw: Partial<ERPDatabase>): { cleaned: Partial<ERPDatabase>; stripped: boolean } {
  let stripped = false;
  const cleaned: Partial<ERPDatabase> = { ...raw };

  if (Array.isArray(raw.users)) {
    const filteredUsers = raw.users.filter((u) => !isLegacyDemoUser(u));
    if (filteredUsers.length !== raw.users.length) stripped = true;
    cleaned.users = filteredUsers.some((u) => u.email?.toLowerCase() === 'admin@savoure.co.za')
      ? filteredUsers
      : [MASTER_ADMIN_USER, ...filteredUsers];
  }

  if (Array.isArray(raw.customers)) {
    const filtered = raw.customers.filter((c) => !LEGACY_DEMO_IDS.customers.has(c.id));
    if (filtered.length !== raw.customers.length) stripped = true;
    cleaned.customers = filtered;
  }

  if (Array.isArray(raw.products)) {
    const filtered = raw.products.filter((p) => !LEGACY_DEMO_IDS.products.has(p.id));
    if (filtered.length !== raw.products.length) stripped = true;
    cleaned.products = filtered;
  }

  if (Array.isArray(raw.stockItemStatuses)) {
    const filtered = raw.stockItemStatuses.filter((s) => !LEGACY_DEMO_IDS.stockItemStatuses.has(s.id));
    if (filtered.length !== raw.stockItemStatuses.length) stripped = true;
    cleaned.stockItemStatuses = filtered;
  }

  if (Array.isArray(raw.stockMovements)) {
    const filtered = raw.stockMovements.filter((m) => !LEGACY_DEMO_IDS.stockMovements.has(m.id));
    if (filtered.length !== raw.stockMovements.length) stripped = true;
    cleaned.stockMovements = filtered;
  }

  if (Array.isArray(raw.merchantOrders)) {
    const filtered = raw.merchantOrders.filter((o) => !LEGACY_DEMO_IDS.merchantOrders.has(o.id));
    if (filtered.length !== raw.merchantOrders.length) stripped = true;
    cleaned.merchantOrders = filtered;
  }

  if (Array.isArray(raw.merchantReports)) {
    const filtered = raw.merchantReports.filter((r) => !LEGACY_DEMO_IDS.merchantReports.has(r.id));
    if (filtered.length !== raw.merchantReports.length) stripped = true;
    cleaned.merchantReports = filtered;
  }

  if (Array.isArray(raw.posSessions)) {
    const filtered = raw.posSessions.filter((s) => !LEGACY_DEMO_IDS.posSessions.has(s.id));
    if (filtered.length !== raw.posSessions.length) stripped = true;
    cleaned.posSessions = filtered;
  }

  if (Array.isArray(raw.posTransactions)) {
    const filtered = raw.posTransactions.filter((t) => !LEGACY_DEMO_IDS.posTransactions.has(t.id));
    if (filtered.length !== raw.posTransactions.length) stripped = true;
    cleaned.posTransactions = filtered;
  }

  if (Array.isArray(raw.productionLines)) {
    const demoSupervisors = new Set(['Yusuf Patel', 'Amina Dawood', 'Farouk Adams', 'Tariq Moosa']);
    const filtered = raw.productionLines.filter(
      (l) => !(LEGACY_DEMO_IDS.productionLines.has(l.id) && demoSupervisors.has(l.supervisor))
    );
    if (filtered.length !== raw.productionLines.length) stripped = true;
    cleaned.productionLines = filtered;
  }

  if (Array.isArray(raw.productionBatches)) {
    const filtered = raw.productionBatches.filter((b) => !LEGACY_DEMO_IDS.productionBatches.has(b.id));
    if (filtered.length !== raw.productionBatches.length) stripped = true;
    cleaned.productionBatches = filtered;
  }

  if (Array.isArray(raw.showcaseProducts)) {
    const filtered = raw.showcaseProducts.filter((s: any) => !LEGACY_DEMO_IDS.showcaseProducts.has(s?.id));
    if (filtered.length !== raw.showcaseProducts.length) stripped = true;
    cleaned.showcaseProducts = filtered;
  }

  if (Array.isArray(raw.categories)) {
    const activeProductCats = new Set(
      (cleaned.products || raw.products || [])
        .map((p) => (p?.category || '').trim().toLowerCase())
        .filter(Boolean)
    );
    const filtered = raw.categories.filter((c) => {
      const trimmed = (c || '').trim();
      if (!trimmed) return false;
      if (LEGACY_DEMO_IDS.categories.has(trimmed) && !activeProductCats.has(trimmed.toLowerCase())) {
        return false;
      }
      return true;
    });
    if (filtered.length !== raw.categories.length) stripped = true;
    cleaned.categories = filtered;
  }

  return { cleaned, stripped };
}

interface ERPContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  users: User[];
  company: CompanySettings;
  merchantSettings: MerchantPortalSettings;
  updateMerchantSettings: (data: Partial<MerchantPortalSettings>) => Promise<MerchantPortalSettings>;
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
  addProductionLine: (data: Partial<ProductionLine>) => Promise<ProductionLine>;
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
  category: (p?.category || '').trim(),
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
  moq: p?.moq !== undefined && p?.moq !== null ? Math.max(0, Number(p.moq) || 0) : undefined,
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
      if (!saved) return null;
      const parsed = JSON.parse(saved) as User;
      if (isLegacyDemoUser(parsed)) {
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(USER_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>([MASTER_ADMIN_USER]);
  const [company, setCompany] = useState<CompanySettings>(INITIAL_COMPANY);
  const [merchantSettings, setMerchantSettings] = useState<MerchantPortalSettings>(DEFAULT_MERCHANT_PORTAL_SETTINGS);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [payrollPayouts, setPayrollPayouts] = useState<PayrollPayout[]>([]);
  const [stockPurchases, setStockPurchases] = useState<StockPurchase[]>([]);
  const [stockItemStatuses, setStockItemStatuses] = useState<StockItemStatus[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loginLogs, setLoginLogs] = useState<UserLoginLog[]>([]);
  const [merchantOrders, setMerchantOrders] = useState<MerchantOrder[]>([]);
  const [merchantReports, setMerchantReports] = useState<MerchantReport[]>(() => {
    try {
      const saved = localStorage.getItem('savoure_merchant_reports');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((r: MerchantReport) => !LEGACY_DEMO_IDS.merchantReports.has(r.id));
    } catch {
      return [];
    }
  });
  const [showcaseProducts, setShowcaseProducts] = useState<ShowcaseProductItem[]>([]);
  const [posTransactions, setPosTransactions] = useState<POSTransaction[]>([]);
  const [posSessions, setPosSessions] = useState<POSSession[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>([]);

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const isWritingCloud = useRef(false);
  const lastSyncedTimestampRef = useRef<number>(0);
  const hasCleanedCloudDemoRef = useRef<boolean>(false);

  // Helper to persist state to local cache
  const persistToLocal = useCallback((override?: Partial<ERPDatabase>) => {
    try {
      const currentDb: ERPDatabase = {
        users,
        company,
        merchantSettings,
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
  }, [users, company, merchantSettings, customers, products, categories, invoices, deliveryNotes, quotations, payments, merchantOrders, merchantReports, showcaseProducts, posTransactions, posSessions, productionLines, productionBatches, leads, communications, staff, payrollPayouts, stockPurchases, stockItemStatuses, stockMovements, journalEntries, loginLogs]);

  // Helper to sanitize payload and remove all undefined values recursively for Firestore compatibility
  const sanitizeForCloud = (obj: any): any => {
    return JSON.parse(
      JSON.stringify(obj, (_key, value) => {
        if (value === undefined) return null;
        return value;
      })
    );
  };

  // Synchronize state directly to Cloud Firestore (multi-device real-time sync)
  const syncToCloud = useCallback(async (data: Partial<ERPDatabase>) => {
    isWritingCloud.current = true;
    setSyncStatus('syncing');
    const nowIso = new Date().toISOString();
    lastSyncedTimestampRef.current = Date.now();
    const sanitized = sanitizeForCloud(data);
    let firestoreOk = false;

    try {
      await setDoc(doc(db, 'erp', 'main'), {
        ...sanitized,
        lastUpdated: nowIso,
      }, { merge: true });
      firestoreOk = true;
      setSyncStatus('synced');
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err: any) {
      if (err?.message && (err.message.includes('offline') || err.message.includes('unavailable'))) {
        console.warn('[Firebase Cloud Sync] Client operating offline; changes cached locally.');
      } else {
        handleFirestoreError(err, OperationType.WRITE, 'erp/main');
      }
      setSyncStatus('offline');
    }

    // Background mirror to Node.js backend database when reachable
    try {
      await safeFetchJson('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sanitized, lastUpdated: nowIso }),
      });
    } catch (serverErr: any) {
      if (!firestoreOk) {
        console.warn('[Server Sync Notice]:', serverErr?.message);
      }
    }

    setTimeout(() => {
      isWritingCloud.current = false;
    }, 600);
  }, []);

  // Apply an authoritative database snapshot across all 24 collections
  const applyDatabaseSnapshot = useCallback((
    raw: Partial<ERPDatabase>,
    options: { respectEmptyArrays?: boolean; persistCleanedToCloud?: boolean } = {}
  ): { cleaned: Partial<ERPDatabase>; stripped: boolean } => {
    const { respectEmptyArrays = true, persistCleanedToCloud = false } = options;
    const { cleaned, stripped } = stripLegacyDemoData(raw);

    if (cleaned.company) setCompany(cleaned.company);
    if (cleaned.merchantSettings) {
      setMerchantSettings(normalizeMerchantSettings(cleaned.merchantSettings));
    }
    if (Array.isArray(cleaned.categories) && (respectEmptyArrays || cleaned.categories.length > 0)) {
      setCategories(cleaned.categories);
    }

    const activeUsers = Array.isArray(cleaned.users) ? cleaned.users : [MASTER_ADMIN_USER];
    if (Array.isArray(cleaned.users)) {
      setUsers(activeUsers);
    }

    const activeCustomers = Array.isArray(cleaned.customers) ? cleaned.customers : [];
    if (Array.isArray(cleaned.customers) && (respectEmptyArrays || cleaned.customers.length > 0)) {
      setCustomers(activeCustomers);
    }

    if (Array.isArray(cleaned.products) && (respectEmptyArrays || cleaned.products.length > 0)) {
      setProducts(cleaned.products.map((p, i) => normalizeProduct(p, i)));
    }

    if (Array.isArray(cleaned.invoices) && (respectEmptyArrays || cleaned.invoices.length > 0)) {
      const { invoices: healedInvs, changed } = healInvoicesList(
        cleaned.invoices,
        activeCustomers,
        activeUsers
      );
      setInvoices(healedInvs);
      cleaned.invoices = healedInvs;
      if (changed && !isWritingCloud.current && persistCleanedToCloud) {
        syncToCloud({ invoices: healedInvs });
      }
    }

    if (Array.isArray(cleaned.deliveryNotes) && (respectEmptyArrays || cleaned.deliveryNotes.length > 0)) {
      setDeliveryNotes(cleaned.deliveryNotes);
    }
    if (Array.isArray(cleaned.quotations) && (respectEmptyArrays || cleaned.quotations.length > 0)) {
      setQuotations(cleaned.quotations);
    }
    if (Array.isArray(cleaned.payments) && (respectEmptyArrays || cleaned.payments.length > 0)) {
      setPayments(cleaned.payments);
    }
    if (Array.isArray(cleaned.merchantOrders) && (respectEmptyArrays || cleaned.merchantOrders.length > 0)) {
      setMerchantOrders(cleaned.merchantOrders);
    }
    if (Array.isArray(cleaned.merchantReports) && (respectEmptyArrays || cleaned.merchantReports.length > 0)) {
      setMerchantReports(cleaned.merchantReports);
      try {
        localStorage.setItem('savoure_merchant_reports', JSON.stringify(cleaned.merchantReports));
      } catch {}
    }
    if (Array.isArray(cleaned.showcaseProducts) && (respectEmptyArrays || cleaned.showcaseProducts.length > 0)) {
      setShowcaseProducts(cleaned.showcaseProducts);
    }
    if (Array.isArray(cleaned.posTransactions) && (respectEmptyArrays || cleaned.posTransactions.length > 0)) {
      setPosTransactions(cleaned.posTransactions);
    }
    if (Array.isArray(cleaned.posSessions) && (respectEmptyArrays || cleaned.posSessions.length > 0)) {
      setPosSessions(cleaned.posSessions);
    }
    if (Array.isArray(cleaned.productionLines) && (respectEmptyArrays || cleaned.productionLines.length > 0)) {
      setProductionLines(cleaned.productionLines);
    }
    if (Array.isArray(cleaned.productionBatches) && (respectEmptyArrays || cleaned.productionBatches.length > 0)) {
      setProductionBatches(cleaned.productionBatches);
    }
    if (Array.isArray(cleaned.leads) && (respectEmptyArrays || cleaned.leads.length > 0)) {
      setLeads(cleaned.leads);
    }
    if (Array.isArray(cleaned.communications) && (respectEmptyArrays || cleaned.communications.length > 0)) {
      setCommunications(cleaned.communications);
    }
    if (Array.isArray(cleaned.staff) && (respectEmptyArrays || cleaned.staff.length > 0)) {
      setStaff(cleaned.staff);
    }
    if (Array.isArray(cleaned.payrollPayouts) && (respectEmptyArrays || cleaned.payrollPayouts.length > 0)) {
      setPayrollPayouts(cleaned.payrollPayouts);
    }
    if (Array.isArray(cleaned.stockPurchases) && (respectEmptyArrays || cleaned.stockPurchases.length > 0)) {
      setStockPurchases(cleaned.stockPurchases);
    }
    if (Array.isArray(cleaned.stockItemStatuses) && (respectEmptyArrays || cleaned.stockItemStatuses.length > 0)) {
      setStockItemStatuses(cleaned.stockItemStatuses);
    }
    if (Array.isArray(cleaned.stockMovements) && (respectEmptyArrays || cleaned.stockMovements.length > 0)) {
      setStockMovements(cleaned.stockMovements);
    }
    if (Array.isArray(cleaned.journalEntries) && (respectEmptyArrays || cleaned.journalEntries.length > 0)) {
      setJournalEntries(cleaned.journalEntries);
    }
    if (Array.isArray(cleaned.loginLogs) && (respectEmptyArrays || cleaned.loginLogs.length > 0)) {
      setLoginLogs(cleaned.loginLogs);
    }

    if (cleaned.lastUpdated) {
      const ts = new Date(cleaned.lastUpdated).getTime();
      if (!Number.isNaN(ts)) {
        lastSyncedTimestampRef.current = Math.max(lastSyncedTimestampRef.current, ts);
      }
    }

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cleaned));
    } catch {}

    return { cleaned, stripped };
  }, [syncToCloud]);

  // Synchronize current user in local and session storage
  useEffect(() => {
    try {
      if (currentUser && !isLegacyDemoUser(currentUser)) {
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(USER_KEY);
      }
    } catch {}
  }, [currentUser]);

  // Manual refresh trigger (Cloud Firestore authoritative, server /api/sync fallback)
  const refreshData = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      let firestoreLoaded = false;

      try {
        const snap = await getDoc(doc(db, 'erp', 'main'));
        firestoreLoaded = true;
        if (snap.exists()) {
          const cloudData = snap.data() as Partial<ERPDatabase>;
          applyDatabaseSnapshot(cloudData, { respectEmptyArrays: true });
        }
        setSyncStatus('synced');
        setLastSynced(new Date().toLocaleTimeString());
      } catch (fsErr) {
        if (fsErr instanceof Error && fsErr.message.includes('the client is offline')) {
          setSyncStatus('offline');
        } else {
          handleFirestoreError(fsErr, OperationType.GET, 'erp/main');
          setSyncStatus('offline');
        }
      }

      if (!firestoreLoaded) {
        const res = await safeFetchJson<ERPDatabase>('/api/sync');
        if (res.ok && res.data) {
          applyDatabaseSnapshot(res.data, { respectEmptyArrays: true });
          setLastSynced(new Date().toLocaleTimeString());
        }
      }
    } catch {
      setSyncStatus('offline');
    }
  }, [applyDatabaseSnapshot]);

  // Load from local storage initially (stripping any legacy demo records)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: ERPDatabase = JSON.parse(cached);
        applyDatabaseSnapshot(parsed, { respectEmptyArrays: true });
      }
    } catch (e) {
      console.warn('Cache parse error:', e);
    }
  }, [applyDatabaseSnapshot]);

  // REAL-TIME CLOUD FIRESTORE & SERVER SYNCHRONIZATION
  useEffect(() => {
    let mounted = true;
    setSyncStatus('syncing');

    // Verify live Cloud Firestore connectivity on boot
    testFirebaseConnection().then((connected) => {
      if (!mounted) return;
      if (!connected) {
        setSyncStatus('offline');
      }
    });

    // Hydrate from server backend only if Firestore has not yet delivered newer data
    safeFetchJson<ERPDatabase>('/api/sync').then((res) => {
      if (!mounted || !res.ok || !res.data) return;
      const srvTs = res.data.lastUpdated ? new Date(res.data.lastUpdated).getTime() : 0;
      if (lastSyncedTimestampRef.current === 0 || srvTs > lastSyncedTimestampRef.current) {
        applyDatabaseSnapshot(res.data, { respectEmptyArrays: true });
      }
    }).catch(() => {});

    // Real-time Cloud Firestore subscription (single source of truth across devices)
    const unsub = onSnapshot(doc(db, 'erp', 'main'), (snapshot) => {
      if (!mounted) return;
      if (snapshot.exists()) {
        const cloudData = snapshot.data() as Partial<ERPDatabase>;
        const { cleaned, stripped } = applyDatabaseSnapshot(cloudData, {
          respectEmptyArrays: true,
          persistCleanedToCloud: true,
        });

        // If cloud document still held legacy demo artifacts, permanently scrub them once
        if (stripped && !hasCleanedCloudDemoRef.current) {
          hasCleanedCloudDemoRef.current = true;
          const scrubPayload = sanitizeForCloud({
            users: cleaned.users,
            customers: cleaned.customers,
            products: cleaned.products,
            stockItemStatuses: cleaned.stockItemStatuses,
            stockMovements: cleaned.stockMovements,
            merchantOrders: cleaned.merchantOrders,
            merchantReports: cleaned.merchantReports,
            posSessions: cleaned.posSessions,
            posTransactions: cleaned.posTransactions,
            productionLines: cleaned.productionLines,
            productionBatches: cleaned.productionBatches,
            showcaseProducts: cleaned.showcaseProducts ?? [],
            categories: cleaned.categories ?? [],
            lastUpdated: new Date().toISOString(),
          });
          setDoc(doc(db, 'erp', 'main'), scrubPayload, { merge: true }).catch(() => {});
          safeFetchJson('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scrubPayload),
          }).catch(() => {});
        }

        setSyncStatus('synced');
        setLastSynced(new Date().toLocaleTimeString());
      } else {
        // Initialize clean Cloud Firestore document without fake/demo records
        const initialPayload = sanitizeForCloud({
          users: [MASTER_ADMIN_USER],
          company: INITIAL_COMPANY,
          merchantSettings: DEFAULT_MERCHANT_PORTAL_SETTINGS,
          products: [],
          customers: [],
          categories: [],
          invoices: [],
          deliveryNotes: [],
          quotations: [],
          payments: [],
          merchantOrders: [],
          merchantReports: [],
          showcaseProducts: [],
          posTransactions: [],
          posSessions: [],
          productionLines: [],
          productionBatches: [],
          staff: [],
          payrollPayouts: [],
          stockPurchases: [],
          stockItemStatuses: [],
          stockMovements: [],
          journalEntries: [],
          leads: [],
          communications: [],
          loginLogs: [],
          lastUpdated: new Date().toISOString(),
        });
        setDoc(doc(db, 'erp', 'main'), initialPayload).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, 'erp/main');
        });
        setSyncStatus('synced');
        setLastSynced(new Date().toLocaleTimeString());
      }
    }, (error) => {
      if (!mounted) return;
      if (error && error.message && (error.message.includes('offline') || error.message.includes('unavailable') || error.message.includes('timeout'))) {
        console.warn('[Cloud Sync] Client operating in resilient offline cache mode.');
      } else {
        handleFirestoreError(error, OperationType.GET, 'erp/main');
      }
      setSyncStatus('offline');
    });

    const handleFocusSync = () => {
      refreshData();
    };
    const handleVisibilitySync = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshData();
      }
    };

    window.addEventListener('focus', handleFocusSync);
    window.addEventListener('online', handleFocusSync);
    document.addEventListener('visibilitychange', handleVisibilitySync);

    return () => {
      mounted = false;
      unsub();
      window.removeEventListener('focus', handleFocusSync);
      window.removeEventListener('online', handleFocusSync);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
    };
  }, [applyDatabaseSnapshot, refreshData]);

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
    let effectiveMerchantSettings = merchantSettings;
    let matchedUser = users.find(
      (u) =>
        !isLegacyDemoUser(u) &&
        (u.email.toLowerCase() === cleanId ||
          (u as any).username?.toLowerCase() === cleanId ||
          u.name.toLowerCase() === cleanId ||
          (Boolean((u as any).merchantPhone) && (u as any).merchantPhone.toLowerCase() === cleanId))
    );

    // Fallback 1: check live Firestore directly in case state is still hydrating
    if (!matchedUser) {
      try {
        const snap = await getDoc(doc(db, 'erp', 'main'));
        if (snap.exists()) {
          const cloud = snap.data() as Partial<ERPDatabase>;
          if (cloud.merchantSettings) {
            effectiveMerchantSettings = normalizeMerchantSettings(cloud.merchantSettings);
          }
          if (Array.isArray(cloud.users)) {
            matchedUser = cloud.users.find(
              (u) =>
                !isLegacyDemoUser(u) &&
                (u.email.toLowerCase() === cleanId ||
                  (u as any).username?.toLowerCase() === cleanId ||
                  u.name.toLowerCase() === cleanId ||
                  (Boolean((u as any).merchantPhone) && (u as any).merchantPhone.toLowerCase() === cleanId))
            );
          }
        }
      } catch (e) {
        console.warn('Firestore direct user lookup error:', e);
      }
    }

    // Fallback 2: check server endpoint if reachable
    if (!matchedUser) {
      try {
        const res = await safeFetchJson<{ success: boolean; user: User }>('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier.trim(), password: password.trim() }),
        });
        if (res.ok && res.data?.user && !isLegacyDemoUser(res.data.user)) {
          matchedUser = res.data.user;
        } else if (res.status === 403 && res.error) {
          throw new Error(res.error);
        }
      } catch (err: any) {
        if (err?.message && (err.message.includes('closed') || err.message.includes('paused') || err.message.includes('window') || err.message.includes('disabled'))) {
          throw err;
        }
      }
    }

    if (matchedUser) {
      const isPasswordMatch =
        !matchedUser.password ||
        matchedUser.password === cleanPassword ||
        matchedUser.password.toLowerCase() === cleanPassword.toLowerCase();

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

      // Enforce Admin-configured Merchant Login Hours & Portal Pause
      if (matchedUser.role === 'merchant') {
        const accessCheck = checkMerchantPortalAccess(effectiveMerchantSettings, matchedUser);
        if (!accessCheck.allowed) {
          await recordLoginLog({
            userId: matchedUser.id,
            userName: matchedUser.name,
            userEmail: matchedUser.email,
            action: 'LOGIN',
            status: 'FAILED',
            details: `Merchant login blocked (${accessCheck.reasonCode}): ${accessCheck.message}`,
          });
          throw new Error(accessCheck.message);
        }
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
      customerId: data.customerId || undefined,
      customerName: data.customerName || undefined,
      bypassLoginHours: data.bypassLoginHours,
      allowedLoginStart: data.allowedLoginStart || undefined,
      allowedLoginEnd: data.allowedLoginEnd || undefined,
      customMoqUnits: data.customMoqUnits !== undefined ? Number(data.customMoqUnits) : undefined,
      customMinOrderValue: data.customMinOrderValue !== undefined ? Number(data.customMinOrderValue) : undefined,
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
        merchants: false,
        merchantControls: false,
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
        merchants: data.role === 'super_admin',
        merchantControls: data.role === 'super_admin',
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

  const updateMerchantSettings = async (
    data: Partial<MerchantPortalSettings>
  ): Promise<MerchantPortalSettings> => {
    const updated: MerchantPortalSettings = {
      ...normalizeMerchantSettings({ ...merchantSettings, ...data }),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'Administrator',
    };
    setMerchantSettings(updated);
    persistToLocal({ merchantSettings: updated });
    await syncToCloud({ merchantSettings: updated });
    return updated;
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
    const cleanCategory = (data.category || '').trim();
    const newProd: Product = {
      id: 'prod_' + Date.now(),
      sku: data.sku || `SKU-${String(products.length + 1).padStart(3, '0')}`,
      name: data.name || '',
      category: cleanCategory,
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
      moq: data.moq !== undefined ? Math.max(0, Number(data.moq) || 0) : undefined,
    };

    const nextProducts = [newProd, ...products];
    let nextCats = categories;
    if (cleanCategory && !categories.some((c) => c.toLowerCase() === cleanCategory.toLowerCase())) {
      nextCats = [...categories, cleanCategory];
      setCategories(nextCats);
    }

    setProducts(nextProducts);
    persistToLocal({ products: nextProducts, categories: nextCats });
    await syncToCloud({ products: nextProducts, categories: nextCats });

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
    const cleanUsers = users.filter((u) => u.role === 'super_admin');
    const finalUsers = cleanUsers.length > 0 ? cleanUsers : [MASTER_ADMIN_USER];

    setUsers(finalUsers);
    setCustomers([]);
    setProducts([]);
    setCategories([]);
    setInvoices([]);
    setDeliveryNotes([]);
    setQuotations([]);
    setPayments([]);
    setMerchantOrders([]);
    setMerchantReports([]);
    setShowcaseProducts([]);
    setPosTransactions([]);
    setPosSessions([]);
    setProductionLines([]);
    setProductionBatches([]);
    setLeads([]);
    setCommunications([]);
    setStaff([]);
    setPayrollPayouts([]);
    setStockPurchases([]);
    setStockItemStatuses([]);
    setStockMovements([]);
    setJournalEntries([]);
    setLoginLogs([]);

    const purgedData: Partial<ERPDatabase> = {
      users: finalUsers,
      customers: [],
      products: [],
      categories: [],
      invoices: [],
      deliveryNotes: [],
      quotations: [],
      payments: [],
      merchantOrders: [],
      merchantReports: [],
      showcaseProducts: [],
      posTransactions: [],
      posSessions: [],
      productionLines: [],
      productionBatches: [],
      leads: [],
      communications: [],
      staff: [],
      payrollPayouts: [],
      stockPurchases: [],
      stockItemStatuses: [],
      stockMovements: [],
      journalEntries: [],
      loginLogs: [],
    };
    try {
      localStorage.removeItem('savoure_merchant_reports');
    } catch {}
    persistToLocal(purgedData);
    await syncToCloud(purgedData);
    await safeFetchJson('/api/database/purge', { method: 'POST' }).catch(() => {});
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
        notes: newMovement.notes || (isSA ? 'Retail Product' : ''),
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

    if (currentUser?.role === 'merchant') {
      const accessCheck = checkMerchantPortalAccess(merchantSettings, currentUser, now);
      if (!accessCheck.allowed) {
        throw new Error(accessCheck.message);
      }
    }

    const moqCheck = evaluateMerchantOrderMOQ({
      items,
      products,
      user: currentUser,
      settings: merchantSettings,
      currency: company?.currency || 'R',
    });
    if (moqCheck.enforced && !moqCheck.valid) {
      throw new Error(moqCheck.violations[0] || 'Order does not meet Minimum Order Quantity (MOQ) rules.');
    }

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
      items: order.items.map((it) => {
        const matchedProd = products.find(
          (p) =>
            (it.productId && p.id === it.productId) ||
            p.name.toLowerCase() === (it.productName || '').toLowerCase()
        );
        const lineSubtotal = Number(it.lineTotal) || Number(it.quantity) * Number(it.unitPrice);
        return {
          id: 'inv_it_' + Math.random().toString(36).substring(2, 9),
          productId: matchedProd?.id || it.productId || '',
          sku: matchedProd?.sku || 'SKU',
          description: it.productName,
          packSize: it.packSize || matchedProd?.packSize || 'Standard Pack',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          vatRate: 0,
          discountPercent: 0,
          subtotal: lineSubtotal,
          vatAmount: 0,
          total: lineSubtotal,
          amount: lineSubtotal,
        };
      }),
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
  const addProductionLine = async (data: Partial<ProductionLine>): Promise<ProductionLine> => {
    const seq = productionLines.length + 1;
    const newLine: ProductionLine = {
      id: `line_${Date.now()}`,
      code: data.code || `LINE-${String(seq).padStart(2, '0')}`,
      name: data.name || `Production Line ${seq}`,
      section: data.section || 'Extrusion & Sheeting',
      status: data.status || 'IDLE',
      supervisor: data.supervisor || currentUser?.name || 'Floor Supervisor',
      capacityPerHour: data.capacityPerHour || '1,000 units/hr',
      targetProductSku: data.targetProductSku || products[0]?.sku || '',
    };
    const nextLines = [...productionLines, newLine];
    setProductionLines(nextLines);
    persistToLocal({ productionLines: nextLines });
    await syncToCloud({ productionLines: nextLines });
    return newLine;
  };

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
    const defaultProduct = products[0];
    const defaultLine = productionLines[0];

    const newBatch: ProductionBatch = {
      id: `batch_${Date.now()}`,
      batchNumber,
      lineId: data.lineId || defaultLine?.id || 'line_main',
      lineName: data.lineName || defaultLine?.name || 'Main Bakery Floor',
      targetProductId: data.targetProductId || defaultProduct?.id || '',
      targetProductName: data.targetProductName || defaultProduct?.name || 'Bakery Product',
      targetSku: data.targetSku || defaultProduct?.sku || '',
      plannedQuantity: data.plannedQuantity || 100,
      actualYield: data.actualYield || 0,
      rejectedQuantity: data.rejectedQuantity || 0,
      status: data.status || 'PLANNED',
      ingredients: data.ingredients || [],
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
      supervisorName: data.supervisorName || currentUser?.name || 'Production Supervisor',
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

    const matchedProd = products.find(
      (p) => p.id === target.targetProductId || p.sku === target.targetSku
    );
    const newMovement: StockMovement = {
      id: `sm_${Date.now()}`,
      movementNumber: `SM-PROD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      type: 'STOCK_IN',
      barcode: matchedProd?.barcode || target.lotCode || target.targetSku || '',
      sku: target.targetSku,
      productName: target.targetProductName,
      category: matchedProd?.category || 'Production Output',
      quantity: actualYield,
      unit: 'packs',
      sourceBranch: `Production (${target.lineName})`,
      destinationBranch: 'Main Bakery Warehouse',
      batchNumber: target.batchNumber,
      reason: `Completed Production Run (${actualYield} packs produced, ${rejectedQuantity} scrap)`,
      recordedBy: currentUser?.name || 'Production Supervisor',
      isSouthAfricanBarcode: Boolean(matchedProd?.barcode && (matchedProd.barcode.startsWith('600') || matchedProd.barcode.startsWith('601'))),
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
        merchantSettings,
        updateMerchantSettings,
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
        addProductionLine,
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
