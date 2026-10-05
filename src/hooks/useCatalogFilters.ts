// Estado do catálogo = query string. Este hook é a única ponte entre a URL e os componentes.
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  defaultSort,
  parseCatalogSearchParams,
  toCatalogSearchParams,
  type CatalogFilters,
} from '@/schemas/catalogSearch';

type ListKey = 'brands' | 'notes' | 'families' | 'concentrations' | 'genders';

interface UpdateOptions {
  // Digitação usa replace para não encher o histórico; ações discretas empilham
  replace?: boolean;
}

export const useCatalogFilters = () => {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseCatalogSearchParams(params), [params]);

  const update = useCallback(
    (patch: Partial<CatalogFilters>, options: UpdateOptions = {}) => {
      const next: CatalogFilters = { ...filters, ...patch };
      // Mudou filtro/busca/ordem: volta para a página 1, salvo se a página foi pedida
      if (!('page' in patch)) next.page = 1;
      // Ordenação nunca escolhida (= padrão) acompanha a mudança do texto
      if (!('sort' in patch) && filters.sort === defaultSort(filters.q)) {
        next.sort = defaultSort(next.q);
      }
      if (next.notes.length === 0) next.pos = null;
      setParams(toCatalogSearchParams(next), { replace: options.replace ?? false });
    },
    [filters, setParams]
  );

  const toggle = useCallback(
    <K extends ListKey>(key: K, value: CatalogFilters[K][number]) => {
      const current = filters[key] as CatalogFilters[K][number][];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      update({ [key]: next } as Partial<CatalogFilters>);
    },
    [filters, update]
  );

  const clearFilters = useCallback(() => {
    update({
      brands: [],
      notes: [],
      pos: null,
      families: [],
      concentrations: [],
      genders: [],
      yearMin: null,
      yearMax: null,
    });
  }, [update]);

  return { filters, update, toggle, clearFilters };
};
