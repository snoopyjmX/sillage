// Conteúdo do card SOTD (Fase 16B): regras puras que decidem o que entra na imagem.
import { CONCENTRATION_LABELS, POSITIONS, type OlfactiveFamily } from '@/constants/labels';
import { weatherIconKeyForCode, type WeatherIconKey } from '@/constants/share';
import { formatCivilDateLong, formatInteger } from '@/lib/format';
import type { PerfumeDetail, PerfumeSummary, PyramidNote } from '@/types/catalog';
import type { WeatherView } from '@/types/weather';

export interface SotdWeatherBadge {
  icon: WeatherIconKey;
  // "19 °C"
  temperature: string;
  // Só quando o usuário deixa a cidade ligada e há uma cidade de verdade
  city: string | null;
}

export interface SotdCardContent {
  brand: string;
  name: string;
  concentration: string;
  // Até três notas, uma por camada quando possível
  notes: string[];
  // As três vieram, nesta ordem, de topo, coração e fundo
  notesByLayer: boolean;
  family: OlfactiveFamily | undefined;
  imageUrl: string | null;
  dateLabel: string;
  weather: SotdWeatherBadge | null;
}

// Espaço não separável: "19 °C" nunca quebra entre o número e a unidade
const NBSP = String.fromCharCode(0xa0);

const NOTE_COUNT = POSITIONS.length;

// Uma nota por camada (topo, coração, fundo). Se faltar camada, completa com as demais notas, na
// ordem da pirâmide. `byLayer` só vale quando as três camadas tinham nota.
export const pickCardNotes = (
  notes: readonly PyramidNote[]
): { notes: string[]; byLayer: boolean } => {
  const perLayer = POSITIONS.map((position) => notes.find((note) => note.position === position));
  const chosen = perLayer.filter((note): note is PyramidNote => note !== undefined);
  const byLayer = chosen.length === NOTE_COUNT;
  if (!byLayer) {
    const ordered = POSITIONS.flatMap((position) =>
      notes.filter((note) => note.position === position)
    );
    for (const note of ordered) {
      if (chosen.length >= NOTE_COUNT) break;
      if (!chosen.includes(note)) chosen.push(note);
    }
  }
  return { notes: chosen.map((note) => note.name), byLayer };
};

// Sem clima não há selo (D4); sem cidade marcada, só a temperatura (D5)
export const weatherBadge = (view: WeatherView, showCity: boolean, city: string | null) => {
  if (view.status !== 'ready') return null;
  const badge: SotdWeatherBadge = {
    icon: weatherIconKeyForCode(view.weather.code),
    temperature: `${formatInteger(Math.round(view.weather.temperature))}${NBSP}°C`,
    city: showCity ? city : null,
  };
  return badge;
};

interface BuildContentInput {
  perfume: PerfumeSummary;
  // Nulo enquanto o detalhe não veio (offline sem cache): o card sai sem notas
  detail: PerfumeDetail | null;
  date: string;
  weather: SotdWeatherBadge | null;
}

export const buildCardContent = ({
  perfume,
  detail,
  date,
  weather,
}: BuildContentInput): SotdCardContent => {
  const picked = pickCardNotes(detail?.notes ?? []);
  return {
    brand: perfume.brandName,
    name: perfume.name,
    concentration: CONCENTRATION_LABELS[perfume.concentration],
    notes: picked.notes,
    notesByLayer: picked.byLayer,
    family: perfume.families[0],
    imageUrl: detail?.imageUrl ?? perfume.imageUrl ?? null,
    dateLabel: formatCivilDateLong(date),
    weather,
  };
};

// "São Paulo, BRASIL" ou "Curitiba, PR" -> a parte antes da vírgula. O rótulo genérico do
// aparelho ("Sua localização") não é um lugar: sem cidade.
export const cityFromLabel = (label: string, deviceLabel: string): string | null => {
  if (label === deviceLabel) return null;
  const city = label.split(',')[0]?.trim() ?? '';
  return city === '' ? null : city;
};

// Preferência "Mostrar a cidade": ligada por padrão; localStorage pode lançar (janela privada)
export const readStoredShareCity = (key: string): boolean => {
  try {
    return window.localStorage.getItem(key) !== 'off';
  } catch {
    return true;
  }
};

export const storeShareCity = (key: string, value: boolean): void => {
  try {
    window.localStorage.setItem(key, value ? 'on' : 'off');
  } catch {
    // sem persistência: vale só nesta abertura
  }
};
