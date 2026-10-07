// Resumo do Perfil só com dados que já existem: coleção (RN02) e Perfume do Dia (RN06).
import { useCollection } from '@/hooks/useCollection';
import { useDailyCount } from '@/hooks/useDaily';
import { countByStatus } from '@/lib/profile';

export interface ProfileStats {
  owned: number;
  wanted: number;
  memorialDays: number;
}

export const useProfileStats = () => {
  const collection = useCollection();
  const days = useDailyCount();

  const status =
    collection.isError || days.isError
      ? 'error'
      : collection.isSuccess && days.isSuccess
        ? 'success'
        : 'pending';

  const stats: ProfileStats | null =
    collection.data && days.data !== undefined
      ? { ...countByStatus(collection.data), memorialDays: days.data }
      : null;

  const retry = () => {
    if (collection.isError) void collection.refetch();
    if (days.isError) void days.refetch();
  };

  return { status, stats, retry } as const;
};
