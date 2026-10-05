import { SearchX } from 'lucide-react';
import { ActiveFilters } from '@/components/filters/ActiveFilters';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { Pagination } from '@/components/filters/Pagination';
import { SearchInput } from '@/components/filters/SearchInput';
import { SortSelect } from '@/components/filters/SortSelect';
import { PerfumeGridSkeleton } from '@/components/perfume/PerfumeCardSkeleton';
import { PerfumeGrid } from '@/components/perfume/PerfumeGrid';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { getErrorMessage } from '@/constants/errors';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { usePerfumes } from '@/hooks/usePerfumes';
import { useBrands, useNotes } from '@/hooks/useReferenceData';
import { formatCount } from '@/lib/format';
import { countActiveFilters, PAGE_SIZE } from '@/schemas/catalogSearch';

export default function CatalogPage() {
  const catalog = useCatalogFilters();
  const { filters, update, toggle, clearFilters } = catalog;
  const perfumes = usePerfumes(filters);
  const brands = useBrands();
  const notes = useNotes();

  const items = perfumes.data?.items ?? [];
  const total = perfumes.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = countActiveFilters(filters) > 0;
  // O banco devolve zero linhas (e nenhum total) quando a página passa do fim
  const pastTheEnd = filters.page > 1 && perfumes.status === 'success' && items.length === 0;

  const countLabel = formatCount(total, 'perfume', 'perfumes');

  return (
    <>
      <title>Catálogo · Sillage</title>
      <meta
        name="description"
        content="Explore perfumes de nicho por marca, notas, famílias olfativas e ano."
      />

      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-4">
          <h1 className="font-heading text-3xl font-medium md:text-4xl">Catálogo</h1>
          <SearchInput value={filters.q} onSearch={(q) => update({ q }, { replace: true })} />
        </header>

        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <FilterPanel {...catalog} resultsLabel={`Ver ${countLabel}`} />

          <section aria-label="Resultados" className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-sm text-muted-foreground">
                {perfumes.status === 'success' && !pastTheEnd ? countLabel : ' '}
              </p>
              <SortSelect
                value={filters.sort}
                hasQuery={filters.q !== ''}
                onChange={(sort) => update({ sort })}
              />
            </div>

            <ActiveFilters
              filters={filters}
              brands={brands.data ?? []}
              notes={notes.data ?? []}
              onToggleBrand={(slug) => toggle('brands', slug)}
              onToggleNote={(slug) => toggle('notes', slug)}
              onToggleFamily={(family) => toggle('families', family)}
              onToggleConcentration={(value) => toggle('concentrations', value)}
              onToggleGender={(value) => toggle('genders', value)}
              onClearPosition={() => update({ pos: null })}
              onClearYears={() => update({ yearMin: null, yearMax: null })}
              onClear={clearFilters}
            />

            <AsyncBoundary
              status={perfumes.status}
              isEmpty={items.length === 0}
              loading={<PerfumeGridSkeleton />}
              empty={
                pastTheEnd ? (
                  <EmptyState
                    icon={SearchX}
                    title="Essa página não existe"
                    description="Não há resultados tão adiante. Volte ao começo da lista."
                    action={<Button onClick={() => update({ page: 1 })}>Ir para a página 1</Button>}
                  />
                ) : (
                  <EmptyState
                    icon={SearchX}
                    title="Nenhum perfume encontrado"
                    description="Tente outros termos ou remova alguns filtros."
                    action={
                      hasFilters ? (
                        <Button variant="outline" onClick={clearFilters}>
                          Limpar filtros
                        </Button>
                      ) : undefined
                    }
                  />
                )
              }
              onRetry={() => void perfumes.refetch()}
              errorTitle="Não foi possível carregar o catálogo"
              errorDescription={getErrorMessage(perfumes.error)}
              offlineDescription="Conecte-se à internet para ver o catálogo."
            >
              <PerfumeGrid perfumes={items} isRefreshing={perfumes.isPlaceholderData} />
              <Pagination
                page={filters.page}
                totalPages={totalPages}
                onPageChange={(page) => {
                  update({ page });
                  window.scrollTo({ top: 0 });
                }}
              />
            </AsyncBoundary>
          </section>
        </div>
      </div>
    </>
  );
}
