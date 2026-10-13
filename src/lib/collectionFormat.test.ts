import { describe, expect, it } from 'vitest';
import { FORMAT_VOLUMES } from '@/constants/collection';
import {
  formatBadgeLabel,
  formatVolume,
  isSuggestedVolume,
  volumeToInput,
} from './collectionFormat';

describe('formatVolume', () => {
  it('inteiro sem casa decimal, fracionado com vírgula', () => {
    expect(formatVolume(100)).toBe('100 ml');
    expect(formatVolume(2.5)).toBe('2,5 ml');
    expect(formatVolume(1000)).toBe('1.000 ml');
  });
});

describe('formatBadgeLabel (D8)', () => {
  it('formato e volume', () => {
    expect(formatBadgeLabel({ format: 'bottle', volumeMl: 100 })).toBe('Frasco 100 ml');
    expect(formatBadgeLabel({ format: 'decant', volumeMl: 10 })).toBe('Decant 10 ml');
    expect(formatBadgeLabel({ format: 'sample', volumeMl: 2 })).toBe('Amostra 2 ml');
  });

  it('só o formato, quando falta o volume', () => {
    expect(formatBadgeLabel({ format: 'decant', volumeMl: null })).toBe('Decant');
  });

  it('sem formato, sem selo: não presumimos "Frasco"', () => {
    expect(formatBadgeLabel({ format: null, volumeMl: null })).toBeNull();
  });
});

describe('volumes sugeridos (D9)', () => {
  it('são os de cada formato', () => {
    expect(FORMAT_VOLUMES.bottle).toEqual([30, 50, 75, 100, 200]);
    expect(FORMAT_VOLUMES.decant).toEqual([2, 5, 10, 15, 20]);
    expect(FORMAT_VOLUMES.sample).toEqual([1, 2, 3]);
  });

  it('isSuggestedVolume respeita o formato', () => {
    expect(isSuggestedVolume('decant', 10)).toBe(true);
    expect(isSuggestedVolume('decant', 100)).toBe(false);
    expect(isSuggestedVolume('bottle', 100)).toBe(true);
  });
});

describe('volumeToInput', () => {
  it('usa vírgula decimal e vazio para nulo', () => {
    expect(volumeToInput(2.5)).toBe('2,5');
    expect(volumeToInput(10)).toBe('10');
    expect(volumeToInput(null)).toBe('');
  });
});
