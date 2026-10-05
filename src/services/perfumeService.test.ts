import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';

const maybeSingle = vi.fn();
const select = vi.fn();
const getPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://cdn.test/amyi.webp' } }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: select.mockReturnValue({ eq: () => ({ maybeSingle }) }) }),
    storage: { from: () => ({ getPublicUrl }) },
  },
}));

const { perfumeService } = await import('./perfumeService');

const row = {
  id: 'p1',
  slug: 'amyi-2-15',
  name: 'Amyi 2.15',
  description: null,
  concentration: 'edp',
  gender: 'unisex',
  release_year: 2022,
  image_path: null,
  brand: { name: 'Amyi', slug: 'amyi' },
  perfume_notes: [
    { position: 'base', note: { slug: 'vetiver', name: 'Vetiver', family: 'woody' } },
    { position: 'top', note: { slug: 'bergamota', name: 'Bergamota', family: 'citrus' } },
  ],
};

describe('perfumeService.getBySlug', () => {
  beforeEach(() => vi.clearAllMocks());

  it('pede perfume, marca e notas numa consulta só', async () => {
    maybeSingle.mockResolvedValue({ data: row, error: null });
    await perfumeService.getBySlug('amyi-2-15');
    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith(
      '*, brand:brands(*), perfume_notes(position, note:notes(*))'
    );
  });

  it('monta o detalhe, com as notas em ordem alfabética e a posição de cada uma', async () => {
    maybeSingle.mockResolvedValue({ data: row, error: null });
    const detail = await perfumeService.getBySlug('amyi-2-15');
    expect(detail).toMatchObject({ name: 'Amyi 2.15', brandName: 'Amyi', imageUrl: null });
    expect(detail.notes.map((n) => `${n.name}:${n.position}`)).toEqual([
      'Bergamota:top',
      'Vetiver:base',
    ]);
  });

  it('com image_path devolve a URL pública do bucket', async () => {
    maybeSingle.mockResolvedValue({ data: { ...row, image_path: 'amyi.webp' }, error: null });
    expect((await perfumeService.getBySlug('amyi-2-15')).imageUrl).toBe(
      'https://cdn.test/amyi.webp'
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
