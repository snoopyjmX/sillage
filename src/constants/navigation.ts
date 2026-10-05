import { CalendarHeart, LayoutGrid, Library, UserRound, type LucideIcon } from 'lucide-react';

// Só o Catálogo existe nesta fase. Os demais aparecem desabilitados ("em breve"), sem rota.
export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  to?: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'catalog', label: 'Catálogo', icon: LayoutGrid, to: '/catalog' },
  { key: 'collection', label: 'Coleção', icon: Library },
  { key: 'daily', label: 'Perfume do Dia', icon: CalendarHeart },
  { key: 'profile', label: 'Perfil', icon: UserRound },
];
