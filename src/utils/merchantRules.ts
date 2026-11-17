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
  alwaysAllowPortalAccess: true,
  enforceLoginHours: false,
  manualLockdown: false,
  lockdownMessage:
    'New wholesale order submissions are temporarily paused by Savouré Dispatch. You can still access your portal to view invoices, PODs, and order history.',
  closedHoursMessage:
    'Wholesale order submissions are only open during scheduled ordering hours. You can still browse the portal, view invoices/statements, and prepare your draft order.',
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
  enforceNextDayCutoff: false,
  nextDayCutoffTime: '14:00',
  allowSameDayDelivery: false,
  nextDayCutoffMessage:
    'Next-day delivery orders close after cutoff time. Orders placed after cutoff are scheduled from the following delivery day.',
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

  const rawLockdownMsg =
    typeof raw?.lockdownMessage === 'string' ? raw.lockdownMessage.trim() : '';
  const isLegacyLockdownMsg =
    rawLockdownMsg ===
    'The Wholesale Merchant Portal is temporarily paused by Savouré Dispatch. Please contact our kitchen desk for urgent orders.';

  const rawClosedHoursMsg =
    typeof raw?.closedHoursMessage === 'string' ? raw.closedHoursMessage.trim() : '';
  const isLegacyClosedHoursMsg =
    rawClosedHoursMsg ===
    'Merchant portal sign-in is only open during scheduled wholesale ordering hours.';

  return {
    alwaysAllowPortalAccess: true,
    enforceLoginHours:
      raw?.enforceLoginHours !== undefined
        ? Boolean(raw.enforceLoginHours)
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.enforceLoginHours,
    manualLockdown:
      raw?.manualLockdown !== undefined
        ? Boolean(raw.manualLockdown)
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.manualLockdown,
    lockdownMessage:
      rawLockdownMsg && !isLegacyLockdownMsg
        ? rawLockdownMsg
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.lockdownMessage,
    closedHoursMessage:
      rawClosedHoursMsg && !isLegacyClosedHoursMsg
        ? rawClosedHoursMsg
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
    enforceNextDayCutoff:
      raw?.enforceNextDayCutoff !== undefined
        ? Boolean(raw.enforceNextDayCutoff)
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.enforceNextDayCutoff,
    nextDayCutoffTime:
      typeof raw?.nextDayCutoffTime === 'string' && raw.nextDayCutoffTime.includes(':')
        ? raw.nextDayCutoffTime
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.nextDayCutoffTime,
    allowSameDayDelivery:
      raw?.allowSameDayDelivery !== undefined
        ? Boolean(raw.allowSameDayDelivery)
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.allowSameDayDelivery,
    nextDayCutoffMessage:
      typeof raw?.nextDayCutoffMessage === 'string' && raw.nextDayCutoffMessage.trim()
        ? raw.nextDayCutoffMessage
        : DEFAULT_MERCHANT_PORTAL_SETTINGS.nextDayCutoffMessage,
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
  dateYYYYMMDD: string;
} {
  const tz = timezone || 'Africa/Johannesburg';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const weekday = (parts.find((p) => p.type === 'weekday')?.value || 'Monday').toLowerCase();
    const year = parts.find((p) => p.type === 'year')?.value || String(now.getFullYear());
    const month = parts.find((p) => p.type === 'month')?.value || String(now.getMonth() + 1).padStart(2, '0');
    const day = parts.find((p) => p.type === 'day')?.value || String(now.getDate()).padStart(2, '0');
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
      dateYYYYMMDD: `${year}-${month}-${day}`,
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
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return {
      dayKey,
      dayLabel: ORDERED_DAYS.find((x) => x.key === dayKey)?.label || 'Monday',
      timeHHMM: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
      timeWithSeconds: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`,
      minutesOfDay: hh * 60 + mm,
      dateYYYYMMDD: `${y}-${m}-${d}`,
    };
  }
}

export function addDaysToYYYYMMDD(dateStr: string, daysToAdd: number): string {
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) {
    return new Date(Date.now() + daysToAdd * 86400000).toISOString().split('T')[0];
  }
  const dt = new Date(Date.UTC(y, m - 1, d + daysToAdd));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
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
  allowed: boolean;        // True if action allowed (e.g. placing orders when mode='order', or signing in when mode='login')
  loginAllowed: boolean;   // True if signing into the portal is allowed
  orderingAllowed: boolean;// True if submitting new orders is currently allowed
  alwaysAllowPortalAccess: boolean;
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
  now: Date = new Date(),
  mode: 'login' | 'order' = 'order'
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

  // Non-merchant ERP staff & Super Admins are never blocked
  if (user && user.role !== 'merchant') {
    return {
      allowed: true,
      loginAllowed: true,
      orderingAllowed: true,
      alwaysAllowPortalAccess: settings.alwaysAllowPortalAccess,
      reasonCode: 'STAFF_EXEMPT',
      message: 'Admin & staff accounts have 24/7 access.',
      currentTimeHHMM: timeHHMM,
      currentDayLabel: dayLabel,
      todayWindowText,
      nextOpenText: null,
    };
  }

  // Evaluate raw ordering-window permission
  let orderingAllowed = true;
  let orderingReason: MerchantAccessCheckResult['reasonCode'] = 'UNRESTRICTED';
  let orderingMessage = 'Wholesale ordering window is open 24/7.';
  let nextOpenText: string | null = null;
  let effectiveWindowText = todayWindowText;

  if (settings.manualLockdown && !user?.bypassLoginHours) {
    orderingAllowed = false;
    orderingReason = 'MANUAL_LOCKDOWN';
    orderingMessage = settings.lockdownMessage;
  } else if (user?.bypassLoginHours) {
    orderingAllowed = true;
    orderingReason = 'VIP_BYPASS';
    orderingMessage = '24/7 priority merchant ordering access enabled on this account.';
    effectiveWindowText = '24/7 VIP Access';
  } else if (!settings.enforceLoginHours && !hasCustomUserWindow) {
    orderingAllowed = true;
    orderingReason = 'UNRESTRICTED';
    orderingMessage = 'Wholesale ordering window is currently open 24/7.';
    effectiveWindowText = 'Open 24/7';
  } else if (!hasCustomUserWindow && !todaySlot.enabled) {
    nextOpenText = findNextOpenWindow(settings, dayKey, minutesOfDay);
    orderingAllowed = false;
    orderingReason = 'DAY_CLOSED';
    orderingMessage = `${settings.closedHoursMessage} New orders are closed on ${dayLabel}s.${
      nextOpenText ? ` Next ordering window: ${nextOpenText}.` : ''
    }`;
    effectiveWindowText = 'Closed Today';
  } else {
    const within = isTimeWithinWindow(minutesOfDay, effectiveOpen, effectiveClose);
    if (!within) {
      nextOpenText = hasCustomUserWindow
        ? (minutesOfDay < parseHHMMToMinutes(effectiveOpen)
            ? `Today at ${effectiveOpen}`
            : `Tomorrow at ${effectiveOpen}`)
        : findNextOpenWindow(settings, dayKey, minutesOfDay);
      orderingAllowed = false;
      orderingReason = 'OUTSIDE_HOURS';
      orderingMessage = `${settings.closedHoursMessage} Today's ordering window is ${effectiveOpen} – ${effectiveClose} (Current time: ${timeHHMM}).${
        nextOpenText ? ` Opens ${nextOpenText}.` : ''
      }`;
    } else {
      orderingAllowed = true;
      orderingReason = 'OPEN';
      orderingMessage = `Ordering window open (${effectiveOpen} – ${effectiveClose}).`;
    }
  }

  // Portal sign-in is ALWAYS open 24/7 — schedule & pause strictly apply to order submissions
  const loginAllowed = true;
  const allowed = mode === 'login' ? true : orderingAllowed;

  return {
    allowed,
    loginAllowed,
    orderingAllowed,
    alwaysAllowPortalAccess: true,
    reasonCode: mode === 'login' ? 'OPEN' : orderingReason,
    message:
      mode === 'login'
        ? 'Portal access is open 24/7.'
        : orderingMessage,
    currentTimeHHMM: timeHHMM,
    currentDayLabel: dayLabel,
    todayWindowText: effectiveWindowText,
    nextOpenText,
  };
}

export interface DeliveryScheduleConstraintResult {
  enforced: boolean;
  valid: boolean;
  reasonCode: 'OPEN' | 'PAST_DATE' | 'SAME_DAY_BLOCKED' | 'PAST_NEXT_DAY_CUTOFF' | 'VIP_BYPASS';
  message: string;
  todayDate: string;
  tomorrowDate: string;
  dayAfterTomorrowDate: string;
  minAllowedDate: string;
  minLeadDays: number;
  isTomorrowAvailable: boolean;
  isCutoffPassed: boolean;
  cutoffTime: string;
  currentTimeHHMM: string;
}

export function evaluateDeliveryScheduleConstraint({
  settings: rawSettings,
  user,
  requestedDeliveryDate,
  now = new Date(),
}: {
  settings?: Partial<MerchantPortalSettings> | null;
  user?: Pick<User, 'role' | 'bypassLoginHours'> | null;
  requestedDeliveryDate?: string;
  now?: Date;
}): DeliveryScheduleConstraintResult {
  const settings = normalizeMerchantSettings(rawSettings);
  const { dateYYYYMMDD: todayDate, timeHHMM, minutesOfDay } = getTimeInTimezone(settings.timezone, now);
  const tomorrowDate = addDaysToYYYYMMDD(todayDate, 1);
  const dayAfterTomorrowDate = addDaysToYYYYMMDD(todayDate, 2);
  const cutoffTime = settings.nextDayCutoffTime || '14:00';
  const cutoffMinutes = parseHHMMToMinutes(cutoffTime);
  const isCutoffPassed = minutesOfDay >= cutoffMinutes;

  // VIP or non-merchant staff bypass cutoff locks
  if (user && (user.role !== 'merchant' || user.bypassLoginHours)) {
    return {
      enforced: false,
      valid: true,
      reasonCode: 'VIP_BYPASS',
      message: 'Priority scheduling enabled on this account.',
      todayDate,
      tomorrowDate,
      dayAfterTomorrowDate,
      minAllowedDate: todayDate,
      minLeadDays: 0,
      isTomorrowAvailable: true,
      isCutoffPassed,
      cutoffTime,
      currentTimeHHMM: timeHHMM,
    };
  }

  if (!settings.enforceNextDayCutoff) {
    const baseMinLead = settings.allowSameDayDelivery ? 0 : 1;
    const minDate = addDaysToYYYYMMDD(todayDate, baseMinLead);
    return {
      enforced: false,
      valid: true,
      reasonCode: 'OPEN',
      message: 'Standard flexible delivery scheduling active.',
      todayDate,
      tomorrowDate,
      dayAfterTomorrowDate,
      minAllowedDate: minDate,
      minLeadDays: baseMinLead,
      isTomorrowAvailable: true,
      isCutoffPassed: false,
      cutoffTime,
      currentTimeHHMM: timeHHMM,
    };
  }

  // Next-day cutoff rule is enforced
  const minLeadDays = isCutoffPassed
    ? 2
    : settings.allowSameDayDelivery
    ? 0
    : 1;
  const minAllowedDate = addDaysToYYYYMMDD(todayDate, minLeadDays);
  const isTomorrowAvailable = !isCutoffPassed;

  if (!requestedDeliveryDate) {
    return {
      enforced: true,
      valid: true,
      reasonCode: 'OPEN',
      message: isTomorrowAvailable
        ? `Order before ${cutoffTime} today for next-day delivery (${tomorrowDate}).`
        : `Next-day cutoff (${cutoffTime}) has passed. Earliest delivery is ${minAllowedDate}.`,
      todayDate,
      tomorrowDate,
      dayAfterTomorrowDate,
      minAllowedDate,
      minLeadDays,
      isTomorrowAvailable,
      isCutoffPassed,
      cutoffTime,
      currentTimeHHMM: timeHHMM,
    };
  }

  if (requestedDeliveryDate < todayDate) {
    return {
      enforced: true,
      valid: false,
      reasonCode: 'PAST_DATE',
      message: `Requested delivery date (${requestedDeliveryDate}) cannot be in the past. Earliest available date is ${minAllowedDate}.`,
      todayDate,
      tomorrowDate,
      dayAfterTomorrowDate,
      minAllowedDate,
      minLeadDays,
      isTomorrowAvailable,
      isCutoffPassed,
      cutoffTime,
      currentTimeHHMM: timeHHMM,
    };
  }

  if (requestedDeliveryDate === todayDate && !settings.allowSameDayDelivery && !isCutoffPassed) {
    return {
      enforced: true,
      valid: false,
      reasonCode: 'SAME_DAY_BLOCKED',
      message: `Same-day delivery is closed. Please choose tomorrow (${tomorrowDate}) or later.`,
      todayDate,
      tomorrowDate,
      dayAfterTomorrowDate,
      minAllowedDate,
      minLeadDays,
      isTomorrowAvailable,
      isCutoffPassed,
      cutoffTime,
      currentTimeHHMM: timeHHMM,
    };
  }

  if (requestedDeliveryDate < minAllowedDate) {
    return {
      enforced: true,
      valid: false,
      reasonCode: 'PAST_NEXT_DAY_CUTOFF',
      message: `${settings.nextDayCutoffMessage} Today's cutoff is ${cutoffTime} (current time: ${timeHHMM}). Earliest available delivery date is ${minAllowedDate}.`,
      todayDate,
      tomorrowDate,
      dayAfterTomorrowDate,
      minAllowedDate,
      minLeadDays,
      isTomorrowAvailable,
      isCutoffPassed,
      cutoffTime,
      currentTimeHHMM: timeHHMM,
    };
  }

  return {
    enforced: true,
    valid: true,
    reasonCode: 'OPEN',
    message: isTomorrowAvailable
      ? `Next-day delivery available for orders placed before ${cutoffTime}.`
      : `Cutoff ${cutoffTime} passed — scheduled from ${minAllowedDate}.`,
    todayDate,
    tomorrowDate,
    dayAfterTomorrowDate,
    minAllowedDate,
    minLeadDays,
    isTomorrowAvailable,
    isCutoffPassed,
    cutoffTime,
    currentTimeHHMM: timeHHMM,
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
