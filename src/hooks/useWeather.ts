// Clima da Home: cidade pelo fuso do perfil (geocoding do Open-Meteo) ou localização do aparelho
// (com o nome do bairro ou cidade pela BigDataCloud).
// Chaves ['private', userId, 'weather', ...]: nunca persistidas. staleTime de 30 min poupa o limite.
import { useQuery } from '@tanstack/react-query';
import { ERROR_MESSAGES, getErrorMessage } from '@/constants/errors';
import { GEOCODING_STALE_TIME, WEATHER_STALE_TIME } from '@/constants/weather';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useProfileTimezone } from '@/hooks/useProfileTimezone';
import { bandPhrase, highlightFamilies } from '@/lib/climate';
import {
  cityFromTimezone,
  formatPlaceLabel,
  locationLabel,
  pickGeocodingResult,
  weatherDescription,
} from '@/lib/location';
import { queryKeys } from '@/lib/queryKeys';
import { weatherService } from '@/services/weatherService';
import type { ResolvedLocation, WeatherView } from '@/types/weather';

export const DEVICE_LOCATION_LABEL = 'Sua localização';

export const useWeather = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const timezoneQuery = useProfileTimezone();
  const timezone = timezoneQuery.data ?? '';
  const city = timezone === '' ? null : cityFromTimezone(timezone);
  const geo = useGeolocation();

  const cityQuery = useQuery({
    queryKey: queryKeys.weather.city(userId, timezone),
    queryFn: async () => pickGeocodingResult(await weatherService.searchCity(city ?? ''), timezone),
    enabled: userId !== '' && city !== null && geo.coords === null,
    staleTime: GEOCODING_STALE_TIME,
  });

  // Nome do local só com a localização do aparelho. Se falhar, o rótulo genérico segue valendo e
  // o clima não espera por isso.
  const placeQuery = useQuery({
    queryKey: queryKeys.weather.place(
      userId,
      geo.coords?.latitude ?? 0,
      geo.coords?.longitude ?? 0
    ),
    queryFn: async () =>
      formatPlaceLabel(
        await weatherService.reverseGeocode({
          latitude: geo.coords?.latitude ?? 0,
          longitude: geo.coords?.longitude ?? 0,
        })
      ),
    enabled: userId !== '' && geo.coords !== null,
    staleTime: GEOCODING_STALE_TIME,
    retry: false,
  });

  const location: ResolvedLocation | null = geo.coords
    ? { ...geo.coords, label: placeQuery.data ?? DEVICE_LOCATION_LABEL }
    : cityQuery.data
      ? {
          latitude: cityQuery.data.latitude,
          longitude: cityQuery.data.longitude,
          label: locationLabel(cityQuery.data),
        }
      : null;

  const currentQuery = useQuery({
    queryKey: queryKeys.weather.current(userId, location?.latitude ?? 0, location?.longitude ?? 0),
    queryFn: () =>
      weatherService.getCurrent({
        latitude: location?.latitude ?? 0,
        longitude: location?.longitude ?? 0,
      }),
    enabled: userId !== '' && location !== null,
    staleTime: WEATHER_STALE_TIME,
  });

  const view: WeatherView = (() => {
    if (userId === '' || timezoneQuery.isPending) return { status: 'loading' };
    if (location !== null) {
      if (currentQuery.data) {
        const { temperature, code } = currentQuery.data;
        return {
          status: 'ready',
          location,
          weather: currentQuery.data,
          description: weatherDescription(code),
          phrase: bandPhrase(temperature),
          families: highlightFamilies(temperature),
        };
      }
      if (currentQuery.isError) {
        return { status: 'error', message: getErrorMessage(currentQuery.error) };
      }
      return { status: 'loading' };
    }
    if (city === null) return { status: 'unavailable' };
    if (cityQuery.isPending) return { status: 'loading' };
    if (cityQuery.isError) return { status: 'error', message: getErrorMessage(cityQuery.error) };
    return { status: 'unavailable' };
  })();

  const retry = () => {
    if (location !== null) void currentQuery.refetch();
    else void cityQuery.refetch();
  };

  return {
    view,
    retry,
    location: {
      supported: geo.supported,
      status: geo.status,
      error:
        geo.status === 'denied'
          ? ERROR_MESSAGES.location_denied
          : geo.status === 'failed'
            ? ERROR_MESSAGES.location_failed
            : null,
      request: geo.request,
    },
  };
};
