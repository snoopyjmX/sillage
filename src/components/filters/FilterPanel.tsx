import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import type { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { countActiveFilters } from '@/schemas/catalogSearch';
import { FilterFields } from './FilterFields';

type Catalog = ReturnType<typeof useCatalogFilters>;

interface FilterPanelProps extends Catalog {
  // Texto do botão que fecha a gaveta, ex.: "Ver 3 perfumes"
  resultsLabel: string;
}

// Desktop (≥ 1024 px): painel lateral fixo. Celular: botão que abre uma gaveta (Drawer).
// Só um dos dois existe no DOM por vez (evita ids e campos duplicados).
export function FilterPanel({
  filters,
  update,
  toggle,
  clearFilters,
  resultsLabel,
}: FilterPanelProps) {
  const isDesktop = useMediaQuery('(min-width: 64rem)');
  const activeCount = countActiveFilters(filters);

  if (isDesktop) {
    return (
      <aside
        aria-label="Filtros"
        className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col gap-4 self-start overflow-y-auto rounded-xl border bg-card p-5 shadow-card"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-xl font-medium">Filtros</h2>
          {activeCount > 0 && (
            <Button variant="link" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
        <FilterFields filters={filters} update={update} toggle={toggle} />
      </aside>
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full min-[30rem]:w-auto">
          <SlidersHorizontal aria-hidden />
          Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filtros</DrawerTitle>
          <DrawerDescription>Refine o catálogo. Os resultados atualizam na hora.</DrawerDescription>
        </DrawerHeader>
        <FilterFields filters={filters} update={update} toggle={toggle} />
        <DrawerFooter className="sticky bottom-0 -mx-6 -mb-6 flex-row gap-2 border-t bg-popover px-6 py-4">
          {activeCount > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              Limpar
            </Button>
          )}
          <DrawerClose asChild>
            <Button className="flex-1">{resultsLabel}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
