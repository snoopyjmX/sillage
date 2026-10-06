// Sugestão do dia (RN10): candidatos pelas famílias da temperatura de hoje e escolha estável pela
// data no fuso do usuário. Sem clima, sorteio estável sobre o catálogo todo. Chave pública.
import { useQuery } from '@tanstack/react-query';
import { useProfileTimezone } from '@/hooks/useProfileTimezone';
import { climateFit, highlightFamilies, perfumeTempRange, projectionLabel } from '@/lib/climate';
import { queryKeys } from '@/lib/queryKeys';
import { groupNotesByPosition, type NotesByPosition } from '@/lib/perfume';
import { todayInTimezone } from '@/lib/timezone';
import { homeService } from '@/services/homeService';
import type { PerfumeDetail } from '@/types/catalog';
import type { WeatherView } from '@/types/weather';

export interface SuggestionView {
  perfume: PerfumeDetail;
  notes: NotesByPosition;
  // Média de fixação (1 a 5), nula sem avaliações
  longevity: number | null;
  projection: { average: number | null; label: string };
  // 0 a 100; nulo sem clima ou sem notas (o card mostra "Clima indisponível")
  fit: number | null;
}

export const useDailySuggestion = (weather: WeatherView) => {
  const timezone = useProfileTimezone().data;
  const date = timezone ? todayInTimezone(timezone) : '';
  // Espera o clima resolver; erro ou indisponível caem no sorteio do catálogo todo
  const settled = weather.status !== 'loading';
  const temperature = weather.status === 'ready' ? weather.weather.temperature : null;
  const families = temperature === null ? [] : highlightFamilies(temperature);

  const query = useQuery({
    queryKey: queryKeys.home.suggestion(date, families),
    queryFn: () => homeService.getDailySuggestion(date, families),
    enabled: date !== '' && settled,
    select: (suggestion): SuggestionView | null => {
      if (!suggestion) return null;
      const { perfume, summary } = suggestion;
      const range = perfumeTempRange(perfume.notes.map((note) => note.family));
      return {
        perfume,
        notes: groupNotesByPosition(perfume.notes),
        longevity: summary.avgLongevity,
        projection: {
          average: summary.avgProjection,
          label: projectionLabel(summary.avgProjection),
        },
        fit: range && temperature !== null ? climateFit(range, temperature) : null,
      };
    },
  });
  return query;
};
