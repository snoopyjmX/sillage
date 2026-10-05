// Fábrica das chaves de query (docs/PRODUCT.md, Seção 7). Hooks usam esta fábrica, nunca string solta.
// ['public', ...] é persistível; ['private', userId, ...] nunca é persistido (e sai da memória no logout).
import type { CatalogFilters } from '@/schemas/catalogSearch';

export const queryKeys = {
  perfumes: {
    all: ['public', 'perfumes'] as const,
    list: (filters: CatalogFilters) => ['public', 'perfumes', 'list', filters] as const,
    detail: (slug: string) => ['public', 'perfumes', 'detail', slug] as const,
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
  },
} as const;
