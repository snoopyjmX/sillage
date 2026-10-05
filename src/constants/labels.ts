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

export type ConcentrationType = 'parfum' | 'extrait' | 'edp' | 'edt' | 'edc' | 'other';

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
  other: 'Outra',
};

export const FAMILIES = Object.keys(FAMILY_LABELS) as OlfactiveFamily[];
export const CONCENTRATIONS = Object.keys(CONCENTRATION_LABELS) as ConcentrationType[];
