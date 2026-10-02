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
import { ErrorBoundary } from './components/ErrorBoundary';
import { Menu } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser } = useERP();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

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
      case 'crm':
        return <CRMLeadsView />;
      case 'users':
        return <UserManagementView />;
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
            />
          </div>
        </div>

        {/* Scrollable Workspace Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#120F0D]">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ERPProvider>
        <MainLayout />
      </ERPProvider>
    </ErrorBoundary>
  );
}
