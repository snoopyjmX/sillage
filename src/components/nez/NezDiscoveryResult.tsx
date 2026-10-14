import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PerfumeImage } from '@/components/perfume/PerfumeImage';
import { PerfumePlaceholder } from '@/components/perfume/PerfumePlaceholder';
import { PerfumeStage } from '@/components/perfume/PerfumeStage';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { TypingAnimation } from '@/components/ui/typing-animation';
import { CONCENTRATION_LABELS } from '@/constants/labels';
import { getErrorMessage } from '@/constants/errors';
import { useNezPicks } from '@/hooks/useNez';
import type { NezDiscoveryResult as DiscoveryResult } from '@/services/aiService';

const TYPING_SPEED_MS = 18;

export function NezDiscoveryLoading() {
  return (
    <div role="status" aria-label="O Nez está escolhendo" className="flex flex-col gap-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-2 h-24 w-full rounded-xl" />
    </div>
  );
}

// Mesmas dimensões dos cards de escolha, para não deslocar o layout
function PicksSkeleton({ count }: { count: number }) {
  return (
    <div role="status" aria-label="Carregando as escolhas" className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

function Picks({ slugs, onNavigate }: { slugs: string[]; onNavigate: () => void }) {
  const picks = useNezPicks(slugs);
  return (
    <AsyncBoundary
      status={picks.status}
      isEmpty={(picks.data?.length ?? 0) === 0}
      loading={<PicksSkeleton count={slugs.length} />}
      empty={
        <p className="text-sm text-text-secondary">
          Esses perfumes não estão mais no catálogo. Tente de novo.
        </p>
      }
      onRetry={() => void picks.refetch()}
      errorTitle="Não foi possível carregar as escolhas"
      errorDescription={getErrorMessage(picks.error)}
      offlineDescription="Conecte-se à internet para ver os perfumes."
    >
      <ul aria-label="Perfumes escolhidos pelo Nez" className="flex flex-col gap-3">
        {picks.data?.map((perfume) => (
          <li key={perfume.id} className="flex gap-3 rounded-xl border bg-card p-3 shadow-subtle">
            <PerfumeStage className="size-20 shrink-0 overflow-hidden rounded-lg">
              <PerfumeImage
                key={perfume.imageUrl}
                url={perfume.imageUrl}
                variant="thumb"
                alt=""
                width={80}
                height={80}
                className="size-full object-contain p-1"
                fallback={<PerfumePlaceholder family={perfume.families[0]} className="size-full" />}
              />
            </PerfumeStage>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-xs text-text-secondary">
                {perfume.brandName} · {CONCENTRATION_LABELS[perfume.concentration]}
              </p>
              <h4 className="font-heading truncate text-lg leading-tight font-medium">
                {perfume.name}
              </h4>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-auto h-auto min-h-11 w-full whitespace-normal py-2 sm:w-fit"
              >
                <Link to={`/perfumes/${perfume.slug}`} onClick={onNavigate}>
                  Ver pirâmide e detalhes
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </AsyncBoundary>
  );
}

interface NezDiscoveryResultProps {
  result: DiscoveryResult;
  onRestart: () => void;
  // Fecha o drawer ao seguir para um perfume
  onNavigate: () => void;
}

// A curadoria do Nez e os perfumes reais do catálogo que ele escolheu
export function NezDiscoveryResult({ result, onRestart, onNavigate }: NezDiscoveryResultProps) {
  if (result.picks.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Nenhum perfume combinou desta vez"
        description="O catálogo ainda não tem perfumes que encaixem nessas escolhas. Tente outras famílias ou outro clima."
        action={<Button onClick={onRestart}>Refazer a trilha</Button>}
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <TypingAnimation
        as="p"
        speed={TYPING_SPEED_MS}
        className="font-heading text-lg leading-relaxed whitespace-pre-line"
      >
        {result.text}
      </TypingAnimation>
      <Picks slugs={result.picks} onNavigate={onNavigate} />
      <Button variant="ghost" onClick={onRestart} className="self-start">
        Refazer a trilha
      </Button>
    </div>
  );
}
