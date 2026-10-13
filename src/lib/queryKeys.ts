// Fábrica das chaves de query (docs/PRODUCT.md, Seção 7). Hooks usam esta fábrica, nunca string solta.
// ['public', ...] é persistível; ['private', userId, ...] nunca é persistido (e sai da memória no logout).
import type { PerfumeGender } from '@/constants/labels';
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
    // Um intervalo de dias (calendário do memorial); filha de `overview`, então vestir hoje o atualiza
    range: (userId: string, from: string, to: string) =>
      ['private', userId, 'daily', 'range', from, to] as const,
  },
  // DNA olfativo do Perfil: privado (depende da coleção e do memorial)
  dna: {
    get: (userId: string) => ['private', userId, 'olfactory-dna'] as const,
  },
  // Card SOTD gerado no aparelho (Blob): privado, nunca persistido
  shareCard: {
    image: (userId: string, parts: readonly (string | number | null)[]) =>
      ['private', userId, 'share-card', ...parts] as const,
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
    suggestion: (date: string, families: string[], gender?: PerfumeGender | null) =>
      ['public', 'home', 'suggestion', date, families.join(','), gender ?? 'all'] as const,
    recent: (limit: number) => ['public', 'home', 'recent', limit] as const,
    // Sugestão do armário: depende da coleção do usuário, então é privada (nunca persistida)
    closet: (userId: string, date: string, perfumeId: string) =>
      ['private', userId, 'home', 'closet', date, perfumeId] as const,
  },
} as const;
