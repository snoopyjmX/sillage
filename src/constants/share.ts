// Card de compartilhamento do Perfume do Dia (docs/PRODUCT.md, Fase 16B). Medidas em unidades do
// canvas (1080 x 1920), não em CSS: o card é uma imagem, fora do sistema de layout da interface.
export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1920;
// JPEG: o fundo é sólido e é o formato que Instagram, WhatsApp e o share sheet do iOS aceitam
export const SHARE_CARD_MIME = 'image/jpeg';
export const SHARE_CARD_QUALITY = 0.92;
export const SHARE_CARD_EXTENSION = 'jpg';

// Preferência "Mostrar a cidade" (booleano); ligada por padrão
export const SHARE_CITY_STORAGE_KEY = 'sillage-share-city';

export const SHARE_CARD_WORDMARK = 'Sillage';

// Ícones de clima desenhados no canvas. Caminhos do Lucide (ISC) em grade 24, traço 2: o canvas não
// renderiza componentes React, então os mesmos desenhos vêm como dados.
export type WeatherIconKey =
  'sun' | 'cloud-sun' | 'cloud' | 'cloud-fog' | 'cloud-rain' | 'cloud-snow' | 'cloud-lightning';

export const WEATHER_ICON_PATHS: Record<WeatherIconKey, readonly string[]> = {
  sun: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    'M12 2v2',
    'M12 20v2',
    'm4.93 4.93 1.41 1.41',
    'm17.66 17.66 1.41 1.41',
    'M2 12h2',
    'M20 12h2',
    'm6.34 17.66-1.41 1.41',
    'm19.07 4.93-1.41 1.41',
  ],
  'cloud-sun': [
    'M12 2v2',
    'm4.93 4.93 1.41 1.41',
    'M20 12h2',
    'm19.07 4.93-1.41 1.41',
    'M15.947 12.65a4 4 0 0 0-5.925-4.128',
    'M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z',
  ],
  cloud: ['M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'],
  'cloud-fog': ['M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242', 'M16 17H7', 'M17 21H9'],
  'cloud-rain': [
    'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242',
    'M16 14v6',
    'M8 14v6',
    'M12 16v6',
  ],
  'cloud-snow': [
    'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242',
    'M8 15h.01',
    'M8 19h.01',
    'M12 17h.01',
    'M12 21h.01',
    'M16 15h.01',
    'M16 19h.01',
  ],
  'cloud-lightning': [
    'M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973',
    'm13 12-3 5h4l-3 5',
  ],
};

// Código WMO (Open-Meteo) -> ícone. Códigos fora da tabela caem na nuvem simples.
export const weatherIconKeyForCode = (code: number): WeatherIconKey => {
  if (code === 0 || code === 1) return 'sun';
  if (code === 2) return 'cloud-sun';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'cloud-fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'cloud-rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'cloud-snow';
  if (code >= 95 && code <= 99) return 'cloud-lightning';
  return 'cloud';
};
