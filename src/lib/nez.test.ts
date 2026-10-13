import { describe, expect, it } from 'vitest';
import type { PerfumeDetail } from '@/types/catalog';
import { buildPerfumeContext } from './nez';

const perfume: PerfumeDetail = {
  id: 'p1',
  slug: 'malbec-signature',
  name: 'Malbec Signature',
  description: null,
  brandName: 'O Boticário',
  brandSlug: 'o-boticario',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: null,
  imageUrl: null,
  lowestPriceCents: null,
  storeName: null,
  storeUrl: null,
  perfumer: null,
  notes: [
    { slug: 'bergamota', name: 'Bergamota', family: 'citrus', position: 'top', description: null },
    { slug: 'baunilha', name: 'Baunilha', family: 'oriental', position: 'base', description: null },
  ],
};

describe('buildPerfumeContext', () => {
  it('lista perfume, notas por camada e famílias', () => {
    expect(buildPerfumeContext(perfume)).toBe(
      'Malbec Signature, da marca O Boticário\nTopo: Bergamota\nFundo: Baunilha\nFamílias olfativas: Cítrico, Oriental'
    );
  });
});
