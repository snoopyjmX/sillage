import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const getPublicUrl = vi.fn((path: string) => ({
  data: { publicUrl: `https://cdn.test/${path}` },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (name: string, args: unknown) => rpc(name, args),
    storage: { from: () => ({ getPublicUrl }) },
  },
}));

const { recapService } = await import('./recapService');

const perfume = (slug: string, imagePath: string | null, days: number) => ({
  slug,
  name: slug.toUpperCase(),
  brand_name: 'Granado',
  image_path: imagePath,
  days,
});

const row = {
  year: 2026,
  days_worn: 248,
  days_elapsed: 287,
  consistency: 0.8641,
  signature: perfume('bossa', 'bossa.webp', 80),
  seasons: {
    summer: perfume('bossa', 'bossa.webp', 40),
    autumn: null,
    winter: perfume('boemia', null, 12),
    spring: null,
  },
  top_note: { slug: 'cedro', name: 'Cedro', family: 'woody', weight: 90 },
  families: {
    first_semester: [{ family: 'citrus', weight: 9 }],
    second_semester: [{ family: 'woody', weight: 7 }],
  },
};

describe('recapService.get', () => {
  beforeEach(() => rpc.mockReset());

  it('chama a função do banco com o ano', async () => {
    rpc.mockResolvedValue({ data: row, error: null });
    await recapService.get(2026);
    expect(rpc).toHaveBeenCalledWith('get_annual_recap', { p_year: 2026 });
  });

  it('converte para o formato do app, com a URL pública das imagens', async () => {
    rpc.mockResolvedValue({ data: row, error: null });
    const recap = await recapService.get(2026);
    expect(recap).toMatchObject({
      year: 2026,
      daysWorn: 248,
      daysElapsed: 287,
      consistency: 0.8641,
      signature: {
        slug: 'bossa',
        name: 'BOSSA',
        brandName: 'Granado',
        imageUrl: 'https://cdn.test/bossa.webp',
        days: 80,
      },
      topNote: { slug: 'cedro', name: 'Cedro', family: 'woody', weight: 90 },
      families: {
        firstSemester: [{ family: 'citrus', weight: 9 }],
        secondSemester: [{ family: 'woody', weight: 7 }],
      },
    });
    expect(recap.seasons.autumn).toBeNull();
    expect(recap.seasons.winter?.imageUrl).toBeNull();
  });

  it('ano sem dados (assinatura, nota e estações nulas) é uma resposta válida', async () => {
    rpc.mockResolvedValue({
      data: {
        ...row,
        days_worn: 0,
        consistency: 0,
        signature: null,
        top_note: null,
        seasons: { summer: null, autumn: null, winter: null, spring: null },
        families: { first_semester: [], second_semester: [] },
      },
      error: null,
    });
    const recap = await recapService.get(2026);
    expect(recap.signature).toBeNull();
    expect(recap.topNote).toBeNull();
    expect(recap.daysWorn).toBe(0);
  });

  it.each([
    ['null', null],
    ['texto', 'oi'],
    ['sem days_worn', { ...row, days_worn: undefined }],
    ['família desconhecida', { ...row, top_note: { ...row.top_note, family: 'pizza' } }],
    ['consistência acima de 1', { ...row, consistency: 1.2 }],
    ['dias negativos', { ...row, days_worn: -1 }],
  ])('resposta fora do formato (%s) vira recap_failed', async (_label, data) => {
    rpc.mockResolvedValue({ data, error: null });
    await expect(recapService.get(2026)).rejects.toMatchObject({ code: 'recap_failed' });
  });

  it('erro do Supabase nunca chega cru', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42P01', message: 'relation x missing' } });
    const error = await recapService.get(2026).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: 'recap_failed' });
    expect(String((error as Error).message)).not.toContain('relation x');
  });

  it('sem rede continua sendo network', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });
    await expect(recapService.get(2026)).rejects.toMatchObject({ code: 'network' });
  });
});
