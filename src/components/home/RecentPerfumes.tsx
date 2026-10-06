import { Sparkles } from 'lucide-react';
import { PerfumeGrid } from '@/components/perfume/PerfumeGrid';
import { PerfumeGridSkeleton } from '@/components/perfume/PerfumeCardSkeleton';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { EmptyState } from '@/components/ui/empty-state';
import { getErrorMessage } from '@/constants/errors';
import { useRecentPerfumes } from '@/hooks/useRecentPerfumes';

// "Novidades no catálogo": os lançamentos mais recentes
export function RecentPerfumes() {
  const recent = useRecentPerfumes();
  return (
    <section aria-labelledby="novidades" className="flex flex-col gap-4">
      <h2 id="novidades" className="font-heading text-2xl font-medium">
        Novidades no catálogo
      </h2>
      <AsyncBoundary
        status={recent.status}
        isEmpty={recent.data?.length === 0}
        loading={<PerfumeGridSkeleton />}
        empty={
          <EmptyState
            icon={Sparkles}
            title="O catálogo ainda está vazio"
            description="Quando houver novos perfumes, eles aparecem aqui."
          />
        }
        onRetry={() => void recent.refetch()}
        errorTitle="Não foi possível carregar as novidades"
        errorDescription={getErrorMessage(recent.error)}
        offlineDescription="Conecte-se à internet para ver as novidades."
      >
        <PerfumeGrid perfumes={recent.data ?? []} />
      </AsyncBoundary>
    </section>
  );
}
