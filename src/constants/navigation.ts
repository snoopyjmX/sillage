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

// Âncoras das seções da Landing (modo "landing" da pílula de navegação)
export interface LandingItem {
  key: string;
  label: string;
  hash: string;
}

export const LANDING_ITEMS: readonly LandingItem[] = [
  { key: 'inicio', label: 'Início', hash: '#inicio' },
  { key: 'como-funciona', label: 'Como funciona', hash: '#como-funciona' },
  { key: 'recursos', label: 'Recursos', hash: '#recursos' },
];
