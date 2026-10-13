import { describe, expect, it } from 'vitest';
import type { PyramidNote } from '@/types/catalog';
import { dominantFamilies, familyBreakdown, groupByLayer } from './pyramid';

const note = (
  slug: string,
  family: PyramidNote['family'],
  position: PyramidNote['position']
): PyramidNote => ({ slug, name: slug, family, position, description: null });

const notes = [
  note('a', 'woody', 'base'),
  note('b', 'citrus', 'top'),
  note('c', 'woody', 'base'),
  note('d', 'spicy', 'heart'),
  note('e', 'citrus', 'top'),
  note('f', 'woody', 'heart'),
];

describe('groupByLayer', () => {
  it('ordena Topo, Coração, Fundo e omite camadas vazias', () => {
    expect(groupByLayer(notes).map((l) => l.position)).toEqual(['top', 'heart', 'base']);
    expect(
      groupByLayer(notes.filter((n) => n.position !== 'heart')).map((l) => l.position)
    ).toEqual(['top', 'base']);
    expect(groupByLayer([])).toEqual([]);
  });
});

describe('familyBreakdown', () => {
  it('conta e calcula a fração, do maior para o menor', () => {
    expect(familyBreakdown(notes)).toEqual([
      { family: 'woody', count: 3, share: 0.5 },
      { family: 'citrus', count: 2, share: 2 / 6 },
      { family: 'spicy', count: 1, share: 1 / 6 },
    ]);
  });

  it('desempata pela ordem de FAMILIES (cítrico antes de amadeirado)', () => {
    const tie = [note('x', 'woody', 'top'), note('y', 'citrus', 'top')];
    expect(familyBreakdown(tie).map((f) => f.family)).toEqual(['citrus', 'woody']);
  });

  it('sem notas devolve vazio', () => {
    expect(familyBreakdown([])).toEqual([]);
  });
});

describe('dominantFamilies', () => {
  it('devolve as duas primeiras por padrão e respeita o máximo', () => {
    expect(dominantFamilies(notes)).toEqual(['woody', 'citrus']);
    expect(dominantFamilies(notes, 1)).toEqual(['woody']);
    expect(dominantFamilies(notes, 5)).toEqual(['woody', 'citrus', 'spicy']);
  });
});
