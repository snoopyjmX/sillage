import { House, LayoutGrid, Library, UserRound, type LucideIcon } from 'lucide-react';

// Início (Perfume do Dia e histórico), Catálogo, Coleção e Perfil (privadas).
export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  to: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'home', label: 'Início', icon: House, to: '/' },
  { key: 'catalog', label: 'Catálogo', icon: LayoutGrid, to: '/catalog' },
  { key: 'collection', label: 'Coleção', icon: Library, to: '/collection' },
  { key: 'profile', label: 'Perfil', icon: UserRound, to: '/profile' },
];
