import { describe, expect, it } from 'vitest';
import type { PyramidNote } from '@/types/catalog';
import { fromPerfumeRow, groupNotesByPosition, type PerfumeRow } from './perfume';

const note = (slug: string, position: PyramidNote['position']): PyramidNote => ({
  slug,
  name: slug,
  family: 'woody',
  position,
  description: null,
});

describe('groupNotesByPosition', () => {
  it('agrupa na ordem topo, coração, fundo e descarta posição vazia', () => {
    const groups = groupNotesByPosition([
      note('cedro', 'base'),
      note('limao', 'top'),
      note('bergamota', 'top'),
    ]);
    expect(groups.map((group) => group.position)).toEqual(['top', 'base']);
    expect(groups[0]?.notes.map((n) => n.slug)).toEqual(['limao', 'bergamota']);
  });

  it('sem notas não há grupos', () => {
    expect(groupNotesByPosition([])).toEqual([]);
  });
});

describe('fromPerfumeRow', () => {
  const row: PerfumeRow = {
    id: 'p1',
    slug: 'malbec',
    name: 'Malbec',
    concentration: 'edp',
    gender: 'unisex',
    release_year: null,
    image_path: null,
    brand: { name: 'Marca', slug: 'marca' },
    perfume_notes: [
      { note: { family: 'woody' } },
      { note: { family: 'citrus' } },
      { note: { family: 'woody' } },
    ],
  };

  it('expõe a família de cada nota, com repetição, e as famílias distintas na ordem do enum', () => {
    const summary = fromPerfumeRow(row);
    expect(summary.noteFamilies).toEqual(['woody', 'citrus', 'woody']);
    expect(summary.families).toEqual(['citrus', 'woody']);
  });

  it('sem notas, as duas listas ficam vazias', () => {
    const summary = fromPerfumeRow({ ...row, perfume_notes: [] });
    expect(summary.noteFamilies).toEqual([]);
    expect(summary.families).toEqual([]);
  });
});
