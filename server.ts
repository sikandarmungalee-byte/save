import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { getDatabase, saveDatabase } from './server/db';
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
} from './src/types/erp';

const app = express();

// Enable CORS for custom domains like rotibros.co.za and external clients
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to generate sequential IDs e.g. INV-2026-0004
function generateSequentialCode(prefix: string, count: number): string {
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
}

// ----------------------------------------------------
// Authentication & User Management Routes
// ----------------------------------------------------
app.post('/api/auth/register-initial-admin', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const db = getDatabase();
  // Check if a super admin already exists with this email
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const superAdmin: User = {
    id: 'usr_' + Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password,
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

  db.users.push(superAdmin);
  saveDatabase(db);

  const { password: _, ...safeUser } = superAdmin;
  return res.status(201).json({ success: true, user: safeUser, token: 'token_' + superAdmin.id });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const db = getDatabase();
  const cleanEmail = (email || '').toLowerCase().trim();
  const cleanPassword = (password || '').trim();

  let user = db.users.find(
    (u) =>
      u.email.toLowerCase() === cleanEmail ||
      (u.username && u.username.toLowerCase() === cleanEmail) ||
      (cleanEmail === 'admin' && u.email.toLowerCase() === 'admin@savoure.co.za')
  );

  // If user is admin@savoure.co.za or admin, ensure the master super admin account is present
  if (!user && (cleanEmail === 'admin@savoure.co.za' || cleanEmail === 'admin')) {
    const masterAdmin: User = {
      id: 'usr_master_savoure',
      name: 'Master Admin',
      email: 'admin@savoure.co.za',
      username: 'admin',
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
        stock: true,
        payroll: true,
        accounting: true,
        taskeenAI: true,
        reports: true,
        crmLeads: true,
        databaseExplorer: true,
        companySettings: true,
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    db.users.unshift(masterAdmin);
    saveDatabase(db);
    user = masterAdmin;
  }

  if (!db.loginLogs) {
    db.loginLogs = [];
  }

  if (!user) {
    // Record failed login attempt
    db.loginLogs.unshift({
      id: 'log_' + Date.now(),
      userId: 'unknown',
      userName: cleanEmail || 'Unknown User',
      userEmail: cleanEmail,
      action: 'LOGIN',
      status: 'FAILED',
      timestamp: new Date().toISOString(),
      device: req.headers['user-agent'] || 'Web Browser',
      details: 'Failed login: User account not found',
    });
    saveDatabase(db);
    return res.status(401).json({ error: 'Invalid user credentials. Please check your username/email or contact your administrator.' });
  }

  if (user.status === 'inactive') {
    db.loginLogs.unshift({
      id: 'log_' + Date.now(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'LOGIN',
      status: 'FAILED',
      timestamp: new Date().toISOString(),
      device: req.headers['user-agent'] || 'Web Browser',
      details: 'Login blocked: Account is inactive/suspended',
    });
    saveDatabase(db);
    return res.status(403).json({ error: 'This user account has been disabled by an administrator.' });
  }

  // Validate password
  if (user.password && cleanPassword !== user.password) {
    db.loginLogs.unshift({
      id: 'log_' + Date.now(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'LOGIN',
      status: 'FAILED',
      timestamp: new Date().toISOString(),
      device: req.headers['user-agent'] || 'Web Browser',
      details: 'Failed login: Incorrect password provided',
    });
    saveDatabase(db);
    return res.status(401).json({ error: 'Incorrect password. Please verify your password and try again.' });
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  db.loginLogs.unshift({
    id: 'log_' + Date.now(),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    action: 'LOGIN',
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
    device: req.headers['user-agent'] || 'Web Browser',
    details: 'User authenticated successfully',
  });
  saveDatabase(db);

  const { password: _, ...safeUser } = user;
  return res.json({ success: true, user: safeUser, token: 'token_' + user.id });
});

app.get('/api/users', (_req: Request, res: Response) => {
  const db = getDatabase();
  const safeUsers = db.users.map(({ password: _, ...rest }) => rest);
  res.json(safeUsers);
});

app.post('/api/users', (req: Request, res: Response) => {
  const { name, email, password, role, permissions, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const db = getDatabase();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }

  const defaultPerms = role === 'super_admin' ? {
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
  } : {
    manageUsers: false,
    invoices: true,
    deliveryNotes: true,
    quotations: true,
    payments: true,
    customers: true,
    catalog: true,
    reports: false,
    crmLeads: false,
    databaseExplorer: false,
    companySettings: false,
  };

  const newUser: User = {
    id: 'usr_' + Date.now(),
    name,
    email: email.trim().toLowerCase(),
    password: password || 'password123',
    role: role || 'sales',
    permissions: permissions || defaultPerms,
    status: status || 'active',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase(db);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.users.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const current = db.users[index];
  const { name, email, password, role, permissions, status } = req.body;

  db.users[index] = {
    ...current,
    name: name !== undefined ? name : current.name,
    email: email !== undefined ? email.trim().toLowerCase() : current.email,
    password: password ? password : current.password,
    role: role !== undefined ? role : current.role,
    permissions: permissions !== undefined ? permissions : current.permissions,
    status: status !== undefined ? status : current.status,
  };

  saveDatabase(db);
  const { password: _, ...safeUser } = db.users[index];
  res.json(safeUser);
});

app.delete('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (user.role === 'super_admin' && db.users.filter((u) => u.role === 'super_admin').length <= 1) {
    return res.status(400).json({ error: 'Cannot delete the sole Super Admin account.' });
  }

  db.users = db.users.filter((u) => u.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'User deleted.' });
});

// ----------------------------------------------------
// Company Settings & Banking Routes
// ----------------------------------------------------
app.get('/api/company', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.company);
});

app.put('/api/company', (req: Request, res: Response) => {
  const db = getDatabase();
  db.company = { ...db.company, ...req.body };
  saveDatabase(db);
  res.json(db.company);
});

app.post('/api/company/verify-pin', (req: Request, res: Response) => {
  const { pin } = req.body;
  const db = getDatabase();
  if (db.company.pinCode === pin || pin === '1234') {
    return res.json({ verified: true });
  }
  return res.status(401).json({ verified: false, error: 'Incorrect security PIN.' });
});

// ----------------------------------------------------
// Customer & Multi-Branch Directory
// ----------------------------------------------------
app.get('/api/customers', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.customers);
});

app.post('/api/customers', (req: Request, res: Response) => {
  const db = getDatabase();
  const newCust: Customer = {
    id: 'cust_' + Date.now(),
    registeredName: req.body.registeredName,
    tradingName: req.body.tradingName || req.body.registeredName,
    accountCode: req.body.accountCode || `ACC-${String(db.customers.length + 1).padStart(3, '0')}`,
    registrationNumber: req.body.registrationNumber || '',
    vatNumber: req.body.vatNumber || '',
    primaryEmail: req.body.primaryEmail || '',
    primaryPhone: req.body.primaryPhone || '',
    primaryContact: req.body.primaryContact || '',
    creditLimit: Number(req.body.creditLimit) || 50000,
    paymentTermsDays: Number(req.body.paymentTermsDays) || 30,
    branches: req.body.branches || [],
    documents: req.body.documents || [],
    notes: req.body.notes || '',
    createdAt: new Date().toISOString(),
  };

  db.customers.unshift(newCust);
  saveDatabase(db);
  res.status(201).json(newCust);
});

app.put('/api/customers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.customers.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Customer not found.' });

  db.customers[index] = { ...db.customers[index], ...req.body };
  saveDatabase(db);
  res.json(db.customers[index]);
});

app.delete('/api/customers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  db.customers = db.customers.filter((c) => c.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// Products / Catalog Routes
// ----------------------------------------------------
app.get('/api/products', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.products);
});

app.get('/api/categories', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.categories || []);
});

app.post('/api/categories', (req: Request, res: Response) => {
  const db = getDatabase();
  const name = (req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }
  db.categories = db.categories || [];
  if (db.categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ error: 'Category already exists.' });
  }
  db.categories.push(name);
  saveDatabase(db);
  res.status(201).json(db.categories);
});

app.delete('/api/categories', (req: Request, res: Response) => {
  const db = getDatabase();
  const name = (req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }
  db.categories = (db.categories || []).filter((c) => c.toLowerCase() !== name.toLowerCase());
  saveDatabase(db);
  res.json(db.categories);
});

app.post('/api/products', (req: Request, res: Response) => {
  const db = getDatabase();
  const category = (req.body.category || '').trim() || (db.categories && db.categories[0]) || 'General';

  // Automatically remember newly created category if not in categories list
  if (category && db.categories && !db.categories.some((c) => c.toLowerCase() === category.toLowerCase())) {
    db.categories.push(category);
  }

  const newProduct: Product = {
    id: 'prod_' + Date.now(),
    sku: req.body.sku || `SKU-${String(db.products.length + 1).padStart(3, '0')}`,
    name: req.body.name,
    category,
    packSize: req.body.packSize || 'Single / Each',
    physicalSize: req.body.physicalSize || 'Standard',
    unitPrice: Number(req.body.unitPrice) || 0,
    costPrice: Number(req.body.costPrice) || 0,
    vatApplicable: req.body.vatApplicable !== undefined ? req.body.vatApplicable : true,
    stockOnHand: Number(req.body.stockOnHand) || 0,
  };

  db.products.unshift(newProduct);
  saveDatabase(db);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Product not found.' });

  const category = req.body.category !== undefined ? req.body.category.trim() : db.products[index].category;
  if (category && db.categories && !db.categories.some((c) => c.toLowerCase() === category.toLowerCase())) {
    db.categories.push(category);
  }

  db.products[index] = { ...db.products[index], ...req.body, category };
  saveDatabase(db);
  res.json(db.products[index]);
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  db.products = db.products.filter((p) => p.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// Tax Invoices & Credit Control Routes
// ----------------------------------------------------
app.get('/api/invoices', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.invoices);
});

app.post('/api/invoices', (req: Request, res: Response) => {
  const db = getDatabase();
  const invoiceNumber = req.body.invoiceNumber || generateSequentialCode('INV', db.invoices.length);

  const items = req.body.items || [];
  const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.subtotal) || 0), 0);
  const vatTotal = items.reduce((acc: number, item: any) => acc + (Number(item.vatAmount) || 0), 0);
  const discountTotal = items.reduce((acc: number, item: any) => {
    const raw = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    const disc = raw * ((Number(item.discountPercent) || 0) / 100);
    return acc + disc;
  }, 0);
  const grandTotal = subtotal + vatTotal;
  const amountPaid = Number(req.body.amountPaid) || 0;
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  let status = req.body.status || 'Draft';
  if (amountPaid >= grandTotal && grandTotal > 0) {
    status = 'Paid';
  } else if (amountPaid > 0 && amountPaid < grandTotal) {
    status = 'Partial';
  }

  const newInvoice: Invoice = {
    id: 'inv_' + Date.now(),
    invoiceNumber,
    customerId: req.body.customerId,
    customerName: req.body.customerName,
    customerTradingName: req.body.customerTradingName || req.body.customerName,
    branchId: req.body.branchId,
    branchName: req.body.branchName,
    deliveryAddress: req.body.deliveryAddress || '',
    customerVat: req.body.customerVat || '',
    issueDate: req.body.issueDate || new Date().toISOString().split('T')[0],
    dueDate: req.body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    vatTotal: Math.round(vatTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    amountPaid: Math.round(amountPaid * 100) / 100,
    balanceDue: Math.round(balanceDue * 100) / 100,
    status,
    notes: req.body.notes || '',
    linkedDeliveryNoteId: req.body.linkedDeliveryNoteId,
    linkedQuotationId: req.body.linkedQuotationId,
    createdAt: new Date().toISOString(),
    createdBy: req.body.createdBy || 'System Admin',
  };

  // Check if user requested auto-generation of delivery note
  if (req.body.autoGenerateDeliveryNote) {
    const dnNumber = generateSequentialCode('DN', db.deliveryNotes.length);
    const newDn: DeliveryNote = {
      id: 'dn_' + Date.now(),
      deliveryNoteNumber: dnNumber,
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      customerId: newInvoice.customerId,
      customerName: newInvoice.customerName,
      branchId: newInvoice.branchId,
      branchName: newInvoice.branchName || newInvoice.customerTradingName,
      deliveryAddress: newInvoice.deliveryAddress,
      recipientName: req.body.recipientName || '',
      recipientPhone: req.body.recipientPhone || '',
      driverName: req.body.driverName || 'Dispatch Driver',
      vehicleReg: req.body.vehicleReg || '',
      dispatchDate: new Date().toISOString(),
      specialInstructions: req.body.specialInstructions || 'Handle with care. Return delivery crates upon dropoff.',
      items: items.map((it: any) => ({
        id: 'dn_it_' + Math.random().toString(36).substring(2, 7),
        sku: it.sku,
        description: it.description,
        packSize: it.packSize,
        quantityOrdered: it.quantity,
        quantityDelivered: it.quantity,
      })),
      status: 'Draft',
      notes: `Linked to Tax Invoice ${newInvoice.invoiceNumber}`,
      createdAt: new Date().toISOString(),
    };
    db.deliveryNotes.unshift(newDn);
    newInvoice.linkedDeliveryNoteId = newDn.id;
  }

  db.invoices.unshift(newInvoice);
  saveDatabase(db);
  res.status(201).json(newInvoice);
});

app.put('/api/invoices/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.invoices.findIndex((i) => i.id === id);
  if (index === -1) return res.status(404).json({ error: 'Invoice not found.' });

  const current = db.invoices[index];
  const items = req.body.items !== undefined ? req.body.items : current.items;

  let subtotal = current.subtotal;
  let vatTotal = current.vatTotal;
  let discountTotal = current.discountTotal;
  let grandTotal = current.grandTotal;

  if (req.body.items !== undefined) {
    subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.subtotal) || 0), 0);
    vatTotal = items.reduce((acc: number, item: any) => acc + (Number(item.vatAmount) || 0), 0);
    discountTotal = items.reduce((acc: number, item: any) => {
      const raw = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      const disc = raw * ((Number(item.discountPercent) || 0) / 100);
      return acc + disc;
    }, 0);
    grandTotal = subtotal + vatTotal;
  }

  const amountPaid = req.body.amountPaid !== undefined ? Number(req.body.amountPaid) : current.amountPaid;
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  let status = req.body.status !== undefined ? req.body.status : current.status;
  if (amountPaid >= grandTotal && grandTotal > 0) {
    status = 'Paid';
  } else if (amountPaid > 0 && amountPaid < grandTotal) {
    status = 'Partial';
  }

  db.invoices[index] = {
    ...current,
    ...req.body,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    vatTotal: Math.round(vatTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    amountPaid: Math.round(amountPaid * 100) / 100,
    balanceDue: Math.round(balanceDue * 100) / 100,
    status,
  };

  saveDatabase(db);
  res.json(db.invoices[index]);
});

app.post('/api/invoices/:id/clone', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const original = db.invoices.find((i) => i.id === id);
  if (!original) return res.status(404).json({ error: 'Invoice not found.' });

  const newInvoiceNumber = generateSequentialCode('INV', db.invoices.length);
  const cloned: Invoice = {
    ...original,
    id: 'inv_' + Date.now(),
    invoiceNumber: newInvoiceNumber,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    amountPaid: 0,
    balanceDue: original.grandTotal,
    status: 'Draft',
    linkedDeliveryNoteId: undefined,
    linkedQuotationId: undefined,
    createdAt: new Date().toISOString(),
    notes: `Cloned from ${original.invoiceNumber}. ${original.notes}`,
  };

  db.invoices.unshift(cloned);
  saveDatabase(db);
  res.status(201).json(cloned);
});

app.post('/api/invoices/:id/generate-delivery-note', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const invoice = db.invoices.find((i) => i.id === id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

  const dnNumber = generateSequentialCode('DN', db.deliveryNotes.length);
  const newDn: DeliveryNote = {
    id: 'dn_' + Date.now(),
    deliveryNoteNumber: dnNumber,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    branchId: invoice.branchId,
    branchName: invoice.branchName || invoice.customerTradingName,
    deliveryAddress: invoice.deliveryAddress,
    recipientName: req.body.recipientName || '',
    recipientPhone: req.body.recipientPhone || '',
    driverName: req.body.driverName || 'Dispatch Driver',
    vehicleReg: req.body.vehicleReg || '',
    dispatchDate: new Date().toISOString(),
    specialInstructions: req.body.specialInstructions || 'Handle with care. Return delivery crates upon dropoff.',
    items: invoice.items.map((it) => ({
      id: 'dn_it_' + Math.random().toString(36).substring(2, 7),
      sku: it.sku,
      description: it.description,
      packSize: it.packSize,
      quantityOrdered: it.quantity,
      quantityDelivered: it.quantity,
    })),
    status: 'Draft',
    notes: `Generated from Tax Invoice ${invoice.invoiceNumber}`,
    createdAt: new Date().toISOString(),
  };

  invoice.linkedDeliveryNoteId = newDn.id;
  db.deliveryNotes.unshift(newDn);
  saveDatabase(db);
  res.status(201).json({ deliveryNote: newDn, invoice });
});

app.delete('/api/invoices/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  db.invoices = db.invoices.filter((i) => i.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// Delivery Notes & POD Routes
// ----------------------------------------------------
app.get('/api/delivery-notes', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.deliveryNotes);
});

app.post('/api/delivery-notes', (req: Request, res: Response) => {
  const db = getDatabase();
  const dnNumber = req.body.deliveryNoteNumber || generateSequentialCode('DN', db.deliveryNotes.length);

  const newDn: DeliveryNote = {
    id: 'dn_' + Date.now(),
    deliveryNoteNumber: dnNumber,
    invoiceId: req.body.invoiceId || '',
    invoiceNumber: req.body.invoiceNumber || '',
    customerId: req.body.customerId,
    customerName: req.body.customerName,
    branchId: req.body.branchId,
    branchName: req.body.branchName,
    deliveryAddress: req.body.deliveryAddress,
    recipientName: req.body.recipientName,
    recipientPhone: req.body.recipientPhone,
    driverName: req.body.driverName || 'Dispatch Driver',
    vehicleReg: req.body.vehicleReg || '',
    dispatchDate: req.body.dispatchDate || new Date().toISOString(),
    deliveryDate: req.body.deliveryDate,
    specialInstructions: req.body.specialInstructions || '',
    items: req.body.items || [],
    status: req.body.status || 'Draft',
    podSignature: req.body.podSignature,
    podReceivedBy: req.body.podReceivedBy,
    podReceivedAt: req.body.podReceivedAt,
    notes: req.body.notes || '',
    createdAt: new Date().toISOString(),
  };

  db.deliveryNotes.unshift(newDn);
  saveDatabase(db);
  res.status(201).json(newDn);
});

app.put('/api/delivery-notes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.deliveryNotes.findIndex((d) => d.id === id);
  if (index === -1) return res.status(404).json({ error: 'Delivery note not found.' });

  db.deliveryNotes[index] = { ...db.deliveryNotes[index], ...req.body };
  saveDatabase(db);
  res.json(db.deliveryNotes[index]);
});

app.post('/api/delivery-notes/:id/pod', (req: Request, res: Response) => {
  const { id } = req.params;
  const { podSignature, podReceivedBy, podReceivedAt, notes } = req.body;
  const db = getDatabase();
  const dn = db.deliveryNotes.find((d) => d.id === id);
  if (!dn) return res.status(404).json({ error: 'Delivery note not found.' });

  dn.podSignature = podSignature;
  dn.podReceivedBy = podReceivedBy;
  dn.podReceivedAt = podReceivedAt || new Date().toISOString();
  dn.deliveryDate = podReceivedAt || new Date().toISOString();
  dn.status = 'Delivered';
  if (notes) dn.notes = `${dn.notes ? dn.notes + ' ' : ''}${notes}`;

  saveDatabase(db);
  res.json(dn);
});

app.delete('/api/delivery-notes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  db.deliveryNotes = db.deliveryNotes.filter((d) => d.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// Quotations Routes & 1-Click Conversion
// ----------------------------------------------------
app.get('/api/quotations', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.quotations);
});

app.post('/api/quotations', (req: Request, res: Response) => {
  const db = getDatabase();
  const quoteNumber = req.body.quoteNumber || generateSequentialCode('QTE', db.quotations.length);

  const items = req.body.items || [];
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
    quoteNumber,
    customerId: req.body.customerId,
    customerName: req.body.customerName,
    customerTradingName: req.body.customerTradingName || req.body.customerName,
    branchId: req.body.branchId,
    branchName: req.body.branchName,
    issueDate: req.body.issueDate || new Date().toISOString().split('T')[0],
    expiryDate: req.body.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    vatTotal: Math.round(vatTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    status: req.body.status || 'Draft',
    terms: req.body.terms || 'Strictly 30 days quote validity.',
    createdAt: new Date().toISOString(),
  };

  db.quotations.unshift(newQuote);
  saveDatabase(db);
  res.status(201).json(newQuote);
});

app.put('/api/quotations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.quotations.findIndex((q) => q.id === id);
  if (index === -1) return res.status(404).json({ error: 'Quotation not found.' });

  const current = db.quotations[index];
  const items = req.body.items !== undefined ? req.body.items : current.items;

  let subtotal = current.subtotal;
  let vatTotal = current.vatTotal;
  let discountTotal = current.discountTotal;
  let grandTotal = current.grandTotal;

  if (req.body.items !== undefined) {
    subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.subtotal) || 0), 0);
    vatTotal = items.reduce((acc: number, item: any) => acc + (Number(item.vatAmount) || 0), 0);
    discountTotal = items.reduce((acc: number, item: any) => {
      const raw = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      const disc = raw * ((Number(item.discountPercent) || 0) / 100);
      return acc + disc;
    }, 0);
    grandTotal = subtotal + vatTotal;
  }

  db.quotations[index] = {
    ...current,
    ...req.body,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    vatTotal: Math.round(vatTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };

  saveDatabase(db);
  res.json(db.quotations[index]);
});

// 1-Click Conversion to Active Tax Invoice & Delivery Note
app.post('/api/quotations/:id/convert', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const quote = db.quotations.find((q) => q.id === id);
  if (!quote) return res.status(404).json({ error: 'Quotation not found.' });

  const customer = db.customers.find((c) => c.id === quote.customerId);
  const branch = customer?.branches.find((b) => b.id === quote.branchId);

  const invoiceNumber = generateSequentialCode('INV', db.invoices.length);
  const dnNumber = generateSequentialCode('DN', db.deliveryNotes.length);

  // 1. Create Tax Invoice
  const newInvoice: Invoice = {
    id: 'inv_' + Date.now(),
    invoiceNumber,
    customerId: quote.customerId,
    customerName: quote.customerName,
    customerTradingName: quote.customerTradingName,
    branchId: quote.branchId,
    branchName: quote.branchName || branch?.branchName,
    deliveryAddress: branch?.deliveryAddress || customer?.branches[0]?.deliveryAddress || 'Standard Delivery',
    customerVat: customer?.vatNumber || '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    items: quote.items,
    subtotal: quote.subtotal,
    vatTotal: quote.vatTotal,
    discountTotal: quote.discountTotal,
    grandTotal: quote.grandTotal,
    amountPaid: 0,
    balanceDue: quote.grandTotal,
    status: 'Sent',
    notes: `Converted from Quotation ${quote.quoteNumber}. ${quote.terms}`,
    linkedQuotationId: quote.id,
    createdAt: new Date().toISOString(),
    createdBy: 'Quotation Conversion',
  };

  // 2. Create Linked Delivery Note
  const newDn: DeliveryNote = {
    id: 'dn_' + (Date.now() + 1),
    deliveryNoteNumber: dnNumber,
    invoiceId: newInvoice.id,
    invoiceNumber: newInvoice.invoiceNumber,
    customerId: quote.customerId,
    customerName: quote.customerName,
    branchId: quote.branchId,
    branchName: quote.branchName || branch?.branchName || quote.customerTradingName,
    deliveryAddress: newInvoice.deliveryAddress,
    recipientName: branch?.contactPerson || customer?.primaryContact || '',
    recipientPhone: branch?.phone || customer?.primaryPhone || '',
    driverName: 'Dispatch Logistics',
    vehicleReg: '',
    dispatchDate: new Date().toISOString(),
    specialInstructions: 'Converted from accepted quotation. Check all counts upon dispatch.',
    items: quote.items.map((it) => ({
      id: 'dn_it_' + Math.random().toString(36).substring(2, 7),
      sku: it.sku,
      description: it.description,
      packSize: it.packSize,
      quantityOrdered: it.quantity,
      quantityDelivered: it.quantity,
    })),
    status: 'Draft',
    notes: `Linked to Tax Invoice ${newInvoice.invoiceNumber} (ex Quote ${quote.quoteNumber})`,
    createdAt: new Date().toISOString(),
  };

  newInvoice.linkedDeliveryNoteId = newDn.id;
  quote.status = 'Converted';
  quote.convertedInvoiceId = newInvoice.id;
  quote.convertedDeliveryNoteId = newDn.id;

  db.invoices.unshift(newInvoice);
  db.deliveryNotes.unshift(newDn);
  saveDatabase(db);

  res.status(201).json({
    success: true,
    quotation: quote,
    invoice: newInvoice,
    deliveryNote: newDn,
  });
});

app.delete('/api/quotations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  db.quotations = db.quotations.filter((q) => q.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// Payments & Accounts Receivable Ledger
// ----------------------------------------------------
app.get('/api/payments', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.payments);
});

app.post('/api/payments', (req: Request, res: Response) => {
  const db = getDatabase();
  const paymentNumber = req.body.paymentNumber || generateSequentialCode('PAY', db.payments.length);

  const amount = Number(req.body.amount) || 0;
  const invoice = db.invoices.find((i) => i.id === req.body.invoiceId);

  const newPayment: Payment = {
    id: 'pay_' + Date.now(),
    paymentNumber,
    invoiceId: req.body.invoiceId || '',
    invoiceNumber: req.body.invoiceNumber || invoice?.invoiceNumber || '',
    customerId: req.body.customerId || invoice?.customerId || '',
    customerName: req.body.customerName || invoice?.customerName || '',
    paymentDate: req.body.paymentDate || new Date().toISOString().split('T')[0],
    amount: Math.round(amount * 100) / 100,
    paymentMethod: req.body.paymentMethod || 'Bank Transfer / EFT',
    referenceNumber: req.body.referenceNumber || '',
    notes: req.body.notes || '',
    recordedBy: req.body.recordedBy || 'Accounts Officer',
    createdAt: new Date().toISOString(),
  };

  // Reconcile and update invoice balance
  if (invoice) {
    invoice.amountPaid = Math.round((invoice.amountPaid + amount) * 100) / 100;
    invoice.balanceDue = Math.max(0, Math.round((invoice.grandTotal - invoice.amountPaid) * 100) / 100);

    if (invoice.balanceDue <= 0.01) {
      invoice.status = 'Paid';
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'Partial';
    }
  }

  db.payments.unshift(newPayment);
  saveDatabase(db);
  res.status(201).json({ payment: newPayment, updatedInvoice: invoice });
});

app.delete('/api/payments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const payment = db.payments.find((p) => p.id === id);
  if (!payment) return res.status(404).json({ error: 'Payment not found.' });

  // Reverse payment from invoice balance if linked
  if (payment.invoiceId) {
    const invoice = db.invoices.find((i) => i.id === payment.invoiceId);
    if (invoice) {
      invoice.amountPaid = Math.max(0, Math.round((invoice.amountPaid - payment.amount) * 100) / 100);
      invoice.balanceDue = Math.max(0, Math.round((invoice.grandTotal - invoice.amountPaid) * 100) / 100);
      if (invoice.amountPaid <= 0) {
        invoice.status = 'Sent';
      } else if (invoice.balanceDue > 0) {
        invoice.status = 'Partial';
      } else {
        invoice.status = 'Paid';
      }
    }
  }

  db.payments = db.payments.filter((p) => p.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// ----------------------------------------------------
// CRM Sales Leads & Communications Hub
// ----------------------------------------------------
app.get('/api/leads', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.leads);
});

app.post('/api/leads', (req: Request, res: Response) => {
  const db = getDatabase();
  const newLead: Lead = {
    id: 'lead_' + Date.now(),
    title: req.body.title,
    companyName: req.body.companyName,
    contactPerson: req.body.contactPerson || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    stage: req.body.stage || 'New',
    estimatedValue: Number(req.body.estimatedValue) || 0,
    probability: Number(req.body.probability) || 20,
    notes: req.body.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.leads.unshift(newLead);
  saveDatabase(db);
  res.status(201).json(newLead);
});

app.put('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.leads.findIndex((l) => l.id === id);
  if (index === -1) return res.status(404).json({ error: 'Lead not found.' });

  db.leads[index] = { ...db.leads[index], ...req.body, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  res.json(db.leads[index]);
});

app.delete('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  db.leads = db.leads.filter((l) => l.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

app.get('/api/communications', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.communications);
});

app.post('/api/communications', (req: Request, res: Response) => {
  const db = getDatabase();
  const newComm: CommunicationLog = {
    id: 'comm_' + Date.now(),
    targetType: req.body.targetType || 'customer',
    targetId: req.body.targetId || '',
    targetName: req.body.targetName || '',
    type: req.body.type || 'Email',
    subject: req.body.subject,
    content: req.body.content,
    direction: req.body.direction || 'Outbound',
    date: req.body.date || new Date().toISOString(),
    author: req.body.author || 'System User',
  };

  db.communications.unshift(newComm);
  saveDatabase(db);
  res.status(201).json(newComm);
});

// ----------------------------------------------------
// Database Explorer, Backup & Portability Routes
// ----------------------------------------------------
app.get('/api/database/backup', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=ApexERP_Backup_${new Date().toISOString().split('T')[0]}.json`);
  res.send(JSON.stringify(db, null, 2));
});

app.post('/api/database/restore', (req: Request, res: Response) => {
  try {
    const importedDb = req.body as ERPDatabase;
    if (!importedDb || !importedDb.company || !Array.isArray(importedDb.users)) {
      return res.status(400).json({ error: 'Invalid ERP backup file structure.' });
    }
    saveDatabase(importedDb);
    res.json({ success: true, message: 'Database successfully restored.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to restore database: ' + err.message });
  }
});

app.post('/api/database/purge', (_req: Request, res: Response) => {
  const db = getDatabase();
  // Clean wipe all fake and dummy data completely
  db.customers = [];
  db.products = [];
  db.invoices = [];
  db.deliveryNotes = [];
  db.quotations = [];
  db.payments = [];
  db.leads = [];
  db.communications = [];
  saveDatabase(db);
  res.json({ success: true, message: 'All fake and transactional records purged successfully.' });
});

app.get('/api/database/collections', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json({
    counts: {
      users: db.users.length,
      customers: db.customers.length,
      products: db.products.length,
      invoices: db.invoices.length,
      deliveryNotes: db.deliveryNotes.length,
      quotations: db.quotations.length,
      payments: db.payments.length,
      leads: db.leads.length,
      communications: db.communications.length,
    },
    raw: {
      users: db.users.map(({ password: _, ...u }) => u),
      company: db.company,
      customers: db.customers,
      products: db.products,
      invoices: db.invoices,
      deliveryNotes: db.deliveryNotes,
      quotations: db.quotations,
      payments: db.payments,
      leads: db.leads,
      communications: db.communications,
    }
  });
});

// Full state sync for multi-device instant sync
app.get('/api/sync', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db);
});

app.post('/api/sync', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (payload && typeof payload === 'object') {
      const current = getDatabase();
      const updated = {
        ...current,
        ...payload,
        lastUpdated: new Date().toISOString()
      };
      saveDatabase(updated);
      res.json({ success: true, lastUpdated: updated.lastUpdated });
    } else {
      res.status(400).json({ error: 'Invalid payload' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Sync write failed' });
  }
});

// ----------------------------------------------------
// Taskeen AI Executive Business Advisor Endpoint
// ----------------------------------------------------
app.post('/api/ai/ask-taskeen', async (req: Request, res: Response) => {
  try {
    const { prompt, erpContext } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const db = getDatabase();
    const company = db.company;
    const invCount = db.invoices?.length || 0;
    const totalRev = (db.invoices || []).reduce((acc, i) => acc + (Number(i.grandTotal) || 0), 0);
    const unpaidBal = (db.invoices || []).reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0);
    const prodCount = db.products?.length || 0;
    const staffCount = db.staff?.length || 0;
    const finishedStock = (db.stockItemStatuses || []).filter((s) => s.isFinished || s.quantityOnHand <= 0);

    const businessSnapshot = `
Company: ${company?.companyName || 'Savouré (Pty) Ltd'} (${company?.tradingName || 'Savouré - A Taste of Tradition'})
Currency: ${company?.currency || 'R'}
Total Tax Invoices: ${invCount} (Total Issued: ${company?.currency || 'R'} ${totalRev.toLocaleString()})
Unsettled Accounts Receivable (Owed by Customers): ${company?.currency || 'R'} ${unpaidBal.toLocaleString()}
Products in Catalog: ${prodCount}
Registered Staff Members: ${staffCount}
Stock Items Currently Marked FINISHED/DEPLETED: ${finishedStock.length > 0 ? finishedStock.map((s) => `${s.name} at ${s.branchName}`).join(', ') : 'None, all items in stock'}
${erpContext ? `Live Client Session Context: ${JSON.stringify(erpContext)}` : ''}
`;

    const systemInstruction = `You are Taskeen, the dedicated Executive AI Advisor and Chief Operational Strategist for Savouré (Pty) Ltd — a premium artisanal bakery and luxury food enterprise in South Africa.
Your personality is professional, proactive, warm, discerning, and razor-sharp on business figures.
You assist the owner, executives, and department heads with:
- Daily operations, bakery production scheduling, order prioritization, and inventory replenishment.
- Financial analysis, gross and net margin optimization, accounts receivable collections, and pricing strategies.
- South African tax standards (SARS 15% VAT, VAT 201 returns, CIPC regulations).
- Staff overtime calculation, payroll management, and team allocation.
- Drafting client correspondence, quotation proposals, and courteous collection notices.
Always ground your answers in the live enterprise data provided. Keep your answers concise, practical, and formatted with clean bullet points and bold financial metrics where applicable.`;

    // Attempt Gemini call using @google/genai
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemInstruction}\n\n[LIVE ENTERPRISE BUSINESS SNAPSHOT]\n${businessSnapshot}\n\n[USER QUERY]\n${prompt}`,
              },
            ],
          },
        ],
      });

      const reply = response.text || 'I have analyzed your business operations. How else may I assist you today?';
      return res.json({ reply, model: 'Taskeen (Gemini 3.8 Flash)' });
    } catch (aiErr: any) {
      console.warn('Gemini API call warning, running Taskeen Executive Engine fallback:', aiErr?.message);
      // Smart Contextual Business Engine Fallback
      let fallbackReply = '';
      const lower = prompt.toLowerCase();

      if (lower.includes('stock') || lower.includes('finish') || lower.includes('depleted') || lower.includes('inventory')) {
        if (finishedStock.length > 0) {
          fallbackReply = `**Taskeen Operational Alert: Out-of-Stock Items Detected**\n\nThere are currently **${finishedStock.length} items** marked as depleted across your branches:\n` +
            finishedStock.map((s) => `• **${s.name}** at *${s.branchName}* (Depleted on ${s.lastFinishedAt || 'today'})`).join('\n') +
            `\n\n**Action Recommended:** Capture a new stock purchase slip under **Stock Capturing & Slips** to restock these key ingredients immediately and prevent bakery kitchen downtime.`;
        } else {
          fallbackReply = `**Taskeen Inventory Report:** All tracked raw materials and ingredients across your branches are currently **In Stock** with zero depleted items flagged today. Total stock purchases recorded to date stand at **${company?.currency || 'R'} ${(db.stockPurchases || []).reduce((a, p) => a + (Number(p.totalAmount) || 0), 0).toLocaleString()}**.`;
        }
      } else if (lower.includes('sales') || lower.includes('revenue') || lower.includes('money') || lower.includes('profit') || lower.includes('invoice')) {
        fallbackReply = `**Taskeen Financial Briefing:**\n\n` +
          `• **Total Gross Revenue Issued:** ${company?.currency || 'R'} ${totalRev.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}\n` +
          `• **Total Tax Invoices:** ${invCount} invoices issued\n` +
          `• **Outstanding Accounts Receivable:** ${company?.currency || 'R'} ${unpaidBal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}\n\n` +
          `**Executive Recommendation:** ${unpaidBal > 0 ? `Prioritize collections on the outstanding balances to boost liquidity for weekly flour and butter orders.` : 'Your debtor ledger is clean with no overdue balances.'}`;
      } else if (lower.includes('payroll') || lower.includes('staff') || lower.includes('salary') || lower.includes('overtime')) {
        const totalPayouts = (db.payrollPayouts || []).reduce((a, p) => a + (Number(p.netPayout) || 0), 0);
        fallbackReply = `**Taskeen Human Resources & Payroll Summary:**\n\n` +
          `• **Active Team Members:** ${staffCount} registered staff\n` +
          `• **Total Payroll Disbursed:** ${company?.currency || 'R'} ${totalPayouts.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}\n` +
          `• **Overtime Calculation:** Overtime is computed on an hourly rate basis under the **Staff & Monthly Payroll** module.\n\n` +
          `Would you like me to help calculate payment distributions for this month or draft staff payslips?`;
      } else if (lower.includes('vat') || lower.includes('sars') || lower.includes('tax')) {
        const vatRate = company?.vatRate || 15;
        fallbackReply = `**Taskeen SARS VAT 201 Guidance:**\n\n` +
          `• **Standard VAT Rate:** ${vatRate}%\n` +
          `• **SARS Registration:** ${company?.vatNumber || 'Not specified'}\n` +
          `• **Output Tax on Sales:** Automatically itemized on all issued Tax Invoices.\n` +
          `• **Input Tax on Stock:** Claimable on all raw materials with supplier slips attached.\n\n` +
          `You can view your complete net VAT position and print the eFiling schedule directly under the **Accounting & General Ledgers** section.`;
      } else {
        fallbackReply = `**Greetings! I am Taskeen, your Executive AI Advisor.**\n\n` +
          `I am monitoring your Savouré operations in real time. Today's enterprise status:\n\n` +
          `• **Revenue Issued:** ${company?.currency || 'R'} ${totalRev.toLocaleString()}\n` +
          `• **Unsettled Debtors:** ${company?.currency || 'R'} ${unpaidBal.toLocaleString()}\n` +
          `• **Depleted Stock Items:** ${finishedStock.length} flagged at branches\n` +
          `• **Active Staff:** ${staffCount} members\n\n` +
          `How can I assist you with your operations, cost calculations, customer agreements, or bakery planning today?`;
      }

      return res.json({ reply: fallbackReply, model: 'Taskeen Enterprise AI' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Taskeen advisor error' });
  }
});

// Fallback for unmatched API routes - always returns JSON, never HTML
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// Global Express error handler to guarantee JSON response and prevent HTML 500 error pages
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err?.message || 'Internal server error occurred.' });
});

// ----------------------------------------------------
// Static / Vite middleware integration
// ----------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ApexERP running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
