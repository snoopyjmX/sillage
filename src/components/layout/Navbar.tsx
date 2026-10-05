import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NAV_ITEMS } from '@/constants/navigation';
import { NavLinkItem } from './NavLinkItem';

// Barra superior de vidro (docs/PRODUCT.md, Seção 9). No celular só marca e tema; a navegação
// fica na BottomNav. A área segura do topo entra como padding.
export function Navbar() {
  return (
    <header className="glass-bar sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          to="/catalog"
          className="font-heading rounded-lg text-2xl font-semibold text-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Sillage
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLinkItem key={item.key} item={item} variant="top" />
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
