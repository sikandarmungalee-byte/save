import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { StockPurchase, StockItemStatus, StockPurchaseItem } from '../types/erp';
import {
  Package,
  Plus,
  Search,
  Upload,
  Camera,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  ArrowRight,
  Filter,
  X,
  Printer,
  Sparkles,
  Layers,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

export const StockCapturingView: React.FC = () => {
  const {
    stockPurchases,
    stockItemStatuses,
    createStockPurchase,
    deleteStockPurchase,
    createStockItemStatus,
    updateStockItemStatus,
    deleteStockItemStatus,
    markStockAsFinished,
    setStockQuantity,
    company,
    currentUser,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'purchases' | 'branch-status'>('purchases');

  // Search & Filter States
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'FINISHED'>('ALL');

  // Slip Image Preview Modal
  const [viewingSlipPurchase, setViewingSlipPurchase] = useState<StockPurchase | null>(null);

  // New Purchase Modal State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    supplierName: '',
    supplierInvoiceNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    branchName: 'Main Bakery',
    paymentMethod: 'EFT' as StockPurchase['paymentMethod'],
    slipImageUrl: '',
    notes: '',
  });

  // Purchase Line Items: numbers stored as clean strings so they never start with 0
  const [purchaseItems, setPurchaseItems] = useState<
    Array<{
      itemName: string;
      category: string;
      quantity: string;
      unit: string;
      unitCost: string;
    }>
  >([
    { itemName: '', category: 'Flour & Grains', quantity: '', unit: 'kg', unitCost: '' },
  ]);

  // Tracked Stock Item Modal (manual add/edit)
  const [isStockItemModalOpen, setIsStockItemModalOpen] = useState(false);
  const [editingStockItemId, setEditingStockItemId] = useState<string | null>(null);
  const [stockItemForm, setStockItemForm] = useState({
    name: '',
    category: 'Flour & Grains',
    branchName: 'Main Bakery',
    quantityOnHand: '',
    unit: 'kg',
    minThreshold: '',
    notes: '',
  });

  // Quick Restock Modal
  const [restockModalItem, setRestockModalItem] = useState<StockItemStatus | null>(null);
  const [restockQty, setRestockQty] = useState('');

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Branch list
  const knownBranches = [
    'Main Bakery',
    'Sandton Branch',
    'Rosebank Branch',
    'Wholesale Distribution Hub',
    'Pretoria Depot',
  ];

  // Derive unique branches from existing items
  const allBranches = Array.from(
    new Set([...knownBranches, ...stockItemStatuses.map((s) => s.branchName)])
  );

  // Calculations
  const totalStockSpend = stockPurchases.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);
  const totalSlipsUploaded = stockPurchases.filter((p) => Boolean(p.slipImageUrl)).length;
  const totalTrackedItems = stockItemStatuses.length;
  const finishedItemsCount = stockItemStatuses.filter((s) => s.isFinished || s.quantityOnHand <= 0).length;

  // Filtered Purchases
  const filteredPurchases = stockPurchases.filter((p) => {
    const term = purchaseSearch.toLowerCase().trim();
    const matchSearch =
      !term ||
      p.supplierName.toLowerCase().includes(term) ||
      p.purchaseNumber.toLowerCase().includes(term) ||
      (p.supplierInvoiceNumber && p.supplierInvoiceNumber.toLowerCase().includes(term)) ||
      p.items.some((it) => it.itemName.toLowerCase().includes(term));
    const matchBranch = branchFilter === 'ALL' || p.branchName === branchFilter;
    return matchSearch && matchBranch;
  });

  // Filtered Stock Item Statuses
  const filteredStockStatuses = stockItemStatuses.filter((s) => {
    const term = purchaseSearch.toLowerCase().trim();
    const matchSearch =
      !term ||
      s.name.toLowerCase().includes(term) ||
      s.category.toLowerCase().includes(term);
    const matchBranch = branchFilter === 'ALL' || s.branchName === branchFilter;
    const isFin = s.isFinished || s.quantityOnHand <= 0;
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'FINISHED' && isFin) ||
      (statusFilter === 'IN_STOCK' && !isFin);
    return matchSearch && matchBranch && matchStatus;
  });

  // Handle Slip File Upload
  const handleSlipFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    // Read as Base64 for instant local preview and persistent cloud storage
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPurchaseForm((prev) => ({ ...prev, slipImageUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Item Line to Purchase
  const addPurchaseLine = () => {
    setPurchaseItems([
      ...purchaseItems,
      { itemName: '', category: 'Flour & Grains', quantity: '', unit: 'kg', unitCost: '' },
    ]);
  };

  // Remove Item Line
  const removePurchaseLine = (index: number) => {
    if (purchaseItems.length === 1) return;
    setPurchaseItems(purchaseItems.filter((_, idx) => idx !== index));
  };

  // Update Purchase Line Item
  const updatePurchaseItem = (index: number, field: string, val: string) => {
    const updated = [...purchaseItems];
    (updated[index] as any)[field] = val;
    setPurchaseItems(updated);
  };

  // Calculate live total for purchase modal
  const purchaseItemsTotal = purchaseItems.reduce((acc, it) => {
    const q = parseFloat(it.quantity) || 0;
    const c = parseFloat(it.unitCost) || 0;
    return acc + q * c;
  }, 0);

  // Submit Stock Purchase
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.supplierName.trim()) {
      alert('Please enter a Supplier name.');
      return;
    }

    const validItems: StockPurchaseItem[] = purchaseItems
      .filter((it) => it.itemName.trim() !== '')
      .map((it, idx) => {
        const q = parseFloat(it.quantity) || 1;
        const c = parseFloat(it.unitCost) || 0;
        return {
          id: `item_${Date.now()}_${idx}`,
          itemName: it.itemName.trim(),
          category: it.category || 'Raw Material',
          quantity: q,
          unit: it.unit || 'units',
          unitCost: c,
          totalCost: q * c,
        };
      });

    if (validItems.length === 0) {
      alert('Please add at least one stock item to capture.');
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    try {
      await createStockPurchase({
        supplierName: purchaseForm.supplierName.trim(),
        supplierInvoiceNumber: purchaseForm.supplierInvoiceNumber.trim(),
        purchaseDate: purchaseForm.purchaseDate,
        branchName: purchaseForm.branchName,
        paymentMethod: purchaseForm.paymentMethod,
        slipImageUrl: purchaseForm.slipImageUrl || undefined,
        notes: purchaseForm.notes.trim(),
        items: validItems,
        totalAmount: validItems.reduce((acc, it) => acc + it.totalCost, 0),
        recordedBy: currentUser?.name || 'Administrator',
      });

      setStatusMsg({ type: 'success', text: 'Stock purchase and slip successfully captured and synchronized to cloud!' });
      setIsPurchaseModalOpen(false);
      // Reset form
      setPurchaseForm({
        supplierName: '',
        supplierInvoiceNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        branchName: 'Main Bakery',
        paymentMethod: 'EFT',
        slipImageUrl: '',
        notes: '',
      });
      setPurchaseItems([
        { itemName: '', category: 'Flour & Grains', quantity: '', unit: 'kg', unitCost: '' },
      ]);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to capture purchase: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Manual Tracked Stock Item
  const handleSaveStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItemForm.name.trim()) return;

    const q = parseFloat(stockItemForm.quantityOnHand) || 0;
    const min = parseFloat(stockItemForm.minThreshold) || undefined;

    try {
      if (editingStockItemId) {
        await updateStockItemStatus(editingStockItemId, {
          name: stockItemForm.name.trim(),
          category: stockItemForm.category,
          branchName: stockItemForm.branchName,
          quantityOnHand: q,
          unit: stockItemForm.unit,
          minThreshold: min,
          notes: stockItemForm.notes.trim(),
          isFinished: q <= 0,
        });
      } else {
        await createStockItemStatus({
          name: stockItemForm.name.trim(),
          category: stockItemForm.category,
          branchName: stockItemForm.branchName,
          quantityOnHand: q,
          unit: stockItemForm.unit,
          minThreshold: min,
          notes: stockItemForm.notes.trim(),
          isFinished: q <= 0,
        });
      }

      setIsStockItemModalOpen(false);
      setStockItemForm({
        name: '',
        category: 'Flour & Grains',
        branchName: 'Main Bakery',
        quantityOnHand: '',
        unit: 'kg',
        minThreshold: '',
        notes: '',
      });
      setEditingStockItemId(null);
    } catch (err: any) {
      alert('Error saving stock item: ' + err.message);
    }
  };

  // Execute Quick Restock
  const handleQuickRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem) return;
    const added = parseFloat(restockQty) || 0;
    if (added <= 0) {
      alert('Please enter a valid restock quantity.');
      return;
    }

    try {
      const newQty = (restockModalItem.quantityOnHand || 0) + added;
      await updateStockItemStatus(restockModalItem.id, {
        quantityOnHand: newQty,
        isFinished: false,
        lastPurchasedAt: new Date().toISOString().split('T')[0],
      });
      setRestockModalItem(null);
      setRestockQty('');
    } catch (err: any) {
      alert('Failed to restock: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C98A5B]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Raw Materials & Branch Inventory
              </span>
              <span className="text-[#3A2D25]">·</span>
              <span className="text-xs text-[#A69385] font-serif italic">Real-Time Cloud Sync</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
              <span>Stock Capturing & Slip Receipts</span>
            </h1>
            <p className="text-xs text-[#A69385] mt-1 max-w-2xl leading-relaxed">
              Capture raw ingredient purchases, upload photos of supplier slips, and manually track when stock is finished across individual branches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setStockItemForm({
                  name: '',
                  category: 'Flour & Grains',
                  branchName: 'Main Bakery',
                  quantityOnHand: '',
                  unit: 'kg',
                  minThreshold: '',
                  notes: '',
                });
                setEditingStockItemId(null);
                setIsStockItemModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] border border-[#3A2D25] font-medium text-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#DE9E74]" />
              <span>Track Branch Item</span>
            </button>

            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Capture Stock Purchase & Slip</span>
            </button>
          </div>
        </div>

        {/* Global Alert / Status Feedback */}
        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#A69385]">Total Stock Purchased</span>
            <div className="p-2 rounded-lg bg-[#C98A5B]/10 text-[#DE9E74]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {company.currency} {totalStockSpend.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#8A776B] mt-1 font-sans">
            Across {stockPurchases.length} supplier invoices
          </div>
        </div>

        <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#A69385]">Uploaded Slips & Receipts</span>
            <div className="p-2 rounded-lg bg-[#C98A5B]/10 text-[#DE9E74]">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-[#EDE6DE]">
            {totalSlipsUploaded}
          </div>
          <div className="text-[11px] text-[#8A776B] mt-1">
            Proof of purchase photos stored
          </div>
        </div>

        <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#A69385]">Tracked Branch Items</span>
            <div className="p-2 rounded-lg bg-[#C98A5B]/10 text-[#DE9E74]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {totalTrackedItems}
          </div>
          <div className="text-[11px] text-[#8A776B] mt-1">
            Across {allBranches.length} branch locations
          </div>
        </div>

        <div className={`border rounded-xl p-4 transition-all ${
          finishedItemsCount > 0
            ? 'bg-rose-950/20 border-rose-800/50'
            : 'bg-[#171311] border-[#2C211B]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-rose-300 font-medium">Finished / Out of Stock</span>
            <div className={`p-2 rounded-lg ${finishedItemsCount > 0 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-neutral-800 text-neutral-400'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-bold font-mono ${finishedItemsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {finishedItemsCount}
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1">
            {finishedItemsCount > 0 ? 'Items marked depleted & need order' : 'All branch stocks operational'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[#2C211B] pb-1">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2.5 rounded-t-xl font-medium text-xs transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'purchases'
              ? 'border-[#C98A5B] text-white bg-[#171311]'
              : 'border-transparent text-[#8A776B] hover:text-[#EDE6DE]'
          }`}
        >
          <FileText className="w-4 h-4 text-[#DE9E74]" />
          <span>Stock Purchases & Slips ({stockPurchases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('branch-status')}
          className={`px-4 py-2.5 rounded-t-xl font-medium text-xs transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'branch-status'
              ? 'border-[#C98A5B] text-white bg-[#171311]'
              : 'border-transparent text-[#8A776B] hover:text-[#EDE6DE]'
          }`}
        >
          <Building className="w-4 h-4 text-[#DE9E74]" />
          <span>Branch Stock & Finished Status ({stockItemStatuses.length})</span>
          {finishedItemsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {finishedItemsCount} finished
            </span>
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A776B]" />
          <input
            type="text"
            value={purchaseSearch}
            onChange={(e) => setPurchaseSearch(e.target.value)}
            placeholder={
              activeTab === 'purchases'
                ? 'Search by supplier, slip #, item...'
                : 'Search stock item or category...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-[#EDE6DE] focus:outline-hidden focus:border-[#C98A5B]"
          >
            <option value="ALL">All Branches</option>
            {allBranches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Status Filter for Branch Stock */}
          {activeTab === 'branch-status' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-[#EDE6DE] focus:outline-hidden focus:border-[#C98A5B]"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_STOCK">In Stock Only</option>
              <option value="FINISHED">Depleted / Finished Only</option>
            </select>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: STOCK PURCHASES & SLIPS GALLERY TABLE         */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          {filteredPurchases.length === 0 ? (
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-12 text-center">
              <Package className="w-12 h-12 text-[#DE9E74]/40 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-white mb-1">No Stock Purchases Captured Yet</h3>
              <p className="text-xs text-[#A69385] max-w-md mx-auto mb-5 leading-relaxed">
                Start capturing the raw materials, flour, and ingredients you buy. You can upload the slips or receipts and allocate them to your branches.
              </p>
              <button
                onClick={() => setIsPurchaseModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs inline-flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Capture First Stock Purchase</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#120F0D] text-[#A69385] border-b border-[#2C211B] font-serif">
                    <tr>
                      <th className="py-3 px-4">Purchase Ref</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Supplier & Slip #</th>
                      <th className="py-3 px-4">Branch</th>
                      <th className="py-3 px-4">Items Captured</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-center">Slip Photo</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C211B]/60 text-[#EDE6DE]">
                    {filteredPurchases.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-[#221B17]/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#DE9E74]">
                          {purchase.purchaseNumber}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-300">
                          {purchase.purchaseDate}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{purchase.supplierName}</div>
                          {purchase.supplierInvoiceNumber && (
                            <div className="text-[11px] text-[#A69385] font-mono">
                              Slip: {purchase.supplierInvoiceNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-[#221B17] border border-[#2C211B] text-[11px] text-[#DE9E74]">
                            {purchase.branchName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="truncate text-xs">
                            {purchase.items.map((it) => `${it.itemName} (${it.quantity} ${it.unit})`).join(', ')}
                          </div>
                          <div className="text-[10px] text-[#8A776B]">
                            {purchase.items.length} item{purchase.items.length > 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          {company.currency} {(Number(purchase.totalAmount) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {purchase.slipImageUrl ? (
                            <button
                              onClick={() => setViewingSlipPurchase(purchase)}
                              className="group relative inline-block"
                              title="Click to view full receipt slip"
                            >
                              <img
                                src={purchase.slipImageUrl}
                                alt="Slip thumbnail"
                                className="w-10 h-10 object-cover rounded-lg border border-[#C98A5B]/40 group-hover:border-[#DE9E74] transition-all shadow-xs"
                              />
                              <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#6E5B4F] italic">No slip</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {purchase.slipImageUrl && (
                              <button
                                onClick={() => setViewingSlipPurchase(purchase)}
                                className="p-1.5 rounded-lg text-[#DE9E74] hover:bg-[#221B17]"
                                title="View Slip"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete stock purchase ${purchase.purchaseNumber}?`)) {
                                  deleteStockPurchase(purchase.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-[#221B17]"
                              title="Delete Purchase"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: BRANCH STOCK & MANUAL FINISHED TRACKER        */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'branch-status' && (
        <div className="space-y-4">
          {filteredStockStatuses.length === 0 ? (
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-12 text-center">
              <Building className="w-12 h-12 text-[#DE9E74]/40 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-white mb-1">No Branch Stock Items Found</h3>
              <p className="text-xs text-[#A69385] max-w-md mx-auto mb-5 leading-relaxed">
                Track ingredients and goods per branch. When an item runs out on the kitchen floor, tap "Mark as Finished" to flag it immediately.
              </p>
              <button
                onClick={() => {
                  setStockItemForm({
                    name: '',
                    category: 'Flour & Grains',
                    branchName: 'Main Bakery',
                    quantityOnHand: '',
                    unit: 'kg',
                    minThreshold: '',
                    notes: '',
                  });
                  setEditingStockItemId(null);
                  setIsStockItemModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs inline-flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Branch Stock Item</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStockStatuses.map((item) => {
                const isFinished = item.isFinished || item.quantityOnHand <= 0;

                return (
                  <div
                    key={item.id}
                    className={`border rounded-2xl p-5 transition-all flex flex-col justify-between ${
                      isFinished
                        ? 'bg-rose-950/15 border-rose-800/50 shadow-md'
                        : 'bg-[#171311] border-[#2C211B] hover:border-[#3A2D25]'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#221B17] text-[#DE9E74] border border-[#2C211B]">
                          {item.branchName}
                        </span>

                        {isFinished ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold text-[10px] uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            FINISHED / DEPLETED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            In Stock
                          </span>
                        )}
                      </div>

                      {/* Item Name & Category */}
                      <h3 className="font-serif text-base font-bold text-white tracking-wide">
                        {item.name}
                      </h3>
                      <div className="text-xs text-[#A69385] mt-0.5 mb-4">
                        Category: {item.category}
                      </div>

                      {/* Stock Level Display */}
                      <div className="p-3 rounded-xl bg-[#120F0D] border border-[#2C211B] flex items-center justify-between mb-4">
                        <div>
                          <div className="text-[10px] text-[#8A776B] uppercase font-mono tracking-wider">
                            Live Quantity
                          </div>
                          <div className={`text-xl font-bold font-mono ${isFinished ? 'text-rose-400 line-through' : 'text-white'}`}>
                            {item.quantityOnHand} <span className="text-xs font-sans text-[#A69385]">{item.unit}</span>
                          </div>
                        </div>

                        {/* Quick +/- Steppers */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(0, (item.quantityOnHand || 0) - 1);
                              setStockQuantity(item.id, next);
                            }}
                            className="w-7 h-7 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-neutral-300 font-bold flex items-center justify-center text-xs"
                            title="Decrease 1"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = (item.quantityOnHand || 0) + 1;
                              setStockQuantity(item.id, next);
                            }}
                            className="w-7 h-7 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-[#DE9E74] font-bold flex items-center justify-center text-xs"
                            title="Increase 1"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Last Finished / Restocked Dates */}
                      {item.lastFinishedAt && (
                        <div className="text-[11px] text-rose-300/80 mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Finished reported on {item.lastFinishedAt}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-[#2C211B] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStockItemId(item.id);
                            setStockItemForm({
                              name: item.name,
                              category: item.category,
                              branchName: item.branchName,
                              quantityOnHand: item.quantityOnHand ? String(item.quantityOnHand) : '',
                              unit: item.unit,
                              minThreshold: item.minThreshold ? String(item.minThreshold) : '',
                              notes: item.notes || '',
                            });
                            setIsStockItemModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs text-[#DE9E74] hover:bg-[#221B17]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete tracked item "${item.name}" from ${item.branchName}?`)) {
                              deleteStockItemStatus(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-[#221B17]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isFinished ? (
                          <button
                            type="button"
                            onClick={() => {
                              setRestockModalItem(item);
                              setRestockQty('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Restock Item</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Mark ${item.name} as finished/depleted at ${item.branchName}?`)) {
                                markStockAsFinished(item.id);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-semibold text-xs transition-colors flex items-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5 text-rose-400" />
                            <span>Mark Finished</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: CAPTURE STOCK PURCHASE & SLIP PHOTO         */}
      {/* ---------------------------------------------------- */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-2xl my-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C211B]">
              <div>
                <h3 className="text-lg font-serif font-bold text-white tracking-tight flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#DE9E74]" />
                  <span>Capture Stock Purchase & Supplier Slip</span>
                </h3>
                <p className="text-xs text-[#A69385]">
                  Record ingredients or packaging bought and attach receipt photo for book-keeping.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8A776B] hover:text-white hover:bg-[#221B17]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4">
              {/* Row 1: Supplier, Slip Ref, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                    Supplier / Vendor Name <span className="text-[#DE9E74]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={purchaseForm.supplierName}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierName: e.target.value })}
                    placeholder="e.g. Flour Mills SA, Anchor Yeast"
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                    Supplier Invoice / Slip #
                  </label>
                  <input
                    type="text"
                    value={purchaseForm.supplierInvoiceNumber}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierInvoiceNumber: e.target.value })}
                    placeholder="e.g. INV-98231 or Cash Slip"
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                    Purchase Date <span className="text-[#DE9E74]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseForm.purchaseDate}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>

              {/* Row 2: Receiving Branch & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                    Receiving Branch / Facility <span className="text-[#DE9E74]">*</span>
                  </label>
                  <select
                    value={purchaseForm.branchName}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, branchName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    {allBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={purchaseForm.paymentMethod}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    <option value="EFT">Direct EFT / Bank Transfer</option>
                    <option value="Cash">Petty Cash / Cash at Till</option>
                    <option value="Credit Card">Company Credit Card</option>
                    <option value="Supplier Account">Supplier 30-Day Account</option>
                  </select>
                </div>
              </div>

              {/* Items Captured Table */}
              <div className="p-4 rounded-xl bg-[#120F0D] border border-[#2C211B] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[#DE9E74]">
                    <Package className="w-3.5 h-3.5" />
                    <span>Purchased Items & Quantities</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addPurchaseLine}
                    className="px-2.5 py-1 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-[#DE9E74] text-xs font-medium flex items-center gap-1 border border-[#2C211B]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {purchaseItems.map((item, idx) => {
                    const q = parseFloat(item.quantity) || 0;
                    const c = parseFloat(item.unitCost) || 0;
                    const lineTotal = q * c;

                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-12 sm:col-span-4">
                          <input
                            type="text"
                            required
                            placeholder="Item name (e.g. Bread Flour)"
                            value={item.itemName}
                            onChange={(e) => updatePurchaseItem(idx, 'itemName', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-[#171311] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F]"
                          />
                        </div>

                        <div className="col-span-6 sm:col-span-2">
                          <select
                            value={item.category}
                            onChange={(e) => updatePurchaseItem(idx, 'category', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-[#171311] border border-[#2C211B] rounded-lg text-white"
                          >
                            <option value="Flour & Grains">Flour & Grains</option>
                            <option value="Dairy & Eggs">Dairy & Eggs</option>
                            <option value="Sweeteners & Choc">Sweeteners & Choc</option>
                            <option value="Packaging & Boxes">Packaging & Boxes</option>
                            <option value="Spices & Yeast">Spices & Yeast</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Quantity input: no zero starting! */}
                        <div className="col-span-3 sm:col-span-2">
                          <input
                            type="number"
                            step="any"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updatePurchaseItem(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-[#171311] border border-[#2C211B] rounded-lg text-white font-mono placeholder-[#6E5B4F]"
                          />
                        </div>

                        <div className="col-span-3 sm:col-span-1">
                          <select
                            value={item.unit}
                            onChange={(e) => updatePurchaseItem(idx, 'unit', e.target.value)}
                            className="w-full px-1.5 py-1.5 text-xs bg-[#171311] border border-[#2C211B] rounded-lg text-white"
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="liters">liters</option>
                            <option value="units">units</option>
                            <option value="bags">bags</option>
                            <option value="boxes">boxes</option>
                            <option value="crates">crates</option>
                          </select>
                        </div>

                        {/* Unit cost input: no zero starting! */}
                        <div className="col-span-5 sm:col-span-2">
                          <input
                            type="number"
                            step="any"
                            placeholder={`Unit (${company.currency})`}
                            value={item.unitCost}
                            onChange={(e) => updatePurchaseItem(idx, 'unitCost', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-[#171311] border border-[#2C211B] rounded-lg text-white font-mono placeholder-[#6E5B4F]"
                          />
                        </div>

                        <div className="col-span-1 flex items-center justify-end">
                          <button
                            type="button"
                            disabled={purchaseItems.length === 1}
                            onClick={() => removePurchaseLine(idx)}
                            className="p-1 rounded text-neutral-500 hover:text-rose-400 disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total live summary */}
                <div className="pt-2 border-t border-[#2C211B] flex items-center justify-between text-xs">
                  <span className="text-[#A69385]">Calculated Total Spend:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {company.currency} {purchaseItemsTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Slip Image Upload Section */}
              <div className="p-4 rounded-xl bg-[#120F0D] border border-[#2C211B] space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider text-[#DE9E74] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Attach Photo of Slip / Invoice</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {purchaseForm.slipImageUrl ? (
                    <div className="relative group shrink-0">
                      <img
                        src={purchaseForm.slipImageUrl}
                        alt="Uploaded Slip"
                        className="w-24 h-24 object-cover rounded-xl border border-[#C98A5B] shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => setPurchaseForm({ ...purchaseForm, slipImageUrl: '' })}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500"
                        title="Remove slip photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-[#2C211B] flex flex-col items-center justify-center text-[#8A776B] shrink-0">
                      <ImageIcon className="w-6 h-6 text-[#A69385]/60 mb-1" />
                      <span className="text-[9px]">No slip photo</span>
                    </div>
                  )}

                  <div className="flex-1 w-full">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      id="slip-upload-input"
                      onChange={handleSlipFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="slip-upload-input"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#221B17] hover:bg-[#2C211B] border border-[#3A2D25] text-xs font-medium text-[#EDE6DE] transition-colors"
                    >
                      <Camera className="w-4 h-4 text-[#DE9E74]" />
                      <span>{purchaseForm.slipImageUrl ? 'Change Slip Photo' : 'Upload or Snap Slip Photo'}</span>
                    </label>
                    <p className="text-[11px] text-[#8A776B] mt-1.5">
                      Supports phone camera snapshots and high-res store receipts (JPG, PNG). Automatically synced to cloud.
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                  Notes / Quality Remarks
                </label>
                <input
                  type="text"
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  placeholder="e.g. 50kg bags offloaded to cold store, batch expiry Nov 2027"
                  className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#2C211B] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#A69385] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors shadow-md flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Saving & Syncing...' : 'Save Stock Purchase & Slip'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: FULL SLIP INSPECTION & PREVIEW              */}
      {/* ---------------------------------------------------- */}
      {viewingSlipPurchase && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C211B] shrink-0">
              <div>
                <div className="text-xs font-mono text-[#DE9E74] font-bold">
                  {viewingSlipPurchase.purchaseNumber}
                </div>
                <h3 className="font-serif text-lg font-bold text-white">
                  {viewingSlipPurchase.supplierName} Receipt Slip
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingSlipPurchase(null)}
                className="p-1.5 rounded-lg text-[#8A776B] hover:text-white hover:bg-[#221B17]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slip details banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0 bg-[#120F0D] p-3 rounded-xl border border-[#2C211B]">
              <div>
                <span className="text-[#8A776B] block text-[10px]">Purchase Date</span>
                <span className="font-mono text-white">{viewingSlipPurchase.purchaseDate}</span>
              </div>
              <div>
                <span className="text-[#8A776B] block text-[10px]">Branch</span>
                <span className="text-[#DE9E74]">{viewingSlipPurchase.branchName}</span>
              </div>
              <div>
                <span className="text-[#8A776B] block text-[10px]">Slip Invoice #</span>
                <span className="font-mono text-white">{viewingSlipPurchase.supplierInvoiceNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#8A776B] block text-[10px]">Total Paid</span>
                <span className="font-mono text-white font-bold">
                  {company.currency} {(Number(viewingSlipPurchase.totalAmount) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* High-res Image Scroll Container */}
            <div className="flex-1 overflow-auto rounded-xl border border-[#2C211B] bg-black flex items-center justify-center p-2 min-h-64">
              {viewingSlipPurchase.slipImageUrl ? (
                <img
                  src={viewingSlipPurchase.slipImageUrl}
                  alt="Full receipt slip"
                  className="max-w-full max-h-[55vh] object-contain rounded-lg"
                />
              ) : (
                <div className="text-center text-[#8A776B] py-12">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <span>No slip image uploaded for this purchase</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#2C211B] flex items-center justify-between text-xs shrink-0">
              <span className="text-[#8A776B]">Recorded by {viewingSlipPurchase.recordedBy}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-white flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingSlipPurchase(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: TRACK / EDIT BRANCH STOCK ITEM              */}
      {/* ---------------------------------------------------- */}
      {isStockItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C211B]">
              <h3 className="font-serif text-lg font-bold text-white">
                {editingStockItemId ? 'Edit Tracked Stock Item' : 'Add Tracked Stock to Branch'}
              </h3>
              <button
                type="button"
                onClick={() => setIsStockItemModalOpen(false)}
                className="p-1 rounded text-[#8A776B] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockItem} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                  Stock Item Name <span className="text-[#DE9E74]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={stockItemForm.name}
                  onChange={(e) => setStockItemForm({ ...stockItemForm, name: e.target.value })}
                  placeholder="e.g. Sourdough Flour 50kg, Butter 82%"
                  className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">Category</label>
                  <select
                    value={stockItemForm.category}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white"
                  >
                    <option value="Flour & Grains">Flour & Grains</option>
                    <option value="Dairy & Eggs">Dairy & Eggs</option>
                    <option value="Sweeteners & Choc">Sweeteners & Choc</option>
                    <option value="Packaging & Boxes">Packaging & Boxes</option>
                    <option value="Spices & Yeast">Spices & Yeast</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                    Branch Location <span className="text-[#DE9E74]">*</span>
                  </label>
                  <select
                    value={stockItemForm.branchName}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, branchName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white"
                  >
                    {allBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Quantity on hand: clean string so it doesn't start with 0 */}
                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                    Initial Quantity
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={stockItemForm.quantityOnHand}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, quantityOnHand: e.target.value })}
                    placeholder="e.g. 25"
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono placeholder-[#6E5B4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">Unit of Measure</label>
                  <select
                    value={stockItemForm.unit}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="liters">liters</option>
                    <option value="units">units</option>
                    <option value="bags">bags</option>
                    <option value="crates">crates</option>
                    <option value="boxes">boxes</option>
                  </select>
                </div>
              </div>

              {/* Min threshold: clean string */}
              <div>
                <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  step="any"
                  value={stockItemForm.minThreshold}
                  onChange={(e) => setStockItemForm({ ...stockItemForm, minThreshold: e.target.value })}
                  placeholder="Alert when below (e.g. 5)"
                  className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono placeholder-[#6E5B4F]"
                />
              </div>

              <div className="pt-3 border-t border-[#2C211B] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStockItemModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-[#A69385] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs"
                >
                  Save Tracked Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: QUICK RESTOCK DIALOG                        */}
      {/* ---------------------------------------------------- */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2C211B]">
              <h3 className="font-serif text-base font-bold text-white">
                Restock {restockModalItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setRestockModalItem(null)}
                className="p-1 rounded text-[#8A776B] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#A69385]">
              Add received quantity for <strong className="text-white">{restockModalItem.branchName}</strong>. This will clear the "Finished" status and return the item to active stock.
            </p>

            <form onSubmit={handleQuickRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                  Quantity Received ({restockModalItem.unit}) <span className="text-[#DE9E74]">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 text-sm bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  className="px-3.5 py-1.5 text-xs text-[#A69385] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
