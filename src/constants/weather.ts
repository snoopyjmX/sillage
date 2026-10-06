// Open-Meteo (https://open-meteo.com): previsão e geocoding, sem chave, uso não comercial.
// Docs: /en/docs, /en/docs/geocoding-api, /en/terms. Dados sob CC BY 4.0.
export const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
export const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export const WEATHER_TIMEOUT_MS = 8_000;
// Limite gratuito: 10.000 chamadas/dia. Clima muda devagar: 30 min de cache por localização.
export const WEATHER_STALE_TIME = 30 * 60_000;
export const GEOCODING_STALE_TIME = 24 * 60 * 60_000;
export const GEOCODING_RESULT_COUNT = 20;
export const COORD_DECIMALS = 2;

// Atribuição exigida pela licença (CC BY 4.0), com link
export const OPEN_METEO_ATTRIBUTION = {
  text: 'Weather data by Open-Meteo.com',
  href: 'https://open-meteo.com/',
} as const;

export const UNKNOWN_WEATHER_LABEL = 'Tempo indefinido';

// Tabela oficial de códigos WMO do Open-Meteo, em pt-BR
export const WEATHER_CODE_LABELS: Readonly<Record<number, string>> = {
  0: 'Céu limpo',
  1: 'Predominantemente limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina com geada',
  51: 'Garoa fraca',
  53: 'Garoa moderada',
  55: 'Garoa intensa',
  56: 'Garoa congelante fraca',
  57: 'Garoa congelante intensa',
  61: 'Chuva fraca',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  66: 'Chuva congelante fraca',
  67: 'Chuva congelante forte',
  71: 'Neve fraca',
  73: 'Neve moderada',
  75: 'Neve forte',
  77: 'Grãos de neve',
  80: 'Pancadas de chuva fracas',
  81: 'Pancadas de chuva moderadas',
  82: 'Pancadas de chuva violentas',
  85: 'Pancadas de neve fracas',
  86: 'Pancadas de neve fortes',
  95: 'Trovoada',
  96: 'Trovoada com granizo fraco',
  97: 'Trovoada forte',
  99: 'Trovoada com granizo forte',
};
