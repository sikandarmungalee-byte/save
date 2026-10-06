import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PinLockModal } from './components/PinLockModal';
import { UserLoginModal } from './components/UserLoginModal';
import { DashboardOverview } from './components/DashboardOverview';
import { InvoicesView } from './components/InvoicesView';
import { DeliveryNotesView } from './components/DeliveryNotesView';
import { QuotationsView } from './components/QuotationsView';
import { PaymentsView } from './components/PaymentsView';
import { CustomersView } from './components/CustomersView';
import { ProductsView } from './components/ProductsView';
import { ReportsView } from './components/ReportsView';
import { CRMLeadsView } from './components/CRMLeadsView';
import { UserManagementView } from './components/UserManagementView';
import { DatabaseExplorerView } from './components/DatabaseExplorerView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { InvoiceStudioView } from './components/invoice/InvoiceStudioView';
import { StaffPayrollView } from './components/StaffPayrollView';
import { StockCapturingView } from './components/StockCapturingView';
import { AccountingView } from './components/AccountingView';
import { TaskeenAIAdvisor } from './components/TaskeenAIAdvisor';
import { MerchantsManagementView } from './components/MerchantsManagementView';
import { ShowcaseApp } from './components/showcase/ShowcaseApp';
import { News24Ticker } from './components/News24Ticker';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Menu, Sparkles } from 'lucide-react';

interface MainLayoutProps {
  onGoToWebsite?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onGoToWebsite }) => {
  const { currentUser } = useERP();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isTaskeenModalOpen, setIsTaskeenModalOpen] = useState<boolean>(false);

  // Automatically prompt for sign-in or initial setup if no user is active
  const shouldShowLogin = isLoginModalOpen || !currentUser;

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardOverview onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'invoices':
        return (
          <InvoicesView
            onNavigateToDeliveryNotes={() => setCurrentTab('delivery-notes')}
            onNavigateToPayments={() => setCurrentTab('payments')}
          />
        );
      case 'invoice-studio':
        return <InvoiceStudioView />;
      case 'delivery-notes':
        return <DeliveryNotesView />;
      case 'quotations':
        return (
          <QuotationsView
            onNavigateToInvoices={() => setCurrentTab('invoices')}
          />
        );
      case 'payments':
        return <PaymentsView />;
      case 'customers':
        return <CustomersView />;
      case 'catalog':
        return <ProductsView />;
      case 'reports':
        return <ReportsView />;
      case 'stock':
      case 'stock-capturing':
      case 'inventory':
        return <StockCapturingView />;
      case 'payroll':
      case 'staff':
      case 'staff-payroll':
        return <StaffPayrollView />;
      case 'accounting':
      case 'ledger':
      case 'ledgers':
        return <AccountingView />;
      case 'taskeen':
      case 'ai':
        return <TaskeenAIAdvisor />;
      case 'crm':
        return <CRMLeadsView />;
      case 'users':
        return <UserManagementView />;
      case 'merchants':
      case 'merchant':
        return <MerchantsManagementView />;
      case 'database':
        return <DatabaseExplorerView />;
      case 'settings':
        return <CompanySettingsView />;
      default:
        return <DashboardOverview onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#120F0D] text-[#EDE6DE] overflow-hidden font-sans selection:bg-[#C98A5B] selection:text-white">
      {/* Security PIN Screen Lock Overlay */}
      <PinLockModal />

      {/* Multi-Device Login / Switch Account Modal */}
      <UserLoginModal
        isOpen={shouldShowLogin}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        onGoToWebsite={onGoToWebsite}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-3 text-[#A69385] hover:text-white lg:hidden shrink-0 border-b border-[#2C211B] bg-[#171311] h-16 flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <Header
              currentTab={currentTab}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onGoToWebsite={onGoToWebsite}
            />
          </div>
        </div>

        {/* Scrollable Workspace Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-16 bg-[#120F0D]">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Floating Ask Taskeen AI Launcher (available across all screens) */}
      {currentTab !== 'taskeen' && currentTab !== 'ai' && (
        <button
          onClick={() => setIsTaskeenModalOpen(true)}
          className="fixed bottom-14 right-5 z-40 px-3.5 py-2 rounded-full bg-gradient-to-r from-[#C98A5B] to-[#DE9E74] text-[#120F0D] font-bold text-xs shadow-2xl hover:scale-105 transition-all flex items-center gap-2 border border-white/20 group"
          title="Ask Taskeen - Your Executive AI Business Advisor"
        >
          <div className="w-5 h-5 rounded-full bg-[#120F0D] flex items-center justify-center text-[#DE9E74] shrink-0">
            <Sparkles className="w-3 h-3 animate-pulse" />
          </div>
          <span className="font-serif tracking-wide">Ask Taskeen</span>
          <span className="text-[9px] font-sans font-semibold uppercase px-1 py-0.2 rounded bg-black/20 text-[#120F0D]">AI</span>
        </button>
      )}

      {/* Floating Taskeen AI Modal Drawer */}
      {isTaskeenModalOpen && (
        <TaskeenAIAdvisor isModal={true} onClose={() => setIsTaskeenModalOpen(false)} />
      )}

      {/* Running News24 Live Headlines Ticker at the bottom */}
      <News24Ticker />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { currentUser } = useERP();
  const [viewMode, setViewMode] = useState<'website' | 'admin'>('website');

  // If logged in as merchant, always direct them to the merchant showcase and portal
  if (currentUser && currentUser.role === 'merchant') {
    return <ShowcaseApp onOpenAdmin={() => setViewMode('admin')} />;
  }

  if (viewMode === 'website') {
    return <ShowcaseApp onOpenAdmin={() => setViewMode('admin')} />;
  }

  return <MainLayout onGoToWebsite={() => setViewMode('website')} />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <ERPProvider>
        <AppContent />
      </ERPProvider>
    </ErrorBoundary>
  );
}
