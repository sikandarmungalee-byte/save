import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Truck,
  FileSpreadsheet,
  Receipt,
  Users2,
  Package,
  ShoppingBag,
  Wallet,
  Landmark,
  BarChart3,
  Flame,
  ShieldCheck,
  Store,
  Database,
  Building2,
  Plus,
  Tag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Printer,
  Calendar,
  Layers,
  FileCheck,
  Users,
  Briefcase,
  TrendingUp,
  Scale,
  Calculator,
  Percent,
  BookOpen,
  DollarSign,
  QrCode,
  Box,
  Key,
  HardDrive,
  Download,
  Upload,
  UserPlus,
  Shield,
  Search,
  MessageSquare,
  Send,
  Phone,
  FileBox,
  HelpCircle
} from 'lucide-react';
import {
  Invoice,
  DeliveryNote,
  Quotation,
  Payment,
  Customer,
  Product,
  StockPurchase,
  StockItemStatus,
  StaffMember,
  PayrollPayout,
  Lead,
  User,
  CompanySettings
} from '../../types/erp';

export interface ERPContextState {
  invoices: Invoice[];
  deliveryNotes: DeliveryNote[];
  quotations: Quotation[];
  payments: Payment[];
  customers: Customer[];
  products: Product[];
  categories: string[];
  stockPurchases: StockPurchase[];
  stockItemStatuses: StockItemStatus[];
  staff: StaffMember[];
  payrollPayouts: PayrollPayout[];
  leads: Lead[];
  users: User[];
  company: CompanySettings;
}

export interface ModuleSubcategory {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: (erp: ERPContextState) => string | undefined;
  actionType: 'filter' | 'tab' | 'modal' | 'view';
  targetConfig?: Record<string, any>;
}

export interface ERPModule {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: (erp: ERPContextState) => string | undefined;
  subcategories: ModuleSubcategory[];
}

export const ERP_MODULES: ERPModule[] = [
  // 1. Financial Overview
  {
    id: 'dashboard',
    number: 1,
    title: 'Financial Overview',
    shortTitle: 'Overview',
    subtitle: 'Executive KPIs & Performance',
    description: 'High-level executive financial metrics, revenue, cash collected, and operational KPIs.',
    icon: LayoutDashboard,
    subcategories: [
      {
        id: 'kpi-summary',
        title: 'Executive Summary & KPIs',
        subtitle: 'Key financial performance indicators and health',
        icon: TrendingUp,
        actionType: 'view',
        targetConfig: { view: 'kpi' }
      },
      {
        id: 'revenue-billings',
        title: 'Revenue & Gross Billings',
        subtitle: 'Total commercial invoices billed to date',
        icon: DollarSign,
        actionType: 'view',
        badge: (erp) => `R${erp.invoices.reduce((a, b) => a + b.grandTotal, 0).toLocaleString('en-ZA')}`,
        targetConfig: { view: 'billings' }
      },
      {
        id: 'cash-collected',
        title: 'Cash Collected & Receipts',
        subtitle: 'Reconciled customer payments and EFT receipts',
        icon: CheckCircle2,
        actionType: 'view',
        badge: (erp) => `R${erp.invoices.reduce((a, b) => a + b.amountPaid, 0).toLocaleString('en-ZA')}`,
        targetConfig: { view: 'collections' }
      },
      {
        id: 'accounts-receivable-due',
        title: 'Outstanding Receivables',
        subtitle: 'Customer invoice balances currently due',
        icon: Clock,
        actionType: 'view',
        badge: (erp) => {
          const due = erp.invoices.reduce((a, b) => a + b.balanceDue, 0);
          return due > 0 ? `R${due.toLocaleString('en-ZA')} due` : undefined;
        },
        targetConfig: { view: 'due' }
      },
      {
        id: 'in-transit-deliveries',
        title: 'In-Transit Logistics',
        subtitle: 'Active dispatches out for delivery',
        icon: Truck,
        actionType: 'view',
        badge: (erp) => {
          const c = erp.deliveryNotes.filter((d) => d.status === 'In Transit').length;
          return c > 0 ? `${c} transit` : undefined;
        },
        targetConfig: { view: 'transit' }
      },
      {
        id: 'pending-quotations',
        title: 'Pending Quotations',
        subtitle: 'Open commercial quotes awaiting customer acceptance',
        icon: FileSpreadsheet,
        actionType: 'view',
        badge: (erp) => {
          const c = erp.quotations.filter((q) => q.status === 'Sent' || q.status === 'Accepted').length;
          return c > 0 ? `${c} active` : undefined;
        },
        targetConfig: { view: 'quotes' }
      }
    ]
  },

  // 2. Tax Invoices & Credit Notes
  {
    id: 'invoices',
    number: 2,
    title: 'Tax Invoices & Credit Notes',
    shortTitle: 'Tax Invoices',
    subtitle: 'SARS Billing & Credit Control',
    description: 'Issue South African tax invoices, record customer payments, and manage credit notes.',
    icon: FileText,
    badge: (erp) => {
      const overdue = erp.invoices.filter((i) => i.status === 'Overdue').length;
      if (overdue > 0) return `${overdue} overdue`;
      const unpaid = erp.invoices.filter((i) => i.balanceDue > 0).length;
      return unpaid > 0 ? `${unpaid} due` : undefined;
    },
    subcategories: [
      {
        id: 'create-tax-invoice',
        title: 'Create Tax Invoice',
        subtitle: 'Issue a new compliant commercial tax invoice',
        icon: Plus,
        actionType: 'modal',
        targetConfig: { initialOpenCreate: true }
      },
      {
        id: 'all-invoices',
        title: 'All Invoices',
        subtitle: 'Complete repository of issued invoices',
        icon: FileText,
        actionType: 'filter',
        badge: (erp) => `${erp.invoices.length} total`,
        targetConfig: { initialStatusFilter: 'ALL' }
      },
      {
        id: 'draft-invoices',
        title: 'Draft Invoices',
        subtitle: 'Unfinalised invoices saved in draft',
        icon: Clock,
        actionType: 'filter',
        badge: (erp) => {
          const c = erp.invoices.filter((i) => i.status === 'Draft').length;
          return c > 0 ? `${c}` : undefined;
        },
        targetConfig: { initialStatusFilter: 'Draft' }
      },
      {
        id: 'paid-invoices',
        title: 'Paid Invoices',
        subtitle: 'Fully settled commercial tax invoices',
        icon: CheckCircle2,
        actionType: 'filter',
        badge: (erp) => {
          const c = erp.invoices.filter((i) => i.status === 'Paid').length;
          return c > 0 ? `${c} paid` : undefined;
        },
        targetConfig: { initialStatusFilter: 'Paid' }
      },
      {
        id: 'unpaid-invoices',
        title: 'Unpaid Invoices',
        subtitle: 'Awaiting payment or partially settled',
        icon: AlertTriangle,
        actionType: 'filter',
        badge: (erp) => {
          const c = erp.invoices.filter((i) => i.status === 'Sent' || i.status === 'Partial').length;
          return c > 0 ? `${c} unpaid` : undefined;
        },
        targetConfig: { initialStatusFilter: 'Sent' }
      },
      {
        id: 'overdue-invoices',
        title: 'Overdue Invoices',
        subtitle: 'Exceeded credit terms and due dates',
        icon: Clock,
        actionType: 'filter',
        badge: (erp) => {
          const c = erp.invoices.filter((i) => i.status === 'Overdue').length;
          return c > 0 ? `${c} overdue` : undefined;
        },
        targetConfig: { initialStatusFilter: 'Overdue' }
      },
      {
        id: 'credit-notes',
        title: 'Credit Notes',
        subtitle: 'Customer returns, discounts & adjustments',
        icon: FileCheck,
        actionType: 'filter',
        targetConfig: { initialTab: 'credit-notes' }
      },
      {
        id: 'customer-statements',
        title: 'Customer Statements',
        subtitle: 'Monthly statements of accounts & balances',
        icon: Receipt,
        actionType: 'tab',
        targetConfig: { initialTab: 'statements' }
      },
      {
        id: 'invoice-templates',
        title: 'Invoice Templates',
        subtitle: 'Branded layout, print & PDF templates',
        icon: Sparkles,
        actionType: 'tab',
        targetConfig: { initialTab: 'templates' }
      }
    ]
  },

  // 3. Luxury Invoice Studio
  {
    id: 'invoice-studio',
    number: 3,
    title: 'Luxury Invoice Studio',
    shortTitle: 'Invoice Studio',
    subtitle: 'Branded Layout & Design',
    description: 'High-end artisan document studio for luxury invoice templates and visual typography.',
    icon: Sparkles,
    subcategories: [
      {
        id: 'studio-invoices',
        title: 'Studio Invoices Canvas',
        subtitle: 'View and preview high-end luxury invoices',
        icon: FileText,
        actionType: 'tab',
        targetConfig: { initialTab: 'list' }
      },
      {
        id: 'create-luxury-invoice',
        title: 'Create Luxury Invoice',
        subtitle: 'Design bespoke invoice with live preview',
        icon: Plus,
        actionType: 'tab',
        targetConfig: { initialTab: 'create' }
      },
      {
        id: 'luxury-branding-settings',
        title: 'Brand Crest & Settings',
        subtitle: 'Configure company crest, layout & banking',
        icon: Building2,
        actionType: 'tab',
        targetConfig: { initialTab: 'settings' }
      },
      {
        id: 'document-typography',
        title: 'Document Typography',
        subtitle: 'Artisan serif styling & copper accents',
        icon: Sparkles,
        actionType: 'tab',
        targetConfig: { initialTab: 'settings' }
      },
      {
        id: 'pdf-export-studio',
        title: 'PDF & Print Export',
        subtitle: 'High-resolution PDF generation ready for clients',
        icon: Printer,
        actionType: 'tab',
        targetConfig: { initialTab: 'list' }
      }
    ]
  },

  // 4. Delivery Notes & Proof of Delivery
  {
    id: 'delivery-notes',
    number: 4,
    title: 'Delivery Notes & Proof of Delivery',
    shortTitle: 'Delivery & POD',
    subtitle: 'Dispatch & Digital Signatures',
    description: 'Manage delivery notes, dispatch schedules, and capture touch-screen POD signatures.',
    icon: Truck,
    badge: (erp) => {
      const inTransit = erp.deliveryNotes.filter((d) => d.status === 'In Transit').length;
      return inTransit > 0 ? `${inTransit} transit` : undefined;
    },
    subcategories: [
      {
        id: 'all-delivery-notes',
        title: 'All Delivery Notes',
        subtitle: 'Complete archive of dispatch records',
        icon: Truck,
        actionType: 'filter',
        badge: (erp) => `${erp.deliveryNotes.length}`,
        targetConfig: { initialStatusFilter: 'ALL' }
      },
      {
        id: 'in-transit-deliveries',
        title: 'In Transit Deliveries',
        subtitle: 'Vehicles currently out on delivery routes',
        icon: Truck,
        actionType: 'filter',
        badge: (erp) => {
          const c = erp.deliveryNotes.filter((d) => d.status === 'In Transit').length;
          return c > 0 ? `${c} active` : undefined;
        },
        targetConfig: { initialStatusFilter: 'In Transit' }
      },
      {
        id: 'delivered-pods',
        title: 'Delivered & POD Signed',
        subtitle: 'Completed deliveries with customer sign-off',
        icon: CheckCircle2,
        actionType: 'filter',
        badge: (erp) => {
          const c = erp.deliveryNotes.filter((d) => d.status === 'Delivered').length;
          return c > 0 ? `${c} signed` : undefined;
        },
        targetConfig: { initialStatusFilter: 'Delivered' }
      },
      {
        id: 'pending-dispatch',
        title: 'Pending Dispatch',
        subtitle: 'Orders packaged awaiting driver collection',
        icon: Clock,
        actionType: 'filter',
        targetConfig: { initialStatusFilter: 'Pending' }
      },
      {
        id: 'capture-digital-pod',
        title: 'Capture Digital POD',
        subtitle: 'Touchscreen signature capture for received goods',
        icon: FileCheck,
        actionType: 'modal',
        targetConfig: { initialAction: 'capture-pod' }
      },
      {
        id: 'print-delivery-slips',
        title: 'Print Delivery Slips',
        subtitle: 'Print physical driver slips with branch addresses',
        icon: Printer,
        actionType: 'view',
        targetConfig: { initialAction: 'print' }
      }
    ]
  },

  // 5. Quotations & Estimates
  {
    id: 'quotations',
    number: 5,
    title: 'Quotations & Estimates',
    shortTitle: 'Quotations',
    subtitle: 'Commercial Proposals & Pricing',
    description: 'Generate commercial quotations, track expiry dates, and convert to invoices in one click.',
    icon: FileSpreadsheet,
    badge: (erp) => {
      const active = erp.quotations.filter((q) => q.status === 'Sent' || q.status === 'Accepted').length;
      return active > 0 ? `${active} active` : undefined;
    },
    subcategories: [
      {
        id: 'create-quotation',
        title: 'Create Quotation',
        subtitle: 'Draft a new pricing estimate for client review',
        icon: Plus,
        actionType: 'modal',
        targetConfig: { initialOpenCreate: true }
      },
      {
        id: 'all-quotations',
        title: 'All Quotations',
        subtitle: 'Complete list of quotations and proposals',
        icon: FileSpreadsheet,
        actionType: 'filter',
        badge: (erp) => `${erp.quotations.length}`,
        targetConfig: { initialStatusFilter: 'ALL' }
      },
      {
        id: 'pending-quotes',
        title: 'Sent / Pending Quotes',
        subtitle: 'Quotations sent awaiting customer decision',
        icon: Clock,
        actionType: 'filter',
        badge: (erp) => {
          const c = erp.quotations.filter((q) => q.status === 'Sent').length;
          return c > 0 ? `${c}` : undefined;
        },
        targetConfig: { initialStatusFilter: 'Sent' }
      },
      {
        id: 'accepted-quotes',
        title: 'Accepted Quotations',
        subtitle: 'Approved by customer, ready for billing',
        icon: CheckCircle2,
        actionType: 'filter',
        badge: (erp) => {
          const c = erp.quotations.filter((q) => q.status === 'Accepted').length;
          return c > 0 ? `${c} approved` : undefined;
        },
        targetConfig: { initialStatusFilter: 'Accepted' }
      },
      {
        id: 'convert-to-invoice',
        title: 'Convert to Tax Invoice',
        subtitle: 'Instant 1-click tax invoice generation',
        icon: FileText,
        actionType: 'view',
        targetConfig: { initialStatusFilter: 'Accepted' }
      },
      {
        id: 'expired-quotes',
        title: 'Expired Quotations',
        subtitle: 'Quotations past 30-day validity window',
        icon: AlertTriangle,
        actionType: 'filter',
        targetConfig: { initialStatusFilter: 'Expired' }
      }
    ]
  },

  // 6. Accounts Receivable
  {
    id: 'payments',
    number: 6,
    title: 'Accounts Receivable',
    shortTitle: 'Receivables',
    subtitle: 'Payment Receipts & Reconciliation',
    description: 'Capture bank transfers, EFT payments, cash, and reconcile outstanding customer balances.',
    icon: Receipt,
    badge: (erp) => {
      const total = erp.payments.reduce((a, b) => a + b.amount, 0);
      return total > 0 ? `R${total.toLocaleString('en-ZA')}` : undefined;
    },
    subcategories: [
      {
        id: 'record-payment',
        title: 'Record Payment / EFT',
        subtitle: 'Capture a received payment against an invoice',
        icon: Plus,
        actionType: 'modal',
        targetConfig: { initialOpenCreate: true }
      },
      {
        id: 'all-payments',
        title: 'All Payment Transactions',
        subtitle: 'Historical ledger of customer settlements',
        icon: Receipt,
        actionType: 'filter',
        badge: (erp) => `${erp.payments.length}`,
        targetConfig: { initialMethodFilter: 'ALL' }
      },
      {
        id: 'eft-payments',
        title: 'Bank Transfer / EFT Receipts',
        subtitle: 'Electronic fund transfers from customer banks',
        icon: Building2,
        actionType: 'filter',
        targetConfig: { initialMethodFilter: 'Bank Transfer / EFT' }
      },
      {
        id: 'cash-payments',
        title: 'Cash & POS Collections',
        subtitle: 'Direct cash collections and receipts',
        icon: DollarSign,
        actionType: 'filter',
        targetConfig: { initialMethodFilter: 'Cash' }
      },
      {
        id: 'card-payments',
        title: 'Credit / Debit Card',
        subtitle: 'Point of sale and merchant card payments',
        icon: CreditCard,
        actionType: 'filter',
        targetConfig: { initialMethodFilter: 'Credit/Debit Card' }
      },
      {
        id: 'customer-reconciliation',
        title: 'Reconciliation & Ledgers',
        subtitle: 'Verify invoice balances against recorded payments',
        icon: Scale,
        actionType: 'view',
        targetConfig: { view: 'reconciliation' }
      }
    ]
  },

  // 7. Customers & Branches
  {
    id: 'customers',
    number: 7,
    title: 'Customers & Branches',
    shortTitle: 'Customers',
    subtitle: 'Commercial Directory & Sites',
    description: 'Manage commercial retailers, multi-branch shipping destinations, credit terms, and merchant portals.',
    icon: Users2,
    badge: (erp) => `${erp.customers.length} accounts`,
    subcategories: [
      {
        id: 'customer-directory',
        title: 'Customer Directory',
        subtitle: 'All commercial client accounts and details',
        icon: Users2,
        actionType: 'view',
        badge: (erp) => `${erp.customers.length}`,
        targetConfig: { initialTab: 'directory' }
      },
      {
        id: 'add-new-customer',
        title: 'Add New Customer',
        subtitle: 'Onboard a new wholesale or retail client',
        icon: Plus,
        actionType: 'modal',
        targetConfig: { initialOpenCreate: true }
      },
      {
        id: 'branches-directory',
        title: 'Branches & Delivery Sites',
        subtitle: 'Durban Central, regional stores and depots',
        icon: Store,
        actionType: 'view',
        targetConfig: { initialTab: 'branches' }
      },
      {
        id: 'credit-limits-terms',
        title: 'Credit Limits & Payment Terms',
        subtitle: 'Configure 30-day accounts and limits',
        icon: CreditCard,
        actionType: 'view',
        targetConfig: { initialTab: 'terms' }
      },
      {
        id: 'customer-statements-view',
        title: 'Customer Balance Statements',
        subtitle: 'View statements of accounts per customer',
        icon: FileText,
        actionType: 'view',
        targetConfig: { initialTab: 'statements' }
      },
      {
        id: 'linked-merchants',
        title: 'Linked Merchant Portals',
        subtitle: 'Branch login portals connected to accounts',
        icon: Store,
        actionType: 'view',
        targetConfig: { initialTab: 'merchants' }
      }
    ]
  },

  // 8. Bakery & Product Catalogue
  {
    id: 'catalog',
    number: 8,
    title: 'Bakery & Product Catalogue',
    shortTitle: 'Bakery Catalog',
    subtitle: 'Products, Pricing & Categories',
    description: 'Bakery pastry catalogue, wholesale & retail price lists, unit sizing, and category management.',
    icon: Package,
    badge: (erp) => `${erp.products.length} products`,
    subcategories: [
      {
        id: 'product-catalogue',
        title: 'Product Catalogue',
        subtitle: 'Complete list of bakery items and specs',
        icon: Package,
        actionType: 'tab',
        targetConfig: { initialTab: 'catalog', initialCategoryFilter: 'ALL' }
      },
      {
        id: 'product-categories',
        title: 'Product Categories',
        subtitle: 'Dedicated category manager and sorting',
        icon: Layers,
        actionType: 'tab',
        badge: (erp) => `${erp.categories.length} categories`,
        targetConfig: { initialTab: 'categories' }
      },
      {
        id: 'samoosa-pastry',
        title: 'Samoosa Pastry',
        subtitle: 'Authentic thin & crispy pastry sheets',
        icon: Tag,
        actionType: 'filter',
        targetConfig: { initialTab: 'catalog', initialSearch: 'Samoosa' }
      },
      {
        id: 'spring-roll-pastry',
        title: 'Spring Roll Pastry',
        subtitle: 'High-tensile golden-fry spring roll wrappers',
        icon: Tag,
        actionType: 'filter',
        targetConfig: { initialTab: 'catalog', initialSearch: 'Spring Roll' }
      },
      {
        id: 'tortilla-wraps',
        title: 'Tortilla Wraps',
        subtitle: 'Artisanal soft-baked flour wraps',
        icon: Tag,
        actionType: 'filter',
        targetConfig: { initialTab: 'catalog', initialSearch: 'Tortilla' }
      },
      {
        id: 'rotis',
        title: 'Rotis',
        subtitle: 'Homestyle flaky and layered rotis',
        icon: Tag,
        actionType: 'filter',
        targetConfig: { initialTab: 'catalog', initialSearch: 'Roti' }
      },
      {
        id: 'product-pricing',
        title: 'Product Pricing',
        subtitle: 'Standard unit pricing and margins',
        icon: DollarSign,
        actionType: 'view',
        targetConfig: { initialTab: 'catalog', focusColumn: 'price' }
      },
      {
        id: 'wholesale-price-lists',
        title: 'Wholesale Price Lists',
        subtitle: 'Volume discount tiers for commercial distributors',
        icon: FileSpreadsheet,
        actionType: 'view',
        targetConfig: { initialTab: 'catalog', tier: 'wholesale' }
      },
      {
        id: 'retail-price-lists',
        title: 'Retail Price Lists',
        subtitle: 'Direct consumer and merchant shelf pricing',
        icon: Store,
        actionType: 'view',
        targetConfig: { initialTab: 'catalog', tier: 'retail' }
      },
      {
        id: 'product-images-packaging',
        title: 'Product Images & Packaging',
        subtitle: 'Pack sizes, box quantities & presentation',
        icon: Box,
        actionType: 'view',
        targetConfig: { initialTab: 'catalog', focusColumn: 'packSize' }
      },
      {
        id: 'product-barcodes',
        title: 'Product Barcodes',
        subtitle: 'SKU codes and retail barcode identifiers',
        icon: QrCode,
        actionType: 'view',
        targetConfig: { initialTab: 'catalog', focusColumn: 'sku' }
      },
      {
        id: 'units-of-measurement',
        title: 'Units of Measurement',
        subtitle: 'Each, packs, kilograms & cartons',
        icon: Scale,
        actionType: 'view',
        targetConfig: { initialTab: 'catalog', focusColumn: 'physicalSize' }
      }
    ]
  },

  // 9. Stock Capturing & Slips
  {
    id: 'stock',
    number: 9,
    title: 'Stock Capturing & Slips',
    shortTitle: 'Stock & Slips',
    subtitle: 'Purchase Slips & Finished Goods',
    description: 'Capture supplier purchase receipts with camera/slip scans, track raw materials and finished goods status.',
    icon: ShoppingBag,
    badge: (erp) => {
      const out = (erp.stockItemStatuses || []).filter((s) => s.isFinished || s.quantityOnHand <= 0).length;
      return out > 0 ? `${out} out of stock` : undefined;
    },
    subcategories: [
      {
        id: 'capture-purchase-slip',
        title: 'Capture Purchase Slip',
        subtitle: 'Upload or snap supplier purchase receipt',
        icon: Plus,
        actionType: 'modal',
        targetConfig: { initialOpenCreate: true }
      },
      {
        id: 'purchase-slips-history',
        title: 'Purchase Slips History',
        subtitle: 'Archive of supplier purchases & invoices',
        icon: Receipt,
        actionType: 'tab',
        badge: (erp) => `${erp.stockPurchases.length}`,
        targetConfig: { initialTab: 'purchases' }
      },
      {
        id: 'finished-goods-status',
        title: 'Finished Goods Status',
        subtitle: 'Real-time bakery inventory status per branch',
        icon: CheckCircle2,
        actionType: 'tab',
        badge: (erp) => `${(erp.stockItemStatuses || []).length} tracked`,
        targetConfig: { initialTab: 'branch-status' }
      },
      {
        id: 'in-stock-items',
        title: 'In-Stock Items',
        subtitle: 'Bakery items currently available for dispatch',
        icon: CheckCircle2,
        actionType: 'filter',
        targetConfig: { initialTab: 'branch-status', initialStatusFilter: 'IN_STOCK' }
      },
      {
        id: 'finished-out-of-stock',
        title: 'Finished / Out of Stock',
        subtitle: 'Items depleted requiring immediate bake batch',
        icon: AlertTriangle,
        actionType: 'filter',
        badge: (erp) => {
          const c = (erp.stockItemStatuses || []).filter((s) => s.isFinished || s.quantityOnHand <= 0).length;
          return c > 0 ? `${c} out` : undefined;
        },
        targetConfig: { initialTab: 'branch-status', initialStatusFilter: 'FINISHED' }
      },
      {
        id: 'supplier-directory',
        title: 'Supplier Invoices & Slips',
        subtitle: 'Breakdown of supplier spend and materials',
        icon: Building2,
        actionType: 'view',
        targetConfig: { initialTab: 'purchases' }
      }
    ]
  },

  // 10. Staff & Monthly Payroll
  {
    id: 'payroll',
    number: 10,
    title: 'Staff & Monthly Payroll',
    shortTitle: 'Staff Payroll',
    subtitle: 'Salaries, Wage Slips & Team',
    description: 'Process monthly staff payroll, manage production bakery staff, overtime, and salary payout records.',
    icon: Wallet,
    badge: (erp) => `${erp.staff.length} staff`,
    subcategories: [
      {
        id: 'monthly-payroll-payouts',
        title: 'Monthly Payroll Payouts',
        subtitle: 'Process and review monthly salary runs',
        icon: Wallet,
        actionType: 'tab',
        badge: (erp) => `${erp.payrollPayouts.length} slips`,
        targetConfig: { initialTab: 'payouts' }
      },
      {
        id: 'staff-directory',
        title: 'Staff Directory',
        subtitle: 'Complete list of bakery personnel',
        icon: Users,
        actionType: 'tab',
        badge: (erp) => `${erp.staff.length} staff`,
        targetConfig: { initialTab: 'staff' }
      },
      {
        id: 'add-new-staff',
        title: 'Add New Staff Member',
        subtitle: 'Register new employee with ID and salary',
        icon: Plus,
        actionType: 'modal',
        targetConfig: { initialOpenCreate: true }
      },
      {
        id: 'paid-salary-slips',
        title: 'Paid Salary Slips',
        subtitle: 'Disbursed salaries for the current month',
        icon: CheckCircle2,
        actionType: 'filter',
        targetConfig: { initialTab: 'payouts', initialStatusFilter: 'Paid' }
      },
      {
        id: 'pending-payroll',
        title: 'Pending Payroll',
        subtitle: 'Scheduled wage payouts awaiting sign-off',
        icon: Clock,
        actionType: 'filter',
        targetConfig: { initialTab: 'payouts', initialStatusFilter: 'Pending' }
      },
      {
        id: 'bakery-production-team',
        title: 'Bakery Production Team',
        subtitle: 'Kitchen, kneaders, pastry rollers & dispatch',
        icon: Briefcase,
        actionType: 'filter',
        targetConfig: { initialTab: 'staff', initialDepartmentFilter: 'Production' }
      }
    ]
  },

  // 11. Accounting & Ledgers
  {
    id: 'accounting',
    number: 11,
    title: 'Accounting & Ledgers',
    shortTitle: 'Accounting',
    subtitle: 'General Ledger, P&L & Balance Sheet',
    description: 'Comprehensive double-entry general ledger, Chart of Accounts, Trial Balance, P&L, and SARS VAT 201.',
    icon: Landmark,
    subcategories: [
      {
        id: 'accounting-overview',
        title: 'Accounting Overview',
        subtitle: 'Financial health, operating profit & net margin',
        icon: TrendingUp,
        actionType: 'tab',
        targetConfig: { initialTab: 'overview' }
      },
      {
        id: 'chart-of-accounts',
        title: 'Chart of Accounts (COA)',
        subtitle: 'Assets, liabilities, equity, revenue & expenses',
        icon: Layers,
        actionType: 'tab',
        targetConfig: { initialTab: 'chart-of-accounts' }
      },
      {
        id: 'trial-balance',
        title: 'Trial Balance',
        subtitle: 'Debit vs Credit balance verification',
        icon: Scale,
        actionType: 'tab',
        targetConfig: { initialTab: 'trial-balance' }
      },
      {
        id: 'profit-and-loss',
        title: 'Profit & Loss (Income Statement)',
        subtitle: 'Revenue, cost of sales & net income',
        icon: TrendingUp,
        actionType: 'tab',
        targetConfig: { initialTab: 'profit-and-loss' }
      },
      {
        id: 'balance-sheet',
        title: 'Balance Sheet',
        subtitle: 'Financial position: assets, liabilities & equity',
        icon: Landmark,
        actionType: 'tab',
        targetConfig: { initialTab: 'balance-sheet' }
      },
      {
        id: 'ar-aging',
        title: 'Accounts Receivable Aging',
        subtitle: '30, 60, 90+ days aging breakdown',
        icon: Clock,
        actionType: 'tab',
        targetConfig: { initialTab: 'ar-aging' }
      },
      {
        id: 'vat-201',
        title: 'SARS VAT 201 Return',
        subtitle: 'Standard South African 15% VAT output vs input',
        icon: Percent,
        actionType: 'tab',
        targetConfig: { initialTab: 'vat-201' }
      },
      {
        id: 'journal-entries',
        title: 'Journal Entries & Adjustments',
        subtitle: 'Manual double-entry adjusting journals',
        icon: BookOpen,
        actionType: 'tab',
        targetConfig: { initialTab: 'journal-entries' }
      }
    ]
  },

  // 12. Ask Taskeen AI
  {
    id: 'taskeen',
    number: 12,
    title: 'Ask Taskeen AI',
    shortTitle: 'Ask Taskeen',
    subtitle: 'Executive Bakery & Business Advisor',
    description: 'AI business executive powered by Gemini for financial diagnosis, stock projections, and strategy.',
    icon: Sparkles,
    badge: () => 'Advisor',
    subcategories: [
      {
        id: 'taskeen-chat',
        title: 'Executive AI Consultation',
        subtitle: 'Interactive live executive strategy conversation',
        icon: Sparkles,
        actionType: 'view',
        targetConfig: { mode: 'chat' }
      },
      {
        id: 'financial-audit-ai',
        title: 'Financial Health & Profit Audit',
        subtitle: 'Automated margin & cashflow diagnosis',
        icon: TrendingUp,
        actionType: 'view',
        targetConfig: { initialPrompt: 'Perform a comprehensive financial audit of Savouré revenue, unpaid invoices, and operating cashflow.' }
      },
      {
        id: 'stock-forecast-ai',
        title: 'Bakery Stock & Batch Forecast',
        subtitle: 'Predict ingredient requirements & finished pastry',
        icon: Package,
        actionType: 'view',
        targetConfig: { initialPrompt: 'Analyze our current finished goods status and suggest the optimal baking batch quantities for the week.' }
      },
      {
        id: 'pricing-strategy-ai',
        title: 'Pricing & Margin Strategy',
        subtitle: 'Review wholesale vs retail pricing tiers',
        icon: DollarSign,
        actionType: 'view',
        targetConfig: { initialPrompt: 'Review our bakery product catalog pricing and advise on margins for wholesale commercial clients.' }
      },
      {
        id: 'debtor-recovery-ai',
        title: 'Debtor Recovery Strategy',
        subtitle: 'Prioritized follow-up plan for overdue invoices',
        icon: Clock,
        actionType: 'view',
        targetConfig: { initialPrompt: 'Identify our overdue customer invoices and generate a polite, firm debt collection follow-up schedule.' }
      },
      {
        id: 'sars-compliance-ai',
        title: 'SARS VAT & Tax Advisory',
        subtitle: 'Guidelines on VAT 201 compliance and deductions',
        icon: Landmark,
        actionType: 'view',
        targetConfig: { initialPrompt: 'Summarize our VAT 201 tax position and provide compliance tips for South African bakery operations.' }
      }
    ]
  },

  // 13. 52-Week Reports
  {
    id: 'reports',
    number: 13,
    title: '52-Week Reports',
    shortTitle: '52-Week Reports',
    subtitle: 'Annual Trajectory & Trend Analytics',
    description: 'Longitudinal business analytics across 52 weeks, monthly comparisons, and customer contribution charts.',
    icon: BarChart3,
    subcategories: [
      {
        id: 'weekly-reports',
        title: '52-Week Revenue Trajectory',
        subtitle: 'Weekly breakdown across the entire financial year',
        icon: BarChart3,
        actionType: 'filter',
        targetConfig: { period: 'weekly' }
      },
      {
        id: 'monthly-reports',
        title: 'Monthly Comparison Reports',
        subtitle: 'Month-on-month revenue and collection trends',
        icon: Calendar,
        actionType: 'filter',
        targetConfig: { period: 'monthly' }
      },
      {
        id: 'quarterly-reports',
        title: 'Quarterly Executive Summary',
        subtitle: 'Q1, Q2, Q3, Q4 consolidated summaries',
        icon: TrendingUp,
        actionType: 'filter',
        targetConfig: { period: 'quarterly' }
      },
      {
        id: 'annual-report',
        title: 'Annual Consolidated Financials',
        subtitle: 'Complete year-end commercial report',
        icon: Landmark,
        actionType: 'filter',
        targetConfig: { period: 'annual' }
      },
      {
        id: 'customer-contribution',
        title: 'Customer Revenue Contribution',
        subtitle: 'Ranked client billing and collection share',
        icon: Users2,
        actionType: 'view',
        targetConfig: { view: 'customer-breakdown' }
      },
      {
        id: 'print-financial-reports',
        title: 'Print & Export Financials',
        subtitle: 'High-resolution PDF or CSV export for auditors',
        icon: Printer,
        actionType: 'view',
        targetConfig: { view: 'export' }
      }
    ]
  },

  // 14. Sales Leads & CRM
  {
    id: 'crm',
    number: 14,
    title: 'Sales Leads & CRM',
    shortTitle: 'Sales CRM',
    subtitle: 'Pipeline, Leads & Communications',
    description: 'Track retail wholesale prospects, commercial pipelines, meetings, calls, and customer conversion.',
    icon: Flame,
    badge: (erp) => {
      const c = erp.leads.length;
      return c > 0 ? `${c} leads` : undefined;
    },
    subcategories: [
      {
        id: 'sales-pipeline',
        title: 'Sales Pipeline (Kanban)',
        subtitle: 'Deal stages: New, Contacted, Qualified & Won',
        icon: Flame,
        actionType: 'tab',
        badge: (erp) => `${erp.leads.length}`,
        targetConfig: { initialTab: 'pipeline' }
      },
      {
        id: 'create-sales-lead',
        title: 'Create New Sales Lead',
        subtitle: 'Capture a potential new client inquiry',
        icon: Plus,
        actionType: 'modal',
        targetConfig: { initialOpenCreate: true }
      },
      {
        id: 'communication-log',
        title: 'Communication & Call Logs',
        subtitle: 'History of client calls, meetings and emails',
        icon: MessageSquare,
        actionType: 'tab',
        targetConfig: { initialTab: 'communications' }
      },
      {
        id: 'new-leads-stage',
        title: 'New Prospects',
        subtitle: 'Incoming enquiries requiring qualification',
        icon: Clock,
        actionType: 'filter',
        targetConfig: { initialTab: 'pipeline', stage: 'New' }
      },
      {
        id: 'qualified-commercial',
        title: 'Qualified Commercial Accounts',
        subtitle: 'Vetted retailers ready for contract signing',
        icon: CheckCircle2,
        actionType: 'filter',
        targetConfig: { initialTab: 'pipeline', stage: 'Qualified' }
      },
      {
        id: 'won-deals',
        title: 'Won & Onboarded Clients',
        subtitle: 'Successfully converted to commercial customers',
        icon: TrendingUp,
        actionType: 'filter',
        targetConfig: { initialTab: 'pipeline', stage: 'Won' }
      }
    ]
  },

  // 15. User Management
  {
    id: 'users',
    number: 15,
    title: 'User Management',
    shortTitle: 'User Accounts',
    subtitle: 'RBAC Roles, Logins & Security',
    description: 'Manage staff accounts, Super Admin credentials, role-based access permissions, and audit logs.',
    icon: ShieldCheck,
    badge: (erp) => `${erp.users.length} users`,
    subcategories: [
      {
        id: 'all-users',
        title: 'All System Users & Accounts',
        subtitle: 'Full list of active administrator logins',
        icon: Users,
        actionType: 'view',
        badge: (erp) => `${erp.users.length}`,
        targetConfig: { initialRoleFilter: 'ALL' }
      },
      {
        id: 'create-erp-user',
        title: 'Add New ERP User',
        subtitle: 'Provision a new operator or supervisor',
        icon: UserPlus,
        actionType: 'modal',
        targetConfig: { initialOpenCreate: true }
      },
      {
        id: 'super-admin-users',
        title: 'Super Admin Credentials',
        subtitle: 'Master administrators with full privileges',
        icon: Shield,
        actionType: 'filter',
        targetConfig: { initialRoleFilter: 'super_admin' }
      },
      {
        id: 'financial-controllers',
        title: 'Financial Controllers',
        subtitle: 'Invoicing and accounting permissions',
        icon: Landmark,
        actionType: 'filter',
        targetConfig: { initialRoleFilter: 'accountant' }
      },
      {
        id: 'logistics-dispatchers',
        title: 'Logistics & Dispatchers',
        subtitle: 'Delivery notes and driver POD access',
        icon: Truck,
        actionType: 'filter',
        targetConfig: { initialRoleFilter: 'logistics' }
      },
      {
        id: 'merchant-users',
        title: 'Merchant Branch Accounts',
        subtitle: 'Client merchant portal accounts',
        icon: Store,
        actionType: 'filter',
        targetConfig: { initialRoleFilter: 'merchant' }
      }
    ]
  },

  // 16. Merchants & Branches
  {
    id: 'merchants',
    number: 16,
    title: 'Merchants & Branches',
    shortTitle: 'Merchants',
    subtitle: 'Retail Hubs & Branch Logins',
    description: 'Provision self-service portal accounts for merchant branches to view their own invoices and statements.',
    icon: Store,
    badge: (erp) => {
      const c = erp.users.filter((u) => u.role === 'merchant').length;
      return `${c} hubs`;
    },
    subcategories: [
      {
        id: 'all-merchants',
        title: 'Merchant Hubs Directory',
        subtitle: 'All provisioned branch merchant logins',
        icon: Store,
        actionType: 'view',
        badge: (erp) => `${erp.users.filter((u) => u.role === 'merchant').length}`,
        targetConfig: { initialBranchFilter: 'ALL' }
      },
      {
        id: 'create-merchant',
        title: 'Provision Merchant Account',
        subtitle: 'Create portal credentials for branch manager',
        icon: Plus,
        actionType: 'modal',
        targetConfig: { initialOpenCreate: true }
      },
      {
        id: 'durban-central-merchants',
        title: 'Durban Central Merchants',
        subtitle: 'Merchants mapped to Durban Central branch',
        icon: Store,
        actionType: 'filter',
        targetConfig: { initialBranchFilter: 'Durban Central' }
      },
      {
        id: 'customer-account-linking',
        title: 'Customer Account Linkages',
        subtitle: 'Map merchant logins to commercial invoices',
        icon: Users2,
        actionType: 'view',
        targetConfig: { focus: 'link' }
      },
      {
        id: 'branch-statement-permissions',
        title: 'Branch Statement Access',
        subtitle: 'Allow merchants to view invoices & delivery PODs',
        icon: FileText,
        actionType: 'view',
        targetConfig: { focus: 'permissions' }
      },
      {
        id: 'merchant-security',
        title: 'Security & PIN Access',
        subtitle: 'Reset passwords and manage branch security',
        icon: Key,
        actionType: 'view',
        targetConfig: { focus: 'security' }
      }
    ]
  },

  // 17. Database Explorer
  {
    id: 'database',
    number: 17,
    title: 'Database Explorer',
    shortTitle: 'Database',
    subtitle: 'Collections, Backups & Portability',
    description: 'Inspect live database collections, download encrypted JSON backups, or restore cloud snapshots.',
    icon: Database,
    subcategories: [
      {
        id: 'db-invoices',
        title: 'Invoices Collection',
        subtitle: 'Raw document records for all tax invoices',
        icon: FileText,
        actionType: 'tab',
        targetConfig: { initialCollection: 'invoices' }
      },
      {
        id: 'db-customers',
        title: 'Customers & Branches Store',
        subtitle: 'Raw document records for commercial clients',
        icon: Users2,
        actionType: 'tab',
        targetConfig: { initialCollection: 'customers' }
      },
      {
        id: 'db-stock',
        title: 'Stock & Slips Collection',
        subtitle: 'Supplier purchase slips and item statuses',
        icon: ShoppingBag,
        actionType: 'tab',
        targetConfig: { initialCollection: 'stockPurchases' }
      },
      {
        id: 'export-full-backup',
        title: 'Export Full JSON Backup',
        subtitle: 'Download complete system snapshot to disk',
        icon: Download,
        actionType: 'modal',
        targetConfig: { initialAction: 'export' }
      },
      {
        id: 'restore-cloud-snapshot',
        title: 'Restore Cloud Snapshot',
        subtitle: 'Import previous JSON archive safely',
        icon: Upload,
        actionType: 'modal',
        targetConfig: { initialAction: 'restore' }
      },
      {
        id: 'cloud-sync-inspector',
        title: 'Cloud Database Status',
        subtitle: 'Firestore persistence & connectivity telemetry',
        icon: HardDrive,
        actionType: 'view',
        targetConfig: { initialAction: 'status' }
      }
    ]
  },

  // 18. Company & Banking
  {
    id: 'settings',
    number: 18,
    title: 'Company & Banking',
    shortTitle: 'Settings',
    subtitle: 'Branding, Bank Accounts & Profile',
    description: 'Official Savouré registered company details, banking information, VAT numbers, and emblem configuration.',
    icon: Building2,
    subcategories: [
      {
        id: 'legal-business-profile',
        title: 'Legal Business Profile',
        subtitle: 'Company name, registration number & contact',
        icon: Building2,
        actionType: 'view',
        targetConfig: { initialSection: 'profile' }
      },
      {
        id: 'banking-eft-settlement',
        title: 'Banking & EFT Settlement',
        subtitle: 'Official bank name, account number & branch code',
        icon: CreditCard,
        actionType: 'view',
        targetConfig: { initialSection: 'banking' }
      },
      {
        id: 'official-brand-emblem',
        title: 'Official Brand Crest & Logo',
        subtitle: 'Upload and configure master emblems',
        icon: Sparkles,
        actionType: 'view',
        targetConfig: { initialSection: 'logo' }
      },
      {
        id: 'sars-vat-registration',
        title: 'SARS VAT & Tax Configuration',
        subtitle: 'VAT registration number & tax invoice rules',
        icon: Percent,
        actionType: 'view',
        targetConfig: { initialSection: 'vat' }
      },
      {
        id: 'default-payment-terms',
        title: 'Payment Terms & Notes',
        subtitle: 'Default invoice footnote & settlement terms',
        icon: FileText,
        actionType: 'view',
        targetConfig: { initialSection: 'terms' }
      },
      {
        id: 'physical-postal-address',
        title: 'Bakery Facility Details',
        subtitle: 'Operational facility & dispatch details',
        icon: Building2,
        actionType: 'view',
        targetConfig: { initialSection: 'address' }
      }
    ]
  }
];
