import { Sparkles } from 'lucide-react';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { BlurFade } from '@/components/ui/blur-fade';
import { EmptyState } from '@/components/ui/empty-state';
import { getErrorMessage } from '@/constants/errors';
import { useSimilarPerfumes } from '@/hooks/usePerfumes';
import { STAGGER_MAX_ITEMS } from '@/lib/motion';
import { PerfumeCard } from './PerfumeCard';
import { PerfumeGridSkeleton } from './PerfumeCardSkeleton';

const BLUR_FADE_STEP = 0.1;

// RN09: perfumes que dividem o maior número de notas com o perfume da página
export function SimilarPerfumes({ perfumeId }: { perfumeId: string }) {
  const similar = useSimilarPerfumes(perfumeId);

  return (
    <section aria-labelledby="similar-title" className="flex flex-col gap-4">
      <h2 id="similar-title" className="font-heading text-2xl font-medium">
        Fragrâncias com a mesma alma
      </h2>
      <AsyncBoundary
        status={similar.status}
        isEmpty={similar.data?.length === 0}
        loading={<PerfumeGridSkeleton />}
        empty={
          <EmptyState
            icon={Sparkles}
            title="Nenhuma fragrância parecida ainda"
            description="Quando outros perfumes dividirem notas com este, eles aparecem aqui."
          />
        }
        onRetry={() => void similar.refetch()}
        errorTitle="Não foi possível carregar as sugestões"
        errorDescription={getErrorMessage(similar.error)}
        offlineDescription="Conecte-se à internet para ver fragrâncias parecidas."
      >
        <ul
          aria-label="Fragrâncias parecidas"
          className="grid grid-cols-1 gap-4 min-[30rem]:grid-cols-2 xl:grid-cols-3"
        >
          {similar.data?.map((perfume, index) => (
            <li key={perfume.id}>
              <BlurFade
                inView
                className="h-full"
                delay={BLUR_FADE_STEP * Math.min(index, STAGGER_MAX_ITEMS)}
              >
                <PerfumeCard perfume={perfume} />
              </BlurFade>
            </li>
          ))}
        </ul>
      </AsyncBoundary>
    </section>
  );
}
