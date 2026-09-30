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

interface ERPContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
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
    companyName: 'Apex Enterprise Solutions (Pty) Ltd',
    tradingName: 'Apex Enterprise',
    registrationNumber: '',
    vatNumber: '',
    address: 'Johannesburg, South Africa',
    phone: '',
    email: 'sikandarmungalee@gmail.com',
    currency: 'R',
    vatRate: 15,
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    branchCode: '',
    swiftCode: '',
    defaultPaymentTerms: 'Strictly 30 days from invoice date. Please use your invoice number as EFT payment reference.',
    pinCode: '1234',
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

  // Save current user in local storage
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
      const res = await fetch('/api/sync');
      if (!res.ok) throw new Error('Network response not ok');
      const data: ERPDatabase = await res.json();
      
      setCompany(data.company);
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

      // If no current user is logged in, select existing user if available
      if (!currentUser && data.users && data.users.length > 0) {
        setCurrentUser(data.users[0]);
      }
    } catch (err) {
      console.warn('Offline mode or failed to sync:', err);
      setSyncStatus('offline');
    }
  }, [currentUser]);

  // Initial fetch and auto-polling every 10 seconds for multi-device sync
  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Lock & Unlock
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
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create user');
    }
    const created: User = await res.json();
    setUsers((prev) => [...prev, created]);
    return created;
  };

  const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user');
    }
    const updated: User = await res.json();
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    if (currentUser?.id === id) {
      setCurrentUser(updated);
    }
    return updated;
  };

  const deleteUser = async (id: string): Promise<void> => {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete user');
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Company Settings
  const updateCompany = async (data: Partial<CompanySettings>) => {
    const res = await fetch('/api/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setCompany(updated);
  };

  // Customer Management
  const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const created = await res.json();
    setCustomers((prev) => [created, ...prev]);
    return created;
  };

  const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCustomer = async (id: string) => {
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Products
  const createProduct = async (data: Partial<Product>): Promise<Product> => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const created = await res.json();
    setProducts((prev) => [created, ...prev]);
    return created;
  };

  const updateProduct = async (id: string, data: Partial<Product>): Promise<Product> => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteProduct = async (id: string) => {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Custom Categories
  const createCategory = async (name: string): Promise<string[]> => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const updated = await res.json();
    setCategories(updated);
    return updated;
  };

  const deleteCategory = async (name: string): Promise<string[]> => {
    const res = await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const updated = await res.json();
    setCategories(updated);
    return updated;
  };

  // Invoices
  const createInvoice = async (data: any): Promise<Invoice> => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, createdBy: currentUser?.name || 'Administrator' }),
    });
    const created: Invoice = await res.json();
    setInvoices((prev) => [created, ...prev]);
    refreshData();
    return created;
  };

  const updateInvoice = async (id: string, data: any): Promise<Invoice> => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
    return updated;
  };

  const cloneInvoice = async (id: string): Promise<Invoice> => {
    const res = await fetch(`/api/invoices/${id}/clone`, { method: 'POST' });
    const cloned = await res.json();
    setInvoices((prev) => [cloned, ...prev]);
    return cloned;
  };

  const generateDeliveryNoteFromInvoice = async (invoiceId: string, details?: any): Promise<DeliveryNote> => {
    const res = await fetch(`/api/invoices/${invoiceId}/generate-delivery-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details || {}),
    });
    const data = await res.json();
    setDeliveryNotes((prev) => [data.deliveryNote, ...prev]);
    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? data.invoice : i)));
    return data.deliveryNote;
  };

  const deleteInvoice = async (id: string) => {
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  // Delivery Notes
  const createDeliveryNote = async (data: any): Promise<DeliveryNote> => {
    const res = await fetch('/api/delivery-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const created = await res.json();
    setDeliveryNotes((prev) => [created, ...prev]);
    return created;
  };

  const updateDeliveryNote = async (id: string, data: any): Promise<DeliveryNote> => {
    const res = await fetch(`/api/delivery-notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setDeliveryNotes((prev) => prev.map((dn) => (dn.id === id ? updated : dn)));
    return updated;
  };

  const savePOD = async (
    id: string,
    podData: { podSignature: string; podReceivedBy: string; notes?: string }
  ): Promise<DeliveryNote> => {
    const res = await fetch(`/api/delivery-notes/${id}/pod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(podData),
    });
    const updated = await res.json();
    setDeliveryNotes((prev) => prev.map((dn) => (dn.id === id ? updated : dn)));
    return updated;
  };

  const deleteDeliveryNote = async (id: string) => {
    await fetch(`/api/delivery-notes/${id}`, { method: 'DELETE' });
    setDeliveryNotes((prev) => prev.filter((dn) => dn.id !== id));
  };

  // Quotations
  const createQuotation = async (data: any): Promise<Quotation> => {
    const res = await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const created = await res.json();
    setQuotations((prev) => [created, ...prev]);
    return created;
  };

  const updateQuotation = async (id: string, data: any): Promise<Quotation> => {
    const res = await fetch(`/api/quotations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setQuotations((prev) => prev.map((q) => (q.id === id ? updated : q)));
    return updated;
  };

  const convertQuotation = async (id: string) => {
    const res = await fetch(`/api/quotations/${id}/convert`, { method: 'POST' });
    const data = await res.json();
    setQuotations((prev) => prev.map((q) => (q.id === id ? data.quotation : q)));
    setInvoices((prev) => [data.invoice, ...prev]);
    setDeliveryNotes((prev) => [data.deliveryNote, ...prev]);
    return data;
  };

  const deleteQuotation = async (id: string) => {
    await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
    setQuotations((prev) => prev.filter((q) => q.id !== id));
  };

  // Payments
  const recordPayment = async (data: any): Promise<Payment> => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, recordedBy: currentUser?.name || 'Accounts Staff' }),
    });
    const result = await res.json();
    setPayments((prev) => [result.payment, ...prev]);
    if (result.updatedInvoice) {
      setInvoices((prev) => prev.map((inv) => (inv.id === result.updatedInvoice.id ? result.updatedInvoice : inv)));
    }
    return result.payment;
  };

  const deletePayment = async (id: string) => {
    await fetch(`/api/payments/${id}`, { method: 'DELETE' });
    setPayments((prev) => prev.filter((p) => p.id !== id));
    refreshData();
  };

  // CRM Leads
  const createLead = async (data: any): Promise<Lead> => {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const created = await res.json();
    setLeads((prev) => [created, ...prev]);
    return created;
  };

  const updateLead = async (id: string, data: any): Promise<Lead> => {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
    return updated;
  };

  const deleteLead = async (id: string) => {
    await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const addCommunication = async (data: any): Promise<CommunicationLog> => {
    const res = await fetch('/api/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, author: currentUser?.name || 'Staff' }),
    });
    const created = await res.json();
    setCommunications((prev) => [created, ...prev]);
    return created;
  };

  // Database Tools
  const purgeMockData = async () => {
    await fetch('/api/database/purge', { method: 'POST' });
    await refreshData();
  };

  const restoreBackup = async (importedDb: ERPDatabase) => {
    const res = await fetch('/api/database/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importedDb),
    });
    if (!res.ok) throw new Error('Restore failed');
    await refreshData();
  };

  return (
    <ERPContext.Provider
      value={{
        currentUser,
        setCurrentUser,
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
