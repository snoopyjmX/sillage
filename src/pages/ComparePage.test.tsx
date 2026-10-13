import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';
import type { PerfumeDetail, PerfumeSummary } from '@/types/catalog';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));

const getBySlug = vi.fn();
const search = vi.fn();
vi.mock('@/services/perfumeService', () => ({
  perfumeService: {
    getBySlug: (slug: string) => getBySlug(slug),
    search: (...args: unknown[]) => search(...args),
    getSimilar: () => Promise.resolve([]),
  },
}));
const getPerfumeReviews = vi.fn();
vi.mock('@/services/reviewService', () => ({
  reviewService: {
    getPerfumeReviews: (id: string) => getPerfumeReviews(id),
    getUserReview: () => Promise.resolve(null),
  },
}));
const listCollection = vi.fn();
vi.mock('@/services/collectionService', () => ({
  collectionService: { list: () => listCollection() },
}));
const getDna = vi.fn();
vi.mock('@/services/dnaService', () => ({ dnaService: { get: () => getDna() } }));
const getCurrent = vi.fn();
vi.mock('@/services/weatherService', () => ({
  weatherService: {
    getCurrent: (...args: unknown[]) => getCurrent(...args),
    searchCity: () =>
      Promise.resolve([
        {
          name: 'São Paulo',
          country: 'Brasil',
          countryCode: 'BR',
          latitude: -23.55,
          longitude: -46.63,
          timezone: 'America/Sao_Paulo',
        },
      ]),
  },
}));
vi.mock('@/services/dailyService', () => ({
  dailyService: {
    getTimezone: () => Promise.resolve('America/Sao_Paulo'),
    getOverview: () => Promise.resolve({ today: null, history: [] }),
  },
}));

const detail = (
  slug: string,
  name: string,
  overrides: Partial<PerfumeDetail> = {}
): PerfumeDetail => ({
  id: `id-${slug}`,
  slug,
  name,
  description: null,
  brandName: 'O Boticário',
  brandSlug: 'o-boticario',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2022,
  imageUrl: null,
  lowestPriceCents: null,
  storeName: null,
  storeUrl: null,
  perfumer: null,
  notes: [
    { slug: 'bergamota', name: 'Bergamota', family: 'citrus', position: 'top', description: null },
    { slug: 'vetiver', name: 'Vetiver', family: 'woody', position: 'base', description: null },
  ],
  ...overrides,
});

const MALBEC = detail('malbec-signature', 'Malbec Signature', {
  lowestPriceCents: 24900,
  storeName: 'Loja Alfa',
});
const BOSSA = detail('bossa', 'Bossa', {
  notes: [
    { slug: 'jasmim', name: 'Jasmim', family: 'floral', position: 'heart', description: null },
  ],
});

const dna = {
  families: [
    { family: 'woody', weight: 6 },
    { family: 'citrus', weight: 4 },
  ],
  topNotes: [{ slug: 'vetiver', name: 'Vetiver', family: 'woody', weight: 5 }],
  wishFamily: null,
  wantedCount: 0,
  perfumeCount: 5,
  memorialDays: 2,
};

const summaryOf = (avgLongevity: number | null, avgProjection: number | null) => ({
  summary: { count: avgLongevity === null ? 0 : 3, avgLongevity, avgProjection },
  reviews: [],
});

const summary = (slug: string): PerfumeSummary => ({
  id: `id-${slug}`,
  slug,
  name: slug === 'bossa' ? 'Bossa' : 'Boêmia',
  brandName: 'Marca X',
  brandSlug: 'marca-x',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2020,
  imagePath: null,
  families: ['woody'],
});

const open = (query = 'a=malbec-signature&b=bossa') => renderApp(`/compare?${query}`);

describe('ComparePage (Fase 18B)', () => {
  beforeEach(() => {
    auth.reset();
    auth.setInitialSession(fakeSession());
    getBySlug.mockReset();
    getBySlug.mockImplementation((slug: string) =>
      slug === 'malbec-signature'
        ? Promise.resolve(MALBEC)
        : slug === 'bossa'
          ? Promise.resolve(BOSSA)
          : Promise.reject(new AppError('not_found'))
    );
    search.mockReset();
    search.mockResolvedValue({ items: [summary('bossa'), summary('boemia')], total: 2 });
    getPerfumeReviews.mockReset();
    getPerfumeReviews.mockImplementation((id: string) =>
      Promise.resolve(id === 'id-malbec-signature' ? summaryOf(4, 3) : summaryOf(null, null))
    );
    listCollection.mockReset();
    listCollection.mockResolvedValue([]);
    getDna.mockReset();
    getDna.mockResolvedValue(dna);
    getCurrent.mockReset();
    getCurrent.mockResolvedValue({ temperature: 28, humidity: 60, code: 0 });
  });

  it('visitante é levado à Landing (rota privada)', async () => {
    auth.setInitialSession(null);
    const { router } = open();
    await screen.findByRole('heading', { name: 'Descubra perfumes pelas suas notas', level: 1 });
    expect(router.state.location.pathname).toBe('/');
    expect(getBySlug).not.toHaveBeenCalled();
  });

  it('sem escolha: dois lados vazios com o botão de escolher e nada a comparar', async () => {
    open('');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Comparar perfumes' })
    ).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Escolher perfume' })).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: 'Pirâmide' })).not.toBeInTheDocument();
    expect(getBySlug).not.toHaveBeenCalled();
  });

  it('com dois perfumes mostra o cabeçalho de cada um e as seis linhas da comparação', async () => {
    open();
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Malbec Signature' })
    ).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Bossa' })).toBeVisible();
    for (const title of [
      'Pirâmide',
      'Famílias',
      'Fixação e rastro',
      'Clima de hoje',
      'Melhor preço',
      'Combina com você?',
    ]) {
      expect(await screen.findByRole('heading', { level: 2, name: title })).toBeVisible();
    }
  });

  it('cada célula traz o valor do seu perfume: fixação, preço e o que não há', async () => {
    open();
    const performance = await screen.findByRole('region', { name: 'Fixação e rastro' });
    const malbec = within(performance).getByRole('group', { name: 'Malbec Signature' });
    expect(within(malbec).getByRole('img', { name: 'Fixação: 4,0 de 5' })).toBeVisible();
    const bossa = within(performance).getByRole('group', { name: 'Bossa' });
    expect(within(bossa).getByText('Sem avaliações')).toBeVisible();

    const price = screen.getByRole('region', { name: 'Melhor preço' });
    expect(
      within(within(price).getByRole('group', { name: 'Malbec Signature' })).getByText('R$ 249,00')
    ).toBeVisible();
    expect(within(price).getByText('Sem oferta encontrada')).toBeVisible();
  });

  it('a pirâmide resumida lista as notas por camada, em texto', async () => {
    open();
    const pyramid = await screen.findByRole('region', { name: 'Pirâmide' });
    const malbec = within(pyramid).getByRole('group', { name: 'Malbec Signature' });
    expect(within(malbec).getByText('Bergamota')).toBeVisible();
    expect(within(malbec).getByText('Topo')).toBeVisible();
    expect(within(malbec).getByText('Fundo')).toBeVisible();
    expect(
      within(within(pyramid).getByRole('group', { name: 'Bossa' })).getByText('Jasmim')
    ).toBeVisible();
  });

  it('o clima adequado hoje vem do clima de hoje; sem clima, avisa', async () => {
    open();
    const climate = await screen.findByRole('region', { name: 'Clima de hoje' });
    await waitFor(() =>
      expect(within(climate).getAllByRole('meter', { name: 'Clima adequado hoje' })).toHaveLength(2)
    );
  });

  it('sem clima, a linha diz "Clima indisponível"', async () => {
    getCurrent.mockRejectedValue(new AppError('weather_failed'));
    open();
    const climate = await screen.findByRole('region', { name: 'Clima de hoje' });
    await waitFor(() => expect(within(climate).getAllByText('Clima indisponível')).toHaveLength(2));
  });

  it('afinidade: rótulo com motivo para quem não tem; "Você já tem" para o que está em Tenho', async () => {
    listCollection.mockResolvedValue([
      {
        status: 'owned',
        format: null,
        volumeMl: null,
        updatedAt: 'x',
        perfume: summary('malbec-signature'),
      },
    ]);
    // O id do perfume vem do detalhe; o item da coleção precisa casar
    listCollection.mockResolvedValue([
      {
        status: 'owned',
        format: null,
        volumeMl: null,
        updatedAt: 'x',
        perfume: { ...summary('malbec-signature'), id: 'id-malbec-signature' },
      },
    ]);
    open();
    const row = await screen.findByRole('region', { name: 'Combina com você?' });
    await waitFor(() =>
      expect(
        within(within(row).getByRole('group', { name: 'Malbec Signature' })).getByText(
          'Você já tem'
        )
      ).toBeVisible()
    );
    expect(
      within(within(row).getByRole('group', { name: 'Bossa' })).getByText(/^Afinidade/)
    ).toBeVisible();
  });

  it('DNA ainda se formando (D3): diz isso, sem rótulo', async () => {
    getDna.mockResolvedValue({ ...dna, perfumeCount: 1 });
    open();
    const row = await screen.findByRole('region', { name: 'Combina com você?' });
    await waitFor(() =>
      expect(within(row).getAllByText('Seu DNA ainda está se formando')).toHaveLength(2)
    );
    expect(within(row).queryByText(/^Afinidade/)).not.toBeInTheDocument();
  });

  it('os dois lados iguais pedem dois perfumes diferentes e não comparam', async () => {
    open('a=bossa&b=bossa');
    expect(
      await screen.findByText('Escolha dois perfumes diferentes para comparar.')
    ).toBeVisible();
    // Espera o único lado que busca carregar antes de afirmar o que não deve existir
    expect(await screen.findByRole('heading', { level: 2, name: 'Bossa' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Pirâmide' })).not.toBeInTheDocument();
    // O segundo lado, igual ao primeiro, não busca: só há consultas de 'bossa'
    for (const [slug] of getBySlug.mock.calls) expect(slug).toBe('bossa');
  });

  it('slug inexistente mostra o erro no lado dele, com tentar de novo, e não monta a tabela', async () => {
    open('a=malbec-signature&b=nao-existe');
    expect(await screen.findByText('Não encontramos o que você procurou.')).toBeVisible();
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Malbec Signature' })
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Pirâmide' })).not.toBeInTheDocument();
  });

  it('slug de URL inválido é ignorado, sem quebrar a página', async () => {
    open('a=../../etc&b=bossa');
    expect(await screen.findByRole('heading', { level: 2, name: 'Bossa' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Escolher perfume' })).toBeVisible();
    expect(getBySlug).not.toHaveBeenCalledWith('../../etc');
  });

  describe('escolher e trocar', () => {
    it('escolher um perfume busca no catálogo e coloca o resultado na URL', async () => {
      const { router } = open('a=malbec-signature');
      fireEvent.click(await screen.findByRole('button', { name: 'Escolher perfume' }));
      const dialog = await screen.findByRole('dialog', { name: 'Escolher perfume' });
      expect(within(dialog).getByText(/Digite pelo menos 2 letras/)).toBeInTheDocument();
      fireEvent.change(within(dialog).getByRole('searchbox'), { target: { value: 'bo' } });
      const results = await within(dialog).findByRole('list', { name: 'Resultados' });
      fireEvent.click(within(results).getByRole('button', { name: /Bossa/ }));
      await waitFor(() => expect(router.state.location.search).toBe('?a=malbec-signature&b=bossa'));
      expect(await screen.findByRole('heading', { level: 2, name: 'Bossa' })).toBeVisible();
    });

    it('a busca não oferece o perfume que já está do outro lado', async () => {
      open('a=bossa');
      fireEvent.click(await screen.findByRole('button', { name: 'Escolher perfume' }));
      const dialog = await screen.findByRole('dialog', { name: 'Escolher perfume' });
      fireEvent.change(within(dialog).getByRole('searchbox'), { target: { value: 'bo' } });
      const results = await within(dialog).findByRole('list', { name: 'Resultados' });
      expect(within(results).queryByRole('button', { name: /Bossa/ })).not.toBeInTheDocument();
      expect(within(results).getByRole('button', { name: /Boêmia/ })).toBeVisible();
    });

    it('"Trocar" substitui só aquele lado', async () => {
      const { router } = open();
      fireEvent.click(await screen.findByRole('button', { name: 'Trocar o segundo perfume' }));
      const dialog = await screen.findByRole('dialog', { name: 'Escolher perfume' });
      fireEvent.change(within(dialog).getByRole('searchbox'), { target: { value: 'bo' } });
      const results = await within(dialog).findByRole('list', { name: 'Resultados' });
      fireEvent.click(within(results).getByRole('button', { name: /Boêmia/ }));
      await waitFor(() =>
        expect(router.state.location.search).toBe('?a=malbec-signature&b=boemia')
      );
    });

    it('busca sem resultado diz que não achou', async () => {
      search.mockResolvedValue({ items: [], total: 0 });
      open('');
      fireEvent.click(
        (await screen.findAllByRole('button', { name: 'Escolher perfume' }))[0] as HTMLElement
      );
      const dialog = await screen.findByRole('dialog', { name: 'Escolher perfume' });
      fireEvent.change(within(dialog).getByRole('searchbox'), { target: { value: 'zzzz' } });
      expect(
        await within(dialog).findByText(/Nenhum perfume encontrado para “zzzz”/)
      ).toBeVisible();
    });

    it('falha na busca mostra o erro com tentar de novo', async () => {
      search.mockRejectedValueOnce(new AppError('network'));
      open('');
      fireEvent.click(
        (await screen.findAllByRole('button', { name: 'Escolher perfume' }))[0] as HTMLElement
      );
      const dialog = await screen.findByRole('dialog', { name: 'Escolher perfume' });
      fireEvent.change(within(dialog).getByRole('searchbox'), { target: { value: 'bo' } });
      expect(await within(dialog).findByText('Não foi possível buscar')).toBeVisible();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Tentar novamente' }));
      expect(await within(dialog).findByRole('list', { name: 'Resultados' })).toBeVisible();
    });
  });
});
