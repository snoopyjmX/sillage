import { useQuery } from '@tanstack/react-query';
import { DISCOVERY_LIMIT } from '@/constants/climate';
import { queryKeys } from '@/lib/queryKeys';
import { homeService } from '@/services/homeService';

// "Novidades no catálogo": os lançamentos mais recentes. Público, então persistível.
export const useRecentPerfumes = () =>
  useQuery({
    queryKey: queryKeys.home.recent(DISCOVERY_LIMIT),
    queryFn: () => homeService.getRecent(DISCOVERY_LIMIT),
  });
