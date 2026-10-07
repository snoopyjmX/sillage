// Rótulos pt-BR dos enums do banco (docs/PRODUCT.md, Seção 5).
export type OlfactiveFamily =
  | 'citrus'
  | 'floral'
  | 'woody'
  | 'green'
  | 'aquatic'
  | 'oriental'
  | 'spicy'
  | 'fruity'
  | 'aromatic'
  | 'musky';

export type ConcentrationType = 'parfum' | 'extrait' | 'edp' | 'edt' | 'edc';

export const FAMILY_LABELS: Record<OlfactiveFamily, string> = {
  citrus: 'Cítrico',
  floral: 'Floral',
  woody: 'Amadeirado',
  green: 'Verde',
  aquatic: 'Aquático',
  oriental: 'Oriental',
  spicy: 'Especiado',
  fruity: 'Frutado',
  aromatic: 'Aromático',
  musky: 'Almiscarado',
};

export const CONCENTRATION_LABELS: Record<ConcentrationType, string> = {
  parfum: 'Parfum',
  extrait: 'Extrait',
  edp: 'EDP',
  edt: 'EDT',
  edc: 'EDC',
};

export const FAMILIES = Object.keys(FAMILY_LABELS) as OlfactiveFamily[];
export const CONCENTRATIONS = Object.keys(CONCENTRATION_LABELS) as ConcentrationType[];

export type PerfumeGender = 'masculine' | 'feminine' | 'unisex';
export type NotePosition = 'top' | 'heart' | 'base';

export const GENDER_LABELS: Record<PerfumeGender, string> = {
  masculine: 'Masculino',
  feminine: 'Feminino',
  unisex: 'Unissex',
};

export const POSITION_LABELS: Record<NotePosition, string> = {
  top: 'Topo',
  heart: 'Coração',
  base: 'Fundo',
};

export const GENDERS = Object.keys(GENDER_LABELS) as PerfumeGender[];
export const POSITIONS = Object.keys(POSITION_LABELS) as NotePosition[];

export type CatalogSortValue = 'relevance' | 'newest' | 'top_rated' | 'name_asc' | 'name_desc';

export const SORT_LABELS: Record<CatalogSortValue, string> = {
  relevance: 'Relevância',
  newest: 'Mais recentes',
  top_rated: 'Mais bem avaliados',
  name_asc: 'Nome (A a Z)',
  name_desc: 'Nome (Z a A)',
};
