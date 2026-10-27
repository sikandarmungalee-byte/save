import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import {
  ProductionLine,
  ProductionBatch,
  Product,
  ProductionIngredientUsage,
  ProductionQualityCheck
} from '../types/erp';
import {
  Factory,
  Layers,
  Sparkles,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ChevronRight,
  ShieldCheck,
  Package,
  Trash2,
  X,
  Search,
  Barcode,
  Calendar,
  User as UserIcon,
  Activity,
  Flame,
  Check,
  Scale,
  Sliders,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface ProductionLineModuleViewProps {
  initialSubcategoryId?: string | null;
}

export const ProductionLineModuleView: React.FC<ProductionLineModuleViewProps> = ({
  initialSubcategoryId
}) => {
  const {
    productionLines,
    productionBatches,
    products,
    stockItemStatuses,
    currentUser,
    updateProductionLineStatus,
    createProductionBatch,
    updateProductionBatchStatus,
    completeProductionBatch,
    deleteProductionBatch,
  } = useERP();

  // Active view tab: 'lines' | 'batches' | 'completed' | 'qc'
  const [activeTab, setActiveTab] = useState<'lines' | 'batches' | 'completed' | 'qc'>('lines');
  const [filterLineId, setFilterLineId] = useState<string>('ALL');

  // Modals
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [isQCModalOpen, setIsQCModalOpen] = useState(false);
  const [selectedBatchForQC, setSelectedBatchForQC] = useState<ProductionBatch | null>(null);
  const [isBatchLabelModalOpen, setIsBatchLabelModalOpen] = useState(false);
  const [selectedBatchForLabel, setSelectedBatchForLabel] = useState<ProductionBatch | null>(null);

  // New Batch Form State
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || 'prod_spring_roll');
  const [selectedLineId, setSelectedLineId] = useState<string>('line_01');
  const [plannedQty, setPlannedQty] = useState<number>(500);
  const [operatorName, setOperatorName] = useState<string>('Sipho Ndlovu');
  const [supervisorName, setSupervisorName] = useState<string>('Yusuf Patel');
  const [batchNotes, setBatchNotes] = useState<string>('Standard morning production run');

  // QC / Completion Form State
  const [actualYieldInput, setActualYieldInput] = useState<number>(490);
  const [rejectedQtyInput, setRejectedQtyInput] = useState<number>(10);
  const [qcThicknessInput, setQcThicknessInput] = useState<number>(0.85);
  const [qcSampleWeightInput, setQcSampleWeightInput] = useState<number>(201.5);
  const [qcMoistureInput, setQcMoistureInput] = useState<number>(12.2);
  const [qcVisualAppearance, setQcVisualAppearance] = useState<'Pass' | 'Fail' | 'Marginal'>('Pass');
  const [qcMetalDetected, setQcMetalDetected] = useState<boolean>(true);
  const [qcSealIntegrity, setQcSealIntegrity] = useState<boolean>(true);
  const [qcInspectorName, setQcInspectorName] = useState<string>(currentUser?.name || 'Zainab Cassim (QC Officer)');
  const [qcNotesInput, setQcNotesInput] = useState<string>('Consistent sheet elasticity, perfect lamination.');

  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Stats calculation
  const runningLinesCount = useMemo(() => {
    return productionLines.filter((l) => l.status === 'RUNNING').length;
  }, [productionLines]);

  const activeBatches = useMemo(() => {
    return productionBatches.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
  }, [productionBatches]);

  const completedBatches = useMemo(() => {
    return productionBatches.filter((b) => b.status === 'COMPLETED');
  }, [productionBatches]);

  const totalOutputToday = useMemo(() => {
    return completedBatches.reduce((acc, b) => acc + (b.actualYield || 0), 0);
  }, [completedBatches]);

  // Stage sequence
  const STAGES: Array<{ id: ProductionBatch['status']; label: string }> = [
    { id: 'PLANNED', label: '1. Planned' },
    { id: 'DOUGH_MIXING', label: '2. Mixing' },
    { id: 'SHEETING_LAMINATION', label: '3. Sheeting' },
    { id: 'FORMING_CUTTING', label: '4. Folding/Cut' },
    { id: 'BAKING_COOLING', label: '5. Baking/Cool' },
    { id: 'QUALITY_CONTROL', label: '6. QC Gate' },
    { id: 'PACKAGING', label: '7. Packaging' },
    { id: 'COMPLETED', label: '8. Completed' },
  ];

  // Helper to advance batch stage
  const handleAdvanceStage = async (batch: ProductionBatch) => {
    const currentIdx = STAGES.findIndex((s) => s.id === batch.status);
    if (currentIdx < 0 || currentIdx >= STAGES.length - 1) return;

    const nextStage = STAGES[currentIdx + 1].id;

    if (nextStage === 'COMPLETED') {
      // Open QC modal to finalize yield and add to stock
      setSelectedBatchForQC(batch);
      setActualYieldInput(batch.plannedQuantity - 10);
      setRejectedQtyInput(10);
      setIsQCModalOpen(true);
      return;
    }

    try {
      await updateProductionBatchStatus(batch.id, nextStage);
      setBannerNotice(`Batch ${batch.batchNumber} advanced to ${nextStage.replace('_', ' ')}.`);
      setTimeout(() => setBannerNotice(null), 3000);
    } catch (err: any) {
      setBannerNotice(err.message || 'Failed to update stage');
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  // Submit New Production Batch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProductId) || products[0];
    const line = productionLines.find((l) => l.id === selectedLineId) || productionLines[0];

    // Calculate BOM roughly based on planned quantity
    const flourKg = Math.round(plannedQty * 0.2);
    const oilL = Math.round(plannedQty * 0.03);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = productionBatches.length + 1;
    const batchNumber = `BATCH-${dateStr}-${String(seq).padStart(3, '0')}`;
    const lotCode = `LOT-${dateStr}-${prod.sku.slice(-3)}`;

    try {
      await createProductionBatch({
        batchNumber,
        lineId: line.id,
        lineName: line.name,
        targetProductId: prod.id,
        targetProductName: prod.name,
        targetSku: prod.sku,
        plannedQuantity: plannedQty,
        status: 'PLANNED',
        ingredients: [
          {
            ingredientId: 'ing_flour',
            ingredientName: 'Supreme Unbleached Pastry Flour (25kg)',
            sku: 'RAW-FLR-001',
            quantityUsed: flourKg,
            unit: 'kg',
            costPerUnit: 14.50,
          },
          {
            ingredientId: 'ing_oil',
            ingredientName: 'Pure Sunflower Laminating Oil (20L)',
            sku: 'RAW-OIL-002',
            quantityUsed: oilL,
            unit: 'litres',
            costPerUnit: 26.00,
          },
        ],
        operatorName,
        supervisorName,
        lotCode,
        notes: batchNotes,
      });

      setIsNewBatchModalOpen(false);
      setBannerNotice(`Production batch ${batchNumber} scheduled on ${line.code}.`);
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err: any) {
      setBannerNotice(err.message || 'Failed to schedule batch');
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  // Submit QC & Finalize Batch
  const handleFinalizeBatch = async () => {
    if (!selectedBatchForQC) return;

    try {
      await completeProductionBatch(
        selectedBatchForQC.id,
        actualYieldInput,
        rejectedQtyInput,
        qcNotesInput
      );

      setIsQCModalOpen(false);
      setSelectedBatchForLabel({
        ...selectedBatchForQC,
        actualYield: actualYieldInput,
        rejectedQuantity: rejectedQtyInput,
        status: 'COMPLETED',
      });
      setIsBatchLabelModalOpen(true);
      setBannerNotice(`Batch ${selectedBatchForQC.batchNumber} finalized! ${actualYieldInput} packs added to ERP inventory.`);
      setTimeout(() => setBannerNotice(null), 5000);
    } catch (err: any) {
      setBannerNotice(err.message || 'Failed to complete batch');
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Factory Controls */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#2C211B] border border-[#4A392F] flex items-center justify-center text-[#DE9E74] shrink-0">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-serif font-bold text-white tracking-tight">
                  Factory Production Lines & Bakery Floor
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-700 text-emerald-400 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {runningLinesCount} of {productionLines.length} Lines Running
                </span>
              </div>
              <p className="text-xs text-[#A69385] mt-0.5">
                Pastry sheeting, samosa folding & roti griddle lines, recipe BOMs, QC thickness checks, and automatic warehouse inventory updates.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Switcher Tabs */}
            <div className="flex bg-[#221B17] p-1 rounded-xl border border-[#3A2D25] text-xs font-medium">
              <button
                onClick={() => setActiveTab('lines')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'lines'
                    ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-sm'
                    : 'text-[#A69385] hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Lines ({productionLines.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('batches')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'batches'
                    ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-sm'
                    : 'text-[#A69385] hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Active Runs ({activeBatches.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'completed'
                    ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-sm'
                    : 'text-[#A69385] hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed ({completedBatches.length})</span>
              </button>
            </div>

            <button
              onClick={() => setIsNewBatchModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Production Run</span>
            </button>
          </div>
        </div>

        {/* Quick Floor KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#2C211B] text-xs">
          <div className="p-2.5 rounded-xl bg-[#221B17] border border-[#3A2D25]">
            <span className="text-[10px] text-[#A69385] uppercase tracking-wider font-semibold">Active Production Lines</span>
            <div className="text-base font-bold text-white font-mono mt-0.5">{runningLinesCount} Operational</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#221B17] border border-[#3A2D25]">
            <span className="text-[10px] text-[#A69385] uppercase tracking-wider font-semibold">Batches In Progress</span>
            <div className="text-base font-bold text-[#DE9E74] font-mono mt-0.5">{activeBatches.length} Runs</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#221B17] border border-[#3A2D25]">
            <span className="text-[10px] text-[#A69385] uppercase tracking-wider font-semibold">Today's Completed Yield</span>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">{totalOutputToday} Finished Packs</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#221B17] border border-[#3A2D25]">
            <span className="text-[10px] text-[#A69385] uppercase tracking-wider font-semibold">ERP Stock Sync</span>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">Automated Real-Time</div>
          </div>
        </div>

        {bannerNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
        )}
      </div>

      {/* ---------------- 1. FACTORY PRODUCTION LINES GRID ---------------- */}
      {activeTab === 'lines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Bakery Machinery & Conveyor Lines</h2>
              <p className="text-xs text-stone-500">Live machinery status, extrusion lines, folding portions, and supervisor controls.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productionLines.map((line) => {
              const activeBatchOnLine = activeBatches.find((b) => b.lineId === line.id);
              return (
                <div
                  key={line.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs hover:shadow-sm transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F5E8D5] text-[#75412e] flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        {line.code}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900">{line.name}</h3>
                        <p className="text-xs text-stone-500">{line.section}</p>
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <select
                      value={line.status}
                      onChange={(e) => updateProductionLineStatus(line.id, e.target.value as any)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-xl border focus:outline-none ${
                        line.status === 'RUNNING'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : line.status === 'IDLE'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : line.status === 'CLEANING'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <option value="RUNNING">● Running</option>
                      <option value="IDLE">○ Idle</option>
                      <option value="CLEANING">◌ Cleaning / Sanitization</option>
                      <option value="MAINTENANCE">▲ Maintenance</option>
                    </select>
                  </div>

                  {/* Line Metrics & Supervisor */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Supervisor</span>
                      <div className="font-bold text-stone-800 mt-0.5">{line.supervisor}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase font-semibold">Capacity</span>
                      <div className="font-mono font-bold text-stone-800 mt-0.5">{line.capacityPerHour}</div>
                    </div>
                  </div>

                  {/* Current Active Batch on Line */}
                  <div className="text-xs space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Current Work Order</span>
                    {activeBatchOnLine ? (
                      <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-amber-900">{activeBatchOnLine.batchNumber}</div>
                          <div className="text-[11px] text-amber-700">{activeBatchOnLine.targetProductName}</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                          {activeBatchOnLine.status.replace('_', ' ')}
                        </span>
                      </div>
                    ) : (
                      <div className="text-stone-400 italic text-[11px]">No active batch currently running on this line.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- 2. ACTIVE PRODUCTION BATCHES PIPELINE ---------------- */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Active Production Runs ({activeBatches.length})</h2>
              <p className="text-xs text-stone-500">Track batches from flour mixing to lamination, cutting, and packaging.</p>
            </div>
          </div>

          <div className="space-y-3">
            {activeBatches.map((batch) => {
              const currentStageIdx = STAGES.findIndex((s) => s.id === batch.status);
              return (
                <div
                  key={batch.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#391E0F] text-[#F5E8D5]">
                          {batch.batchNumber}
                        </span>
                        <h3 className="text-sm font-bold text-stone-900">{batch.targetProductName}</h3>
                      </div>
                      <div className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Line: <strong className="text-stone-800">{batch.lineName}</strong></span>
                        <span>•</span>
                        <span>Planned: <strong className="text-stone-800">{batch.plannedQuantity} packs</strong></span>
                        <span>•</span>
                        <span>Lot: <strong className="font-mono text-stone-800">{batch.lotCode}</strong></span>
                        <span>•</span>
                        <span>Supervisor: <strong className="text-stone-800">{batch.supervisorName}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAdvanceStage(batch)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] text-[#F5E8D5] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <span>Advance Stage</span>
                        <ChevronRight className="w-4 h-4 text-[#E0A282]" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Cancel production batch ${batch.batchNumber}?`)) {
                            deleteProductionBatch(batch.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Cancel Batch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stage Progress Bar */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center text-[10px]">
                    {STAGES.map((stg, idx) => {
                      const isDone = idx < currentStageIdx;
                      const isCurrent = idx === currentStageIdx;
                      return (
                        <div
                          key={stg.id}
                          className={`p-1.5 rounded-lg border font-semibold ${
                            isCurrent
                              ? 'bg-[#391E0F] text-[#F5E8D5] border-[#391E0F] shadow-xs'
                              : isDone
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-stone-50 text-stone-400 border-stone-200'
                          }`}
                        >
                          <div className="truncate">{stg.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bill of Materials (BOM) summary */}
                  {batch.ingredients && batch.ingredients.length > 0 && (
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs">
                      <span className="font-bold text-[11px] text-stone-600 uppercase tracking-wide">
                        Ingredients Allocated (BOM):
                      </span>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-stone-700">
                        {batch.ingredients.map((ing, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-stone-200">
                            <strong>{ing.ingredientName}:</strong> {ing.quantityUsed} {ing.unit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {activeBatches.length === 0 && (
              <div className="py-16 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
                <Factory className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No batches currently on the factory floor.</p>
                <button
                  onClick={() => setIsNewBatchModalOpen(true)}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#391E0F] text-[#F5E8D5] text-xs font-bold"
                >
                  Schedule Next Production Run
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- 3. COMPLETED BATCHES ARCHIVE ---------------- */}
      {activeTab === 'completed' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Completed Production Runs & Yield Log</h2>
              <p className="text-xs text-stone-500">Historical production yield, quality pass certificates, and lot numbers.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                  <th className="p-2.5">Batch #</th>
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5">Line</th>
                  <th className="p-2.5 text-right">Planned</th>
                  <th className="p-2.5 text-right">Yield</th>
                  <th className="p-2.5 text-right">Scrap</th>
                  <th className="p-2.5">Efficiency</th>
                  <th className="p-2.5">Lot Code</th>
                  <th className="p-2.5">QC Inspector</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {completedBatches.map((b) => {
                  const efficiency = b.plannedQuantity > 0 ? Math.round((b.actualYield / b.plannedQuantity) * 100) : 100;
                  return (
                    <tr key={b.id} className="hover:bg-stone-50">
                      <td className="p-2.5 font-bold text-stone-900">{b.batchNumber}</td>
                      <td className="p-2.5 font-sans font-medium text-stone-800">{b.targetProductName}</td>
                      <td className="p-2.5 font-sans text-stone-600">{b.lineName}</td>
                      <td className="p-2.5 text-right">{b.plannedQuantity}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">{b.actualYield}</td>
                      <td className="p-2.5 text-right text-rose-600">{b.rejectedQuantity}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          efficiency >= 95 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {efficiency}%
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-[#75412e]">{b.lotCode}</td>
                      <td className="p-2.5 font-sans text-stone-600">{b.qc?.inspectorName || 'QC Passed'}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedBatchForLabel(b);
                            setIsBatchLabelModalOpen(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold"
                        >
                          Label
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {completedBatches.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-stone-400">
                      No completed production batches recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- SCHEDULE NEW PRODUCTION BATCH MODAL ---------------- */}
      {isNewBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-[#CC8468]" />
                <h3 className="text-sm font-bold text-stone-900">Schedule Bakery Production Run</h3>
              </div>
              <button
                onClick={() => setIsNewBatchModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Target Product to Manufacture:</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Assigned Production Line:</label>
                  <select
                    value={selectedLineId}
                    onChange={(e) => setSelectedLineId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  >
                    {productionLines.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code} - {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Planned Target Quantity (Packs):</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={plannedQty}
                    onChange={(e) => setPlannedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Shift Supervisor:</label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Lead Machine Operator:</label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Batch Run Notes:</label>
                <input
                  type="text"
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="e.g. Extra thin lamination for weekend hotel catering"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 text-[11px] space-y-1">
                <div className="font-semibold text-stone-800">Automatic ERP Integration:</div>
                <div>• Auto-calculates Bill of Materials (BOM) flour and laminating oil</div>
                <div>• Generates product barcode batch lot number</div>
                <div>• Completing the batch will automatically increase warehouse stock</div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] text-[#F5E8D5] font-bold text-xs shadow-sm transition-colors"
                >
                  Start Batch Production
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewBatchModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- QUALITY CONTROL (QC) & COMPLETION MODAL ---------------- */}
      {isQCModalOpen && selectedBatchForQC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Quality Control (QC) & Stock Transfer</h3>
                  <p className="text-[11px] text-stone-500">Sign off quality standards and transfer finished goods into ERP stock.</p>
                </div>
              </div>
              <button
                onClick={() => setIsQCModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="font-sans text-stone-600">Batch Code:</span>
                  <span className="font-bold text-stone-900">{selectedBatchForQC.batchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-stone-600">Product:</span>
                  <span className="font-sans font-bold">{selectedBatchForQC.targetProductName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-stone-600">Planned Output:</span>
                  <span>{selectedBatchForQC.plannedQuantity} packs</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Actual Passed Yield (Packs):</label>
                  <input
                    type="number"
                    value={actualYieldInput}
                    onChange={(e) => setActualYieldInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-emerald-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Rejected Scrap / Trimmings:</label>
                  <input
                    type="number"
                    value={rejectedQtyInput}
                    onChange={(e) => setRejectedQtyInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-rose-700 text-xs"
                  />
                </div>
              </div>

              {/* QC Parameters */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                <span className="font-bold text-[11px] text-stone-800 uppercase tracking-wide">
                  Laboratory & Caliper Measurements:
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-500 font-semibold">Sheet Thickness (mm):</label>
                    <input
                      type="number"
                      step="0.05"
                      value={qcThicknessInput}
                      onChange={(e) => setQcThicknessInput(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 font-semibold">Sample Pack Wt (g):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={qcSampleWeightInput}
                      onChange={(e) => setQcSampleWeightInput(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 font-semibold">Moisture (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={qcMoistureInput}
                      onChange={(e) => setQcMoistureInput(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qcMetalDetected}
                      onChange={(e) => setQcMetalDetected(e.target.checked)}
                      className="rounded text-[#CC8468]"
                    />
                    <span className="text-[11px] font-medium text-stone-700">Metal Detector Clear</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qcSealIntegrity}
                      onChange={(e) => setQcSealIntegrity(e.target.checked)}
                      className="rounded text-[#CC8468]"
                    />
                    <span className="text-[11px] font-medium text-stone-700">Pouch Heat Seal Air-Tight</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">QC Inspector Signature:</label>
                <input
                  type="text"
                  value={qcInspectorName}
                  onChange={(e) => setQcInspectorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleFinalizeBatch}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pass QC & Add to Finished Goods Stock</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsQCModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- BATCH PRODUCTION LABEL & BARCODE MODAL ---------------- */}
      {isBatchLabelModalOpen && selectedBatchForLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <Barcode className="w-4 h-4 text-[#CC8468]" />
                <span>Production Batch Barcode Label</span>
              </div>
              <button
                onClick={() => setIsBatchLabelModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Carton / Master Pack Label */}
            <div className="bg-white p-4 rounded-xl border-2 border-stone-900 font-mono text-xs text-stone-900 space-y-2.5 shadow-sm">
              <div className="border-b-2 border-stone-900 pb-1.5 flex justify-between items-start">
                <div>
                  <div className="font-serif font-black text-sm tracking-tight uppercase">Savouré Artisanal Pastry</div>
                  <div className="text-[10px]">South African Halal Certified Bakery</div>
                </div>
                <div className="text-[10px] font-bold text-right">
                  Bakery Lot
                </div>
              </div>

              <div>
                <div className="font-sans font-black text-sm">{selectedBatchForLabel.targetProductName}</div>
                <div className="text-[11px] text-stone-600">SKU: {selectedBatchForLabel.targetSku}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-stone-300">
                <div>
                  <span className="text-stone-500">BATCH:</span>
                  <div className="font-bold">{selectedBatchForLabel.batchNumber}</div>
                </div>
                <div>
                  <span className="text-stone-500">LOT CODE:</span>
                  <div className="font-bold">{selectedBatchForLabel.lotCode}</div>
                </div>
                <div>
                  <span className="text-stone-500">YIELD:</span>
                  <div className="font-bold">{selectedBatchForLabel.actualYield} Units</div>
                </div>
                <div>
                  <span className="text-stone-500">EXPIRY:</span>
                  <div className="font-bold">{selectedBatchForLabel.expiryDate}</div>
                </div>
              </div>

              {/* Barcode Graphic Representation */}
              <div className="pt-2 text-center">
                <div className="h-10 bg-stone-900 flex items-center justify-center text-white text-[9px] tracking-[6px] font-mono">
                  || | |||| | || |||| | |||
                </div>
                <div className="text-[10px] font-bold tracking-widest mt-1">
                  6009800{selectedBatchForLabel.batchNumber.slice(-5)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-[#391E0F] hover:bg-[#2B150A] text-[#F5E8D5] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Master Carton Label</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBatchLabelModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
