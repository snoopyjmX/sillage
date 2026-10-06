import { Sparkles } from 'lucide-react';
import { PerfumeGridSkeleton } from '@/components/perfume/PerfumeCardSkeleton';
import { PerfumeGrid } from '@/components/perfume/PerfumeGrid';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { EmptyState } from '@/components/ui/empty-state';
import { getErrorMessage } from '@/constants/errors';
import { useSimilarPerfumes } from '@/hooks/usePerfumes';

interface SimilarToTodayProps {
  // Perfume do Dia de hoje; nulo se o usuário ainda não escolheu
  perfumeId: string | null;
}

// RN09: parecidos com o Perfume do Dia
export function SimilarToToday({ perfumeId }: SimilarToTodayProps) {
  const similar = useSimilarPerfumes(perfumeId ?? '');
  return (
    <section aria-labelledby="parecidos" className="flex flex-col gap-4">
      <h2 id="parecidos" className="font-heading text-2xl font-medium">
        Parecidos com o seu perfume de hoje
      </h2>
      {perfumeId === null ? (
        <EmptyState
          icon={Sparkles}
          title="Escolha o seu perfume de hoje"
          description="Com o Perfume do Dia escolhido, mostramos os que dividem mais notas com ele."
        />
      ) : (
        <AsyncBoundary
          status={similar.status}
          isEmpty={similar.data?.length === 0}
          loading={<PerfumeGridSkeleton />}
          empty={
            <EmptyState
              icon={Sparkles}
              title="Nenhum parecido ainda"
              description="Quando outros perfumes dividirem notas com ele, eles aparecem aqui."
            />
          }
          onRetry={() => void similar.refetch()}
          errorTitle="Não foi possível carregar os parecidos"
          errorDescription={getErrorMessage(similar.error)}
          offlineDescription="Conecte-se à internet para ver perfumes parecidos."
        >
          <PerfumeGrid perfumes={similar.data ?? []} />
        </AsyncBoundary>
      )}
    </section>
  );
}
