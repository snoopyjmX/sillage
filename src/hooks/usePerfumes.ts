import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AppError } from '@/constants/errors';
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

// Slug inexistente não adianta tentar de novo; falha de rede tenta uma vez (padrão do client)
export const usePerfumeDetail = (slug: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.perfumes.detail(slug),
    queryFn: () => perfumeService.getBySlug(slug),
    enabled,
    retry: (failureCount, error) =>
      !(error instanceof AppError && error.code === 'not_found') && failureCount < 1,
  });

// RN09: "Fragrâncias com a mesma alma". Público, então persistível.
export const useSimilarPerfumes = (perfumeId: string) =>
  useQuery({
    queryKey: queryKeys.perfumes.similar(perfumeId),
    queryFn: () => perfumeService.getSimilar(perfumeId),
    enabled: perfumeId !== '',
  });
