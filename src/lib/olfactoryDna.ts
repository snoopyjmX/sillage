// Regras puras do DNA olfativo (Fase 16A). Os números vêm de constants/dna.ts.
import { DNA_MIN_PERFUMES, DNA_WISH_MIN_ITEMS } from '@/constants/dna';
import { FAMILY_LABELS } from '@/constants/labels';
import { formatCount } from '@/lib/format';
import type { FamilyShare } from '@/lib/pyramid';
import type { OlfactoryDna } from '@/types/dna';

// Com menos perfumes que o mínimo (D3) o "perfil" seria enganoso: o card mostra o progresso
export const isDnaReady = (dna: OlfactoryDna): boolean => dna.perfumeCount >= DNA_MIN_PERFUMES;

export const perfumesMissing = (dna: OlfactoryDna): number =>
  Math.max(0, DNA_MIN_PERFUMES - dna.perfumeCount);

// "Faltam 2 perfumes para o seu DNA aparecer"
export const progressText = (missing: number): string =>
  `${missing === 1 ? 'Falta' : 'Faltam'} ${formatCount(missing, 'perfume', 'perfumes')} para o seu DNA aparecer`;

// Pesos -> o formato do FamilyBar (fração do total, do maior para o menor)
export const dnaShares = (dna: OlfactoryDna): FamilyShare[] => {
  const total = dna.families.reduce((sum, { weight }) => sum + weight, 0);
  if (total === 0) return [];
  return dna.families.map(({ family, weight }) => ({
    family,
    count: weight,
    share: weight / total,
  }));
};

// D2: com 3 ou mais itens em "Quero", se a família mais frequente ali for diferente da principal do
// DNA, o card diz para onde os desejos apontam. Igual à principal, não acrescenta nada.
export const wishLine = (dna: OlfactoryDna): string | null => {
  if (dna.wantedCount < DNA_WISH_MIN_ITEMS || dna.wishFamily === null) return null;
  if (dna.wishFamily === dna.families[0]?.family) return null;
  return `Seus desejos apontam para ${FAMILY_LABELS[dna.wishFamily]}`;
};

// "Baseado em 5 perfumes e 12 dias no memorial."
export const dnaFootnote = (dna: OlfactoryDna): string =>
  `Baseado em ${formatCount(dna.perfumeCount, 'perfume', 'perfumes')} e ${formatCount(dna.memorialDays, 'dia', 'dias')} no memorial.`;
