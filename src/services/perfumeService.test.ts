import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';

const maybeSingle = vi.fn();
const select = vi.fn();
const getPublicUrl = vi.fn(() => ({
  data: { publicUrl: 'https://cdn.test/malbec-signature.webp' },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: select.mockReturnValue({ eq: () => ({ maybeSingle }) }) }),
    storage: { from: () => ({ getPublicUrl }) },
  },
}));

const { perfumeService } = await import('./perfumeService');

const row = {
  id: 'p1',
  slug: 'malbec-signature',
  name: 'Malbec Signature',
  description: null,
  concentration: 'edp',
  gender: 'unisex',
  release_year: 2022,
  image_path: null,
  lowest_price_cents: 24900,
  store_name: 'O Boticário',
  store_url: 'https://www.boticario.com.br',
  perfumer: 'Olivier Cresp',
  brand: { name: 'O Boticário', slug: 'o-boticario' },
  perfume_notes: [
    {
      position: 'base',
      note: {
        slug: 'vetiver',
        name: 'Vetiver',
        family: 'woody',
        description: 'Raiz aromática.',
      },
    },
    {
      position: 'top',
      note: { slug: 'bergamota', name: 'Bergamota', family: 'citrus', description: null },
    },
  ],
};

describe('perfumeService.getBySlug', () => {
  beforeEach(() => vi.clearAllMocks());

  it('pede perfume, marca e notas numa consulta só', async () => {
    maybeSingle.mockResolvedValue({ data: row, error: null });
    await perfumeService.getBySlug('malbec-signature');
    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith(
      '*, brand:brands(*), perfume_notes(position, note:notes(*))'
    );
  });

  it('monta o detalhe, com as notas em ordem alfabética e a posição de cada uma', async () => {
    maybeSingle.mockResolvedValue({ data: row, error: null });
    const detail = await perfumeService.getBySlug('malbec-signature');
    expect(detail).toMatchObject({
      name: 'Malbec Signature',
      brandName: 'O Boticário',
      imageUrl: null,
      lowestPriceCents: 24900,
      storeName: 'O Boticário',
      storeUrl: 'https://www.boticario.com.br',
      perfumer: 'Olivier Cresp',
    });
    expect(detail.notes.map((n) => `${n.name}:${n.position}`)).toEqual([
      'Bergamota:top',
      'Vetiver:base',
    ]);
  });

  it('leva a descrição da nota (ou null) para a pirâmide', async () => {
    maybeSingle.mockResolvedValue({ data: row, error: null });
    const detail = await perfumeService.getBySlug('malbec-signature');
    expect(detail.notes.map((n) => n.description)).toEqual([null, 'Raiz aromática.']);
  });

  it('com image_path devolve a URL pública do bucket', async () => {
    maybeSingle.mockResolvedValue({
      data: { ...row, image_path: 'malbec-signature.webp' },
      error: null,
    });
    expect((await perfumeService.getBySlug('malbec-signature')).imageUrl).toBe(
      'https://cdn.test/malbec-signature.webp'
    );
  });

  it('slug inexistente vira AppError not_found', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(perfumeService.getBySlug('nao-existe')).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(perfumeService.getBySlug('nao-existe')).rejects.toBeInstanceOf(AppError);
  });

  it('erro do Supabase vira AppError sem a mensagem crua', async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: { code: 'XX000', message: 'boom interno' },
    });
    const error = await perfumeService.getBySlug('x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).message).not.toContain('boom');
  });
});
