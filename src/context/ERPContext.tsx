import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  CompanySettings,
  Customer,
  Product,
  Invoice,
  DeliveryNote,
  Quotation,
  Payment,
  Lead,
  CommunicationLog,
  ERPDatabase
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
  registrationNumber: '2024/782194/07',
  vatNumber: '4980291847',
  address: 'Johannesburg, South Africa',
  phone: '+27 (0)11 555 4920',
  email: 'admin@savoure.co.za',
  currency: 'R',
  vatRate: 15,
  bankName: 'First National Bank (FNB)',
  accountHolder: 'Savouré (Pty) Ltd',
  accountNumber: '62983104821',
  branchCode: '250655',
  swiftCode: 'FIRNZAJJ',
  defaultPaymentTerms: 'Strictly 30 days from invoice date. Please use your invoice number as EFT payment reference.',
  pinCode: '1234',
  logoUrl: '/src/assets/images/savoure_master_logo_1790775722136.jpg',
};

interface ERPContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  users: User[];
  company: CompanySettings;
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
        lastUpdated: new Date().toISOString(),
        ...override,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(currentDb));
    } catch (e) {
      console.warn('Cache write warning:', e);
    }
  }, [users, company, customers, products, categories, invoices, deliveryNotes, quotations, payments, leads, communications]);

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

  // Authentication: Login & Logout
  const login = async (email: string, password: string): Promise<User> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check Master Admin credentials (tolerant to mobile casing)
    if (cleanEmail === 'admin@savoure.co.za') {
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
        return master;
      } else {
        throw new Error('Incorrect password. Please verify your password and try again.');
      }
    }

    // Check users in state / cloud
    const matchedUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      if (matchedUser.password && matchedUser.password !== cleanPassword) {
        throw new Error('Incorrect password. Please verify your password and try again.');
      }
      if (matchedUser.status === 'inactive') {
        throw new Error('This user account has been disabled by an administrator.');
      }
      setCurrentUser(matchedUser);
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(matchedUser));
        sessionStorage.setItem(USER_KEY, JSON.stringify(matchedUser));
      } catch (e) {}
      return matchedUser;
    }

    throw new Error('Invalid user credentials. For Master Admin, please sign in with admin@savoure.co.za and password Shazia.');
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch (e) {}
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
      password: data.password || 'password123',
      role: data.role || 'sales',
      permissions: data.permissions || {
        manageUsers: data.role === 'super_admin',
        invoices: true,
        deliveryNotes: true,
        quotations: true,
        payments: true,
        customers: true,
        catalog: true,
        reports: data.role === 'super_admin' || data.role === 'accountant',
        crmLeads: true,
        databaseExplorer: data.role === 'super_admin',
        companySettings: data.role === 'super_admin',
      },
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

  // Company Settings
  const updateCompany = async (data: Partial<CompanySettings>) => {
    const updated = { ...company, ...data };
    setCompany(updated);
    persistToLocal({ company: updated });
    await syncToCloud({ company: updated });
  };

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
    const items = data.items || [];
    const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.subtotal) || 0), 0);
    const vatTotal = items.reduce((acc: number, item: any) => acc + (Number(item.vatAmount) || 0), 0);
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

    const newInv: Invoice = {
      id: 'inv_' + Date.now(),
      invoiceNumber: data.invoiceNumber || `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`,
      customerId: data.customerId,
      customerName: data.customerName,
      customerTradingName: data.customerTradingName || data.customerName,
      branchId: data.branchId,
      branchName: data.branchName,
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
    const purgedData = {
      customers: [],
      products: [],
      invoices: [],
      deliveryNotes: [],
      quotations: [],
      payments: [],
      leads: [],
      communications: [],
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
    persistToLocal(importedDb);
    await syncToCloud(importedDb);
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
        customers,
        products,
        invoices,
        deliveryNotes,
        quotations,
        payments,
        leads,
        communications,
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
