// Card SOTD (Fase 16B): junta o detalhe do perfume, o clima e a preferência da cidade e gera a
// imagem no aparelho. Chave privada ['private', userId, 'share-card', ...]: o Blob nunca é persistido.
import { useQuery } from '@tanstack/react-query';
import { AppError } from '@/constants/errors';
import { useAuth } from '@/hooks/useAuth';
import { usePerfumeDetail } from '@/hooks/usePerfumes';
import { useTheme } from '@/hooks/useTheme';
import { DEVICE_LOCATION_LABEL } from '@/hooks/useWeather';
import { queryKeys } from '@/lib/queryKeys';
import {
  buildCardContent,
  cityFromLabel,
  weatherBadge,
  type SotdCardContent,
} from '@/lib/sotdCard';
import { renderSotdCard } from '@/lib/sotdCanvas';
import type { DailyEntry } from '@/types/daily';
import type { WeatherView } from '@/types/weather';

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new AppError('share_card_failed'));
    reader.readAsDataURL(blob);
  });

export interface ShareCardImage {
  blob: Blob;
  // Data URL: prévia sem objeto para revogar depois
  previewUrl: string;
}

interface UseShareCardInput {
  entry: DailyEntry;
  weather: WeatherView;
  showCity: boolean;
  enabled: boolean;
}

export const useShareCard = ({ entry, weather, showCity, enabled }: UseShareCardInput) => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { resolvedTheme } = useTheme();
  const { perfume } = entry;
  const detail = usePerfumeDetail(perfume.slug, enabled);

  // Sem rede e sem cache o detalhe fica pausado: o card sai com o que há (sem notas)
  const detailSettled = detail.isSuccess || detail.isError || detail.fetchStatus === 'paused';
  const city =
    weather.status === 'ready'
      ? cityFromLabel(weather.location.label, DEVICE_LOCATION_LABEL)
      : null;
  const badge = weatherBadge(weather, showCity, city);

  return useQuery<ShareCardImage>({
    queryKey: queryKeys.shareCard.image(userId, [
      perfume.slug,
      entry.date,
      resolvedTheme,
      detail.data?.id ?? null,
      badge?.icon ?? null,
      badge?.temperature ?? null,
      badge?.city ?? null,
    ]),
    queryFn: async () => {
      const content: SotdCardContent = buildCardContent({
        perfume,
        detail: detail.data ?? null,
        date: entry.date,
        weather: badge,
      });
      try {
        const blob = await renderSotdCard(content);
        return { blob, previewUrl: await blobToDataUrl(blob) };
      } catch (error) {
        throw error instanceof AppError
          ? error
          : new AppError('share_card_failed', { cause: error });
      }
    },
    enabled: enabled && userId !== '' && detailSettled,
    // Gerar não depende da rede (a foto cai no placeholder se faltar) e o resultado é determinístico
    networkMode: 'always',
    retry: false,
    staleTime: Infinity,
    gcTime: 60_000,
  });
};
