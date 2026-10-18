import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { ShowcaseProductItem } from './showcase/showcaseData';
import {
  Globe,
  Plus,
  Trash2,
  Edit2,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  ExternalLink,
  X,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

interface WebsiteShowcaseViewProps {
  onGoToWebsite?: () => void;
}

const PRESET_SHOWCASE_IMAGES = [
  { label: 'Savouré Hand-Rolled Roti Pack', url: '/showcase/savoure-roti.png' },
  { label: 'Savouré Crispy Samosa Pastry', url: '/showcase/savoure-samoosa.png' },
  { label: 'Savouré Spring Roll Pastry Sheets', url: '/showcase/savoure-springroll.png' },
  { label: 'Savouré Tortilla Wraps Pack', url: '/showcase/savoure-tortilla.png' },
  { label: 'Savouré Master Emblem', url: '/showcase/savoure-logo.png' },
];

export const WebsiteShowcaseView: React.FC<WebsiteShowcaseViewProps> = ({ onGoToWebsite }) => {
  const {
    showcaseProducts,
    addShowcaseProduct,
    updateShowcaseProduct,
    removeShowcaseProduct
  } = useERP();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShowcaseProductItem | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ShowcaseProductItem>>({
    name: '',
    detail: '',
    category: 'Pastry Sheets',
    tone: 'roti',
    mark: '',
    tagline: '',
    description: '',
    image: '/showcase/savoure-roti.png',
    packSpec: 'Pack of 12 / Commercial Crate',
    sizeSpec: 'Standard Size',
    tags: ['Halal', 'Made with care'],
    highlights: ['Generational traditional recipe', '100% Halal certified'],
  });

  const [tagInput, setTagInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');

  const filteredProducts = showcaseProducts.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.detail.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      detail: 'Pack of 12',
      category: 'Artisanal Specialties',
      tone: 'roti',
      mark: 'SAVOURE',
      tagline: 'Handcrafted daily with unbleached flour',
      description: 'Traditional recipe formulated for crisp texture and authentic taste.',
      image: '/showcase/savoure-roti.png',
      packSpec: 'Commercial Packs & Catering Boxes',
      sizeSpec: 'Standard Bakery Dimension',
      tags: ['Halal', 'Made with care'],
      highlights: ['Stone-ground unbleached flour', '100% Halal certified'],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ShowcaseProductItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleRemove = async (item: ShowcaseProductItem) => {
    if (confirm(`Remove "${item.name}" from the public website showcase?`)) {
      await removeShowcaseProduct(item.id);
      setBannerMessage(`Removed "${item.name}" from public website.`);
      setTimeout(() => setBannerMessage(null), 4000);
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Please enter a product name');
      return;
    }

    try {
      if (editingItem) {
        await updateShowcaseProduct(editingItem.id, formData);
        setBannerMessage(`Updated "${formData.name}" on the public website showcase.`);
      } else {
        await addShowcaseProduct({
          ...formData,
          id: 'prod_' + Date.now(),
          mark: formData.mark || formData.name?.toUpperCase().slice(0, 8),
        });
        setBannerMessage(`Added "${formData.name}" to the public website showcase.`);
      }
      setIsModalOpen(false);
      setTimeout(() => setBannerMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !(formData.tags || []).includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (t: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((tag) => tag !== t),
    });
  };

  const addHighlight = () => {
    if (highlightInput.trim() && !(formData.highlights || []).includes(highlightInput.trim())) {
      setFormData({
        ...formData,
        highlights: [...(formData.highlights || []), highlightInput.trim()],
      });
      setHighlightInput('');
    }
  };

  const removeHighlight = (h: string) => {
    setFormData({
      ...formData,
      highlights: (formData.highlights || []).filter((item) => item !== h),
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-[#1E0F07] text-white border border-[#3A2215] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#E0A282] px-2.5 py-0.5 rounded-full bg-[#CC8468]/20 border border-[#CC8468]/30">
                Public Website Showcase
              </span>
              <span className="text-[#A69385]">·</span>
              <span className="text-xs text-[#C5B7AC] font-mono">Zero-Price B2B Model</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Website Showcase Products Manager
            </h1>

            <p className="text-xs sm:text-sm text-[#C5B7AC] max-w-2xl leading-relaxed">
              Curate the exact craft specialties displayed on the public Savouré website. Add new dough recipes, update pack specs, and remove items with instant Cloud Firestore synchronization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onGoToWebsite && (
              <button
                type="button"
                onClick={onGoToWebsite}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/20"
              >
                <ExternalLink className="w-4 h-4 text-[#E0A282]" />
                <span>View Live Website</span>
              </button>
            )}

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#CC8468] hover:bg-[#B86643] text-[#1E0F07] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product to Website</span>
            </button>
          </div>
        </div>

        {bannerMessage && (
          <div className="mt-4 p-3 rounded-xl bg-white/10 text-white text-xs border border-white/20 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{bannerMessage}</span>
            </div>
            <button onClick={() => setBannerMessage(null)} className="text-stone-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E8D9CD] shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D5037] block">
            Featured on Website
          </span>
          <div className="text-2xl font-serif font-bold text-[#2B150A] mt-2">
            {showcaseProducts.length} Specialties
          </div>
          <span className="text-[11px] text-[#7A6458]">Displayed on Home & Products pages</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8D9CD] shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D5037] block">
            Pricing Architecture
          </span>
          <div className="text-2xl font-serif font-bold text-emerald-800 mt-2">
            Zero Prices
          </div>
          <span className="text-[11px] text-[#7A6458]">Enquire Now & WhatsApp CRM routing</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8D9CD] shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D5037] block">
            Cloud Sync Status
          </span>
          <div className="text-2xl font-serif font-bold text-[#8D5037] mt-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#CC8468]" />
            <span>Active Sync</span>
          </div>
          <span className="text-[11px] text-[#7A6458]">Changes push live instantly</span>
        </div>
      </div>

      {/* 3. SEARCH BAR */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8D5037] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search featured website products..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8D9CD] rounded-xl text-[#2B150A] placeholder-stone-400 focus:outline-hidden focus:border-[#CC8468]"
          />
        </div>
      </div>

      {/* 4. SHOWCASE PRODUCTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProducts.map((prod, idx) => (
          <div
            key={prod.id}
            className="bg-white rounded-3xl border border-[#E8D9CD] overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow"
          >
            {/* Visual Canvas */}
            <div className="h-48 bg-gradient-to-b from-[#FCF6F0] to-[#EBD0BA] p-4 relative flex items-center justify-center border-b border-[#E8D9CD]">
              <div className="w-36 h-36 flex items-center justify-center">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-white/80 text-[10px] font-mono font-bold text-[#75412E] border border-[#BD896E]/30">
                  #{idx + 1} · {prod.mark}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase">
                  Live on Website
                </span>
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(prod)}
                  className="p-1.5 rounded-full bg-white/90 hover:bg-white text-[#75412E] shadow-2xs transition-colors cursor-pointer"
                  title="Edit Product"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(prod)}
                  className="p-1.5 rounded-full bg-white/90 hover:bg-rose-50 text-rose-600 shadow-2xs transition-colors cursor-pointer"
                  title="Remove from Website"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Product Meta */}
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#8D5037]">
                    {prod.category}
                  </span>
                  <span className="text-xs text-[#7A6458] font-medium">{prod.detail}</span>
                </div>

                <h3 className="font-serif text-xl font-bold text-[#2B150A]">
                  {prod.name}
                </h3>

                <p className="text-xs text-[#66483B] leading-relaxed line-clamp-2">
                  {prod.description}
                </p>

                <div className="pt-1 flex flex-wrap gap-1.5">
                  {(prod.tags || []).map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#FBF7F1] border border-[#BD896E]/30 text-[10px] text-[#75412E]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specs & Actions */}
              <div className="pt-3 border-t border-[#E8D9CD]/70 flex items-center justify-between text-xs text-[#66483B]">
                <div>
                  <div className="font-medium text-[#2B150A]">{prod.packSpec}</div>
                  <div className="text-[11px] text-[#8D5037]">{prod.sizeSpec}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(prod)}
                    className="px-3 py-1.5 rounded-full bg-[#FBF7F1] hover:bg-[#EAD8C6] text-[#2B150A] font-semibold text-xs border border-[#BD896E]/30 cursor-pointer"
                  >
                    Edit Specs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(prod)}
                    className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 5. ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8D9CD]">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#2B150A]">
                  {editingItem ? `Edit Website Specialty: ${editingItem.name}` : 'Add New Specialty to Website Showcase'}
                </h3>
                <p className="text-xs text-[#66483B]">
                  Configures the product tile, packaging details, and description shown to public website visitors.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#75412E] mb-1">
                    Product Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Artisanal Garlic Naan"
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#75412E] mb-1">
                    Subtitle / Detail
                  </label>
                  <input
                    type="text"
                    value={formData.detail || ''}
                    onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                    placeholder="e.g. 6 flame-baked naans"
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#75412E] mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Flatbreads / Pastry"
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#75412E] mb-1">Color Palette Tone</label>
                  <select
                    value={formData.tone || 'roti'}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                  >
                    <option value="roti">Warm Amber (Roti Tone)</option>
                    <option value="wrap">Golden Sand (Wrap Tone)</option>
                    <option value="samosa">Crisp Terracotta (Samosa Tone)</option>
                    <option value="springroll">Toasted Bronze (Spring Roll Tone)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#75412E] mb-1">Mark Monogram</label>
                  <input
                    type="text"
                    value={formData.mark || ''}
                    onChange={(e) => setFormData({ ...formData, mark: e.target.value.toUpperCase() })}
                    placeholder="e.g. NAAN"
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#75412E] mb-1">Editorial Tagline</label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Melt-in-the-mouth buttery layers"
                  className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#75412E] mb-1">Product Story & Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Handcrafted using generational recipes with unbleached flour..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] focus:outline-hidden focus:border-[#CC8468]"
                />
              </div>

              {/* Packaging Artwork Selector */}
              <div>
                <label className="block text-xs font-bold text-[#75412E] mb-1">
                  Packaging Artwork Image
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
                  {PRESET_SHOWCASE_IMAGES.map((img) => (
                    <div
                      key={img.url}
                      onClick={() => setFormData({ ...formData, image: img.url })}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                        formData.image === img.url
                          ? 'border-[#CC8468] bg-[#CC8468]/15 ring-2 ring-[#CC8468]/30'
                          : 'border-[#E8D9CD] hover:border-[#BD896E]'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-12 h-12 object-contain" />
                      <span className="text-[9px] text-center text-[#2B150A] mt-1 line-clamp-1">{img.label}</span>
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.image || ''}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="Or enter custom image URL"
                  className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#75412E] mb-1">Packaging Spec</label>
                  <input
                    type="text"
                    value={formData.packSpec || ''}
                    onChange={(e) => setFormData({ ...formData, packSpec: e.target.value })}
                    placeholder="e.g. Pack of 12 Rotis (Dozen) & Catering Crates"
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#75412E] mb-1">Size Spec</label>
                  <input
                    type="text"
                    value={formData.sizeSpec || ''}
                    onChange={(e) => setFormData({ ...formData, sizeSpec: e.target.value })}
                    placeholder="e.g. 200mm Diameter"
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A]"
                  />
                </div>
              </div>

              {/* Tags & Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8D9CD]">
                <div>
                  <label className="block text-xs font-bold text-[#75412E] mb-1">Badges / Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="e.g. Halal, Vegan..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-3 py-1.5 rounded-xl bg-[#CC8468] text-white font-bold"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(formData.tags || []).map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-stone-100 text-[10px] flex items-center gap-1">
                        <span>{t}</span>
                        <button type="button" onClick={() => removeTag(t)} className="text-stone-400 hover:text-rose-600">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#75412E] mb-1">Product Highlights</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.value)}
                      placeholder="e.g. Multi-layered flake..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHighlight(); } }}
                    />
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="px-3 py-1.5 rounded-xl bg-[#CC8468] text-white font-bold"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {(formData.highlights || []).map((h) => (
                      <div key={h} className="text-[10px] text-[#66483B] flex items-center justify-between bg-stone-50 px-2 py-1 rounded">
                        <span>• {h}</span>
                        <button type="button" onClick={() => removeHighlight(h)} className="text-stone-400 hover:text-rose-600">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8D9CD] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#CC8468] hover:bg-[#B86643] text-white text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Update Website Product' : 'Add to Public Website'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
