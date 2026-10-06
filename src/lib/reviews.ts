// Contas sobre avaliações (sem rede): usadas pela atualização otimista e pela exibição.
import type { ReviewInput, ReviewSummary, UserReview } from '@/types/review';

const round1 = (value: number): number => Math.round(value * 10) / 10;

// Resumo depois de trocar a avaliação `previous` por `next` (null = não havia / foi removida).
// A média guardada tem 1 casa, então o resultado é uma estimativa até o servidor confirmar.
export const applyReviewToSummary = (
  summary: ReviewSummary,
  previous: Pick<UserReview, 'longevity' | 'projection'> | null,
  next: Pick<ReviewInput, 'longevity' | 'projection'> | null
): ReviewSummary => {
  let count = summary.count;
  let longevity = (summary.avgLongevity ?? 0) * summary.count;
  let projection = (summary.avgProjection ?? 0) * summary.count;
  if (previous) {
    count -= 1;
    longevity -= previous.longevity;
    projection -= previous.projection;
  }
  if (next) {
    count += 1;
    longevity += next.longevity;
    projection += next.projection;
  }
  if (count <= 0) return { count: 0, avgLongevity: null, avgProjection: null };
  return {
    count,
    avgLongevity: round1(longevity / count),
    avgProjection: round1(projection / count),
  };
};

// Nota geral: média entre fixação e projeção (null sem avaliações)
export const overallAverage = (summary: ReviewSummary): number | null =>
  summary.count > 0 && summary.avgLongevity !== null && summary.avgProjection !== null
    ? round1((summary.avgLongevity + summary.avgProjection) / 2)
    : null;
