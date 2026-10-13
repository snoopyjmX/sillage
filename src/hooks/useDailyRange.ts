// Dias do memorial num intervalo (calendário da Fase 19). Chave:
// ['private', userId, 'daily', 'range', from, to]: filha de `daily.overview`, então "Vestir hoje"
// (que invalida o resumo) atualiza o calendário. Nunca persistida.
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { dailyService } from '@/services/dailyService';

export const useDailyRange = (from: string, to: string, enabled = true) => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: queryKeys.daily.range(userId, from, to),
    queryFn: () => dailyService.getRange(from, to),
    enabled: enabled && userId !== '',
  });
};
