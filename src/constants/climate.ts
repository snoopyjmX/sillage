// Heurísticas editoriais do Sillage (docs/PRODUCT.md, RN10): não são dados de perfumaria, são a
// curadoria da casa. Mudou um número aqui, mude a RN10 no mesmo PR.
import type { OlfactiveFamily } from './labels';

export interface TempRange {
  min: number;
  max: number;
}

// Faixa de temperatura ideal por família olfativa, em °C
export const FAMILY_TEMP_RANGES: Record<OlfactiveFamily, TempRange> = {
  citrus: { min: 22, max: 35 },
  aquatic: { min: 22, max: 35 },
  fruity: { min: 20, max: 32 },
  green: { min: 18, max: 30 },
  aromatic: { min: 15, max: 28 },
  floral: { min: 15, max: 28 },
  musky: { min: 10, max: 25 },
  woody: { min: 5, max: 22 },
  spicy: { min: 5, max: 20 },
  oriental: { min: 0, max: 18 },
};

export type TempBand = 'cold' | 'mild' | 'hot';

// Frio abaixo de 15 °C; ameno de 15 a menos de 25 °C; quente a partir de 25 °C
export const COLD_BELOW = 15;
export const HOT_FROM = 25;

export const BAND_PHRASES: Record<TempBand, string> = {
  cold: 'Projeção ideal para dias frios',
  mild: 'Projeção ideal para dias amenos',
  hot: 'Projeção ideal para dias quentes',
};

// "Sillage ótima": até 3 famílias em destaque; sem nenhuma na faixa, as 2 mais próximas
export const HIGHLIGHT_MAX = 3;
export const HIGHLIGHT_FALLBACK = 2;

// Adequação ao clima: 100% dentro da faixa, perde 10 pontos por °C fora dela
export const FIT_PENALTY_PER_DEGREE = 10;

// Rótulo do Rastro pela média de projeção (1 a 5)
export const PROJECTION_INTIMATE_BELOW = 2.5;
export const PROJECTION_STRONG_FROM = 3.5;
export const PROJECTION_LABELS = {
  intimate: 'Íntimo',
  moderate: 'Moderado',
  strong: 'Forte',
} as const;
export const NO_REVIEWS_LABEL = 'Sem avaliações';
export const NO_CLIMATE_LABEL = 'Clima indisponível';

// Candidatos à sugestão do dia: ordenados por nome, no máximo o teto da RPC search_perfumes
export const SUGGESTION_CANDIDATE_LIMIT = 100;
export const DISCOVERY_LIMIT = 6;
