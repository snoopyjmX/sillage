// Regras puras de localização. Coordenadas nunca são gravadas (docs/SECURITY.md).
import { COORD_DECIMALS, UNKNOWN_WEATHER_LABEL, WEATHER_CODE_LABELS } from '@/constants/weather';
import type { GeocodingResult } from '@/types/weather';

// "America/Sao_Paulo" -> "Sao Paulo". Fusos sem cidade (UTC, Etc/GMT+3) não resolvem.
export const cityFromTimezone = (timezone: string): string | null => {
  const parts = timezone.split('/');
  if (parts.length < 2 || parts[0] === 'Etc') return null;
  const city = parts[parts.length - 1]?.replaceAll('_', ' ').trim() ?? '';
  return city === '' ? null : city;
};

// Entre os resultados do geocoding, só vale o que tem o mesmo fuso do perfil (evita homônimos)
export const pickGeocodingResult = (
  results: readonly GeocodingResult[],
  timezone: string
): GeocodingResult | null => results.find((result) => result.timezone === timezone) ?? null;

export const locationLabel = (result: GeocodingResult): string => {
  const country = (result.country ?? result.countryCode ?? '').toLocaleUpperCase('pt-BR');
  return country === '' ? result.name : `${result.name}, ${country}`;
};

export const roundCoordinate = (value: number): number => {
  const factor = 10 ** COORD_DECIMALS;
  return Math.round(value * factor) / factor;
};

export const weatherDescription = (code: number): string =>
  WEATHER_CODE_LABELS[code] ?? UNKNOWN_WEATHER_LABEL;
