// Fábrica das chaves de query (docs/PRODUCT.md, Seção 7). Hooks usam esta fábrica, nunca string solta.
// ['public', ...] é persistível; ['private', userId, ...] nunca é persistido (ainda não há chaves privadas).
import type { CatalogFilters } from '@/schemas/catalogSearch';

export const queryKeys = {
  perfumes: {
    all: ['public', 'perfumes'] as const,
    list: (filters: CatalogFilters) => ['public', 'perfumes', 'list', filters] as const,
  },
  brands: {
    list: () => ['public', 'brands', 'list'] as const,
  },
  notes: {
    list: () => ['public', 'notes', 'list'] as const,
  },
} as const;
