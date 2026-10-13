import { useState } from 'react';
import { SearchInput } from '@/components/filters/SearchInput';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/constants/errors';
import { usePerfumes } from '@/hooks/usePerfumes';
import { parseCatalogSearchParams } from '@/schemas/catalogSearch';
import type { PerfumeSummary } from '@/types/catalog';

const MIN_QUERY = 2;
const MAX_RESULTS = 8;

interface ComparePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Perfumes que não entram na lista (o que já está do outro lado)
  excludeSlugs: readonly string[];
  onPick: (perfume: PerfumeSummary) => void;
}

function PickerBody({ excludeSlugs, onPick }: Pick<ComparePickerProps, 'excludeSlugs' | 'onPick'>) {
  const [query, setQuery] = useState('');
  const ready = query.length >= MIN_QUERY;
  const search = usePerfumes(parseCatalogSearchParams(new URLSearchParams({ q: query })), ready);
  const results = (search.data?.items ?? [])
    .filter((perfume) => !excludeSlugs.includes(perfume.slug))
    .slice(0, MAX_RESULTS);

  return (
    <div className="grid gap-3">
      <SearchInput value={query} onSearch={setQuery} />
      {!ready ? (
        <p className="text-sm text-text-secondary">
          Digite pelo menos {MIN_QUERY} letras do nome ou da marca.
        </p>
      ) : (
        <AsyncBoundary
          status={search.status}
          isEmpty={results.length === 0}
          loading={
            <div
              role="status"
              aria-busy="true"
              aria-label="Buscando perfumes"
              className="grid gap-2"
            >
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          }
          empty={
            <p role="status" className="py-4 text-center text-sm text-text-secondary">
              Nenhum perfume encontrado para “{query}”.
            </p>
          }
          onRetry={() => void search.refetch()}
          errorTitle="Não foi possível buscar"
          errorDescription={getErrorMessage(search.error)}
          offlineDescription="Conecte-se à internet para buscar perfumes."
        >
          <ul aria-label="Resultados" className="grid max-h-[50dvh] gap-1 overflow-y-auto">
            {results.map((perfume) => (
              <li key={perfume.id}>
                <Button
                  variant="ghost"
                  className="h-auto min-h-11 w-full justify-start py-2 text-left whitespace-normal"
                  onClick={() => onPick(perfume)}
                >
                  <span className="flex flex-col items-start">
                    <span className="font-heading text-base leading-tight">{perfume.name}</span>
                    <span className="text-xs font-normal text-text-secondary">
                      {perfume.brandName}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </AsyncBoundary>
      )}
    </div>
  );
}

// Escolhe o perfume de um lado do comparador, buscando no catálogo (o mesmo `search_perfumes`).
// O corpo só monta com o diálogo aberto, então a busca recomeça vazia a cada abertura.
export function ComparePicker({ open, onOpenChange, excludeSlugs, onPick }: ComparePickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escolher perfume</DialogTitle>
          <DialogDescription>Busque pelo nome ou pela marca.</DialogDescription>
        </DialogHeader>
        <PickerBody excludeSlugs={excludeSlugs} onPick={onPick} />
      </DialogContent>
    </Dialog>
  );
}
