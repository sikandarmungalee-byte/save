import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { ERPDatabase } from '../types/erp';
import {
  Database,
  Download,
  Upload,
  Trash2,
  Search,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  HardDrive
} from 'lucide-react';

export const DatabaseExplorerView: React.FC = () => {
  const {
    invoices,
    deliveryNotes,
    quotations,
    payments,
    customers,
    products,
    leads,
    communications,
    users,
    company,
    purgeMockData,
    restoreBackup,
    refreshData,
  } = useERP();

  const [selectedCollection, setSelectedCollection] = useState<string>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectDoc, setInspectDoc] = useState<any | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const collections = [
    { id: 'invoices', label: 'Invoices', data: invoices, count: invoices.length },
    { id: 'deliveryNotes', label: 'Delivery Notes', data: deliveryNotes, count: deliveryNotes.length },
    { id: 'quotations', label: 'Quotations', data: quotations, count: quotations.length },
    { id: 'payments', label: 'Payments', data: payments, count: payments.length },
    { id: 'customers', label: 'Customers', data: customers, count: customers.length },
    { id: 'products', label: 'Products', data: products, count: products.length },
    { id: 'leads', label: 'Sales Leads', data: leads, count: leads.length },
    { id: 'communications', label: 'Communications', data: communications, count: communications.length },
    { id: 'users', label: 'Users', data: users, count: users.length },
  ];

  const currentCollection = collections.find((c) => c.id === selectedCollection) || collections[0];

  const filteredData = (currentCollection.data as any[]).filter((item) => {
    if (!searchTerm) return true;
    return JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDownloadBackup = () => {
    const fullDb: ERPDatabase = {
      users,
      company,
      customers,
      products,
      invoices,
      deliveryNotes,
      quotations,
      payments,
      leads,
      communications,
      lastUpdated: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullDb, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `ApexERP_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    setStatusMsg('Portable JSON database backup generated and downloaded successfully.');
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.company || !Array.isArray(parsed.users)) {
          alert('Invalid ERP JSON backup file schema.');
          return;
        }
        if (confirm('Are you sure you want to restore the entire database from this backup? Existing state will be updated.')) {
          await restoreBackup(parsed);
          setStatusMsg('Database successfully restored from backup file.');
          setTimeout(() => setStatusMsg(null), 4000);
        }
      } catch (err: any) {
        alert('Failed to parse backup JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handlePurge = async () => {
    if (confirm('Are you sure you want to clean and wipe all records (customers, products, invoices, delivery notes, quotes, payments, and leads)? Super Admin and Company settings will be preserved.')) {
      setIsPurging(true);
      try {
        await purgeMockData();
        setStatusMsg('All fake and test records wiped successfully. Clean database ready.');
        setTimeout(() => setStatusMsg(null), 4000);
      } catch (err: any) {
        alert('Purge failed: ' + err.message);
      } finally {
        setIsPurging(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
                Enterprise Data Management & Backups
              </span>
              <span className="text-[#3A2D25]">·</span>
              <span className="text-xs text-[#A69385] font-mono">Secure Portable Archive</span>
            </div>
            <h1 className="text-xl font-serif font-bold text-white tracking-tight">
              Database Explorer & Data Portability
            </h1>
            <p className="text-xs text-[#C5B7AC] mt-1 max-w-2xl">
              Inspect database collections, export portable JSON backups, restore previous snapshots, or manage transactions while preserving your company setup.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download Backup */}
            <button
              onClick={handleDownloadBackup}
              className="px-3.5 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>One-Click Backup (JSON)</span>
            </button>

            {/* Restore File Input */}
            <label className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs transition-colors flex items-center gap-1.5 border border-neutral-700 cursor-pointer">
              <Upload className="w-4 h-4 text-neutral-400" />
              <span>Restore Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Purge Transactions */}
            <button
              onClick={handlePurge}
              disabled={isPurging}
              className="px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 font-medium text-xs transition-colors flex items-center gap-1.5 border border-red-800/80"
              title="Wipe test invoices, delivery notes, and payments"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isPurging ? 'Purging...' : 'Purge Mock Data'}</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Collection Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {collections.map((col) => (
          <button
            key={col.id}
            onClick={() => {
              setSelectedCollection(col.id);
              setInspectDoc(null);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap flex items-center gap-2 border transition-colors ${
              selectedCollection === col.id
                ? 'bg-[#C98A5B]/15 border-[#C98A5B]/40 text-[#DE9E74] font-semibold'
                : 'bg-[#171311] border-[#2C211B] text-[#A69385] hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <span>{col.label}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#221B17] text-[#DE9E74] tabular-nums">
              {col.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search within collection */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Filter records in "${currentCollection.label}"...`}
          className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#C98A5B]"
        />
      </div>

      {/* Grid: Records List and JSON Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Document List */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col h-[560px]">
          <div className="p-3 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-white">
              {currentCollection.label} Collection Records
            </span>
            <span className="font-mono">{filteredData.length} records</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/80">
            {filteredData.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No documents found in this collection.
              </div>
            ) : (
              filteredData.map((doc, idx) => {
                const docId = doc.id || doc.invoiceNumber || doc.quoteNumber || doc.paymentNumber || `record_${idx}`;
                const title = doc.name || doc.registeredName || doc.title || doc.invoiceNumber || doc.deliveryNoteNumber || doc.subject || docId;
                const isSelected = inspectDoc?.id === doc.id;

                return (
                  <div
                    key={docId}
                    onClick={() => setInspectDoc(doc)}
                    className={`p-3 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#C98A5B]/10 text-[#F3D2BF] font-semibold'
                        : 'hover:bg-neutral-800/50 text-neutral-300'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-mono font-medium truncate">{title}</div>
                      <div className="text-[10px] text-neutral-500 font-mono truncate">
                        ID: {doc.id || 'N/A'} {doc.createdAt ? `· ${doc.createdAt}` : ''}
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-neutral-500 shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Live JSON Document Inspector */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col h-[560px]">
          <div className="p-3 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-[#DE9E74]" />
              <span>Raw Document Inspector</span>
            </span>
            {inspectDoc && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(inspectDoc, null, 2));
                  alert('Copied document JSON to clipboard!');
                }}
                className="text-[10px] text-neutral-400 hover:text-white underline"
              >
                Copy JSON
              </button>
            )}
          </div>

          <div className="flex-1 p-4 bg-neutral-950/90 font-mono text-[11px] text-neutral-300 overflow-y-auto leading-relaxed">
            {inspectDoc ? (
              <pre className="whitespace-pre-wrap">{JSON.stringify(inspectDoc, null, 2)}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-500 text-xs text-center p-6">
                Click any document row on the left to inspect its live JSON fields.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
