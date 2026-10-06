// Regras puras do clima olfativo (RN10). Os números vêm de constants/climate.ts.
import {
  BAND_PHRASES,
  COLD_BELOW,
  FAMILY_TEMP_RANGES,
  FIT_PENALTY_PER_DEGREE,
  HIGHLIGHT_FALLBACK,
  HIGHLIGHT_MAX,
  HOT_FROM,
  NO_REVIEWS_LABEL,
  PROJECTION_INTIMATE_BELOW,
  PROJECTION_LABELS,
  PROJECTION_STRONG_FROM,
  type TempBand,
  type TempRange,
} from '@/constants/climate';
import { FAMILIES, type OlfactiveFamily } from '@/constants/labels';

export const temperatureBand = (celsius: number): TempBand =>
  celsius < COLD_BELOW ? 'cold' : celsius < HOT_FROM ? 'mild' : 'hot';

export const bandPhrase = (celsius: number): string => BAND_PHRASES[temperatureBand(celsius)];

const center = ({ min, max }: TempRange): number => (min + max) / 2;

// Famílias em destaque para a temperatura: as que contêm o valor, das mais centradas às menos;
// sem nenhuma, as mais próximas. Empate pela ordem do enum.
export const highlightFamilies = (celsius: number): OlfactiveFamily[] => {
  const byDistance = (a: OlfactiveFamily, b: OlfactiveFamily): number =>
    Math.abs(celsius - center(FAMILY_TEMP_RANGES[a])) -
      Math.abs(celsius - center(FAMILY_TEMP_RANGES[b])) ||
    FAMILIES.indexOf(a) - FAMILIES.indexOf(b);

  const inside = FAMILIES.filter((family) => {
    const { min, max } = FAMILY_TEMP_RANGES[family];
    return celsius >= min && celsius <= max;
  }).sort(byDistance);
  if (inside.length > 0) return inside.slice(0, HIGHLIGHT_MAX);
  return [...FAMILIES].sort(byDistance).slice(0, HIGHLIGHT_FALLBACK);
};

// Faixa do perfume: média ponderada (pelo nº de notas de cada família) dos mínimos e dos máximos.
// Recebe a família de cada nota (com repetição). Sem notas, não há faixa.
export const perfumeTempRange = (noteFamilies: readonly OlfactiveFamily[]): TempRange | null => {
  if (noteFamilies.length === 0) return null;
  const total = noteFamilies.length;
  const sum = (key: keyof TempRange): number =>
    noteFamilies.reduce((acc, family) => acc + FAMILY_TEMP_RANGES[family][key], 0);
  return { min: Math.round(sum('min') / total), max: Math.round(sum('max') / total) };
};

// 0 a 100: dentro da faixa vale 100; fora, perde 10 pontos por °C de distância
export const climateFit = (range: TempRange, celsius: number): number => {
  const distance = celsius < range.min ? range.min - celsius : Math.max(0, celsius - range.max);
  return Math.max(0, Math.round(100 - FIT_PENALTY_PER_DEGREE * distance));
};

export const projectionLabel = (average: number | null): string => {
  if (average === null) return NO_REVIEWS_LABEL;
  if (average < PROJECTION_INTIMATE_BELOW) return PROJECTION_LABELS.intimate;
  if (average < PROJECTION_STRONG_FROM) return PROJECTION_LABELS.moderate;
  return PROJECTION_LABELS.strong;
};

// FNV-1a de 32 bits sobre a data AAAA-MM-DD: o mesmo dia dá o mesmo número para todo mundo
export const dateHash = (date: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < date.length; index += 1) {
    hash ^= date.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

// Escolha estável do dia entre candidatos já ordenados (por nome); lista vazia = nada
export const pickDaily = <T>(candidates: readonly T[], date: string): T | null =>
  candidates.length === 0 ? null : (candidates[dateHash(date) % candidates.length] ?? null);
