// A URL é entrada do usuário (docs/PRODUCT.md, Seção 8): tudo passa por Zod e valor inválido
// cai no padrão, sem quebrar a página. Estado do catálogo = query string, por isso é compartilhável.
import { z } from 'zod';
import {
  CONCENTRATIONS,
  FAMILIES,
  GENDERS,
  POSITIONS,
  type CatalogSortValue,
  type ConcentrationType,
  type NotePosition,
  type OlfactiveFamily,
  type PerfumeGender,
} from '@/constants/labels';

export const PAGE_SIZE = 24;
export const MAX_PAGE = 10_000;
export const MAX_QUERY_LENGTH = 100;
export const MAX_LIST_ITEMS = 20;
export const MIN_YEAR = 1700;
// Mesmo teto do CHECK de perfumes.release_year (ano atual + 1)
export const maxYear = (): number => new Date().getFullYear() + 1;

export const SORT_VALUES = [
  'relevance',
  'newest',
  'top_rated',
  'name_asc',
  'name_desc',
] as const satisfies readonly CatalogSortValue[];

export interface CatalogFilters {
  q: string;
  brands: string[];
  notes: string[];
  pos: NotePosition | null;
  families: OlfactiveFamily[];
  concentrations: ConcentrationType[];
  genders: PerfumeGender[];
  yearMin: number | null;
  yearMax: number | null;
  sort: CatalogSortValue;
  page: number;
}

// Padrão de ordenação (escolha de design): relevância quando há texto, mais recentes quando não há.
export const defaultSort = (q: string): CatalogSortValue => (q === '' ? 'newest' : 'relevance');

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugSchema = z.string().max(80).regex(SLUG);
const querySchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH));
const positionSchema = z.enum(POSITIONS as [NotePosition, ...NotePosition[]]);
const familySchema = z.enum(FAMILIES as [OlfactiveFamily, ...OlfactiveFamily[]]);
const concentrationSchema = z.enum(CONCENTRATIONS as [ConcentrationType, ...ConcentrationType[]]);
const genderSchema = z.enum(GENDERS as [PerfumeGender, ...PerfumeGender[]]);
const sortSchema = z.enum(SORT_VALUES);
const pageSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(MAX_PAGE));
const yearSchema = z
  .string()
  .regex(/^\d{4}$/)
  .transform(Number)
  .pipe(z.number().int().min(MIN_YEAR));

// Lê um parâmetro; ausente ou inválido vira o valor padrão.
const read = <T>(schema: z.ZodType<T>, raw: string | null, fallback: T): T => {
  if (raw === null) return fallback;
  const result = schema.safeParse(raw);
  return result.success ? result.data : fallback;
};

// Lista separada por vírgula: itens inválidos são descartados, repetidos somem, tamanho limitado.
const readList = <T>(schema: z.ZodType<T>, raw: string | null): T[] => {
  const items: T[] = [];
  for (const part of (raw ?? '').split(',')) {
    const result = schema.safeParse(part.trim());
    if (result.success && !items.includes(result.data)) items.push(result.data);
    if (items.length >= MAX_LIST_ITEMS) break;
  }
  return items;
};

// Ano digitado num campo: só 4 dígitos dentro da faixa do banco; senão nulo.
export const parseYearInput = (text: string): number | null => {
  const result = yearSchema.safeParse(text.trim());
  return result.success && result.data <= maxYear() ? result.data : null;
};

export const parseCatalogSearchParams = (params: URLSearchParams): CatalogFilters => {
  const q = read(querySchema, params.get('q'), '');
  const notes = readList(slugSchema, params.get('notes'));
  const requestedSort = read<CatalogSortValue | null>(sortSchema, params.get('sort'), null);
  // "relevance" não faz sentido sem texto (o banco cairia para name_asc): usa o padrão
  const sort =
    requestedSort !== null && (requestedSort !== 'relevance' || q !== '')
      ? requestedSort
      : defaultSort(q);
  const upperYear = maxYear();
  const year = (key: string): number | null => {
    const value = read<number | null>(yearSchema, params.get(key), null);
    return value !== null && value <= upperYear ? value : null;
  };

  return {
    q,
    brands: readList(slugSchema, params.get('brands')),
    notes,
    // A posição só vale para notas (o banco a ignora sem notas)
    pos:
      notes.length > 0 ? read<NotePosition | null>(positionSchema, params.get('pos'), null) : null,
    families: readList(familySchema, params.get('families')),
    concentrations: readList(concentrationSchema, params.get('conc')),
    genders: readList(genderSchema, params.get('gender')),
    yearMin: year('ymin'),
    yearMax: year('ymax'),
    sort,
    page: read(pageSchema, params.get('page'), 1),
  };
};

// Só grava na URL o que difere do padrão; assim o link fica curto e estável.
export const toCatalogSearchParams = (filters: CatalogFilters): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.q !== '') params.set('q', filters.q);
  if (filters.brands.length > 0) params.set('brands', filters.brands.join(','));
  if (filters.notes.length > 0) params.set('notes', filters.notes.join(','));
  if (filters.notes.length > 0 && filters.pos !== null) params.set('pos', filters.pos);
  if (filters.families.length > 0) params.set('families', filters.families.join(','));
  if (filters.concentrations.length > 0) params.set('conc', filters.concentrations.join(','));
  if (filters.genders.length > 0) params.set('gender', filters.genders.join(','));
  if (filters.yearMin !== null) params.set('ymin', String(filters.yearMin));
  if (filters.yearMax !== null) params.set('ymax', String(filters.yearMax));
  if (filters.sort !== defaultSort(filters.q)) params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
};

// Quantos grupos de filtro (fora busca, ordenação e página) estão ativos
export const countActiveFilters = (filters: CatalogFilters): number =>
  [
    filters.brands.length > 0,
    filters.notes.length > 0,
    filters.families.length > 0,
    filters.concentrations.length > 0,
    filters.genders.length > 0,
    filters.yearMin !== null || filters.yearMax !== null,
  ].filter(Boolean).length;
