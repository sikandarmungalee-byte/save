import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Lead, LeadStage, CommunicationLog } from '../types/erp';
import {
  Flame,
  Plus,
  Mail,
  Phone,
  Calendar,
  Send,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

export const CRMLeadsView: React.FC = () => {
  const { leads, communications, company, createLead, updateLead, deleteLead, addCommunication, invoices } = useERP();

  const [activeTab, setActiveTab] = useState<'pipeline' | 'communications'>('pipeline');

  // Lead Modal
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    title: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    stage: 'New' as LeadStage,
    estimatedValue: 50000,
    probability: 30,
    notes: '',
  });

  // Comm Modal
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [commForm, setCommForm] = useState({
    type: 'Email' as CommunicationLog['type'],
    targetName: '',
    subject: '',
    content: '',
    direction: 'Outbound' as 'Inbound' | 'Outbound',
  });

  // Quick Document Dispatch Email Preview
  const [dispatchModalInvoice, setDispatchModalInvoice] = useState<any>(null);

  const stages: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.title || !leadForm.companyName) return;

    await createLead({
      title: leadForm.title,
      companyName: leadForm.companyName,
      contactPerson: leadForm.contactPerson,
      email: leadForm.email,
      phone: leadForm.phone,
      stage: leadForm.stage,
      estimatedValue: Number(leadForm.estimatedValue),
      probability: Number(leadForm.probability),
      notes: leadForm.notes,
    });
    setIsLeadModalOpen(false);
  };

  const handleCreateComm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commForm.subject || !commForm.content) return;

    await addCommunication({
      targetType: 'customer',
      targetName: commForm.targetName || 'Commercial Client',
      type: commForm.type,
      subject: commForm.subject,
      content: commForm.content,
      direction: commForm.direction,
      date: new Date().toISOString(),
    });
    setIsCommModalOpen(false);
    setCommForm({
      type: 'Email',
      targetName: '',
      subject: '',
      content: '',
      direction: 'Outbound',
    });
  };

  const handleStageChange = async (leadId: string, nextStage: LeadStage) => {
    await updateLead(leadId, { stage: nextStage });
  };

  const totalPipelineValue = leads
    .filter((l) => l.stage !== 'Lost')
    .reduce((acc, l) => acc + l.estimatedValue, 0);

  const weightedPipelineValue = leads
    .filter((l) => l.stage !== 'Lost')
    .reduce((acc, l) => acc + (l.estimatedValue * l.probability) / 100, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DE9E74]">
                Commercial Pipeline & Client Outreach
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400 font-mono tabular-nums">{leads.length} Active Leads</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Sales Leads & Communications Hub
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              Track retail chain negotiations, tender proposals, contract probabilities, and customer correspondence history with pre-formatted document dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setCommForm({
                  type: 'Email',
                  targetName: 'Spar Group / Procurement',
                  subject: 'Artisanal Supply Contract Quotation Review',
                  content: 'Good day team, following up on our recent volume proposal for weekly sourdough and confectionery deliveries.',
                  direction: 'Outbound',
                });
                setIsCommModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs transition-colors flex items-center gap-1.5 border border-neutral-700"
            >
              <Mail className="w-4 h-4 text-neutral-400" />
              <span>Log Communication</span>
            </button>

            <button
              onClick={() => setIsLeadModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Sales Lead</span>
            </button>
          </div>
        </div>

        {/* Pipeline Value Snapshot */}
        <div className="mt-5 pt-4 border-t border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">Unweighted Pipeline</span>
            <span className="text-base font-bold text-white tabular-nums">
              {company.currency} {totalPipelineValue.toLocaleString('en-ZA')}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">Weighted Forecast</span>
            <span className="text-base font-bold text-[#DE9E74] tabular-nums">
              {company.currency} {weightedPipelineValue.toLocaleString('en-ZA')}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">Proposals Out</span>
            <span className="text-base font-bold text-neutral-200 tabular-nums">
              {leads.filter((l) => l.stage === 'Proposal').length} Deals
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">Won Accounts</span>
            <span className="text-base font-bold text-emerald-400 tabular-nums">
              {leads.filter((l) => l.stage === 'Won').length} Closed
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'pipeline'
              ? 'bg-[#C98A5B] text-neutral-950 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Deal Pipeline Board
        </button>
        <button
          onClick={() => setActiveTab('communications')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'communications'
              ? 'bg-[#C98A5B] text-neutral-950 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Communications Log ({communications.length})
        </button>
      </div>

      {/* Pipeline Board */}
      {activeTab === 'pipeline' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage);
            const stageValue = stageLeads.reduce((acc, l) => acc + l.estimatedValue, 0);

            return (
              <div
                key={stage}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col min-h-[500px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
                  <div>
                    <span className="text-xs font-bold text-white capitalize">{stage}</span>
                    <span className="text-[10px] text-neutral-500 ml-1.5 font-mono">({stageLeads.length})</span>
                  </div>
                  <div className="text-[10px] text-[#DE9E74] font-mono font-semibold">
                    {company.currency} {(stageValue / 1000).toFixed(0)}k
                  </div>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3 rounded-lg bg-neutral-800/60 border border-neutral-700/60 text-xs space-y-2 hover:bg-neutral-800 transition-colors shadow-xs"
                    >
                      <div>
                        <div className="font-semibold text-white leading-tight">{lead.title}</div>
                        <div className="text-[11px] text-[#DE9E74] mt-0.5">{lead.companyName}</div>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[11px] pt-1 border-t border-neutral-700/50">
                        <span className="text-white font-bold">
                          {company.currency} {lead.estimatedValue.toLocaleString('en-ZA')}
                        </span>
                        <span className="text-emerald-400">{lead.probability}% prob</span>
                      </div>

                      <div className="text-[10px] text-neutral-400">
                        Contact: {lead.contactPerson || 'Not listed'}
                      </div>

                      {/* Advance Stage Selector */}
                      <div className="pt-1 flex items-center justify-between">
                        <select
                          value={lead.stage}
                          onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                          className="bg-neutral-900 border border-neutral-700 text-[10px] rounded px-1.5 py-0.5 text-neutral-300"
                        >
                          {stages.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => {
                            if (confirm(`Delete lead ${lead.title}?`)) {
                              deleteLead(lead.id);
                            }
                          }}
                          className="text-neutral-500 hover:text-red-400 p-0.5"
                          title="Delete Lead"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Communications Log Table */
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#DE9E74]">
              Customer Correspondence & Document Dispatch Timeline
            </h2>
          </div>

          <div className="divide-y divide-neutral-800">
            {communications.map((c) => (
              <div key={c.id} className="p-4 hover:bg-neutral-800/30 transition-colors flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-[#DE9E74]">
                  {c.type === 'Email' ? (
                    <Mail className="w-4 h-4" />
                  ) : c.type === 'Phone Call' ? (
                    <Phone className="w-4 h-4" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{c.subject}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                        {c.direction}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(c.date).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-neutral-300 text-xs leading-relaxed mb-1">{c.content}</p>

                  <div className="text-[10px] text-neutral-500 font-mono">
                    Recipient / Account: <span className="text-neutral-400">{c.targetName}</span> · Logged by:{' '}
                    <span className="text-neutral-400">{c.author}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <h3 className="text-base font-bold text-white tracking-tight">Create Sales Lead Deal</h3>
              <button
                onClick={() => setIsLeadModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Deal Title</label>
                <input
                  type="text"
                  required
                  value={leadForm.title}
                  onChange={(e) => setLeadForm({ ...leadForm, title: e.target.value })}
                  placeholder="e.g. Seattle Coffee Co - Pastry Batch Supply"
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={leadForm.companyName}
                  onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                  placeholder="e.g. Seattle Coffee Company SA"
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={leadForm.contactPerson}
                    onChange={(e) => setLeadForm({ ...leadForm, contactPerson: e.target.value })}
                    placeholder="Name"
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="+27..."
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Est. Value ({company.currency})
                  </label>
                  <input
                    type="number"
                    value={leadForm.estimatedValue}
                    onChange={(e) => setLeadForm({ ...leadForm, estimatedValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Win Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={leadForm.probability}
                    onChange={(e) => setLeadForm({ ...leadForm, probability: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Deal Stage</label>
                <select
                  value={leadForm.stage}
                  onChange={(e) => setLeadForm({ ...leadForm, stage: e.target.value as LeadStage })}
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                >
                  {stages.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Comm Modal */}
      {isCommModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <h3 className="text-base font-bold text-white tracking-tight">Log Client Correspondence</h3>
              <button
                onClick={() => setIsCommModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComm} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Recipient / Client</label>
                <input
                  type="text"
                  required
                  value={commForm.targetName}
                  onChange={(e) => setCommForm({ ...commForm, targetName: e.target.value })}
                  placeholder="e.g. David Khumalo (SPAR Category Buyer)"
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Type</label>
                  <select
                    value={commForm.type}
                    onChange={(e) => setCommForm({ ...commForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                  >
                    <option value="Email">Email</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Document Dispatch">Document Dispatch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Direction</label>
                  <select
                    value={commForm.direction}
                    onChange={(e) => setCommForm({ ...commForm, direction: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                  >
                    <option value="Outbound">Outbound</option>
                    <option value="Inbound">Inbound</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={commForm.subject}
                  onChange={(e) => setCommForm({ ...commForm, subject: e.target.value })}
                  placeholder="e.g. Tax Invoice INV-2026-0001 Query"
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Details & Correspondence Content</label>
                <textarea
                  rows={3}
                  required
                  value={commForm.content}
                  onChange={(e) => setCommForm({ ...commForm, content: e.target.value })}
                  placeholder="Record summary of discussion..."
                  className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCommModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#C98A5B] hover:bg-[#DE9E74] text-neutral-950 font-semibold text-xs transition-colors"
                >
                  Save Correspondence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
