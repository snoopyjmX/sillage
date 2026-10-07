// Tipos de domínio do clima (Open-Meteo). Coordenadas nunca são gravadas: só vivem em memória.
import type { OlfactiveFamily } from '@/constants/labels';

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  code: number;
}

export interface GeocodingResult {
  name: string;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ResolvedLocation extends Coordinates {
  // "Cidade, PAÍS" ou "Sua localização"
  label: string;
}

export type GeolocationStatus = 'idle' | 'requesting' | 'denied' | 'failed';

export type WeatherView =
  | { status: 'loading' }
  // Sem cidade resolvida (fuso sem cidade, geocoding sem match) e sem localização do aparelho
  | { status: 'unavailable' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      location: ResolvedLocation;
      weather: CurrentWeather;
      description: string;
      // "Projeção ideal para dias ..." e as famílias da "Sillage ótima" de hoje
      phrase: string;
      families: OlfactiveFamily[];
    };
