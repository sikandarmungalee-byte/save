import type {
  DayOfWeekKey,
  MerchantDaySchedule,
  MerchantOrderItem,
  MerchantPortalSettings,
  Product,
  User,
} from '../types/erp';

export const ORDERED_DAYS: { key: DayOfWeekKey; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

export const DEFAULT_MERCHANT_PORTAL_SETTINGS: MerchantPortalSettings = {
  enforceLoginHours: false,
  manualLockdown: false,
  lockdownMessage:
    'The Wholesale Merchant Portal is temporarily paused by Savouré Dispatch. Please contact our kitchen desk for urgent orders.',
  closedHoursMessage:
    'Merchant portal sign-in is only open during scheduled wholesale ordering hours.',
  timezone: 'Africa/Johannesburg',
  autoLogoutOutsideHours: true,
  schedule: {
    monday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
    tuesday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
    wednesday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
    thursday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
    friday: { enabled: true, openTime: '08:00', closeTime: '17:00' },
    saturday: { enabled: true, openTime: '08:00', closeTime: '13:00' },
    sunday: { enabled: false, openTime: '08:00', closeTime: '13:00' },
  },
  enforceMoq: false,
  globalMinOrderQty: 0,
  globalMinLineQty: 0,
  globalMinOrderValue: 0,
};

export function normalizeMerchantSettings(
  raw?: Partial<MerchantPortalSettings> | null
): MerchantPortalSettings {
  const baseSchedule = DEFAULT_MERCHANT_PORTAL_SETTINGS.schedule;
  const incomingSchedule = (raw?.schedule || {}) as Partial<Record<DayOfWeekKey, MerchantDaySchedule>>;
  const mergedSchedule = {} as Record<DayOfWeekKey, MerchantDaySchedule>;

  for (const { key } of ORDERED_DAYS) {
    const def = baseSchedule[key];
    const inc = incomingSchedule[key];
    mergedSchedule[key] = {
      enabled: inc?.enabled !== undefined ? Boolean(inc.enabled) : def.enabled,
      openTime: inc?.openTime || def.openTime,
      closeTime: inc?.closeTime || def.closeTime,
    };
  }

  return {
    enforceLoginHours:
      raw?.enforceLoginHours !== undefined
        ? Boolean(raw.enforceLoginHours)
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.enforceLoginHours,
    manualLockdown:
      raw?.manualLockdown !== undefined
        ? Boolean(raw.manualLockdown)
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.manualLockdown,
    lockdownMessage:
      typeof raw?.lockdownMessage === 'string' && raw.lockdownMessage.trim()
        ? raw.lockdownMessage
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.lockdownMessage,
    closedHoursMessage:
      typeof raw?.closedHoursMessage === 'string' && raw.closedHoursMessage.trim()
        ? raw.closedHoursMessage
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.closedHoursMessage,
    timezone:
      typeof raw?.timezone === 'string' && raw.timezone.trim()
        ? raw.timezone
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.timezone,
    autoLogoutOutsideHours:
      raw?.autoLogoutOutsideHours !== undefined
        ? Boolean(raw.autoLogoutOutsideHours)
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.autoLogoutOutsideHours,
    schedule: mergedSchedule,
    enforceMoq:
      raw?.enforceMoq !== undefined
        ? Boolean(raw.enforceMoq)
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.enforceMoq,
    globalMinOrderQty: Math.max(0, Number(raw?.globalMinOrderQty) || 0),
    globalMinLineQty: Math.max(0, Number(raw?.globalMinLineQty) || 0),
    globalMinOrderValue: Math.max(0, Number(raw?.globalMinOrderValue) || 0),
    updatedAt: raw?.updatedAt,
    updatedBy: raw?.updatedBy,
  };
}

export function parseHHMMToMinutes(hhmm: string): number {
  if (!hhmm || !hhmm.includes(':')) return 0;
  const [hStr, mStr] = hhmm.split(':');
  const h = Math.min(23, Math.max(0, parseInt(hStr, 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(mStr, 10) || 0));
  return h * 60 + m;
}

export function getTimeInTimezone(timezone: string, now: Date = new Date()): {
  dayKey: DayOfWeekKey;
  dayLabel: string;
  timeHHMM: string;
  timeWithSeconds: string;
  minutesOfDay: number;
} {
  const tz = timezone || 'Africa/Johannesburg';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const weekday = (parts.find((p) => p.type === 'weekday')?.value || 'Monday').toLowerCase();
    let hour = parts.find((p) => p.type === 'hour')?.value || '08';
    if (hour === '24') hour = '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    const second = parts.find((p) => p.type === 'second')?.value || '00';

    const validDay = ORDERED_DAYS.find((d) => d.key === weekday) || ORDERED_DAYS[0];
    const hh = parseInt(hour, 10) || 0;
    const mm = parseInt(minute, 10) || 0;

    return {
      dayKey: validDay.key,
      dayLabel: validDay.label,
      timeHHMM: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
      timeWithSeconds: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${second.padStart(2, '0')}`,
      minutesOfDay: hh * 60 + mm,
    };
  } catch {
    const days: DayOfWeekKey[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayKey = days[now.getDay()] || 'monday';
    const hh = now.getHours();
    const mm = now.getMinutes();
    const ss = now.getSeconds();
    return {
      dayKey,
      dayLabel: ORDERED_DAYS.find((d) => d.key === dayKey)?.label || 'Monday',
      timeHHMM: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
      timeWithSeconds: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`,
      minutesOfDay: hh * 60 + mm,
    };
  }
}

export function isTimeWithinWindow(
  minutesOfDay: number,
  openTime: string,
  closeTime: string
): boolean {
  const openMin = parseHHMMToMinutes(openTime);
  const closeMin = parseHHMMToMinutes(closeTime);
  if (openMin === closeMin) return true; // 24h window when identical
  if (openMin < closeMin) {
    return minutesOfDay >= openMin && minutesOfDay < closeMin;
  }
  // Overnight window (e.g., 18:00 to 04:00)
  return minutesOfDay >= openMin || minutesOfDay < closeMin;
}

export function findNextOpenWindow(
  settings: MerchantPortalSettings,
  currentDayKey: DayOfWeekKey,
  minutesOfDay: number
): string | null {
  const startIdx = ORDERED_DAYS.findIndex((d) => d.key === currentDayKey);
  if (startIdx === -1) return null;

  for (let offset = 0; offset < 7; offset++) {
    const day = ORDERED_DAYS[(startIdx + offset) % 7];
    const slot = settings.schedule[day.key];
    if (!slot?.enabled) continue;
    const openMin = parseHHMMToMinutes(slot.openTime);
    if (offset === 0 && minutesOfDay < openMin) {
      return `Today at ${slot.openTime}`;
    }
    if (offset > 0) {
      return offset === 1 ? `Tomorrow at ${slot.openTime}` : `${day.label} at ${slot.openTime}`;
    }
  }
  return null;
}

export interface MerchantAccessCheckResult {
  allowed: boolean;
  reasonCode: 'OPEN' | 'UNRESTRICTED' | 'VIP_BYPASS' | 'STAFF_EXEMPT' | 'MANUAL_LOCKDOWN' | 'OUTSIDE_HOURS' | 'DAY_CLOSED';
  message: string;
  currentTimeHHMM: string;
  currentDayLabel: string;
  todayWindowText: string;
  nextOpenText: string | null;
}

export function checkMerchantPortalAccess(
  rawSettings?: Partial<MerchantPortalSettings> | null,
  user?: Pick<User, 'role' | 'bypassLoginHours' | 'allowedLoginStart' | 'allowedLoginEnd'> | null,
  now: Date = new Date()
): MerchantAccessCheckResult {
  const settings = normalizeMerchantSettings(rawSettings);
  const { dayKey, dayLabel, timeHHMM, minutesOfDay } = getTimeInTimezone(settings.timezone, now);
  const todaySlot = settings.schedule[dayKey];
  const hasCustomUserWindow = Boolean(user?.allowedLoginStart && user?.allowedLoginEnd);

  const effectiveOpen = hasCustomUserWindow ? user!.allowedLoginStart! : todaySlot.openTime;
  const effectiveClose = hasCustomUserWindow ? user!.allowedLoginEnd! : todaySlot.closeTime;
  const todayWindowText =
    todaySlot.enabled || hasCustomUserWindow
      ? `${effectiveOpen} - ${effectiveClose}`
      : 'Closed Today';

  // Non-merchant ERP staff & Super Admins are never blocked from ERP login
  if (user && user.role !== 'merchant') {
    return {
      allowed: true,
      reasonCode: 'STAFF_EXEMPT',
      message: 'Admin & staff accounts have 24/7 access.',
      currentTimeHHMM: timeHHMM,
      currentDayLabel: dayLabel,
      todayWindowText,
      nextOpenText: null,
    };
  }

  // Emergency / Manual Pause overrides everything except VIP bypass
  if (settings.manualLockdown && !user?.bypassLoginHours) {
    return {
      allowed: false,
      reasonCode: 'MANUAL_LOCKDOWN',
      message: settings.lockdownMessage,
      currentTimeHHMM: timeHHMM,
      currentDayLabel: dayLabel,
      todayWindowText,
      nextOpenText: null,
    };
  }

  if (user?.bypassLoginHours) {
    return {
      allowed: true,
      reasonCode: 'VIP_BYPASS',
      message: '24/7 priority merchant access enabled on this account.',
      currentTimeHHMM: timeHHMM,
      currentDayLabel: dayLabel,
      todayWindowText: '24/7 VIP Access',
      nextOpenText: null,
    };
  }

  if (!settings.enforceLoginHours && !hasCustomUserWindow) {
    return {
      allowed: true,
      reasonCode: 'UNRESTRICTED',
      message: 'Merchant portal is currently open 24/7.',
      currentTimeHHMM: timeHHMM,
      currentDayLabel: dayLabel,
      todayWindowText: 'Open 24/7',
      nextOpenText: null,
    };
  }

  // Check day closed (unless user has an explicit custom hour override)
  if (!hasCustomUserWindow && !todaySlot.enabled) {
    const nextOpen = findNextOpenWindow(settings, dayKey, minutesOfDay);
    return {
      allowed: false,
      reasonCode: 'DAY_CLOSED',
      message: `${settings.closedHoursMessage} Portal is closed on ${dayLabel}s.${
        nextOpen ? ` Next open window: ${nextOpen}.` : ''
      }`,
      currentTimeHHMM: timeHHMM,
      currentDayLabel: dayLabel,
      todayWindowText: 'Closed Today',
      nextOpenText: nextOpen,
    };
  }

  const within = isTimeWithinWindow(minutesOfDay, effectiveOpen, effectiveClose);
  if (!within) {
    const nextOpen = hasCustomUserWindow
      ? (minutesOfDay < parseHHMMToMinutes(effectiveOpen) ? `Today at ${effectiveOpen}` : `Tomorrow at ${effectiveOpen}`)
      : findNextOpenWindow(settings, dayKey, minutesOfDay);
    return {
      allowed: false,
      reasonCode: 'OUTSIDE_HOURS',
      message: `${settings.closedHoursMessage} Today's window is ${effectiveOpen} – ${effectiveClose} (Current time: ${timeHHMM}).${
        nextOpen ? ` Opens ${nextOpen}.` : ''
      }`,
      currentTimeHHMM: timeHHMM,
      currentDayLabel: dayLabel,
      todayWindowText,
      nextOpenText: nextOpen,
    };
  }

  return {
    allowed: true,
    reasonCode: 'OPEN',
    message: `Portal open (${effectiveOpen} – ${effectiveClose}).`,
    currentTimeHHMM: timeHHMM,
    currentDayLabel: dayLabel,
    todayWindowText,
    nextOpenText: null,
  };
}

export interface MOQValidationResult {
  enforced: boolean;
  valid: boolean;
  totalPacks: number;
  totalValue: number;
  effectiveMinOrderQty: number;
  effectiveGlobalLineQty: number;
  effectiveMinOrderValue: number;
  packsRemaining: number;
  valueRemaining: number;
  lineViolations: Record<string, { productName: string; required: number; actual: number }>;
  violations: string[];
}

export function evaluateMerchantOrderMOQ({
  items,
  products,
  user,
  settings: rawSettings,
  currency = 'R',
}: {
  items: Pick<MerchantOrderItem, 'productId' | 'productName' | 'quantity' | 'unitPrice' | 'lineTotal'>[];
  products: Product[];
  user?: Pick<User, 'customMoqUnits' | 'customMinOrderValue'> | null;
  settings?: Partial<MerchantPortalSettings> | null;
  currency?: string;
}): MOQValidationResult {
  const settings = normalizeMerchantSettings(rawSettings);
  const enforced = Boolean(settings.enforceMoq);

  const effectiveMinOrderQty =
    user?.customMoqUnits && user.customMoqUnits > 0
      ? Number(user.customMoqUnits)
      : settings.globalMinOrderQty;
  const effectiveMinOrderValue =
    user?.customMinOrderValue && user.customMinOrderValue > 0
      ? Number(user.customMinOrderValue)
      : settings.globalMinOrderValue;
  const effectiveGlobalLineQty = settings.globalMinLineQty;

  const totalPacks = (items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalValue = (items || []).reduce(
    (sum, it) => sum + (Number(it.lineTotal) || (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)),
    0
  );

  const packsRemaining = Math.max(0, effectiveMinOrderQty - totalPacks);
  const valueRemaining = Math.max(0, effectiveMinOrderValue - totalValue);

  const lineViolations: Record<string, { productName: string; required: number; actual: number }> = {};
  const violations: string[] = [];

  if (!enforced) {
    return {
      enforced: false,
      valid: true,
      totalPacks,
      totalValue,
      effectiveMinOrderQty,
      effectiveGlobalLineQty,
      effectiveMinOrderValue,
      packsRemaining,
      valueRemaining,
      lineViolations,
      violations,
    };
  }

  // Aggregate quantity ordered per productId across any size variants
  const qtyByProduct = new Map<string, { name: string; qty: number }>();
  for (const item of items || []) {
    const pid = item.productId || item.productName;
    const prev = qtyByProduct.get(pid);
    qtyByProduct.set(pid, {
      name: item.productName,
      qty: (prev?.qty || 0) + (Number(item.quantity) || 0),
    });
  }

  for (const [pid, info] of qtyByProduct.entries()) {
    const prod = (products || []).find((p) => p.id === pid || p.name === info.name);
    const prodMoq = prod?.moq && prod.moq > 0 ? Number(prod.moq) : effectiveGlobalLineQty;
    if (prodMoq > 0 && info.qty < prodMoq) {
      lineViolations[pid] = {
        productName: info.name,
        required: prodMoq,
        actual: info.qty,
      };
      violations.push(
        `${info.name}: minimum ${prodMoq} packs required (currently ${info.qty})`
      );
    }
  }

  if (effectiveMinOrderQty > 0 && totalPacks < effectiveMinOrderQty) {
    violations.push(
      `Minimum order quantity is ${effectiveMinOrderQty} total packs (need ${packsRemaining} more)`
    );
  }

  if (effectiveMinOrderValue > 0 && totalValue < effectiveMinOrderValue) {
    violations.push(
      `Minimum order value is ${currency} ${effectiveMinOrderValue.toFixed(2)} (add ${currency} ${valueRemaining.toFixed(2)} more)`
    );
  }

  return {
    enforced: true,
    valid: violations.length === 0,
    totalPacks,
    totalValue,
    effectiveMinOrderQty,
    effectiveGlobalLineQty,
    effectiveMinOrderValue,
    packsRemaining,
    valueRemaining,
    lineViolations,
    violations,
  };
}
