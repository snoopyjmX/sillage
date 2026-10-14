// Open-Meteo: previsão atual e geocoding; BigDataCloud: nome do local (só com a localização do
// aparelho). Fetch nativo, sem chave, sem backend nosso. Nenhuma coordenada é gravada; erros viram códigos estáveis (errors.ts).
import { z } from 'zod';
import { AppError } from '@/constants/errors';
import {
  FORECAST_URL,
  GEOCODING_RESULT_COUNT,
  GEOCODING_URL,
  REVERSE_GEOCODE_URL,
  WEATHER_TIMEOUT_MS,
} from '@/constants/weather';
import type { Coordinates, CurrentWeather, GeocodingResult, ReversePlace } from '@/types/weather';

const forecastSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    weather_code: z.number().int(),
  }),
});

// Busca sem resultado vem sem a chave `results`
const geocodingSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        country: z.string().nullish(),
        country_code: z.string().nullish(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.string().nullish(),
      })
    )
    .optional(),
});

// Campos vazios vêm como "": viram null
const emptyToNull = z
  .string()
  .nullish()
  .transform((value) => (value && value.trim() !== '' ? value : null));

const reverseGeocodeSchema = z.object({
  locality: emptyToNull,
  city: emptyToNull,
  principalSubdivisionCode: emptyToNull,
});

const fetchJson = async (url: URL): Promise<unknown> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEATHER_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    if (response.status === 429) throw new AppError('weather_rate_limited');
    if (!response.ok) throw new AppError('weather_failed', { cause: response.status });
    return await response.json();
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AppError('weather_timeout', { cause: error });
    }
    // fetch só rejeita com TypeError quando não há rede
    if (error instanceof TypeError) throw new AppError('network', { cause: error });
    throw new AppError('weather_failed', { cause: error });
  } finally {
    clearTimeout(timer);
  }
};

const parse = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const result = schema.safeParse(body);
  if (!result.success) throw new AppError('weather_failed', { cause: result.error });
  return result.data;
};

export const weatherService = {
  getCurrent: async ({ latitude, longitude }: Coordinates): Promise<CurrentWeather> => {
    const url = new URL(FORECAST_URL);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code');
    url.searchParams.set('timezone', 'auto');
    const { current } = parse(forecastSchema, await fetchJson(url));
    return {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      code: current.weather_code,
    };
  },

  // Coordenadas já arredondadas (COORD_DECIMALS) por quem chama; a BigDataCloud não recebe mais que isso
  reverseGeocode: async ({ latitude, longitude }: Coordinates): Promise<ReversePlace> => {
    const url = new URL(REVERSE_GEOCODE_URL);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('localityLanguage', 'pt');
    const body = parse(reverseGeocodeSchema, await fetchJson(url));
    return {
      locality: body.locality,
      city: body.city,
      subdivisionCode: body.principalSubdivisionCode,
    };
  },

  searchCity: async (name: string): Promise<GeocodingResult[]> => {
    const url = new URL(GEOCODING_URL);
    url.searchParams.set('name', name);
    url.searchParams.set('count', String(GEOCODING_RESULT_COUNT));
    url.searchParams.set('language', 'pt');
    url.searchParams.set('format', 'json');
    const { results } = parse(geocodingSchema, await fetchJson(url));
    return (results ?? []).map((result) => ({
      name: result.name,
      country: result.country ?? null,
      countryCode: result.country_code ?? null,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone ?? null,
    }));
  },
};
