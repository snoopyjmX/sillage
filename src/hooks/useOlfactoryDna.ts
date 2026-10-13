// DNA olfativo do Perfil. Chave: ['private', userId, 'olfactory-dna'] (nunca persistida).
// Muda com a coleção e o memorial: as mutações dessas telas invalidam esta chave.
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { dnaService } from '@/services/dnaService';

export const useOlfactoryDna = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: queryKeys.dna.get(userId),
    queryFn: dnaService.get,
    enabled: userId !== '',
  });
};
