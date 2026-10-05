import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { referenceService } from '@/services/referenceService';

// Marcas e notas mudam raramente: ficam frescas por uma hora
const ONE_HOUR = 60 * 60_000;

export const useBrands = () =>
  useQuery({
    queryKey: queryKeys.brands.list(),
    queryFn: referenceService.listBrands,
    staleTime: ONE_HOUR,
  });

export const useNotes = () =>
  useQuery({
    queryKey: queryKeys.notes.list(),
    queryFn: referenceService.listNotes,
    staleTime: ONE_HOUR,
  });
