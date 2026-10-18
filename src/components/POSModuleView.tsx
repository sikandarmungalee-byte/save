import React, { useState, useMemo, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import { Product, POSCartItem, POSTransaction, Customer } from '../types/erp';
import {
  BarcodeScanner,
  parseBarcodeMetadata,
  SAMPLE_SOUTH_AFRICAN_BARCODES
} from './BarcodeScanner';
import {
  Store,
  ShoppingCart,
  Search,
  Package,
  Plus,
  Minus,
  Trash2,
  Barcode,
  Camera,
  Printer,
  CreditCard,
  Banknote,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  User as UserIcon,
  X,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  ChevronDown,
  Building2,
  DollarSign,
  Tag,
  Percent
} from 'lucide-react';

interface POSModuleViewProps {
  initialSubcategoryId?: string | null;
}

export const POSModuleView: React.FC<POSModuleViewProps> = ({ initialSubcategoryId }) => {
  const {
    products,
    customers,
    company,
    currentUser,
    posTransactions,
    posSessions,
    activePOSSession,
    openPOSSession,
    closePOSSession,
    createPOSTransaction,
    refundPOSTransaction,
  } = useERP();

  // Active view tab: 'till' | 'history' | 'session'
  const [activeTab, setActiveTab] = useState<'till' | 'history' | 'session'>('till');

  // Search & Filter in Product Grid
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Cart State
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('Walk-in Retail Customer');
  const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(0);
  const [isVatZeroRated, setIsVatZeroRated] = useState<boolean>(true); // SA Staple Pastry default

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'EFT' | 'ON_ACCOUNT'>('CASH');
  const [amountTenderedStr, setAmountTenderedStr] = useState<string>('');
  const [cardAuthRef, setCardAuthRef] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastCompletedTx, setLastCompletedTx] = useState<POSTransaction | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [openingFloatInput, setOpeningFloatInput] = useState<string>('500');
  const [closingFloatInput, setClosingFloatInput] = useState<string>('500');
  const [sessionNotesInput, setSessionNotesInput] = useState<string>('');
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Cart Totals
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.lineTotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (subtotal * orderDiscountPercent) / 100;
  }, [subtotal, orderDiscountPercent]);

  const vatRate = isVatZeroRated ? 0 : (company.vatRate || 15) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const vatAmount = taxableAmount * vatRate;
  const grandTotal = taxableAmount + vatAmount;

  const tenderedNumeric = parseFloat(amountTenderedStr) || 0;
  const changeDue = Math.max(0, tenderedNumeric - grandTotal);

  // Add item to cart
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newQty = existing.quantity + 1;
        const lineTotal = newQty * existing.unitPrice * (1 - existing.discountPercent / 100);
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          lineTotal,
        };
        return updated;
      } else {
        const newItem: POSCartItem = {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          barcode: product.barcode,
          category: product.category,
          packSize: product.packSize,
          unitPrice: product.unitPrice,
          quantity: 1,
          discountPercent: 0,
          lineTotal: product.unitPrice,
        };
        return [newItem, ...prev];
      }
    });
  };

  // Update item quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              lineTotal: newQty * item.unitPrice * (1 - item.discountPercent / 100),
            };
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[];
    });
  };

  // Remove item
  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Clear cart
  const handleClearCart = () => {
    setCart([]);
    setAmountTenderedStr('');
    setCardAuthRef('');
    setSaleNotes('');
  };

  // Scan detection: Find product and add to cart
  // Scan detection: Find product and add to cart with South African GS1 & UPC support
  const handleBarcodeScanned = (barcode: string) => {
    const clean = barcode.trim().replace(/[-\s]/g, '');
    let matched = products.find(
      (p) =>
        (p.barcode && p.barcode.trim().replace(/[-\s]/g, '') === clean) ||
        p.sku.toLowerCase() === clean.toLowerCase() ||
        p.id.toLowerCase() === clean.toLowerCase()
    );

    // EAN-13 <-> UPC-A translation
    if (!matched && clean.length === 12) {
      matched = products.find((p) => p.barcode === `0${clean}`);
    } else if (!matched && clean.length === 13 && clean.startsWith('0')) {
      matched = products.find((p) => p.barcode === clean.slice(1));
    }

    // Check sample South African barcodes
    if (!matched) {
      const sample = SAMPLE_SOUTH_AFRICAN_BARCODES.find((s) => s.barcode === clean);
      if (sample) {
        const existingByName = products.find(
          (p) =>
            p.name.toLowerCase().includes(sample.name.slice(0, 15).toLowerCase()) ||
            p.category === sample.category
        );
        if (existingByName) {
          matched = existingByName;
        } else {
          matched = {
            id: `prod_scan_${clean}`,
            name: sample.name,
            sku: `SKU-${clean.slice(-4)}`,
            category: sample.category || 'Bakery & Pastry',
            unitPrice: 42.5,
            costPrice: 22.0,
            stockOnHand: 150,
            barcode: clean,
            vatApplicable: false,
          } as Product;
        }
      }
    }

    if (matched) {
      handleAddToCart(matched);
      setBannerNotice(`Scanned & Added: "${matched.name}" (R${matched.unitPrice.toFixed(2)})`);
      setTimeout(() => setBannerNotice(null), 3500);
    } else {
      setBannerNotice(`Barcode ${barcode} not found in catalog. You can select it directly or add barcode.`);
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  // Quick Cash Tender shortcuts
  const handleQuickCash = (amount: number) => {
    setAmountTenderedStr(amount.toFixed(2));
  };

  // Submit Transaction
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setBannerNotice('Cart is empty. Please select bakery items to checkout.');
      setTimeout(() => setBannerNotice(null), 3000);
      return;
    }

    if (paymentMethod === 'CASH' && tenderedNumeric < grandTotal) {
      setBannerNotice(`Insufficient cash tendered. Total is R${grandTotal.toFixed(2)}, but tendered is R${tenderedNumeric.toFixed(2)}.`);
      setTimeout(() => setBannerNotice(null), 4000);
      return;
    }

    try {
      const selectedCust = customers.find((c) => c.id === selectedCustomerId);
      const custName = selectedCust ? selectedCust.registeredName : customCustomerName;

      const tx = await createPOSTransaction({
        sessionId: activePOSSession?.id,
        cashierId: currentUser?.id || 'usr_master_admin',
        cashierName: currentUser?.name || 'Master Admin',
        branch: currentUser?.branch || 'Main Bakery Counter',
        customerId: selectedCustomerId || undefined,
        customerName: custName,
        items: cart,
        subtotal,
        discountTotal: discountAmount,
        vat: vatAmount,
        total: grandTotal,
        paymentMethod,
        amountTendered: paymentMethod === 'CASH' ? tenderedNumeric : grandTotal,
        changeDue: paymentMethod === 'CASH' ? changeDue : 0,
        cardReference: paymentMethod === 'CARD' ? cardAuthRef : undefined,
        notes: saleNotes || undefined,
        status: 'COMPLETED',
      });

      setLastCompletedTx(tx);
      setIsReceiptModalOpen(true);
      handleClearCart();
      setBannerNotice(`Sale completed successfully! Receipt #${tx.receiptNumber}`);
      setTimeout(() => setBannerNotice(null), 5000);
    } catch (err: any) {
      setBannerNotice(err.message || 'Failed to complete transaction.');
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  // Till Session Opening & Closing
  const handleOpenTill = async () => {
    const openingFloat = parseFloat(openingFloatInput) || 0;
    try {
      await openPOSSession(openingFloat, sessionNotesInput);
      setIsSessionModalOpen(false);
      setBannerNotice(`Till opened successfully with opening float R${openingFloat.toFixed(2)}`);
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err: any) {
      setBannerNotice(err.message || 'Failed to open till');
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  const handleCloseTill = async () => {
    const closingFloat = parseFloat(closingFloatInput) || 0;
    try {
      await closePOSSession(closingFloat, sessionNotesInput);
      setIsSessionModalOpen(false);
      setBannerNotice(`Till closed. End-of-Day Z-Report archived.`);
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err: any) {
      setBannerNotice(err.message || 'Failed to close till');
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Till Session Bar */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-4 sm:p-5 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#2C211B] border border-[#4A392F] flex items-center justify-center text-[#DE9E74] shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-serif font-bold text-white tracking-tight">
                  Point of Sale (POS) Counter Till
                </h1>
                {activePOSSession ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-700 text-emerald-400 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Till Open: {activePOSSession.sessionNumber}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-700 text-amber-400 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Till Closed
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A69385] mt-0.5">
                Fast walk-in checkout, hardware/camera barcode scanning, instant receipt slips & automatic stock deduction.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Switcher Tabs */}
            <div className="flex bg-[#221B17] p-1 rounded-xl border border-[#3A2D25] text-xs font-medium">
              <button
                onClick={() => setActiveTab('till')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'till'
                    ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-sm'
                    : 'text-[#A69385] hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-sm'
                    : 'text-[#A69385] hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Receipts ({posTransactions.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('session')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'session'
                    ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-sm'
                    : 'text-[#A69385] hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Z-Report / Till</span>
              </button>
            </div>

            {/* Quick Barcode Scanner Trigger */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#2C211B] hover:bg-[#3A2D25] text-[#DE9E74] border border-[#4A392F] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>

            {/* Till Session Modal Button */}
            <button
              onClick={() => setIsSessionModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-[#171311] text-xs font-bold transition-colors shadow-sm"
            >
              {activePOSSession ? 'Manage Till / Z-Report' : 'Open Register Float'}
            </button>
          </div>
        </div>

        {/* Banner Notice Alert */}
        {bannerNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
        )}
      </div>

      {/* ---------------- REGISTER & CART SPLIT VIEW ---------------- */}
      {activeTab === 'till' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: PRODUCT CATALOG & FAST SEARCH (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Category Filter */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, SKU, or GS1 barcode (e.g. 6009800123012)..."
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#C98A5B] text-stone-900"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3 py-2 rounded-xl bg-[#FBF7F4] hover:bg-[#F4ECE7] text-[#75412e] border border-[#E8D9CF] text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  title="Open Camera Scanner"
                >
                  <Barcode className="w-4 h-4 text-[#CC8468]" />
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap transition-colors font-medium ${
                      selectedCategory === cat
                        ? 'bg-[#391E0F] text-[#F5E8D5] font-semibold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const stockQty = p.stockOnHand ?? 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className="group bg-white p-3.5 rounded-2xl border border-stone-200 hover:border-[#CC8468] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-left relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                          {p.sku}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            stockQty > 20
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : stockQty > 0
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {stockQty} in stock
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#9A4B28] line-clamp-2 leading-tight">
                        {p.name}
                      </h3>

                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {p.packSize || p.category}
                      </p>

                      {p.barcode && (
                        <div className="flex items-center gap-1 text-[10px] text-stone-400 font-mono mt-1">
                          <Barcode className="w-3 h-3" />
                          <span>{p.barcode}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100">
                      <span className="text-sm font-bold text-[#2B150A]">
                        R {p.unitPrice.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-xl bg-[#F5E8D5] text-[#75412e] group-hover:bg-[#CC8468] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-16 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">No matching bakery items found.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: CART & CHECKOUT REGISTER (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between h-full min-h-[580px]">
              <div>
                {/* Cart Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[#CC8468]" />
                    <h2 className="text-sm font-bold text-stone-900">Current Sale Cart</h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#F5E8D5] text-[#75412e] font-bold">
                      {cart.reduce((a, b) => a + b.quantity, 0)} items
                    </span>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>

                {/* Customer Assignment */}
                <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-stone-600 font-medium">
                    <span className="flex items-center gap-1 text-[11px]">
                      <UserIcon className="w-3.5 h-3.5 text-stone-400" /> Customer:
                    </span>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => {
                        setSelectedCustomerId(e.target.value);
                        const c = customers.find((cust) => cust.id === e.target.value);
                        if (c) setCustomCustomerName(c.registeredName);
                        else setCustomCustomerName('Walk-in Retail Customer');
                      }}
                      className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-800 focus:outline-none focus:border-[#C98A5B]"
                    >
                      <option value="">Walk-in Retail Customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.registeredName} ({c.accountCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-900 truncate">{item.productName}</div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          R {item.unitPrice.toFixed(2)} each {item.packSize && `• ${item.packSize}`}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs w-6 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="w-16 text-right font-bold text-stone-900 tabular-nums shrink-0">
                        R {item.lineTotal.toFixed(2)}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveFromCart(item.productId)}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <div className="py-12 text-center text-stone-400">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
                      <p className="text-xs">No items in register cart.</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Click products on the left or scan a barcode.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cart Footer: Discounts, VAT & Tender Options */}
              <div className="mt-4 pt-3 border-t border-stone-200 space-y-3">
                {/* Discount & VAT Options */}
                <div className="flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-1 text-stone-600">
                    <Percent className="w-3.5 h-3.5 text-stone-400" />
                    <span>Discount:</span>
                    <select
                      value={orderDiscountPercent}
                      onChange={(e) => setOrderDiscountPercent(Number(e.target.value))}
                      className="px-1.5 py-0.5 rounded border border-stone-200 bg-stone-50 font-semibold text-xs"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="10">10%</option>
                      <option value="15">15%</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVatZeroRated}
                      onChange={(e) => setIsVatZeroRated(e.target.checked)}
                      className="rounded text-[#CC8468] focus:ring-0"
                    />
                    <span>Zero-Rated Staple (0% VAT)</span>
                  </label>
                </div>

                {/* Calculation Summary */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span className="font-mono">R {subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount ({orderDiscountPercent}%)</span>
                      <span className="font-mono">- R {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {!isVatZeroRated && (
                    <div className="flex justify-between text-stone-600">
                      <span>VAT ({company.vatRate || 15}%)</span>
                      <span className="font-mono">R {vatAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-stone-900 pt-1.5 border-t border-stone-200">
                    <span>Grand Total</span>
                    <span className="text-[#391E0F] font-mono text-lg">R {grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all border ${
                      paymentMethod === 'CASH'
                        ? 'bg-[#391E0F] text-[#F5E8D5] border-[#391E0F] shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all border ${
                      paymentMethod === 'CARD'
                        ? 'bg-[#391E0F] text-[#F5E8D5] border-[#391E0F] shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('EFT')}
                    className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all border ${
                      paymentMethod === 'EFT'
                        ? 'bg-[#391E0F] text-[#F5E8D5] border-[#391E0F] shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>EFT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ON_ACCOUNT')}
                    className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all border ${
                      paymentMethod === 'ON_ACCOUNT'
                        ? 'bg-[#391E0F] text-[#F5E8D5] border-[#391E0F] shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Account</span>
                  </button>
                </div>

                {/* Cash Tender & Change Due Section */}
                {paymentMethod === 'CASH' && (
                  <div className="bg-[#FAF6F2] p-3 rounded-xl border border-[#E8D9CF] space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                      <span>Cash Tendered:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-stone-500">R</span>
                        <input
                          type="number"
                          step="0.50"
                          value={amountTenderedStr}
                          onChange={(e) => setAmountTenderedStr(e.target.value)}
                          placeholder={grandTotal.toFixed(2)}
                          className="w-24 px-2 py-1 text-right font-mono font-bold text-xs bg-white border border-[#D5C2B4] rounded-lg focus:outline-none focus:border-[#C98A5B]"
                        />
                      </div>
                    </div>

                    {/* Quick SA Banknote buttons */}
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      <span className="text-stone-500 text-[10px]">Shortcuts:</span>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(grandTotal)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-stone-200 border border-stone-300 font-bold"
                      >
                        Exact
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(50)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-stone-200 border border-stone-300"
                      >
                        R50
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(100)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-stone-200 border border-stone-300"
                      >
                        R100
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(200)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-stone-200 border border-stone-300 font-bold"
                      >
                        R200
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#E8D9CF]">
                      <span className="text-stone-700 font-medium">Change Due:</span>
                      <span
                        className={`font-mono text-sm font-bold ${
                          changeDue >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        R {changeDue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Card terminal reference */}
                {paymentMethod === 'CARD' && (
                  <div className="text-xs space-y-1">
                    <label className="font-medium text-stone-600">Speedpoint POS Approval Ref (optional):</label>
                    <input
                      type="text"
                      value={cardAuthRef}
                      onChange={(e) => setCardAuthRef(e.target.value)}
                      placeholder="e.g. AUTH-98214"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs"
                    />
                  </div>
                )}

                {/* Checkout Action Button */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-3 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] text-[#F5E8D5] text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Receipt className="w-4 h-4 text-[#E0A282]" />
                  <span>Complete Sale & Print Slip (R {grandTotal.toFixed(2)})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PAST RECEIPTS & HISTORY TAB ---------------- */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Recent POS Receipts & Audits</h2>
              <p className="text-xs text-stone-500">History of all transactions processed at this counter register.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-semibold bg-stone-50">
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3 text-right">Total (ZAR)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {posTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50">
                    <td className="py-3 px-3 font-mono font-bold text-stone-900">{tx.receiptNumber}</td>
                    <td className="py-3 px-3 text-stone-600">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-medium text-stone-800">{tx.customerName || 'Walk-in'}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-600">
                      {tx.items.length} items ({tx.items.reduce((a, b) => a + b.quantity, 0)} units)
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                      R {tx.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          setLastCompletedTx(tx);
                          setIsReceiptModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold"
                        title="Reprint Slip"
                      >
                        Slip
                      </button>
                      {tx.status === 'COMPLETED' && (
                        <button
                          onClick={() => {
                            if (confirm(`Refund receipt ${tx.receiptNumber}?`)) {
                              refundPOSTransaction(tx.id);
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {posTransactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-stone-400">
                      No POS transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- TILL SESSION & Z-REPORT TAB ---------------- */}
      {activeTab === 'session' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">Till Sessions & End-of-Day Z-Report</h2>
              <p className="text-xs text-stone-500">Daily cashier register balance, cash drawer reconciliations, and sales audit.</p>
            </div>

            <button
              onClick={() => setIsSessionModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] text-[#F5E8D5] text-xs font-bold transition-colors"
            >
              {activePOSSession ? 'Close Till & Generate Z-Report' : 'Open New Till Session'}
            </button>
          </div>

          {/* Active Session Overview */}
          {activePOSSession ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] font-semibold text-stone-500 uppercase">Session Info</span>
                <div className="text-sm font-bold text-stone-900 mt-1">{activePOSSession.sessionNumber}</div>
                <div className="text-xs text-stone-600 mt-0.5">Cashier: {activePOSSession.cashierName}</div>
                <div className="text-[11px] text-stone-400 mt-1">
                  Opened: {new Date(activePOSSession.openedAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] font-semibold text-stone-500 uppercase">Opening Float</span>
                <div className="text-lg font-mono font-bold text-stone-900 mt-1">
                  R {activePOSSession.openingFloat.toFixed(2)}
                </div>
                <div className="text-xs text-stone-500 mt-0.5">Cash drawer float provided</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase">Total Sales in Till</span>
                <div className="text-lg font-mono font-bold text-emerald-900 mt-1">
                  R {activePOSSession.totalSales.toFixed(2)}
                </div>
                <div className="text-xs text-emerald-700 mt-0.5">{activePOSSession.transactionCount} transactions</div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF6F2] border border-[#E8D9CF]">
                <span className="text-[11px] font-semibold text-[#75412e] uppercase">Cash In Drawer</span>
                <div className="text-lg font-mono font-bold text-[#391E0F] mt-1">
                  R {(activePOSSession.openingFloat + activePOSSession.cashSales).toFixed(2)}
                </div>
                <div className="text-xs text-[#75412e] mt-0.5">
                  Float (R{activePOSSession.openingFloat.toFixed(0)}) + Cash Sales (R{activePOSSession.cashSales.toFixed(0)})
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-amber-900">No Register Till Currently Open</h3>
              <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
                Opening float is required before taking morning walk-in counter sales. Click below to start your shift.
              </p>
              <button
                onClick={() => setIsSessionModalOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-[#391E0F] text-[#F5E8D5] text-xs font-bold"
              >
                Open Morning Till Float
              </button>
            </div>
          )}

          {/* Session History Table */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">Historical Till Sessions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                    <th className="p-2.5">Session #</th>
                    <th className="p-2.5">Opened</th>
                    <th className="p-2.5">Closed</th>
                    <th className="p-2.5">Cashier</th>
                    <th className="p-2.5 text-right">Float</th>
                    <th className="p-2.5 text-right">Cash</th>
                    <th className="p-2.5 text-right">Card</th>
                    <th className="p-2.5 text-right">Total Sales</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {posSessions.map((ses) => (
                    <tr key={ses.id} className="hover:bg-stone-50">
                      <td className="p-2.5 font-bold text-stone-900">{ses.sessionNumber}</td>
                      <td className="p-2.5 text-stone-600">{new Date(ses.openedAt).toLocaleDateString()}</td>
                      <td className="p-2.5 text-stone-600">{ses.closedAt ? new Date(ses.closedAt).toLocaleTimeString() : 'Active'}</td>
                      <td className="p-2.5 font-sans text-stone-800">{ses.cashierName}</td>
                      <td className="p-2.5 text-right">R {ses.openingFloat.toFixed(2)}</td>
                      <td className="p-2.5 text-right text-emerald-700">R {ses.cashSales.toFixed(2)}</td>
                      <td className="p-2.5 text-right text-blue-700">R {ses.cardSales.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold text-stone-900">R {ses.totalSales.toFixed(2)}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ses.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {ses.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- CAMERA BARCODE SCANNER MODAL ---------------- */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <BarcodeScanner
              onScan={(scannedCode) => {
                handleBarcodeScanned(scannedCode);
              }}
              onClose={() => setIsScannerOpen(false)}
              title="Counter Till Barcode Scanner"
              subtitle="Hold pastry packaging barcode in view to add directly to sale cart"
            />
          </div>
        </div>
      )}

      {/* ---------------- PRINTABLE THERMAL SLIP MODAL ---------------- */}
      {isReceiptModalOpen && lastCompletedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                <Printer className="w-4 h-4 text-[#CC8468]" />
                <span>Thermal Till Slip</span>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Slip Receipt Paper Simulation */}
            <div
              id="printable-slip"
              className="bg-[#FCFCFA] p-4 rounded-xl border border-dashed border-stone-300 font-mono text-xs text-stone-800 space-y-2 shadow-inner"
            >
              {/* Slip Header */}
              <div className="text-center space-y-0.5">
                <div className="font-serif font-black text-sm tracking-tight text-stone-900 uppercase">
                  {company.companyName || 'Savouré Artisanal Pastry'}
                </div>
                <div className="text-[10px] text-stone-600">{company.address || '42 Commercial Rd, Durban Central'}</div>
                <div className="text-[10px] text-stone-600">VAT Reg: {company.vatNumber || '4890284712'}</div>
                <div className="text-[10px] text-stone-600">Tel: {company.phone || '061 364 5712'}</div>
              </div>

              <div className="border-t border-dashed border-stone-300 my-1.5" />

              {/* Tax Invoice Slip Metadata */}
              <div className="text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>RECEIPT:</span>
                  <span className="font-bold">{lastCompletedTx.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date(lastCompletedTx.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>{lastCompletedTx.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span>{lastCompletedTx.customerName || 'Walk-in'}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-stone-300 my-1.5" />

              {/* Itemized lines */}
              <div className="space-y-1 text-[11px]">
                {lastCompletedTx.items.map((it, idx) => (
                  <div key={idx}>
                    <div className="font-semibold text-stone-900">{it.productName}</div>
                    <div className="flex justify-between text-[10px] text-stone-600">
                      <span>{it.quantity} x R{it.unitPrice.toFixed(2)}</span>
                      <span className="font-bold">R {it.lineTotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-stone-300 my-1.5" />

              {/* Financial Totals */}
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>R {lastCompletedTx.subtotal.toFixed(2)}</span>
                </div>
                {lastCompletedTx.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>DISCOUNT:</span>
                    <span>- R {lastCompletedTx.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT ({lastCompletedTx.vat > 0 ? '15%' : '0% ZERO-RATED'}):</span>
                  <span>R {lastCompletedTx.vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-stone-900 pt-1 border-t border-stone-300">
                  <span>TOTAL DUE:</span>
                  <span>R {lastCompletedTx.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>PAYMENT METHOD:</span>
                  <span className="font-bold">{lastCompletedTx.paymentMethod}</span>
                </div>
                {lastCompletedTx.paymentMethod === 'CASH' && (
                  <>
                    <div className="flex justify-between">
                      <span>TENDERED:</span>
                      <span>R {lastCompletedTx.amountTendered.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-800">
                      <span>CHANGE DUE:</span>
                      <span>R {lastCompletedTx.changeDue.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-dashed border-stone-300 my-1.5" />

              {/* Slip Footer */}
              <div className="text-center text-[10px] text-stone-500 pt-1 space-y-0.5">
                <div>*** TAX INVOICE ***</div>
                <div>Thank you for choosing Savouré!</div>
                <div>Artisanal Pastry Sheets • Cape Malay Roti • Samosas</div>
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] text-[#F5E8D5] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TILL SESSION OPEN/CLOSE MODAL ---------------- */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#CC8468]" />
                <h3 className="text-sm font-bold text-stone-900">
                  {activePOSSession ? 'Close Register Till (End-of-Day Z-Report)' : 'Open Register Till Session'}
                </h3>
              </div>
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activePOSSession ? (
              <div className="space-y-4 text-xs">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1.5 font-mono">
                  <div className="flex justify-between text-stone-600">
                    <span>Active Session:</span>
                    <span className="font-bold">{activePOSSession.sessionNumber}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Opening Float:</span>
                    <span>R {activePOSSession.openingFloat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Cash Sales:</span>
                    <span className="text-emerald-700">R {activePOSSession.cashSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Card Sales:</span>
                    <span className="text-blue-700">R {activePOSSession.cardSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200">
                    <span>Expected Cash in Drawer:</span>
                    <span>R {(activePOSSession.openingFloat + activePOSSession.cashSales).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Counted Cash Float in Drawer (ZAR):</label>
                  <input
                    type="number"
                    step="0.50"
                    value={closingFloatInput}
                    onChange={(e) => setClosingFloatInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Session Closing Notes:</label>
                  <textarea
                    rows={2}
                    value={sessionNotesInput}
                    onChange={(e) => setSessionNotesInput(e.target.value)}
                    placeholder="e.g. End of morning shift, cash reconciles perfectly..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseTill}
                    className="flex-1 py-2.5 rounded-xl bg-red-800 hover:bg-red-900 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    Confirm Close Till & Archive Z-Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSessionModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-stone-600">
                  Enter the opening cash float provided to the cash drawer before accepting walk-in retail transactions.
                </p>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Opening Cash Float (ZAR):</label>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-stone-500 font-bold">R</span>
                    <input
                      type="number"
                      step="50"
                      value={openingFloatInput}
                      onChange={(e) => setOpeningFloatInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Opening Notes (Optional):</label>
                  <input
                    type="text"
                    value={sessionNotesInput}
                    onChange={(e) => setSessionNotesInput(e.target.value)}
                    placeholder="e.g. Morning counter shift initialized"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleOpenTill}
                    className="flex-1 py-2.5 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] text-[#F5E8D5] font-bold text-xs shadow-sm transition-colors"
                  >
                    Start Till Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSessionModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
