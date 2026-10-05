import { CalendarHeart, LayoutGrid, Library, UserRound, type LucideIcon } from 'lucide-react';

// Catálogo, Coleção e Perfil (privadas) existem. Perfume do Dia aparece desabilitado ("em breve").
export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  to?: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'catalog', label: 'Catálogo', icon: LayoutGrid, to: '/catalog' },
  { key: 'collection', label: 'Coleção', icon: Library, to: '/collection' },
  { key: 'daily', label: 'Perfume do Dia', icon: CalendarHeart },
  { key: 'profile', label: 'Perfil', icon: UserRound, to: '/profile' },
];
