import { Library } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FormatBadge } from '@/components/collection/FormatBadge';
import { PerfumeGridSkeleton } from '@/components/perfume/PerfumeCardSkeleton';
import { PerfumeGrid } from '@/components/perfume/PerfumeGrid';
import { SeoHead } from '@/components/seo/SeoHead';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getErrorMessage } from '@/constants/errors';
import { COLLECTION_STATUS_LABELS, useCollection } from '@/hooks/useCollection';
import { useDaily, useWearToday } from '@/hooks/useDaily';
import { openCollectionDetails } from '@/lib/collectionDetailsStore';
import type { PerfumeSummary } from '@/types/catalog';
import type { CollectionItem, CollectionStatus } from '@/types/collection';

const STATUSES: readonly CollectionStatus[] = ['owned', 'wanted'];

const isStatus = (value: string): value is CollectionStatus =>
  STATUSES.some((status) => status === value);

const CatalogLink = () => (
  <Button asChild>
    <Link to="/catalog">Explorar o catálogo</Link>
  </Button>
);

// Rota privada (RequireAuth). Dois estados da RN02 em abas, com a contagem real de cada um.
export default function CollectionPage() {
  const [tab, setTab] = useState<CollectionStatus>('owned');
  const collection = useCollection();
  const daily = useDaily();
  const wear = useWearToday();
  const wornTodayId = daily.data?.today?.perfume.id;

  const items: CollectionItem[] = collection.data ?? [];
  const byStatus = (status: CollectionStatus) => items.filter((item) => item.status === status);
  const loaded = collection.status === 'success';

  const handleTabChange = (value: string) => {
    if (isStatus(value)) setTab(value);
  };

  // Só "Tenho" pode virar Perfume do Dia (RN06); "Quero" não recebe a ação
  const renderWearAction = (perfume: PerfumeSummary) => {
    const isWornToday = wornTodayId === perfume.id;
    const isSaving = wear.isPending && wear.variables === perfume.id;
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={isWornToday || wear.isPending}
          aria-busy={isSaving}
          onClick={() => wear.mutate(perfume.id)}
        >
          {isWornToday ? 'Você veste hoje' : isSaving ? 'Salvando…' : 'Vestir hoje'}
        </Button>
        {/* RN11: formato e volume (opcionais) só existem em "Tenho" */}
        <Button variant="ghost" onClick={() => openCollectionDetails(perfume)}>
          Detalhar <span className="sr-only">formato de {perfume.name}</span>
        </Button>
      </div>
    );
  };

  const renderFormatBadge = (perfume: PerfumeSummary) => {
    const item = items.find((candidate) => candidate.perfume.id === perfume.id);
    return item && item.status === 'owned' ? (
      <FormatBadge format={item.format} volumeMl={item.volumeMl} />
    ) : null;
  };

  return (
    <>
      <SeoHead title="Coleção" description="Os perfumes que você tem e os que quer." />

      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-medium md:text-4xl">Coleção</h1>
          <p className="text-sm text-muted-foreground">Os perfumes que você tem e os que quer.</p>
        </header>

        <Tabs value={tab} onValueChange={handleTabChange} className="gap-6">
          <TabsList aria-label="Estado na coleção" className="md:max-w-sm">
            {STATUSES.map((status) => (
              <TabsTrigger key={status} value={status}>
                {COLLECTION_STATUS_LABELS[status]}{' '}
                {loaded && (
                  <span className="ml-1 tabular-nums" data-testid={`count-${status}`}>
                    ({byStatus(status).length})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {STATUSES.map((status) => {
            const list = byStatus(status);
            return (
              <TabsContent key={status} value={status}>
                <AsyncBoundary
                  status={collection.status}
                  isEmpty={list.length === 0}
                  loading={<PerfumeGridSkeleton />}
                  empty={
                    items.length === 0 ? (
                      <EmptyState
                        icon={Library}
                        title="Sua coleção está vazia"
                        description="Adicione perfumes do catálogo como “Tenho” ou “Quero” e eles aparecem aqui."
                        action={<CatalogLink />}
                      />
                    ) : (
                      <EmptyState
                        icon={Library}
                        title={`Nenhum perfume em “${COLLECTION_STATUS_LABELS[status]}”`}
                        description="Escolha esse estado em qualquer perfume do catálogo."
                        action={<CatalogLink />}
                      />
                    )
                  }
                  onRetry={() => void collection.refetch()}
                  errorTitle="Não foi possível carregar sua coleção"
                  errorDescription={getErrorMessage(collection.error)}
                  offlineDescription="Conecte-se à internet para ver sua coleção."
                >
                  <PerfumeGrid
                    perfumes={list.map((item) => item.perfume)}
                    renderAction={status === 'owned' ? renderWearAction : undefined}
                    renderBadge={status === 'owned' ? renderFormatBadge : undefined}
                  />
                </AsyncBoundary>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </>
  );
}
