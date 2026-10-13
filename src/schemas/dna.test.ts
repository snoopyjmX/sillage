import { describe, expect, it } from 'vitest';
import { parseOlfactoryDna } from './dna';

const valid = {
  families: [{ family: 'woody', weight: 5 }],
  top_notes: [{ slug: 'cedro', name: 'Cedro', family: 'woody', weight: 4 }],
  wish_family: null,
  wanted_count: 0,
  perfume_count: 3,
  memorial_days: 2,
};

describe('parseOlfactoryDna', () => {
  it('converte a resposta da função para o formato do app', () => {
    expect(parseOlfactoryDna(valid)).toEqual({
      families: [{ family: 'woody', weight: 5 }],
      topNotes: [{ slug: 'cedro', name: 'Cedro', family: 'woody', weight: 4 }],
      wishFamily: null,
      wantedCount: 0,
      perfumeCount: 3,
      memorialDays: 2,
    });
  });

  it.each([
    ['null', null],
    ['família desconhecida', { ...valid, families: [{ family: 'x', weight: 1 }] }],
    ['peso negativo', { ...valid, perfume_count: -1 }],
    ['campo faltando', { ...valid, memorial_days: undefined }],
  ])('rejeita resposta fora do formato: %s', (_name, value) => {
    expect(parseOlfactoryDna(value)).toBeNull();
  });
});
