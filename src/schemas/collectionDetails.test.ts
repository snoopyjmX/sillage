import { describe, expect, it } from 'vitest';
import { collectionDetailsSchema, parseVolumeInput } from './collectionDetails';

describe('collectionDetailsSchema (RN11)', () => {
  it.each([
    [{ format: null, volumeMl: null }],
    [{ format: 'bottle', volumeMl: 100 }],
    [{ format: 'decant', volumeMl: 2.5 }],
    [{ format: 'sample', volumeMl: null }],
    [{ format: 'bottle', volumeMl: 1000 }],
  ])('aceita %j', (value) => {
    expect(collectionDetailsSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    ['volume sem formato', { format: null, volumeMl: 10 }],
    ['volume zero', { format: 'bottle', volumeMl: 0 }],
    ['volume negativo', { format: 'bottle', volumeMl: -5 }],
    ['volume acima de 1000 ml', { format: 'bottle', volumeMl: 1000.1 }],
    ['duas casas decimais', { format: 'decant', volumeMl: 2.55 }],
    ['formato desconhecido', { format: 'garrafa', volumeMl: 10 }],
    ['volume fora de número', { format: 'bottle', volumeMl: Number.NaN }],
  ])('rejeita %s', (_name, value) => {
    expect(collectionDetailsSchema.safeParse(value).success).toBe(false);
  });
});

describe('parseVolumeInput', () => {
  it.each([
    ['10', 10],
    ['2,5', 2.5],
    ['2.5', 2.5],
    ['  15  ', 15],
    ['', null],
    ['   ', null],
  ])('%j -> %j', (text, expected) => {
    expect(parseVolumeInput(text)).toBe(expected);
  });

  it.each(['abc', '1,2,3', '-5', '10ml', '1e3'])('texto inválido %j vira NaN', (text) => {
    expect(parseVolumeInput(text)).toBeNaN();
  });
});
