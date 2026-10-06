// Perfume do Dia de hoje e histórico do usuário logado. Chave: ['private', userId, 'daily'].
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/constants/errors';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from '@/lib/toast';
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

// "Vestir hoje": grava o Perfume do Dia pela função do banco e atualiza o resumo da Home
export const useWearToday = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const client = useQueryClient();
  return useMutation({
    mutationFn: (perfumeId: string) => dailyService.setToday(perfumeId),
    onSuccess: () => {
      toast.success('Perfume do Dia atualizado.');
      return client.invalidateQueries({ queryKey: queryKeys.daily.overview(userId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};
