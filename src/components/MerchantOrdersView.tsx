import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { MerchantOrder } from '../types/erp';
import {
  ShoppingBag,
  Bell,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  Printer,
  MessageCircle,
  FileText,
  AlertCircle,
  Volume2,
  Sparkles,
  Smartphone,
  Check,
  X,
  Store,
  MapPin,
  Calendar,
  Send,
  Download
} from 'lucide-react';
import {
  requestPushNotificationPermission,
  playOrderNotificationChime,
  triggerMobileVibration
} from '../lib/fcmNotifications';

interface MerchantOrdersViewProps {
  initialStatusFilter?: string;
}

export const MerchantOrdersView: React.FC<MerchantOrdersViewProps> = ({
  initialStatusFilter = 'ALL',
}) => {
  const {
    merchantOrders,
    updateMerchantOrderStatus,
    deleteMerchantOrder,
    convertOrderToInvoice,
    company
  } = useERP();

  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [search, setSearch] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<MerchantOrder | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);

  // Statistics
  const totalOrders = merchantOrders.length;
  const pendingOrders = merchantOrders.filter((o) => o.status === 'PENDING').length;
  const preparingOrders = merchantOrders.filter((o) => o.status === 'PREPARING' || o.status === 'ACCEPTED').length;
  const dispatchedOrders = merchantOrders.filter((o) => o.status === 'DISPATCHED').length;
  const totalValue = merchantOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return merchantOrders.filter((o) => {
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.merchantName.toLowerCase().includes(q) ||
        (o.merchantStoreName && o.merchantStoreName.toLowerCase().includes(q)) ||
        o.branch.toLowerCase().includes(q) ||
        (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [merchantOrders, statusFilter, search]);

  const handleTestChimeAndNotification = async () => {
    playOrderNotificationChime();
    triggerMobileVibration();

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('🔔 Savouré FCM Test Alert', {
          body: 'Push notifications and audio chime are actively connected on this device.',
          icon: '/showcase/savoure-logo.png',
        });
      } catch (e) {}
    }

    setNotificationStatus('🔊 Test chime played & vibration triggered successfully!');
    setTimeout(() => setNotificationStatus(null), 4000);
  };

  const handleEnablePushNotifications = async () => {
    setIsRequestingPermission(true);
    try {
      const res = await requestPushNotificationPermission('admin');
      if (res.granted) {
        playOrderNotificationChime();
        setNotificationStatus('✅ Push notifications enabled on this device! You will receive live alerts for merchant orders.');
      } else {
        setNotificationStatus(`⚠️ Notification permission: ${res.error || 'Denied'}`);
      }
    } catch (e: any) {
      setNotificationStatus(`Error: ${e?.message}`);
    } finally {
      setIsRequestingPermission(false);
      setTimeout(() => setNotificationStatus(null), 6000);
    }
  };

  const handleConvertToInvoice = async (orderId: string) => {
    setConvertingId(orderId);
    try {
      const inv = await convertOrderToInvoice(orderId);
      alert(`🎉 Tax Invoice ${inv.invoiceNumber} successfully created and linked to this order!`);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate invoice');
    } finally {
      setConvertingId(null);
    }
  };

  const handlePrintOrder = (order: MerchantOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Savouré Order Picking Slip - ${order.orderNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1E0F07; }
          .header { border-bottom: 2px solid #CC8468; padding-bottom: 15px; margin-bottom: 20px; }
          h1 { margin: 0; font-size: 24px; color: #1E0F07; }
          .meta { font-size: 13px; color: #66483B; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #FBF7F1; border-bottom: 1px solid #CC8468; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
          td { border-bottom: 1px solid #eee; padding: 10px; font-size: 13px; }
          .total { text-align: right; font-size: 16px; font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 40px; font-size: 11px; color: #888; border-top: 1px dashed #ccc; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Savouré Artisanal Bakery — Order Picking Slip</h1>
          <div class="meta">Order Number: <strong>${order.orderNumber}</strong> · Placed: ${new Date(order.createdAt).toLocaleString()}</div>
          <div class="meta">Merchant Store: <strong>${order.merchantStoreName || order.merchantName}</strong> (${order.merchantPhone})</div>
          <div class="meta">Branch: ${order.branch} · Delivery Target: <strong>${order.requestedDeliveryDate}</strong></div>
          <div class="meta">Drop-off: ${order.deliveryAddress || 'Standard Delivery'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product Specialty</th>
              <th>Pack Spec</th>
              <th>Quantity Ordered</th>
              <th>Unit Rate</th>
              <th>Total (ZAR)</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((it, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${it.productName}</strong></td>
                <td>${it.packSize}</td>
                <td><strong>${it.quantity} packs</strong></td>
                <td>R ${it.unitPrice.toFixed(2)}</td>
                <td>R ${it.lineTotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          Consignment Total: R ${order.total.toFixed(2)}
        </div>

        ${order.specialInstructions ? `
          <div style="margin-top: 20px; padding: 12px; background: #FBF7F1; border-left: 3px solid #CC8468; font-size: 12px;">
            <strong>Bakery Instructions:</strong> ${order.specialInstructions}
          </div>
        ` : ''}

        <div class="footer">
          Handcrafted Daily in Johannesburg · 100% Halal Certified · Nationwide Cold-Chain Delivery Desk: +27 61 364 5712
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const statusBadge = (status: MerchantOrder['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">Pending Review</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-900 border border-blue-300">Accepted</span>;
      case 'PREPARING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-900 border border-purple-300">In Bakery Oven</span>;
      case 'DISPATCHED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-900 border border-indigo-300">Dispatched</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">Delivered</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-900 border border-rose-300">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE BANNER WITH FCM PUSH CONTROLS */}
      <div className="bg-[#1E0F07] text-white border border-[#3A2215] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_80%_20%,#CC8468_0,transparent_60%)] opacity-15 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#E0A282] px-2.5 py-0.5 rounded-full bg-[#CC8468]/20 border border-[#CC8468]/30">
                Live Dispatch & Push Desk
              </span>
              <span className="text-[#A69385]">·</span>
              <span className="text-xs text-[#C5B7AC] font-mono">FCM Web & Mobile Integration</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Merchant Orders & Bakery Consignments
            </h1>

            <p className="text-xs sm:text-sm text-[#C5B7AC] max-w-2xl leading-relaxed">
              Real-time ordering console for commercial delis, supermarkets, and restaurants. Orders trigger instant push notifications to mobile and desktop devices with audible bakery chimes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleEnablePushNotifications}
              disabled={isRequestingPermission}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#CC8468] hover:bg-[#B86643] text-[#1E0F07] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Enable Phone & Web Push</span>
            </button>

            <button
              type="button"
              onClick={handleTestChimeAndNotification}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-white/20"
              title="Test audio chime and vibration"
            >
              <Volume2 className="w-4 h-4 text-[#E0A282]" />
              <span>Test Chime</span>
            </button>
          </div>
        </div>

        {notificationStatus && (
          <div className="mt-4 p-3 rounded-xl bg-white/10 text-white text-xs border border-white/20 animate-fade-in flex items-center justify-between">
            <span>{notificationStatus}</span>
            <button onClick={() => setNotificationStatus(null)} className="text-stone-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. STATS KPI TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E8D9CD] shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D5037] block">
            Total Orders
          </span>
          <div className="text-2xl font-serif font-bold text-[#2B150A] mt-2">
            {totalOrders}
          </div>
          <span className="text-[11px] text-[#7A6458]">All merchant submissions</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8D9CD] shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">
            Pending Review
          </span>
          <div className="text-2xl font-serif font-bold text-amber-800 mt-2">
            {pendingOrders}
          </div>
          <span className="text-[11px] text-[#7A6458]">Awaiting bakery acceptance</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8D9CD] shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block">
            In Bakery Oven
          </span>
          <div className="text-2xl font-serif font-bold text-purple-800 mt-2">
            {preparingOrders}
          </div>
          <span className="text-[11px] text-[#7A6458]">Production in progress</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8D9CD] shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 block">
            Out for Delivery
          </span>
          <div className="text-2xl font-serif font-bold text-indigo-800 mt-2">
            {dispatchedOrders}
          </div>
          <span className="text-[11px] text-[#7A6458]">Nationwide fleet</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8D9CD] shadow-sm col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">
            Gross Order Value
          </span>
          <div className="text-2xl font-serif font-bold text-emerald-800 mt-2">
            R {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#7A6458]">Total wholesale revenue</span>
        </div>
      </div>

      {/* 3. CONTROLS & FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8D5037] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, merchant, store, or branch..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8D9CD] rounded-xl text-[#2B150A] placeholder-stone-400 focus:outline-hidden focus:border-[#CC8468]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-[#E8D9CD] rounded-xl overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'ACCEPTED', label: 'Accepted' },
            { id: 'PREPARING', label: 'In Production' },
            { id: 'DISPATCHED', label: 'Dispatched' },
            { id: 'DELIVERED', label: 'Delivered' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#CC8468] text-white shadow-2xs'
                  : 'text-[#66483B] hover:text-[#2B150A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. ORDERS LIST */}
      <div className="bg-white rounded-3xl border border-[#E8D9CD] overflow-hidden shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#7A6458] space-y-2">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
            <p className="font-semibold text-[#2B150A]">No merchant orders found matching criteria.</p>
            <p className="text-[11px] text-[#A69385]">Orders submitted from the Merchant Portal will appear here live.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8D9CD]/60">
            {filteredOrders.map((ord) => {
              const isConverting = convertingId === ord.id;

              return (
                <div
                  key={ord.id}
                  className="p-6 hover:bg-[#FBF7F1]/50 transition-colors space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-bold text-[#2B150A]">
                          {ord.orderNumber}
                        </span>
                        {statusBadge(ord.status)}
                        {ord.invoiceId && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                            Invoice Linked
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#66483B] flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#2B150A]">
                          {ord.merchantStoreName || ord.merchantName}
                        </span>
                        <span>·</span>
                        <span>Phone: {ord.merchantPhone}</span>
                        <span>·</span>
                        <span>Branch: {ord.branch}</span>
                        <span>·</span>
                        <span className="text-stone-400">Placed: {new Date(ord.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-[#7A6458] block">Consignment Total</span>
                        <span className="font-mono text-xl font-bold text-[#8D5037]">
                          R {ord.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Consignment Items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {ord.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#FBF7F1] border border-[#E8D9CD]/70 text-xs space-y-0.5"
                      >
                        <div className="font-semibold text-[#2B150A] truncate">{it.productName}</div>
                        <div className="text-[11px] text-[#7A6458] flex justify-between">
                          <span>{it.quantity} packs ({it.packSize})</span>
                          <span className="font-mono font-bold">R {it.lineTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Meta & Actions Bar */}
                  <div className="pt-3 border-t border-[#E8D9CD]/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[#7A6458]">
                        <Calendar className="w-3.5 h-3.5 text-[#8D5037]" />
                        <span>Target Delivery Date: <strong>{ord.requestedDeliveryDate}</strong></span>
                        <span>·</span>
                        <MapPin className="w-3.5 h-3.5 text-[#8D5037]" />
                        <span className="truncate max-w-sm">{ord.deliveryAddress || 'Standard drop-off location'}</span>
                      </div>
                      {ord.specialInstructions && (
                        <div className="text-[11px] text-[#8D5037] italic">
                          "{ord.specialInstructions}"
                        </div>
                      )}
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {ord.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => updateMerchantOrderStatus(ord.id, 'ACCEPTED')}
                          className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                        >
                          Accept Order
                        </button>
                      )}

                      {ord.status === 'ACCEPTED' && (
                        <button
                          type="button"
                          onClick={() => updateMerchantOrderStatus(ord.id, 'PREPARING')}
                          className="px-3.5 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                        >
                          Send to Oven Queue
                        </button>
                      )}

                      {ord.status === 'PREPARING' && (
                        <button
                          type="button"
                          onClick={() => updateMerchantOrderStatus(ord.id, 'DISPATCHED')}
                          className="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                        >
                          Mark Dispatched
                        </button>
                      )}

                      {ord.status === 'DISPATCHED' && (
                        <button
                          type="button"
                          onClick={() => updateMerchantOrderStatus(ord.id, 'DELIVERED')}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                        >
                          Mark Delivered
                        </button>
                      )}

                      {!ord.invoiceId && (
                        <button
                          type="button"
                          disabled={isConverting}
                          onClick={() => handleConvertToInvoice(ord.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#CC8468] hover:bg-[#B86643] text-white font-bold text-[11px] cursor-pointer shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isConverting ? 'Generating...' : 'Convert to Invoice'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handlePrintOrder(ord)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FBF7F1] hover:bg-[#EAD8C6] text-[#2B150A] border border-[#BD896E]/30 font-semibold text-[11px] cursor-pointer"
                        title="Print Picking Slip"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#8D5037]" />
                        <span>Picking Slip</span>
                      </button>

                      <a
                        href={`https://wa.me/${ord.merchantPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello ${ord.merchantName}, Savouré Bakery Desk has an update regarding your order ${ord.orderNumber}...`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-[#25D366] text-white hover:bg-[#20ba59] cursor-pointer"
                        title="Contact Merchant on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
