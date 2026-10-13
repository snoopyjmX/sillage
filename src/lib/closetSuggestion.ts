// Sugestão do próprio armário (RN10 revisada, Fase 17B): regras puras sobre o "Tenho". Os números
// vêm de constants/climate.ts.
import { CLOSET_AVOID_DAYS, CLOSET_BAND_POINTS, CLOSET_DEFAULT_MIN } from '@/constants/climate';
import { climateFit, perfumeTempRange, pickDaily } from '@/lib/climate';
import { addCivilDays } from '@/lib/timezone';
import type { PerfumeSummary } from '@/types/catalog';
import type { DailyEntry } from '@/types/daily';

export type HomeSource = 'catalog' | 'closet';

// A escolha explícita vale sempre; sem ela, o armário é o padrão com 3 ou mais perfumes em "Tenho"
export const resolveHomeSource = (stored: HomeSource | null, ownedCount: number): HomeSource =>
  stored ?? (ownedCount >= CLOSET_DEFAULT_MIN ? 'closet' : 'catalog');

const byName = (a: PerfumeSummary, b: PerfumeSummary): number =>
  a.name.localeCompare(b.name, 'pt-BR') || a.id.localeCompare(b.id);

// Pontuação climática do perfume. A faixa usa a família de cada nota (com repetição), a mesma conta
// do detalhe; sem `noteFamilies` cai nas famílias distintas. Sem notas, não há faixa: pontua 0.
export const closetFit = (perfume: PerfumeSummary, temperature: number): number => {
  const range = perfumeTempRange(perfume.noteFamilies ?? perfume.families);
  return range ? climateFit(range, temperature) : 0;
};

// Ids dos perfumes vestidos nos `CLOSET_AVOID_DAYS` dias anteriores a hoje. Hoje fica de fora para a
// sugestão não trocar logo depois de "Vestir hoje".
export const recentlyWornIds = (
  history: readonly DailyEntry[],
  today: string,
  days: number = CLOSET_AVOID_DAYS
): Set<string> => {
  const from = addCivilDays(today, -days);
  return new Set(
    history.filter((entry) => entry.date >= from && entry.date < today).map((e) => e.perfume.id)
  );
};

interface PickClosetInput {
  owned: readonly PerfumeSummary[];
  // Nulo sem clima: o sorteio vale para todo o "Tenho"
  temperature: number | null;
  date: string;
  recentIds: ReadonlySet<string>;
}

// 1) Com clima, fica a faixa entre o melhor ajuste e CLOSET_BAND_POINTS abaixo. 2) Tira os vestidos
// recentemente, se sobrar algum. 3) Escolha estável da data sobre a lista ordenada por nome.
export const pickClosetPerfume = ({
  owned,
  temperature,
  date,
  recentIds,
}: PickClosetInput): PerfumeSummary | null => {
  const sorted = [...owned].sort(byName);

  let pool = sorted;
  if (temperature !== null && sorted.length > 0) {
    const fits = sorted.map((perfume) => ({ perfume, fit: closetFit(perfume, temperature) }));
    const best = Math.max(...fits.map(({ fit }) => fit));
    pool = fits.filter(({ fit }) => fit >= best - CLOSET_BAND_POINTS).map(({ perfume }) => perfume);
  }

  const fresh = pool.filter((perfume) => !recentIds.has(perfume.id));
  return pickDaily(fresh.length > 0 ? fresh : pool, date);
};
