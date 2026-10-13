// Um lado do comparador (Fase 18B): detalhe público do perfume + resumo de avaliações + o que depende
// de quem olha (clima de hoje, DNA e coleção). Só dados públicos e o DNA; nenhuma consulta nova.
import { useCollectionStatus } from '@/hooks/useCollection';
import { buildSuggestionView, type SuggestionView } from '@/hooks/useDailySuggestion';
import { useOlfactoryDna } from '@/hooks/useOlfactoryDna';
import { usePerfumeDetail } from '@/hooks/usePerfumes';
import { usePerfumeReviews } from '@/hooks/useReviews';
import { computeAffinity, type Affinity } from '@/lib/affinity';
import { isDnaReady } from '@/lib/olfactoryDna';
import { familyBreakdown, type FamilyShare } from '@/lib/pyramid';
import type { WeatherView } from '@/types/weather';

export type CompareAffinity =
  // Já está em "Tenho": a pergunta de compra não se aplica
  | { kind: 'owned' }
  // Menos de 3 perfumes no DNA (D3)
  | { kind: 'forming' }
  | { kind: 'unknown' }
  | { kind: 'ready'; affinity: Affinity };

export interface CompareColumnView extends SuggestionView {
  families: FamilyShare[];
  affinity: CompareAffinity;
}

export const useCompareColumn = (slug: string | null, weather: WeatherView) => {
  const detail = usePerfumeDetail(slug ?? '', slug !== null);
  const perfumeId = detail.data?.id ?? '';
  const reviews = usePerfumeReviews(perfumeId);
  const dna = useOlfactoryDna();
  const collectionStatus = useCollectionStatus(perfumeId);

  const temperature = weather.status === 'ready' ? weather.weather.temperature : null;
  const perfume = detail.data;
  const summary = reviews.data?.summary;

  let view: CompareColumnView | null = null;
  if (perfume && summary) {
    const base = buildSuggestionView({ perfume, summary }, temperature);
    let affinity: CompareAffinity = { kind: 'unknown' };
    if (collectionStatus === 'owned') affinity = { kind: 'owned' };
    else if (dna.data && !isDnaReady(dna.data)) affinity = { kind: 'forming' };
    else if (dna.data) {
      const result = computeAffinity(dna.data, perfume.notes);
      if (result) affinity = { kind: 'ready', affinity: result };
    }
    view = { ...base, families: familyBreakdown(perfume.notes), affinity };
  }

  const status: 'pending' | 'error' | 'success' =
    slug === null
      ? 'pending'
      : detail.isError || reviews.isError
        ? 'error'
        : view
          ? 'success'
          : 'pending';

  const retry = () => {
    if (detail.isError) void detail.refetch();
    if (reviews.isError) void reviews.refetch();
  };

  return {
    status,
    view,
    error: detail.error ?? reviews.error,
    retry,
  };
};
