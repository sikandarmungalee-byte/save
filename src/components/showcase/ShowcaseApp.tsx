import React, { useState } from 'react';
import { ShowcaseHeader } from './ShowcaseHeader';
import { ShowcaseFooter } from './ShowcaseFooter';
import { ShowcaseHomePage } from './ShowcaseHomePage';
import { ShowcaseProductsPage } from './ShowcaseProductsPage';
import { ShowcaseWholesalePage } from './ShowcaseWholesalePage';
import { ShowcaseAboutPage } from './ShowcaseAboutPage';
import { ShowcaseShopPage } from './ShowcaseShopPage';
import { ShowcaseContactPage } from './ShowcaseContactPage';
import { ShowcaseMerchantLoginPage } from './ShowcaseMerchantLoginPage';
import { FloatingWhatsAppButton } from './FloatingWhatsAppButton';
import { MerchantPortal } from '../merchant/MerchantPortal';
import { useERP } from '../../context/ERPContext';

interface ShowcaseAppProps {
  onOpenAdmin: () => void;
}

export const ShowcaseApp: React.FC<ShowcaseAppProps> = ({ onOpenAdmin }) => {
  const { currentUser } = useERP();
  const [currentTab, setCurrentTab] = useState<string>('home');

  // If the currently logged in user is a merchant, show the Merchant Portal directly
  if (currentUser && currentUser.role === 'merchant') {
    return (
      <MerchantPortal
        onBackToWebsite={() => setCurrentTab('home')}
      />
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <ShowcaseHomePage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'products':
        return <ShowcaseProductsPage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'wholesale':
        return <ShowcaseWholesalePage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'about':
        return <ShowcaseAboutPage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'shop':
        return <ShowcaseShopPage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'contact':
        return <ShowcaseContactPage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'merchant-login':
        return (
          <ShowcaseMerchantLoginPage
            onNavigate={(tab) => setCurrentTab(tab)}
            onLoginSuccess={() => {
              // Upon successful login, state updates and if user is merchant it transitions automatically
            }}
          />
        );
      default:
        return <ShowcaseHomePage onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#261C14] flex flex-col font-sans selection:bg-[#9E582E] selection:text-white">
      {/* Header with Nav, WhatsApp, Contact & Merchant Login on Top */}
      <ShowcaseHeader
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenMerchantLogin={() => setCurrentTab('merchant-login')}
      />

      {/* Main Viewport */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Footer with Explore, Contact, and Administration Entrypoint */}
      <ShowcaseFooter
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenAdmin={onOpenAdmin}
      />

      {/* Floating WhatsApp Action Widget for user's number */}
      <FloatingWhatsAppButton />
    </div>
  );
};
