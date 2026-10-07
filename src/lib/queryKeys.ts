// Fábrica das chaves de query (docs/PRODUCT.md, Seção 7). Hooks usam esta fábrica, nunca string solta.
// ['public', ...] é persistível; ['private', userId, ...] nunca é persistido (e sai da memória no logout).
import type { CatalogFilters } from '@/schemas/catalogSearch';

export const queryKeys = {
  perfumes: {
    all: ['public', 'perfumes'] as const,
    list: (filters: CatalogFilters) => ['public', 'perfumes', 'list', filters] as const,
    detail: (slug: string) => ['public', 'perfumes', 'detail', slug] as const,
    similar: (perfumeId: string) => ['public', 'perfumes', perfumeId, 'similar'] as const,
  },
  brands: {
    list: () => ['public', 'brands', 'list'] as const,
  },
  notes: {
    list: () => ['public', 'notes', 'list'] as const,
  },
  collection: {
    list: (userId: string) => ['private', userId, 'collection'] as const,
  },
  reviews: {
    // Lista e resumo públicos do perfume (RN08)
    list: (perfumeId: string) => ['public', 'perfumes', perfumeId, 'reviews'] as const,
    mine: (userId: string, perfumeId: string) => ['private', userId, 'reviews', perfumeId] as const,
  },
  daily: {
    overview: (userId: string) => ['private', userId, 'daily'] as const,
    // Dias no memorial (filha de `overview`: invalidar o resumo atualiza a contagem)
    count: (userId: string) => ['private', userId, 'daily', 'count'] as const,
  },
  profile: {
    all: (userId: string) => ['private', userId, 'profile'] as const,
    detail: (userId: string) => ['private', userId, 'profile', 'detail'] as const,
    timezone: (userId: string) => ['private', userId, 'profile', 'timezone'] as const,
  },
  // Clima e localização: sempre privados (nunca persistidos). Coordenadas já arredondadas.
  weather: {
    city: (userId: string, timezone: string) =>
      ['private', userId, 'weather', 'city', timezone] as const,
    current: (userId: string, latitude: number, longitude: number) =>
      ['private', userId, 'weather', 'current', latitude, longitude] as const,
  },
  // Home: catálogo público (persistível)
  home: {
    suggestion: (date: string, families: string[]) =>
      ['public', 'home', 'suggestion', date, families.join(',')] as const,
    recent: (limit: number) => ['public', 'home', 'recent', limit] as const,
  },
} as const;
