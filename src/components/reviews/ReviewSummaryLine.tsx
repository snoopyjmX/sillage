import { Rating } from '@/components/ui/rating';
import { Skeleton } from '@/components/ui/skeleton';
import { usePerfumeReviews } from '@/hooks/useReviews';
import { formatCount, formatDecimal } from '@/lib/format';
import { overallAverage } from '@/lib/reviews';

// Hero da página de detalhes: média de estrelas (fixação e projeção juntas) e contagem.
// Falha ao carregar não derruba o hero: a seção de avaliações mostra o erro e o "tentar de novo".
export function ReviewSummaryLine({ perfumeId }: { perfumeId: string }) {
  const { data, status } = usePerfumeReviews(perfumeId);

  if (status === 'pending') return <Skeleton className="h-6 w-48" />;
  if (!data) return null;

  const average = overallAverage(data.summary);
  if (average === null) {
    return <p className="text-sm text-muted-foreground">Ainda sem avaliações.</p>;
  }

  return (
    <div data-slot="review-summary" className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Rating readOnly label="Nota média" value={average} showValue />
      <span className="text-sm text-muted-foreground">
        {formatCount(data.summary.count, 'avaliação', 'avaliações')}
        <span className="sr-only">, nota média {formatDecimal(average)} de 5</span>
      </span>
    </div>
  );
}
