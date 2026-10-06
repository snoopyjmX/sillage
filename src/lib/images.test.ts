import { describe, expect, it } from 'vitest';
import { imageSources, variantUrl } from './images';

const BASE =
  'https://x.supabase.co/storage/v1/object/public/perfume-images/o-boticario/malbec.webp';

describe('imageSources', () => {
  it('monta a variante e deixa o original como fallback', () => {
    expect(imageSources(BASE, 'medium')).toEqual([BASE.replace('.webp', '-medium.webp'), BASE]);
    expect(variantUrl(BASE, 'thumb')).toBe(BASE.replace('.webp', '-thumb.webp'));
    expect(variantUrl(BASE, 'large')).toBe(BASE.replace('.webp', '-large.webp'));
  });

  it('sem extensão .webp só há o original', () => {
    expect(imageSources('https://x/y.png', 'medium')).toEqual(['https://x/y.png']);
  });

  it('sem imagem não há fontes', () => {
    expect(imageSources(null, 'medium')).toEqual([]);
    expect(imageSources(undefined, 'thumb')).toEqual([]);
  });
});
