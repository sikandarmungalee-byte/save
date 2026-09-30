export type UserRole = 'super_admin' | 'accountant' | 'sales' | 'logistics' | 'auditor';

export interface UserPermissions {
  manageUsers: boolean;
  invoices: boolean;
  deliveryNotes: boolean;
  quotations: boolean;
  payments: boolean;
  customers: boolean;
  catalog: boolean;
  reports: boolean;
  crmLeads: boolean;
  databaseExplorer: boolean;
  companySettings: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions: UserPermissions;
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface CompanySettings {
  companyName: string;
  tradingName: string;
  registrationNumber: string;
  vatNumber: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  vatRate: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  swiftCode: string;
  defaultPaymentTerms: string;
  pinCode: string;
  logoUrl?: string;
}

export interface CustomerBranch {
  id: string;
  branchName: string;
  deliveryAddress: string;
  contactPerson: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface CustomerDocument {
  id: string;
  name: string;
  type: 'VAT Certificate' | 'Credit Application' | 'Tax Clearance' | 'Signed SLA / Contract' | 'B-BBEE Certificate' | 'Other';
  uploadDate: string;
  fileSize: string;
  fileData?: string; // base64 or mock preview
}

export interface Customer {
  id: string;
  registeredName: string;
  tradingName: string;
  accountCode: string;
  registrationNumber: string;
  vatNumber: string;
  primaryEmail: string;
  primaryPhone: string;
  primaryContact: string;
  creditLimit: number;
  paymentTermsDays: number;
  branches: CustomerBranch[];
  documents: CustomerDocument[];
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  packSize: string; // e.g. "Pack of 6", "Pack of 12", "Single / Each", "Crate of 24"
  physicalSize: string; // e.g. "Standard 20cm", "Large 30cm", "Cocktail / Bite Size", "500g Loaf"
  unitPrice: number;
  costPrice: number;
  vatApplicable: boolean;
  stockOnHand: number;
}

export interface LineItem {
  id: string;
  productId?: string;
  sku: string;
  description: string;
  packSize: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountPercent: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Partial' | 'Paid' | 'Overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerTradingName: string;
  branchId?: string;
  branchName?: string;
  deliveryAddress: string;
  customerVat: string;
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  subtotal: number;
  vatTotal: number;
  discountTotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes: string;
  linkedDeliveryNoteId?: string;
  linkedQuotationId?: string;
  createdAt: string;
  createdBy: string;
}

export type DeliveryStatus = 'Draft' | 'In Transit' | 'Delivered';

export interface DeliveryNoteItem {
  id: string;
  sku: string;
  description: string;
  packSize: string;
  quantityOrdered: number;
  quantityDelivered: number;
}

export interface DeliveryNote {
  id: string;
  deliveryNoteNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  branchId?: string;
  branchName: string;
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  driverName: string;
  vehicleReg: string;
  dispatchDate: string;
  deliveryDate?: string;
  specialInstructions: string;
  items: DeliveryNoteItem[];
  status: DeliveryStatus;
  podSignature?: string; // Base64 data URL
  podReceivedBy?: string;
  podReceivedAt?: string;
  notes?: string;
  createdAt: string;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Converted';

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  customerTradingName: string;
  branchId?: string;
  branchName?: string;
  issueDate: string;
  expiryDate: string;
  items: LineItem[];
  subtotal: number;
  vatTotal: number;
  discountTotal: number;
  grandTotal: number;
  status: QuotationStatus;
  terms: string;
  convertedInvoiceId?: string;
  convertedDeliveryNoteId?: string;
  createdAt: string;
}

export type PaymentMethod = 'Bank Transfer / EFT' | 'Cash' | 'Credit/Debit Card' | 'Cheque';

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes: string;
  recordedBy: string;
  createdAt: string;
}

export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  title: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  stage: LeadStage;
  estimatedValue: number;
  probability: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationLog {
  id: string;
  targetType: 'customer' | 'lead';
  targetId: string;
  targetName: string;
  type: 'Email' | 'Phone Call' | 'Meeting' | 'Document Dispatch';
  subject: string;
  content: string;
  direction: 'Inbound' | 'Outbound';
  date: string;
  author: string;
}

export interface ERPDatabase {
  users: User[];
  company: CompanySettings;
  customers: Customer[];
  products: Product[];
  categories?: string[];
  invoices: Invoice[];
  deliveryNotes: DeliveryNote[];
  quotations: Quotation[];
  payments: Payment[];
  leads: Lead[];
  communications: CommunicationLog[];
  lastUpdated: string;
}
