import { beforeEach, describe, expect, it, vi } from 'vitest';

const maybeSingle = vi.fn();
const select = vi.fn();
const getPublicUrl = vi.fn((path: string) => ({
  data: { publicUrl: `https://cdn.test/${path}` },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: select.mockReturnValue({ eq: () => ({ maybeSingle }) }) }),
    storage: { from: () => ({ getPublicUrl }) },
  },
}));

const { perfumerService } = await import('./perfumerService');

const perfumeRow = (slug: string, name: string, imagePath: string | null) => ({
  perfume: {
    id: slug,
    slug,
    name,
    concentration: 'edp',
    gender: 'unisex',
    release_year: 2022,
    image_path: imagePath,
    brand: { name: 'Marca', slug: 'marca' },
    perfume_notes: [{ note: { family: 'woody' } }],
  },
});

const row = {
  id: 'n1',
  slug: 'olivier-cresp',
  name: 'Olivier Cresp',
  bio: 'Nariz francês.',
  country: 'França',
  perfume_perfumers: [perfumeRow('zeta', 'Zeta', null), perfumeRow('alfa', 'Alfa', 'alfa.webp')],
};

describe('perfumerService.getBySlug', () => {
  beforeEach(() => vi.clearAllMocks());

  it('pede o perfumista e os perfumes numa consulta só', async () => {
    maybeSingle.mockResolvedValue({ data: row, error: null });
    await perfumerService.getBySlug('olivier-cresp');
    expect(select).toHaveBeenCalledTimes(1);
    expect(select.mock.calls[0]?.[0]).toContain('perfume_perfumers(');
  });

  it('monta a ficha e ordena os perfumes por nome, com a URL pública da imagem', async () => {
    maybeSingle.mockResolvedValue({ data: row, error: null });
    const perfumer = await perfumerService.getBySlug('olivier-cresp');
    expect(perfumer).toMatchObject({
      id: 'n1',
      slug: 'olivier-cresp',
      name: 'Olivier Cresp',
      bio: 'Nariz francês.',
      country: 'França',
    });
    expect(perfumer.perfumes.map((p) => p.name)).toEqual(['Alfa', 'Zeta']);
    expect(perfumer.perfumes[0]?.imageUrl).toBe('https://cdn.test/alfa.webp');
    expect(perfumer.perfumes[1]?.imageUrl).toBeNull();
  });

  it('slug inexistente vira AppError not_found', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(perfumerService.getBySlug('nao-existe')).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('erro do Supabase nunca chega cru', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'relation x does not exist' } });
    const error = await perfumerService.getBySlug('x').catch((caught: unknown) => caught);
    expect(String((error as Error).message)).not.toContain('relation x');
  });
});
