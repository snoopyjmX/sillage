import { describe, expect, it } from 'vitest';
import { weatherIconKeyForCode } from '@/constants/share';
import type { PerfumeDetail, PerfumeSummary, PyramidNote } from '@/types/catalog';
import type { WeatherView } from '@/types/weather';
import { buildCardContent, cityFromLabel, pickCardNotes, weatherBadge } from './sotdCard';

const note = (name: string, position: PyramidNote['position']): PyramidNote => ({
  slug: name.toLowerCase(),
  name,
  family: 'woody',
  position,
  description: null,
});

const summary: PerfumeSummary = {
  id: 'p1',
  slug: 'malbec',
  name: 'Malbec',
  brandName: 'O Boticário',
  brandSlug: 'o-boticario',
  concentration: 'edp',
  gender: 'masculine',
  releaseYear: 2020,
  imagePath: null,
  imageUrl: 'https://cdn.test/malbec.webp',
  families: ['woody', 'spicy'],
};

const ready = (temperature: number, code = 0): WeatherView => ({
  status: 'ready',
  location: { latitude: 0, longitude: 0, label: 'Curitiba, BRASIL' },
  weather: { temperature, humidity: 50, code },
  description: 'Céu limpo',
  phrase: '',
  families: [],
});

describe('pickCardNotes', () => {
  it('pega uma nota por camada, na ordem topo, coração, fundo', () => {
    const result = pickCardNotes([
      note('Cedro', 'base'),
      note('Limão', 'top'),
      note('Rosa', 'heart'),
      note('Pimenta', 'top'),
    ]);
    expect(result).toEqual({ notes: ['Limão', 'Rosa', 'Cedro'], byLayer: true });
  });

  it('completa com as demais quando falta camada, sem rótulo de camadas', () => {
    const result = pickCardNotes([
      note('Limão', 'top'),
      note('Pimenta', 'top'),
      note('Cedro', 'base'),
    ]);
    expect(result.byLayer).toBe(false);
    expect(result.notes).toEqual(['Limão', 'Cedro', 'Pimenta']);
  });

  it('com menos de três notas devolve as que existem', () => {
    expect(pickCardNotes([note('Cedro', 'base')])).toEqual({ notes: ['Cedro'], byLayer: false });
  });

  it('sem notas devolve vazio', () => {
    expect(pickCardNotes([])).toEqual({ notes: [], byLayer: false });
  });
});

describe('weatherBadge', () => {
  it('sem clima não há selo (D4)', () => {
    expect(weatherBadge({ status: 'unavailable' }, true, 'Curitiba')).toBeNull();
    expect(weatherBadge({ status: 'loading' }, true, 'Curitiba')).toBeNull();
    expect(weatherBadge({ status: 'error', message: 'x' }, true, 'Curitiba')).toBeNull();
  });

  it('arredonda a temperatura e mantém o espaço não separável antes da unidade', () => {
    const badge = weatherBadge(ready(18.6), true, 'Curitiba');
    expect(badge?.temperature).toBe('19 °C');
  });

  it('a cidade só entra quando marcada (D5)', () => {
    expect(weatherBadge(ready(19), true, 'Curitiba')?.city).toBe('Curitiba');
    expect(weatherBadge(ready(19), false, 'Curitiba')?.city).toBeNull();
  });

  it('escolhe o ícone pelo código do tempo', () => {
    expect(weatherBadge(ready(19, 0), false, null)?.icon).toBe('sun');
    expect(weatherBadge(ready(19, 63), false, null)?.icon).toBe('cloud-rain');
  });
});

describe('weatherIconKeyForCode', () => {
  it.each([
    [0, 'sun'],
    [2, 'cloud-sun'],
    [3, 'cloud'],
    [45, 'cloud-fog'],
    [53, 'cloud-rain'],
    [81, 'cloud-rain'],
    [73, 'cloud-snow'],
    [95, 'cloud-lightning'],
    [999, 'cloud'],
  ])('código %i -> %s', (code, icon) => {
    expect(weatherIconKeyForCode(code)).toBe(icon);
  });
});

describe('cityFromLabel', () => {
  it('tira o país do rótulo', () => {
    expect(cityFromLabel('São Paulo, BRASIL', 'Sua localização')).toBe('São Paulo');
  });

  it('a localização do aparelho não é uma cidade', () => {
    expect(cityFromLabel('Sua localização', 'Sua localização')).toBeNull();
  });
});

describe('buildCardContent', () => {
  const detail = {
    id: 'p1',
    imageUrl: 'https://cdn.test/malbec-detail.webp',
    notes: [note('Limão', 'top'), note('Rosa', 'heart'), note('Cedro', 'base')],
  } as PerfumeDetail;

  it('monta o conteúdo com notas, data por extenso e concentração', () => {
    const content = buildCardContent({
      perfume: summary,
      detail,
      date: '2026-10-13',
      weather: null,
    });
    expect(content.brand).toBe('O Boticário');
    expect(content.concentration).toBe('EDP');
    expect(content.notes).toEqual(['Limão', 'Rosa', 'Cedro']);
    expect(content.dateLabel).toBe('terça-feira, 13 de outubro de 2026');
    expect(content.family).toBe('woody');
    expect(content.imageUrl).toBe('https://cdn.test/malbec-detail.webp');
  });

  it('sem o detalhe (offline sem cache) sai sem notas e usa a imagem do resumo', () => {
    const content = buildCardContent({
      perfume: summary,
      detail: null,
      date: '2026-10-13',
      weather: null,
    });
    expect(content.notes).toEqual([]);
    expect(content.imageUrl).toBe('https://cdn.test/malbec.webp');
  });
});
