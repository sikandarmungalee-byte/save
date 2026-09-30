import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Product } from '../types/erp';
import {
  Package,
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  X,
  Layers,
  FolderPlus,
  Folder,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, categories, createCategory, deleteCategory, company, createProduct, updateProduct, deleteProduct, refreshData } = useERP();

  // Active View Tabs: 'catalog' (products table) or 'categories' (dedicated category center)
  const [activeTab, setActiveTab] = useState<'catalog' | 'categories'>('catalog');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Dedicated Category Creator State
  const [categoryInput, setCategoryInput] = useState('');
  const [categoryMsg, setCategoryMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Product Form State
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: '',
    customCategoryInput: '',
    packSize: 'Single / Each',
    physicalSize: 'Standard',
    unitPrice: 0,
    costPrice: 0,
    vatApplicable: true,
    stockOnHand: 0,
  });

  const openCreateModal = (defaultCategory?: string) => {
    setEditingProduct(null);
    const chosenCat = defaultCategory || (categories.length > 0 ? categories[0] : '');
    setForm({
      sku: `SKU-${String(products.length + 1).padStart(3, '0')}`,
      name: '',
      category: chosenCat,
      customCategoryInput: '',
      packSize: 'Single / Each',
      physicalSize: 'Standard',
      unitPrice: 0,
      costPrice: 0,
      vatApplicable: true,
      stockOnHand: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category,
      customCategoryInput: '',
      packSize: p.packSize,
      physicalSize: p.physicalSize,
      unitPrice: p.unitPrice,
      costPrice: p.costPrice,
      vatApplicable: p.vatApplicable,
      stockOnHand: p.stockOnHand,
    });
    setIsModalOpen(true);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryInput.trim();
    if (!trimmed) return;
    setCategoryMsg(null);

    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryMsg({ type: 'error', text: `Category "${trimmed}" already exists.` });
      return;
    }

    try {
      await createCategory(trimmed);
      setCategoryInput('');
      setCategoryMsg({ type: 'success', text: `Category "${trimmed}" successfully added!` });
      setTimeout(() => setCategoryMsg(null), 3000);
    } catch (err: any) {
      setCategoryMsg({ type: 'error', text: err.message || 'Could not create category' });
    }
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    const productsCount = products.filter((p) => p.category === catToDelete).length;
    const confirmText = productsCount > 0
      ? `Delete category "${catToDelete}"? Note: ${productsCount} products are currently assigned to it.`
      : `Delete category "${catToDelete}"?`;

    if (confirm(confirmText)) {
      await deleteCategory(catToDelete);
      if (categoryFilter === catToDelete) {
        setCategoryFilter('ALL');
      }
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku) return;

    // Use custom category if typed in modal, otherwise selected category
    let finalCat = form.category.trim();
    if (form.customCategoryInput.trim()) {
      finalCat = form.customCategoryInput.trim();
      await createCategory(finalCat);
    }
    if (!finalCat) {
      finalCat = 'General';
    }

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        sku: form.sku,
        name: form.name,
        category: finalCat,
        packSize: form.packSize,
        physicalSize: form.physicalSize,
        unitPrice: Number(form.unitPrice),
        costPrice: Number(form.costPrice),
        vatApplicable: form.vatApplicable,
        stockOnHand: Number(form.stockOnHand),
      });
    } else {
      await createProduct({
        sku: form.sku,
        name: form.name,
        category: finalCat,
        packSize: form.packSize,
        physicalSize: form.physicalSize,
        unitPrice: Number(form.unitPrice),
        costPrice: Number(form.costPrice),
        vatApplicable: form.vatApplicable,
        stockOnHand: Number(form.stockOnHand),
      });
    }
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      p.sku.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.packSize.toLowerCase().includes(term) ||
      (p.category && p.category.toLowerCase().includes(term));
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
                Enterprise Catalog Manager
              </span>
              <span className="text-[#3A2D25]">·</span>
              <span className="text-xs text-[#A69385] font-mono tabular-nums">{products.length} Products</span>
              <span className="text-[#3A2D25]">·</span>
              <span className="text-xs text-[#DE9E74] font-mono tabular-nums">{categories.length} Custom Categories</span>
            </div>
            <h1 className="text-xl font-serif font-bold text-white tracking-tight">
              Products & Category Control
            </h1>
            <p className="text-xs text-[#C5B7AC] mt-1 max-w-2xl leading-relaxed">
              Your own personalized space to define your custom product categories and catalog items from scratch.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs ${
                activeTab === 'categories'
                  ? 'bg-[#2C211B] border-[#C98A5B] text-[#DE9E74]'
                  : 'bg-[#221B17] border-[#3A2D25] text-[#EDE6DE] hover:bg-[#2C211B]'
              }`}
            >
              <FolderPlus className="w-4 h-4 text-[#DE9E74]" />
              <span>Category Manager ({categories.length})</span>
            </button>

            <button
              onClick={() => openCreateModal()}
              className="px-4 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Product</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[#2C211B]">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'catalog'
                ? 'bg-[#C98A5B] text-[#120F0D] shadow-sm'
                : 'text-[#A69385] hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Catalog ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'categories'
                ? 'bg-[#C98A5B] text-[#120F0D] shadow-sm'
                : 'text-[#A69385] hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Categories Workspace ({categories.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DEDICATED CATEGORIES WORKSPACE */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Add Category Section */}
          <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#221B17] border border-[#3A2D25] flex items-center justify-center text-[#DE9E74]">
                <FolderPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-white">Create New Category</h2>
                <p className="text-xs text-[#A69385]">Define any category name for your product lines.</p>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="max-w-xl">
              <div className="flex gap-2.5">
                <input
                  type="text"
                  required
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  placeholder="e.g. Sourdough Breads, Sweet Pastries, Packaging, Beverages..."
                  className="flex-1 px-4 py-2.5 text-xs bg-[#120F0D] border border-[#2C211B] rounded-xl text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Category</span>
                </button>
              </div>

              {categoryMsg && (
                <div
                  className={`text-xs mt-2.5 flex items-center gap-1.5 p-2 rounded-lg ${
                    categoryMsg.type === 'success'
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                      : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                  }`}
                >
                  {categoryMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{categoryMsg.text}</span>
                </div>
              )}
            </form>
          </div>

          {/* Categories Grid List */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
                Your Custom Categories ({categories.length})
              </h3>
              <span className="text-xs text-[#8A776B]">Click on any card to view items or add new SKU</span>
            </div>

            {categories.length === 0 ? (
              <div className="bg-[#171311] border border-dashed border-[#2C211B] rounded-2xl p-12 text-center">
                <Folder className="w-12 h-12 mx-auto text-[#DE9E74] opacity-40 mb-3" />
                <h4 className="text-base font-serif font-bold text-white">No categories created yet</h4>
                <p className="text-xs text-[#A69385] mt-1 max-w-sm mx-auto">
                  Type a category name in the form above and click "Create Category" to set up your catalog structure.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const catProducts = products.filter((p) => p.category === cat);
                  return (
                    <div
                      key={cat}
                      className="bg-[#171311] border border-[#2C211B] rounded-xl p-5 hover:border-[#3A2D25] transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-[#221B17] border border-[#3A2D25] flex items-center justify-center text-[#DE9E74]">
                              <Tag className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white text-sm">{cat}</h4>
                              <div className="text-[11px] text-[#A69385] font-mono mt-0.5">
                                {catProducts.length} product{catProducts.length === 1 ? '' : 's'} assigned
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 rounded-lg text-[#8A776B] hover:text-rose-400 hover:bg-rose-950/40 transition-colors opacity-80 group-hover:opacity-100"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Recent products in this category preview */}
                        {catProducts.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-[#221B17] space-y-1.5">
                            {catProducts.slice(0, 3).map((cp) => (
                              <div key={cp.id} className="text-xs text-[#C5B7AC] flex items-center justify-between">
                                <span className="truncate max-w-[180px]">{cp.name}</span>
                                <span className="font-mono text-[#DE9E74] text-[11px] shrink-0">
                                  {company.currency} {cp.unitPrice.toFixed(2)}
                                </span>
                              </div>
                            ))}
                            {catProducts.length > 3 && (
                              <div className="text-[11px] text-[#8A776B] italic pt-1">
                                + {catProducts.length - 3} more product{catProducts.length - 3 === 1 ? '' : 's'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#2C211B] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryFilter(cat);
                            setActiveTab('catalog');
                          }}
                          className="text-xs text-[#DE9E74] hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>View in Catalog</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openCreateModal(cat)}
                          className="px-2.5 py-1 rounded bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-[#DE9E74]" />
                          <span>Add SKU</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT CATALOG TABLE & QUICK ADD */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Quick-Add Product Card for Fast Entry */}
          <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#DE9E74]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                  Quick Add Product
                </h3>
              </div>
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="text-xs text-[#DE9E74] hover:underline font-medium"
              >
                Open Full Form Modal →
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formElem = e.currentTarget;
                const sku = (formElem.elements.namedItem('quick_sku') as HTMLInputElement).value;
                const name = (formElem.elements.namedItem('quick_name') as HTMLInputElement).value;
                const category = (formElem.elements.namedItem('quick_category') as HTMLSelectElement).value;
                const price = parseFloat((formElem.elements.namedItem('quick_price') as HTMLInputElement).value) || 0;
                const pack = (formElem.elements.namedItem('quick_pack') as HTMLInputElement).value || 'Single';

                if (!name || !sku) return;
                createProduct({
                  sku,
                  name,
                  category: category || 'General',
                  unitPrice: price,
                  costPrice: price * 0.5,
                  packSize: pack,
                  physicalSize: 'Standard',
                  vatApplicable: true,
                  stockOnHand: 50,
                });
                formElem.reset();
              }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 items-end"
            >
              <div>
                <label className="block text-[11px] font-medium text-[#A69385] mb-1">SKU Code</label>
                <input
                  name="quick_sku"
                  type="text"
                  required
                  placeholder={`SKU-${String(products.length + 1).padStart(3, '0')}`}
                  defaultValue={`SKU-${String(products.length + 1).padStart(3, '0')}`}
                  className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-[#A69385] mb-1">Product Title</label>
                <input
                  name="quick_name"
                  type="text"
                  required
                  placeholder="e.g. Sourdough Loaf / Chocolate Danish"
                  className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#A69385] mb-1">Category</label>
                <select
                  name="quick_category"
                  className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                >
                  {categories.length === 0 ? (
                    <option value="General">General</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#A69385] mb-1">Price ({company.currency})</label>
                <input
                  name="quick_price"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add SKU</span>
                </button>
              </div>
            </form>
          </div>

          {/* Control Bar: Search & Dynamic Category Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8A776B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU code, product name, pack sizing..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#171311] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            {/* Dynamic Category Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-[#171311] border border-[#2C211B] rounded-lg overflow-x-auto">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  categoryFilter === 'ALL'
                    ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                    : 'text-[#A69385] hover:text-white'
                }`}
              >
                All Items ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      categoryFilter === cat
                        ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                        : 'text-[#A69385] hover:text-white'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded ${
                        categoryFilter === cat ? 'bg-[#120F0D]/20 text-[#120F0D]' : 'bg-[#221B17] text-[#8A776B]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Table */}
          <div className="bg-[#171311] border border-[#2C211B] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#120F0D] border-b border-[#2C211B] text-[#8A776B] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">SKU Code</th>
                    <th className="py-3 px-4 font-semibold">Product Title & Category</th>
                    <th className="py-3 px-4 font-semibold">Pack & Sizing</th>
                    <th className="py-3 px-4 font-semibold text-right">Selling Price</th>
                    <th className="py-3 px-4 font-semibold text-right">Cost Price</th>
                    <th className="py-3 px-4 font-semibold text-right">Gross Margin</th>
                    <th className="py-3 px-4 font-semibold text-center">VAT</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C211B]">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-[#8A776B]">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#DE9E74]" />
                        <p className="font-serif text-lg text-white font-bold">Catalog is Empty</p>
                        <p className="text-xs text-[#A69385] mt-1 max-w-md mx-auto">
                          You haven't added any products yet. Use the Quick Add bar above or click "+ Add New Product" to start building your catalog.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => openCreateModal()}
                            className="px-4 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors shadow-sm"
                          >
                            + Add First Product
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('categories')}
                            className="px-4 py-2 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-white text-xs font-semibold"
                          >
                            Create Categories First
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const grossMargin = p.unitPrice > 0 ? ((p.unitPrice - p.costPrice) / p.unitPrice) * 100 : 0;

                      return (
                        <tr key={p.id} className="hover:bg-[#221B17]/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-[#DE9E74]">
                            {p.sku}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{p.name}</div>
                            <div className="text-[11px] text-[#A69385] flex items-center gap-1.5 mt-0.5">
                              <Tag className="w-3 h-3 text-[#C98A5B]" />
                              <span>{p.category || 'General'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-white">{p.packSize || 'Single'}</div>
                            <div className="text-[11px] text-[#8A776B]">{p.physicalSize || 'Standard'}</div>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-white tabular-nums">
                            {company.currency} {p.unitPrice.toFixed(2)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-[#A69385] tabular-nums">
                            {company.currency} {p.costPrice.toFixed(2)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            <span className={grossMargin >= 40 ? 'text-emerald-400 font-semibold' : 'text-[#DE9E74]'}>
                              {grossMargin.toFixed(1)}%
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                p.vatApplicable
                                  ? 'bg-[#C98A5B]/15 text-[#DE9E74] border border-[#C98A5B]/30'
                                  : 'bg-[#221B17] text-[#8A776B]'
                              }`}
                            >
                              {p.vatApplicable ? '15%' : '0%'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 rounded-lg bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] transition-colors"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete catalog item ${p.name}?`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-[#221B17] hover:bg-rose-950/80 text-[#8A776B] hover:text-rose-300 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C211B] mb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-white tracking-tight">
                  {editingProduct ? 'Edit Catalog Product' : 'Add New Product SKU'}
                </h3>
                <p className="text-xs text-[#A69385]">Specify SKU code, category, pack counts, and pricing.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8A776B] hover:text-white hover:bg-[#221B17]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                    SKU Code <span className="text-[#DE9E74]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="e.g. BRD-001"
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                    Product Title / Name <span className="text-[#DE9E74]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Signature Country Sourdough Batard"
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>

              {/* Category selection or on-the-fly typing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-[#EDE6DE]">Category</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setActiveTab('categories');
                      }}
                      className="text-[10px] text-[#DE9E74] hover:underline"
                    >
                      + Manage Categories
                    </button>
                  </div>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    {categories.length === 0 ? (
                      <option value="General">General</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                    Or New Category on-the-fly
                  </label>
                  <input
                    type="text"
                    value={form.customCategoryInput}
                    onChange={(e) => setForm({ ...form, customCategoryInput: e.target.value })}
                    placeholder="Type new category..."
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">Pack Sizing</label>
                  <input
                    type="text"
                    value={form.packSize}
                    onChange={(e) => setForm({ ...form, packSize: e.target.value })}
                    placeholder="e.g. Single, Pack of 6, Box of 12"
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">Physical Sizing / Weight</label>
                  <input
                    type="text"
                    value={form.physicalSize}
                    onChange={(e) => setForm({ ...form, physicalSize: e.target.value })}
                    placeholder="e.g. 800g Loaf, Large 30cm"
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                    Selling Price ({company.currency}) <span className="text-[#DE9E74]">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">
                    Cost Price ({company.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#EDE6DE] mb-1">Stock On Hand</label>
                  <input
                    type="number"
                    value={form.stockOnHand}
                    onChange={(e) => setForm({ ...form, stockOnHand: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="vatApplicable"
                  checked={form.vatApplicable}
                  onChange={(e) => setForm({ ...form, vatApplicable: e.target.checked })}
                  className="rounded border-[#2C211B] text-[#C98A5B] focus:ring-[#C98A5B] w-4 h-4 bg-[#120F0D]"
                />
                <label htmlFor="vatApplicable" className="text-xs text-[#EDE6DE] font-medium">
                  Standard VAT Rate Applies (15%)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2C211B]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#A69385] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors shadow-sm"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
