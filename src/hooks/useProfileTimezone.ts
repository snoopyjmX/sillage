// Fuso IANA do perfil. Chave: ['private', userId, 'profile', 'timezone'].
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { dailyService } from '@/services/dailyService';

export const useProfileTimezone = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: queryKeys.profile.timezone(userId),
    queryFn: dailyService.getTimezone,
    enabled: userId !== '',
    staleTime: Infinity,
  });
};
