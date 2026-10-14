// Retrospectiva anual. Chave: ['private', userId, 'recap', ano] (nunca persistida). O ano corrente
// muda a cada dia vestido; o staleTime padrão do app já a revalida ao voltar para a tela.
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { recapService } from '@/services/recapService';

export const useAnnualRecap = (year: number | null) => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: queryKeys.recap.year(userId, year ?? 0),
    queryFn: () => recapService.get(year ?? 0),
    enabled: userId !== '' && year !== null,
  });
};
