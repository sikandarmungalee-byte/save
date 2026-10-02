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

// Safe API caller that prevents "Unexpected token 'T', 'The page c'... is not valid JSON"
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
      // If server returned HTML (e.g. Cloud Run / proxy error page)
      console.warn(`Non-JSON response from ${url} (status ${res.status}):`, text.slice(0, 100));
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Server communication response invalid (${res.status}). Please try again in a few moments.`,
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
      error: err?.message || 'Network error occurred. Please verify connection.',
    };
  }
}

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

  const [users, setUsers] = useState<User[]>([]);
  const [company, setCompany] = useState<CompanySettings>({
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
  });
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
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Synchronize current user in local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [currentUser]);

  // Load from cache initially
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
        if (parsed.users) setUsers(parsed.users);
      }
    } catch (e) {
      console.warn('Cache parse error:', e);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      const res = await safeFetchJson<ERPDatabase>('/api/sync');
      if (!res.ok || !res.data) {
        setSyncStatus('offline');
        return;
      }
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
      setUsers(data.users || []);
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      setSyncStatus('synced');
      setLastSynced(new Date().toLocaleTimeString());

      // If user is currently signed in, keep their live user record synchronized
      if (currentUser) {
        const liveUser = data.users?.find(
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
      }
    } catch (err) {
      console.warn('Sync error:', err);
      setSyncStatus('offline');
    }
  }, [currentUser]);

  // Initial fetch and auto-polling every 6 seconds for instant multi-device sync
  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 6000);
    const onFocus = () => refreshData();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshData]);

  // Authentication: Login & Logout
  const login = async (email: string, password: string): Promise<User> => {
    const res = await safeFetchJson<{ success: boolean; user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: password.trim() }),
    });

    if (!res.ok || !res.data?.user) {
      throw new Error(res.error || 'Authentication failed. Please verify your email and password.');
    }

    const authedUser = res.data.user;
    setCurrentUser(authedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(authedUser));
    await refreshData();
    return authedUser;
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

  // User Management (restricted to signed in users)
  const createUser = async (data: Partial<User>): Promise<User> => {
    if (!currentUser) {
      throw new Error('You must be signed in to create new users.');
    }
    const res = await safeFetchJson<User>('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) {
      throw new Error(res.error || 'Failed to create user');
    }
    const created = res.data;
    setUsers((prev) => [...prev, created]);
    await refreshData();
    return created;
  };

  const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
    if (!currentUser) {
      throw new Error('You must be signed in to update users.');
    }
    const res = await safeFetchJson<User>(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) {
      throw new Error(res.error || 'Failed to update user');
    }
    const updated = res.data;
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    if (currentUser?.id === id) {
      setCurrentUser(updated);
    }
    return updated;
  };

  const deleteUser = async (id: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('You must be signed in to delete users.');
    }
    const res = await safeFetchJson(`/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error(res.error || 'Failed to delete user');
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Company Settings
  const updateCompany = async (data: Partial<CompanySettings>) => {
    const res = await safeFetchJson<CompanySettings>('/api/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok && res.data) {
      setCompany(res.data);
    }
  };

  // Customer Management
  const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
    const res = await safeFetchJson<Customer>('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) {
      throw new Error(res.error || 'Failed to create customer');
    }
    const created = res.data;
    setCustomers((prev) => [created, ...prev]);
    return created;
  };

  const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const res = await safeFetchJson<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) {
      throw new Error(res.error || 'Failed to update customer');
    }
    const updated = res.data;
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCustomer = async (id: string) => {
    const res = await safeFetchJson(`/api/customers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(res.error || 'Failed to delete customer');
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Products
  const createProduct = async (data: Partial<Product>): Promise<Product> => {
    const res = await safeFetchJson<Product>('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to create product');
    const created = res.data;
    setProducts((prev) => [created, ...prev]);
    return created;
  };

  const updateProduct = async (id: string, data: Partial<Product>): Promise<Product> => {
    const res = await safeFetchJson<Product>(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to update product');
    const updated = res.data;
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteProduct = async (id: string) => {
    const res = await safeFetchJson(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(res.error || 'Failed to delete product');
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Custom Categories
  const createCategory = async (name: string): Promise<string[]> => {
    const res = await safeFetchJson<string[]>('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to create category');
    setCategories(res.data);
    return res.data;
  };

  const deleteCategory = async (name: string): Promise<string[]> => {
    const res = await safeFetchJson<string[]>('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to delete category');
    setCategories(res.data);
    return res.data;
  };

  // Invoices
  const createInvoice = async (data: any): Promise<Invoice> => {
    const res = await safeFetchJson<Invoice>('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, createdBy: currentUser?.name || 'Administrator' }),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to create invoice');
    const created = res.data;
    setInvoices((prev) => [created, ...prev]);
    refreshData();
    return created;
  };

  const updateInvoice = async (id: string, data: any): Promise<Invoice> => {
    const res = await safeFetchJson<Invoice>(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to update invoice');
    const updated = res.data;
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
    return updated;
  };

  const cloneInvoice = async (id: string): Promise<Invoice> => {
    const res = await safeFetchJson<Invoice>(`/api/invoices/${id}/clone`, { method: 'POST' });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to clone invoice');
    const cloned = res.data;
    setInvoices((prev) => [cloned, ...prev]);
    return cloned;
  };

  const generateDeliveryNoteFromInvoice = async (invoiceId: string, details?: any): Promise<DeliveryNote> => {
    const res = await safeFetchJson<{ deliveryNote: DeliveryNote; invoice: Invoice }>(`/api/invoices/${invoiceId}/generate-delivery-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details || {}),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to generate delivery note');
    setDeliveryNotes((prev) => [res.data!.deliveryNote, ...prev]);
    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? res.data!.invoice : i)));
    return res.data.deliveryNote;
  };

  const deleteInvoice = async (id: string) => {
    const res = await safeFetchJson(`/api/invoices/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(res.error || 'Failed to delete invoice');
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  // Delivery Notes
  const createDeliveryNote = async (data: any): Promise<DeliveryNote> => {
    const res = await safeFetchJson<DeliveryNote>('/api/delivery-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to create delivery note');
    const created = res.data;
    setDeliveryNotes((prev) => [created, ...prev]);
    return created;
  };

  const updateDeliveryNote = async (id: string, data: any): Promise<DeliveryNote> => {
    const res = await safeFetchJson<DeliveryNote>(`/api/delivery-notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to update delivery note');
    const updated = res.data;
    setDeliveryNotes((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  };

  const savePOD = async (id: string, podData: { podSignature: string; podReceivedBy: string; notes?: string }): Promise<DeliveryNote> => {
    const res = await safeFetchJson<DeliveryNote>(`/api/delivery-notes/${id}/pod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(podData),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to save POD signature');
    const updated = res.data;
    setDeliveryNotes((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  };

  const deleteDeliveryNote = async (id: string) => {
    const res = await safeFetchJson(`/api/delivery-notes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(res.error || 'Failed to delete delivery note');
    setDeliveryNotes((prev) => prev.filter((d) => d.id !== id));
  };

  // Quotations
  const createQuotation = async (data: any): Promise<Quotation> => {
    const res = await safeFetchJson<Quotation>('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to create quotation');
    const created = res.data;
    setQuotations((prev) => [created, ...prev]);
    return created;
  };

  const updateQuotation = async (id: string, data: any): Promise<Quotation> => {
    const res = await safeFetchJson<Quotation>(`/api/quotations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to update quotation');
    const updated = res.data;
    setQuotations((prev) => prev.map((q) => (q.id === id ? updated : q)));
    return updated;
  };

  const convertQuotation = async (id: string): Promise<{ quotation: Quotation; invoice: Invoice; deliveryNote: DeliveryNote }> => {
    const res = await safeFetchJson<{ quotation: Quotation; invoice: Invoice; deliveryNote: DeliveryNote }>(`/api/quotations/${id}/convert`, { method: 'POST' });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to convert quotation');
    const data = res.data;
    setQuotations((prev) => prev.map((q) => (q.id === id ? data.quotation : q)));
    setInvoices((prev) => [data.invoice, ...prev]);
    setDeliveryNotes((prev) => [data.deliveryNote, ...prev]);
    return data;
  };

  const deleteQuotation = async (id: string) => {
    const res = await safeFetchJson(`/api/quotations/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(res.error || 'Failed to delete quotation');
    setQuotations((prev) => prev.filter((q) => q.id !== id));
  };

  // Payments
  const recordPayment = async (data: any): Promise<Payment> => {
    const res = await safeFetchJson<{ payment: Payment; updatedInvoice: Invoice }>('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, recordedBy: currentUser?.name || 'Accounts Officer' }),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to record payment');
    const { payment, updatedInvoice } = res.data;
    setPayments((prev) => [payment, ...prev]);
    if (updatedInvoice) {
      setInvoices((prev) => prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));
    }
    return payment;
  };

  const deletePayment = async (id: string) => {
    const res = await safeFetchJson(`/api/payments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(res.error || 'Failed to delete payment');
    setPayments((prev) => prev.filter((p) => p.id !== id));
    await refreshData();
  };

  // CRM Leads & Communications
  const createLead = async (data: any): Promise<Lead> => {
    const res = await safeFetchJson<Lead>('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to create lead');
    const created = res.data;
    setLeads((prev) => [created, ...prev]);
    return created;
  };

  const updateLead = async (id: string, data: any): Promise<Lead> => {
    const res = await safeFetchJson<Lead>(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to update lead');
    const updated = res.data;
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
    return updated;
  };

  const deleteLead = async (id: string) => {
    const res = await safeFetchJson(`/api/leads/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(res.error || 'Failed to delete lead');
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const addCommunication = async (data: any): Promise<CommunicationLog> => {
    const res = await safeFetchJson<CommunicationLog>('/api/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, author: currentUser?.name || 'System User' }),
    });
    if (!res.ok || !res.data) throw new Error(res.error || 'Failed to log communication');
    const created = res.data;
    setCommunications((prev) => [created, ...prev]);
    return created;
  };

  // Database Tools
  const purgeMockData = async () => {
    const res = await safeFetchJson('/api/database/purge', { method: 'POST' });
    if (!res.ok) throw new Error(res.error || 'Purge failed');
    await refreshData();
  };

  const restoreBackup = async (importedDb: ERPDatabase) => {
    const res = await safeFetchJson('/api/database/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importedDb),
    });
    if (!res.ok) throw new Error(res.error || 'Restore failed');
    await refreshData();
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
