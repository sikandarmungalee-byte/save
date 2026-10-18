import React, { useState, useMemo, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { Invoice, DeliveryNote, MerchantOrderItem } from '../../types/erp';
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
  Send
} from 'lucide-react';
import { InvoicePrintModal } from '../InvoicePrintModal';
import { SHOWCASE_CONTACT } from '../showcase/showcaseData';

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
    savePOD
  } = useERP();

  // Navigation tab: 'place-order' | 'my-orders' | 'invoices' | 'delivery-notes'
  const [activeTab, setActiveTab] = useState<'place-order' | 'my-orders' | 'invoices' | 'delivery-notes'>('place-order');

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
  // NEW ORDER FORM STATE
  // ------------------------------------------------------------------
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
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

  // Financial statistics
  const totalBilled = merchantInvoices.reduce((acc, i) => acc + (Number(i.grandTotal) || 0), 0);
  const totalPaid = merchantInvoices.reduce((acc, i) => acc + (Number(i.amountPaid) || 0), 0);
  const totalBalanceDue = merchantInvoices.reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0);
  const pendingOrdersCount = myOrdersList.filter((o) => o.status === 'PENDING' || o.status === 'ACCEPTED' || o.status === 'PREPARING').length;

  // Ordering catalog items (from ERP products)
  const orderableProducts = useMemo(() => {
    return (products || []).filter((p) => p.unitPrice > 0 || p.showcase !== false);
  }, [products]);

  // Calculate order items and total
  const selectedOrderItems: MerchantOrderItem[] = useMemo(() => {
    const list: MerchantOrderItem[] = [];
    Object.entries(orderQuantities).forEach(([prodId, qty]) => {
      if (qty > 0) {
        const prod = orderableProducts.find((p) => p.id === prodId);
        if (prod) {
          const unitPrice = prod.unitPrice || 35.00;
          list.push({
            productId: prod.id,
            productName: prod.name,
            packSize: prod.packSize || '12-Pack / Catering Box',
            quantity: qty,
            unitPrice,
            lineTotal: qty * unitPrice,
          });
        }
      }
    });
    return list;
  }, [orderQuantities, orderableProducts]);

  const orderSubtotal = selectedOrderItems.reduce((acc, it) => acc + it.lineTotal, 0);
  const orderTotal = orderSubtotal; // Zero-rated / staple exemption default

  const handleQtyChange = (prodId: string, delta: number) => {
    setOrderQuantities((prev) => {
      const cur = prev[prodId] || 0;
      const next = Math.max(0, cur + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      }
      return { ...prev, [prodId]: next };
    });
  };

  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrderItems.length === 0) {
      alert('Please select at least one bakery product to place an order.');
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
        specialInstructions: orderNotes.trim(),
      });

      setOrderQuantities({});
      setOrderNotes('');
      setOrderSuccessBanner(
        `🎉 Order #${created.orderNumber} successfully submitted! The bakery dispatch desk has received your order and triggered live push notifications.`
      );
      setActiveTab('my-orders');
      setTimeout(() => setOrderSuccessBanner(null), 8000);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit order. Please try again or WhatsApp dispatch.');
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

          <div className="flex items-center gap-3">
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
        {/* TAB 1: PLACE NEW ORDER                               */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'place-order' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Product Selector Grid */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-3xl border border-[#E8D9CD] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8D9CD]">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B150A]">
                      Bakery Order Catalog
                    </h2>
                    <p className="text-xs text-[#66483B] mt-0.5">
                      Select daily pastry batches, rotis, tortilla wraps, and sheet quantities for wholesale dispatch.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EAD8C6] text-[#75412E] border border-[#BD896E]/30">
                      100% Halal Certified Kitchen
                    </span>
                  </div>
                </div>

                {/* Product List */}
                <div className="divide-y divide-[#E8D9CD]/60 mt-4">
                  {orderableProducts.map((prod) => {
                    const curQty = orderQuantities[prod.id] || 0;
                    const unitPrice = prod.unitPrice || 35.00;

                    return (
                      <div
                        key={prod.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FBF7F1]/50 p-2 rounded-2xl transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-[#EAD8C6]/50 border border-[#BD896E]/30 flex items-center justify-center p-2 shrink-0">
                            <Package className="w-8 h-8 text-[#8D5037]" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-serif text-base font-bold text-[#2B150A]">
                                {prod.name}
                              </h3>
                              {prod.badge && (
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#CC8468]/20 text-[#8D5037] font-semibold">
                                  {prod.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#7A6458] flex flex-wrap items-center gap-2">
                              <span>Spec: {prod.packSize || 'Commercial Pack'}</span>
                              <span>·</span>
                              <span className="font-mono text-emerald-800 font-bold">R {unitPrice.toFixed(2)} / pack</span>
                            </div>
                            {prod.description && (
                              <p className="text-[11px] text-[#66483B] line-clamp-1 max-w-md">
                                {prod.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="flex items-center border border-[#BD896E]/40 rounded-full bg-white p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(prod.id, -1)}
                              disabled={curQty === 0}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[#2B150A] hover:bg-[#EAD8C6] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-center font-mono font-bold text-xs tabular-nums text-[#2B150A]">
                              {curQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(prod.id, 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#CC8468] hover:bg-[#B86643] text-white cursor-pointer transition-colors shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="w-20 text-right font-mono font-bold text-xs text-[#2B150A]">
                            R {(curQty * unitPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Order Summary & Checkout Card */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8D9CD] p-6 shadow-sm sticky top-28 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8D9CD]">
                <h3 className="font-serif text-lg font-bold text-[#2B150A] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#CC8468]" />
                  <span>Order Summary</span>
                </h3>
                <span className="text-xs font-mono font-bold text-[#8D5037]">
                  {selectedOrderItems.length} items
                </span>
              </div>

              {selectedOrderItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7A6458] space-y-2">
                  <Package className="w-10 h-10 text-stone-300 mx-auto" />
                  <p>Your order is empty.</p>
                  <p className="text-[11px] text-[#A69385]">Add packs using the plus (+) buttons.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {selectedOrderItems.map((it) => (
                    <div key={it.productId} className="flex items-center justify-between text-xs py-1.5 border-b border-[#FBF7F1]">
                      <div>
                        <div className="font-semibold text-[#2B150A]">{it.productName}</div>
                        <div className="text-[10px] text-[#7A6458] font-mono">
                          {it.quantity} × R {it.unitPrice.toFixed(2)} ({it.packSize})
                        </div>
                      </div>
                      <div className="font-mono font-bold text-[#2B150A]">
                        R {it.lineTotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery Settings */}
              <form onSubmit={handlePlaceOrderSubmit} className="space-y-4 pt-3 border-t border-[#E8D9CD]">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#75412E] mb-1">
                    Requested Delivery Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#8D5037] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={requestedDeliveryDate}
                      onChange={(e) => setRequestedDeliveryDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#75412E] mb-1">
                    Delivery / Drop-Off Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#8D5037] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter store or kitchen address"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#75412E] mb-1">
                    Special Bakery Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Please pack in double insulated cold crate..."
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                  />
                </div>

                {/* Subtotal & Total */}
                <div className="pt-3 border-t border-[#E8D9CD] space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#66483B]">
                    <span>Items Subtotal</span>
                    <span className="font-mono">R {orderSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#66483B]">
                    <span>Delivery (Cold Chain Nationwide)</span>
                    <span className="font-mono text-emerald-700 font-semibold">Included</span>
                  </div>
                  <div className="flex justify-between text-base font-serif font-bold text-[#2B150A] pt-2 border-t border-[#E8D9CD]">
                    <span>Estimated Total</span>
                    <span className="font-mono text-[#8D5037]">R {orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOrder || selectedOrderItems.length === 0}
                  className="w-full py-3.5 rounded-full bg-[#CC8468] hover:bg-[#B86643] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:-translate-y-0.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingOrder ? 'Submitting Order...' : 'Submit Order to Bakery Dispatch'}</span>
                </button>

                <p className="text-[10px] text-center text-[#8D5037] leading-relaxed">
                  🔔 Submitting triggers instant real-time push alerts to the bakery oven dispatch desk.
                </p>
              </form>
            </div>
          </div>
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
