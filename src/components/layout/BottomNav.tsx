import { NAV_ITEMS } from '@/constants/navigation';
import { NavLinkItem } from './NavLinkItem';

// Navegação inferior de vidro, só no celular. Itens de 56 px de altura (alvo de toque ≥ 44 px)
// e padding da área segura (barra de gestos do iOS/Android).
export function BottomNav() {
  return (
    <nav
      aria-label="Principal"
      className="glass-bar fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 pt-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.key} className="flex">
            <NavLinkItem item={item} variant="bottom" />
          </li>
        ))}
      </ul>
    </nav>
  );
}
