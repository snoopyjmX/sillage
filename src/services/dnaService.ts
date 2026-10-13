// DNA olfativo (Fase 16A). Só services importam o cliente do Supabase.
// A função get_olfactory_dna() é SECURITY INVOKER: a RLS de dono filtra coleção e memorial (RN01).
import { AppError, toAppError } from '@/constants/errors';
import { supabase } from '@/lib/supabase';
import { parseOlfactoryDna } from '@/schemas/dna';
import type { OlfactoryDna } from '@/types/dna';

// Erro cru do Supabase nunca chega à interface: rede continua "rede", o resto vira falha do DNA
const toDnaError = (error: Parameters<typeof toAppError>[0]): AppError => {
  const appError = toAppError(error);
  return appError.code === 'unknown' ? new AppError('dna_failed', { cause: error }) : appError;
};

export const dnaService = {
  get: async (): Promise<OlfactoryDna> => {
    const { data, error } = await supabase.rpc('get_olfactory_dna');
    if (error) throw toDnaError(error);
    const dna = parseOlfactoryDna(data);
    if (!dna) throw new AppError('dna_failed');
    return dna;
  },
};
