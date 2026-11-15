import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import type { Language } from '../types';

interface HeaderProps {
  lang: Language;
  cartCount: number;
  activeView: 'store' | 'admin';
  onNavigateSection: (sectionId: string, categoryFilter?: 'all' | 'butter' | 'balm') => void;
  onOpenAdmin: () => void;
  onOpenCart: () => void;
}

export function Header({
  lang,
  cartCount,
  activeView,
  onNavigateSection,
  onOpenAdmin,
  onOpenCart,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const labels =
    lang === 'kk'
      ? {
          catalog: 'Каталог',
          butter: 'Сары май',
          balm: 'Нано бальзам',
          delivery: 'Жеткізу',
          admin: 'Админ',
          cart: 'Себет',
        }
      : {
          catalog: 'Каталог',
          butter: 'Сары май',
          balm: 'Нано-бальзамы',
          delivery: 'Доставка',
          admin: 'Админ',
          cart: 'Корзина',
        };

  const handleLinkClick = (sectionId: string, filter?: 'all' | 'butter' | 'balm') => {
    setMobileMenuOpen(false);
    onNavigateSection(sectionId, filter);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E4E1DA]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('top', 'all');
          }}
          className="font-display text-2xl font-semibold tracking-tight text-[#18181B] whitespace-nowrap shrink-0"
        >
          Қайнар
        </a>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#52524C]">
          <button
            type="button"
            onClick={() => handleLinkClick('catalog', 'all')}
            className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {labels.catalog}
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('catalog', 'butter')}
            className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {labels.butter}
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('catalog', 'balm')}
            className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {labels.balm}
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('delivery')}
            className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {labels.delivery}
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAdmin();
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'admin'
                ? 'text-[#1B4332] font-semibold underline underline-offset-4'
                : 'hover:text-[#18181B] hover:underline underline-offset-4'
            }`}
          >
            {labels.admin}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>
              {labels.cart} (<span className="tabular-nums">{cartCount}</span>)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Menu"
            className="md:hidden p-2 text-[#18181B] hover:bg-[#EFECE4] rounded-lg transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E4E1DA] bg-[#FAF9F6] px-4 py-3 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => handleLinkClick('catalog', 'all')}
            className="text-left py-2.5 px-2 text-sm font-medium text-[#18181B] hover:bg-[#EFECE4] rounded-lg"
          >
            {labels.catalog}
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('catalog', 'butter')}
            className="text-left py-2.5 px-2 text-sm font-medium text-[#18181B] hover:bg-[#EFECE4] rounded-lg"
          >
            {labels.butter}
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('catalog', 'balm')}
            className="text-left py-2.5 px-2 text-sm font-medium text-[#18181B] hover:bg-[#EFECE4] rounded-lg"
          >
            {labels.balm}
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('delivery')}
            className="text-left py-2.5 px-2 text-sm font-medium text-[#18181B] hover:bg-[#EFECE4] rounded-lg"
          >
            {labels.delivery}
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAdmin();
            }}
            className="text-left py-2.5 px-2 text-sm font-semibold text-[#1B4332] hover:bg-[#EFECE4] rounded-lg"
          >
            {labels.admin}
          </button>
        </div>
      )}
    </header>
  );
}
