import React, { useState } from 'react';
import { ArrowRight, Search, X, Menu } from 'lucide-react';

interface ShowcaseHeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenMerchantLogin: () => void;
  onOpenEnquiryModal: () => void;
  onOpenAdmin?: () => void;
  isMerchantLoggedIn?: boolean;
  onOpenMerchantPortal?: () => void;
}

export const ShowcaseHeader: React.FC<ShowcaseHeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenMerchantLogin,
  onOpenEnquiryModal,
  isMerchantLoggedIn,
  onOpenMerchantPortal,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'products', label: 'Our products' },
    { id: 'about', label: 'About us' },
    { id: 'wholesale', label: 'Wholesale' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-[#f5eee5]/95 backdrop-blur-md border-b border-[#bd896e]/20 transition-all">
      {/* MAIN SITE HEADER */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 flex h-20 items-center justify-between gap-6">
        {/* Brand Logo & Wordmark */}
        <button
          onClick={() => handleNavClick('home')}
          aria-label="Savouré home"
          className="text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex flex-col">
            <span className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#3d2117] group-hover:text-[#b86643] transition-colors leading-none">
              Savouré
            </span>
            <span className="text-[7px] uppercase tracking-[0.3em] text-[#a86644] font-semibold mt-1 leading-none">
              — A Taste of Tradition —
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-9 text-[11px] font-bold uppercase tracking-[0.18em] text-[#66483b]">
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`py-2 relative transition-colors cursor-pointer ${
                  isActive ? 'text-[#3d2117]' : 'hover:text-[#3d2117]'
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-[#b86643]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions Zone: Search, Enquire Now & Merchant Login (Admin moved to Footer as requested) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="w-9 h-9 rounded-full hover:bg-[#ead8c6] text-[#75412e] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Merchant Portal */}
          <button
            type="button"
            onClick={isMerchantLoggedIn && onOpenMerchantPortal ? onOpenMerchantPortal : onOpenMerchantLogin}
            className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-2.5 rounded-full border transition-all cursor-pointer shadow-2xs ${
              isMerchantLoggedIn
                ? 'bg-[#2b150a] hover:bg-[#1e0f07] text-[#fff8f0] border-[#2b150a]'
                : 'bg-[#4a291d] hover:bg-[#3d2117] text-[#fff8f0] border-[#3d2117]'
            }`}
          >
            <span>{isMerchantLoggedIn ? 'My Merchant Desk' : 'Merchant Portal'}</span>
          </button>

          {/* Primary Action Button: ENQUIRE NOW */}
          <button
            type="button"
            onClick={onOpenEnquiryModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#2b150a] bg-[#3d2117] hover:bg-[#2b150a] text-[#fff8f0] text-[10px] font-bold uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5 cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <span>Enquire now</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-[#75412e] hover:text-[#3d2117] cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Dropdown Search Panel */}
      {isSearchOpen && (
        <div className="bg-white border-b border-[#bd896e]/30 px-6 sm:px-12 py-4">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <Search className="w-4 h-4 text-[#8d5037]" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roti, samosa pastry, tortilla wraps, spring roll sheets..."
              className="w-full text-xs text-[#3d2117] outline-none placeholder:text-stone-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onNavigate('products');
                  setIsSearchOpen(false);
                }
              }}
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-stone-400 hover:text-stone-700 cursor-pointer text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Mobile Nav Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#f5eee5] border-b border-[#bd896e]/30 px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-3 text-xs font-bold uppercase tracking-[0.18em] text-[#66483b]">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`text-left py-2 ${currentPage === link.id ? 'text-[#b86643]' : ''}`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => {
                if (isMerchantLoggedIn && onOpenMerchantPortal) {
                  onOpenMerchantPortal();
                } else {
                  onOpenMerchantLogin();
                }
                setIsMobileMenuOpen(false);
              }}
              className="text-left py-2 text-[#75412e]"
            >
              {isMerchantLoggedIn ? 'My Merchant Desk' : 'Merchant Portal'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
