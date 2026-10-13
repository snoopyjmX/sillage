// Sugestão do próprio armário (RN10 revisada, Fase 17B): a escolha vem só do "Tenho" do usuário, pelo
// clima de hoje, evitando o que foi vestido nos dias anteriores. Chave privada
// ['private', userId, 'home', 'closet', date, perfumeId]: nunca persistida.
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useCollection';
import { useDaily } from '@/hooks/useDaily';
import { buildSuggestionView, type SuggestionView } from '@/hooks/useDailySuggestion';
import { useProfileTimezone } from '@/hooks/useProfileTimezone';
import { pickClosetPerfume, recentlyWornIds } from '@/lib/closetSuggestion';
import { queryKeys } from '@/lib/queryKeys';
import { DEFAULT_TIMEZONE, todayInTimezone } from '@/lib/timezone';
import { homeService } from '@/services/homeService';
import type { WeatherView } from '@/types/weather';

export const useClosetSuggestion = (weather: WeatherView, enabled: boolean) => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const collection = useCollection();
  const daily = useDaily();
  const tz = useProfileTimezone();
  const date = tz.isPending ? '' : todayInTimezone(tz.data ?? DEFAULT_TIMEZONE);

  // Espera o clima resolver; erro ou indisponível caem no sorteio de todo o "Tenho"
  const settled = weather.status !== 'loading';
  const temperature = weather.status === 'ready' ? weather.weather.temperature : null;

  // O memorial só serve para variar: se falhar, a sugestão sai sem essa regra
  const historyReady = daily.isSuccess || daily.isError;
  const owned = (collection.data ?? []).filter((item) => item.status === 'owned');
  const pick =
    collection.isSuccess && historyReady && date !== '' && settled
      ? pickClosetPerfume({
          owned: owned.map((item) => item.perfume),
          temperature,
          date,
          recentIds: recentlyWornIds(daily.data?.history ?? [], date),
        })
      : null;

  const query = useQuery({
    queryKey: queryKeys.home.closet(userId, date, pick?.id ?? ''),
    queryFn: () => homeService.getClosetSuggestion({ id: pick?.id ?? '', slug: pick?.slug ?? '' }),
    enabled: enabled && userId !== '' && pick !== null,
    select: (suggestion): SuggestionView => buildSuggestionView(suggestion, temperature),
  });

  // "Tenho" vazio não é erro nem carregamento: é o estado vazio
  const isEmpty = collection.isSuccess && owned.length === 0;
  const status: 'pending' | 'error' | 'success' = !enabled
    ? 'pending'
    : collection.isError
      ? 'error'
      : isEmpty
        ? 'success'
        : !collection.isSuccess || !historyReady || !settled || date === ''
          ? 'pending'
          : query.status;

  const refetch = () => {
    if (collection.isError) void collection.refetch();
    else void query.refetch();
  };

  return {
    status,
    data: isEmpty ? null : (query.data ?? null),
    error: collection.isError ? collection.error : query.error,
    refetch,
  };
};
