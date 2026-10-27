import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
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
import { WebsiteShowcaseView } from './components/WebsiteShowcaseView';
import { MerchantOrdersView } from './components/MerchantOrdersView';
import { BarcodeScannerModuleView } from './components/BarcodeScannerModuleView';
import { POSModuleView } from './components/POSModuleView';
import { ProductionLineModuleView } from './components/ProductionLineModuleView';
import { ShowcaseApp } from './components/showcase/ShowcaseApp';
import { News24Ticker } from './components/News24Ticker';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sparkles, ShieldCheck } from 'lucide-react';

// New Square-Tile Architecture Components
import { ERP_MODULES, ERPModule, ModuleSubcategory } from './components/dashboard/moduleRegistry';
import { SquareTileDashboard } from './components/dashboard/SquareTileDashboard';
import { ModuleSubcategoriesPage } from './components/dashboard/ModuleSubcategoriesPage';
import { CompactTopNav } from './components/dashboard/CompactTopNav';
import { SubcategoryNavigationStrip } from './components/dashboard/SubcategoryNavigationStrip';
import { UniversalInstallModal } from './components/UniversalInstallModal';

interface MainLayoutProps {
  onGoToWebsite?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onGoToWebsite }) => {
  const { currentUser } = useERP();

  // Navigation State: null means home launcher with 18 square tiles
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [currentSubcategoryId, setCurrentSubcategoryId] = useState<string | null>(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isTaskeenModalOpen, setIsTaskeenModalOpen] = useState<boolean>(false);

  // Automatically prompt for sign-in or initial setup if no user is active
  const shouldShowLogin = isLoginModalOpen || !currentUser;

  // Resolve current active module object
  const activeModule: ERPModule | undefined = currentModuleId
    ? ERP_MODULES.find((m) => m.id === currentModuleId)
    : undefined;

  // Resolve active subcategory object
  const activeSubcategory: ModuleSubcategory | null =
    activeModule && currentSubcategoryId
      ? activeModule.subcategories.find((s) => s.id === currentSubcategoryId) || null
      : null;

  // Navigation Handlers
  const handleSelectModule = (moduleId: string) => {
    setCurrentModuleId(moduleId);
    setCurrentSubcategoryId(null); // Open module's subcategories grid by default
  };

  const handleSelectSubcategory = (moduleId: string, subcategoryId: string) => {
    setCurrentModuleId(moduleId);
    setCurrentSubcategoryId(subcategoryId);
  };

  const handleBackToDashboard = () => {
    setCurrentModuleId(null);
    setCurrentSubcategoryId(null);
  };

  const handleBackToSubcategoriesGrid = () => {
    setCurrentSubcategoryId(null);
  };

  // Permission check for active user
  const isModuleAllowed = (moduleId: string): boolean => {
    if (!currentUser) return true;
    if (currentUser.role === 'super_admin') return true;
    const perms = currentUser.permissions;
    if (!perms) return false;

    switch (moduleId) {
      case 'dashboard':
        return true;
      case 'invoices':
      case 'invoice-studio':
        return Boolean(perms.invoices);
      case 'delivery-notes':
        return Boolean(perms.deliveryNotes);
      case 'quotations':
        return Boolean(perms.quotations);
      case 'payments':
        return Boolean(perms.payments);
      case 'customers':
        return Boolean(perms.customers);
      case 'catalog':
        return Boolean(perms.catalog);
      case 'stock':
        return Boolean(perms.stock);
      case 'barcode-scanner':
        return Boolean(perms.barcodeScanner ?? (currentUser.role === 'logistics'));
      case 'merchant-orders':
        return Boolean(perms.merchantOrders ?? true);
      case 'website-showcase':
        return Boolean(perms.websiteShowcase ?? (currentUser.role === 'sales'));
      case 'payroll':
        return Boolean(perms.payroll);
      case 'accounting':
        return Boolean(perms.accounting);
      case 'taskeen':
        return Boolean(perms.taskeenAI ?? true);
      case 'reports':
        return Boolean(perms.reports);
      case 'crm':
        return Boolean(perms.crmLeads);
      case 'users':
        return Boolean(perms.manageUsers);
      case 'merchants':
        return Boolean(perms.merchants ?? perms.manageUsers);
      case 'pos':
        return Boolean(perms.pos ?? true);
      case 'production-line':
        return Boolean(perms.productionLine ?? true);
      case 'database':
        return Boolean(perms.databaseExplorer);
      case 'settings':
        return Boolean(perms.companySettings);
      default:
        return false;
    }
  };

  // Render the real active view based on active module & selected subcategory
  const renderModuleActiveView = () => {
    if (!activeModule) return null;

    if (!isModuleAllowed(activeModule.id)) {
      return (
        <div className="p-8 max-w-lg mx-auto my-12 bg-white rounded-3xl border border-stone-200 text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#2B150A]">Access Restricted</h3>
          <p className="text-xs text-stone-600">
            Your user account does not have permission to access the <strong>{activeModule.title}</strong> module.
            Please consult your Savouré system administrator to update your assigned permissions.
          </p>
          <button
            onClick={handleBackToDashboard}
            className="px-4 py-2 rounded-xl bg-[#CC8468] text-white text-xs font-semibold hover:bg-[#b86643] transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    const targetConfig = activeSubcategory?.targetConfig || {};

    switch (activeModule.id) {
      case 'dashboard':
        return <DashboardOverview onNavigate={(tab) => handleSelectModule(tab)} />;

      case 'invoices':
        return (
          <InvoicesView
            key={currentSubcategoryId || 'all-invoices'}
            onNavigateToDeliveryNotes={() => handleSelectModule('delivery-notes')}
            onNavigateToPayments={() => handleSelectModule('payments')}
            initialStatusFilter={targetConfig.initialStatusFilter || 'ALL'}
            initialOpenCreate={Boolean(targetConfig.initialOpenCreate)}
            initialTab={targetConfig.initialTab}
          />
        );

      case 'invoice-studio':
        return (
          <InvoiceStudioView
            key={currentSubcategoryId || 'invoice-studio'}
            initialTab={targetConfig.initialTab || 'list'}
          />
        );

      case 'delivery-notes':
        return (
          <DeliveryNotesView
            key={currentSubcategoryId || 'delivery-notes'}
            initialStatusFilter={targetConfig.initialStatusFilter || 'ALL'}
          />
        );

      case 'quotations':
        return (
          <QuotationsView
            key={currentSubcategoryId || 'quotations'}
            onNavigateToInvoices={() => handleSelectModule('invoices')}
            initialStatusFilter={targetConfig.initialStatusFilter || 'ALL'}
            initialOpenCreate={Boolean(targetConfig.initialOpenCreate)}
          />
        );

      case 'payments':
        return (
          <PaymentsView
            key={currentSubcategoryId || 'payments'}
            initialMethodFilter={targetConfig.initialMethodFilter || 'ALL'}
            initialOpenCreate={Boolean(targetConfig.initialOpenCreate)}
          />
        );

      case 'customers':
        return (
          <CustomersView
            key={currentSubcategoryId || 'customers'}
            initialOpenCreate={Boolean(targetConfig.initialOpenCreate)}
          />
        );

      case 'catalog':
        return (
          <ProductsView
            key={currentSubcategoryId || 'catalog'}
            initialTab={targetConfig.initialTab || 'catalog'}
            initialCategoryFilter={targetConfig.initialCategoryFilter || 'ALL'}
            initialSearch={targetConfig.initialSearch || ''}
            initialOpenCreate={Boolean(targetConfig.initialOpenCreate)}
          />
        );

      case 'stock':
        return (
          <StockCapturingView
            key={currentSubcategoryId || 'stock'}
            initialTab={targetConfig.initialTab || 'movements'}
            initialStatusFilter={targetConfig.initialStatusFilter || 'ALL'}
            initialOpenCreate={Boolean(targetConfig.initialOpenCreate)}
            initialOpenScanner={Boolean(targetConfig.initialOpenScanner)}
          />
        );

      case 'payroll':
        return (
          <StaffPayrollView
            key={currentSubcategoryId || 'payroll'}
            initialTab={targetConfig.initialTab || 'payouts'}
            initialStatusFilter={targetConfig.initialStatusFilter || 'ALL'}
            initialDepartmentFilter={targetConfig.initialDepartmentFilter || ''}
            initialOpenCreate={Boolean(targetConfig.initialOpenCreate)}
          />
        );

      case 'accounting':
        return (
          <AccountingView
            key={currentSubcategoryId || 'accounting'}
            initialTab={targetConfig.initialTab || 'overview'}
          />
        );

      case 'taskeen':
        return (
          <TaskeenAIAdvisor
            key={currentSubcategoryId || 'taskeen'}
            initialPrompt={targetConfig.initialPrompt}
          />
        );

      case 'reports':
        return (
          <ReportsView
            key={currentSubcategoryId || 'reports'}
            initialPeriod={targetConfig.period || 'weekly'}
          />
        );

      case 'crm':
        return (
          <CRMLeadsView
            key={currentSubcategoryId || 'crm'}
            initialTab={targetConfig.initialTab || 'pipeline'}
            initialOpenCreate={Boolean(targetConfig.initialOpenCreate)}
          />
        );

      case 'users':
        return (
          <UserManagementView
            key={currentSubcategoryId || 'users'}
            initialRoleFilter={targetConfig.initialRoleFilter || 'ALL'}
            initialOpenCreate={Boolean(targetConfig.initialOpenCreate)}
          />
        );

      case 'merchants':
        return (
          <MerchantsManagementView
            key={currentSubcategoryId || 'merchants'}
            initialBranchFilter={targetConfig.initialBranchFilter || 'ALL'}
            initialOpenCreate={Boolean(targetConfig.initialOpenCreate)}
          />
        );

      case 'database':
        return (
          <DatabaseExplorerView
            key={currentSubcategoryId || 'database'}
            initialCollection={targetConfig.initialCollection || 'invoices'}
          />
        );

      case 'settings':
        return <CompanySettingsView key={currentSubcategoryId || 'settings'} />;

      case 'website-showcase':
        return (
          <WebsiteShowcaseView
            key={currentSubcategoryId || 'website-showcase'}
            onGoToWebsite={onGoToWebsite}
          />
        );

      case 'merchant-orders':
        return (
          <MerchantOrdersView
            key={currentSubcategoryId || 'merchant-orders'}
            initialStatusFilter={targetConfig.initialStatusFilter || 'ALL'}
          />
        );

      case 'barcode-scanner':
        return (
          <BarcodeScannerModuleView
            key={currentSubcategoryId || 'barcode-scanner'}
          />
        );

      case 'pos':
        return (
          <POSModuleView
            key={currentSubcategoryId || 'pos'}
            initialSubcategoryId={currentSubcategoryId}
          />
        );

      case 'production-line':
        return (
          <ProductionLineModuleView
            key={currentSubcategoryId || 'production-line'}
            initialSubcategoryId={currentSubcategoryId}
          />
        );

      default:
        return <DashboardOverview onNavigate={(tab) => handleSelectModule(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2B150A] flex flex-col font-sans selection:bg-[#CC8468] selection:text-white">
      {/* Security PIN Screen Lock Overlay */}
      <PinLockModal />

      {/* Cross-Platform Download & Install Modal */}
      <UniversalInstallModal />

      {/* Multi-Device Login / Switch Account Modal */}
      <UserLoginModal
        isOpen={shouldShowLogin}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* SCREEN 1: MAIN SQUARE-TILE DASHBOARD HOMEPAGE */}
      {currentModuleId === null ? (
        <SquareTileDashboard
          onSelectModule={handleSelectModule}
          onSelectSubcategory={handleSelectSubcategory}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onGoToWebsite={onGoToWebsite}
        />
      ) : (
        /* SCREEN 2 & 3: MODULE VIEW WITH COMPACT TOP NAV (NO SIDEBAR) */
        <div className="flex-1 flex flex-col min-h-screen bg-white">
          {activeModule && (
            <CompactTopNav
              currentModule={activeModule}
              currentSubcategory={activeSubcategory}
              onBackToDashboard={handleBackToDashboard}
              onBackToSubcategoriesGrid={handleBackToSubcategoriesGrid}
              onSelectModule={handleSelectModule}
              onSelectSubcategory={handleSelectSubcategory}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onGoToWebsite={onGoToWebsite}
            />
          )}

          {/* Subcategory selector strip (when a subcategory is actively viewed) */}
          {activeModule && currentSubcategoryId !== null && (
            <SubcategoryNavigationStrip
              module={activeModule}
              activeSubcategoryId={currentSubcategoryId}
              onSelectSubcategory={(subId) => setCurrentSubcategoryId(subId)}
              onOpenSubcategoriesGrid={handleBackToSubcategoriesGrid}
            />
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 bg-white">
            <div className="max-w-[1600px] mx-auto">
              {/* If no subcategory is selected, show the module's square tiles */}
              {currentSubcategoryId === null && activeModule ? (
                <ModuleSubcategoriesPage
                  module={activeModule}
                  onSelectSubcategory={(subId) => setCurrentSubcategoryId(subId)}
                  onBackToDashboard={handleBackToDashboard}
                />
              ) : (
                /* Otherwise show the active feature view */
                renderModuleActiveView()
              )}
            </div>
          </main>
        </div>
      )}

      {/* Floating Ask Taskeen AI Launcher (available across all screens) */}
      {currentModuleId !== 'taskeen' && (
        <button
          onClick={() => setIsTaskeenModalOpen(true)}
          className="fixed bottom-12 right-5 z-40 px-3.5 py-2 rounded-full bg-gradient-to-r from-[#CC8468] to-[#E0A282] text-[#1E0F07] font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20 group cursor-pointer"
          title="Ask Taskeen - Executive Bakery & Business Advisor"
        >
          <div className="w-5 h-5 rounded-full bg-[#1E0F07] flex items-center justify-center text-[#E0A282] shrink-0">
            <Sparkles className="w-3 h-3 animate-pulse" />
          </div>
          <span className="font-serif tracking-wide">Ask Taskeen</span>
          <span className="text-[9px] font-sans font-semibold uppercase px-1 py-0.2 rounded bg-black/20 text-[#1E0F07]">AI</span>
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
  const [viewMode, setViewMode] = useState<'website' | 'admin'>(() => {
    try {
      const saved = localStorage.getItem('savoure_view_mode');
      if (saved === 'admin' || saved === 'website') return saved;
    } catch {}
    return 'website';
  });

  const handleSetViewMode = (mode: 'website' | 'admin') => {
    setViewMode(mode);
    try {
      localStorage.setItem('savoure_view_mode', mode);
    } catch {}
  };

  if (viewMode === 'admin') {
    return <MainLayout onGoToWebsite={() => handleSetViewMode('website')} />;
  }

  return <ShowcaseApp onOpenAdmin={() => handleSetViewMode('admin')} />;
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
