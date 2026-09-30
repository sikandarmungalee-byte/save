import React, { useState, useRef } from 'react';
import { useERP } from '../context/ERPContext';
import { DeliveryNote, DeliveryStatus } from '../types/erp';
import {
  Truck,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  FileText,
  User,
  MapPin,
  PenTool,
  X,
  AlertCircle
} from 'lucide-react';

export const DeliveryNotesView: React.FC = () => {
  const {
    deliveryNotes,
    invoices,
    customers,
    company,
    updateDeliveryNote,
    savePOD,
    deleteDeliveryNote,
  } = useERP();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected note for Print Modal
  const [printNote, setPrintNote] = useState<DeliveryNote | null>(null);

  // Digital POD Signature Modal
  const [podNote, setPodNote] = useState<DeliveryNote | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [podNotes, setPodNotes] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // POD Canvas drawing handlers
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
    setRecipientName(note.recipientName || '');
    setPodNotes('');
    setHasDrawn(false);
  };

  const handleSavePOD = async () => {
    if (!podNote || !canvasRef.current) return;
    if (!recipientName) {
      alert('Please enter receiving bay clerk or manager name.');
      return;
    }

    const signatureDataUrl = canvasRef.current.toDataURL('image/png');
    await savePOD(podNote.id, {
      podSignature: signatureDataUrl,
      podReceivedBy: recipientName,
      notes: podNotes,
    });
    setPodNote(null);
  };

  const filteredNotes = deliveryNotes.filter((note) => {
    const term = search.toLowerCase();
    const matchesSearch =
      note.deliveryNoteNumber.toLowerCase().includes(term) ||
      note.customerName.toLowerCase().includes(term) ||
      note.branchName.toLowerCase().includes(term) ||
      note.invoiceNumber.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'ALL' || note.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
                Logistics & Dispatch Bay
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400 font-mono tabular-nums">{deliveryNotes.length} Total Slips</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Delivery Notes & Proof of Delivery (POD)
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Linked directly to parent tax invoices and store branches. Capture digital touch-signatures, record driver dispatches, and print clean delivery waybills.
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search and Status Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search delivery slip #, invoice #, branch name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#C98A5B]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
          {['ALL', 'Draft', 'In Transit', 'Delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-[#C98A5B] text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Notes Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Slip Reference</th>
                <th className="py-3 px-4 font-semibold">Parent Invoice</th>
                <th className="py-3 px-4 font-semibold">Destination Branch</th>
                <th className="py-3 px-4 font-semibold">Driver / Vehicle</th>
                <th className="py-3 px-4 font-semibold">Status & Proof</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-neutral-500">
                    No delivery notes found matching your search.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => {
                  return (
                    <tr key={note.id} className="hover:bg-neutral-800/40 transition-colors">
                      {/* Slip Reference */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-[#DE9E74] text-xs">
                          {note.deliveryNoteNumber}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {note.items.length} items to offload
                        </div>
                      </td>

                      {/* Parent Invoice */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-neutral-300 font-medium">
                          {note.invoiceNumber || 'Manual Slip'}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {note.customerName}
                        </div>
                      </td>

                      {/* Destination Branch */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white truncate max-w-[200px]">
                          {note.branchName}
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate max-w-[220px]">
                          {note.deliveryAddress}
                        </div>
                      </td>

                      {/* Driver & Vehicle */}
                      <td className="py-3 px-4">
                        <div className="text-neutral-200 font-medium">
                          {note.driverName || 'Dispatch Carrier'}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {note.vehicleReg || 'Fleet Truck'}
                        </div>
                      </td>

                      {/* Status & Proof */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              note.status === 'Delivered'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : note.status === 'In Transit'
                                ? 'bg-[#C98A5B]/15 text-[#F3D2BF] border border-[#C98A5B]/30'
                                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                            }`}
                          >
                            {note.status}
                          </span>

                          {note.podSignature && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>POD Signed</span>
                            </span>
                          )}
                        </div>

                        {note.podReceivedBy && (
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            Rec: {note.podReceivedBy}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Capture POD Signature Button */}
                          {note.status !== 'Delivered' && (
                            <button
                              onClick={() => openPodModal(note)}
                              className="px-2 py-1 rounded bg-[#C98A5B]/20 hover:bg-[#C98A5B]/30 text-[#F3D2BF] text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Capture Digital Proof of Delivery Signature"
                            >
                              <PenTool className="w-3 h-3" />
                              <span>Sign POD</span>
                            </button>
                          )}

                          {/* Print Waybill */}
                          <button
                            onClick={() => setPrintNote(note)}
                            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                            title="Print Delivery Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Mark In Transit */}
                          {note.status === 'Draft' && (
                            <button
                              onClick={() => updateDeliveryNote(note.id, { status: 'In Transit' })}
                              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[#DE9E74] transition-colors"
                              title="Dispatch: Mark In Transit"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Digital POD Signature Modal */}
      {podNote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Capture Proof of Delivery (POD)
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  Slip #{podNote.deliveryNoteNumber} · {podNote.branchName}
                </p>
              </div>
              <button
                onClick={() => setPodNote(null)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Receiving Clerk / Manager Name <span className="text-[#C98A5B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Sipho Zulu (Receiving Dock Manager)"
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>

              {/* Digital Signature Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-neutral-300">
                    Sign Below (Touch or Mouse)
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] text-neutral-400 hover:text-white underline"
                  >
                    Clear Signature
                  </button>
                </div>
                <div className="border border-neutral-700 rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    className="w-full h-40 cursor-crosshair touch-none"
                  />
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  Receiving clerk must draw signature inside the white box above.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Delivery Notes / Demurrage Exceptions
                </label>
                <textarea
                  rows={2}
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  placeholder="e.g. 50 crates inspected, zero damaged loaves, returned 4 empty bread trays."
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPodNote(null)}
                  className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePOD}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm POD & Mark Delivered</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Delivery Slip Modal */}
      {printNote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl my-auto">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between no-print bg-neutral-900/90 rounded-t-xl">
              <span className="font-bold text-white text-sm">
                Delivery Slip: <span className="font-mono text-[#DE9E74]">{printNote.deliveryNoteNumber}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setPrintNote(null)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Waybill Sheet */}
            <div className="p-8 bg-neutral-950/40">
              <div className="print-container bg-white text-neutral-900 rounded-lg p-8 shadow-lg text-xs font-sans border border-neutral-200">
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-4 mb-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={company.logoUrl || "/src/assets/images/savoure_master_logo_1790775722136.jpg"}
                      alt="Savouré Logo"
                      className="w-12 h-12 rounded-full object-cover border border-[#C98A5B] shrink-0"
                    />
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
                    <div className="font-mono font-bold text-sm text-neutral-950">{printNote.deliveryNoteNumber}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">Invoice Ref: {printNote.invoiceNumber}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">Date: {new Date(printNote.dispatchDate).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Logistics breakdown */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-neutral-200 text-[11px]">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-neutral-500">Delivered To:</div>
                    <div className="font-bold text-neutral-900">{printNote.customerName}</div>
                    <div className="font-medium text-neutral-800">{printNote.branchName}</div>
                    <div className="text-neutral-600 leading-tight mt-0.5">{printNote.deliveryAddress}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-neutral-500">Driver & Vehicle:</div>
                    <div className="text-neutral-900 font-medium">{printNote.driverName}</div>
                    <div className="font-mono text-neutral-700">{printNote.vehicleReg}</div>
                    <div className="text-[10px] text-neutral-600 mt-1">Instructions: {printNote.specialInstructions}</div>
                  </div>
                </div>

                {/* Items checklist */}
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
                      {printNote.items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="py-2 px-1 font-mono text-[10px] text-neutral-600">{it.sku}</td>
                          <td className="py-2 px-2 font-medium">{it.description}</td>
                          <td className="py-2 px-2 text-neutral-600">{it.packSize}</td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums">{it.quantityOrdered}</td>
                          <td className="py-2 px-2 text-right font-mono font-bold tabular-nums text-neutral-900">{it.quantityDelivered}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signature Box Section */}
                <div className="border-2 border-neutral-300 rounded p-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-neutral-500 mb-2">Driver Dispatch Signature:</div>
                    <div className="h-16 border-b border-neutral-400 flex items-end pb-1 text-neutral-600 font-mono text-[10px]">
                      Dispatched by: {printNote.driverName}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-neutral-500 mb-2">Proof of Delivery (Receiving Bay):</div>
                    {printNote.podSignature ? (
                      <div className="h-16 flex flex-col justify-end">
                        <img src={printNote.podSignature} alt="POD Signature" className="h-10 object-contain self-start" />
                        <div className="text-[10px] font-mono text-neutral-700 mt-1">
                          Received by: <span className="font-bold">{printNote.podReceivedBy}</span> ({new Date(printNote.podReceivedAt || '').toLocaleString()})
                        </div>
                      </div>
                    ) : (
                      <div className="h-16 border-b border-neutral-400 flex items-end pb-1 text-neutral-400 text-[10px]">
                        Sign and Stamp upon receiving goods in good order.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
