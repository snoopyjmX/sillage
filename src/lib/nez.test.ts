import { describe, expect, it } from 'vitest';
import type { PerfumeDetail } from '@/types/catalog';
import { buildPerfumeContext } from './nez';

const perfume: PerfumeDetail = {
  id: 'p1',
  slug: 'amyi',
  name: 'Amyi 2.15',
  description: null,
  brandName: 'Amyi',
  brandSlug: 'amyi',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: null,
  imageUrl: null,
  notes: [
    { slug: 'bergamota', name: 'Bergamota', family: 'citrus', position: 'top' },
    { slug: 'baunilha', name: 'Baunilha', family: 'oriental', position: 'base' },
  ],
};

describe('buildPerfumeContext', () => {
  it('lista perfume, notas por camada e famílias', () => {
    expect(buildPerfumeContext(perfume)).toBe(
      'Amyi 2.15, da marca Amyi\nTopo: Bergamota\nFundo: Baunilha\nFamílias olfativas: Cítrico, Oriental'
    );
  });
});
