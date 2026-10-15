import React, { useState } from 'react';
import { ShowcaseHeader } from './ShowcaseHeader';
import { ShowcaseFooter } from './ShowcaseFooter';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { AboutPage } from './pages/AboutPage';
import { WholesalePage } from './pages/WholesalePage';
import { ContactPage } from './pages/ContactPage';
import { ShowcaseMerchantLoginPage } from './ShowcaseMerchantLoginPage';
import { FloatingWhatsAppButton } from './FloatingWhatsAppButton';
import { WhatsAppEnquiryModal } from './WhatsAppEnquiryModal';
import { MerchantPortal } from '../merchant/MerchantPortal';
import { useERP } from '../../context/ERPContext';

interface ShowcaseAppProps {
  onOpenAdmin: () => void;
}

export const ShowcaseApp: React.FC<ShowcaseAppProps> = ({ onOpenAdmin }) => {
  const { currentUser } = useERP();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [selectedEnquiryProduct, setSelectedEnquiryProduct] = useState<string | null>(null);

  // If the currently logged in user is a merchant, show the Merchant Portal directly
  if (currentUser && currentUser.role === 'merchant') {
    return (
      <MerchantPortal
        onBackToWebsite={() => setCurrentPage('home')}
      />
    );
  }

  const handleOpenEnquiryModal = (productId?: string) => {
    setSelectedEnquiryProduct(productId || null);
    setIsEnquiryModalOpen(true);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'merchant-login':
        return (
          <ShowcaseMerchantLoginPage
            onNavigate={handleNavigate}
            onLoginSuccess={(loggedInUser) => {
              if (loggedInUser && loggedInUser.role !== 'merchant') {
                onOpenAdmin();
              }
            }}
          />
        );
      case 'products':
        return (
          <ProductsPage
            onNavigate={handleNavigate}
            onOpenEnquiryModal={handleOpenEnquiryModal}
          />
        );
      case 'about':
        return (
          <AboutPage
            onNavigate={handleNavigate}
          />
        );
      case 'wholesale':
        return (
          <WholesalePage
            onNavigate={handleNavigate}
            onOpenEnquiryModal={handleOpenEnquiryModal}
          />
        );
      case 'contact':
        return (
          <ContactPage
            onNavigate={handleNavigate}
          />
        );
      case 'home':
      default:
        return (
          <HomePage
            onNavigate={handleNavigate}
            onOpenEnquiryModal={handleOpenEnquiryModal}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f5eee5] text-[#3d2117] flex flex-col font-sans selection:bg-[#b86643] selection:text-white">
      {/* Header with Savouré Wordmark, Page Tabs & Enquire Now CTA (Admin moved to Footer) */}
      <ShowcaseHeader
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenMerchantLogin={() => handleNavigate('merchant-login')}
        onOpenEnquiryModal={() => handleOpenEnquiryModal()}
      />

      {/* Main Viewport: Home, Products, About, Wholesale, Contact, or Merchant Login */}
      <main className="flex-1">
        {renderPage()}
      </main>

      {/* Footer with Brand Info, Navigation, and discrete Admin Entrypoint */}
      <ShowcaseFooter
        onNavigate={handleNavigate}
        onOpenEnquiryModal={() => handleOpenEnquiryModal()}
        onOpenAdmin={onOpenAdmin}
      />

      {/* Floating WhatsApp Action Widget */}
      <FloatingWhatsAppButton />

      {/* Interactive WhatsApp / CRM Enquiry Modal */}
      <WhatsAppEnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        selectedSpecialtyId={selectedEnquiryProduct}
      />
    </div>
  );
};
