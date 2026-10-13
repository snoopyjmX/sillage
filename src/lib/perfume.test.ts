import { describe, expect, it } from 'vitest';
import type { PyramidNote } from '@/types/catalog';
import { groupNotesByPosition } from './perfume';

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
