import {
  CalendarHeart,
  CloudSun,
  Layers,
  Library,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';

// Conteúdo da Landing: só o que o produto faz (docs/PRODUCT.md, Seção 2). Sem depoimentos,
// números de usuários ou estatísticas.
export interface LandingFeature {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const LANDING_FEATURES: readonly LandingFeature[] = [
  {
    key: 'catalogo',
    icon: SlidersHorizontal,
    title: 'Catálogo com filtros',
    description: 'Filtre por nota, posição da nota, família olfativa, marca e concentração.',
  },
  {
    key: 'piramide',
    icon: Layers,
    title: 'Pirâmide olfativa',
    description: 'Abra o topo, o coração e o fundo de cada perfume e siga uma nota até outros.',
  },
  {
    key: 'colecao',
    icon: Library,
    title: 'Coleção Tenho e Quero',
    description: 'Guarde o que já é seu e o que você deseja, num só lugar.',
  },
  {
    key: 'dia',
    icon: CalendarHeart,
    title: 'Perfume do Dia',
    description: 'Escolha um perfume por dia e reveja o histórico do que você já vestiu.',
  },
  {
    key: 'avaliacoes',
    icon: Star,
    title: 'Fixação e projeção',
    description: 'Avalie de 1 a 5 e veja como a comunidade sente cada fragrância.',
  },
  {
    key: 'clima',
    icon: CloudSun,
    title: 'Sugestão pelo clima',
    description: 'Receba ideias de perfumes de acordo com o tempo do seu dia.',
  },
  {
    key: 'nez',
    icon: Sparkles,
    title: 'Nez, o sommelier de IA',
    description: 'Converse sobre notas e escolhas com o Nez. Disponível para quem tem conta.',
  },
  {
    key: 'pwa',
    icon: Smartphone,
    title: 'Instalável e offline',
    description: 'Instale no celular e consulte o catálogo salvo mesmo sem internet.',
  },
];

export interface LandingStep {
  key: string;
  title: string;
  description: string;
}

export const LANDING_STEPS: readonly LandingStep[] = [
  {
    key: 'explore',
    title: 'Explore pelas notas',
    description: 'Busque no catálogo pelo que você sente: uma nota, uma família, uma marca.',
  },
  {
    key: 'guarde',
    title: 'Monte sua coleção',
    description: 'Marque cada perfume como Tenho ou Quero e acompanhe sua prateleira.',
  },
  {
    key: 'viva',
    title: 'Vista e avalie',
    description: 'Escolha o Perfume do Dia e conte como foi a fixação e a projeção.',
  },
];

export const PYRAMID_LAYERS = [
  { key: 'top', label: 'Topo', hint: 'O primeiro encontro', width: 'w-3/5' },
  { key: 'heart', label: 'Coração', hint: 'O caráter', width: 'w-4/5' },
  { key: 'base', label: 'Fundo', hint: 'O que fica na pele', width: 'w-full' },
] as const;
