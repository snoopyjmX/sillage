// Perfume do Dia de hoje e histórico do usuário logado. Chave: ['private', userId, 'daily'].
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { dailyService } from '@/services/dailyService';

export const useDaily = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: queryKeys.daily.overview(userId),
    queryFn: dailyService.getOverview,
    enabled: userId !== '',
  });
};
