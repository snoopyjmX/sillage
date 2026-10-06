import { describe, expect, it } from 'vitest';
import type { GeocodingResult } from '@/types/weather';
import {
  cityFromTimezone,
  locationLabel,
  pickGeocodingResult,
  roundCoordinate,
  weatherDescription,
} from './location';

const result = (overrides: Partial<GeocodingResult>): GeocodingResult => ({
  name: 'São Paulo',
  country: 'Brasil',
  countryCode: 'BR',
  latitude: -23.55,
  longitude: -46.64,
  timezone: 'America/Sao_Paulo',
  ...overrides,
});

describe('cityFromTimezone', () => {
  it.each([
    ['America/Sao_Paulo', 'Sao Paulo'],
    ['America/Argentina/Buenos_Aires', 'Buenos Aires'],
    ['Europe/Lisbon', 'Lisbon'],
  ])('%s -> %s', (timezone, city) => {
    expect(cityFromTimezone(timezone)).toBe(city);
  });

  it.each(['UTC', 'GMT', 'Etc/GMT+3', ''])('%s não resolve cidade', (timezone) => {
    expect(cityFromTimezone(timezone)).toBeNull();
  });
});

describe('pickGeocodingResult', () => {
  it('escolhe o resultado cujo fuso bate com o do perfil', () => {
    const homonym = result({ name: 'Sao Paulo', timezone: 'America/Manaus' });
    const right = result({});
    expect(pickGeocodingResult([homonym, right], 'America/Sao_Paulo')).toBe(right);
  });

  it('sem fuso igual não resolve (vira "Clima indisponível")', () => {
    expect(
      pickGeocodingResult([result({ timezone: 'Europe/Lisbon' })], 'America/Sao_Paulo')
    ).toBeNull();
    expect(pickGeocodingResult([], 'America/Sao_Paulo')).toBeNull();
  });
});

describe('locationLabel', () => {
  it('monta "Cidade, PAÍS"', () => {
    expect(locationLabel(result({}))).toBe('São Paulo, BRASIL');
  });

  it('cai no código do país e, sem ele, só na cidade', () => {
    expect(locationLabel(result({ country: null }))).toBe('São Paulo, BR');
    expect(locationLabel(result({ country: null, countryCode: null }))).toBe('São Paulo');
  });
});

describe('roundCoordinate', () => {
  it('arredonda a 2 casas decimais', () => {
    expect(roundCoordinate(-23.550519)).toBe(-23.55);
    expect(roundCoordinate(-46.633309)).toBe(-46.63);
    expect(roundCoordinate(10.005)).toBeCloseTo(10.01, 2);
  });
});

describe('weatherDescription', () => {
  it('traduz códigos WMO', () => {
    expect(weatherDescription(0)).toBe('Céu limpo');
    expect(weatherDescription(95)).toBe('Trovoada');
  });

  it('código desconhecido não quebra', () => {
    expect(weatherDescription(1234)).toBe('Tempo indefinido');
  });
});
