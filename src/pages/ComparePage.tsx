import { Plus, Repeat2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ComparePicker } from '@/components/compare/ComparePicker';
import { CompareTable } from '@/components/compare/CompareTable';
import { PerfumeImage } from '@/components/perfume/PerfumeImage';
import { PerfumePlaceholder } from '@/components/perfume/PerfumePlaceholder';
import { PerfumeStage } from '@/components/perfume/PerfumeStage';
import { SeoHead } from '@/components/seo/SeoHead';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/constants/errors';
import { CONCENTRATION_LABELS } from '@/constants/labels';
import { useCompareColumn, type CompareColumnView } from '@/hooks/useCompareColumn';
import { useWeather } from '@/hooks/useWeather';
import {
  buildComparePath,
  isComparable,
  parseCompareParams,
  type CompareSelection,
} from '@/schemas/compareSearch';
import type { PerfumeSummary } from '@/types/catalog';

type Slot = 'a' | 'b';

const SLOT_LABELS: Record<Slot, string> = { a: 'primeiro', b: 'segundo' };

function HeaderSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando o perfume" className="grid gap-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-6 w-full" />
    </div>
  );
}

function EmptySlot({ slot, onChoose }: { slot: Slot; onChoose: () => void }) {
  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-3 text-center">
      <p className="text-sm text-muted-foreground">Escolha o {SLOT_LABELS[slot]} perfume</p>
      <Button variant="outline" onClick={onChoose}>
        <Plus aria-hidden />
        Escolher perfume
      </Button>
    </div>
  );
}

function PerfumeHeader({
  view,
  slot,
  onChoose,
}: {
  view: CompareColumnView;
  slot: Slot;
  onChoose: () => void;
}) {
  const { perfume } = view;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <PerfumeStage className="aspect-square overflow-hidden rounded-xl border">
        <PerfumeImage
          key={perfume.imageUrl}
          url={perfume.imageUrl}
          variant="medium"
          alt={`Frasco do perfume ${perfume.name}, ${perfume.brandName}`}
          width={320}
          height={320}
          className="size-full object-contain p-1"
          fallback={
            <PerfumePlaceholder family={perfume.notes[0]?.family} showIcon className="size-full" />
          }
        />
      </PerfumeStage>
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {perfume.brandName}
      </p>
      <h2 className="font-heading text-xl leading-tight font-medium">{perfume.name}</h2>
      <div>
        <Chip variant="concentration">{CONCENTRATION_LABELS[perfume.concentration]}</Chip>
      </div>
      <Link
        to={`/perfumes/${perfume.slug}`}
        className="inline-flex min-h-11 w-fit items-center rounded-lg text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Ver detalhes <span className="sr-only">de {perfume.name}</span>
      </Link>
      <Button variant="outline" size="sm" className="min-h-11 w-fit" onClick={onChoose}>
        <Repeat2 aria-hidden />
        Trocar <span className="sr-only">o {SLOT_LABELS[slot]} perfume</span>
      </Button>
    </div>
  );
}

// Rota privada (RequireAuth). `/compare?a=<slug>&b=<slug>`: dois perfumes lado a lado, só dados
// públicos, o clima de hoje e o DNA de quem olha. Sem duelos nem votação (D13).
export default function ComparePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const selection = parseCompareParams(params);
  const comparable = isComparable(selection);
  const weather = useWeather();
  const columnA = useCompareColumn(selection.a, weather.view);
  // Dois lados iguais não comparam nada: o segundo não busca
  const columnB = useCompareColumn(selection.b === selection.a ? null : selection.b, weather.view);
  const [picking, setPicking] = useState<Slot | null>(null);

  const handlePick = (perfume: PerfumeSummary) => {
    if (!picking) return;
    const next: CompareSelection = { ...selection, [picking]: perfume.slug };
    setPicking(null);
    void navigate(buildComparePath(next));
  };

  const renderHeader = (slot: Slot, slug: string | null, column: typeof columnA) =>
    slug === null ? (
      <EmptySlot slot={slot} onChoose={() => setPicking(slot)} />
    ) : (
      <AsyncBoundary
        status={column.status}
        loading={<HeaderSkeleton />}
        onRetry={column.retry}
        errorTitle="Não foi possível carregar o perfume"
        errorDescription={getErrorMessage(column.error)}
        offlineDescription="Conecte-se à internet para comparar."
      >
        {column.view && (
          <PerfumeHeader view={column.view} slot={slot} onChoose={() => setPicking(slot)} />
        )}
      </AsyncBoundary>
    );

  const bothReady = columnA.view !== null && columnB.view !== null;
  const anyError = columnA.status === 'error' || columnB.status === 'error';
  const excluded = [selection.a, selection.b].filter((slug): slug is string => slug !== null);

  return (
    <>
      <SeoHead
        title="Comparar perfumes"
        description="Compare dois perfumes lado a lado: pirâmide, famílias, fixação, rastro, clima e preço."
      />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pt-4 md:pt-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-medium md:text-4xl">Comparar perfumes</h1>
          <p className="text-sm text-muted-foreground">
            Dois perfumes lado a lado, com o clima de hoje e o seu DNA olfativo.
          </p>
        </header>

        <div className="grid grid-cols-2 items-start gap-3 sm:gap-6">
          {renderHeader('a', selection.a, columnA)}
          {renderHeader('b', selection.b === selection.a ? null : selection.b, columnB)}
        </div>

        {selection.a !== null && selection.a === selection.b && (
          <p role="status" className="text-sm text-muted-foreground">
            Escolha dois perfumes diferentes para comparar.
          </p>
        )}

        {comparable && !anyError && !bothReady && (
          <div
            role="status"
            aria-busy="true"
            aria-label="Carregando a comparação"
            className="grid gap-4"
          >
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        )}

        {comparable && columnA.view && columnB.view && (
          <CompareTable left={columnA.view} right={columnB.view} />
        )}
      </div>

      <ComparePicker
        open={picking !== null}
        onOpenChange={(open) => {
          if (!open) setPicking(null);
        }}
        excludeSlugs={excluded}
        onPick={handlePick}
      />
    </>
  );
}
