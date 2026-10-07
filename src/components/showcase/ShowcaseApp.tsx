import React, { useState } from 'react';
import { ShowcaseHeader } from './ShowcaseHeader';
import { ShowcaseFooter } from './ShowcaseFooter';
import { ShowcaseHomePage } from './ShowcaseHomePage';
import { ShowcaseMerchantLoginPage } from './ShowcaseMerchantLoginPage';
import { FloatingWhatsAppButton } from './FloatingWhatsAppButton';
import { MerchantPortal } from '../merchant/MerchantPortal';
import { useERP } from '../../context/ERPContext';

interface ShowcaseAppProps {
  onOpenAdmin: () => void;
}

export const ShowcaseApp: React.FC<ShowcaseAppProps> = ({ onOpenAdmin }) => {
  const { currentUser } = useERP();
  const [currentTab, setCurrentTab] = useState<'home' | 'merchant-login'>('home');

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
      case 'merchant-login':
        return (
          <ShowcaseMerchantLoginPage
            onNavigate={(tab) => setCurrentTab(tab === 'merchant-login' ? 'merchant-login' : 'home')}
            onLoginSuccess={() => {
              // Upon successful login, state updates and if user is merchant it transitions automatically
            }}
          />
        );
      case 'home':
      default:
        return <ShowcaseHomePage onNavigate={(tab) => setCurrentTab(tab === 'merchant-login' ? 'merchant-login' : 'home')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#261C14] flex flex-col font-sans selection:bg-[#9E582E] selection:text-white">
      {/* Header with Savouré Wordmark, WhatsApp & Merchant Login */}
      <ShowcaseHeader
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab === 'merchant-login' ? 'merchant-login' : 'home')}
        onOpenMerchantLogin={() => setCurrentTab('merchant-login')}
      />

      {/* Main Viewport: Fancy Coming Soon Page + Contact Card, or Merchant Login */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Footer with Brand Info, Contact channels, and discrete Administration Entrypoint */}
      <ShowcaseFooter
        onNavigate={(tab) => setCurrentTab(tab === 'merchant-login' ? 'merchant-login' : 'home')}
        onOpenAdmin={onOpenAdmin}
      />

      {/* Floating WhatsApp Action Widget */}
      <FloatingWhatsAppButton />
    </div>
  );
};
