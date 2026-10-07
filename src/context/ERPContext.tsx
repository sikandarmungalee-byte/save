import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  CompanySettings,
  BusinessSettings,
  Customer,
  Product,
  Invoice,
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
  JournalEntry,
  UserLoginLog
} from '../types/erp';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

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
  createStockPurchase: (data: Partial<StockPurchase>) => Promise<StockPurchase>;
  deleteStockPurchase: (id: string) => Promise<void>;
  createStockItemStatus: (data: Partial<StockItemStatus>) => Promise<StockItemStatus>;
  updateStockItemStatus: (id: string, data: Partial<StockItemStatus>) => Promise<StockItemStatus>;
  deleteStockItemStatus: (id: string) => Promise<void>;
  markStockAsFinished: (id: string) => Promise<void>;
  setStockQuantity: (id: string, quantity: number) => Promise<void>;

  // Accounting & Journal Entries
  journalEntries: JournalEntry[];
  createJournalEntry: (data: Partial<JournalEntry>) => Promise<JournalEntry>;
  deleteJournalEntry: (id: string) => Promise<void>;

  // User Login Logs & Security
  loginLogs: UserLoginLog[];
  recordLoginLog: (log: Partial<UserLoginLog>) => Promise<void>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<void>;
  
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
});

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>([MASTER_ADMIN_USER]);
  const [company, setCompany] = useState<CompanySettings>(INITIAL_COMPANY);
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
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loginLogs, setLoginLogs] = useState<UserLoginLog[]>([]);

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
        leads,
        communications,
        staff,
        payrollPayouts,
        stockPurchases,
        stockItemStatuses,
        journalEntries,
        loginLogs,
        lastUpdated: new Date().toISOString(),
        ...override,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(currentDb));
    } catch (e) {
      console.warn('Cache write warning:', e);
    }
  }, [users, company, customers, products, categories, invoices, deliveryNotes, quotations, payments, leads, communications, staff, payrollPayouts, stockPurchases, stockItemStatuses, journalEntries, loginLogs]);

  // Synchronize state directly to Cloud Firestore (so phone and laptop sync in real-time)
  const syncToCloud = useCallback(async (data: Partial<ERPDatabase>) => {
    isWritingCloud.current = true;
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'erp', 'main'), {
        ...data,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
      setSyncStatus('synced');
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Cloud sync notice:', err);
    }

    // Also background-sync to server if reachable
    try {
      safeFetchJson('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    } catch {}

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
        if (parsed.payrollPayouts) setPayrollPayouts(parsed.payrollPayouts);
        if (parsed.stockPurchases) setStockPurchases(parsed.stockPurchases);
        if (parsed.stockItemStatuses) setStockItemStatuses(parsed.stockItemStatuses);
        if (parsed.journalEntries) setJournalEntries(parsed.journalEntries);
        if (parsed.loginLogs) setLoginLogs(parsed.loginLogs);

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

  // REAL-TIME CLOUD FIRESTORE SYNCHRONIZATION
  // Connects phone, laptop, tablet and any device via live Cloud Firestore listener
  useEffect(() => {
    setSyncStatus('syncing');
    const unsub = onSnapshot(doc(db, 'erp', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data() as Partial<ERPDatabase>;
        
        if (cloudData.company) setCompany(cloudData.company);
        if (cloudData.products && Array.isArray(cloudData.products)) {
          setProducts(cloudData.products.map((p, i) => normalizeProduct(p, i)));
        }
        if (cloudData.customers) setCustomers(cloudData.customers);
        if (cloudData.categories) setCategories(cloudData.categories);
        if (cloudData.invoices) setInvoices(cloudData.invoices);
        if (cloudData.deliveryNotes) setDeliveryNotes(cloudData.deliveryNotes);
        if (cloudData.quotations) setQuotations(cloudData.quotations);
        if (cloudData.payments) setPayments(cloudData.payments);
        if (cloudData.leads) setLeads(cloudData.leads);
        if (cloudData.communications) setCommunications(cloudData.communications);
        if (cloudData.staff) setStaff(cloudData.staff);
        if (cloudData.payrollPayouts) setPayrollPayouts(cloudData.payrollPayouts);
        if (cloudData.stockPurchases) setStockPurchases(cloudData.stockPurchases);
        if (cloudData.stockItemStatuses) setStockItemStatuses(cloudData.stockItemStatuses);
        if (cloudData.journalEntries) setJournalEntries(cloudData.journalEntries);
        if (cloudData.loginLogs) setLoginLogs(cloudData.loginLogs);

        let cloudUsers = cloudData.users || [];
        if (!cloudUsers.some((u) => u.email.toLowerCase() === 'admin@savoure.co.za')) {
          cloudUsers = [MASTER_ADMIN_USER, ...cloudUsers];
        }
        setUsers(cloudUsers);

        // Update local storage cache
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cloudData));
        } catch (e) {}

        setSyncStatus('synced');
        setLastSynced(new Date().toLocaleTimeString());
      } else {
        // Initialize cloud database with initial Master Admin and company settings
        setDoc(doc(db, 'erp', 'main'), {
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
        }).catch(() => {});
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
      const snap = await getDoc(doc(db, 'erp', 'main'));
      if (snap.exists()) {
        const cloudData = snap.data() as Partial<ERPDatabase>;
        if (cloudData.products && Array.isArray(cloudData.products)) {
          setProducts(cloudData.products.map((p, i) => normalizeProduct(p, i)));
        }
        if (cloudData.customers) setCustomers(cloudData.customers);
        if (cloudData.invoices) setInvoices(cloudData.invoices);
        if (cloudData.deliveryNotes) setDeliveryNotes(cloudData.deliveryNotes);
        if (cloudData.quotations) setQuotations(cloudData.quotations);
        if (cloudData.payments) setPayments(cloudData.payments);
        if (cloudData.leads) setLeads(cloudData.leads);
        if (cloudData.users) setUsers(cloudData.users);
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

    // Check users in state / cloud by email, username, or name
    const matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        (u as any).username?.toLowerCase() === cleanId ||
        u.name.toLowerCase() === cleanId
    );
    if (matchedUser) {
      if (matchedUser.password && matchedUser.password !== cleanPassword) {
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
      throw new Error('You must be signed in to create new users.');
    }

    const cleanEmail = (data.email || '').trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('A user with this email address already exists.');
    }

    const newUser: User = {
      id: 'usr_' + Date.now(),
      name: data.name || 'Team Member',
      email: cleanEmail,
      username: data.username ? data.username.trim().toLowerCase() : undefined,
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

    const nextUsers = [...users, newUser];
    setUsers(nextUsers);
    persistToLocal({ users: nextUsers });
    await syncToCloud({ users: nextUsers });

    return newUser;
  };

  const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
    if (!currentUser) {
      throw new Error('You must be signed in to update users.');
    }

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

    if (currentUser?.id === id && updatedResult) {
      setCurrentUser(updatedResult);
    }

    return updatedResult || (data as User);
  };

  const deleteUser = async (id: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('You must be signed in to delete users.');
    }

    const nextUsers = users.filter((u) => u.id !== id);
    setUsers(nextUsers);
    persistToLocal({ users: nextUsers });
    await syncToCloud({ users: nextUsers });
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
    const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.subtotal) || (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0);
    const vatTotal = isVatReg ? items.reduce((acc: number, item: any) => acc + (Number(item.vatAmount) || 0), 0) : 0;
    const discountTotal = items.reduce((acc: number, item: any) => {
      const raw = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      const disc = raw * ((Number(item.discountPercent) || 0) / 100);
      return acc + disc;
    }, 0);
    const grandTotal = subtotal + vatTotal;
    const amountPaid = Number(data.amountPaid) || 0;
    const balanceDue = Math.max(0, grandTotal - amountPaid);

    let status = data.status || 'Draft';
    if (amountPaid >= grandTotal && grandTotal > 0) status = 'Paid';
    else if (amountPaid > 0 && amountPaid < grandTotal) status = 'Partial';

    // Auto-detect linked merchant user for this customer
    const targetCustId = data.customerId;
    const targetCustName = data.customerName;
    const linkedMerchant = users.find((u) =>
      u.role === 'merchant' &&
      ((targetCustId && u.customerId === targetCustId) ||
       (targetCustName && u.customerName && u.customerName.toLowerCase() === targetCustName.toLowerCase()) ||
       (targetCustName && u.merchantStoreName && u.merchantStoreName.toLowerCase() === targetCustName.toLowerCase()))
    );

    const branchName = data.branchName || data.branch || linkedMerchant?.branch || (currentUser?.role === 'merchant' ? currentUser.branch : undefined);
    const branchId = data.branchId || branchName;
    const merchantId = data.merchantId || linkedMerchant?.id || (currentUser?.role === 'merchant' ? currentUser.id : undefined);
    const merchantName = data.merchantName || linkedMerchant?.name || (currentUser?.role === 'merchant' ? currentUser.name : undefined);
    const merchantEmail = data.merchantEmail || linkedMerchant?.email || (currentUser?.role === 'merchant' ? currentUser.email : undefined);

    const newInv: Invoice = {
      id: 'inv_' + Date.now(),
      invoiceNumber: data.invoiceNumber || `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`,
      customerId: data.customerId || (currentUser?.role === 'merchant' ? currentUser.id : 'cust_direct'),
      customerName: data.customerName || (currentUser?.role === 'merchant' ? (currentUser.merchantStoreName || currentUser.name) : 'Direct Client'),
      customerTradingName: data.customerTradingName || data.customerName || (currentUser?.role === 'merchant' ? currentUser.name : 'Direct Client'),
      branchId,
      branchName,
      branch: branchName,
      merchantId,
      merchantName,
      merchantEmail,
      deliveryAddress: data.deliveryAddress || '',
      customerVat: data.customerVat || '',
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      vatTotal: Math.round(vatTotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      amountPaid: Math.round(amountPaid * 100) / 100,
      balanceDue: Math.round(balanceDue * 100) / 100,
      status,
      notes: data.notes || '',
      paymentReference: data.paymentReference,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'Administrator',
    };

    const nextInvoices = [newInv, ...invoices];
    setInvoices(nextInvoices);
    persistToLocal({ invoices: nextInvoices });
    await syncToCloud({ invoices: nextInvoices });

    return newInv;
  };

  const updateInvoice = async (id: string, data: any): Promise<Invoice> => {
    let resInv: Invoice | null = null;
    const nextInvoices = invoices.map((inv) => {
      if (inv.id === id) {
        const mod = { ...inv, ...data };
        resInv = mod;
        return mod;
      }
      return inv;
    });

    setInvoices(nextInvoices);
    persistToLocal({ invoices: nextInvoices });
    await syncToCloud({ invoices: nextInvoices });

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
    const newDn: DeliveryNote = {
      id: 'dn_' + Date.now(),
      deliveryNoteNumber: data.deliveryNoteNumber || `DN-${new Date().getFullYear()}-${String(deliveryNotes.length + 1).padStart(4, '0')}`,
      invoiceId: data.invoiceId || '',
      invoiceNumber: data.invoiceNumber || '',
      customerId: data.customerId,
      customerName: data.customerName,
      branchId: data.branchId,
      branchName: data.branchName,
      deliveryAddress: data.deliveryAddress,
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
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
    setCustomers([]);
    setProducts([]);
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
      customers: [],
      products: [],
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
    const newStaff: StaffMember = {
      id: 'stf_' + Date.now(),
      employeeCode: data.employeeCode || `STF-${String(staff.length + 1).padStart(3, '0')}`,
      name: data.name || '',
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
    };
    const nextStaff = [newStaff, ...staff];
    setStaff(nextStaff);
    persistToLocal({ staff: nextStaff });
    await syncToCloud({ staff: nextStaff });
    return newStaff;
  };

  const updateStaffMember = async (id: string, data: Partial<StaffMember>): Promise<StaffMember> => {
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
    return res || (data as StaffMember);
  };

  const deleteStaffMember = async (id: string): Promise<void> => {
    const nextStaff = staff.filter((s) => s.id !== id);
    setStaff(nextStaff);
    persistToLocal({ staff: nextStaff });
    await syncToCloud({ staff: nextStaff });
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
        createStockPurchase,
        deleteStockPurchase,
        createStockItemStatus,
        updateStockItemStatus,
        deleteStockItemStatus,
        markStockAsFinished,
        setStockQuantity,
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
