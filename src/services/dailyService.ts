// Acesso a dados do Perfume do Dia (RN06). Só services importam o cliente do Supabase.
// `daily_perfumes` é uma tabela com RLS de dono (só SELECT; a escrita é a função set_daily_perfume):
// o usuário só enxerga as próprias linhas. "Hoje" é a data no fuso de `profiles.timezone`, a mesma
// conta que a função faz ao gravar.
import { AppError, toAppError } from '@/constants/errors';
import { fromPerfumeRow, PERFUME_ROW_SELECT } from '@/lib/perfume';
import { supabase } from '@/lib/supabase';
import { DEFAULT_TIMEZONE, todayInTimezone } from '@/lib/timezone';
import type { DailyEntry, DailyOverview } from '@/types/daily';

export const HISTORY_LIMIT = 12;

const DAILY_SELECT = `date, ${PERFUME_ROW_SELECT}`;

// Erro cru do Supabase nunca chega à interface: rede continua "rede", o resto vira falha do dia
const toDailyError = (error: Parameters<typeof toAppError>[0]): AppError => {
  const appError = toAppError(error);
  return appError.code === 'unknown' ? new AppError('daily_failed', { cause: error }) : appError;
};

interface DailyRow {
  date: string;
  perfume: Parameters<typeof fromPerfumeRow>[0];
}

const toEntry = ({ date, perfume }: DailyRow): DailyEntry => ({
  date,
  perfume: fromPerfumeRow(
    perfume,
    perfume.image_path
      ? supabase.storage.from('perfume-images').getPublicUrl(perfume.image_path).data.publicUrl
      : null
  ),
});

export const dailyService = {
  // Data de hoje no fuso do perfil (a RLS limita a leitura ao próprio perfil)
  getTodayDate: async (): Promise<string> => {
    const { data, error } = await supabase.from('profiles').select('timezone').maybeSingle();
    if (error) throw toDailyError(error);
    return todayInTimezone(data?.timezone ?? DEFAULT_TIMEZONE);
  },

  getToday: async (date: string): Promise<DailyEntry | null> => {
    const { data, error } = await supabase
      .from('daily_perfumes')
      .select(DAILY_SELECT)
      .eq('date', date)
      .maybeSingle();
    if (error) throw toDailyError(error);
    return data ? toEntry(data) : null;
  },

  // Dias anteriores a `date` (estritamente menores), mais recentes primeiro
  getHistory: async (date: string, limit = HISTORY_LIMIT): Promise<DailyEntry[]> => {
    const { data, error } = await supabase
      .from('daily_perfumes')
      .select(DAILY_SELECT)
      .lt('date', date)
      .order('date', { ascending: false })
      .limit(limit);
    if (error) throw toDailyError(error);
    return data.map(toEntry);
  },

  getOverview: async (): Promise<DailyOverview> => {
    const date = await dailyService.getTodayDate();
    const [today, history] = await Promise.all([
      dailyService.getToday(date),
      dailyService.getHistory(date),
    ]);
    return { today, history };
  },
};
