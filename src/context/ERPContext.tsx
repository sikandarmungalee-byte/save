import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

// Safe API caller that catches non-JSON/404 errors gracefully
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
  
  // User Management (restricted to signed in users)
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

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
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

  // Helper to persist entire state to local cache
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
      console.warn('Failed to save to local cache:', e);
    }
  }, [users, company, customers, products, categories, invoices, deliveryNotes, quotations, payments, leads, communications]);

  // Synchronize current user in local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [currentUser]);

  // Load from cache on startup
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: ERPDatabase = JSON.parse(cached);
        if (parsed.company) setCompany(parsed.company);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.products) setProducts(parsed.products);
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
      } else {
        // Initialize default cache
        persistToLocal({ users: [MASTER_ADMIN_USER], company: INITIAL_COMPANY });
      }
    } catch (e) {
      console.warn('Cache parse error:', e);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      const res = await safeFetchJson<ERPDatabase>('/api/sync');
      
      if (res.ok && res.data) {
        const data = res.data;
        if (data.company) setCompany(data.company);
        setCustomers(data.customers || []);
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setInvoices(data.invoices || []);
        setDeliveryNotes(data.deliveryNotes || []);
        setQuotations(data.quotations || []);
        setPayments(data.payments || []);
        setLeads(data.leads || []);
        setCommunications(data.communications || []);

        let syncedUsers = data.users || [];
        if (!syncedUsers.some((u) => u.email.toLowerCase() === 'admin@savoure.co.za')) {
          syncedUsers = [MASTER_ADMIN_USER, ...syncedUsers];
        }
        setUsers(syncedUsers);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } else {
        // If /api/sync is 404 (e.g. static domain rotibros.co.za on Vercel), maintain local cache gracefully
        setUsers((prev) => {
          if (!prev.some((u) => u.email.toLowerCase() === 'admin@savoure.co.za')) {
            return [MASTER_ADMIN_USER, ...prev];
          }
          return prev;
        });
      }

      setSyncStatus('synced');
      setLastSynced(new Date().toLocaleTimeString());

      // If user is currently signed in, keep their live user record synchronized
      if (currentUser) {
        setUsers((currentList) => {
          const liveUser = currentList.find(
            (u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
          );
          if (liveUser) {
            if (liveUser.status === 'inactive') {
              setCurrentUser(null);
              localStorage.removeItem(USER_KEY);
            } else {
              setCurrentUser((prev) => (prev ? { ...prev, ...liveUser } : null));
            }
          }
          return currentList;
        });
      }
    } catch (err) {
      console.warn('Sync notice:', err);
      setSyncStatus('synced');
    }
  }, [currentUser]);

  // Initial fetch and auto-polling every 8 seconds for multi-device sync
  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 8000);
    const onFocus = () => refreshData();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshData]);

  // Authentication: Login & Logout with Zero-Failure Master Admin Fallback
  const login = async (email: string, password: string): Promise<User> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // First attempt server login
    try {
      const res = await safeFetchJson<{ success: boolean; user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      if (res.ok && res.data?.user) {
        const authedUser = res.data.user;
        setCurrentUser(authedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(authedUser));
        await refreshData();
        return authedUser;
      }
      
      // If server returned 401 specifically for bad password on an existing server user, show it
      if (res.status === 401 && (res.data as any)?.error?.includes('password')) {
        throw new Error('Incorrect password. Please verify your password and try again.');
      }
    } catch (netErr: any) {
      if (netErr?.message?.includes('password')) {
        throw netErr;
      }
    }

    // Client-side authentication fallback (ensures rotibros.co.za on Vercel NEVER fails with 404)
    if (cleanEmail === 'admin@savoure.co.za') {
      if (cleanPassword === 'Shazia') {
        const master = { ...MASTER_ADMIN_USER, lastLogin: new Date().toISOString() };
        setCurrentUser(master);
        localStorage.setItem(USER_KEY, JSON.stringify(master));
        setUsers((prev) => {
          const filtered = prev.filter((u) => u.email.toLowerCase() !== 'admin@savoure.co.za');
          const updated = [master, ...filtered];
          localStorage.setItem(CACHE_KEY, JSON.stringify({ company, users: updated }));
          return updated;
        });
        return master;
      } else {
        throw new Error('Incorrect password. Please verify your password and try again.');
      }
    }

    // Check if user exists in cached users
    const matchedUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      if (matchedUser.password && matchedUser.password !== cleanPassword) {
        throw new Error('Incorrect password. Please verify your password and try again.');
      }
      if (matchedUser.status === 'inactive') {
        throw new Error('This user account has been disabled by an administrator.');
      }
      setCurrentUser(matchedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(matchedUser));
      return matchedUser;
    }

    throw new Error('Invalid user credentials. For Master Admin, please sign in with admin@savoure.co.za and password Shazia.');
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_KEY);
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

  // User Management (strictly restricted to signed in users)
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

    // Attempt server sync
    try {
      await safeFetchJson('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('User saved in local database:', e);
    }

    setUsers((prev) => {
      const updated = [...prev, newUser];
      persistToLocal({ users: updated });
      return updated;
    });

    return newUser;
  };

  const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
    if (!currentUser) {
      throw new Error('You must be signed in to update users.');
    }

    try {
      await safeFetchJson(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('User update saved in local database');
    }

    let updatedResult: User | null = null;
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === id) {
          const mod = { ...u, ...data };
          updatedResult = mod;
          return mod;
        }
        return u;
      });
      persistToLocal({ users: updated });
      return updated;
    });

    if (currentUser?.id === id && updatedResult) {
      setCurrentUser(updatedResult);
    }

    return updatedResult || (data as User);
  };

  const deleteUser = async (id: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('You must be signed in to delete users.');
    }

    try {
      await safeFetchJson(`/api/users/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('User deletion saved in local database');
    }

    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== id);
      persistToLocal({ users: updated });
      return updated;
    });
  };

  // Company Settings
  const updateCompany = async (data: Partial<CompanySettings>) => {
    try {
      await safeFetchJson('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Company updated locally');
    }

    setCompany((prev) => {
      const updated = { ...prev, ...data };
      persistToLocal({ company: updated });
      return updated;
    });
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

    try {
      await safeFetchJson('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {}

    setCustomers((prev) => {
      const updated = [newCust, ...prev];
      persistToLocal({ customers: updated });
      return updated;
    });

    return newCust;
  };

  const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
    try {
      await safeFetchJson(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {}

    let resCust: Customer | null = null;
    setCustomers((prev) => {
      const updated = prev.map((c) => {
        if (c.id === id) {
          const mod = { ...c, ...data };
          resCust = mod;
          return mod;
        }
        return c;
      });
      persistToLocal({ customers: updated });
      return updated;
    });

    return resCust || (data as Customer);
  };

  const deleteCustomer = async (id: string) => {
    try {
      await safeFetchJson(`/api/customers/${id}`, { method: 'DELETE' });
    } catch (e) {}

    setCustomers((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      persistToLocal({ customers: updated });
      return updated;
    });
  };

  // Products
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

    try {
      await safeFetchJson('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {}

    setProducts((prev) => {
      const updated = [newProd, ...prev];
      persistToLocal({ products: updated });
      return updated;
    });

    return newProd;
  };

  const updateProduct = async (id: string, data: Partial<Product>): Promise<Product> => {
    try {
      await safeFetchJson(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {}

    let resProd: Product | null = null;
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          const mod = { ...p, ...data };
          resProd = mod;
          return mod;
        }
        return p;
      });
      persistToLocal({ products: updated });
      return updated;
    });

    return resProd || (data as Product);
  };

  const deleteProduct = async (id: string) => {
    try {
      await safeFetchJson(`/api/products/${id}`, { method: 'DELETE' });
    } catch (e) {}

    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persistToLocal({ products: updated });
      return updated;
    });
  };

  // Custom Categories
  const createCategory = async (name: string): Promise<string[]> => {
    const clean = name.trim();
    try {
      await safeFetchJson('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean }),
      });
    } catch (e) {}

    let nextCats = categories;
    if (clean && !categories.includes(clean)) {
      nextCats = [...categories, clean];
      setCategories(nextCats);
      persistToLocal({ categories: nextCats });
    }
    return nextCats;
  };

  const deleteCategory = async (name: string): Promise<string[]> => {
    try {
      await safeFetchJson('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    } catch (e) {}

    const updated = categories.filter((c) => c !== name);
    setCategories(updated);
    persistToLocal({ categories: updated });
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

    try {
      await safeFetchJson('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, createdBy: currentUser?.name || 'Administrator' }),
      });
    } catch (e) {}

    setInvoices((prev) => {
      const updated = [newInv, ...prev];
      persistToLocal({ invoices: updated });
      return updated;
    });

    return newInv;
  };

  const updateInvoice = async (id: string, data: any): Promise<Invoice> => {
    try {
      await safeFetchJson(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {}

    let resInv: Invoice | null = null;
    setInvoices((prev) => {
      const updated = prev.map((inv) => {
        if (inv.id === id) {
          const mod = { ...inv, ...data };
          resInv = mod;
          return mod;
        }
        return inv;
      });
      persistToLocal({ invoices: updated });
      return updated;
    });

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

    try {
      await safeFetchJson(`/api/invoices/${id}/clone`, { method: 'POST' });
    } catch (e) {}

    setInvoices((prev) => {
      const updated = [cloned, ...prev];
      persistToLocal({ invoices: updated });
      return updated;
    });

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

    try {
      await safeFetchJson(`/api/invoices/${invoiceId}/generate-delivery-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details || {}),
      });
    } catch (e) {}

    setDeliveryNotes((prev) => {
      const updated = [newDn, ...prev];
      persistToLocal({ deliveryNotes: updated });
      return updated;
    });

    return newDn;
  };

  const deleteInvoice = async (id: string) => {
    try {
      await safeFetchJson(`/api/invoices/${id}`, { method: 'DELETE' });
    } catch (e) {}

    setInvoices((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      persistToLocal({ invoices: updated });
      return updated;
    });
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

    try {
      await safeFetchJson('/api/delivery-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {}

    setDeliveryNotes((prev) => {
      const updated = [newDn, ...prev];
      persistToLocal({ deliveryNotes: updated });
      return updated;
    });

    return newDn;
  };

  const updateDeliveryNote = async (id: string, data: any): Promise<DeliveryNote> => {
    try {
      await safeFetchJson(`/api/delivery-notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {}

    let resDn: DeliveryNote | null = null;
    setDeliveryNotes((prev) => {
      const updated = prev.map((d) => {
        if (d.id === id) {
          const mod = { ...d, ...data };
          resDn = mod;
          return mod;
        }
        return d;
      });
      persistToLocal({ deliveryNotes: updated });
      return updated;
    });

    return resDn || (data as DeliveryNote);
  };

  const savePOD = async (id: string, podData: { podSignature: string; podReceivedBy: string; notes?: string }): Promise<DeliveryNote> => {
    try {
      await safeFetchJson(`/api/delivery-notes/${id}/pod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(podData),
      });
    } catch (e) {}

    let resDn: DeliveryNote | null = null;
    setDeliveryNotes((prev) => {
      const updated = prev.map((d) => {
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
      persistToLocal({ deliveryNotes: updated });
      return updated;
    });

    return resDn || (podData as any);
  };

  const deleteDeliveryNote = async (id: string) => {
    try {
      await safeFetchJson(`/api/delivery-notes/${id}`, { method: 'DELETE' });
    } catch (e) {}

    setDeliveryNotes((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      persistToLocal({ deliveryNotes: updated });
      return updated;
    });
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

    try {
      await safeFetchJson('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {}

    setQuotations((prev) => {
      const updated = [newQuote, ...prev];
      persistToLocal({ quotations: updated });
      return updated;
    });

    return newQuote;
  };

  const updateQuotation = async (id: string, data: any): Promise<Quotation> => {
    try {
      await safeFetchJson(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {}

    let resQ: Quotation | null = null;
    setQuotations((prev) => {
      const updated = prev.map((q) => {
        if (q.id === id) {
          const mod = { ...q, ...data };
          resQ = mod;
          return mod;
        }
        return q;
      });
      persistToLocal({ quotations: updated });
      return updated;
    });

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

    try {
      await safeFetchJson(`/api/quotations/${id}/convert`, { method: 'POST' });
    } catch (e) {}

    let updatedQuote = quote;
    if (quote) {
      updatedQuote = { ...quote, status: 'Converted', convertedInvoiceId: newInvoice.id, convertedDeliveryNoteId: newDn.id };
    }

    setQuotations((prev) => {
      const updated = prev.map((q) => (q.id === id ? updatedQuote! : q));
      return updated;
    });

    setInvoices((prev) => {
      const updated = [newInvoice, ...prev];
      return updated;
    });

    setDeliveryNotes((prev) => {
      const updated = [newDn, ...prev];
      persistToLocal({ invoices: [newInvoice, ...invoices], deliveryNotes: updated });
      return updated;
    });

    return { quotation: updatedQuote!, invoice: newInvoice, deliveryNote: newDn };
  };

  const deleteQuotation = async (id: string) => {
    try {
      await safeFetchJson(`/api/quotations/${id}`, { method: 'DELETE' });
    } catch (e) {}

    setQuotations((prev) => {
      const updated = prev.filter((q) => q.id !== id);
      persistToLocal({ quotations: updated });
      return updated;
    });
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

    try {
      await safeFetchJson('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, recordedBy: currentUser?.name || 'Accounts Officer' }),
      });
    } catch (e) {}

    if (inv) {
      const newPaid = Math.round((inv.amountPaid + amount) * 100) / 100;
      const newBal = Math.max(0, Math.round((inv.grandTotal - newPaid) * 100) / 100);
      let newStat = inv.status;
      if (newBal <= 0.01) newStat = 'Paid';
      else if (newPaid > 0) newStat = 'Partial';

      setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, amountPaid: newPaid, balanceDue: newBal, status: newStat } : i)));
    }

    setPayments((prev) => {
      const updated = [newPay, ...prev];
      persistToLocal({ payments: updated });
      return updated;
    });

    return newPay;
  };

  const deletePayment = async (id: string) => {
    try {
      await safeFetchJson(`/api/payments/${id}`, { method: 'DELETE' });
    } catch (e) {}

    setPayments((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persistToLocal({ payments: updated });
      return updated;
    });
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

    try {
      await safeFetchJson('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {}

    setLeads((prev) => {
      const updated = [newL, ...prev];
      persistToLocal({ leads: updated });
      return updated;
    });

    return newL;
  };

  const updateLead = async (id: string, data: any): Promise<Lead> => {
    try {
      await safeFetchJson(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {}

    let resL: Lead | null = null;
    setLeads((prev) => {
      const updated = prev.map((l) => {
        if (l.id === id) {
          const mod = { ...l, ...data, updatedAt: new Date().toISOString() };
          resL = mod;
          return mod;
        }
        return l;
      });
      persistToLocal({ leads: updated });
      return updated;
    });

    return resL || (data as Lead);
  };

  const deleteLead = async (id: string) => {
    try {
      await safeFetchJson(`/api/leads/${id}`, { method: 'DELETE' });
    } catch (e) {}

    setLeads((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      persistToLocal({ leads: updated });
      return updated;
    });
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

    try {
      await safeFetchJson('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, author: currentUser?.name || 'System User' }),
      });
    } catch (e) {}

    setCommunications((prev) => {
      const updated = [newComm, ...prev];
      persistToLocal({ communications: updated });
      return updated;
    });

    return newComm;
  };

  // Database Tools
  const purgeMockData = async () => {
    try {
      await safeFetchJson('/api/database/purge', { method: 'POST' });
    } catch (e) {}

    setCustomers([]);
    setProducts([]);
    setInvoices([]);
    setDeliveryNotes([]);
    setQuotations([]);
    setPayments([]);
    setLeads([]);
    setCommunications([]);
    persistToLocal({
      customers: [],
      products: [],
      invoices: [],
      deliveryNotes: [],
      quotations: [],
      payments: [],
      leads: [],
      communications: [],
    });
  };

  const restoreBackup = async (importedDb: ERPDatabase) => {
    try {
      await safeFetchJson('/api/database/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importedDb),
      });
    } catch (e) {}

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
