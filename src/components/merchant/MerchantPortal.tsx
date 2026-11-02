import React, { useState, useMemo, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { Invoice, DeliveryNote, MerchantOrderItem, Product, ProductSizeOption, MerchantOrder } from '../../types/erp';
import {
  Store,
  FileText,
  Printer,
  LogOut,
  Globe,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
  Building2,
  Phone,
  MessageCircle,
  ShieldCheck,
  AlertCircle,
  Receipt,
  Download,
  Calendar,
  Truck,
  PenTool,
  CheckCircle2,
  X,
  Package,
  MapPin,
  User,
  Plus,
  Minus,
  ShoppingBag,
  Bell,
  Sparkles,
  Send,
  BarChart3,
  Check,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  Info,
  RefreshCw,
  LayoutGrid,
  TableProperties,
  RotateCcw,
  FileDown,
  ChevronRight,
  Scale
} from 'lucide-react';
import { InvoicePrintModal } from '../InvoicePrintModal';
import { SHOWCASE_CONTACT } from '../showcase/showcaseData';
import { MerchantReportsTab } from './MerchantReportsTab';

// Helper to map bakery product to showcase photography
export function getProductImage(prod: Product): string {
  const name = prod.name.toLowerCase();
  const id = prod.id.toLowerCase();
  const cat = (prod.category || '').toLowerCase();

  if (id.includes('spring_roll') || name.includes('spring roll') || cat.includes('spring roll')) {
    return '/showcase/savoure-springroll.png';
  }
  if (id.includes('samoosa') || name.includes('samoosa') || name.includes('samosa') || cat.includes('samoosa') || cat.includes('samosa')) {
    return '/showcase/savoure-samoosa.png';
  }
  if (id.includes('roti') || name.includes('roti') || cat.includes('roti')) {
    return '/showcase/savoure-roti.png';
  }
  if (id.includes('tortilla') || name.includes('tortilla') || name.includes('wrap') || cat.includes('tortilla') || cat.includes('wrap')) {
    return '/showcase/savoure-tortilla.png';
  }
  return '/showcase/savoure-logo.png';
}

// Helper to retrieve all size options for any bakery product
export function getProductSizes(prod: Product): ProductSizeOption[] {
  if (prod.sizes && prod.sizes.length > 0) {
    return prod.sizes;
  }
  const basePrice = prod.unitPrice || 35.00;
  return [
    {
      id: `${prod.id}_std`,
      name: `${prod.name} (Standard Pack)`,
      shortName: 'Standard Pack',
      dimensions: prod.physicalSize || 'Standard 20cm',
      packSpec: prod.packSize || 'Commercial Pack',
      price: basePrice,
      isDefault: true,
      badge: 'Standard',
    },
    {
      id: `${prod.id}_bulk`,
      name: `${prod.name} (Bulk Catering Box)`,
      shortName: 'Catering Box (12s)',
      dimensions: prod.physicalSize || 'Standard 20cm',
      packSpec: `12 × (${prod.packSize || 'Commercial Pack'})`,
      price: Math.round(basePrice * 12 * 0.90 * 100) / 100,
      badge: '10% Wholesale Save',
    },
  ];
}

interface MerchantPortalProps {
  onBackToWebsite: () => void;
}

export const MerchantPortal: React.FC<MerchantPortalProps> = ({ onBackToWebsite }) => {
  const {
    currentUser,
    invoices,
    deliveryNotes,
    products,
    merchantOrders,
    createMerchantOrder,
    logout,
    customers,
    company,
    savePOD,
    merchantReports,
    saveMerchantReport,
    deleteMerchantReport,
    syncStatus,
    lastSynced,
    refreshData
  } = useERP();

  // Navigation tab: 'place-order' | 'my-orders' | 'reports' | 'invoices' | 'delivery-notes'
  const [activeTab, setActiveTab] = useState<'place-order' | 'my-orders' | 'reports' | 'invoices' | 'delivery-notes'>('place-order');

  // Search & filter states
  const [search, setSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'Paid' | 'Pending' | 'Overdue'>('ALL');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<'ALL' | 'In Transit' | 'Delivered'>('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'DISPATCHED' | 'DELIVERED'>('ALL');

  // Modal states
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [selectedDeliveryNoteForView, setSelectedDeliveryNoteForView] = useState<DeliveryNote | null>(null);

  // Digital POD Signature Modal
  const [podNote, setPodNote] = useState<DeliveryNote | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [podNotes, setPodNotes] = useState('');
  const [podError, setPodError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // ------------------------------------------------------------------
  // NEW ORDER FORM STATE (WITH DYNAMIC SIZE PICKER & SPECIFICATIONS)
  // ------------------------------------------------------------------
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [selectedSizePerProduct, setSelectedSizePerProduct] = useState<Record<string, string>>({});
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('ALL');
  const [orderNotice, setOrderNotice] = useState<string | null>(null);
  const [showAllSizesMap, setShowAllSizesMap] = useState<Record<string, boolean>>({});
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    return d.toISOString().split('T')[0];
  });
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    currentUser?.deliveryAddress || currentUser?.merchantAddress || 'Commercial Store Dispatch Address'
  );
  const [selectedBranch, setSelectedBranch] = useState<string>(
    currentUser?.branch || 'Main Branch'
  );
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [orderSuccessBanner, setOrderSuccessBanner] = useState<string | null>(null);
  const [catalogLayout, setCatalogLayout] = useState<'cards' | 'matrix'>('cards');
  const [confirmedOrder, setConfirmedOrder] = useState<MerchantOrder | null>(null);
  const [coldChainRequired, setColdChainRequired] = useState<boolean>(true);
  const [deliveryPreset, setDeliveryPreset] = useState<'tomorrow' | 'twoDays' | 'threeDays' | 'custom'>('twoDays');

  // Find linked customer record from ERP database if available
  const linkedCustomer = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.customerId) {
      return customers.find((c) => c.id === currentUser.customerId) || null;
    }
    if (currentUser.merchantStoreName) {
      return (
        customers.find(
          (c) =>
            c.registeredName.toLowerCase() === currentUser.merchantStoreName?.toLowerCase() ||
            c.tradingName.toLowerCase() === currentUser.merchantStoreName?.toLowerCase()
        ) || null
      );
    }
    return null;
  }, [customers, currentUser]);

  const currentBranch = currentUser?.branch || linkedCustomer?.branches?.[0]?.branchName || 'Main Branch';
  const customerDisplayName =
    currentUser?.customerName ||
    linkedCustomer?.registeredName ||
    currentUser?.merchantStoreName ||
    currentUser?.name ||
    'Merchant Partner';

  // ------------------------------------------------------------------
  // STRICT AUTOMATIC FILTERING FOR INVOICES
  // ------------------------------------------------------------------
  const merchantInvoices = useMemo(() => {
    if (!currentUser) return [];

    return invoices.filter((inv) => {
      if (currentUser.customerId && inv.customerId === currentUser.customerId) return true;
      if (linkedCustomer?.id && inv.customerId === linkedCustomer.id) return true;
      if (inv.merchantId && inv.merchantId === currentUser.id) return true;
      if (inv.merchantEmail && currentUser.email && inv.merchantEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
      if (inv.merchantName && (
        (currentUser.name && inv.merchantName.toLowerCase() === currentUser.name.toLowerCase()) ||
        (currentUser.merchantStoreName && inv.merchantName.toLowerCase() === currentUser.merchantStoreName.toLowerCase())
      )) return true;

      const targetCustomerNames = [
        currentUser.customerName?.toLowerCase(),
        currentUser.merchantStoreName?.toLowerCase(),
        linkedCustomer?.registeredName.toLowerCase(),
        linkedCustomer?.tradingName.toLowerCase(),
      ].filter(Boolean);

      const invCustomerName = (inv.customerName || '').toLowerCase();
      const invTradingName = (inv.customerTradingName || '').toLowerCase();

      return targetCustomerNames.some((name) => name && (invCustomerName.includes(name) || invTradingName.includes(name) || name.includes(invCustomerName)));
    });
  }, [invoices, currentUser, linkedCustomer]);

  // ------------------------------------------------------------------
  // STRICT AUTOMATIC FILTERING FOR DELIVERY NOTES
  // ------------------------------------------------------------------
  const merchantDeliveryNotes = useMemo(() => {
    if (!currentUser) return [];

    return deliveryNotes.filter((note) => {
      if (currentUser.customerId && note.customerId === currentUser.customerId) return true;
      if (linkedCustomer?.id && note.customerId === linkedCustomer.id) return true;
      if (note.merchantId && note.merchantId === currentUser.id) return true;

      const targetCustomerNames = [
        currentUser.customerName?.toLowerCase(),
        currentUser.merchantStoreName?.toLowerCase(),
        linkedCustomer?.registeredName.toLowerCase(),
        linkedCustomer?.tradingName.toLowerCase(),
      ].filter(Boolean);

      const noteCustomerName = (note.customerName || '').toLowerCase();
      return targetCustomerNames.some((name) => name && (noteCustomerName.includes(name) || name.includes(noteCustomerName)));
    });
  }, [deliveryNotes, currentUser, linkedCustomer]);

  // ------------------------------------------------------------------
  // STRICT AUTOMATIC FILTERING FOR MERCHANT ORDERS
  // ------------------------------------------------------------------
  const myOrdersList = useMemo(() => {
    if (!currentUser) return [];
    return (merchantOrders || []).filter((o) => {
      if (o.merchantId === currentUser.id) return true;
      if (currentUser.email && o.merchantEmail && o.merchantEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
      if (currentUser.merchantStoreName && o.merchantStoreName && o.merchantStoreName.toLowerCase() === currentUser.merchantStoreName.toLowerCase()) return true;
      return false;
    });
  }, [merchantOrders, currentUser]);

  const latestPreviousOrder = useMemo(() => {
    if (!myOrdersList || myOrdersList.length === 0) return null;
    return [...myOrdersList].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [myOrdersList]);

  // Financial statistics
  const totalBilled = merchantInvoices.reduce((acc, i) => acc + (Number(i.grandTotal) || 0), 0);
  const totalPaid = merchantInvoices.reduce((acc, i) => acc + (Number(i.amountPaid) || 0), 0);
  const totalBalanceDue = merchantInvoices.reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0);
  const pendingOrdersCount = myOrdersList.filter((o) => o.status === 'PENDING' || o.status === 'ACCEPTED' || o.status === 'PREPARING').length;

  // Ordering catalog items (from ERP products)
  const orderableProducts = useMemo(() => {
    return (products || []).filter((p) => p.unitPrice > 0 || p.showcase !== false);
  }, [products]);

  // Helper to determine currently active size option for a product card
  const getSelectedSizeForProduct = (prod: Product): ProductSizeOption => {
    const sizes = getProductSizes(prod);
    const selectedId = selectedSizePerProduct[prod.id];
    if (selectedId) {
      const found = sizes.find((s) => s.id === selectedId);
      if (found) return found;
    }
    return sizes.find((s) => s.isDefault) || sizes[0];
  };

  const handleSelectSize = (prodId: string, sizeId: string) => {
    setSelectedSizePerProduct((prev) => ({ ...prev, [prodId]: sizeId }));
  };

  const toggleShowAllSizes = (prodId: string) => {
    setShowAllSizesMap((prev) => ({ ...prev, [prodId]: !prev[prodId] }));
  };

  // Filter products by category & search query
  const filteredCatalogProducts = useMemo(() => {
    return orderableProducts.filter((p) => {
      const matchCat = catalogCategory === 'ALL' || p.category === catalogCategory;
      const q = catalogSearch.toLowerCase().trim();
      const sizes = getProductSizes(p);
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        sizes.some((s) => s.name.toLowerCase().includes(q) || s.dimensions.toLowerCase().includes(q) || s.packSpec.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [orderableProducts, catalogCategory, catalogSearch]);

  // Calculate order items and total with precise size specifications
  const selectedOrderItems: MerchantOrderItem[] = useMemo(() => {
    const list: MerchantOrderItem[] = [];
    Object.entries(orderQuantities).forEach(([itemKey, qty]) => {
      if (qty > 0) {
        const [prodId, sizeId] = itemKey.includes('___') ? itemKey.split('___') : [itemKey, ''];
        const prod = orderableProducts.find((p) => p.id === prodId);
        if (prod) {
          const sizes = getProductSizes(prod);
          const size = sizes.find((s) => s.id === sizeId) || sizes.find((s) => s.isDefault) || sizes[0];
          const unitPrice = size ? size.price : (prod.unitPrice || 35.00);
          const packSize = size ? `${size.shortName || size.name} [${size.packSpec}]` : (prod.packSize || 'Commercial Pack');
          list.push({
            productId: prod.id,
            productName: prod.name,
            packSize,
            quantity: qty,
            unitPrice,
            lineTotal: qty * unitPrice,
            notes: size?.dimensions ? `Size: ${size.dimensions}` : undefined,
          });
        }
      }
    });
    return list;
  }, [orderQuantities, orderableProducts]);

  const orderSubtotal = selectedOrderItems.reduce((acc, it) => acc + it.lineTotal, 0);
  const orderTotal = orderSubtotal; // Zero-rated / staple food exemption default
  const totalPackCount = selectedOrderItems.reduce((acc, it) => acc + it.quantity, 0);
  const estimatedWholesaleWeightKg = Math.round(totalPackCount * 0.85 * 10) / 10;

  const handleQtyChange = (prodId: string, sizeId: string, delta: number) => {
    const itemKey = `${prodId}___${sizeId}`;
    setOrderQuantities((prev) => {
      const cur = prev[itemKey] || 0;
      const next = Math.max(0, cur + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemKey];
        return copy;
      }
      return { ...prev, [itemKey]: next };
    });
  };

  const handleQuickAddQty = (prodId: string, sizeId: string, delta: number) => {
    const itemKey = `${prodId}___${sizeId}`;
    setOrderQuantities((prev) => {
      const cur = prev[itemKey] || 0;
      return { ...prev, [itemKey]: cur + delta };
    });
  };

  const handleRemoveOrderItem = (itemKey: string) => {
    setOrderQuantities((prev) => {
      const copy = { ...prev };
      delete copy[itemKey];
      return copy;
    });
  };

  const handleRepeatPreviousOrder = (order: MerchantOrder) => {
    if (!order || !order.items || order.items.length === 0) return;
    const newQuantities: Record<string, number> = {};
    order.items.forEach((item) => {
      const prod = orderableProducts.find(
        (p) => p.id === item.productId || p.name.toLowerCase() === item.productName.toLowerCase()
      );
      if (prod) {
        const sizes = getProductSizes(prod);
        const matchedSize =
          sizes.find(
            (s) =>
              item.packSize &&
              (item.packSize.includes(s.shortName || '') || item.packSize.includes(s.name))
          ) || sizes[0];
        const key = `${prod.id}___${matchedSize.id}`;
        newQuantities[key] = (newQuantities[key] || 0) + item.quantity;
      }
    });
    setOrderQuantities(newQuantities);
    setOrderNotice(
      `⚡ Pre-filled ${Object.keys(newQuantities).length} item lines from Order #${order.orderNumber}. Adjust quantities as needed.`
    );
    setTimeout(() => setOrderNotice(null), 6000);
  };

  const handleSelectDeliveryPreset = (preset: 'tomorrow' | 'twoDays' | 'threeDays' | 'custom') => {
    setDeliveryPreset(preset);
    const now = Date.now();
    if (preset === 'tomorrow') {
      const d = new Date(now + 86400000);
      setRequestedDeliveryDate(d.toISOString().split('T')[0]);
    } else if (preset === 'twoDays') {
      const d = new Date(now + 86400000 * 2);
      setRequestedDeliveryDate(d.toISOString().split('T')[0]);
    } else if (preset === 'threeDays') {
      const d = new Date(now + 86400000 * 3);
      setRequestedDeliveryDate(d.toISOString().split('T')[0]);
    }
  };

  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrderItems.length === 0) {
      setOrderNotice('Please select at least one bakery product and choose a size to place an order.');
      setTimeout(() => setOrderNotice(null), 5000);
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const created = await createMerchantOrder({
        merchantId: currentUser?.id,
        merchantName: currentUser?.name || 'Commercial Merchant',
        merchantStoreName: customerDisplayName,
        merchantEmail: currentUser?.email || 'orders@savoure.co.za',
        merchantPhone: currentUser?.merchantPhone || currentUser?.phone || '061 364 5712',
        branch: selectedBranch,
        deliveryAddress: deliveryAddress.trim() || 'Store Direct Delivery',
        requestedDeliveryDate,
        items: selectedOrderItems,
        subtotal: orderSubtotal,
        vat: 0,
        total: orderTotal,
        specialInstructions: [
          orderNotes.trim(),
          coldChainRequired ? 'Cold-Chain Refrigerated Transit Requested (-18°C / +4°C)' : '',
        ]
          .filter(Boolean)
          .join(' | '),
      });

      setOrderQuantities({});
      setOrderNotes('');
      setConfirmedOrder(created);
      setOrderSuccessBanner(
        `🎉 Order #${created.orderNumber} successfully received! Live oven dispatch ticket generated.`
      );
      setTimeout(() => setOrderSuccessBanner(null), 8000);
    } catch (err: any) {
      setOrderNotice(err?.message || 'Failed to submit order. Please try again or WhatsApp dispatch.');
      setTimeout(() => setOrderNotice(null), 6000);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Digital Signature Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1E0F07';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSavePodSignature = async () => {
    if (!podNote) return;
    if (!recipientName.trim()) {
      setPodError('Please enter recipient full name.');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      setPodError('Please provide a digital signature.');
      return;
    }

    try {
      const sigData = canvas.toDataURL('image/png');
      await savePOD(podNote.id, {
        podSignature: sigData,
        podReceivedBy: recipientName.trim(),
        notes: podNotes.trim(),
      });
      setPodNote(null);
      clearCanvas();
      alert('Proof of Delivery (POD) signed and submitted successfully.');
    } catch (e: any) {
      setPodError(e.message || 'Failed to submit POD signature');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F1] text-[#2B150A] flex flex-col font-sans">
      {/* 1. TOP EXECUTIVE HEADER (Admin Portal Styling) */}
      <header className="sticky top-0 z-40 bg-[#1E0F07] text-white border-b border-[#3A2215] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/showcase/savoure-logo.png"
              alt="Savouré Logo"
              className="w-10 h-10 rounded-full object-contain bg-white/10 p-1 border border-[#CC8468]/40 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-white">
                  Savouré Commercial Merchant Portal
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#CC8468]/30 text-[#E0A282] border border-[#CC8468]/40">
                  Direct B2B Order Desk
                </span>
              </div>
              <div className="text-xs text-[#C5B7AC] flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-[#CC8468]" />
                <span className="font-semibold text-white">{customerDisplayName}</span>
                <span>·</span>
                <span>Branch: {currentBranch}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time Cloud Sync indicator */}
            <button
              type="button"
              onClick={() => refreshData()}
              title="Real-time Cloud Firestore & Backend Live Sync Active. Tap to refresh."
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/25 hover:bg-black/40 border border-[#CC8468]/30 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              {syncStatus === 'synced' ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold text-emerald-400 text-[11px]">Cloud Live</span>
                  <span className="text-[#A69385] text-[10px] hidden md:inline">({lastSynced || 'Active'})</span>
                  <RefreshCw className="w-2.5 h-2.5 text-[#C5B7AC] hover:text-[#E0A282]" />
                </>
              ) : syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3 h-3 text-[#E0A282] animate-spin" />
                  <span className="text-[#E0A282] text-[11px]">Syncing...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-300 text-[11px]">Offline</span>
                </>
              )}
            </button>

            <button
              onClick={onBackToWebsite}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </button>

            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
              title="Sign Out of Merchant Account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* 2. SUB-BAR NAVIGATION TABS */}
        <div className="bg-[#2B150A] border-t border-[#3A2215] px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
            {[
              { id: 'place-order', label: 'Place New Order', icon: ShoppingBag, badge: 'Direct Desk' },
              { id: 'my-orders', label: 'My Orders', icon: Package, badge: myOrdersList.length ? String(myOrdersList.length) : undefined },
              { id: 'reports', label: 'Reports & Statements', icon: BarChart3, badge: merchantReports.length ? String(merchantReports.length) : 'New' },
              { id: 'invoices', label: 'Invoices & Statements', icon: FileText, badge: merchantInvoices.length ? String(merchantInvoices.length) : undefined },
              { id: 'delivery-notes', label: 'Delivery Notes & PODs', icon: Truck, badge: merchantDeliveryNotes.length ? String(merchantDeliveryNotes.length) : undefined },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#CC8468] text-[#1E0F07] shadow-sm'
                      : 'text-[#C5B7AC] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-[#1E0F07] text-[#E0A282]' : 'bg-white/10 text-stone-300'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6">
        {/* Success Banner */}
        {orderSuccessBanner && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{orderSuccessBanner}</span>
            </div>
            <button onClick={() => setOrderSuccessBanner(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. EXECUTIVE KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E8D9CD] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D5037] flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#CC8468]" />
              <span>Pending Orders</span>
            </span>
            <div className="text-2xl font-serif font-bold text-[#2B150A] mt-2">
              {pendingOrdersCount}
            </div>
            <span className="text-[11px] text-[#7A6458] mt-1">In bakery oven queue</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E8D9CD] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D5037] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#CC8468]" />
              <span>Total Orders Placed</span>
            </span>
            <div className="text-2xl font-serif font-bold text-[#2B150A] mt-2">
              {myOrdersList.length}
            </div>
            <span className="text-[11px] text-[#7A6458] mt-1">B2B commercial orders</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E8D9CD] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D5037] flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#CC8468]" />
              <span>Total Invoiced</span>
            </span>
            <div className="text-2xl font-serif font-bold text-[#2B150A] mt-2">
              R {totalBilled.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-700 mt-1">Settled: R {totalPaid.toFixed(2)}</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E8D9CD] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D5037] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Current Account Balance</span>
            </span>
            <div className={`text-2xl font-serif font-bold mt-2 ${totalBalanceDue > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
              R {totalBalanceDue.toFixed(2)}
            </div>
            <span className="text-[11px] text-[#7A6458] mt-1">
              {totalBalanceDue > 0 ? 'Pending statement settlement' : 'Account fully paid up'}
            </span>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: PLACE NEW ORDER (DUAL-VIEW & REFINED LEDGER)  */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'place-order' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Product Catalog & Fast Ordering */}
            <div className="lg:col-span-8 space-y-5">
              {/* 1. Quick Re-order Banner (if previous order exists) */}
              {latestPreviousOrder && (
                <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-[#2B150A] via-[#3A1E10] to-[#2B150A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-[#DE9E74]/20 relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-48 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#CC8468]/15 via-transparent to-transparent pointer-events-none" />
                  <div className="flex items-center gap-3.5 relative z-10">
                    <div className="w-11 h-11 rounded-2xl bg-[#CC8468]/20 border border-[#CC8468]/40 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-5 h-5 text-[#DE9E74]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#DE9E74]">
                          Instant Standing Re-Order
                        </span>
                        <span className="text-white/40">·</span>
                        <span className="text-xs font-mono text-white/90 font-semibold">
                          #{latestPreviousOrder.orderNumber}
                        </span>
                      </div>
                      <p className="text-xs text-white/80 mt-0.5">
                        Repeat order from {new Date(latestPreviousOrder.createdAt).toLocaleDateString()} ({latestPreviousOrder.items?.length || 0} items · <span className="font-mono font-bold text-white">R {latestPreviousOrder.total?.toFixed(2)}</span>)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRepeatPreviousOrder(latestPreviousOrder)}
                    className="relative z-10 px-4 py-2.5 rounded-xl bg-[#CC8468] hover:bg-[#DE9E74] text-[#1E0F07] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-sm hover:scale-[1.02]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pre-Fill This Order</span>
                  </button>
                </div>
              )}

              {/* 2. Catalog Card Header & Filters */}
              <div className="bg-white rounded-3xl border border-[#E8D9CD] p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8D9CD]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B150A]">
                        Artisanal Wholesale Order Desk
                      </h2>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Live Oven Queue
                      </span>
                    </div>
                    <p className="text-xs text-[#66483B] mt-0.5">
                      Direct bakery dispatch with temp-controlled cold chain logistics across South Africa.
                    </p>
                  </div>

                  {/* View Mode Switcher: Cards vs Matrix */}
                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    <div className="flex items-center bg-[#FBF7F1] p-1 rounded-2xl border border-[#BD896E]/30">
                      <button
                        type="button"
                        onClick={() => setCatalogLayout('cards')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          catalogLayout === 'cards'
                            ? 'bg-[#2B150A] text-white shadow-xs'
                            : 'text-[#66483B] hover:text-[#1E0F07]'
                        }`}
                        title="Visual product cards view"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Visual Cards</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatalogLayout('matrix')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          catalogLayout === 'matrix'
                            ? 'bg-[#2B150A] text-white shadow-xs'
                            : 'text-[#66483B] hover:text-[#1E0F07]'
                        }`}
                        title="Express tabular matrix for high-speed commercial procurement"
                      >
                        <TableProperties className="w-3.5 h-3.5" />
                        <span>Express Matrix</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search & Category Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#8D5037] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search bakery items, sizes, or pack specs..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] placeholder-[#8D5037]/60 focus:outline-hidden focus:border-[#CC8468] transition-colors"
                    />
                    {catalogSearch && (
                      <button
                        type="button"
                        onClick={() => setCatalogSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {['ALL', 'Pastry Sheets', 'Artisanal Roti', 'Tortillas & Wraps'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCatalogCategory(cat)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          catalogCategory === cat
                            ? 'bg-[#CC8468] text-[#1E0F07] shadow-xs'
                            : 'bg-[#FBF7F1] text-[#66483B] hover:text-[#1E0F07]'
                        }`}
                      >
                        {cat === 'ALL' ? 'All Products' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Validation Notice if any */}
                {orderNotice && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-center justify-between gap-2 shadow-2xs animate-fade-in">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{orderNotice}</span>
                    </div>
                    <button onClick={() => setOrderNotice(null)} className="text-amber-700 hover:text-amber-900 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* VIEW A: VISUAL CARDS VIEW                            */}
                {/* ---------------------------------------------------- */}
                {catalogLayout === 'cards' && (
                  <div className="space-y-4 pt-2">
                    {filteredCatalogProducts.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#7A6458] space-y-2">
                        <Package className="w-10 h-10 text-stone-300 mx-auto" />
                        <p>No products match your search or filter.</p>
                        <button
                          onClick={() => {
                            setCatalogSearch('');
                            setCatalogCategory('ALL');
                          }}
                          className="text-xs font-bold text-[#8D5037] underline cursor-pointer"
                        >
                          Clear filters
                        </button>
                      </div>
                    ) : (
                      filteredCatalogProducts.map((prod) => {
                        const sizes = getProductSizes(prod);
                        const activeSize = getSelectedSizeForProduct(prod);
                        const curQtyForActiveSize = orderQuantities[`${prod.id}___${activeSize.id}`] || 0;
                        const prodImg = getProductImage(prod);

                        // Total count across all sizes for this product
                        const totalProdQty = sizes.reduce(
                          (acc, s) => acc + (orderQuantities[`${prod.id}___${s.id}`] || 0),
                          0
                        );

                        return (
                          <div
                            key={prod.id}
                            className="p-4 sm:p-5 rounded-3xl bg-[#FBF7F1]/50 border border-[#E8D9CD] hover:border-[#CC8468]/50 transition-all space-y-4"
                          >
                            {/* Product Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-[#BD896E]/30 p-2 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs group">
                                  <img
                                    src={prodImg}
                                    alt={prod.name}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = '/showcase/savoure-logo.png';
                                    }}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#2B150A]">
                                      {prod.name}
                                    </h3>
                                    {prod.badge && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#CC8468]/20 text-[#8D5037] font-semibold">
                                        {prod.badge}
                                      </span>
                                    )}
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAD8C6] text-[#75412E] font-medium">
                                      {prod.category}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-medium">
                                      100% Halal
                                    </span>
                                  </div>
                                  {prod.description && (
                                    <p className="text-xs text-[#66483B] line-clamp-2 max-w-xl">
                                      {prod.description}
                                    </p>
                                  )}
                                  <div className="text-[11px] text-[#7A6458]">
                                    Dimensions: <strong className="text-[#2B150A] font-semibold">{prod.physicalSize || activeSize.dimensions}</strong> · Pack: <strong className="text-[#2B150A] font-semibold">{prod.packSize || activeSize.packSpec}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Cart status badge */}
                              {totalProdQty > 0 && (
                                <div className="self-start sm:self-center shrink-0">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono shadow-2xs">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{totalProdQty} packs in order</span>
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Size Selection Chips */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#75412E]">
                                <span>1. Select Size & Specification:</span>
                                <span className="text-[#8D5037] font-normal lowercase">click to switch active packaging</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {sizes.map((size) => {
                                  const isSelected = activeSize.id === size.id;
                                  const sizeInCart = orderQuantities[`${prod.id}___${size.id}`] || 0;

                                  return (
                                    <button
                                      key={size.id}
                                      type="button"
                                      onClick={() => handleSelectSize(prod.id, size.id)}
                                      className={`p-3 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                                        isSelected
                                          ? 'bg-white border-[#CC8468] ring-2 ring-[#CC8468]/30 shadow-xs'
                                          : 'bg-white/70 border-[#BD896E]/20 hover:border-[#CC8468]/60 hover:bg-white'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-bold text-xs text-[#1E0F07]">
                                            {size.shortName || size.name}
                                          </span>
                                          {size.badge && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-[#EAD8C6] text-[#75412E]">
                                              {size.badge}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-[#7A6458] mt-1 space-y-0.5">
                                          <div>{size.dimensions}</div>
                                          <div className="text-[#8D5037]">{size.packSpec}</div>
                                        </div>
                                      </div>

                                      <div className="mt-2 pt-2 border-t border-[#E8D9CD] flex items-center justify-between">
                                        <span className="font-mono font-bold text-xs text-[#1E0F07]">
                                          R {size.price.toFixed(2)}
                                        </span>
                                        {sizeInCart > 0 ? (
                                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                                            {sizeInCart} added
                                          </span>
                                        ) : isSelected ? (
                                          <span className="text-[10px] font-bold text-[#CC8468]">Selected</span>
                                        ) : null}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Active Size Stepper & Quick-Case Adds */}
                            <div className="pt-3 border-t border-[#BD896E]/20 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl">
                              <div className="space-y-0.5">
                                <div className="text-xs text-[#1E0F07]">
                                  Active Specification: <strong className="font-bold text-[#8D5037]">{activeSize.name}</strong>
                                </div>
                                <div className="text-[11px] text-[#7A6458]">
                                  {activeSize.dimensions} · {activeSize.packSpec} · <span className="font-mono font-bold text-emerald-800">R {activeSize.price.toFixed(2)} / pack</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center">
                                {/* Quick Case Add Buttons */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] uppercase font-bold text-[#75412E] mr-1 hidden sm:inline">
                                    Quick Case:
                                  </span>
                                  {[5, 10, 25].map((amt) => (
                                    <button
                                      key={amt}
                                      type="button"
                                      onClick={() => handleQuickAddQty(prod.id, activeSize.id, amt)}
                                      className="px-2.5 py-1 rounded-xl bg-[#FBF7F1] hover:bg-[#EAD8C6] border border-[#BD896E]/30 text-[11px] font-mono font-bold text-[#75412E] cursor-pointer transition-colors"
                                      title={`Add ${amt} packs`}
                                    >
                                      +{amt}
                                    </button>
                                  ))}
                                </div>

                                {/* Stepper */}
                                <div className="flex items-center border border-[#BD896E]/40 rounded-full bg-white p-1 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => handleQtyChange(prod.id, activeSize.id, -1)}
                                    disabled={curQtyForActiveSize === 0}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#2B150A] hover:bg-[#EAD8C6] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-12 text-center font-mono font-bold text-xs tabular-nums text-[#2B150A]">
                                    {curQtyForActiveSize}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleQtyChange(prod.id, activeSize.id, 1)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-[#CC8468] hover:bg-[#B86643] text-white cursor-pointer transition-colors shadow-2xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="w-24 text-right font-mono font-bold text-xs text-[#2B150A]">
                                  R {(curQtyForActiveSize * activeSize.price).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* VIEW B: EXPRESS WHOLESALE MATRIX                     */}
                {/* ---------------------------------------------------- */}
                {catalogLayout === 'matrix' && (
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E8D9CD] text-[10px] font-bold uppercase tracking-wider text-[#75412E] bg-[#FBF7F1]/60">
                          <th className="py-3 px-3">Product</th>
                          <th className="py-3 px-3">Size & Dimension</th>
                          <th className="py-3 px-3">Pack Spec</th>
                          <th className="py-3 px-3 text-right">Unit Price</th>
                          <th className="py-3 px-3 text-center">Quick Case</th>
                          <th className="py-3 px-3 text-center">Order Qty</th>
                          <th className="py-3 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8D9CD]/50">
                        {filteredCatalogProducts.flatMap((prod) => {
                          const sizes = getProductSizes(prod);
                          const prodImg = getProductImage(prod);

                          return sizes.map((size, idx) => {
                            const itemKey = `${prod.id}___${size.id}`;
                            const qty = orderQuantities[itemKey] || 0;

                            return (
                              <tr
                                key={itemKey}
                                className={`hover:bg-[#FBF7F1]/60 transition-colors ${
                                  qty > 0 ? 'bg-amber-50/40' : ''
                                }`}
                              >
                                <td className="py-3 px-3 font-medium text-[#2B150A]">
                                  <div className="flex items-center gap-2.5">
                                    {idx === 0 ? (
                                      <img
                                        src={prodImg}
                                        alt={prod.name}
                                        className="w-8 h-8 rounded-lg object-contain bg-white border border-[#BD896E]/20 p-0.5 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-8 h-8" />
                                    )}
                                    <div>
                                      <div className="font-semibold text-xs text-[#2B150A]">
                                        {prod.name}
                                      </div>
                                      {idx === 0 && (
                                        <div className="text-[10px] text-[#7A6458]">
                                          {prod.category}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-xs text-[#1E0F07]">
                                    {size.shortName || size.name}
                                  </div>
                                  <div className="text-[10px] text-[#8D5037]">{size.dimensions}</div>
                                </td>
                                <td className="py-3 px-3 text-[#66483B] text-[11px]">
                                  {size.packSpec}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-semibold text-[#1E0F07]">
                                  R {size.price.toFixed(2)}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <div className="inline-flex items-center gap-1">
                                    {[5, 10, 25].map((amt) => (
                                      <button
                                        key={amt}
                                        type="button"
                                        onClick={() => handleQuickAddQty(prod.id, size.id, amt)}
                                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-[#EAD8C6] border border-[#BD896E]/30 text-[10px] font-mono font-bold text-[#75412E] cursor-pointer"
                                      >
                                        +{amt}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <div className="inline-flex items-center border border-[#BD896E]/40 rounded-full bg-white px-1 py-0.5 shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => handleQtyChange(prod.id, size.id, -1)}
                                      disabled={qty === 0}
                                      className="w-5 h-5 flex items-center justify-center text-xs text-[#2B150A] disabled:opacity-30 cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-mono font-bold text-xs">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleQtyChange(prod.id, size.id, 1)}
                                      className="w-5 h-5 flex items-center justify-center text-xs text-[#CC8468] font-bold cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-[#2B150A]">
                                  R {(qty * size.price).toFixed(2)}
                                </td>
                              </tr>
                            );
                          });
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sticky Wholesale Order Ledger & Dispatch Form */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8D9CD] p-6 shadow-sm sticky top-28 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8D9CD]">
                <h3 className="font-serif text-lg font-bold text-[#2B150A] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#CC8468]" />
                  <span>Wholesale Order Ledger</span>
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#EAD8C6] text-[#75412E]">
                  {selectedOrderItems.length} lines · {totalPackCount} packs
                </span>
              </div>

              {/* Items List */}
              {selectedOrderItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7A6458] space-y-2">
                  <Package className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="font-semibold text-[#2B150A]">Your order ledger is empty.</p>
                  <p className="text-[11px] text-[#A69385]">Pick your packaging size and click + to add wholesale cases.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-[#FBF7F1]">
                  {Object.entries(orderQuantities).map(([itemKey, qty]) => {
                    if (qty <= 0) return null;
                    const [prodId, sizeId] = itemKey.includes('___') ? itemKey.split('___') : [itemKey, ''];
                    const prod = (products || []).find((p) => p.id === prodId);
                    if (!prod) return null;
                    const sizes = getProductSizes(prod);
                    const size = sizes.find((s) => s.id === sizeId) || sizes.find((s) => s.isDefault) || sizes[0];
                    const unitPrice = size ? size.price : (prod.unitPrice || 35.00);
                    const prodImg = getProductImage(prod);

                    return (
                      <div key={itemKey} className="pt-2.5 text-xs flex items-start justify-between gap-2.5">
                        <img
                          src={prodImg}
                          alt={prod.name}
                          className="w-9 h-9 rounded-xl object-contain bg-[#FBF7F1] border border-[#BD896E]/20 p-0.5 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/showcase/savoure-logo.png';
                          }}
                        />
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="font-semibold text-[#2B150A] truncate leading-tight">
                            {prod.name}
                          </div>
                          <div className="text-[11px] text-[#8D5037] font-medium font-mono truncate">
                            {size?.shortName || size?.name} ({size?.dimensions})
                          </div>
                          <div className="text-[10px] text-[#7A6458]">
                            {qty} × R {unitPrice.toFixed(2)} / pack
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="font-mono font-bold text-[#2B150A]">
                            R {(qty * unitPrice).toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(prod.id, size?.id || '', -1)}
                              className="w-5 h-5 rounded-full bg-[#FBF7F1] hover:bg-[#EAD8C6] flex items-center justify-center font-mono font-bold text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs font-bold px-1">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(prod.id, size?.id || '', 1)}
                              className="w-5 h-5 rounded-full bg-[#CC8468] text-white flex items-center justify-center font-mono font-bold text-xs cursor-pointer"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveOrderItem(itemKey)}
                              className="w-5 h-5 ml-1 text-stone-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                              title="Remove item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Delivery Settings & Schedule Presets */}
              <form onSubmit={handlePlaceOrderSubmit} className="space-y-4 pt-3 border-t border-[#E8D9CD]">
                {/* Schedule Presets */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#75412E] mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8D5037]" />
                    <span>Requested Delivery Schedule</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => handleSelectDeliveryPreset('tomorrow')}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-center border cursor-pointer transition-colors ${
                        deliveryPreset === 'tomorrow'
                          ? 'bg-[#2B150A] text-white border-[#2B150A]'
                          : 'bg-[#FBF7F1] text-[#66483B] border-[#BD896E]/20 hover:bg-[#EAD8C6]'
                      }`}
                    >
                      Tomorrow Morning
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDeliveryPreset('twoDays')}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-center border cursor-pointer transition-colors ${
                        deliveryPreset === 'twoDays'
                          ? 'bg-[#2B150A] text-white border-[#2B150A]'
                          : 'bg-[#FBF7F1] text-[#66483B] border-[#BD896E]/20 hover:bg-[#EAD8C6]'
                      }`}
                    >
                      In 2 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDeliveryPreset('threeDays')}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-center border cursor-pointer transition-colors ${
                        deliveryPreset === 'threeDays'
                          ? 'bg-[#2B150A] text-white border-[#2B150A]'
                          : 'bg-[#FBF7F1] text-[#66483B] border-[#BD896E]/20 hover:bg-[#EAD8C6]'
                      }`}
                    >
                      In 3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDeliveryPreset('custom')}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-center border cursor-pointer transition-colors ${
                        deliveryPreset === 'custom'
                          ? 'bg-[#2B150A] text-white border-[#2B150A]'
                          : 'bg-[#FBF7F1] text-[#66483B] border-[#BD896E]/20 hover:bg-[#EAD8C6]'
                      }`}
                    >
                      Custom Date
                    </button>
                  </div>

                  <input
                    type="date"
                    required
                    value={requestedDeliveryDate}
                    onChange={(e) => {
                      setRequestedDeliveryDate(e.target.value);
                      setDeliveryPreset('custom');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                  />
                </div>

                {/* Delivery Location */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#75412E] mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8D5037]" />
                    <span>Store Delivery Location</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter commercial branch or kitchen address"
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                  />
                </div>

                {/* Cold-Chain Fleet Delivery Toggle */}
                <div className="p-3 rounded-2xl bg-[#FBF7F1] border border-[#BD896E]/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#CC8468] shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#2B150A]">
                        Refrigerated Cold Chain (-18°C / +4°C)
                      </div>
                      <div className="text-[10px] text-[#7A6458]">
                        Nationwide dedicated temp-controlled fleet
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={coldChainRequired}
                    onChange={(e) => setColdChainRequired(e.target.checked)}
                    className="w-4 h-4 text-[#CC8468] rounded accent-[#CC8468] cursor-pointer"
                  />
                </div>

                {/* Special Bakery Instructions */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#75412E] mb-1">
                    Special Bakery / Oven Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Early morning receiving, please pack in double insulated cold crate..."
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                  />
                </div>

                {/* Transparent Ledger Breakdown & Zero-Rated VAT */}
                <div className="pt-3 border-t border-[#E8D9CD] space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#66483B]">
                    <span>Total Packs / Cases</span>
                    <span className="font-mono font-semibold">{totalPackCount} packs</span>
                  </div>
                  <div className="flex justify-between text-[#66483B]">
                    <span>Estimated Wholesale Weight</span>
                    <span className="font-mono font-semibold">~{estimatedWholesaleWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between text-[#66483B]">
                    <span>Cold-Chain Delivery</span>
                    <span className="font-mono text-emerald-700 font-semibold">Included (Free)</span>
                  </div>
                  <div className="flex justify-between text-[#66483B]">
                    <span>VAT (0% - Staple Food Exemption)</span>
                    <span className="font-mono font-semibold text-emerald-700">R 0.00 (Zero-Rated)</span>
                  </div>
                  <div className="flex justify-between text-base font-serif font-bold text-[#2B150A] pt-2 border-t border-[#E8D9CD]">
                    <span>Total Order Amount</span>
                    <span className="font-mono text-[#8D5037]">R {orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOrder || selectedOrderItems.length === 0}
                  className="w-full py-3.5 rounded-full bg-[#CC8468] hover:bg-[#B86643] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:-translate-y-0.5"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmittingOrder
                      ? 'Submitting to Live Oven Queue...'
                      : `Submit Order (R ${orderTotal.toFixed(2)})`}
                  </span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8D5037]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Submitting transmits directly to the bakery oven dispatch queue</span>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 1.5: REPORTS & AUDIT STATEMENTS (WEEKLY, MONTHLY, */}
        {/* 3-MONTH, 6-MONTH, YEARLY, AND PAST ARCHIVES)         */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'reports' && (
          <MerchantReportsTab
            currentUser={currentUser}
            customerDisplayName={customerDisplayName}
            currentBranch={currentBranch}
            company={company}
            myOrdersList={myOrdersList}
            merchantInvoices={merchantInvoices}
            merchantReports={merchantReports}
            saveMerchantReport={saveMerchantReport}
            deleteMerchantReport={deleteMerchantReport}
          />
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: MY ORDERS                                     */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'my-orders' && (
          <div className="bg-white rounded-3xl border border-[#E8D9CD] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8D9CD]">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B150A]">
                  My Bakery Orders ({myOrdersList.length})
                </h2>
                <p className="text-xs text-[#66483B]">
                  Live status tracking for wholesale delivery orders from dispatch to delivery.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('place-order')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#CC8468] hover:bg-[#B86643] text-white font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Place New Order</span>
              </button>
            </div>

            {myOrdersList.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Package className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="font-serif text-lg text-[#2B150A]">No orders placed yet</h3>
                <p className="text-xs text-[#7A6458] max-w-sm mx-auto">
                  Ready to restock your store? Switch to the "Place New Order" tab to request fresh batches.
                </p>
                <button
                  onClick={() => setActiveTab('place-order')}
                  className="px-5 py-2 rounded-full bg-[#2B150A] text-white text-xs font-semibold"
                >
                  Open Order Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrdersList.map((ord) => {
                  const statusColors: Record<string, string> = {
                    PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
                    ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-300',
                    PREPARING: 'bg-purple-100 text-purple-800 border-purple-300',
                    DISPATCHED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                    DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    CANCELLED: 'bg-rose-100 text-rose-800 border-rose-300',
                  };

                  return (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl bg-[#FBF7F1]/80 border border-[#E8D9CD] space-y-4 hover:shadow-xs transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8D9CD]/60">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-[#2B150A]">
                              {ord.orderNumber}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                                statusColors[ord.status] || 'bg-stone-100 text-stone-800 border-stone-300'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-xs text-[#66483B] flex items-center gap-2">
                            <span>Placed: {new Date(ord.createdAt).toLocaleDateString()}</span>
                            <span>·</span>
                            <span>Delivery Target: {ord.requestedDeliveryDate}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-[#66483B] block">Order Amount</span>
                          <span className="font-mono text-lg font-bold text-[#8D5037]">
                            R {ord.total.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {ord.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white border border-[#E8D9CD]/70 text-xs space-y-0.5"
                          >
                            <div className="font-semibold text-[#2B150A] truncate">{it.productName}</div>
                            <div className="text-[11px] text-[#7A6458] flex justify-between">
                              <span>Qty: {it.quantity} ({it.packSize})</span>
                              <span className="font-mono font-bold">R {it.lineTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {ord.specialInstructions && (
                        <div className="p-3 rounded-xl bg-white border border-[#E8D9CD]/60 text-xs text-[#66483B]">
                          <strong>Instructions:</strong> {ord.specialInstructions}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#7A6458]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#8D5037]" />
                          <span>{ord.deliveryAddress || 'Standard Delivery Location'}</span>
                        </div>

                        <a
                          href={`https://wa.me/${SHOWCASE_CONTACT.whatsappNumber}?text=${encodeURIComponent(
                            `Hello Savouré Bakery Desk, regarding Order ${ord.orderNumber} for ${ord.merchantStoreName || ord.merchantName}...`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white font-bold text-[10px] uppercase tracking-wider hover:bg-[#20ba59]"
                        >
                          <MessageCircle className="w-3 h-3 fill-white" />
                          <span>WhatsApp Desk</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: TAX INVOICES & STATEMENTS                     */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-3xl border border-[#E8D9CD] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8D9CD]">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B150A]">
                  Tax Invoices & Statement History
                </h2>
                <p className="text-xs text-[#66483B]">
                  Official SARS-compliant tax invoices issued for your commercial wholesale purchases.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-[#FBF7F1] p-1 rounded-xl border border-[#E8D9CD]">
                {(['ALL', 'Paid', 'Pending', 'Overdue'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setInvoiceStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      invoiceStatusFilter === st
                        ? 'bg-[#CC8468] text-white shadow-2xs'
                        : 'text-[#66483B] hover:text-[#2B150A]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {merchantInvoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7A6458]">
                No invoices recorded for your merchant profile.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FBF7F1] text-[#8D5037] uppercase text-[10px] tracking-wider border-b border-[#E8D9CD]">
                    <tr>
                      <th className="py-3 px-4 font-bold">Invoice #</th>
                      <th className="py-3 px-4 font-bold">Issue Date</th>
                      <th className="py-3 px-4 font-bold">Due Date</th>
                      <th className="py-3 px-4 font-bold">Total (ZAR)</th>
                      <th className="py-3 px-4 font-bold">Balance Due</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D9CD]/50">
                    {merchantInvoices
                      .filter((i) => invoiceStatusFilter === 'ALL' || i.status === invoiceStatusFilter)
                      .map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#FBF7F1]/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#2B150A]">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3.5 px-4 text-[#66483B]">{inv.issueDate}</td>
                          <td className="py-3.5 px-4 text-[#66483B]">{inv.dueDate}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#2B150A]">
                            R {inv.grandTotal.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#8D5037]">
                            R {inv.balanceDue.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                inv.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inv.status === 'Overdue'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceForPrint(inv)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FBF7F1] hover:bg-[#EAD8C6] text-[#2B150A] border border-[#BD896E]/30 font-semibold text-xs cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View / Print</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: DELIVERY NOTES & PODS                         */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'delivery-notes' && (
          <div className="bg-white rounded-3xl border border-[#E8D9CD] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8D9CD]">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B150A]">
                  Delivery Notes & Proof of Delivery (POD)
                </h2>
                <p className="text-xs text-[#66483B]">
                  View dispatched bakery consignments and sign digital PODs on your phone or tablet.
                </p>
              </div>
            </div>

            {merchantDeliveryNotes.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7A6458]">
                No delivery notes recorded for your store.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {merchantDeliveryNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-5 rounded-2xl bg-[#FBF7F1] border border-[#E8D9CD] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-[#2B150A]">
                        {note.deliveryNoteNumber || note.id}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          note.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {note.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#66483B] space-y-1">
                      <div><strong>Date:</strong> {note.deliveryDate}</div>
                      <div><strong>Items:</strong> {note.items?.length || 0} consignment lines</div>
                      <div><strong>Driver:</strong> {note.driverName || 'Savouré Dispatch Fleet'}</div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[#E8D9CD]/60">
                      {note.podSignature ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>POD Signed: {note.podReceivedBy}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPodNote(note);
                            setRecipientName('');
                            setPodNotes('');
                            setPodError(null);
                            clearCanvas();
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#CC8468] hover:bg-[#B86643] text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-2xs"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>Sign Digital POD</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedDeliveryNoteForView(note)}
                        className="text-xs text-[#8D5037] hover:underline font-semibold"
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 4. DIGITAL POD SIGNATURE MODAL */}
      {podNote && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8D9CD]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2B150A]">
                  Digital Proof of Delivery (POD)
                </h3>
                <p className="text-xs text-[#66483B]">Consignment #{podNote.deliveryNoteNumber || podNote.id}</p>
              </div>
              <button onClick={() => setPodNote(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {podError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
                {podError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#75412E] mb-1">
                  Recipient Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Fatima Adams (Receiving Bay Manager)"
                  className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#75412E]">
                    Digital Signature <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] text-[#8D5037] hover:underline"
                  >
                    Clear Canvas
                  </button>
                </div>
                <div className="border border-[#BD896E]/40 rounded-2xl bg-white overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 bg-white cursor-crosshair touch-none"
                  />
                </div>
                <span className="text-[10px] text-stone-400 block mt-1">Sign with finger or stylus</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E8D9CD] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPodNote(null)}
                className="px-4 py-2.5 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePodSignature}
                className="px-6 py-2.5 rounded-full bg-[#CC8468] hover:bg-[#B86643] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
              >
                Confirm & Submit POD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Receipt Modal */}
      {confirmedOrder && (
        <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8D9CD] max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E8D9CD]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FBF7F1] border border-[#BD896E]/30 p-2 flex items-center justify-center shrink-0">
                  <img
                    src="/showcase/savoure-logo.png"
                    alt="Savouré Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Oven Queue Enqueued
                    </span>
                    <span className="text-xs font-mono font-bold text-[#8D5037]">
                      #{confirmedOrder.orderNumber}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2B150A] mt-0.5">
                    Wholesale Order Confirmed
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmedOrder(null);
                  setActiveTab('my-orders');
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Merchant & Dispatch Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FBF7F1] p-4 rounded-2xl border border-[#BD896E]/20">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#75412E]">Merchant / Store</div>
                <div className="font-bold text-[#2B150A]">{confirmedOrder.merchantStoreName}</div>
                <div className="text-[#66483B]">{confirmedOrder.branch || 'Main Branch'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#75412E]">Delivery Schedule</div>
                <div className="font-bold text-[#2B150A]">{confirmedOrder.requestedDeliveryDate}</div>
                <div className="text-[#66483B] truncate">{confirmedOrder.deliveryAddress}</div>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#75412E] mb-2 flex items-center justify-between">
                <span>Itemized Bakery Batch</span>
                <span className="font-mono text-xs">{confirmedOrder.items?.length || 0} line items</span>
              </div>
              <div className="border border-[#E8D9CD] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FBF7F1] text-[10px] font-bold uppercase text-[#75412E] border-b border-[#E8D9CD]">
                    <tr>
                      <th className="py-2.5 px-3">Item & Pack Spec</th>
                      <th className="py-2.5 px-3 text-center">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D9CD]/50">
                    {confirmedOrder.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#FBF7F1]/30">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-[#2B150A]">{item.productName}</div>
                          <div className="text-[10px] text-[#8D5037]">{item.packSize}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#2B150A]">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#66483B]">
                          R {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2B150A]">
                          R {item.lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Totals */}
            <div className="pt-2 border-t border-[#E8D9CD] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#66483B]">
                <span>Items Subtotal</span>
                <span className="font-mono font-semibold">R {confirmedOrder.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#66483B]">
                <span>Refrigerated Cold Chain Fleet</span>
                <span className="font-mono text-emerald-700 font-semibold">Included (Free)</span>
              </div>
              <div className="flex justify-between text-[#66483B]">
                <span>VAT (0% - Staple Food Exemption)</span>
                <span className="font-mono text-emerald-700 font-semibold">R 0.00 (Zero-Rated)</span>
              </div>
              <div className="flex justify-between text-base font-serif font-bold text-[#2B150A] pt-2 border-t border-[#E8D9CD]">
                <span>Grand Total (ZAR)</span>
                <span className="font-mono text-[#8D5037]">R {confirmedOrder.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#FBF7F1] hover:bg-[#EAD8C6] border border-[#BD896E]/30 text-[#2B150A] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Order Receipt</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`https://wa.me/27613645712?text=${encodeURIComponent(
                    `Hello Savouré Bakery Dispatch, I have placed Wholesale Order #${confirmedOrder.orderNumber} for ${confirmedOrder.merchantStoreName} (Total R ${confirmedOrder.total?.toFixed(2)}). Please confirm oven baking schedule.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Dispatch</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmedOrder(null);
                    setActiveTab('my-orders');
                  }}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-[#2B150A] hover:bg-[#1E0F07] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  View in My Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Print Modal */}
      {selectedInvoiceForPrint && (
        <InvoicePrintModal
          invoice={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}
    </div>
  );
};
