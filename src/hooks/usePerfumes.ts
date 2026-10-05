import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { CatalogFilters } from '@/schemas/catalogSearch';
import { perfumeService } from '@/services/perfumeService';

// Troca de página/filtro mantém a lista anterior na tela (sem piscar) até a nova chegar
export const usePerfumes = (filters: CatalogFilters) =>
  useQuery({
    queryKey: queryKeys.perfumes.list(filters),
    queryFn: () => perfumeService.search(filters),
    placeholderData: keepPreviousData,
  });
