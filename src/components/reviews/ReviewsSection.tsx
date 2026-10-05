import { MessageSquareText } from 'lucide-react';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { BlurFade } from '@/components/ui/blur-fade';
import { EmptyState } from '@/components/ui/empty-state';
import { Rating } from '@/components/ui/rating';
import { getErrorMessage } from '@/constants/errors';
import { usePerfumeReviews, useUserReview } from '@/hooks/useReviews';
import { formatCount } from '@/lib/format';
import { STAGGER_MAX_ITEMS } from '@/lib/motion';
import { ReviewCard } from './ReviewCard';
import { ReviewsSkeleton } from './ReviewsSkeleton';

const BLUR_FADE_STEP = 0.1;

// Avaliações da comunidade (RN08): públicas, com o nome de exibição do autor. A do próprio usuário
// vem da consulta privada (aparece primeiro, mesmo antes de a lista pública atualizar).
export function ReviewsSection({ perfumeId }: { perfumeId: string }) {
  const reviews = usePerfumeReviews(perfumeId);
  const mine = useUserReview(perfumeId);

  const own = mine.data ?? null;
  const others = (reviews.data?.reviews ?? []).filter((review) => review.id !== own?.id);
  const summary = reviews.data?.summary;
  const isEmpty = !own && others.length === 0;

  return (
    <section aria-labelledby="reviews-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 id="reviews-title" className="font-heading text-2xl font-medium">
          Avaliações da comunidade
        </h2>
        {summary && summary.avgLongevity !== null && summary.avgProjection !== null && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="flex items-center gap-2">
              <span className="text-text-secondary">Fixação média</span>
              <Rating readOnly label="Fixação média" value={summary.avgLongevity} showValue />
            </span>
            <span className="flex items-center gap-2">
              <span className="text-text-secondary">Projeção média</span>
              <Rating readOnly label="Projeção média" value={summary.avgProjection} showValue />
            </span>
            <span className="text-muted-foreground">
              {formatCount(summary.count, 'avaliação', 'avaliações')}
            </span>
          </div>
        )}
      </div>

      <AsyncBoundary
        status={reviews.status}
        isEmpty={isEmpty}
        loading={<ReviewsSkeleton />}
        empty={
          <EmptyState
            icon={MessageSquareText}
            title="Ainda não há avaliações"
            description="Seja a primeira pessoa a avaliar a fixação e a projeção deste perfume."
          />
        }
        onRetry={() => void reviews.refetch()}
        errorTitle="Não foi possível carregar as avaliações"
        errorDescription={getErrorMessage(reviews.error)}
        offlineDescription="Conecte-se à internet para ver as avaliações."
      >
        <ul aria-label="Avaliações" className="grid grid-cols-1 gap-4 min-[40rem]:grid-cols-2">
          {own && (
            <li key="own">
              <BlurFade inView className="h-full">
                <ReviewCard
                  highlight
                  authorName="Sua avaliação"
                  date={own.updatedAt}
                  longevity={own.longevity}
                  projection={own.projection}
                  comment={own.comment}
                />
              </BlurFade>
            </li>
          )}
          {others.map((review, index) => (
            <li key={review.id}>
              {/* Listas longas aparecem de uma vez: o atraso para no 12º item */}
              <BlurFade
                inView
                className="h-full"
                delay={BLUR_FADE_STEP * Math.min(index + 1, STAGGER_MAX_ITEMS)}
              >
                <ReviewCard
                  authorName={review.authorName}
                  date={review.createdAt}
                  longevity={review.longevity}
                  projection={review.projection}
                  comment={review.comment}
                />
              </BlurFade>
            </li>
          ))}
        </ul>
      </AsyncBoundary>
    </section>
  );
}
