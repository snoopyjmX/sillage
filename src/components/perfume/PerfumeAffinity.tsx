import { Fingerprint, Pipette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/constants/errors';
import { useCollectionStatus } from '@/hooks/useCollection';
import { useOlfactoryDna } from '@/hooks/useOlfactoryDna';
import { AFFINITY_LABELS, computeAffinity, type Affinity } from '@/lib/affinity';
import { isDnaReady, perfumesMissing, progressText } from '@/lib/olfactoryDna';
import type { PyramidNote } from '@/types/catalog';

interface PerfumeAffinityProps {
  perfumeId: string;
  notes: readonly PyramidNote[];
}

function AffinitySkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando a afinidade">
      <Skeleton className="h-36 w-full rounded-xl" />
    </div>
  );
}

// Só apresenta: o rótulo e os motivos vêm de lib/affinity.ts. Sem porcentagem (D12).
export function AffinityCard({ affinity }: { affinity: Affinity }) {
  return (
    <Card className="gap-3">
      <p className="font-heading text-2xl font-medium">{AFFINITY_LABELS[affinity.level]}</p>
      <ul aria-label="Motivos" className="flex flex-col gap-1.5 text-sm text-text-secondary">
        {affinity.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      {affinity.suggestDecant && (
        <p className="flex items-center gap-2 text-sm font-medium">
          <Pipette className="size-4 text-primary" aria-hidden />
          Prove num decant antes
        </p>
      )}
      <Link
        to="/profile"
        className="w-fit rounded-lg text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Ver o meu DNA olfativo
      </Link>
    </Card>
  );
}

// "Combina com você?" (Fase 18A) no detalhe do perfume. Não aparece para o que a pessoa já tem
// (a pergunta é sobre comprar) nem para perfume sem notas (não há o que comparar).
export function PerfumeAffinity({ perfumeId, notes }: PerfumeAffinityProps) {
  const status = useCollectionStatus(perfumeId);
  const dna = useOlfactoryDna();

  if (status === undefined || status === 'owned' || notes.length === 0) return null;

  const forming = dna.data !== undefined && !isDnaReady(dna.data);
  const affinity = dna.data ? computeAffinity(dna.data, notes) : null;

  return (
    <section aria-labelledby="affinity-title" className="flex flex-col gap-4">
      <h2 id="affinity-title" className="text-center font-heading text-2xl font-medium">
        Combina com você?
      </h2>
      <div className="mx-auto w-full max-w-xl">
        <AsyncBoundary
          status={dna.status}
          isEmpty={forming || affinity === null}
          loading={<AffinitySkeleton />}
          empty={
            <EmptyState
              icon={Fingerprint}
              title="Seu DNA ainda está se formando"
              description={
                dna.data
                  ? `${progressText(perfumesMissing(dna.data))}. Marque perfumes como “Tenho” ou vista um por dia.`
                  : undefined
              }
            />
          }
          onRetry={() => void dna.refetch()}
          errorTitle="Não foi possível carregar a afinidade"
          errorDescription={getErrorMessage(dna.error)}
          offlineDescription="Conecte-se à internet para ver se este perfume combina com você."
        >
          {affinity && <AffinityCard affinity={affinity} />}
        </AsyncBoundary>
      </div>
    </section>
  );
}
