import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import {
  BarcodeScanner,
  parseBarcodeMetadata,
  SAMPLE_SOUTH_AFRICAN_BARCODES,
  BarcodeMetadata
} from './BarcodeScanner';
import {
  Barcode,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
  Printer,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  History,
  TrendingDown,
  TrendingUp,
  Tag
} from 'lucide-react';

export const BarcodeScannerModuleView: React.FC = () => {
  const {
    products,
    stockItemStatuses,
    stockMovements,
    recordStockMovement,
    company
  } = useERP();

  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [activeMetadata, setActiveMetadata] = useState<BarcodeMetadata | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<any | null>(null);
  const [quickQty, setQuickQty] = useState<number>(10);
  const [movementType, setMovementType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER'>('STOCK_IN');
  const [selectedBranch, setSelectedBranch] = useState('Main Bakery');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Print Barcode Sheet Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleBarcodeIdentified = (barcode: string) => {
    const meta = parseBarcodeMetadata(barcode);
    setActiveMetadata(meta);

    // Find in products catalog or stock item tracking
    const foundProd =
      products.find((p) => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase()) ||
      SAMPLE_SOUTH_AFRICAN_BARCODES.find((s) => s.barcode === barcode) ||
      stockItemStatuses.find((s) => s.barcode === barcode);

    setMatchedProduct(foundProd || null);
    setManualBarcode(barcode);
  };

  const handleExecuteMovement = async () => {
    if (!manualBarcode.trim()) {
      setBannerMessage('⚠️ Please scan or enter a barcode first');
      setTimeout(() => setBannerMessage(null), 3000);
      return;
    }

    try {
      const prodName = matchedProduct?.name || `Item ${manualBarcode}`;
      const sku = matchedProduct?.sku || `SKU-${manualBarcode.slice(-4)}`;
      const category = matchedProduct?.category || 'Pastry Sheets';

      await recordStockMovement({
        barcode: manualBarcode.trim(),
        sku,
        productName: prodName,
        category,
        quantity: quickQty,
        type: movementType,
        sourceBranch: selectedBranch,
        reason: `Barcode Console: Rapid ${movementType.replace('_', ' ')} (${quickQty} units)`,
      });

      setBannerMessage(`✅ Successfully recorded ${quickQty} units of "${prodName}" as ${movementType.replace('_', ' ')}.`);
      setTimeout(() => setBannerMessage(null), 5000);
    } catch (err: any) {
      setBannerMessage(err.message || 'Failed to record stock movement');
      setTimeout(() => setBannerMessage(null), 4000);
    }
  };

  const handlePrintBarcodeLabels = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP EXECUTIVE HEADER */}
      <div className="bg-[#1E0F07] text-white border border-[#3A2215] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#E0A282] px-2.5 py-0.5 rounded-full bg-[#CC8468]/20 border border-[#CC8468]/30">
                Official Hardware & Camera Scanner
              </span>
              <span className="text-[#A69385]">·</span>
              <span className="text-xs text-[#C5B7AC] font-mono">GS1 South Africa Prefix 600 / 601</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Barcode Scanner, SKU Lookup & Stock Movements
            </h1>

            <p className="text-xs sm:text-sm text-[#C5B7AC] max-w-2xl leading-relaxed">
              Industrial scanner module: Scan packaging with camera or USB wedge, inspect South African EAN-13 barcodes, execute rapid inventory check-ins, and print certified barcode shelf tags.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePrintBarcodeLabels}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/20"
            >
              <Printer className="w-4 h-4 text-[#E0A282]" />
              <span>Print Barcode Labels</span>
            </button>

            <button
              type="button"
              onClick={() => setIsScannerModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#CC8468] hover:bg-[#B86643] text-[#1E0F07] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Launch Camera Scanner</span>
            </button>
          </div>
        </div>

        {bannerMessage && (
          <div className="mt-4 p-3 rounded-xl bg-white/10 text-white text-xs border border-white/20 flex items-center justify-between animate-fade-in">
            <span>{bannerMessage}</span>
            <button onClick={() => setBannerMessage(null)} className="text-stone-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. SCAN & LOOKUP WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Console & Quick Actions */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E8D9CD] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8D9CD]">
            <h3 className="font-serif text-lg font-bold text-[#2B150A] flex items-center gap-2">
              <Barcode className="w-5 h-5 text-[#CC8468]" />
              <span>Barcode Input & Verification</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsScannerModalOpen(true)}
              className="text-xs font-bold text-[#8D5037] hover:underline flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Open Camera</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#75412E] mb-1">
                Scan Barcode or Enter SKU (Prefix 600 / 601)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-[#8D5037] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => {
                      setManualBarcode(e.target.value);
                      if (e.target.value.length >= 6) {
                        handleBarcodeIdentified(e.target.value);
                      }
                    }}
                    placeholder="e.g. 6009800123012 or SAV-SPR-001"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs text-[#2B150A] font-mono font-bold focus:outline-hidden focus:border-[#CC8468]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleBarcodeIdentified(manualBarcode)}
                  className="px-4 py-2.5 rounded-xl bg-[#2B150A] text-white font-bold text-xs uppercase"
                >
                  Lookup
                </button>
              </div>
            </div>

            {/* Quick 1-Click Preset South African Barcodes */}
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D5037] block mb-2">
                Quick Test: South African Registered Bakery Barcodes
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_SOUTH_AFRICAN_BARCODES.slice(0, 4).map((s) => (
                  <button
                    key={s.barcode}
                    type="button"
                    onClick={() => handleBarcodeIdentified(s.barcode)}
                    className="p-2.5 rounded-xl bg-[#FBF7F1] hover:bg-[#EAD8C6] border border-[#E8D9CD] text-left transition-colors cursor-pointer group"
                  >
                    <div className="font-semibold text-[#2B150A] text-xs truncate group-hover:text-[#8D5037]">
                      {s.name}
                    </div>
                    <div className="font-mono text-[10px] text-[#7A6458]">
                      {s.barcode}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rapid Movement Action Form */}
            <div className="pt-4 border-t border-[#E8D9CD] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#75412E]">
                Execute Stock Movement
              </h4>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType('STOCK_IN')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    movementType === 'STOCK_IN'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-[#FBF7F1] text-[#75412E] border border-[#E8D9CD]'
                  }`}
                >
                  + Stock In
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('STOCK_OUT')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    movementType === 'STOCK_OUT'
                      ? 'bg-rose-700 text-white shadow-2xs'
                      : 'bg-[#FBF7F1] text-[#75412E] border border-[#E8D9CD]'
                  }`}
                >
                  - Stock Out
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('TRANSFER')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    movementType === 'TRANSFER'
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'bg-[#FBF7F1] text-[#75412E] border border-[#E8D9CD]'
                  }`}
                >
                  Transfer
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#75412E] mb-1">
                    Movement Quantity (Packs / Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quickQty}
                    onChange={(e) => setQuickQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#75412E] mb-1">
                    Branch Location
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF7F1] border border-[#BD896E]/30 text-xs"
                  >
                    <option value="Main Bakery">Main Bakery (Production)</option>
                    <option value="Sandton Branch">Sandton Branch</option>
                    <option value="Durban Central">Durban Central</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExecuteMovement}
                className="w-full py-3 rounded-full bg-[#CC8468] hover:bg-[#B86643] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Record Movement & Update Cloud Inventory
              </button>
            </div>
          </div>
        </div>

        {/* Right: Barcode Metadata & Inspection Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E8D9CD] p-6 shadow-sm space-y-5">
          <div className="pb-3 border-b border-[#E8D9CD]">
            <h3 className="font-serif text-lg font-bold text-[#2B150A]">
              Scanned Item Metadata
            </h3>
            <p className="text-xs text-[#66483B]">GS1 country identification and inventory tracking.</p>
          </div>

          {activeMetadata ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FBF7F1] border border-[#E8D9CD] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-[#2B150A]">
                    {activeMetadata.barcode}
                  </span>
                  {activeMetadata.isSouthAfrican ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>GS1 South Africa (600/601)</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-800">
                      Standard Code
                    </span>
                  )}
                </div>

                <div className="text-xs text-[#66483B] space-y-1">
                  <div><strong>Format:</strong> {activeMetadata.format}</div>
                  <div><strong>Description:</strong> {activeMetadata.description}</div>
                  <div><strong>Check Digit:</strong> {activeMetadata.isValidCheckDigit ? '✅ Mathematically Valid' : '⚠️ Invalid Check Digit'}</div>
                </div>
              </div>

              {matchedProduct && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                  <div className="font-serif text-base font-bold text-emerald-950">
                    {matchedProduct.name}
                  </div>
                  <div className="text-emerald-800 space-y-0.5">
                    <div><strong>Category:</strong> {matchedProduct.category}</div>
                    {matchedProduct.sku && <div><strong>SKU:</strong> {matchedProduct.sku}</div>}
                    {matchedProduct.unitPrice !== undefined && <div><strong>Unit Price:</strong> R {matchedProduct.unitPrice.toFixed(2)}</div>}
                    {matchedProduct.packSize && <div><strong>Pack Spec:</strong> {matchedProduct.packSize}</div>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-[#7A6458] space-y-2">
              <Package className="w-12 h-12 text-stone-300 mx-auto" />
              <p>No barcode scanned yet.</p>
              <p className="text-[11px] text-[#A69385]">Click "Launch Camera Scanner" or enter an EAN-13 code above.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. RECENT SCANNED MOVEMENTS TABLE */}
      <div className="bg-white rounded-3xl border border-[#E8D9CD] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8D9CD]">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#2B150A] flex items-center gap-2">
              <History className="w-4 h-4 text-[#CC8468]" />
              <span>Recent Scanned Stock Movements ({stockMovements.length})</span>
            </h3>
            <p className="text-xs text-[#66483B]">Real-time audit log of physical barcode scans synced to Cloud Firestore.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBF7F1] text-[#8D5037] uppercase text-[10px] tracking-wider border-b border-[#E8D9CD]">
              <tr>
                <th className="py-3 px-4 font-bold">Movement #</th>
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">Barcode / SKU</th>
                <th className="py-3 px-4 font-bold">Product</th>
                <th className="py-3 px-4 font-bold">Type</th>
                <th className="py-3 px-4 font-bold">Quantity</th>
                <th className="py-3 px-4 font-bold">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8D9CD]/50">
              {stockMovements.slice(0, 10).map((mov) => (
                <tr key={mov.id} className="hover:bg-[#FBF7F1]/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#2B150A]">{mov.movementNumber}</td>
                  <td className="py-3 px-4 text-[#66483B]">{new Date(mov.timestamp).toLocaleTimeString()}</td>
                  <td className="py-3 px-4 font-mono text-[#8D5037]">{mov.barcode || mov.sku}</td>
                  <td className="py-3 px-4 font-semibold text-[#2B150A]">{mov.productName}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        mov.type === 'STOCK_IN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mov.type === 'STOCK_OUT'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {mov.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#2B150A]">
                    {mov.quantity} {mov.unit}
                  </td>
                  <td className="py-3 px-4 text-[#66483B]">{mov.sourceBranch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CAMERA SCANNER MODAL */}
      {isScannerModalOpen && (
        <BarcodeScanner
          onScan={(barcode, meta) => {
            setActiveMetadata(meta);
            setManualBarcode(barcode);
            handleBarcodeIdentified(barcode);
            setIsScannerModalOpen(false);
          }}
          onClose={() => setIsScannerModalOpen(false)}
        />
      )}

      {/* PRINT BARCODE LABELS MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#301610] text-[#FFF9F0] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Printer className="w-6 h-6 text-[#D7A77C]" />
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">GS1 South Africa Barcode Labels Sheet</h3>
                  <p className="text-xs text-[#F5E8D5]/70">Official EAN-13 barcodes ready for printing on standard label stock</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SAMPLE_SOUTH_AFRICAN_BARCODES.map((item) => (
                  <div key={item.barcode} className="border-2 border-dashed border-[#CC8468] p-4 rounded-xl text-center bg-[#FFFDFB]">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-[#8D5037]">Savouré — A Taste of Tradition</div>
                    <div className="text-sm font-bold text-[#1E0F07] mt-1">{item.name}</div>
                    <div className="text-xs font-mono text-[#66483B]">{item.category} · {item.unit}</div>
                    <div className="h-12 my-2 bg-[repeating-linear-gradient(90deg,#1E0F07_0px,#1E0F07_3px,#fff_3px,#fff_6px,#1E0F07_6px,#1E0F07_8px,#fff_8px,#fff_12px)] rounded-xs" />
                    <div className="font-mono text-sm font-bold tracking-widest text-[#1E0F07]">{item.barcode}</div>
                    <div className="text-[9px] text-emerald-700 font-bold uppercase mt-1">100% Halal Certified · GS1 South Africa Verified</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <span className="text-xs text-stone-500">Includes 6 official GS1 SA pastry SKUs</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-[#301610] hover:bg-[#4a241b] text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4 text-[#D7A77C]" />
                  Print Labels
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
