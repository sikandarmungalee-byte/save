import React, { useState, useRef, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  RefreshCw,
  Copy,
  Check,
  Building,
  DollarSign,
  Package,
  Wallet,
  FileSpreadsheet,
  X,
  MessageSquare,
  ChevronRight,
  HelpCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'taskeen';
  text: string;
  timestamp: string;
  model?: string;
}

export const TaskeenAIAdvisor: React.FC<{ isModal?: boolean; onClose?: () => void }> = ({
  isModal = false,
  onClose,
}) => {
  const {
    invoices,
    products,
    stockPurchases,
    stockItemStatuses,
    staff,
    payrollPayouts,
    company,
    currentUser,
  } = useERP();

  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'taskeen',
      text: `Good day! I am **Taskeen**, your Executive AI Advisor powered by Google Gemini.\n\nYou can chat with me and ask questions like a normal AI, as well as consult me on your live business operations, invoices, stock levels, payroll, and financials. How may I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'Gemini 3.8 Flash',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Suggested prompt shortcuts
  const suggestedPrompts = [
    {
      label: 'Out-of-Stock Items',
      prompt: 'Which stock items or raw materials are currently marked finished or depleted at our branches?',
      icon: Package,
    },
    {
      label: 'Revenue & Debtors',
      prompt: 'Summarize our total revenue, unpaid invoices, and customer accounts receivable for this month.',
      icon: DollarSign,
    },
    {
      label: 'Payroll & Overtime',
      prompt: 'What are our monthly staff payroll costs and how is overtime calculated for the team?',
      icon: Wallet,
    },
    {
      label: 'SARS VAT 201',
      prompt: 'Explain our current SARS VAT position: output tax from invoices vs input tax from stock slips.',
      icon: FileSpreadsheet,
    },
    {
      label: 'Bakery Margin Advice',
      prompt: 'Analyze our product catalog prices and suggest margin optimizations for our artisanal bakery lines.',
      icon: TrendingUp,
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || loading) return;

    const userMessage: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setLoading(true);

    // Prepare live ERP context snapshot
    const finishedItems = stockItemStatuses.filter((s) => s.isFinished || s.quantityOnHand <= 0);
    const totalRev = invoices.filter((i) => i.status !== 'Draft').reduce((acc, i) => acc + (Number(i.grandTotal) || 0), 0);
    const unpaidBal = invoices.filter((i) => i.status !== 'Draft').reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0);

    const erpContext = {
      totalRevenue: totalRev,
      unpaidBalances: unpaidBal,
      totalInvoices: invoices.length,
      finishedStockCount: finishedItems.length,
      finishedStockNames: finishedItems.map((s) => `${s.name} (${s.branchName})`),
      totalProducts: products.length,
      staffCount: staff.length,
      companyName: company.companyName,
      currency: company.currency,
    };

    try {
      const response = await fetch('/api/ai/ask-taskeen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          erpContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const taskeenMessage: ChatMessage = {
        id: 'taskeen_' + Date.now(),
        sender: 'taskeen',
        text: data.reply || 'I have analyzed your query. Let me know if you need more details.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: data.model || 'Taskeen Executive AI',
      };

      setMessages((prev) => [...prev, taskeenMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: 'taskeen_err_' + Date.now(),
        sender: 'taskeen',
        text: `**Taskeen Advisory:** I encountered a temporary connection issue. However, your live database shows **${invoices.length} invoices** (${company.currency} ${totalRev.toLocaleString()}) and **${finishedItems.length} out-of-stock items**. Please try your question again in a moment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'taskeen',
        text: `Chat thread cleared. I am ready to advise you on today's operations, financial figures, or customer requirements.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div
      className={`flex flex-col bg-[#171311] border border-[#2C211B] rounded-2xl shadow-2xl overflow-hidden ${
        isModal ? 'h-[85vh] max-h-[780px] w-full max-w-4xl' : 'h-[calc(100vh-140px)] min-h-[580px]'
      }`}
    >
      {/* Top Header Bar */}
      <div className="px-6 py-4 bg-[#120F0D] border-b border-[#2C211B] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8E4A23] via-[#C98A5B] to-[#FAF6F0] p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-[#171311] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#DE9E74] animate-pulse" />
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#120F0D]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-base text-white tracking-wide">
                Taskeen
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#C98A5B]/20 text-[#DE9E74] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#C98A5B]/30">
                Executive AI Advisor
              </span>
            </div>
            <p className="text-[11px] text-[#A69385]">
              Savouré Enterprise Intelligence · Connected to Live Database
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#221B17] transition-colors text-xs flex items-center gap-1"
            title="Clear Chat Thread"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Clear</span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8A776B] hover:text-white hover:bg-[#221B17]"
              title="Close Taskeen"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Prompt Shortcuts Bar */}
      <div className="px-6 py-2.5 bg-[#171311]/90 border-b border-[#2C211B] flex items-center gap-2 overflow-x-auto shrink-0 text-xs scrollbar-none">
        <span className="text-[10px] uppercase font-mono font-bold text-[#DE9E74] shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Quick Prompts:
        </span>
        {suggestedPrompts.map((s, idx) => {
          const Icon = s.icon;
          return (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleSendMessage(s.prompt)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#221B17] hover:bg-[#2C211B] border border-[#3A2D25] text-neutral-300 hover:text-white text-xs transition-colors shrink-0 disabled:opacity-50"
            >
              <Icon className="w-3 h-3 text-[#DE9E74]" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#120F0D]/60">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  isUser
                    ? 'bg-[#C98A5B] text-[#120F0D]'
                    : 'bg-[#221B17] text-[#DE9E74] border border-[#C98A5B]/40'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed relative group shadow-md ${
                  isUser
                    ? 'bg-[#C98A5B] text-[#120F0D] font-medium rounded-tr-none'
                    : 'bg-[#171311] border border-[#2C211B] text-[#EDE6DE] rounded-tl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#2C211B]/60 text-[10px] text-[#A69385]">
                    <span className="font-serif font-bold text-[#DE9E74]">Taskeen Advisor</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{msg.timestamp}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="text-[#8A776B] hover:text-white p-0.5"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Render Text with formatted Markdown-like bold and bullets */}
                <div className="whitespace-pre-wrap space-y-1">
                  {msg.text.split('\n').map((line, lIdx) => {
                    // Check if bullet point
                    if (line.startsWith('• ') || line.startsWith('- ')) {
                      return (
                        <div key={lIdx} className="flex items-start gap-1.5 pl-1">
                          <span className="text-[#DE9E74] shrink-0 font-bold">✦</span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                            }}
                          />
                        </div>
                      );
                    }
                    return (
                      <p
                        key={lIdx}
                        dangerouslySetInnerHTML={{
                          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                        }}
                      />
                    );
                  })}
                </div>

                {isUser && (
                  <div className="text-[10px] text-[#120F0D]/70 font-mono text-right mt-1">
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#221B17] text-[#DE9E74] border border-[#C98A5B]/40 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#171311] border border-[#2C211B] rounded-2xl rounded-tl-none p-4 text-xs text-[#A69385] flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#DE9E74] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#DE9E74] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#DE9E74] animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="font-serif italic text-white ml-2">
                Taskeen is analyzing your enterprise data...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="p-4 bg-[#171311] border-t border-[#2C211B] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={loading}
            placeholder="Ask Gemini anything, or inquire about business, revenue, invoices, strategy..."
            className="flex-1 px-4 py-3 text-xs bg-[#120F0D] border border-[#2C211B] rounded-xl text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || loading}
            className="px-5 py-3 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] disabled:opacity-40 text-[#120F0D] font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Taskeen</span>
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-[#6E5B4F] mt-2 px-1">
          <span>Taskeen Executive AI Intelligence · Enterprise Edition</span>
          <span>Private and confidential</span>
        </div>
      </div>
    </div>
  );
};
