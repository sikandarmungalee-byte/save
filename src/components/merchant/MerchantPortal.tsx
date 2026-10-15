import React, { useState, useMemo, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { Invoice, DeliveryNote } from '../../types/erp';
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
} from 'lucide-react';
import { InvoicePrintModal } from '../InvoicePrintModal';
import { SHOWCASE_CONTACT } from '../showcase/showcaseData';

interface MerchantPortalProps {
  onBackToWebsite: () => void;
}

export const MerchantPortal: React.FC<MerchantPortalProps> = ({ onBackToWebsite }) => {
  const { currentUser, invoices, deliveryNotes, logout, customers, company, savePOD } = useERP();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'invoices' | 'delivery-notes'>('invoices');

  // Search & filter states
  const [search, setSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'Paid' | 'Pending' | 'Overdue'>('ALL');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<'ALL' | 'In Transit' | 'Delivered'>('ALL');

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
    'Merchant Store';

  // ------------------------------------------------------------------
  // STRICT AUTOMATIC FILTERING FOR INVOICES
  // ------------------------------------------------------------------
  const merchantInvoices = useMemo(() => {
    if (!currentUser) return [];

    return invoices.filter((inv) => {
      // 1. Direct match on linked Customer ID
      if (currentUser.customerId && inv.customerId === currentUser.customerId) {
        return true;
      }
      if (linkedCustomer?.id && inv.customerId === linkedCustomer.id) {
        return true;
      }

      // 2. Direct match on Merchant ID (if tagged upon creation)
      if (inv.merchantId && inv.merchantId === currentUser.id) {
        return true;
      }

      // 2b. Direct match on Merchant Email
      if (inv.merchantEmail && currentUser.email && inv.merchantEmail.toLowerCase() === currentUser.email.toLowerCase()) {
        return true;
      }

      // 2c. Direct match on Merchant Name / Store Name
      if (inv.merchantName && (
        (currentUser.name && inv.merchantName.toLowerCase() === currentUser.name.toLowerCase()) ||
        (currentUser.merchantStoreName && inv.merchantName.toLowerCase() === currentUser.merchantStoreName.toLowerCase())
      )) {
        return true;
      }

      // 3. Match on Customer Name / Trading Name (case-insensitive)
      const targetCustomerNames = [
        currentUser.customerName?.toLowerCase(),
        currentUser.merchantStoreName?.toLowerCase(),
        linkedCustomer?.registeredName.toLowerCase(),
        linkedCustomer?.tradingName.toLowerCase(),
      ].filter(Boolean);

      const invCustomerName = (inv.customerName || '').toLowerCase();
      const invTradingName = (inv.customerTradingName || '').toLowerCase();

      if (targetCustomerNames.some((name) => name && (invCustomerName.includes(name) || invTradingName.includes(name) || name.includes(invCustomerName)))) {
        return true;
      }

      // 4. Branch match if assigned to a specific branch
      if (
        currentUser.branch &&
        currentUser.branch !== 'All Branches' &&
        currentUser.branch !== 'Unassigned'
      ) {
        const matchBranch =
          inv.branch === currentUser.branch ||
          inv.branchName === currentUser.branch ||
          inv.branchId === currentUser.branch;
        if (matchBranch) return true;
      }

      return false;
    });
  }, [invoices, currentUser, linkedCustomer]);

  // Filtered invoices by search & status
  const filteredInvoices = useMemo(() => {
    return merchantInvoices.filter((inv) => {
      const matchesSearch =
        (inv.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.issueDate || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        invoiceStatusFilter === 'ALL' ||
        (invoiceStatusFilter === 'Paid' && inv.status === 'Paid') ||
        (invoiceStatusFilter === 'Pending' && (inv.status === 'Sent' || inv.status === 'Partial' || inv.status === 'Draft')) ||
        (invoiceStatusFilter === 'Overdue' && inv.status === 'Overdue');

      return matchesSearch && matchesStatus;
    });
  }, [merchantInvoices, search, invoiceStatusFilter]);

  // ------------------------------------------------------------------
  // STRICT AUTOMATIC FILTERING FOR DELIVERY NOTES
  // ------------------------------------------------------------------
  const merchantDeliveryNotes = useMemo(() => {
    if (!currentUser) return [];

    return deliveryNotes.filter((dn) => {
      // 1. Direct match on linked Customer ID
      if (currentUser.customerId && dn.customerId === currentUser.customerId) {
        return true;
      }
      if (linkedCustomer?.id && dn.customerId === linkedCustomer.id) {
        return true;
      }

      // 2. Direct match on Merchant ID
      if (dn.merchantId && dn.merchantId === currentUser.id) {
        return true;
      }

      // 2b. Direct match on Merchant Email
      if (dn.merchantEmail && currentUser.email && dn.merchantEmail.toLowerCase() === currentUser.email.toLowerCase()) {
        return true;
      }

      // 3. Match via linked invoice
      if (dn.invoiceId && merchantInvoices.some((inv) => inv.id === dn.invoiceId)) {
        return true;
      }
      if (dn.invoiceNumber && merchantInvoices.some((inv) => inv.invoiceNumber === dn.invoiceNumber)) {
        return true;
      }

      // 4. Customer Name / Trading Name match
      const targetCustomerNames = [
        currentUser.customerName?.toLowerCase(),
        currentUser.merchantStoreName?.toLowerCase(),
        linkedCustomer?.registeredName?.toLowerCase(),
        linkedCustomer?.tradingName?.toLowerCase(),
      ].filter(Boolean);

      const dnCustomerName = (dn.customerName || '').toLowerCase();
      if (targetCustomerNames.some((name) => name && (dnCustomerName.includes(name) || name.includes(dnCustomerName)))) {
        return true;
      }

      // 5. Branch match
      if (
        currentUser.branch &&
        currentUser.branch !== 'All Branches' &&
        currentUser.branch !== 'Unassigned'
      ) {
        if (dn.branchName === currentUser.branch || dn.branchId === currentUser.branch) {
          return true;
        }
      }

      return false;
    });
  }, [deliveryNotes, currentUser, linkedCustomer, merchantInvoices]);

  // Filtered delivery notes by search & status
  const filteredDeliveryNotes = useMemo(() => {
    return merchantDeliveryNotes.filter((dn) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (dn.deliveryNoteNumber || '').toLowerCase().includes(term) ||
        (dn.invoiceNumber || '').toLowerCase().includes(term) ||
        (dn.driverName || '').toLowerCase().includes(term) ||
        (dn.recipientName || '').toLowerCase().includes(term) ||
        (dn.items || []).some((it) => (it.description || '').toLowerCase().includes(term));

      const isDelivered = dn.status === 'Delivered' || Boolean(dn.podSignature);
      const isInTransit = !isDelivered;

      const matchesStatus =
        deliveryStatusFilter === 'ALL' ||
        (deliveryStatusFilter === 'Delivered' && isDelivered) ||
        (deliveryStatusFilter === 'In Transit' && isInTransit);

      return matchesSearch && matchesStatus;
    });
  }, [merchantDeliveryNotes, search, deliveryStatusFilter]);

  // Metrics
  const totalInvoiced = useMemo(() => {
    return merchantInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
  }, [merchantInvoices]);

  const totalOutstanding = useMemo(() => {
    return merchantInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
  }, [merchantInvoices]);

  const totalPaid = useMemo(() => {
    return merchantInvoices.reduce((acc, inv) => acc + (inv.amountPaid || (inv.status === 'Paid' ? inv.grandTotal : 0)), 0);
  }, [merchantInvoices]);

  const inTransitCount = useMemo(() => {
    return merchantDeliveryNotes.filter((d) => d.status === 'In Transit' || (!d.podSignature && d.status !== 'Delivered')).length;
  }, [merchantDeliveryNotes]);

  const deliveredCount = useMemo(() => {
    return merchantDeliveryNotes.filter((d) => d.status === 'Delivered' || Boolean(d.podSignature)).length;
  }, [merchantDeliveryNotes]);

  // Helper to find linked delivery note for an invoice
  const getLinkedDeliveryNote = (invoice: Invoice): DeliveryNote | undefined => {
    return merchantDeliveryNotes.find(
      (dn) =>
        (invoice.linkedDeliveryNoteId && dn.id === invoice.linkedDeliveryNoteId) ||
        (dn.invoiceId && dn.invoiceId === invoice.id) ||
        (dn.invoiceNumber && dn.invoiceNumber === invoice.invoiceNumber)
    );
  };

  // ------------------------------------------------------------------
  // POD SIGNATURE DRAWING HANDLERS
  // ------------------------------------------------------------------
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0284c7';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasDrawn(true);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasDrawn(false);
    }
  };

  const openPodModal = (note: DeliveryNote) => {
    setPodNote(note);
    setRecipientName(note.recipientName || currentUser?.name || '');
    setPodNotes('');
    setPodError(null);
    setHasDrawn(false);
  };

  const handleSavePOD = async () => {
    if (!podNote || !canvasRef.current) return;
    if (!recipientName.trim()) {
      setPodError('Please provide receiving bay clerk or store manager name.');
      return;
    }
    if (!hasDrawn) {
      setPodError('Please sign on the signature pad to confirm receipt.');
      return;
    }

    const signatureDataUrl = canvasRef.current.toDataURL('image/png');
    const updatedNote = await savePOD(podNote.id, {
      podSignature: signatureDataUrl,
      podReceivedBy: recipientName.trim(),
      notes: podNotes.trim(),
    });

    setPodNote(null);
    // If user is currently viewing this delivery note in the preview modal, update preview to signed version
    if (selectedDeliveryNoteForView && selectedDeliveryNoteForView.id === podNote.id) {
      setSelectedDeliveryNoteForView(updatedNote);
    }
  };

  return (
    <div className="min-h-screen bg-[#14100D] text-[#EDE6DE] flex flex-col font-sans selection:bg-[#C98A5B] selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-[#2C211B] bg-[#1A1411] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToWebsite}
              className="p-2 -ml-2 rounded-lg text-[#A69385] hover:text-white hover:bg-[#2C211B] transition-colors"
              title="Return to Savouré website"
            >
              <Globe className="w-5 h-5 text-[#C98A5B]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-[0.2em] text-[#EDE6DE] uppercase leading-none">
                  Savouré
                </span>
                <span className="text-[8px] uppercase tracking-[0.22em] text-[#DE9E74] font-semibold mt-0.5">
                  A Taste of Tradition
                </span>
              </div>
              <div className="hidden sm:block border-l border-[#3A2D25] pl-3">
                <span className="text-xs uppercase font-serif tracking-widest text-[#DE9E74] font-bold block">
                  Merchant Portal
                </span>
                <span className="text-[11px] text-[#A69385] flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3 h-3 text-[#C98A5B]" />
                  <span>Branch: <strong className="text-white">{currentBranch}</strong></span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={SHOWCASE_CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold border border-emerald-700/50 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Wholesale Desk</span>
            </a>

            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-white">{currentUser?.name}</div>
              <div className="text-[10px] text-[#DE9E74]">{customerDisplayName}</div>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C211B] hover:bg-rose-950/40 text-xs font-semibold text-[#EDE6DE] hover:text-rose-300 border border-[#3A2D25] hover:border-rose-800/60 transition-colors"
              title="Sign out of merchant account"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Customer Account & Branch Identification Banner */}
        <div className="bg-gradient-to-r from-[#201713] via-[#2A1E18] to-[#1C1410] border border-[#C98A5B]/40 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C98A5B]/20 border border-[#C98A5B]/40 text-[#DE9E74] text-xs font-serif font-bold uppercase tracking-wider">
                  <Store className="w-3.5 h-3.5" />
                  <span>Authorized Merchant Account</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-mono">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Live Cloud Sync Active</span>
                </span>
                {inTransitCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-600/70 text-amber-300 text-[11px] font-bold animate-pulse">
                    <Truck className="w-3 h-3" />
                    <span>{inTransitCount} Shipment{inTransitCount === 1 ? '' : 's'} In Transit</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight">
                {customerDisplayName}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#A69385]">
                {linkedCustomer?.accountCode && (
                  <span>Account Code: <strong className="text-[#EDE6DE] font-mono">{linkedCustomer.accountCode}</strong></span>
                )}
                <span>Branch: <strong className="text-[#EDE6DE]">{currentBranch}</strong></span>
                {currentUser?.email && (
                  <span>Login: <strong className="text-[#EDE6DE]">{currentUser.email}</strong></span>
                )}
              </div>

              <p className="text-xs text-[#A69385]/80 pt-1 max-w-2xl leading-relaxed">
                Welcome to your merchant portal. Official tax invoices, delivery notes with live transit tracking, and signed Proof of Delivery records issued by Savouré Administration synchronize here in real time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <a
                href={SHOWCASE_CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-700/60 text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Enquire via WhatsApp</span>
              </a>

              <button
                onClick={onBackToWebsite}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#221B17] hover:bg-[#2C211B] text-xs font-semibold text-[#EDE6DE] border border-[#3A2D25] transition-colors"
              >
                <Globe className="w-4 h-4 text-[#C98A5B]" />
                <span>Showcase Website</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Financial & Delivery Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1A1411] border border-[#2C211B] rounded-xl p-5 shadow-xs">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#A69385] block">
              Total Invoiced
            </span>
            <div className="mt-2 text-2xl font-bold font-mono text-white">
              {company.currency || 'R'} {totalInvoiced.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#8A776B] block mt-1">
              {merchantInvoices.length} official statements issued
            </span>
          </div>

          <div className="bg-[#1A1411] border border-[#2C211B] rounded-xl p-5 shadow-xs">
            <span className="text-[11px] uppercase font-serif tracking-wider text-[#A69385] block">
              Balance Due
            </span>
            <div className={`mt-2 text-2xl font-bold font-mono ${totalOutstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {company.currency || 'R'} {totalOutstanding.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#8A776B] block mt-1">
              {totalOutstanding > 0 ? 'Outstanding balance' : 'Account fully settled'}
            </span>
          </div>

          <div
            onClick={() => { setActiveTab('delivery-notes'); setDeliveryStatusFilter('In Transit'); }}
            className="bg-[#1A1411] border border-[#2C211B] hover:border-amber-500/60 rounded-xl p-5 shadow-xs cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-serif tracking-wider text-amber-400/90 font-semibold block">
                In Transit (Unsigned)
              </span>
              <Truck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-amber-300">
              {inTransitCount}
            </div>
            <span className="text-[10px] text-amber-500/80 block mt-1">
              Awaiting store delivery & POD sign-off
            </span>
          </div>

          <div
            onClick={() => { setActiveTab('delivery-notes'); setDeliveryStatusFilter('Delivered'); }}
            className="bg-[#1A1411] border border-[#2C211B] hover:border-emerald-500/60 rounded-xl p-5 shadow-xs cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-serif tracking-wider text-emerald-400/90 font-semibold block">
                Delivered & Signed
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
              {deliveredCount}
            </div>
            <span className="text-[10px] text-emerald-600 block mt-1">
              Verified electronic Proof of Delivery
            </span>
          </div>
        </div>

        {/* Master Tab Bar: Invoices vs Delivery Notes */}
        <div className="flex items-center justify-between gap-4 border-b border-[#2C211B] pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('invoices'); setSearch(''); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-serif font-bold tracking-wide transition-all ${
                activeTab === 'invoices'
                  ? 'bg-[#391E0F] text-[#F3D2BF] border border-[#C98A5B]/60 shadow-md'
                  : 'text-[#A69385] hover:text-white hover:bg-[#201814]'
              }`}
            >
              <FileText className="w-4 h-4 text-[#C98A5B]" />
              <span>Tax Invoices</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/40 text-stone-300">
                {merchantInvoices.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('delivery-notes'); setSearch(''); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-serif font-bold tracking-wide transition-all relative ${
                activeTab === 'delivery-notes'
                  ? 'bg-[#391E0F] text-[#F3D2BF] border border-[#C98A5B]/60 shadow-md'
                  : 'text-[#A69385] hover:text-white hover:bg-[#201814]'
              }`}
            >
              <Truck className="w-4 h-4 text-[#C98A5B]" />
              <span>Delivery Notes & POD</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/40 text-stone-300">
                {merchantDeliveryNotes.length}
              </span>
              {inTransitCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-2 right-2" />
              )}
            </button>
          </div>

          <div className="text-xs text-[#8A776B] hidden sm:block font-mono">
            {activeTab === 'invoices' ? 'Viewing customer billing history' : 'Viewing store dispatch waybills & electronic PODs'}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: TAX INVOICES SECTION                          */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'invoices' && (
          <div className="bg-[#1A1411] border border-[#2C211B] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#C98A5B]" />
                  <span>Tax Invoices & Billing Statements</span>
                </h2>
                <p className="text-xs text-[#A69385] mt-0.5">
                  Click any invoice below to inspect or print your official SARS-compliant Tax Invoice.
                </p>
              </div>

              {/* Invoice Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#120F0D] p-1 rounded-xl border border-[#2C211B]">
                <button
                  onClick={() => setInvoiceStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    invoiceStatusFilter === 'ALL'
                      ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                      : 'text-[#A69385] hover:text-white'
                  }`}
                >
                  All ({merchantInvoices.length})
                </button>
                <button
                  onClick={() => setInvoiceStatusFilter('Paid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    invoiceStatusFilter === 'Paid'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-[#A69385] hover:text-white'
                  }`}
                >
                  Paid ({merchantInvoices.filter((i) => i.status === 'Paid').length})
                </button>
                <button
                  onClick={() => setInvoiceStatusFilter('Pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    invoiceStatusFilter === 'Pending'
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'text-[#A69385] hover:text-white'
                  }`}
                >
                  Pending ({merchantInvoices.filter((i) => i.status === 'Sent' || i.status === 'Partial' || i.status === 'Draft').length})
                </button>
                <button
                  onClick={() => setInvoiceStatusFilter('Overdue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    invoiceStatusFilter === 'Overdue'
                      ? 'bg-rose-700 text-white font-bold shadow-xs'
                      : 'text-[#A69385] hover:text-white'
                  }`}
                >
                  Overdue ({merchantInvoices.filter((i) => i.status === 'Overdue').length})
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A776B]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice number (e.g. INV-2026-0001) or issue date..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#120F0D] border border-[#2C211B] rounded-xl text-white placeholder-[#8A776B] focus:outline-none focus:border-[#C98A5B]"
              />
            </div>

            {/* Invoices Table */}
            {filteredInvoices.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-[#2C211B] rounded-xl p-8 space-y-3">
                <Receipt className="w-12 h-12 text-[#8A776B]/40 mx-auto" />
                <h3 className="text-base font-serif font-bold text-white">
                  {search ? 'No matching invoices found' : 'No Invoices Issued Yet'}
                </h3>
                <p className="text-xs text-[#A69385] max-w-md mx-auto leading-relaxed">
                  {search
                    ? 'Try searching with a different invoice number or clearing your filter.'
                    : `Invoices created for ${customerDisplayName} will automatically synchronize and appear here once posted by Savouré Administration.`}
                </p>
                <div className="pt-2">
                  <a
                    href={SHOWCASE_CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold hover:bg-emerald-900 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Enquire with Bakery Finance Desk</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#2C211B] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#120F0D] text-[#A69385] uppercase font-serif tracking-wider text-[10px] border-b border-[#2C211B]">
                    <tr>
                      <th className="py-3 px-4">Invoice No</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Linked Delivery Note</th>
                      <th className="py-3 px-4">Items Summary</th>
                      <th className="py-3 px-4 text-right">Grand Total</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C211B]">
                    {filteredInvoices.map((inv) => {
                      const linkedDn = getLinkedDeliveryNote(inv);
                      const isDnDelivered = linkedDn && (linkedDn.status === 'Delivered' || Boolean(linkedDn.podSignature));

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-[#221B17]/60 transition-colors cursor-pointer"
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-white">
                            <div className="flex items-center gap-2">
                              <Receipt className="w-3.5 h-3.5 text-[#C98A5B]" />
                              <span>{inv.invoiceNumber}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[#EDE6DE]">
                            {inv.issueDate}
                          </td>

                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            {linkedDn ? (
                              <button
                                onClick={() => setSelectedDeliveryNoteForView(linkedDn)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                                  isDnDelivered
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900'
                                    : 'bg-amber-950/80 text-amber-300 border border-amber-600/60 hover:bg-amber-900 animate-pulse'
                                }`}
                                title={isDnDelivered ? 'View signed Proof of Delivery' : 'View unsigned in-transit delivery note'}
                              >
                                <Truck className="w-3 h-3" />
                                <span>{linkedDn.deliveryNoteNumber}</span>
                                <span className="opacity-75">
                                  {isDnDelivered ? '(Signed)' : '(In Transit)'}
                                </span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#8A776B] font-mono">Direct / Pickup</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-[#EDE6DE] max-w-xs truncate">
                            {inv.items && inv.items.length > 0 ? (
                              <span>
                                {inv.items.map((it) => it.description || it.sku).join(', ')}
                              </span>
                            ) : (
                              <span className="text-[#8A776B] italic">Standard order</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                            {company.currency || 'R'} {(inv.grandTotal || 0).toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-bold">
                            {(inv.balanceDue || 0) > 0 ? (
                              <span className="text-amber-400">
                                {company.currency || 'R'} {(inv.balanceDue || 0).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-emerald-400">R 0.00</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                                inv.status === 'Paid'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : inv.status === 'Overdue'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : inv.status === 'Partial'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-blue-950 text-blue-300 border border-blue-800'
                              }`}
                            >
                              {inv.status === 'Paid' && <CheckCircle className="w-3 h-3" />}
                              {inv.status === 'Overdue' && <AlertCircle className="w-3 h-3" />}
                              {inv.status !== 'Paid' && inv.status !== 'Overdue' && <Clock className="w-3 h-3" />}
                              <span>{inv.status}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {linkedDn && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDeliveryNoteForView(linkedDn);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C98A5B]/20 hover:bg-[#C98A5B]/30 text-[#F3D2BF] font-semibold text-xs border border-[#C98A5B]/40 transition-colors shadow-xs"
                                  title="Print linked Proof of Delivery (POD)"
                                >
                                  <Truck className="w-3 h-3 text-[#C98A5B]" />
                                  <span>Print POD</span>
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedInvoiceForPrint(inv);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C211B] hover:bg-[#3E2C20] text-[#DE9E74] hover:text-[#F3D2BF] font-semibold text-xs border border-[#C98A5B]/40 transition-colors shadow-xs"
                                title="View and print official Tax Invoice"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>View Invoice</span>
                              </button>
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

        {/* ---------------------------------------------------- */}
        {/* TAB 2: DELIVERY NOTES & PROOF OF DELIVERY (POD)     */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'delivery-notes' && (
          <div className="bg-[#1A1411] border border-[#2C211B] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#C98A5B]" />
                  <span>Store Delivery Notes & Proof of Delivery</span>
                </h2>
                <p className="text-xs text-[#A69385] mt-0.5">
                  Track bakery shipments en route and inspect signed receiving bay delivery notes.
                </p>
              </div>

              {/* Delivery Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#120F0D] p-1 rounded-xl border border-[#2C211B]">
                <button
                  onClick={() => setDeliveryStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    deliveryStatusFilter === 'ALL'
                      ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                      : 'text-[#A69385] hover:text-white'
                  }`}
                >
                  All ({merchantDeliveryNotes.length})
                </button>
                <button
                  onClick={() => setDeliveryStatusFilter('In Transit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    deliveryStatusFilter === 'In Transit'
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'text-[#A69385] hover:text-white'
                  }`}
                >
                  In Transit — Unsigned ({inTransitCount})
                </button>
                <button
                  onClick={() => setDeliveryStatusFilter('Delivered')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    deliveryStatusFilter === 'Delivered'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-[#A69385] hover:text-white'
                  }`}
                >
                  Delivered — Signed POD ({deliveredCount})
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A776B]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by delivery note # (e.g. DN-2026-0001), invoice ref, driver, or item..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#120F0D] border border-[#2C211B] rounded-xl text-white placeholder-[#8A776B] focus:outline-none focus:border-[#C98A5B]"
              />
            </div>

            {/* Delivery Notes Table */}
            {filteredDeliveryNotes.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-[#2C211B] rounded-xl p-8 space-y-3">
                <Truck className="w-12 h-12 text-[#8A776B]/40 mx-auto" />
                <h3 className="text-base font-serif font-bold text-white">
                  {search ? 'No matching delivery notes found' : 'No Delivery Dispatches Yet'}
                </h3>
                <p className="text-xs text-[#A69385] max-w-md mx-auto leading-relaxed">
                  {search
                    ? 'Try searching with a different delivery note number or invoice reference.'
                    : `When Savouré dispatches flatbreads and artisanal pastries for ${customerDisplayName}, you can inspect items en route and view signed Proof of Delivery right here.`}
                </p>
                <div className="pt-2">
                  <a
                    href={SHOWCASE_CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold hover:bg-emerald-900 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Contact Logistics Desk via WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#2C211B] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#120F0D] text-[#A69385] uppercase font-serif tracking-wider text-[10px] border-b border-[#2C211B]">
                    <tr>
                      <th className="py-3 px-4">Waybill / Note No</th>
                      <th className="py-3 px-4">Invoice Ref</th>
                      <th className="py-3 px-4">Dispatch / Delivered Date</th>
                      <th className="py-3 px-4">Driver & Vehicle</th>
                      <th className="py-3 px-4">Items Dispatched</th>
                      <th className="py-3 px-4 text-center">Transit & POD Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C211B]">
                    {filteredDeliveryNotes.map((dn) => {
                      const isDelivered = dn.status === 'Delivered' || Boolean(dn.podSignature);

                      return (
                        <tr
                          key={dn.id}
                          className="hover:bg-[#221B17]/60 transition-colors cursor-pointer"
                          onClick={() => setSelectedDeliveryNoteForView(dn)}
                        >
                          {/* Waybill / Note No */}
                          <td className="py-3.5 px-4 font-mono font-bold text-white">
                            <div className="flex items-center gap-2">
                              <Truck className="w-3.5 h-3.5 text-[#C98A5B]" />
                              <span>{dn.deliveryNoteNumber}</span>
                            </div>
                            <div className="text-[10px] text-[#8A776B] font-mono mt-0.5">
                              {dn.branchName || 'Main Branch'}
                            </div>
                          </td>

                          {/* Invoice Ref */}
                          <td className="py-3.5 px-4 font-mono text-[#EDE6DE]">
                            <span className="font-semibold text-[#DE9E74]">{dn.invoiceNumber}</span>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 font-mono text-[#A69385]">
                            <div>
                              {dn.deliveryDate
                                ? new Date(dn.deliveryDate).toLocaleDateString('en-ZA')
                                : dn.dispatchDate
                                ? new Date(dn.dispatchDate).toLocaleDateString('en-ZA')
                                : 'Today'}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {isDelivered && dn.podReceivedAt
                                ? `Delivered: ${new Date(dn.podReceivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : 'Dispatched'}
                            </div>
                          </td>

                          {/* Driver & Vehicle */}
                          <td className="py-3.5 px-4 text-[#EDE6DE]">
                            <div className="font-medium text-white flex items-center gap-1.5">
                              <User className="w-3 h-3 text-[#C98A5B]" />
                              <span>{dn.driverName || 'Dispatch Driver'}</span>
                            </div>
                            {dn.vehicleReg && (
                              <div className="text-[10px] font-mono text-[#8A776B] mt-0.5">
                                Reg: {dn.vehicleReg}
                              </div>
                            )}
                          </td>

                          {/* Items Dispatched */}
                          <td className="py-3.5 px-4 text-[#EDE6DE] max-w-xs">
                            {dn.items && dn.items.length > 0 ? (
                              <div className="space-y-0.5">
                                <span className="font-medium text-white">
                                  {dn.items.reduce((acc, i) => acc + (Number(i.quantityDelivered) || Number(i.quantityOrdered) || 0), 0)} Units Total
                                </span>
                                <div className="text-[11px] text-[#A69385] truncate">
                                  {dn.items.map((it) => `${it.quantityDelivered || it.quantityOrdered}x ${it.description}`).join(', ')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#8A776B] italic">Artisanal Bakery Order</span>
                            )}
                          </td>

                          {/* Transit & POD Status */}
                          <td className="py-3.5 px-4 text-center">
                            {isDelivered ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Delivered (Signed)</span>
                                </span>
                                {dn.podReceivedBy && (
                                  <span className="text-[9px] text-emerald-400 font-mono mt-0.5">
                                    Rec: {dn.podReceivedBy}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                                  <Truck className="w-3 h-3 text-amber-400" />
                                  <span>In Transit (Unsigned)</span>
                                </span>
                                <span className="text-[9px] text-amber-500 font-mono mt-0.5">
                                  Awaiting store receiving signature
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {isDelivered ? (
                                <>
                                  <button
                                    onClick={() => setSelectedDeliveryNoteForView(dn)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors shadow-xs"
                                    title="Print official Proof of Delivery (POD) Slip"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print POD</span>
                                  </button>
                                  <button
                                    onClick={() => setSelectedDeliveryNoteForView(dn)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C211B] hover:bg-[#3E2C20] text-emerald-300 font-semibold text-xs border border-emerald-700/50 transition-colors shadow-xs"
                                    title="View official signed Proof of Delivery"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>View Signed POD</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setSelectedDeliveryNoteForView(dn)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#C98A5B]/20 hover:bg-[#C98A5B]/30 text-[#F3D2BF] font-semibold text-xs border border-[#C98A5B]/40 transition-colors shadow-xs"
                                    title="Print unsigned delivery slip / waybill"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print Slip</span>
                                  </button>
                                  <button
                                    onClick={() => openPodModal(dn)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs"
                                    title="Sign electronic Proof of Delivery upon driver dropoff"
                                  >
                                    <PenTool className="w-3.5 h-3.5" />
                                    <span>Sign POD</span>
                                  </button>
                                </>
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
      </main>

      {/* ---------------------------------------------------- */}
      {/* PRINTABLE TAX INVOICE MODAL                          */}
      {/* ---------------------------------------------------- */}
      {selectedInvoiceForPrint && (
        <InvoicePrintModal
          invoice={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* DELIVERY NOTE MODAL (SIGNED & UNSIGNED VIEWER)       */}
      {/* ---------------------------------------------------- */}
      {selectedDeliveryNoteForView && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#1A1411] border border-[#2C211B] rounded-2xl shadow-2xl my-auto overflow-hidden">
            {/* Top Toolbar */}
            <div className="px-6 py-4 border-b border-[#2C211B] flex items-center justify-between no-print bg-[#201814]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C98A5B]" />
                <span className="font-bold text-white text-sm">
                  Delivery Slip: <span className="font-mono text-[#DE9E74]">{selectedDeliveryNoteForView.deliveryNoteNumber}</span>
                </span>
                {selectedDeliveryNoteForView.status === 'Delivered' || selectedDeliveryNoteForView.podSignature ? (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
                    ✓ SIGNED & DELIVERED
                  </span>
                ) : (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold animate-pulse">
                    🚚 IN TRANSIT — UNSIGNED
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(!selectedDeliveryNoteForView.podSignature && selectedDeliveryNoteForView.status !== 'Delivered') && (
                  <button
                    onClick={() => {
                      const noteToSign = selectedDeliveryNoteForView;
                      setSelectedDeliveryNoteForView(null);
                      openPodModal(noteToSign);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Sign Electronic POD Now</span>
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedDeliveryNoteForView(null)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Waybill Paper Sheet */}
            <div className="p-4 sm:p-8 bg-[#120F0D]">
              <div className="print-container bg-white text-neutral-900 rounded-lg p-6 sm:p-8 shadow-xl text-xs font-sans border border-neutral-300">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#391E0F] border border-[#C98A5B] flex items-center justify-center text-[#DE9E74] font-serif font-black text-xl shrink-0">
                      S
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-bold text-neutral-950">{company.companyName}</h2>
                      <div className="text-[11px] text-[#9B5D34] font-serif font-semibold italic">{company.tradingName}</div>
                      <div className="text-[11px] text-neutral-600">{company.address}</div>
                      <div className="text-[11px] text-neutral-600">Dispatch Desk: {company.phone}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block bg-[#201713] text-white font-extrabold text-xs uppercase px-2.5 py-0.5 tracking-wider mb-1 border-b border-[#C98A5B]">
                      DELIVERY SLIP / WAYBILL
                    </div>
                    <div className="font-mono font-bold text-sm text-neutral-950">
                      {selectedDeliveryNoteForView.deliveryNoteNumber}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      Invoice Ref: {selectedDeliveryNoteForView.invoiceNumber}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      Date: {new Date(selectedDeliveryNoteForView.dispatchDate || selectedDeliveryNoteForView.createdAt).toLocaleDateString('en-ZA')}
                    </div>
                  </div>
                </div>

                {/* Logistics Breakdown */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-neutral-200 text-[11px]">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-neutral-500">Delivered To:</div>
                    <div className="font-bold text-neutral-900 text-sm">{selectedDeliveryNoteForView.customerName}</div>
                    <div className="font-medium text-neutral-800">{selectedDeliveryNoteForView.branchName || 'Main Branch'}</div>
                    <div className="text-neutral-600 leading-tight mt-0.5">
                      {selectedDeliveryNoteForView.deliveryAddress || 'Commercial Store Delivery Address'}
                    </div>
                    {selectedDeliveryNoteForView.recipientPhone && (
                      <div className="text-neutral-600 font-mono mt-0.5">Contact: {selectedDeliveryNoteForView.recipientPhone}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-neutral-500">Driver & Vehicle:</div>
                    <div className="text-neutral-900 font-medium text-sm">{selectedDeliveryNoteForView.driverName || 'Dispatch Driver'}</div>
                    <div className="font-mono text-neutral-700">Vehicle Reg: {selectedDeliveryNoteForView.vehicleReg || 'ND 829-102'}</div>
                    <div className="text-[10px] text-neutral-600 mt-1">
                      Instructions: {selectedDeliveryNoteForView.specialInstructions || 'Handle with care. Return delivery crates upon dropoff.'}
                    </div>
                  </div>
                </div>

                {/* Items Checklist Table */}
                <div className="mb-6">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b-2 border-neutral-900 text-[10px] font-bold uppercase text-neutral-700">
                        <th className="py-1 px-1">SKU</th>
                        <th className="py-1 px-2">Description</th>
                        <th className="py-1 px-2">Pack Count</th>
                        <th className="py-1 px-2 text-right">Ordered</th>
                        <th className="py-1 px-2 text-right">Delivered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {selectedDeliveryNoteForView.items && selectedDeliveryNoteForView.items.length > 0 ? (
                        selectedDeliveryNoteForView.items.map((it, idx) => (
                          <tr key={it.id || idx}>
                            <td className="py-2 px-1 font-mono text-[10px] text-neutral-600">{it.sku || `ITEM-${idx + 1}`}</td>
                            <td className="py-2 px-2 font-medium">{it.description}</td>
                            <td className="py-2 px-2 text-neutral-600">{it.packSize || 'Standard'}</td>
                            <td className="py-2 px-2 text-right font-mono tabular-nums">{it.quantityOrdered}</td>
                            <td className="py-2 px-2 text-right font-mono font-bold tabular-nums text-neutral-900">
                              {it.quantityDelivered || it.quantityOrdered}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-3 text-center text-neutral-500 italic">
                            Order items as specified in Tax Invoice {selectedDeliveryNoteForView.invoiceNumber}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Signature Box Section */}
                <div className="border-2 border-neutral-300 rounded p-4 grid grid-cols-2 gap-4">
                  {/* Left: Driver Dispatch Signoff */}
                  <div>
                    <div className="text-[10px] font-bold uppercase text-neutral-500 mb-2">Driver Dispatch Sign-off:</div>
                    <div className="h-20 border-b border-neutral-400 flex flex-col justify-end pb-1 text-neutral-700 font-mono text-[10px]">
                      <span className="font-serif italic text-neutral-800 text-sm">Dispatched in Good Order</span>
                      <span>Driver: {selectedDeliveryNoteForView.driverName || 'Dispatch Driver'}</span>
                    </div>
                  </div>

                  {/* Right: Proof of Delivery (Signed vs Unsigned) */}
                  <div>
                    <div className="text-[10px] font-bold uppercase text-neutral-500 mb-2">
                      Proof of Delivery (Receiving Bay):
                    </div>
                    {selectedDeliveryNoteForView.podSignature ? (
                      <div className="h-20 flex flex-col justify-end bg-emerald-50/60 p-2 rounded border border-emerald-200">
                        <img
                          src={selectedDeliveryNoteForView.podSignature}
                          alt="POD Signature"
                          className="h-10 object-contain self-start"
                        />
                        <div className="text-[10px] font-mono text-emerald-900 mt-1">
                          Received by: <span className="font-bold">{selectedDeliveryNoteForView.podReceivedBy}</span>
                          {selectedDeliveryNoteForView.podReceivedAt && (
                            <span className="text-neutral-600 block">
                              Signed: {new Date(selectedDeliveryNoteForView.podReceivedAt).toLocaleString('en-ZA')}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 border-2 border-dashed border-amber-300 bg-amber-50/50 rounded flex flex-col items-center justify-center p-2 text-center">
                        <span className="text-[11px] font-bold text-amber-900 uppercase">
                          UNSIGNED — GOODS IN TRANSIT
                        </span>
                        <span className="text-[9px] text-amber-700 mt-0.5">
                          Store receiving bay clerk must inspect crates and sign electronically upon arrival.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedDeliveryNoteForView.notes && (
                  <div className="mt-3 text-[10px] text-neutral-500 font-mono">
                    Notes / Exceptions: {selectedDeliveryNoteForView.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DIGITAL POD SIGNATURE MODAL (TOUCH / MOUSE CANVAS)   */}
      {/* ---------------------------------------------------- */}
      {podNote && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="w-full max-w-md bg-[#1C1613] border border-[#2C211B] rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C211B] pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-emerald-400" />
                <h3 className="font-serif font-bold text-sm text-white">
                  Electronic Proof of Delivery (POD)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPodNote(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#A69385] space-y-1">
              <div>
                Waybill: <strong className="text-white font-mono">{podNote.deliveryNoteNumber}</strong>
              </div>
              <div>
                Invoice: <strong className="text-[#DE9E74] font-mono">{podNote.invoiceNumber}</strong>
              </div>
              <div>
                Store / Consignee: <strong className="text-white">{podNote.customerName}</strong>
              </div>
            </div>

            {podError && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{podError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Receiving Bay Clerk / Store Manager Name *
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. ROOKSHANA / Receiving Manager"
                className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-stone-300">
                  Digital Signature (Draw with touch or mouse) *
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[10px] text-amber-400 hover:text-amber-300 underline"
                >
                  Clear Signature
                </button>
              </div>
              <div className="bg-white rounded-xl overflow-hidden border border-stone-300 touch-none">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={130}
                  className="w-full h-32 cursor-crosshair block"
                  onMouseDown={startDrawing}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onMouseMove={draw}
                  onTouchStart={startDrawing}
                  onTouchEnd={stopDrawing}
                  onTouchMove={draw}
                />
              </div>
              <div className="text-[10px] text-stone-400 text-right mt-1">
                {hasDrawn ? (
                  <span className="text-emerald-400 font-semibold">✓ Signature captured</span>
                ) : (
                  <span>Please sign within the box above</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Receiving Bay Notes / Trays Returned (Optional)
              </label>
              <input
                type="text"
                value={podNotes}
                onChange={(e) => setPodNotes(e.target.value)}
                placeholder="e.g. All 50 trays inspected, verified in pristine condition."
                className="w-full px-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-[#2C211B] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPodNote(null)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePOD}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm POD & Mark Delivered</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
