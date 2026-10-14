import { useQuery } from '@tanstack/react-query';
import { AppError } from '@/constants/errors';
import { queryKeys } from '@/lib/queryKeys';
import { perfumerService } from '@/services/perfumerService';

// Slug inexistente não adianta tentar de novo; falha de rede tenta uma vez (padrão do client)
export const usePerfumer = (slug: string) =>
  useQuery({
    queryKey: queryKeys.perfumers.detail(slug),
    queryFn: () => perfumerService.getBySlug(slug),
    enabled: slug !== '',
    retry: (failureCount, error) =>
      !(error instanceof AppError && error.code === 'not_found') && failureCount < 1,
  });
