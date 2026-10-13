import { describe, expect, it } from 'vitest';
import type { OlfactoryDna } from '@/types/dna';
import {
  dnaFootnote,
  dnaShares,
  isDnaReady,
  perfumesMissing,
  progressText,
  wishLine,
} from './olfactoryDna';

const dna = (overrides: Partial<OlfactoryDna> = {}): OlfactoryDna => ({
  families: [
    { family: 'woody', weight: 6 },
    { family: 'citrus', weight: 3 },
    { family: 'floral', weight: 1 },
  ],
  topNotes: [],
  wishFamily: null,
  wantedCount: 0,
  perfumeCount: 4,
  memorialDays: 7,
  ...overrides,
});

describe('isDnaReady / perfumesMissing (D3)', () => {
  it.each([
    [0, false, 3],
    [2, false, 1],
    [3, true, 0],
    [10, true, 0],
  ])('%i perfumes -> pronto %s, faltam %i', (perfumeCount, ready, missing) => {
    expect(isDnaReady(dna({ perfumeCount }))).toBe(ready);
    expect(perfumesMissing(dna({ perfumeCount }))).toBe(missing);
  });
});

describe('progressText', () => {
  it('singular e plural', () => {
    expect(progressText(1)).toBe('Falta 1 perfume para o seu DNA aparecer');
    expect(progressText(2)).toBe('Faltam 2 perfumes para o seu DNA aparecer');
    expect(progressText(3)).toBe('Faltam 3 perfumes para o seu DNA aparecer');
  });
});

describe('dnaShares', () => {
  it('converte pesos em frações do total, do maior para o menor', () => {
    const shares = dnaShares(dna());
    expect(shares.map((s) => s.family)).toEqual(['woody', 'citrus', 'floral']);
    expect(shares[0]?.share).toBeCloseTo(0.6);
    expect(shares.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1);
  });

  it('sem pesos devolve vazio', () => {
    expect(dnaShares(dna({ families: [] }))).toEqual([]);
  });
});

describe('wishLine (D2)', () => {
  it('com 3 ou mais em "Quero" e família diferente da principal, aponta para ela', () => {
    expect(wishLine(dna({ wantedCount: 3, wishFamily: 'oriental' }))).toBe(
      'Seus desejos apontam para Oriental'
    );
  });

  it('com menos de 3 em "Quero", não diz nada', () => {
    expect(wishLine(dna({ wantedCount: 2, wishFamily: 'oriental' }))).toBeNull();
  });

  it('família dos desejos igual à principal, não diz nada', () => {
    expect(wishLine(dna({ wantedCount: 5, wishFamily: 'woody' }))).toBeNull();
  });

  it('sem família de desejo, não diz nada', () => {
    expect(wishLine(dna({ wantedCount: 5, wishFamily: null }))).toBeNull();
  });
});

describe('dnaFootnote', () => {
  it('conta perfumes e dias com plural certo', () => {
    expect(dnaFootnote(dna({ perfumeCount: 5, memorialDays: 12 }))).toBe(
      'Baseado em 5 perfumes e 12 dias no memorial.'
    );
    expect(dnaFootnote(dna({ perfumeCount: 3, memorialDays: 1 }))).toBe(
      'Baseado em 3 perfumes e 1 dia no memorial.'
    );
    expect(dnaFootnote(dna({ perfumeCount: 3, memorialDays: 0 }))).toBe(
      'Baseado em 3 perfumes e 0 dias no memorial.'
    );
  });
});
