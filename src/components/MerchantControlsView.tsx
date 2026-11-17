import React, { useState, useEffect, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import {
  DayOfWeekKey,
  MerchantPortalSettings,
  Product,
  User,
} from '../types/erp';
import {
  ORDERED_DAYS,
  checkMerchantPortalAccess,
  evaluateDeliveryScheduleConstraint,
  getTimeInTimezone,
  normalizeMerchantSettings,
} from '../utils/merchantRules';
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  PackageCheck,
  Store,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Calendar,
  SlidersHorizontal,
  Search,
  RotateCcw,
  ArrowUpRight,
  Zap,
  Globe,
  Scale,
  Users,
  Truck,
} from 'lucide-react';

interface MerchantControlsViewProps {
  initialTab?: 'hours' | 'moq' | 'products' | 'merchants';
  onNavigateModule?: (moduleId: string) => void;
}

export const MerchantControlsView: React.FC<MerchantControlsViewProps> = ({
  initialTab = 'hours',
  onNavigateModule,
}) => {
  const {
    merchantSettings,
    updateMerchantSettings,
    products,
    categories,
    updateProduct,
    users,
    updateUser,
    company,
    syncStatus,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'hours' | 'moq' | 'products' | 'merchants'>(initialTab);
  const [draft, setDraft] = useState<MerchantPortalSettings>(() =>
    normalizeMerchantSettings(merchantSettings)
  );
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<Date>(() => new Date());

  // Product MOQ inline editing state
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('ALL');
  const [productMoqEdits, setProductMoqEdits] = useState<Record<string, string>>({});
  const [savingProdId, setSavingProdId] = useState<string | null>(null);

  // Merchant Overrides inline editing state
  const [merchantSearch, setMerchantSearch] = useState('');
  const [merchantEdits, setMerchantEdits] = useState<
    Record<
      string,
      {
        bypassLoginHours: boolean;
        allowedLoginStart: string;
        allowedLoginEnd: string;
        customMoqUnits: string;
        customMinOrderValue: string;
      }
    >
  >({});
  const [savingMerchantId, setSavingMerchantId] = useState<string | null>(null);

  // Keep draft synced when external cloud snapshot updates
  useEffect(() => {
    setDraft(normalizeMerchantSettings(merchantSettings));
  }, [merchantSettings]);

  // Live 1-second clock tick for South Africa / configured timezone
  useEffect(() => {
    const timer = setInterval(() => setNowTick(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const merchantUsers = useMemo(
    () => (users || []).filter((u) => u.role === 'merchant'),
    [users]
  );

  // Sync per-merchant edit rows cleanly
  useEffect(() => {
    const map: typeof merchantEdits = {};
    merchantUsers.forEach((m) => {
      map[m.id] = {
        bypassLoginHours: Boolean(m.bypassLoginHours),
        allowedLoginStart: m.allowedLoginStart || '',
        allowedLoginEnd: m.allowedLoginEnd || '',
        customMoqUnits: m.customMoqUnits ? String(m.customMoqUnits) : '',
        customMinOrderValue: m.customMinOrderValue ? String(m.customMinOrderValue) : '',
      };
    });
    setMerchantEdits(map);
  }, [merchantUsers]);

  // Sync per-product MOQ inputs
  useEffect(() => {
    const map: Record<string, string> = {};
    (products || []).forEach((p) => {
      map[p.id] = p.moq && p.moq > 0 ? String(p.moq) : '';
    });
    setProductMoqEdits(map);
  }, [products]);

  const currency = company?.currency || 'R';
  const liveClock = getTimeInTimezone(draft.timezone, nowTick);
  const livePortalAccess = checkMerchantPortalAccess(draft, null, nowTick, 'order');
  const liveDeliveryCutoff = evaluateDeliveryScheduleConstraint({ settings: draft, now: nowTick });
  const hasUnsavedChanges =
    JSON.stringify(normalizeMerchantSettings(merchantSettings)) !==
    JSON.stringify(normalizeMerchantSettings(draft));

  const showNotice = (msg: string) => {
    setSaveFeedback(msg);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  const handleSaveSettings = async (overrideDraft?: MerchantPortalSettings) => {
    const target = overrideDraft || draft;
    setSaving(true);
    try {
      await updateMerchantSettings(target);
      showNotice('Merchant access schedule & MOQ rules saved and synced to Cloud Firestore.');
    } catch (err: any) {
      alert(err?.message || 'Failed to save merchant controls.');
    } finally {
      setSaving(false);
    }
  };

  const handleDayScheduleChange = (
    day: DayOfWeekKey,
    field: 'enabled' | 'openTime' | 'closeTime',
    value: boolean | string
  ) => {
    setDraft((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value,
        },
      },
    }));
  };

  const applySchedulePreset = (preset: 'website' | 'weekdays' | 'early-bakery' | 'copy-mon') => {
    if (preset === 'website') {
      setDraft((prev) => ({
        ...prev,
        schedule: {
          monday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
          tuesday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
          wednesday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
          thursday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
          friday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
          saturday: { enabled: true, openTime: '08:00', closeTime: '13:00' },
          sunday: { enabled: false, openTime: '08:00', closeTime: '13:00' },
        },
      }));
    } else if (preset === 'weekdays') {
      setDraft((prev) => ({
        ...prev,
        schedule: {
          monday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
          tuesday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
          wednesday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
          thursday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
          friday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
          saturday: { enabled: false, openTime: '08:00', closeTime: '13:00' },
          sunday: { enabled: false, openTime: '08:00', closeTime: '13:00' },
        },
      }));
    } else if (preset === 'early-bakery') {
      setDraft((prev) => ({
        ...prev,
        schedule: {
          monday: { enabled: true, openTime: '04:00', closeTime: '14:00' },
          tuesday: { enabled: true, openTime: '04:00', closeTime: '14:00' },
          wednesday: { enabled: true, openTime: '04:00', closeTime: '14:00' },
          thursday: { enabled: true, openTime: '04:00', closeTime: '14:00' },
          friday: { enabled: true, openTime: '04:00', closeTime: '14:00' },
          saturday: { enabled: true, openTime: '04:00', closeTime: '12:00' },
          sunday: { enabled: false, openTime: '04:00', closeTime: '12:00' },
        },
      }));
    } else if (preset === 'copy-mon') {
      setDraft((prev) => {
        const mon = prev.schedule.monday;
        return {
          ...prev,
          schedule: {
            ...prev.schedule,
            tuesday: { ...mon },
            wednesday: { ...mon },
            thursday: { ...mon },
            friday: { ...mon },
          },
        };
      });
    }
  };

  const handleSaveProductMoq = async (prod: Product, customVal?: string) => {
    const raw = customVal !== undefined ? customVal : (productMoqEdits[prod.id] || '');
    const parsed = Math.max(0, parseInt(raw, 10) || 0);
    setSavingProdId(prod.id);
    try {
      await updateProduct(prod.id, { moq: parsed > 0 ? parsed : 0 });
      showNotice(
        parsed > 0
          ? `Set MOQ of ${parsed} packs for "${prod.name}".`
          : `Cleared custom MOQ for "${prod.name}" (uses global line MOQ).`
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update product MOQ.');
    } finally {
      setSavingProdId(null);
    }
  };

  const handleSaveMerchantOverride = async (merchant: User) => {
    const edit = merchantEdits[merchant.id];
    if (!edit) return;
    setSavingMerchantId(merchant.id);
    try {
      await updateUser(merchant.id, {
        bypassLoginHours: edit.bypassLoginHours,
        allowedLoginStart: edit.allowedLoginStart.trim() || undefined,
        allowedLoginEnd: edit.allowedLoginEnd.trim() || undefined,
        customMoqUnits: Math.max(0, parseInt(edit.customMoqUnits, 10) || 0),
        customMinOrderValue: Math.max(0, parseFloat(edit.customMinOrderValue) || 0),
      });
      showNotice(`Saved login & MOQ overrides for ${merchant.merchantStoreName || merchant.name}.`);
    } catch (err: any) {
      alert(err?.message || 'Failed to save merchant override.');
    } finally {
      setSavingMerchantId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    return (products || []).filter((p) => {
      const matchCat = productCatFilter === 'ALL' || (p.category || '').trim() === productCatFilter;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, productSearch, productCatFilter]);

  const filteredMerchants = useMemo(() => {
    const q = merchantSearch.toLowerCase().trim();
    return merchantUsers.filter((m) => {
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.merchantStoreName || '').toLowerCase().includes(q) ||
        (m.branch || '').toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    });
  }, [merchantUsers, merchantSearch]);

  const customMoqProductsCount = (products || []).filter((p) => (p.moq || 0) > 0).length;
  const overrideMerchantsCount = merchantUsers.filter(
    (m) =>
      m.bypassLoginHours ||
      (m.customMoqUnits || 0) > 0 ||
      (m.customMinOrderValue || 0) > 0 ||
      Boolean(m.allowedLoginStart && m.allowedLoginEnd)
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. EXECUTIVE HEADER & LIVE STATUS */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C98A5B]/15 text-[#DE9E74] text-[11px] font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>Merchant Ordering &amp; MOQ Control Center</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border bg-emerald-950/80 text-emerald-300 border-emerald-700/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Portal Always Open (24/7)</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  livePortalAccess.orderingAllowed
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                    : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    livePortalAccess.orderingAllowed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>
                  {draft.manualLockdown
                    ? 'Orders Paused (Manual Pause)'
                    : !draft.enforceLoginHours
                    ? 'Ordering Window: Open 24/7'
                    : livePortalAccess.orderingAllowed
                    ? `Ordering Open (${livePortalAccess.todayWindowText})`
                    : `Ordering Closed Now (${livePortalAccess.todayWindowText})`}
                </span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Merchant Ordering Windows, Cutoff &amp; MOQ Rules
            </h1>
            <p className="mt-1 text-xs text-[#A69385] max-w-2xl leading-relaxed">
              Keep merchant portal access open 24/7 for invoices, PODs, statements, and draft carts while controlling daily order submission times, next-day delivery cutoffs, global &amp; SKU MOQs, and per-merchant VIP overrides.
            </p>
          </div>

          {/* Live Clock + Save Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-xl bg-[#120F0D] border border-[#2C211B] text-right">
              <div className="text-[10px] uppercase tracking-wider text-[#A69385] font-semibold">
                {liveClock.dayLabel} · {draft.timezone.split('/').pop()?.replace('_', ' ')}
              </div>
              <div className="text-lg font-mono font-bold text-[#DE9E74] tabular-nums">
                {liveClock.timeWithSeconds}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={saving}
              className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-[#C98A5B] to-[#DE9E74] text-[#120F0D] ring-2 ring-[#DE9E74]/50 animate-pulse'
                  : 'bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D]'
              } disabled:opacity-60`}
            >
              <Save className="w-4 h-4" />
              <span>
                {saving
                  ? 'Syncing Rules...'
                  : hasUnsavedChanges
                  ? 'Save & Publish Changes'
                  : `Saved (${syncStatus === 'synced' ? 'Cloud Live' : 'Local'})`}
              </span>
            </button>
          </div>
        </div>

        {/* KPI Status Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#120F0D] border border-[#2C211B]">
            <div className="text-[10px] uppercase tracking-wider text-[#A69385]">Portal Access</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-emerald-400">Always Open 24/7</span>
              <span className="text-[11px] font-mono text-[#A69385]">Invoices &amp; Carts</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#120F0D] border border-[#2C211B]">
            <div className="text-[10px] uppercase tracking-wider text-[#A69385]">Daily Ordering Window</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className={`text-sm font-bold ${draft.enforceLoginHours ? 'text-emerald-400' : 'text-[#EDE6DE]'}`}>
                {draft.enforceLoginHours ? 'Timed Window' : 'Unrestricted (24/7)'}
              </span>
              <span className="text-[11px] font-mono text-[#DE9E74]">{livePortalAccess.todayWindowText}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#120F0D] border border-[#2C211B]">
            <div className="text-[10px] uppercase tracking-wider text-[#A69385]">Next-Day Delivery Cutoff</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className={`text-sm font-bold ${draft.enforceNextDayCutoff ? 'text-emerald-400' : 'text-[#EDE6DE]'}`}>
                {draft.enforceNextDayCutoff ? `Before ${draft.nextDayCutoffTime}` : 'Flexible (Off)'}
              </span>
              <span className="text-[11px] font-mono text-[#DE9E74]">
                {draft.enforceNextDayCutoff
                  ? liveDeliveryCutoff.isTomorrowAvailable
                    ? 'Tomorrow Open'
                    : `Next: ${liveDeliveryCutoff.minAllowedDate}`
                  : `${customMoqProductsCount} SKU MOQs`}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#120F0D] border border-[#2C211B]">
            <div className="text-[10px] uppercase tracking-wider text-[#A69385]">Order MOQ &amp; Overrides</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className={`text-sm font-bold ${draft.enforceMoq ? 'text-emerald-400' : 'text-[#EDE6DE]'}`}>
                {draft.enforceMoq ? 'MOQ Enforced' : 'MOQ Off'}
              </span>
              <span className="text-[11px] font-mono text-[#DE9E74]">
                {draft.globalMinOrderQty > 0 ? `${draft.globalMinOrderQty} packs` : `${overrideMerchantsCount} VIP`}
              </span>
            </div>
          </div>
        </div>

        {/* Save Feedback Banner */}
        {saveFeedback && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveFeedback}</span>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#2C211B]">
          {[
            { id: 'hours', label: 'Ordering Window & Cutoff', icon: Clock },
            { id: 'moq', label: 'Global MOQ Rules', icon: Scale },
            { id: 'products', label: `Product MOQs (${products.length})`, icon: PackageCheck },
            { id: 'merchants', label: `Merchant Overrides (${merchantUsers.length})`, icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C98A5B] text-[#120F0D] shadow-sm'
                    : 'bg-[#120F0D] text-[#A69385] hover:text-white border border-[#2C211B]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: ORDERING WINDOW, 24/7 ACCESS & NEXT-DAY DELIVERY CUTOFF    */}
      {/* ================================================================= */}
      {activeTab === 'hours' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Portal Access, Ordering Window, Next-Day Cutoff & Pause (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Portal Always Open 24/7 Guarantee */}
            <div className="bg-[#171311] border border-emerald-800/40 rounded-2xl p-5 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Portal Always Open (24/7)</span>
                  </h2>
                  <p className="text-xs text-[#A69385] mt-1 leading-relaxed">
                    The Merchant Portal never closes — merchants can always sign in anytime to view invoices, PODs, statements, and build draft carts. Only new order submissions follow the ordering hours &amp; next-day cutoff below.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-[11px] font-bold border bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shrink-0">
                  24/7 OPEN
                </span>
              </div>
            </div>

            {/* 2. Daily Ordering Window Switch */}
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#DE9E74]" />
                    <span>Enforce Daily Ordering Window</span>
                  </h2>
                  <p className="text-xs text-[#A69385] mt-1 leading-relaxed">
                    Only accept new wholesale order submissions between the daily open &amp; close times configured on the right (e.g. 08:00 to 17:00).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = { ...draft, enforceLoginHours: !draft.enforceLoginHours };
                    setDraft(next);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                    draft.enforceLoginHours
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                      : 'bg-[#221B17] border-[#3A2D25] text-[#A69385]'
                  }`}
                >
                  {draft.enforceLoginHours ? 'ACTIVE' : 'OFF (24/7)'}
                </button>
              </div>

              <div className="pt-3 border-t border-[#2C211B] space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#EDE6DE] mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#DE9E74]" />
                    <span>Bakery Operations Timezone</span>
                  </label>
                  <select
                    value={draft.timezone}
                    onChange={(e) => setDraft((prev) => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-xl text-xs text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    <option value="Africa/Johannesburg">Africa/Johannesburg (SAST, UTC+2)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#EDE6DE] mb-1.5">
                    Outside-Ordering-Window Message (Shown in Portal)
                  </label>
                  <textarea
                    rows={2}
                    value={draft.closedHoursMessage}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, closedHoursMessage: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-xl text-xs text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>
            </div>

            {/* 3. Next-Day Delivery Cutoff & Lead Time */}
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#DE9E74]" />
                    <span>Next-Day Delivery Cutoff</span>
                  </h2>
                  <p className="text-xs text-[#A69385] mt-1 leading-relaxed">
                    Set a daily cutoff time for orders requiring tomorrow&apos;s delivery. After cutoff, merchants can only schedule delivery from the following day (+2 days).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      enforceNextDayCutoff: !prev.enforceNextDayCutoff,
                    }))
                  }
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                    draft.enforceNextDayCutoff
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                      : 'bg-[#221B17] border-[#3A2D25] text-[#A69385]'
                  }`}
                >
                  {draft.enforceNextDayCutoff ? 'ENFORCED' : 'OFF'}
                </button>
              </div>

              <div className="pt-3 border-t border-[#2C211B] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#EDE6DE] mb-1">
                      Daily Cutoff for Tomorrow&apos;s Delivery
                    </label>
                    <input
                      type="time"
                      value={draft.nextDayCutoffTime}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, nextDayCutoffTime: e.target.value || '14:00' }))
                      }
                      className="w-full px-3 py-2 bg-[#120F0D] border border-[#3A2D25] rounded-xl text-xs font-mono text-white focus:outline-hidden focus:border-[#C98A5B]"
                    />
                  </div>

                  <label className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#120F0D] border border-[#2C211B] cursor-pointer">
                    <div>
                      <div className="text-[11px] font-semibold text-white">Allow Same-Day</div>
                      <div className="text-[10px] text-[#8A776B]">Today before cutoff</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.allowSameDayDelivery}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, allowSameDayDelivery: e.target.checked }))
                      }
                      className="w-4 h-4 accent-[#C98A5B] cursor-pointer"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#EDE6DE] mb-1.5">
                    Cutoff Explanation Message
                  </label>
                  <textarea
                    rows={2}
                    value={draft.nextDayCutoffMessage}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, nextDayCutoffMessage: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-xl text-xs text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div
                  className={`p-3 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                    !draft.enforceNextDayCutoff
                      ? 'bg-[#120F0D] border-[#2C211B] text-[#A69385]'
                      : liveDeliveryCutoff.isTomorrowAvailable
                      ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200'
                      : 'bg-amber-950/40 border-amber-700/50 text-amber-200'
                  }`}
                >
                  <span>
                    {!draft.enforceNextDayCutoff
                      ? `Preview: Enable cutoff to lock Tomorrow delivery after ${draft.nextDayCutoffTime}.`
                      : liveDeliveryCutoff.isTomorrowAvailable
                      ? `Before ${draft.nextDayCutoffTime} today → Tomorrow (${liveDeliveryCutoff.tomorrowDate}) available`
                      : `After ${draft.nextDayCutoffTime} cutoff → Earliest delivery is ${liveDeliveryCutoff.minAllowedDate}`}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Pause New Order Submissions */}
            <div
              className={`border rounded-2xl p-6 space-y-4 transition-colors ${
                draft.manualLockdown
                  ? 'bg-rose-950/30 border-rose-700/60'
                  : 'bg-[#171311] border-[#2C211B]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
                    {draft.manualLockdown ? (
                      <Lock className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>Pause New Order Submissions</span>
                  </h2>
                  <p className="text-xs text-[#A69385] mt-1">
                    Instantly pause incoming wholesale order submissions (e.g. public holiday or full oven capacity). Merchants can still access invoices &amp; PODs while portal access is 24/7.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = { ...draft, manualLockdown: !draft.manualLockdown };
                    setDraft(next);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                    draft.manualLockdown
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-[#221B17] border-[#3A2D25] text-[#A69385]'
                  }`}
                >
                  {draft.manualLockdown ? 'PAUSED' : 'NORMAL'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#EDE6DE] mb-1.5">
                  Manual Pause Notice Message
                </label>
                <textarea
                  rows={2}
                  value={draft.lockdownMessage}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, lockdownMessage: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-xl text-xs text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>
            </div>
          </div>

          {/* Right: 7-Day Ordering Window Matrix (7 cols) */}
          <div className="lg:col-span-7 bg-[#171311] border border-[#2C211B] rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2C211B]">
              <div>
                <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#DE9E74]" />
                  <span>Daily Wholesale Ordering Window</span>
                </h2>
                <p className="text-xs text-[#A69385] mt-0.5">
                  Set exact open &amp; close hours for when merchants can submit orders each day ({draft.timezone}).
                </p>
              </div>
            </div>

            {/* Quick Schedule Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-[#A69385] font-semibold mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => applySchedulePreset('website')}
                className="px-3 py-1.5 rounded-lg bg-[#221B17] hover:bg-[#2C211B] border border-[#3A2D25] text-[11px] text-[#DE9E74] font-semibold cursor-pointer"
              >
                Website Hours (Mon–Fri 08–17, Sat 08–13)
              </button>
              <button
                type="button"
                onClick={() => applySchedulePreset('weekdays')}
                className="px-3 py-1.5 rounded-lg bg-[#221B17] hover:bg-[#2C211B] border border-[#3A2D25] text-[11px] text-[#EDE6DE] font-semibold cursor-pointer"
              >
                Mon–Fri 08:00–17:00
              </button>
              <button
                type="button"
                onClick={() => applySchedulePreset('early-bakery')}
                className="px-3 py-1.5 rounded-lg bg-[#221B17] hover:bg-[#2C211B] border border-[#3A2D25] text-[11px] text-[#EDE6DE] font-semibold cursor-pointer"
              >
                Early Dispatch (04:00–14:00)
              </button>
              <button
                type="button"
                onClick={() => applySchedulePreset('copy-mon')}
                className="px-3 py-1.5 rounded-lg bg-[#120F0D] hover:bg-[#221B17] border border-[#2C211B] text-[11px] text-[#A69385] font-semibold cursor-pointer"
              >
                Copy Mon &rarr; Mon–Fri
              </button>
            </div>

            {/* Day Rows */}
            <div className="space-y-2.5">
              {ORDERED_DAYS.map(({ key, label }) => {
                const slot = draft.schedule[key];
                const isToday = liveClock.dayKey === key;

                return (
                  <div
                    key={key}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isToday
                        ? 'bg-[#221B17] border-[#C98A5B]/60'
                        : 'bg-[#120F0D] border-[#2C211B]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[160px]">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={(e) =>
                          handleDayScheduleChange(key, 'enabled', e.target.checked)
                        }
                        className="w-4 h-4 accent-[#C98A5B] cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{label}</span>
                          {isToday && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#C98A5B]/25 text-[#DE9E74] font-mono uppercase">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#8A776B]">
                          {slot.enabled ? `${slot.openTime} – ${slot.closeTime}` : 'Closed all day'}
                        </div>
                      </div>
                    </div>

                    {slot.enabled ? (
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase text-[#A69385]">Open</span>
                          <input
                            type="time"
                            value={slot.openTime}
                            onChange={(e) =>
                              handleDayScheduleChange(key, 'openTime', e.target.value)
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-[#171311] border border-[#3A2D25] text-xs font-mono text-white focus:outline-hidden focus:border-[#C98A5B]"
                          />
                        </div>
                        <span className="text-[#6E5B4F] text-xs">to</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase text-[#A69385]">Close</span>
                          <input
                            type="time"
                            value={slot.closeTime}
                            onChange={(e) =>
                              handleDayScheduleChange(key, 'closeTime', e.target.value)
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-[#171311] border border-[#3A2D25] text-xs font-mono text-white focus:outline-hidden focus:border-[#C98A5B]"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-rose-400/90 px-3 py-1 rounded-lg bg-rose-950/40 border border-rose-900/40">
                        Orders Closed on {label}s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: GLOBAL MOQ RULES                                           */}
      {/* ================================================================= */}
      {activeTab === 'moq' && (
        <div className="space-y-6">
          <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C211B]">
              <div>
                <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#DE9E74]" />
                  <span>Wholesale Minimum Order Quantity (MOQ) Enforcement</span>
                </h2>
                <p className="text-xs text-[#A69385] mt-1">
                  Configure global minimum total packs, per-line item MOQs, and minimum order value ({currency}) enforced directly in the Merchant Portal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, enforceMoq: !prev.enforceMoq }))}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                  draft.enforceMoq
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-[#221B17] border-[#3A2D25] text-[#A69385]'
                }`}
              >
                {draft.enforceMoq ? 'MOQ ENFORCEMENT: ON' : 'MOQ ENFORCEMENT: OFF'}
              </button>
            </div>

            {!draft.enforceMoq &&
              (draft.globalMinOrderQty > 0 ||
                draft.globalMinLineQty > 0 ||
                draft.globalMinOrderValue > 0 ||
                customMoqProductsCount > 0) && (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      You have MOQ limits configured, but <strong>MOQ Enforcement is currently OFF</strong>. Enable it so merchants are required to meet these thresholds before checkout.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, enforceMoq: true }))}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-400 text-[#120F0D] font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Turn Enforcement ON
                  </button>
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Rule 1: Global Min Order Packs */}
              <div className="p-5 rounded-2xl bg-[#120F0D] border border-[#2C211B] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Min Total Packs per Order</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#221B17] text-[#DE9E74] font-mono">
                    Basket Qty
                  </span>
                </div>
                <p className="text-[11px] text-[#8A776B] leading-relaxed">
                  Total combined packs/cases across all items in the merchant&apos;s order. Set 0 for no global pack minimum.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={draft.globalMinOrderQty}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        globalMinOrderQty: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-[#171311] border border-[#3A2D25] rounded-xl text-sm font-mono font-bold text-white focus:outline-hidden focus:border-[#C98A5B]"
                  />
                  <span className="text-xs text-[#A69385] font-mono shrink-0">packs</span>
                </div>
              </div>

              {/* Rule 2: Default Per-Product Line MOQ */}
              <div className="p-5 rounded-2xl bg-[#120F0D] border border-[#2C211B] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Default Min Qty per Item</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#221B17] text-[#DE9E74] font-mono">
                    Per SKU
                  </span>
                </div>
                <p className="text-[11px] text-[#8A776B] leading-relaxed">
                  Minimum packs required for each product ordered, unless that product has its own custom MOQ set.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={draft.globalMinLineQty}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        globalMinLineQty: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-[#171311] border border-[#3A2D25] rounded-xl text-sm font-mono font-bold text-white focus:outline-hidden focus:border-[#C98A5B]"
                  />
                  <span className="text-xs text-[#A69385] font-mono shrink-0">packs / SKU</span>
                </div>
              </div>

              {/* Rule 3: Minimum Order Value */}
              <div className="p-5 rounded-2xl bg-[#120F0D] border border-[#2C211B] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Min Order Value ({currency})</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#221B17] text-[#DE9E74] font-mono">
                    Subtotal
                  </span>
                </div>
                <p className="text-[11px] text-[#8A776B] leading-relaxed">
                  Minimum monetary subtotal required per commercial order before delivery dispatch is permitted.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#DE9E74] font-mono font-bold shrink-0">{currency}</span>
                  <input
                    type="number"
                    min={0}
                    step="10"
                    value={draft.globalMinOrderValue}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        globalMinOrderValue: Math.max(0, parseFloat(e.target.value) || 0),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-[#171311] border border-[#3A2D25] rounded-xl text-sm font-mono font-bold text-white focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>
              </div>
            </div>

            {/* Live Rule Summary */}
            <div className="p-5 rounded-2xl bg-[#221B17] border border-[#C98A5B]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#DE9E74] uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Linked Portal Summary</span>
                </div>
                <p className="text-xs text-[#EDE6DE]">
                  {draft.enforceMoq
                    ? `Merchants must order at least ${
                        draft.globalMinOrderQty > 0 ? `${draft.globalMinOrderQty} total packs` : 'any total quantity'
                      }${
                        draft.globalMinLineQty > 0 ? `, min ${draft.globalMinLineQty} packs per item` : ''
                      }${
                        draft.globalMinOrderValue > 0 ? `, and min ${currency} ${draft.globalMinOrderValue.toFixed(2)} order total` : ''
                      } (unless overridden per product or per merchant).`
                    : 'MOQ enforcement is currently disabled. Merchants can submit any non-empty order.'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="px-3.5 py-2 rounded-xl bg-[#120F0D] border border-[#3A2D25] text-xs font-semibold text-[#DE9E74] hover:border-[#C98A5B] cursor-pointer"
                >
                  Configure Product MOQs &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: PRODUCT-LEVEL MOQ TABLE                                    */}
      {/* ================================================================= */}
      {activeTab === 'products' && (
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-[#DE9E74]" />
                <span>Product-Level Minimum Order Quantities ({filteredProducts.length})</span>
              </h2>
              <p className="text-xs text-[#A69385]">
                Set custom pack minimums per bakery product. Leave 0/empty to inherit the Global Per-Item MOQ ({draft.globalMinLineQty || 'None'}).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-[#A69385] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search SKU or product..."
                  className="pl-9 pr-3 py-1.5 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B] w-52"
                />
              </div>

              <select
                value={productCatFilter}
                onChange={(e) => setProductCatFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white focus:outline-hidden focus:border-[#C98A5B]"
              >
                <option value="ALL">All Categories</option>
                {(categories || []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {onNavigateModule && (
                <button
                  type="button"
                  onClick={() => onNavigateModule('catalog')}
                  className="px-3 py-1.5 rounded-lg bg-[#221B17] border border-[#3A2D25] text-xs font-semibold text-[#DE9E74] hover:border-[#C98A5B] flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Catalog</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-[#2C211B] rounded-xl bg-[#120F0D] space-y-2">
              <PackageCheck className="w-10 h-10 text-[#6E5B4F] mx-auto" />
              <div className="text-sm font-semibold text-white">No Products Found</div>
              <p className="text-xs text-[#8A776B]">
                Add bakery items in Admin ERP &rarr; Product Catalog to set individual SKU MOQs.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#2C211B]">
              <table className="w-full text-left text-xs text-[#EDE6DE]">
                <thead className="bg-[#221B17] text-[#A69385] uppercase text-[10px] font-serif tracking-wider border-b border-[#2C211B]">
                  <tr>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category &amp; Pack</th>
                    <th className="py-3 px-4 text-right">Wholesale Price</th>
                    <th className="py-3 px-4">Custom Product MOQ (Packs)</th>
                    <th className="py-3 px-4">Effective Rule</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C211B]">
                  {filteredProducts.map((p) => {
                    const editVal = productMoqEdits[p.id] ?? '';
                    const effectiveMoq =
                      p.moq && p.moq > 0 ? p.moq : draft.globalMinLineQty || 0;
                    const isModified =
                      (parseInt(editVal, 10) || 0) !== (p.moq || 0);

                    return (
                      <tr key={p.id} className="hover:bg-[#221B17]/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-[#DE9E74]">{p.sku}</td>
                        <td className="py-3 px-4 font-semibold text-white">{p.name}</td>
                        <td className="py-3 px-4 text-[#A69385]">
                          {p.category || 'General'} · {p.packSize}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-white">
                          {currency} {Number(p.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min={0}
                            placeholder={draft.globalMinLineQty ? `Global (${draft.globalMinLineQty})` : '0'}
                            value={editVal}
                            onChange={(e) =>
                              setProductMoqEdits((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            className="w-28 px-2.5 py-1.5 bg-[#120F0D] border border-[#3A2D25] rounded-lg text-xs font-mono text-white focus:outline-hidden focus:border-[#C98A5B]"
                          />
                        </td>
                        <td className="py-3 px-4">
                          {effectiveMoq > 0 ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                p.moq && p.moq > 0
                                  ? 'bg-[#C98A5B]/20 text-[#DE9E74] border border-[#C98A5B]/40'
                                  : 'bg-[#221B17] text-[#A69385] border border-[#3A2D25]'
                              }`}
                            >
                              Min {effectiveMoq} {p.moq && p.moq > 0 ? '(Custom)' : '(Global)'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#6E5B4F]">No min (1+)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={savingProdId === p.id}
                              onClick={() => handleSaveProductMoq(p)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                isModified
                                  ? 'bg-[#C98A5B] text-[#120F0D]'
                                  : 'bg-[#221B17] text-[#EDE6DE] hover:bg-[#2C211B]'
                              }`}
                            >
                              {savingProdId === p.id ? 'Saving...' : 'Save'}
                            </button>
                            {(p.moq || 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSaveProductMoq(p, '0')}
                                title="Clear product MOQ"
                                className="p-1.5 rounded-lg bg-[#120F0D] text-[#A69385] hover:text-white cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: PER-MERCHANT LOGIN & MOQ OVERRIDES                         */}
      {/* ================================================================= */}
      {activeTab === 'merchants' && (
        <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-[#DE9E74]" />
                <span>Merchant-Specific Login &amp; MOQ Overrides ({filteredMerchants.length})</span>
              </h2>
              <p className="text-xs text-[#A69385]">
                Grant specific wholesale partners 24/7 VIP login access, custom sign-in hours, or tailored minimum order thresholds.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-[#A69385] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={merchantSearch}
                  onChange={(e) => setMerchantSearch(e.target.value)}
                  placeholder="Search merchant or branch..."
                  className="pl-9 pr-3 py-1.5 bg-[#120F0D] border border-[#2C211B] rounded-lg text-xs text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B] w-56"
                />
              </div>

              {onNavigateModule && (
                <button
                  type="button"
                  onClick={() => onNavigateModule('merchants')}
                  className="px-3 py-1.5 rounded-lg bg-[#221B17] border border-[#3A2D25] text-xs font-semibold text-[#DE9E74] hover:border-[#C98A5B] flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage Merchants</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {filteredMerchants.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-[#2C211B] rounded-xl bg-[#120F0D] space-y-2">
              <Users className="w-10 h-10 text-[#6E5B4F] mx-auto" />
              <div className="text-sm font-semibold text-white">No Merchants Registered</div>
              <p className="text-xs text-[#8A776B]">
                Register commercial merchant accounts in Admin ERP &rarr; Merchants &amp; Branches to configure per-account overrides.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#2C211B]">
              <table className="w-full text-left text-xs text-[#EDE6DE]">
                <thead className="bg-[#221B17] text-[#A69385] uppercase text-[10px] font-serif tracking-wider border-b border-[#2C211B]">
                  <tr>
                    <th className="py-3 px-4">Merchant &amp; Branch</th>
                    <th className="py-3 px-4 text-center">VIP Order Bypass</th>
                    <th className="py-3 px-4">Custom Ordering Window</th>
                    <th className="py-3 px-4">Custom Min Packs</th>
                    <th className="py-3 px-4">Custom Min Spend ({currency})</th>
                    <th className="py-3 px-4 text-right">Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C211B]">
                  {filteredMerchants.map((m) => {
                    const edit = merchantEdits[m.id] || {
                      bypassLoginHours: Boolean(m.bypassLoginHours),
                      allowedLoginStart: m.allowedLoginStart || '',
                      allowedLoginEnd: m.allowedLoginEnd || '',
                      customMoqUnits: m.customMoqUnits ? String(m.customMoqUnits) : '',
                      customMinOrderValue: m.customMinOrderValue ? String(m.customMinOrderValue) : '',
                    };

                    return (
                      <tr key={m.id} className="hover:bg-[#221B17]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">
                            {m.merchantStoreName || m.name}
                          </div>
                          <div className="text-[11px] text-[#A69385]">
                            {m.name} · {m.branch || 'Main Branch'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setMerchantEdits((prev) => ({
                                ...prev,
                                [m.id]: {
                                  ...edit,
                                  bypassLoginHours: !edit.bypassLoginHours,
                                },
                              }))
                            }
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${
                              edit.bypassLoginHours
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                : 'bg-[#120F0D] text-[#8A776B] border-[#3A2D25]'
                            }`}
                          >
                            {edit.bypassLoginHours ? '24/7 VIP' : 'Standard Hours'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              disabled={edit.bypassLoginHours}
                              value={edit.allowedLoginStart}
                              onChange={(e) =>
                                setMerchantEdits((prev) => ({
                                  ...prev,
                                  [m.id]: { ...edit, allowedLoginStart: e.target.value },
                                }))
                              }
                              className="px-2 py-1 rounded-lg bg-[#120F0D] border border-[#3A2D25] text-[11px] font-mono text-white disabled:opacity-40"
                            />
                            <span className="text-[#6E5B4F]">–</span>
                            <input
                              type="time"
                              disabled={edit.bypassLoginHours}
                              value={edit.allowedLoginEnd}
                              onChange={(e) =>
                                setMerchantEdits((prev) => ({
                                  ...prev,
                                  [m.id]: { ...edit, allowedLoginEnd: e.target.value },
                                }))
                              }
                              className="px-2 py-1 rounded-lg bg-[#120F0D] border border-[#3A2D25] text-[11px] font-mono text-white disabled:opacity-40"
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <input
                            type="number"
                            min={0}
                            placeholder={draft.globalMinOrderQty ? `Global (${draft.globalMinOrderQty})` : 'Global'}
                            value={edit.customMoqUnits}
                            onChange={(e) =>
                              setMerchantEdits((prev) => ({
                                ...prev,
                                [m.id]: { ...edit, customMoqUnits: e.target.value },
                              }))
                            }
                            className="w-28 px-2.5 py-1.5 bg-[#120F0D] border border-[#3A2D25] rounded-lg text-xs font-mono text-white"
                          />
                        </td>

                        <td className="py-3.5 px-4">
                          <input
                            type="number"
                            min={0}
                            step="10"
                            placeholder={draft.globalMinOrderValue ? `Global (${draft.globalMinOrderValue})` : 'Global'}
                            value={edit.customMinOrderValue}
                            onChange={(e) =>
                              setMerchantEdits((prev) => ({
                                ...prev,
                                [m.id]: { ...edit, customMinOrderValue: e.target.value },
                              }))
                            }
                            className="w-28 px-2.5 py-1.5 bg-[#120F0D] border border-[#3A2D25] rounded-lg text-xs font-mono text-white"
                          />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            disabled={savingMerchantId === m.id}
                            onClick={() => handleSaveMerchantOverride(m)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-[11px] cursor-pointer transition-all"
                          >
                            {savingMerchantId === m.id ? 'Saving...' : 'Apply'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
